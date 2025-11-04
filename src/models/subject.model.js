import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true }, // e.g., CS501
    name: { type: String, required: true }, // e.g., Operating Systems
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    semester: { type: Number, required: true },
});

export default mongoose.model("Subject", subjectSchema);
