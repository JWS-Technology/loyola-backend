// models/auth.model.js
import mongoose from "mongoose";

const authSchema = new mongoose.Schema({
    // unique username for login. For students we'll use roll_no, for staff email
    username: { type: String, required: true, unique: true },

    // hashed password
    password: { type: String, required: true },

    // which type of user this auth belongs to
    userType: { type: String, enum: ["student", "staff", "admin"], required: true },

    // reference to Student or Staff
    userRef: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "userTypeRefModel",
    },

    // helper field to tell mongoose ref model name for refPath
    userTypeRefModel: { type: String, required: true, enum: ["Student", "Staff", "Admin"] },

    // optional: college reference or plain string if you have a College model
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: false },

    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Auth", authSchema);
