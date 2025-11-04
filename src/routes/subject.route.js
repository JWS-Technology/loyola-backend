import express from "express";
import { getAllSubjects, createSubject } from "../controllers/subject.controller.js";

const router = express.Router();

router.get("/", getAllSubjects);
router.post("/", createSubject);

export default router;
