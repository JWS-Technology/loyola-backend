import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./utils/db.js"; // Import MongoDB connection
import cookieParser from "cookie-parser";

import studentRoutes from "./routes/student.route.js";
import attendanceRoutes from "./routes/attendance.route.js";
import subjectRoutes from "./routes/subject.route.js";
import courseRoutes from "./routes/course.route.js";
import timetableRoutes from "./routes/timetable.route.js";
import staffRoutes from "./routes/staff.route.js";
import authRoutes from "./routes/auth.route.js";

dotenv.config();
const app = express();

const allowedOrigins = [
    "http://localhost:3000",
    // "http://10.147.87.165:3000",
];

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);
// Middleware
// app.use(cors());
app.use(express.json());

// Connect Database
connectDB();

app.use(cookieParser());

// Test route
app.get("/", (req, res) => {
    res.json({ message: "Loyola ERP Backend Running 🚀" });
});

app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/staff", staffRoutes);

app.use("/api/auth", authRoutes);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(``));
