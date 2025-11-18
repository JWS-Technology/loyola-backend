import Staff from "../models/staff.model.js";
import Subject from "../models/subject.model.js";
import Course from "../models/course.model.js";

// Create new staff
export const createStaff = async (req, res) => {
    try {
        const { staffId, name, email, phone, department, designation, subjectsHandled, courseIds, joinedYear } = req.body;

        const staff = await Staff.create({
            staffId,
            name,
            email,
            phone,
            department,
            designation,
            subjectsHandled,
            courseIds,
            joinedYear,
        });

        res.status(201).json(staff);
    } catch (error) {
        console.error("Error creating staff:", error);
        res.status(500).json({ message: "Failed to create staff", error: error.message });
    }
};

// Get all staff
export const getAllStaff = async (req, res) => {
    try {
        const staffList = await Staff.find().populate("subjectsHandled").populate("courseIds");
        res.status(200).json(staffList);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch staff list", error: error.message });
    }
};