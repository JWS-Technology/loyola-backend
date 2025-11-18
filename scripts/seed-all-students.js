import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/loyola_erp";
const { ObjectId } = mongoose.Types;

// --- SCHEMAS ---
const studentSchema = new mongoose.Schema({
    roll_no: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    gender: String,
    dob: Date,
    parentName: String,
    contact: String,
    email: String,
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    batch: { type: Number, required: true },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
});

const Student = mongoose.model("Student", studentSchema);
const Course = mongoose.model("Course", new mongoose.Schema({
    name: String,
    code: String,
    department: String,
    duration: Number
}));

// --- MAPPINGS ---
const COURSE_MAP = {
    "Bachelor of Arts - English": "ENG",
    "Bachelor of Arts - Tamil": "TAM",
    "Bachelor of Business Administration - Business Administration": "BBA",
    "Bachelor of Commerce - Commerce": "COM",
    "Bachelor of Commerce - Commerce (Computer Application)": "CCA",
    "Bachelor of Commerce - Commerce (Accounting and Finance)": "CAF",
    "Bachelor of Computer Application - Computer Application": "BCA", // <--- This matches your text file
    "Bachelor of Science - Chemistry": "CHE",
    "Bachelor of Science - Computer Science": "CSC",
    "Bachelor of Science - Computer Science (Artificial Intelligence and Data Science)": "ADS",
    "Bachelor of Science - Mathematics": "MAT",
    "Bachelor of Science - Physics": "PHY"
};

// --- HARDCODED IDs (To match Timetable Seed) ---
const FIXED_IDS = {
    "BCA": new ObjectId("690a30000000000000000001") // The ID used in seed-timetable.js
};

const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('.');
    return new Date(`${year}-${month}-${day}`);
};

const getBatch = (yearStr) => {
    const cleanYear = yearStr.trim().toUpperCase();
    if (cleanYear === 'I') return 2025;
    if (cleanYear === 'II') return 2024;
    if (cleanYear === 'III') return 2023;
    return 2025;
};

async function seedAllStudents() {
    try {
        console.log("🔵 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected.");

        // 1. ENSURE ALL COURSES EXIST WITH CORRECT IDs
        console.log("⚙️  Syncing Courses...");
        const courseCache = {};

        for (const [fullName, code] of Object.entries(COURSE_MAP)) {
            const dept = fullName.split('-')[1]?.trim() || fullName;

            // Determine ID: Use fixed if available, otherwise let Mongo generate
            const searchCriteria = FIXED_IDS[code] ? { _id: FIXED_IDS[code] } : { name: fullName };

            let course = await Course.findOne(searchCriteria);

            if (!course) {
                // Prepare doc
                const courseDoc = {
                    name: fullName,
                    code: code,
                    department: dept,
                    duration: 3
                };
                // If we have a fixed ID for this code, force it
                if (FIXED_IDS[code]) {
                    courseDoc._id = FIXED_IDS[code];
                }

                course = await Course.create(courseDoc);
                console.log(`   + Created Course: ${fullName} (ID: ${course._id})`);
            } else {
                // console.log(`   = Found Course: ${fullName} (ID: ${course._id})`);
            }
            courseCache[fullName] = course._id;
        }

        // 2. READ FILE
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const filePath = path.join(__dirname, "..", "students_data.txt");

        if (!fs.existsSync(filePath)) {
            throw new Error("❌ students_data.txt not found! Please create it in the root folder.");
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split(/\r?\n/);

        console.log(`📂 Parsing ${lines.length} lines...`);

        const studentsToInsert = [];
        const rollCounters = {};

        for (const line of lines) {
            if (!line.trim()) continue;
            const parts = line.split('\t').map(p => p.trim());

            if (parts[0] === "first name" || parts[1] === "last name" || parts.length < 10) continue;

            // Dynamic Indexing to handle rows
            let genderIndex = parts.findIndex(p => /^Male|Female$/i.test(p));
            if (genderIndex === -1) genderIndex = 3; // Default fallback

            const name = parts[1];
            const gender = parts[genderIndex];
            const dobRaw = parts[genderIndex + 1];
            const parent = parts[genderIndex + 2];
            const contact = parts[genderIndex + 3];
            const email = parts[genderIndex + 4];
            const courseName = parts[genderIndex + 6]; // Stream is +5, Course is +6
            const yearStr = parts[genderIndex + 8];

            if (!courseCache[courseName]) {
                console.warn(`   ⚠️ Skipping: Unknown course "${courseName}"`);
                continue;
            }

            const batch = getBatch(yearStr);
            const courseCode = COURSE_MAP[courseName] || "GEN";

            const key = `${batch}_${courseCode}`;
            if (!rollCounters[key]) rollCounters[key] = 0;
            rollCounters[key]++;

            const batchPrefix = String(batch).slice(2);
            const sequence = String(rollCounters[key]).padStart(3, '0');
            const rollNo = `${batchPrefix}${courseCode}${sequence}`;

            studentsToInsert.push({
                roll_no: rollNo,
                name: name,
                gender: gender,
                dob: parseDate(dobRaw) || new Date(),
                parentName: parent,
                contact: contact,
                email: email,
                courseId: courseCache[courseName], // This now holds the correct ID
                batch: batch,
                subjects: []
            });
        }

        // 3. INSERT
        console.log(`🚀 Inserting/Updating ${studentsToInsert.length} students...`);

        const ops = studentsToInsert.map(doc => ({
            updateOne: {
                filter: { roll_no: doc.roll_no },
                update: { $set: doc },
                upsert: true
            }
        }));

        if (ops.length > 0) {
            const result = await Student.bulkWrite(ops);
            console.log(`🎉 Done! Matched: ${result.matchedCount}, Upserted: ${result.upsertedCount}`);
        }

    } catch (err) {
        console.error("❌ ERROR:", err);
    } finally {
        await mongoose.disconnect();
        console.log("👋 Disconnected.");
    }
}

seedAllStudents();
