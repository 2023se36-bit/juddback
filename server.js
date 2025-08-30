const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const courtRoutes = require("./routes/courtRoutes");
const staffRoutes = require("./routes/staffRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

// Middleware
const allowedOrigins = [
  "http://localhost:3000", // Local development frontend
  "https://juddfront.vercel.app", // Your deployed frontend URL
];
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed methods
  credentials: true, // Allow cookies and authentication credentials to be sent
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
  });

// API Routes
app.get("/", (req, res) => {
  res.send("Welcome to the API");
});
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courts", courtRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/settings", settingsRoutes);

// Handle errors
app.use((error, req, res, next) => {
  console.error("❌ Internal error:", error);
  res.status(500).json({ message: "Internal server error" });
});

// Export the handler for Vercel
module.exports = app;
