import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./utils/db.js"; // Import MongoDB connection

import studentRoutes from "./routes/student.route.js";
import attendanceRoutes from "./routes/attendance.route.js";
import subjectRoutes from "./routes/subject.route.js";
import courseRoutes from "./routes/course.route.js";


dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect Database
connectDB();


// Test route
app.get("/", (req, res) => {
    res.json({ message: "Loyola ERP Backend Running 🚀" });
});

app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/courses", courseRoutes);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
