const express = require("express");
const router = express.Router();

const {
  createComplaint,
  getComplaints,
  getComplaintById,
  trackComplaintPublic,
  assignComplaint,
  updateResolution,
  submitFeedback,
  reportUnresolved,
  getStats,
} = require("../controllers/complaintController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Public endpoints
router.get("/stats", getStats);
router.get("/track/:idOrPhone", trackComplaintPublic);

// Register complaint can be done with or without login (if logged in, JWT populates req.user)
router.post("/", (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return protect(req, res, next);
  }
  next();
}, createComplaint);

// Protected routes below
router.get("/", protect, getComplaints);
router.get("/:id", protect, getComplaintById);

// Assignment endpoint: Officer and Admin only
router.patch(
  "/:id/assign",
  protect,
  authorize("Admin", "Water Department Officer"),
  assignComplaint
);

// Resolution / Field work endpoint: Technician, Officer, and Admin
router.patch(
  "/:id/resolution",
  protect,
  authorize("Admin", "Water Department Officer", "Field Technician"),
  updateResolution
);

// Citizen feedback endpoint
router.patch("/:id/feedback", protect, submitFeedback);

// Citizen report unresolved / delay escalation endpoint
router.patch("/:id/report-unresolved", protect, reportUnresolved);

module.exports = router;
