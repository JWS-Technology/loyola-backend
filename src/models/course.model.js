import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., B.Sc Computer Science
    code: { type: String, required: true, unique: true }, // e.g., BSC-CS
    department: String, // e.g., Computer Science
    duration: { type: Number, default: 3 }, // in years
    // subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
});

export default mongoose.model("Course", courseSchema);
