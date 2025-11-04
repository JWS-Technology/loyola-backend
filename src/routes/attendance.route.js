import express from "express";
import {
    markAttendance,
    updateAttendance,
    getAttendance,
} from "../controllers/attendance.controller.js";

const router = express.Router();

// POST → Mark attendance
router.post("/", markAttendance);

// PUT → Update attendance
router.put("/:attendanceId", updateAttendance);

// GET → Fetch attendance (daily, subject-wise, or student-wise)
router.get("/", getAttendance);

export default router;
