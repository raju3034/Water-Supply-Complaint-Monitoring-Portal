const express = require("express");
const router = express.Router();

const {
  getServiceUpdates,
  createServiceUpdate,
  updateServiceUpdate,
  deleteServiceUpdate,
} = require("../controllers/serviceUpdateController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Public endpoints
router.get("/", getServiceUpdates);

// Protected endpoints
router.post(
  "/",
  protect,
  authorize("Admin", "Water Department Officer"),
  createServiceUpdate
);

router.put(
  "/:id",
  protect,
  authorize("Admin", "Water Department Officer"),
  updateServiceUpdate
);

router.delete(
  "/:id",
  protect,
  authorize("Admin"),
  deleteServiceUpdate
);

module.exports = router;

