// seedAdmin.js
// Run this with: node seedAdmin.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Import your models (adjust paths as needed)
import Auth from '../src/models/auth.model.js';
import Admin from '../src/models/admin.model.js';

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to DB");

        // 1. Admin Details
        const adminData = {
            name: "Main Administrator",
            email: "admin@college.edu",
            role: "Super Admin"
        };

        // 2. Create Admin Profile
        // Check if exists first
        let adminProfile = await Admin.findOne({ email: adminData.email });
        if (!adminProfile) {
            adminProfile = await Admin.create(adminData);
            console.log("✅ Admin Profile Created:", adminProfile._id);
        } else {
            console.log("ℹ️ Admin Profile already exists");
        }

        // 3. Create Auth Entry
        const username = "admin";
        const rawPassword = "12345"; // CHANGE THIS
        const hashedPassword = await bcrypt.hash(rawPassword, 12);

        const existingAuth = await Auth.findOne({ username });
        if (existingAuth) {
            console.log("❌ Auth user 'admin' already exists.");
            process.exit(0);
        }

        await Auth.create({
            username: username,
            password: hashedPassword,
            userType: "admin",
            userRef: adminProfile._id,
            userTypeRefModel: "Admin"
        });

        console.log(`🎉 Admin User Created! Log in with: ${username} / ${rawPassword}`);
        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

createAdmin();