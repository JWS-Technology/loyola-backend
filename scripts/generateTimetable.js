// generateTimetable.js
// Usage: node generateTimetable.js
import dotenv from "dotenv";
dotenv.config();  // <-- add this right after imports

import mongoose from "mongoose";
import Staff from "../src/models/staff.model.js";
import Subject from "../src/models/subject.model.js";
import Timetable from "../src/models/timetable.model.js";
import Course from "../src/models/course.model.js";

// CONFIG
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS_PER_DAY = 6;

// Utility: sleep / random
const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

function slotId(day, period) { return `${day}_${period}`; }

// Load data and generate slots
async function generate() {
    // 1) Fetch DB data
    const staffs = await Staff.find().lean();
    const subjects = await Subject.find().lean();
    const courses = await Course ? await Course.find().lean() : [];

    // 2) Build subject requirements: each subject needs weeklyHours periods
    // Ensure subjects have weeklyHours (default 4)
    const subjectReqs = subjects.map(s => ({
        ...s,
        weeklyHours: s.weeklyHours || 4,   // default if not present
        remaining: s.weeklyHours || 4
    }));

    // 3) Build all slots
    const slots = [];
    for (const day of DAYS) {
        for (let p = 1; p <= PERIODS_PER_DAY; p++) {
            slots.push({ day, period: p, id: slotId(day, p), assigned: null });
        }
    }

    // 4) Pre-fill existing fixed Timetable entries (if you preassigned HOD hours etc.)
    const existing = await Timetable.find().lean();
    const slotMap = new Map(slots.map(s => [s.id, { ...s }]));
    for (const e of existing) {
        const id = slotId(e.day, e.period);
        if (slotMap.has(id)) {
            slotMap.get(id).assigned = e;
        }
    }

    // 5) Helper functions
    const staffById = new Map(staffs.map(s => [String(s._id), s]));
    const subjectById = new Map(subjectReqs.map(s => [String(s._id), s]));

    function staffAvailableAt(staff, day, period) {
        if (!staff) return false;
        if (staff.unavailable) {
            for (const u of staff.unavailable) {
                if (u.day === day && u.period === period) return false;
            }
        }
        // check existing assignments in slotMap for this staff
        for (const v of slotMap.values()) {
            if (v.assigned && String(v.assigned.staffId) === String(staff._id) && v.day === day && v.period === period) {
                return false;
            }
        }
        return true;
    }

    function courseHasAt(courseId, semester, day, period) {
        // check slotMap assignments to ensure same course+semester not duplicated
        for (const v of slotMap.values()) {
            if (!v.assigned) continue;
            if (String(v.assigned.courseId) === String(courseId) && v.assigned.semester === semester &&
                v.day === day && v.period === period) {
                return true;
            }
        }
        return false;
    }

    // 6) Build assignment order: schedule subjects with largest weeklyHours first
    subjectReqs.sort((a, b) => b.weeklyHours - a.weeklyHours);

    // 7) For each subject, assign 'weeklyHours' slots
    for (const subj of subjectReqs) {
        let needed = subj.remaining;
        // Build preferred staff list: staffs who have this subject in subjectsHandled
        let capableStaffs = staffs.filter(s => (s.subjectsHandled || []).some(id => String(id) === String(subj._id)));
        if (capableStaffs.length === 0) {
            // fallback: staff from same department
            capableStaffs = staffs.filter(s => s.department === subj.department);
        }
        capableStaffs = shuffle(capableStaffs);

        // For fair spread, try to place subject across different days first
        const daysOrder = shuffle([...DAYS]); // randomize to avoid same patterns across runs

        // Fill slots greedily
        for (const day of daysOrder) {
            for (let p = 1; p <= PERIODS_PER_DAY && needed > 0; p++) {
                const id = slotId(day, p);
                const slot = slotMap.get(id);
                if (!slot) continue;
                if (slot.assigned) continue; // occupied
                // avoid duplicate subject in same day more than 2 times (soft constraint)
                const countSameSubjectToday = Array.from(slotMap.values()).filter(s => s.assigned && String(s.assigned.subjectId) === String(subj._id) && s.day === day).length;
                if (countSameSubjectToday >= 2) continue;

                // find a capable staff available at this slot and not already teaching this course at same time
                let assigned = false;
                for (const st of capableStaffs) {
                    if (!staffAvailableAt(st, day, p)) continue;
                    if (courseHasAt(subj.courseId, subj.semester, day, p)) continue;
                    // all good -> assign
                    const newEntry = {
                        day, period: p,
                        staffId: st._id,
                        courseId: subj.courseId,
                        subjectId: subj._id,
                        semester: subj.semester
                    };
                    slot.assigned = newEntry;
                    needed--;
                    assigned = true;
                    break;
                }
                if (!assigned) continue;
            }
            if (needed <= 0) break;
        }

        // If still remaining, do a second pass scanning all slots
        if (needed > 0) {
            for (const slot of slotMap.values()) {
                if (slot.assigned) continue;
                for (const st of capableStaffs) {
                    if (!staffAvailableAt(st, slot.day, slot.period)) continue;
                    if (courseHasAt(subj.courseId, subj.semester, slot.day, slot.period)) continue;
                    slot.assigned = {
                        day: slot.day, period: slot.period,
                        staffId: st._id, courseId: subj.courseId, subjectId: subj._id, semester: subj.semester
                    };
                    needed--;
                    break;
                }
                if (needed <= 0) break;
            }
        }

        if (needed > 0) {
            console.warn(`Could not fully schedule subject ${subj.name} (${subj._id}). Remaining slots: ${needed}`);
        }
    }

    // 8) Save assignments to DB (replace auto-generated ones or create new)
    const ops = [];
    for (const s of slotMap.values()) {
        if (!s.assigned) continue;
        // If existing was present and matches, skip
        // else upsert: find by day+period+course+semester and update
        const q = {
            day: s.day, period: s.period,
            courseId: s.assigned.courseId,
            semester: s.assigned.semester
        };
        const doc = {
            ...s.assigned
        };
        ops.push({
            updateOne: {
                filter: q,
                update: { $set: doc },
                upsert: true
            }
        });
    }

    if (ops.length) {
        const res = await Timetable.bulkWrite(ops);
        console.log("Timetable generation complete:", res);
    } else {
        console.log("No assignments to save.");
    }
}

(async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/yourdb");
        await generate();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
