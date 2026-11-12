const express = require("express");
const router = express.Router();

const {
  getComplaintStatusReport,
  getAreaWiseReport,
  getWaterSupplyScheduleReport,
  getResolutionTimeReport,
} = require("../controllers/reportController");

const { protect } = require("../middleware/authMiddleware");

// Reports endpoints (Accessible to authenticated users; public previews supported)
router.get("/complaint-status", getComplaintStatusReport);
router.get("/area-wise", getAreaWiseReport);
router.get("/water-schedule", getWaterSupplyScheduleReport);
router.get("/resolution-time", getResolutionTimeReport);

module.exports = router;

