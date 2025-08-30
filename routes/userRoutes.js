
const express = require("express");
const { body } = require("express-validator");
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
} = require("../controllers/userController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get all users
router.get("/", authenticateToken, getUsers);

// Get user by ID
router.get("/:id", authenticateToken, getUserById);

// Create user (admin only, but since only admins exist, no role check needed)
router.post(
  "/",
  [
    authenticateToken,
    body("username")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long")
      .isAlphanumeric()
      .withMessage("Username must contain only letters and numbers"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("name")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters long"),
  ],
  createUser
);

// Update user
router.put(
  "/:id",
  [
    authenticateToken,
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters long"),
  ],
  updateUser
);

// Deactivate user
// router.delete("/:id", authenticateToken, deactivateUser);

module.exports = router;
