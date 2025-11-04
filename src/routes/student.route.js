import express from "express";
import Student from "../models/student.model.js";

const router = express.Router();

// ➕ Add new student
router.post("/", async (req, res) => {
    try {
        const student = new Student(req.body);
        await student.save();
        res.status(201).json(student);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 📋 Get all students
router.get("/", async (req, res) => {
    try {
        const students = await Student.find();
        console.log(students);
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

});

export default router;
