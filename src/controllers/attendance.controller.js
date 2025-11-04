import Attendance from "../models/attendance.model.js";

// ✅ Mark Attendance
export const markAttendance = async (req, res) => {
    try {
        const { date, period, courseId, subjectId, staffId, records } = req.body;

        // Check if attendance already exists
        const existing = await Attendance.findOne({ date, period, subjectId });
        if (existing) {
            return res.status(400).json({ message: "Attendance already marked for this period" });
        }

        const attendance = new Attendance({
            date,
            period,
            courseId,
            subjectId,
            staffId,
            records,
        });

        await attendance.save();
        res.status(201).json({ message: "Attendance marked successfully", attendance });
    } catch (error) {
        console.error("❌ Error marking attendance:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ Update Attendance
export const updateAttendance = async (req, res) => {
    try {
        const { attendanceId } = req.params;
        const { records } = req.body;

        const attendance = await Attendance.findByIdAndUpdate(
            attendanceId,
            { records, updatedAt: Date.now() },
            { new: true }
        );

        if (!attendance) return res.status(404).json({ message: "Attendance not found" });

        res.json({ message: "Attendance updated successfully", attendance });
    } catch (error) {
        console.error("❌ Error updating attendance:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ Get Attendance (Daily or by Filters)
export const getAttendance = async (req, res) => {
    try {
        const { date, subjectId, studentId } = req.query;
        const query = {};

        if (date) query.date = date;
        if (subjectId) query.subjectId = subjectId;
        if (studentId) query["records.studentId"] = studentId;

        const data = await Attendance.find(query)
            .populate("subjectId courseId staffId records.studentId", "name rollNo");

        res.json(data);
    } catch (error) {
        console.error("❌ Error fetching attendance:", error);
        res.status(500).json({ message: "Server error", error });
    }
};
