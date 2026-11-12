const express = require("express");
const router = express.Router();

const {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} = require("../controllers/scheduleController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Public endpoints: Citizens and public can view water supply schedules
router.get("/", getSchedules);
router.get("/:id", getScheduleById);

// Protected endpoints: Water Department Officer & Admin publish / edit schedules
router.post(
  "/",
  protect,
  authorize("Admin", "Water Department Officer"),
  createSchedule
);

router.put(
  "/:id",
  protect,
  authorize("Admin", "Water Department Officer"),
  updateSchedule
);

router.delete(
  "/:id",
  protect,
  authorize("Admin"),
  deleteSchedule
);

module.exports = router;

