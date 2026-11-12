const mongoose = require("mongoose");

const serviceUpdateSchema = new mongoose.Schema(
  {
    updateId: {
      type: String,
      unique: true,
      default: () => `UPD-${Date.now().toString().slice(-4)}`,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "Scheduled Maintenance",
        "Emergency Outage",
        "Supply Delay",
        "Water Quality Advisory",
        "Normal Service Resumed",
      ],
      default: "Scheduled Maintenance",
    },
    severity: {
      type: String,
      enum: ["Info", "Warning", "Critical"],
      default: "Info",
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    effectiveFrom: {
      type: String,
      required: true,
    },
    effectiveTo: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Resolved", "Archived"],
      default: "Active",
    },
    publishedBy: {
      type: String,
      default: "Municipal Water Board",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ServiceUpdate", serviceUpdateSchema);

