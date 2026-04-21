const jwt = require("jsonwebtoken");
const User = require("../models/user.js");

const extractToken = (req) => {
    if (req.cookies?.token) return req.cookies.token;
    if (req.header("Authorization")?.startsWith("Bearer ")) {
        return req.header("Authorization").replace("Bearer ", "");
    }
    return null;
};

exports.verifyToken = async (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({ msg: "Unauthorized: Token not provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const user = await User.findById(decoded._id);
        if (!user) {
            return res.status(401).json({ msg: "User not found" });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ msg: "Invalid token" });
    }
};

exports.verifySuperAdmin = async (req, res, next) => {
    await exports.verifyToken(req, res, () => {
        if (req.user.role !== "superadmin") {
            return res.status(403).json({ msg: "Access denied: superadmin only" });
        }
        next();
    });
};

exports.verifyFinancier = async (req, res, next) => {
    await exports.verifyToken(req, res, () => {
        if (req.user.role !== "financer" && req.user.role !== "superadmin") {
            return res.status(403).json({ msg: "Access denied: financer or superadmin only" });
        }
        next();
    });
};

exports.verifyAdmin = exports.verifySuperAdmin;