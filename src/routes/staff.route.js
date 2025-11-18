import express from "express";
import { createStaff, getAllStaff } from "../controllers/staff.controller.js";

const router = express.Router();

router.post("/", createStaff);
router.get("/", getAllStaff);

export default router;
