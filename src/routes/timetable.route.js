import express from "express";
import {
    createTimetable,
    getAllTimetables,
    getTimetableByStaff,
    getCurrentClass,
    getCurrentClassByStaff,
} from "../controllers/timetable.controller.js";

const router = express.Router();

// Routes
router.post("/", createTimetable); // Add new timetable entry
router.get("/", getAllTimetables); // Get all timetable entries
router.get("/staff/:staffId", getTimetableByStaff); // Get timetable for specific staff
router.get("/current", getCurrentClass); // Get current class for logged-in staff
router.get("/current/:staffId", getCurrentClassByStaff);

export default router;
