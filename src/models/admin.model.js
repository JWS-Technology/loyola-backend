// models/admin.model.js
import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, default: "Super Admin" },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Admin || mongoose.model("Admin", adminSchema);