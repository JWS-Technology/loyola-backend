// scripts/migrate-auth.js
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const MONGO = process.env.MONGO_URI;
if (!MONGO) {
    console.error("MONGO_URI missing in env. Set it in .env or environment variables.");
    process.exit(1);
}

// list of candidate paths to check (relative to project root)
const CANDIDATES = [
    "models/student.model.js",
    "models/student.js",
    "src/models/student.model.js",
    "src/models/student.js",
    "server/models/student.model.js",
    "server/models/student.js",
    "app/models/student.model.js",
    "app/models/student.js",
    "models/student.model.cjs",
    "src/models/student.model.cjs",
];

function findAndImport(baseName) {
    // baseName is like "student.model"
    const tried = [];
    const candidates = [
        `models/${baseName}.js`,
        `models/${baseName}.cjs`,
        `models/${baseName}.ts`,
        `src/models/${baseName}.js`,
        `src/models/${baseName}.cjs`,
        `src/models/${baseName}.ts`,
        `server/models/${baseName}.js`,
        `server/models/${baseName}.cjs`,
        `server/models/${baseName}.ts`,
        `app/models/${baseName}.js`,
        `app/models/${baseName}.cjs`,
        `app/models/${baseName}.ts`,
    ];

    for (const rel of candidates) {
        const abs = path.resolve(process.cwd(), rel);
        tried.push(abs);
        if (fs.existsSync(abs)) {
            console.log(`-> Found model file: ${rel}`);
            // import and return default if present
            // for .ts you might need to import transpiled .js instead
            return import(pathToFileURL(abs).href).then((m) => m.default || m);
        }
    }

    const err = new Error(`Model ${baseName} not found. Checked:\n${tried.join("\n")}`);
    err.tried = tried;
    throw err;
}

async function migrate() {
    try {
        await mongoose.connect(MONGO, {});
        console.log("Connected to MongoDB.");

        // Try to import Student, Staff, Auth
        const Student = await findAndImport("student.model").catch(() => findAndImport("student"));
        const Staff = await findAndImport("staff.model").catch(() => findAndImport("staff"));
        const Auth = await findAndImport("auth.model").catch(() => findAndImport("auth"));

        console.log("Imported models successfully.");

        // Students -> create auth
        const students = await Student.find({});
        console.log(`Found ${students.length} students.`);
        for (const s of students) {
            const username = s.roll_no;
            if (!username) {
                console.log("Skipping student with missing roll_no", s._id);
                continue;
            }
            const exists = await Auth.findOne({ username });
            if (exists) continue;
            const password = "1234";
            const hashed = await bcrypt.hash(password, 12);
            await Auth.create({
                username,
                password: hashed,
                userType: "student",
                userRef: s._id,
                userTypeRefModel: "Student",
            });
            console.log("Created auth for student", username);
        }

        // Staff -> create auth
        const staffs = await Staff.find({});
        console.log(`Found ${staffs.length} staff.`);
        for (const st of staffs) {
            if (!st.email) {
                console.log("Skipping staff without email", st._id);
                continue;
            }
            const username = st.email;
            const exists = await Auth.findOne({ username });
            if (exists) continue;
            const password = "1234";
            const hashed = await bcrypt.hash(password, 12);
            await Auth.create({
                username,
                password: hashed,
                userType: "staff",
                userRef: st._id,
                userTypeRefModel: "Staff",
            });
            console.log("Created auth for staff", username);
        }

        await mongoose.disconnect();
        console.log("Migration done");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err.message || err);
        if (err.tried) console.error("Paths checked:\n", err.tried.join("\n"));
        try { await mongoose.disconnect(); } catch (e) { }
        process.exit(1);
    }
}

migrate();
