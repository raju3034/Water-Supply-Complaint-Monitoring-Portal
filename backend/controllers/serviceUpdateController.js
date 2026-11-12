const { serviceUpdateStore } = require("../data/store");

// 1. Get all service updates & alerts (Public)
const getServiceUpdates = async (req, res) => {
  try {
    const { status, area } = req.query;
    let updates = await serviceUpdateStore.find();

    if (status && status !== "All") {
      updates = updates.filter((u) => u.status === status);
    }
    if (area && area !== "All") {
      updates = updates.filter((u) => u.area.toLowerCase().includes(area.toLowerCase()));
    }

    res.status(200).json({
      success: true,
      count: updates.length,
      data: updates,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Publish new public service update / advisory (Officer & Admin)
const createServiceUpdate = async (req, res) => {
  try {
    const { title, area, type, severity, message, effectiveFrom, effectiveTo } = req.body;

    if (!title || !area || !message) {
      return res.status(400).json({
        success: false,
        message: "Title, Affected Area, and Message are required.",
      });
    }

    const publisher = req.user ? `${req.user.name} (${req.user.role})` : "Water Board Authority";

    const update = await serviceUpdateStore.create({
      title: title.trim(),
      area: area.trim(),
      type: type || "Scheduled Maintenance",
      severity: severity || "Info",
      message: message.trim(),
      effectiveFrom: effectiveFrom || new Date().toISOString().slice(0, 16),
      effectiveTo: effectiveTo || "Until Further Notice",
      status: "Active",
      publishedBy: publisher,
    });

    res.status(201).json({
      success: true,
      message: "Public service update broadcasted successfully.",
      data: update,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Update alert status (Officer & Admin)
const updateServiceUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const update = await serviceUpdateStore.findById(id);
    if (!update) {
      return res.status(404).json({ success: false, message: "Service update not found" });
    }

    const updated = await serviceUpdateStore.findByIdAndUpdate(update._id || update.id, req.body);

    res.status(200).json({
      success: true,
      message: "Service update modified successfully.",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Delete alert (Admin only)
const deleteServiceUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const update = await serviceUpdateStore.findById(id);
    if (!update) {
      return res.status(404).json({ success: false, message: "Service update not found" });
    }

    await serviceUpdateStore.findByIdAndDelete(update._id || update.id);

    res.status(200).json({
      success: true,
      message: "Service update removed.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getServiceUpdates,
  createServiceUpdate,
  updateServiceUpdate,
  deleteServiceUpdate,
};

