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
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Database connection initialization for serverless & traditional environments
let dbPromise = null;
app.use(async (req, res, next) => {
  if (!dbPromise) {
    dbPromise = connectDB().catch((err) => {
      console.warn("DB connection warning:", err.message);
    });
  }
  await dbPromise;
  next();
});

// Health check handler
const healthHandler = (req, res) => {
  res.json({
    success: true,
    message: "Water Supply Complaint and Monitoring Portal API is active",
    timestamp: new Date().toISOString(),
    database: getDbMode(),
    service: "JalConnect Water Management Backend",
    version: "2.0.0",
  });
};

// Root friendly API descriptor
const rootHandler = (req, res) => {
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
};

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/service-updates", serviceUpdateRoutes);
app.use("/api/reports", reportRoutes);

app.get("/api/health", healthHandler);
app.get("/health", healthHandler);
app.get("/", rootHandler);
app.get("/api", rootHandler);

// Start Server (only when not in Vercel serverless environment)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` JalConnect Water Supply API Server Running`);
      console.log(` Local URL : http://localhost:${PORT}`);
      console.log(` Health API: http://localhost:${PORT}/api/health`);
      console.log(` DB Status : ${getDbMode()}`);
      console.log(`====================================================`);
    });
  }).catch((err) => {
    console.error("Startup error:", err.message);
  });
}

module.exports = app;
