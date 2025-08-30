const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const courtRoutes = require("./routes/courtRoutes");
const staffRoutes = require("./routes/staffRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    await initializeSampleData();
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courts", courtRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/settings", settingsRoutes);


app.use((error, req, res, next) => {
  console.error("❌ Internal error:", error);
  res.status(500).json({ message: "Internal server error" });
});

async function initializeSampleData() {
  try {
    const User = require("./models/User");
    const Court = require("./models/Court");
    const Staff = require("./models/Staff");

    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log("ℹ️ Sample data already exists, skipping seeding.");
      return;
    }

    console.log("🌱 Seeding sample data...");
    const users = await User.create([
      { username: "admin", password: "admin123", role: "admin", name: "System Administrator" },
    ]);


    console.log("✅ Sample data seeding completed.");
  } catch (error) {
    console.error("❌ Error initializing sample data:", error);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
