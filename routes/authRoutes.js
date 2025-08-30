const express = require("express");
const { body } = require("express-validator");
const {
  login,
  verifyToken
} = require("../controllers/authController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  "/login",
  [
    body("username")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  login
);



router.get("/verify", verifyToken);



module.exports = router;
