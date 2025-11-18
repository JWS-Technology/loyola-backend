// middleware/auth.middleware.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const COOKIE_NAME = process.env.COOKIE_NAME || "erp_token";

export const requireAuth = (req, res, next) => {
    try {
        // cookies (if using cookie-parser) or Authorization: Bearer <token>
        const token =
            req.cookies?.[COOKIE_NAME] || (req.headers.authorization || "").split(" ")[1];
        if (!token) return res.status(401).json({ message: "Not authenticated" });

        const decoded = jwt.verify(token, JWT_SECRET);

        // attach user info to request
        req.user = {
            authId: decoded.authId,
            userId: decoded.userId,
            userType: decoded.userType, // e.g., "staff", "hod", "ad", "admin"
        };
        return next();
    } catch (err) {
        console.error("Auth error:", err);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

// middleware to require specific roles
export const requireRole = (roles = []) => {
    return (req, res, next) => {
        try {
            if (!req.user) return res.status(401).json({ message: "Not authenticated" });
            if (!Array.isArray(roles) || roles.length === 0) return next();
            if (!roles.includes(req.user.userType)) {
                return res.status(403).json({ message: "Insufficient role/permission" });
            }
            next();
        } catch (err) {
            console.error("Role check error:", err);
            return res.status(500).json({ message: "Server error" });
        }
    };
};
