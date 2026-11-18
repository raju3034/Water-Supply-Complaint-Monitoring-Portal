const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
      default: () => `CMP-${Date.now().toString().slice(-6)}`,
    },
    citizenName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    citizenEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    citizenId: {
      type: String,
      default: null,
    },
    complaintType: {
      type: String,
      required: true,
      enum: ["Leakage", "Water Shortage", "Water Quality", "Low Pressure", "Pipeline Damage"],
      default: "Leakage",
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    landmark: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "Assigned", "In Progress", "Resolved"],
      default: "Pending",
    },
    assignedOfficer: {
      type: String,
      default: null,
    },
    assignedOfficerName: {
      type: String,
      default: "Unassigned",
    },
    assignedTechnician: {
      type: String,
      default: null,
    },
    assignedTechnicianName: {
      type: String,
      default: "Unassigned",
    },
    targetResolutionDate: {
      type: String,
      default: "",
    },
    resolutionNote: {
      type: String,
      default: "",
    },
    actionTaken: {
      type: String,
      default: "",
    },
    materialUsed: {
      type: String,
      default: "",
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionHours: {
      type: Number,
      default: 0,
    },
    citizenRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    citizenFeedback: {
      type: String,
      default: "",
    },
    isEscalated: {
      type: Boolean,
      default: false,
    },
    escalationReason: {
      type: String,
      default: "",
    },
    escalationDetails: {
      type: String,
      default: "",
    },
    lastEscalatedAt: {
      type: Date,
      default: null,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        updatedBy: { type: String, default: "System" },
        role: { type: String, default: "System" },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Complaint", complaintSchema);
