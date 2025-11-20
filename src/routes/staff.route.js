import express from "express";
import { createStaff, getAllStaff, getStaffById } from "../controllers/staff.controller.js";

const router = express.Router();

router.post("/", createStaff);
router.get("/", getAllStaff);
router.get("/:id", getStaffById);

export default router;
