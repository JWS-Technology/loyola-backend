import mongoose from "mongoose";
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

// ✅ FIXED: Get staff by ID
export const getStaffById = async (req, res) => {
    // Fix: Use req.params.id instead of req.Staff.id
    console.log("Backend received request for Staff ID:", req.params.id);

    try {
        const { id } = req.params;

        let query;
        // Check if the ID provided is a valid MongoDB Object ID
        if (mongoose.Types.ObjectId.isValid(id)) {
            query = { _id: id };
        } else {
            // If not, assume it is the custom string "staffId" (e.g., "CS101")
            query = { staffId: id };
        }

        const staff = await Staff.findOne(query)
            .populate("subjectsHandled")
            .populate("courseIds");

        if (!staff) {
            console.log("Staff not found for ID:", id);
            return res.status(404).json({ message: "Staff member not found" });
        }

        res.status(200).json(staff);
    } catch (error) {
        console.error("Error fetching staff details:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};