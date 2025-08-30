const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    // Verify token
    //const secret = process.env.JWT_SECRET;
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired. Please login again.",
          expiredAt: err.expiredAt, 
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid token or user not found",
      });
    }

    // Attach user to request
    req.user = {
      userId: user._id.toString(),
      username: user.username,
      name: user.name,
    };

    next();
  } catch (error) {
    console.error("Token authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Since only admin exists, we can simplify requireAdmin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }
  // all users are admins anyway
  next();
};

// Optional request logger
const logRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  logRequest,
};
