const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getCurrentUser,
  getStaffRoster,
  getDemoCredentials,
} = require("../controllers/authController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/demo-credentials", getDemoCredentials);

// Protected routes
router.get("/me", protect, getCurrentUser);
router.get(
  "/staff",
  protect,
  authorize("Admin", "Water Department Officer"),
  getStaffRoster
);

module.exports = router;
