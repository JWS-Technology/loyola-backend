// src/controllers/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Auth from "../models/auth.model.js";
import Student from "../models/student.model.js";
import Staff from "../models/staff.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const COOKIE_NAME = process.env.COOKIE_NAME || "erp_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// helper to create token
function createToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// Register endpoint (admin or migration can call)
// body: { username, password, userType: 'student'|'staff', userRefId, collegeId? }
export const register = async (req, res) => {
    try {
        const { username, password, userType, userRefId, collegeId } = req.body;
        if (!username || !password || !userType || !userRefId) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // check existing
        const exists = await Auth.findOne({ username });
        if (exists) return res.status(409).json({ message: "Auth entry already exists" });

        const hashed = await bcrypt.hash(password, 12);

        // ref model name
        const refModel = userType === "student" ? "Student" : "Staff";

        const auth = await Auth.create({
            username,
            password: hashed,
            userType,
            userRef: userRefId,
            userTypeRefModel: refModel,
            collegeId,
        });

        return res.status(201).json({ message: "Auth created", authId: auth._id });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Register failed", error: error.message });
    }
};

// Login using username (roll_no or email) + password
// body: { username, password }
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password)
            return res.status(400).json({ message: "Username and password required" });

        const auth = await Auth.findOne({ username }).populate({
            path: "userRef",
            select: "-__v", // pick fields you want to expose
        });

        if (!auth) return res.status(404).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, auth.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        // create token with minimal payload
        const payload = {
            authId: auth._id,
            userId: auth.userRef._id,
            userType: auth.userType,
        };

        const token = createToken(payload);

        // set cookie
        const cookieOptions = {
            httpOnly: true,
            maxAge: COOKIE_MAX_AGE,
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
            secure: process.env.NODE_ENV === "production", // use HTTPS in prod
            path: "/",
        };

        res.cookie(COOKIE_NAME, token, cookieOptions);

        // return role + minimal user data so client can redirect
        const user = auth.userRef;
        const role = auth.userType;

        return res.status(200).json({
            message: "Login successful",
            role,
            user: {
                _id: user._id,
                name: user.name,
                ...(role === "student" ? { roll_no: user.roll_no, batch: user.batch } : { email: user.email }),
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Login failed", error: error.message });
    }
};

// Logout: clear cookie
export const logout = async (req, res) => {
    try {
        res.clearCookie(COOKIE_NAME, { path: "/" });
        return res.status(200).json({ message: "Logged out" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Logout failed", error: error.message });
    }
};

// Optional: endpoint to get current user from cookie
export const me = async (req, res) => {
    try {
        console.log("auth me came")
        // token parsed by middleware attach to req.user
        if (!req.user) return res.status(401).json({ message: "Not authenticated" });

        const { userId, userType } = req.user;

        const UserModel = userType === "student" ? Student : Staff;
        const user = await UserModel.findById(userId).select("-__v");
        console.log(user);
        if (!user) return res.status(404).json({ message: "User not found" });

        return res.status(200).json({ user, role: userType });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed", error: error.message });
    }
};
