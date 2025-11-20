import Course from "../models/course.model.js";

// ✅ Create new course
export const createCourse = async (req, res) => {
    try {
        const { name, code, department, duration } = req.body;

        // Basic validation
        if (!name || !code) {
            return res.status(400).json({ message: "Name and code are required." });
        }

        // Prevent duplicate course code
        const existingCourse = await Course.findOne({ code });
        if (existingCourse) {
            return res.status(400).json({ message: "Course code already exists." });
        }

        // Create and save new course
        const course = new Course({
            name,
            code,
            department,
            duration,
        });

        await course.save();

        res.status(201).json({
            message: "Course created successfully ✅",
            course,
        });
    } catch (error) {
        console.error("Error creating course:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
// ✅ Get all courses
export const getAllCourses = async (req, res) => {
    try {
        // Fetch just name and code to keep it light
        const courses = await Course.find({}, "name code type").sort({ name: 1 });
        res.json(courses);
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ message: "Server error fetching courses" });
    }
};

// ✅ Get single course by ID
export const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: "Course not found" });
        res.status(200).json(course);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Update a course
export const updateCourse = async (req, res) => {
    try {
        const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: "Course not found" });
        res.status(200).json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ✅ Delete a course
export const deleteCourse = async (req, res) => {
    try {
        const deleted = await Course.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Course not found" });
        res.status(200).json({ message: "Course deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
