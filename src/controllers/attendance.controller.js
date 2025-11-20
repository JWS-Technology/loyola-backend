// controllers/attendance.controller.js
import Timetable from "../models/timetable.model.js";
import Student from "../models/student.model.js";
import Attendance from "../models/attendance.model.js";
import Course from "../models/course.model.js";
import User from "../models/auth.model.js"; // Import this to ensure Auth model is registered
import mongoose from "mongoose";
const getDayFromDate = (input) => {
    if (!input) return { name: new Date().toLocaleDateString("en-US", { weekday: "long" }), mapped: null };
    let dayName = /^\d{4}-\d{2}-\d{2}$/.test(input)
        ? new Date(input).toLocaleDateString("en-US", { weekday: "long" })
        : input;

    const map = { monday: "Day 1", tuesday: "Day 2", wednesday: "Day 3", thursday: "Day 4", friday: "Day 5", saturday: "Day 6", sunday: "Day 7" };
    return { name: dayName, mapped: map[dayName.toLowerCase()] };
};
/** helper to normalise day names */
const normalizeDay = (d) => {
    if (!d) return d;
    const s = String(d).trim();
    if (!s) return s;
    const lower = s.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
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
            // ❌ OLD ERROR CODE: 
            // const day = getDayFromDate(qDay || date); 
            // const tt = await Timetable.findOne({ day, period, staffId });

            // ✅ FIXED CODE:
            // 1. Get the day object info
            const dayInfo = getDayFromDate(qDay || date);

            // 2. Extract the correct String. 
            // If your Timetable uses "Day 1", "Day 2", use .mapped
            // If it uses "Monday", "Tuesday", use .name
            // We try .mapped first (e.g., "Day 4"), fallback to .name (e.g., "Thursday")
            const dayString = dayInfo.mapped || dayInfo.name;

            console.log("Looking up timetable for", { day: dayString, period, staffId });

            // 3. Pass the STRING to mongoose
            const tt = await Timetable.findOne({ day: dayString, period, staffId });

            if (!tt) {
                console.warn("Timetable not found for", { day: dayString, period, staffId });
                return res.status(404).json({
                    message: "No timetable entry found for this staff/slot",
                    queried: { day: dayString, period, staffId },
                });
            }

            courseId = tt.courseId;
            semester = tt.semester;
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
        // ✅ CRITICAL FIX: Strictly get ID from the logged-in token
        const staffId = req.user?.userId;

        // If middleware failed or token is missing
        if (!staffId) {
            return res.status(401).json({ message: "Unauthorized: You must be logged in to mark attendance." });
        }

        const {
            date,
            period,
            courseId,
            subjectId,
            records,
        } = req.body;

        if (!date || period == null || !courseId || !subjectId) {
            return res.status(400).json({
                message: "Required fields: date, period, courseId, subjectId",
            });
        }

        // Check for duplicates
        const existing = await Attendance.findOne({
            date,
            period,
            courseId,
            subjectId,
        });
        if (existing) {
            return res.status(400).json({ message: "Attendance already marked for this period" });
        }

        // Normalize records
        const normalizedRecords = (records || []).map((r) => {
            return {
                studentId: r.studentId,
                rollNo: r.rollNo || r.roll_no || r.rollNo || "",
                status: r.status || "present",
                markedAt: r.markedAt ? new Date(r.markedAt) : new Date(),
            };
        });

        if (!normalizedRecords || normalizedRecords.length === 0) {
            return res.status(400).json({ message: "No student records provided" });
        }

        // ✅ Create Attendance with correct staffId
        const attendance = new Attendance({
            date,
            period,
            courseId,
            subjectId,
            staffId, // <--- This now guarantees the ID is saved
            records: normalizedRecords,
            createdAt: new Date(),
        });

        await attendance.save();

        return res.status(201).json({ message: "Attendance marked successfully", attendance });
    } catch (error) {
        console.error("❌ Error marking attendance:", error);
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
        console.log("req came", req.user)
        // 1. Added courseId and staffId to destructured query
        const { date, subjectId, studentId, courseId, staffId } = req.query;
        const query = {};

        // SECURITY CHECK:
        // If the user is a student, they can ONLY see their own attendance.
        if (req.user && req.user.userType === 'student') {
            query["records.studentId"] = new mongoose.Types.ObjectId(req.user.userId);

        }
        // IF ADMIN OR STAFF (Not Student):
        else {
            // If they want to see a specific student's history
            if (studentId) {
                query["records.studentId"] = new mongoose.Types.ObjectId(studentId);
            }

            // If Admin wants to see who posted the attendance (Filter by Staff)
            if (staffId) query.staffId = new mongoose.Types.ObjectId(staffId);
        }

        // COMMON FILTERS (Apply to everyone)
        if (date) query.date = date;
        if (subjectId) query.subjectId = subjectId;

        // Added Course Filter (Crucial for Admin to filter by Class)
        if (courseId) query.courseId = courseId;

        const data = await Attendance.find(query)
            // 2. Improved Populate: Split them up to get specific fields for Staff vs Students
            .populate("staffId", "name email") // See WHO posted it (name and email)
            .populate("subjectId", "name code")
            .populate("courseId", "name")
            .populate("records.studentId", "name rollNo first_name")
            .sort({ date: -1, period: 1 }); // Sort by latest date

        // 3. Student Sanitization (unchanged)
        // If it's a student, clean up response to hide other students' data
        if (req.user && req.user.userType === 'student') {
            const sanitizedData = data.map(doc => {
                // Safe check: ensure records exists and studentId is populated
                const myRecord = doc.records.find(r =>
                    r.studentId && r.studentId._id.toString() === req.user.userId.toString()
                );
                return {
                    ...doc.toObject(),
                    records: myRecord ? [myRecord] : []
                };
            });
            return res.json(sanitizedData);
        }

        // IF ADMIN: Send every data (Full records, Staff info, Course info)
        res.json(data);
        // console.log(JSON.stringify(data))
    } catch (error) {
        console.error("❌ Error fetching attendance:", error);
        res.status(500).json({ message: "Server error", error });
    }
};


// ---------------------- GET STUDENT ATTENDANCE SUMMARY ----------------------
// =====================================================================================
// 2. STUDENT SUMMARY
// =====================================================================================
export const getStudentAttendanceSummary = async (req, res) => {
    try {
        // Logic: If logged in user is student, use their ID. 
        // If admin/staff, allow them to pass ?studentId=XYZ
        let targetStudentId = req.query.studentId;

        if (req.user && req.user.userType === 'student') {
            targetStudentId = req.user.userId;
        }

        if (!targetStudentId) {
            return res.status(400).json({ message: "Student ID required" });
        }

        const docs = await Attendance.find({
            "records.studentId": targetStudentId,
        }).populate("subjectId", "name code");

        const stats = {};

        docs.forEach((a) => {
            const sid = a.subjectId?._id?.toString();
            if (!sid) return;

            if (!stats[sid]) {
                stats[sid] = {
                    subjectId: sid,
                    subjectName: a.subjectId?.name || "Unknown",
                    subjectCode: a.subjectId?.code || "",
                    totalClasses: 0,
                    attendedClasses: 0,
                };
            }

            const rec = a.records.find((r) => r.studentId.toString() === targetStudentId.toString());
            if (!rec) return;

            stats[sid].totalClasses++;
            if (["present", "late", "on-duty"].includes(rec.status)) {
                stats[sid].attendedClasses++;
            }
        });

        const result = Object.values(stats);
        res.json({ attendance: result });
    } catch (err) {
        console.error("Error(getStudentAttendanceSummary):", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

/**
 * GET /attendance/:id
 * Get a single attendance record by ID
 */
export const getAttendanceById = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Fetch and Populate
        const attendance = await Attendance.findById(id)
            .populate("staffId", "name email")
            .populate("subjectId", "name code")
            .populate("courseId", "name")
            // Populate the student details inside the records array
            .populate({
                path: "records.studentId",
                select: "name roll_no" // Fetch name from Student model
            })
            .lean(); // Converts to plain object so we can modify it easily

        if (!attendance) {
            return res.status(404).json({ message: "Attendance record not found" });
        }

        // 2. Transform the records to flatten the structure
        // This pulls 'name' out of the nested object and puts it at the top level
        attendance.records = attendance.records.map((record) => {
            // Check if studentId exists (in case a student was deleted)
            const studentDetails = record.studentId || {};

            return {
                _id: record._id,
                status: record.status,
                markedAt: record.markedAt,
                rollNo: record.rollNo, // The rollNo stored in the attendance record

                // ✅ EXTRACTING NAME HERE
                studentName: studentDetails.name || "Unknown",

                // Optional: Keep the ID or the full object if you still need it
                studentId: studentDetails._id || null
            };
        });

        console.log(attendance.records); // You will now see the names clearly in console
        res.json(attendance);

    } catch (error) {
        console.error("Error fetching attendance:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};