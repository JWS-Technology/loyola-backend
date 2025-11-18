// src/routes/auth.route.js
import express from "express";
import { login, register, logout, me } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register); // protect or call only for migration/admin
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
export default router;
