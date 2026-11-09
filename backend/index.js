const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB, getDbMode } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const serviceUpdateRoutes = require("./routes/serviceUpdateRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/service-updates", serviceUpdateRoutes);
app.use("/api/reports", reportRoutes);

// Health check API
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Water Supply Complaint and Monitoring Portal API is active",
    timestamp: new Date().toISOString(),
    database: getDbMode(),
    service: "JalConnect Water Management Backend",
    version: "2.0.0",
  });
});

// Root friendly API descriptor
app.get("/", (req, res) => {
  res.json({
    portal: "JalConnect - Water Supply Complaint & Monitoring System",
    status: "Operational",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      complaints: "/api/complaints",
      schedules: "/api/schedules",
      serviceUpdates: "/api/service-updates",
      reports: "/api/reports",
    },
  });
});

// Start Server
async function startServer() {
  try {
    // Attempt DB connection (with graceful in-memory fallback)
    await connectDB();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` JalConnect Water Supply API Server Running`);
      console.log(` Local URL : http://localhost:${PORT}`);
      console.log(` Health API: http://localhost:${PORT}/api/health`);
      console.log(` DB Status : ${getDbMode()}`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error("Startup error:", error.message);
  }
}

startServer();

module.exports = app;
