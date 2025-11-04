import Subject from "../models/subject.model.js";
import Course from "../models/course.model.js";

// ✅ Create a new subject
export const createSubject = async (req, res) => {
    try {
        const { code, name, semester, courseId } = req.body;

        // Validation
        if (!code || !name || !semester || !courseId) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }

        // Prevent duplicate subject code
        const existingSubject = await Subject.findOne({ code });
        if (existingSubject) {
            return res.status(400).json({ message: "Subject code already exists." });
        }

        // Create new subject
        const subject = new Subject({
            code,
            name,
            semester,
            courseId,
        });

        await subject.save();

        res.status(201).json({
            message: "✅ Subject created successfully",
            subject,
        });
    } catch (error) {
        console.error("Error creating subject:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ✅ Get all subjects (with course name populated)
export const getAllSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find().populate("courseId", "name code department");
        res.status(200).json(subjects);
    } catch (error) {
        console.error("Error fetching subjects:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
