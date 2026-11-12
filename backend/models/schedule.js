const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    scheduleId: {
      type: String,
      unique: true,
      default: () => `SCH-${Date.now().toString().slice(-4)}`,
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    wardNumber: {
      type: String,
      required: true,
      trim: true,
    },
    morningSupply: {
      type: String,
      required: true,
      default: "06:00 AM - 08:30 AM",
    },
    eveningSupply: {
      type: String,
      required: true,
      default: "06:00 PM - 08:00 PM",
    },
    supplyDays: {
      type: String,
      default: "Daily",
    },
    durationHours: {
      type: Number,
      default: 4.5,
    },
    source: {
      type: String,
      required: true,
      default: "Central Reservoir",
    },
    pressureLevel: {
      type: String,
      enum: ["Normal", "High", "Low"],
      default: "Normal",
    },
    status: {
      type: String,
      enum: ["On Time", "Delayed", "Under Maintenance", "Interrupted"],
      default: "On Time",
    },
    remarks: {
      type: String,
      default: "Normal pressure scheduled supply.",
    },
    publishedBy: {
      type: String,
      default: "Water Department Operations",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Schedule", scheduleSchema);

