// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

const app = express();
const { testEmailConnection } = require("./utils/emailService");

testEmailConnection().then((isReady) => {
  if (isReady) {
    console.log("📧 Email service is configured and ready");
  } else {
    console.log("⚠️ Email service is not properly configured");
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/analytics", require("./routes/analytics"));

// In your backend server file (e.g., server.js or app.js)
app.get("/api/analytics", (req, res) => {
  try {
    // Fetch analytics data from your database or service
    const analyticsData = {
      totalReports: 150,
      reportGrowth: 15,
      resolutionRate: 85,
      avgResolutionTime: 12,
      activeVolunteers: 50,
      volunteerGrowth: 20,
      dailyReports: [
        { date: new Date("2024-01-01"), count: 10 },
        { date: new Date("2024-01-02"), count: 15 },
        // More daily report data
      ],
      categoryDistribution: {
        infrastructure: 45,
        environment: 35,
        community: 20,
      },
      predictions: {
        expectedReports: 170,
        estimatedResolution: 90,
        volunteerEngagement: 55,
      },
      impactMetrics: {
        activeAreas: [
          { name: "Downtown", reportCount: 35 },
          { name: "Suburb", reportCount: 25 },
        ],
        resolutionSuccess: 85,
        totalResolved: 128,
      },
    };

    res.json(analyticsData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Create uploads directory if it doesn't exist
const fs = require("fs");
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// MongoDB connection with debug logging
console.log("Attempting to connect to MongoDB...");
console.log(
  "MongoDB URI:",
  process.env.MONGODB_URI ? "URI is set" : "URI is missing"
);

// Add this to your server.js temporarily to test connection
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working" });
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/problems", require("./routes/problems"));
app.use("/api/users", require("./routes/users"));
app.use("/api/volunteers", require("./routes/volunteers"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler caught:", err);
  res.status(500).json({
    error: "Server error",
    details:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log("Environment:", process.env.NODE_ENV || "development");
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});
