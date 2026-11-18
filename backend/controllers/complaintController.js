const { complaintStore, userStore } = require("../data/store");

// 1. Create a new complaint
const createComplaint = async (req, res) => {
  try {
    if (!req.user || (req.user.role !== "Citizen" && req.user.role !== "Admin")) {
      return res.status(403).json({
        success: false,
        message: "Citizen login required. Please sign in or register as a citizen to lodge a complaint.",
      });
    }

    const {
      citizenName,
      phone,
      citizenEmail,
      complaintType,
      area,
      address,
      landmark,
      description,
      priority,
    } = req.body;

    if (!citizenName || !phone || !complaintType || !area || !address || !description) {
      return res.status(400).json({
        success: false,
        message: "Please fill all mandatory fields: Name, Phone, Type, Area, Address, and Description.",
      });
    }

    const citizenId = req.user ? (req.user._id || req.user.id) : null;
    const email = citizenEmail || (req.user ? req.user.email : "");

    const complaint = await complaintStore.create({
      citizenName: citizenName.trim(),
      phone: phone.trim(),
      citizenEmail: email,
      citizenId,
      complaintType,
      area: area.trim(),
      address: address.trim(),
      landmark: landmark ? landmark.trim() : "",
      description: description.trim(),
      priority: priority || "Medium",
    });

    res.status(201).json({
      success: true,
      message: "Complaint registered successfully! Please save your tracking ID.",
      data: complaint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to register complaint",
    });
  }
};

// 2. Get complaints with filters
const getComplaints = async (req, res) => {
  try {
    const { status, priority, area, complaintType, search, technicianOnly } = req.query;
    let complaints = await complaintStore.find();

    // Role-based or query-based filtering
    if (req.user && req.user.role === "Citizen") {
      // Citizen sees complaints linked to their email or phone or user id
      complaints = complaints.filter(
        (c) =>
          (c.citizenId && c.citizenId === (req.user._id || req.user.id)) ||
          (c.citizenEmail && c.citizenEmail.toLowerCase() === req.user.email.toLowerCase()) ||
          (c.phone && c.phone === req.user.phone)
      );
    } else if (
      (req.user && req.user.role === "Field Technician" && technicianOnly === "true") ||
      (req.query.assignedToMe === "true" && req.user)
    ) {
      const currentUserId = req.user._id || req.user.id;
      complaints = complaints.filter(
        (c) =>
          c.assignedTechnician === currentUserId ||
          (c.assignedTechnicianName && c.assignedTechnicianName.toLowerCase().includes(req.user.name.toLowerCase()))
      );
    }

    // Additional filters
    if (status && status !== "All") {
      complaints = complaints.filter((c) => c.status === status);
    }
    if (priority && priority !== "All") {
      complaints = complaints.filter((c) => c.priority === priority);
    }
    if (area && area !== "All") {
      complaints = complaints.filter((c) => c.area.toLowerCase().includes(area.toLowerCase()));
    }
    if (complaintType && complaintType !== "All") {
      complaints = complaints.filter((c) => c.complaintType === complaintType);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      complaints = complaints.filter(
        (c) =>
          c.complaintId.toLowerCase().includes(q) ||
          c.citizenName.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.area.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Get single complaint
const getComplaintById = async (req, res) => {
  try {
    const complaint = await complaintStore.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found with provided ID",
      });
    }

    res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid complaint ID",
    });
  }
};

// 4. Public tracking endpoint by Complaint ID or Phone (no login needed)
const trackComplaintPublic = async (req, res) => {
  try {
    const { idOrPhone } = req.params;
    if (!idOrPhone) {
      return res.status(400).json({ success: false, message: "Please enter a Complaint ID or Phone Number." });
    }

    const term = idOrPhone.trim();
    const all = await complaintStore.find();
    const matches = all.filter(
      (c) =>
        c.complaintId.toUpperCase() === term.toUpperCase() ||
        c.phone === term ||
        (c._id && c._id === term)
    );

    if (matches.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No complaints found matching "${term}". Please check the ID and try again.`,
      });
    }

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Assign complaint to Officer and Field Technician (Key Functionality)
const assignComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      assignedTechnician,
      assignedTechnicianName,
      assignedOfficer,
      assignedOfficerName,
      targetResolutionDate,
      priority,
      note,
    } = req.body;

    const complaint = await complaintStore.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    const officerName = assignedOfficerName || (req.user ? req.user.name : "Officer In-charge");
    const techName = assignedTechnicianName || "Assigned Field Technician";

    const updatedHistory = [
      ...(complaint.statusHistory || []),
      {
        status: "Assigned",
        updatedBy: req.user ? req.user.name : "Water Department Officer",
        role: req.user ? req.user.role : "Water Department Officer",
        timestamp: new Date(),
        note: note || `Assigned to technician ${techName}. Target: ${targetResolutionDate || "Standard SLA"}.`,
      },
    ];

    const updated = await complaintStore.findByIdAndUpdate(complaint._id || complaint.id, {
      status: "Assigned",
      assignedOfficer: assignedOfficer || (req.user ? req.user._id : null),
      assignedOfficerName: officerName,
      assignedTechnician: assignedTechnician || null,
      assignedTechnicianName: techName,
      targetResolutionDate: targetResolutionDate || complaint.targetResolutionDate,
      priority: priority || complaint.priority,
      statusHistory: updatedHistory,
    });

    res.status(200).json({
      success: true,
      message: `Complaint assigned to ${techName} successfully.`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Update resolution / work log (Technician & Officer)
const updateResolution = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      resolutionNote,
      actionTaken,
      materialUsed,
      customNote,
    } = req.body;

    const complaint = await complaintStore.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    const newStatus = status || complaint.status;
    let resolvedAt = complaint.resolvedAt;
    let resolutionHours = complaint.resolutionHours;

    if (newStatus === "Resolved" && !complaint.resolvedAt) {
      resolvedAt = new Date();
      const diffMs = resolvedAt - new Date(complaint.createdAt);
      resolutionHours = Number((diffMs / (1000 * 60 * 60)).toFixed(1));
      if (resolutionHours < 0.5) resolutionHours = 1.0;
    }

    const updatedHistory = [
      ...(complaint.statusHistory || []),
      {
        status: newStatus,
        updatedBy: req.user ? req.user.name : "Field Technician",
        role: req.user ? req.user.role : "Field Technician",
        timestamp: new Date(),
        note: customNote || resolutionNote || `Status updated to ${newStatus}`,
      },
    ];

    const updated = await complaintStore.findByIdAndUpdate(complaint._id || complaint.id, {
      status: newStatus,
      resolutionNote: resolutionNote !== undefined ? resolutionNote : complaint.resolutionNote,
      actionTaken: actionTaken !== undefined ? actionTaken : complaint.actionTaken,
      materialUsed: materialUsed !== undefined ? materialUsed : complaint.materialUsed,
      resolvedAt,
      resolutionHours,
      statusHistory: updatedHistory,
    });

    res.status(200).json({
      success: true,
      message: `Complaint updated to status "${newStatus}"`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Submit citizen satisfaction feedback
const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { citizenRating, citizenFeedback } = req.body;

    if (!citizenRating || citizenRating < 1 || citizenRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5.",
      });
    }

    const complaint = await complaintStore.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    const updated = await complaintStore.findByIdAndUpdate(complaint._id || complaint.id, {
      citizenRating: Number(citizenRating),
      citizenFeedback: (citizenFeedback || "").trim(),
    });

    res.status(200).json({
      success: true,
      message: "Thank you for your feedback!",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Report unresolved / delay escalation by citizen
const reportUnresolved = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, details } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please select or provide a reason for the report.",
      });
    }

    const complaint = await complaintStore.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    if (complaint.status === "Resolved") {
      return res.status(400).json({
        success: false,
        message: "This complaint is already marked as resolved. You can submit satisfaction feedback or register a new complaint.",
      });
    }

    const reporterName = req.user ? req.user.name : (complaint.citizenName || "Citizen");
    const escalationNote = `Citizen Escalation Report: [${reason.trim()}] ${details ? details.trim() : ""}`;

    const updatedHistory = [
      ...(complaint.statusHistory || []),
      {
        status: complaint.status,
        updatedBy: reporterName,
        role: "Citizen",
        timestamp: new Date(),
        note: escalationNote,
      },
    ];

    // Bump priority if it was Low or Medium
    let newPriority = complaint.priority;
    if (complaint.priority === "Low" || complaint.priority === "Medium") {
      newPriority = "High";
    } else if (complaint.priority === "High") {
      newPriority = "Critical";
    }

    const updated = await complaintStore.findByIdAndUpdate(complaint._id || complaint.id, {
      isEscalated: true,
      escalationReason: reason.trim(),
      escalationDetails: details ? details.trim() : "",
      lastEscalatedAt: new Date(),
      priority: newPriority,
      statusHistory: updatedHistory,
    });

    res.status(200).json({
      success: true,
      message: "Unresolved complaint report filed successfully! Priority escalated for immediate action.",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. General KPI metrics for dashboard
const getStats = async (req, res) => {
  try {
    const all = await complaintStore.find();
    const total = all.length;
    const pending = all.filter((c) => c.status === "Pending").length;
    const assigned = all.filter((c) => c.status === "Assigned").length;
    const inProgress = all.filter((c) => c.status === "In Progress").length;
    const resolved = all.filter((c) => c.status === "Resolved").length;
    const critical = all.filter((c) => c.priority === "Critical" && c.status !== "Resolved").length;

    const resolvedItems = all.filter((c) => c.status === "Resolved" && c.resolutionHours > 0);
    const avgResolutionHours = resolvedItems.length
      ? Number((resolvedItems.reduce((acc, c) => acc + c.resolutionHours, 0) / resolvedItems.length).toFixed(1))
      : 0;

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        assigned,
        inProgress,
        resolved,
        critical,
        resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
        avgResolutionHours,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  trackComplaintPublic,
  assignComplaint,
  updateResolution,
  submitFeedback,
  reportUnresolved,
  getStats,
};
