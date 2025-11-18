// controllers/attendance.controller.js
import Timetable from "../models/timetable.model.js";
import Student from "../models/student.model.js";
import Attendance from "../models/attendance.model.js";
import Course from "../models/course.model.js";
import Subject from "../models/subject.model.js";

/** helper to normalise day names */
const normalizeDay = (d) => {
    if (!d) return d;
    const s = String(d).trim();
    if (!s) return s;
    const lower = s.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const getDayFromDate = (dateInput) => {
    let dayName = "";

    // If input is a date string (YYYY-MM-DD), get the weekday name
    if (dateInput && dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const dateObj = new Date(dateInput);
        dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
    } else if (dateInput) {
        // If input is already a day name (e.g. "Monday")
        dayName = dateInput;
    } else {
        // Default to today
        dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
    }

    const map = {
        "monday": "Day 1",
        "tuesday": "Day 2",
        "wednesday": "Day 3",
        "thursday": "Day 4",
        "friday": "Day 5",
        "saturday": "Day 6",
        "sunday": "Day 7"
    };

    return map[dayName.toLowerCase()] || dayName;
};

// ---------------------- GET STUDENTS FOR ATTENDANCE ----------------------
export const getStudentsForAttendance = async (req, res) => {
    try {
        console.log("req came", { query: req.query, userid: req.user?.userId });
        const {
            staffId: qStaffId,
            day: qDay,
            period: qPeriod,
            courseId: qCourseId,
            subjectId: qSubjectId,
            semester: qSemester,
            date,
        } = req.query;

        const staffId = req.user?.userId ?? qStaffId;

        // convert period to number if present
        const period = qPeriod != null && String(qPeriod).trim() !== "" ? Number(qPeriod) : undefined;

        // We need either explicit courseId+semester OR staffId+period
        if (!qCourseId && (!staffId || period == null || Number.isNaN(period))) {
            return res.status(400).json({
                message: "Provide courseId+semester OR staffId+period (or authenticate). Ensure 'period' is a number.",
            });
        }

        // ---------------------
        // Resolve courseId & semester first
        // ---------------------
        let courseId = qCourseId;
        let semester = qSemester ? Number(qSemester) : undefined;
        let subjectId = qSubjectId;

        if (!courseId) {
            // ✅ FIX: Use the date from query to determine "Day X"
            const day = getDayFromDate(qDay || date);

            console.log("Looking up timetable for", { day, period, staffId });

            const tt = await Timetable.findOne({ day, period, staffId });
            if (!tt) {
                console.warn("Timetable not found for", { day, period, staffId });
                return res.status(404).json({
                    message: "No timetable entry found for this staff/slot",
                    queried: { day, period, staffId },
                });
            }

            courseId = tt.courseId;
            semester = tt.semester;
            // Check both field names to be safe
            subjectId = tt.subjectId || tt.subject;
        }

        if (!courseId || semester == null) {
            return res.status(400).json({
                message: "Unable to determine courseId/semester for this session.",
            });
        }

        // ---------------------
        // Resolve courseName once
        // ---------------------
        let courseName = null;
        try {
            const courseDoc = await Course.findById(courseId).lean();
            courseName = courseDoc?.name ?? null;
        } catch (e) {
            courseName = null;
        }

        // Optional duplicate check (only if date provided)
        if (date && period != null) {
            const existingAttendance = await Attendance.findOne({
                date,
                period,
                courseId,
            });
            if (existingAttendance) {
                return res.status(400).json({
                    message: "Attendance already marked for this course/period/date",
                });
            }
        }

        // ---------------------
        // Robust student lookup
        // ---------------------
        let students = [];

        // 1. Get all students in the course
        const allStudents = await Student.find({ courseId })
            .select("_id name first_name roll_no batch course")
            .sort({ roll_no: 1 });

        // 2. Filter in memory using the Virtual 'semester' field
        // (Since 'semester' is virtual, we can't easily query it directly in MongoDB)
        if (semester) {
            students = allStudents.filter(s => s.semester === Number(semester));
        } else {
            students = allStudents;
        }

        // 3. Fallback: If filtering returned 0 (or semester wasn't provided), try finding by raw batch
        if (students.length === 0 && semester) {
            // Approximate batch calculation: 
            // Sem 5/6 = Batch 2023, Sem 3/4 = Batch 2024, Sem 1/2 = Batch 2025
            // (Assuming current academic year is 2025-2026)
            const currentYear = new Date().getFullYear();
            const targetBatch = currentYear - Math.ceil(semester / 2) + 1; // Adjust logic as needed

            // Optional: strictly query by batch if virtual field isn't working
            // students = await Student.find({ courseId, batch: targetBatch })...

            // For now, just revert to all students if filter fails, so you see something
            if (students.length === 0) students = allStudents;
        }


        const targetBatch = 2026 - Math.ceil(Number(semester) / 2);

        students = await Student.find({
            courseId,
            batch: targetBatch
        })
            .select("_id name first_name roll_no semester course")
            .sort({ roll_no: 1 })
            .lean();
        console.log("student lookup result count:", students.length);
        console.log("Subject ID:", subjectId);

        if (!students || students.length === 0) {
            return res.status(200).json({
                courseId,
                subjectId,
                courseName,
                semester,
                count: 0,
                students: [],
                message: "No students found."
            });
        }

        // Prepare students with minimal normalized fields
        const normalized = students.map((s) => ({
            _id: s._id,
            name: s.name || s.first_name || "",
            rollNo: s.roll_no || s.rollNo || "",
            semester: s.semester,
            course: s.course || courseName || "",
        }));

        // Return students (include subjectId!)
        return res.status(200).json({
            courseId,
            subjectId, // ✅ Sending subjectId to frontend
            courseName,
            semester,
            count: normalized.length,
            students: normalized,
        });
    } catch (err) {
        console.error("Error in getStudentsForAttendance:", err);
        return res.status(500).json({ message: "Server error", error: err.message ?? err });
    }
};
// ---------------------- MARK ATTENDANCE ----------------------
export const markAttendance = async (req, res) => {
    try {
        // prefer authenticated user
        const actorId = req.user?.userId;
        const {
            date,
            period,
            courseId,
            subjectId,
            staffId: bodyStaffId,
            records,
        } = req.body;

        // basic validation
        if (!date || period == null || !courseId || !subjectId) {
            return res.status(400).json({
                message: "Required fields: date, period, courseId, subjectId",
            });
        }

        // staff who is marking
        const staffId = actorId ?? bodyStaffId;
        if (!staffId) {
            return res.status(401).json({ message: "staffId required (or authenticate)" });
        }

        // Prevent duplicate attendance for same date/period/course/subject
        const existing = await Attendance.findOne({
            date,
            period,
            courseId,
            subjectId,
        });
        if (existing) {
            return res
                .status(400)
                .json({ message: "Attendance already marked for this period" });
        }

        // Normalize records: ensure each record has studentId, rollNo, and default status present
        const normalizedRecords = (records || []).map((r) => {
            return {
                studentId: r.studentId,
                rollNo: r.rollNo || r.roll_no || r.rollNo || "",
                status: r.status || "present",
                markedAt: r.markedAt ? new Date(r.markedAt) : new Date(),
            };
        });

        // If no records provided, refuse — UI should supply student list
        if (!normalizedRecords || normalizedRecords.length === 0) {
            return res.status(400).json({ message: "No student records provided" });
        }

        const attendance = new Attendance({
            date,
            period,
            courseId,
            subjectId,
            staffId,
            records: normalizedRecords,
            createdAt: new Date(),
        });

        await attendance.save();
        return res
            .status(201)
            .json({ message: "Attendance marked successfully", attendance });
    } catch (error) {
        console.error("❌ Error marking attendance:", error);
        // handle unique index duplicate error specifically
        if (error?.code === 11000) {
            return res.status(400).json({ message: "Duplicate attendance entry." });
        }
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ---------------------- UPDATE ATTENDANCE (staff present->absent only) ----------------------
export const updateAttendance = async (req, res) => {
    try {
        const actorId = req.user?.userId;
        const { attendanceId } = req.params;
        const { studentId, rollNo, action } = req.body;
        // action expected: "presentToAbsent"
        if (!attendanceId || !studentId && !rollNo) {
            return res.status(400).json({ message: "attendanceId and studentId or rollNo required" });
        }
        if (!action) {
            return res.status(400).json({ message: "Action required (presentToAbsent)" });
        }

        const attendance = await Attendance.findById(attendanceId);
        if (!attendance) return res.status(404).json({ message: "Attendance not found" });

        if (attendance.locked) {
            return res.status(403).json({ message: "Attendance is locked and cannot be changed" });
        }

        // find record
        const recIndex = attendance.records.findIndex((r) =>
            studentId ? String(r.studentId) === String(studentId) : r.rollNo === rollNo
        );
        if (recIndex === -1) {
            return res.status(404).json({ message: "Student record not found in this attendance" });
        }

        const currentStatus = attendance.records[recIndex].status;

        // Only allow present -> absent by staff
        if (action === "presentToAbsent") {
            if (currentStatus !== "present" && currentStatus !== "late" && currentStatus !== "on-duty") {
                return res.status(400).json({ message: `Cannot change status from ${currentStatus} to absent` });
            }

            // perform change
            attendance.records[recIndex].status = "absent";
            attendance.records[recIndex].markedAt = new Date();

            attendance.updates.push({
                rollNo: attendance.records[recIndex].rollNo,
                studentId: attendance.records[recIndex].studentId,
                from: currentStatus,
                to: "absent",
                changedBy: actorId,
                changedAt: new Date(),
            });

            await attendance.save();
            return res.json({ message: "Updated: present -> absent", attendance });
        }

        // other actions forbidden for staff
        return res.status(403).json({ message: "Unsupported action or insufficient permissions" });
    } catch (error) {
        console.error("❌ Error updating attendance:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ---------------------- HOD/AD/ADMIN: CORRECT ATTENDANCE (absent->present) ----------------------
export const correctAttendance = async (req, res) => {
    try {
        const actor = req.user;
        if (!actor || !actor.userType) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const allowedRoles = ["hod", "ad", "admin"];
        if (!allowedRoles.includes(actor.userType)) {
            return res.status(403).json({ message: "Only HOD/AD/Admin can perform corrections" });
        }

        const { attendanceId } = req.params;
        const { studentId, rollNo, reason } = req.body;
        if (!attendanceId || (!studentId && !rollNo)) {
            return res.status(400).json({ message: "attendanceId and studentId or rollNo required" });
        }

        const attendance = await Attendance.findById(attendanceId);
        if (!attendance) return res.status(404).json({ message: "Attendance not found" });

        // find record
        const recIndex = attendance.records.findIndex((r) =>
            studentId ? String(r.studentId) === String(studentId) : r.rollNo === rollNo
        );
        if (recIndex === -1) {
            return res.status(404).json({ message: "Student record not found in this attendance" });
        }

        const currentStatus = attendance.records[recIndex].status;
        if (currentStatus === "present") {
            return res.status(400).json({ message: "Record is already present" });
        }

        // change absent -> present (HOD only)
        attendance.records[recIndex].status = "present";
        attendance.records[recIndex].markedAt = new Date();

        attendance.updates.push({
            rollNo: attendance.records[recIndex].rollNo,
            studentId: attendance.records[recIndex].studentId,
            from: currentStatus,
            to: "present",
            reason: reason || "Correction by HOD/AD/Admin",
            changedBy: actor.userId,
            changedAt: new Date(),
        });

        await attendance.save();
        return res.json({ message: "Correction applied: absent -> present", attendance });
    } catch (error) {
        console.error("❌ Error correcting attendance:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ---------------------- GET ATTENDANCE ----------------------
export const getAttendance = async (req, res) => {
    try {
        const { date, subjectId, studentId } = req.query;
        const query = {};

        if (date) query.date = date;
        if (subjectId) query.subjectId = subjectId;
        if (studentId) query["records.studentId"] = studentId;

        const data = await Attendance.find(query)
            .populate("subjectId courseId staffId records.studentId", "name rollNo first_name");

        res.json(data);
    } catch (error) {
        console.error("❌ Error fetching attendance:", error);
        res.status(500).json({ message: "Server error", error });
    }
};


// ---------------------- GET STUDENT ATTENDANCE SUMMARY ----------------------
export const getStudentAttendanceSummary = async (req, res) => {
    try {
        // 1. Get the logged-in student's ID
        const studentId = req.user.userId; // Assuming middleware sets req.user

        if (!studentId) {
            return res.status(400).json({ message: "Student ID not found in token" });
        }

        // 2. Find all attendance documents where this student exists in the records
        // We select specific fields to optimize the query
        const attendanceDocs = await Attendance.find({
            "records.studentId": studentId
        })
            .populate("subjectId", "name code") // Get Subject Name & Code
            .lean(); // Convert to plain JS objects for speed

        if (!attendanceDocs || attendanceDocs.length === 0) {
            return res.status(200).json({ attendance: [] });
        }

        // 3. Calculate statistics per subject
        const subjectStats = {};

        attendanceDocs.forEach((doc) => {
            const subjectId = doc.subjectId?._id?.toString();
            if (!subjectId) return;

            // Initialize subject stats if not exists
            if (!subjectStats[subjectId]) {
                subjectStats[subjectId] = {
                    subjectId: subjectId,
                    subjectName: doc.subjectId?.name || "Unknown Subject",
                    subjectCode: doc.subjectId?.code || "",
                    totalClasses: 0,
                    attendedClasses: 0,
                };
            }

            // Find the specific record for this student in the document
            const studentRecord = doc.records.find(
                (r) => r.studentId.toString() === studentId
            );

            if (studentRecord) {
                subjectStats[subjectId].totalClasses += 1;
                // Count as present if status is present, late, or on-duty
                if (["present", "late", "on-duty"].includes(studentRecord.status)) {
                    subjectStats[subjectId].attendedClasses += 1;
                }
            }
        });

        // 4. Format the result for the frontend
        const summary = Object.values(subjectStats).map((stat) => ({
            ...stat,
            percentage: stat.totalClasses > 0
                ? (stat.attendedClasses / stat.totalClasses) * 100
                : 0
        }));

        res.status(200).json({ attendance: summary });

    } catch (error) {
        console.error("Error fetching student attendance summary:", error);
        res.status(500).json({ message: "Server error processing attendance" });
    }
};