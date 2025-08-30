const User = require("../models/User");
const Setting = require("../models/Setting");

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    res.json({ success: true, user });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { name, username, currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update basic info
    if (name) user.name = name;
    if (username) user.username = username;

    // Update password if provided
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
      }

      if (!currentPassword) {
        return res.status(400).json({ success: false, message: "Current password is required" });
      }

      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(400).json({ success: false, message: "Current password is incorrect" });
      }

      user.password = newPassword;
    }

    await user.save();

    // Return user without password
    const userWithoutPassword = await User.findById(userId).select("-password");
    res.json({ success: true, message: "Profile updated successfully", user: userWithoutPassword });
  } catch (error) {
    console.error("Update user profile error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Username already exists" });
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.updateLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No logo file provided" });
    }

    const logo = req.file;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(logo.mimetype)) {
      return res.status(400).json({ success: false, message: "Invalid file type. Please upload an image (JPEG, PNG, GIF, SVG, WEBP)." });
    }

    // Validate file size (max 2MB)
    if (logo.size > 2 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: "File size must be less than 2MB" });
    }

    // Convert to base64
    const base64Logo = logo.buffer.toString('base64');

    // Store in database
    await Setting.setSetting('logo', base64Logo, logo.mimetype);

    // Return the full data URL for immediate use
    const logoDataUrl = `data:${logo.mimetype};base64,${base64Logo}`;
    
    res.json({ success: true, message: "Logo updated successfully", logo: logoDataUrl });
  } catch (error) {
    console.error("Update logo error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getLogo = async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: 'logo' });
    
    if (setting && setting.value) {
      const logoDataUrl = `data:${setting.mimeType};base64,${setting.value}`;
      return res.json({ success: true, logo: logoDataUrl });
    }
    
    res.json({ success: true, logo: null });
  } catch (error) {
    console.error("Get logo error:", error);
    res.json({ success: true, logo: null });
  }
};

