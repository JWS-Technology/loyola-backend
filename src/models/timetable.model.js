import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema({
    day: {
        type: String,
        required: true, // e.g., "Monday"
    },
    period: {
        type: Number,
        required: true, // 1 - 6
    },
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
        required: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true,
    },
    semester: {
        type: Number,
        required: true,
    },
});

export default mongoose.model("Timetable", timetableSchema);
