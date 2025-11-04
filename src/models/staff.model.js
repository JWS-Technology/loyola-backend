import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
    staffId: { type: String, required: true, unique: true }, // e.g., CS123
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    department: String,
    designation: String, // e.g., Assistant Professor
    subjectsHandled: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }], // multiple subjects
    courseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }], // optional
    joinedYear: Number,
    status: { type: String, default: "active" },
});

export default mongoose.model("Staff", staffSchema);
