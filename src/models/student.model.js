import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
    roll_no: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    gender: String,
    dob: Date,
    parentName: String,
    contact: String,
    email: String,
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    batch: { type: Number, required: true }, // e.g., 2023
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
});

// 🔹 Virtual field to calculate semester dynamically
studentSchema.virtual("semester").get(function () {
    const currentYear = new Date().getFullYear();
    const yearsPassed = currentYear - this.batch;
    // Each year has 2 semesters
    const semester = yearsPassed * 2 + 1; // e.g., 2023 batch in 2025 → sem 5
    return semester > 6 ? 6 : semester; // cap at 6 semesters (3-year UG)
});

export default mongoose.model("Student", studentSchema);
