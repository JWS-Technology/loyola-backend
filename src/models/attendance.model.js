import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    date: { type: Date, required: true }, // e.g., 2025-11-03
    period: { type: Number, required: true }, // 1–6
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },

    // Store attendance for each student for that period
    records: [
        {
            studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
            status: {
                type: String,
                enum: ["present", "absent", "late", "on-duty"],
                default: "present",
            },
            markedAt: { type: Date, default: Date.now },
        },
    ],

    markedTime: { type: Date, default: Date.now }, // when attendance was marked
    updatedAt: { type: Date, default: Date.now },
});

attendanceSchema.index({ date: 1, period: 1, subjectId: 1 }, { unique: true });
// Prevent duplicate attendance entries for same subject & period

export default mongoose.model("Attendance", attendanceSchema);
