// routes/attendance.routes.js
import express from "express";
import {
    getStudentsForAttendance,
    markAttendance,
    updateAttendance,
    getAttendance,
    correctAttendance,
    getStudentAttendanceSummary
} from "../controllers/attendance.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// session = get students for attendance (uses requireAuth)
router.get("/session", requireAuth, getStudentsForAttendance);

// create attendance (requireAuth)
router.post("/", requireAuth, markAttendance);

// update attendance (present -> absent) by staff
router.patch("/:attendanceId/present-to-absent", requireAuth, updateAttendance);

// HOD/AD/Admin correction (absent -> present)
router.patch("/:attendanceId/correct", requireAuth, requireRole(["hod", "ad", "admin"]), correctAttendance);

router.get("/student/summary", requireAuth, getStudentAttendanceSummary);

// query attendance
router.get("/", requireAuth, getAttendance);

export default router;
