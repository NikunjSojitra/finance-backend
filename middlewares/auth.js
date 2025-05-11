const jwt = require("jsonwebtoken");
const User = require("../models/user.js");

exports.verifyAdmin = async (req, res, next) => {
    // Extract token from cookies or Authorization header
    const token =
      req.cookies?.token || // Check if cookies exist and extract token
      (req.header("Authorization")?.startsWith("Bearer ") && req.header("Authorization").replace("Bearer ", ""));
  
    console.log("Token from cookies:", req.cookies?.token);
    console.log("Token from Authorization header:", req.header("Authorization"));
    console.log("Extracted token:", token);
  
    if (!token) {
      return res.status(401).json({ msg: "Unauthorized: Token not provided" });
    }
  
    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      console.log("Decoded token:", decoded);
  
      // Check if the user is an admin
      const admin = await User.findById(decoded._id);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ msg: "Access denied: Not an admin" });
      }
  
      // Attach admin details to the request object
      req.user = admin;
      next();
    } catch (error) {
      console.error("Token verification error:", error.message);
      res.status(401).json({ msg: "Invalid token" });
    }
  };