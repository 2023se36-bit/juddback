const { validationResult } = require("express-validator");
const User = require("../models/User");

// 📌 Get all active users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select("-password")
      .sort({ name: 1 });

    res.json({ success: true, users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 📌 Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 📌 Create new admin user
exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { username, password, name } = req.body;

    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Username already exists" });
    }

    const user = new User({ username, password, name });
    await user.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 📌 Update user
exports.updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { name, isActive } = req.body;
    if (name) user.name = name;
    if (typeof isActive === "boolean") user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: "User updated successfully",
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 📌 Deactivate user
// exports.deactivateUser = async (req, res) => {
//   try {
//     const userId = req.params.id;

//     if (req.user.userId === userId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Cannot deactivate your own account" });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     user.isActive = false;
//     await user.save();

//     res.json({ success: true, message: "User deactivated successfully" });
//   } catch (error) {
//     console.error("Deactivate user error:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };
