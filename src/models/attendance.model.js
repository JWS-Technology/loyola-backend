// models/attendance.model.js
import mongoose from "mongoose";

const updateLogSchema = new mongoose.Schema({
    rollNo: { type: String, required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    from: { type: String, enum: ["present", "absent"], required: true },
    to: { type: String, enum: ["present", "absent"], required: true },
    reason: { type: String },
    // ✅ FIXED: Changed "User" to "Auth" to match your Auth model
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Auth" },
    changedAt: { type: Date, default: Date.now },
});

const recordSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    rollNo: { type: String, required: true },
    status: {
        type: String,
        enum: ["present", "absent", "late", "on-duty"],
        default: "present",
    },
    markedAt: { type: Date, default: Date.now },
});

const attendanceSchema = new mongoose.Schema({
    // Use string YYYY-MM-DD for easier uniqueness checks across timezone issues
    date: { type: String, required: true },
    period: { type: Number, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },

    // ✅ FIXED: Changed "User" to "Auth" to match your Auth model
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },

    // per-student records
    records: [recordSchema],

    // logs of updates (present->absent, absent->present via HOD)
    updates: [updateLogSchema],

    // whether attendance is locked for the period (auto-lock or manual)
    locked: { type: Boolean, default: false },
    lockedAt: { type: Date },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Unique index to prevent duplicates for same course/subject/period/date
attendanceSchema.index({ date: 1, period: 1, courseId: 1, subjectId: 1 }, { unique: true });

attendanceSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model("Attendance", attendanceSchema);