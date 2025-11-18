import Timetable from "../models/timetable.model.js";
import Course from "../models/course.model.js";
import Student from "../models/student.model.js";
import { getCurrentPeriod } from "../utils/periodUtils.js";

// ✅ Create a new timetable entry
export const createTimetable = async (req, res) => {
    try {
        const { day, period, staffId, courseId, subjectId, semester } = req.body;

        if (!day || !period || !staffId || !courseId || !subjectId || !semester) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Prevent duplicate same-day, same-period entry for same staff
        const existing = await Timetable.findOne({ day, period, staffId });
        if (existing) {
            return res.status(400).json({
                message: "Timetable already exists for this staff in the given slot.",
            });
        }

        const newTimetable = new Timetable({
            day,
            period,
            staffId,
            courseId,
            subjectId,
            semester,
        });

        await newTimetable.save();
        res.status(201).json({
            message: "✅ Timetable entry created successfully",
            timetable: newTimetable,
        });
    } catch (error) {
        console.error("❌ Error creating timetable:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ✅ Get all timetable entries
export const getAllTimetables = async (req, res) => {
    try {
        const timetables = await Timetable.find()
            .populate("staffId", "name email")
            .populate("courseId", "name code")
            .populate("subjectId", "name code");
        res.status(200).json(timetables);
    } catch (error) {
        console.error("❌ Error fetching timetables:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ✅ Get timetable for specific staff
export const getTimetableByStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        const timetables = await Timetable.find({ staffId })
            .populate("courseId", "name code")
            .populate("subjectId", "name code");
        res.status(200).json(timetables);
    } catch (error) {
        console.error("❌ Error fetching staff timetable:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ✅ Get current class for a staff based on time
export const getCurrentClass = async (req, res) => {
    try {
        const { staffId } = req.query;

        if (!staffId) return res.status(400).json({ message: "staffId is required" });

        const currentPeriod = getCurrentPeriod();
        const currentDay = new Date().toLocaleString("en-US", { weekday: "long" });

        if (!currentPeriod) {
            return res.status(200).json({ message: "No active class (break/lunch time)" });
        }

        const timetable = await Timetable.findOne({ day: currentDay, period: currentPeriod, staffId })
            .populate("courseId", "name code")
            .populate("subjectId", "name code");

        if (!timetable) {
            return res.status(404).json({ message: "No class assigned for this time." });
        }

        res.status(200).json({
            message: "✅ Current class found",
            timetable,
        });
    } catch (error) {
        console.error("❌ Error fetching current class:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getCurrentClassByStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { day = "Monday", period = 1 } = req.query; // 👈 support query params

        const timetable = await Timetable.findOne({ staffId, day, period })
            .populate("courseId")
            .populate("subjectId");

        if (!timetable)
            return res.status(404).json({ message: "No class found for this period." });

        const course = await Course.findById(timetable.courseId);
        const students = await Student.find({
            course: course.name,
            semester: timetable.semester,
        });

        res.json({
            period: timetable.period,
            className: `${course.name} - Semester ${timetable.semester}`,
            students,
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch class", error: err.message });
    }
};