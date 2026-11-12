const { scheduleStore } = require("../data/store");

// 1. Get all published water schedules (Public endpoint)
const getSchedules = async (req, res) => {
  try {
    const { area, status, ward } = req.query;
    let schedules = await scheduleStore.find();

    if (area && area !== "All") {
      schedules = schedules.filter((s) => s.area.toLowerCase().includes(area.toLowerCase()));
    }
    if (ward && ward !== "All") {
      schedules = schedules.filter((s) => s.wardNumber.toLowerCase() === ward.toLowerCase());
    }
    if (status && status !== "All") {
      schedules = schedules.filter((s) => s.status === status);
    }

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get schedule by ID
const getScheduleById = async (req, res) => {
  try {
    const schedule = await scheduleStore.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: "Water supply schedule not found" });
    }
    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    res.status(400).json({ success: false, message: "Invalid schedule ID" });
  }
};

// 3. Create/Publish new area water supply schedule (Officer/Admin only)
const createSchedule = async (req, res) => {
  try {
    const {
      area,
      wardNumber,
      morningSupply,
      eveningSupply,
      supplyDays,
      durationHours,
      source,
      pressureLevel,
      status,
      remarks,
    } = req.body;

    if (!area || !wardNumber || !source) {
      return res.status(400).json({
        success: false,
        message: "Area, Ward Number, and Water Source are required.",
      });
    }

    const publisher = req.user ? `${req.user.name} (${req.user.role})` : "Water Department";

    const schedule = await scheduleStore.create({
      area: area.trim(),
      wardNumber: wardNumber.trim(),
      morningSupply: morningSupply || "06:00 AM - 08:30 AM",
      eveningSupply: eveningSupply || "06:00 PM - 08:00 PM",
      supplyDays: supplyDays || "Daily",
      durationHours: Number(durationHours) || 4.5,
      source: source.trim(),
      pressureLevel: pressureLevel || "Normal",
      status: status || "On Time",
      remarks: remarks || "Normal scheduled supply.",
      publishedBy: publisher,
    });

    res.status(201).json({
      success: true,
      message: `Water supply schedule published for ${schedule.area}.`,
      data: schedule,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update an existing schedule (Officer/Admin only)
const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await scheduleStore.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: "Schedule not found" });
    }

    const publisher = req.user ? `${req.user.name} (${req.user.role})` : schedule.publishedBy;

    const updated = await scheduleStore.findByIdAndUpdate(schedule._id || schedule.id, {
      ...req.body,
      publishedBy: publisher,
    });

    res.status(200).json({
      success: true,
      message: `Schedule for ${updated.area} successfully updated.`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Delete a schedule (Admin only)
const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await scheduleStore.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: "Schedule not found" });
    }

    await scheduleStore.findByIdAndDelete(schedule._id || schedule.id);

    res.status(200).json({
      success: true,
      message: "Schedule deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};

