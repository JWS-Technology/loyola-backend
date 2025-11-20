// routes/attendance.routes.js

import express from "express";
import {
    getStudentsForAttendance,
    markAttendance,
    updateAttendance,
    getAttendance,
    getStudentAttendanceSummary, getAttendanceById
    // getStudentDaywiseAttendance  <-- REMOVED THIS IMPORT
} from "../controllers/attendance.controller.js";

import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get students for attendance (Staff view)
router.get("/session", requireAuth, getStudentsForAttendance);

// Mark attendance
router.post("/", requireAuth, markAttendance);

// Staff present→absent
router.patch("/:attendanceId/present-to-absent", requireAuth, updateAttendance);

// HOD/AD/Admin absent→present (Placeholder for now)
router.patch(
    "/:attendanceId/correct",
    requireAuth,
    requireRole(["hod", "ad", "admin"]),
    (req, res) => res.status(501).json({ message: "Not implemented yet" }) // added dummy handler to prevent crash
);

// Student summary (Donut charts)
router.get("/student/summary", requireAuth, getStudentAttendanceSummary);

// General attendance fetch (Used for Student Day-wise table AND Admin views)
// The frontend now uses this route with ?studentId=... to build the table
router.get("/", requireAuth, getAttendance);

// REMOVED: router.get("/student/daywise", ...) because the frontend calculates this now.
// Get single attendance by ID
router.get("/:id", getAttendanceById);


export default router;