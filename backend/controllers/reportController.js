const { complaintStore, scheduleStore, userStore } = require("../data/store");

// 1. Complaint Status Report
const getComplaintStatusReport = async (req, res) => {
  try {
    const complaints = await complaintStore.find();
    const total = complaints.length;

    const pending = complaints.filter((c) => c.status === "Pending").length;
    const assigned = complaints.filter((c) => c.status === "Assigned").length;
    const inProgress = complaints.filter((c) => c.status === "In Progress").length;
    const resolved = complaints.filter((c) => c.status === "Resolved").length;

    const priorityBreakdown = {
      Low: complaints.filter((c) => c.priority === "Low").length,
      Medium: complaints.filter((c) => c.priority === "Medium").length,
      High: complaints.filter((c) => c.priority === "High").length,
      Critical: complaints.filter((c) => c.priority === "Critical").length,
    };

    const typeBreakdown = {
      Leakage: complaints.filter((c) => c.complaintType === "Leakage").length,
      "Water Shortage": complaints.filter((c) => c.complaintType === "Water Shortage").length,
      "Water Quality": complaints.filter((c) => c.complaintType === "Water Quality").length,
      "Low Pressure": complaints.filter((c) => c.complaintType === "Low Pressure").length,
      "Pipeline Damage": complaints.filter((c) => c.complaintType === "Pipeline Damage").length,
    };

    res.status(200).json({
      success: true,
      reportName: "Complaint Status Report",
      generatedAt: new Date().toISOString(),
      summary: {
        total,
        pending,
        assigned,
        inProgress,
        resolved,
        resolutionRatePercent: total ? Math.round((resolved / total) * 100) : 0,
        activeWorkload: pending + assigned + inProgress,
      },
      priorityBreakdown,
      typeBreakdown,
      details: complaints.map((c) => ({
        id: c.complaintId,
        citizenName: c.citizenName,
        phone: c.phone,
        type: c.complaintType,
        area: c.area,
        priority: c.priority,
        status: c.status,
        assignedTechnician: c.assignedTechnicianName || "None",
        createdAt: c.createdAt,
        resolvedAt: c.resolvedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Area-wise Complaint Report
const getAreaWiseReport = async (req, res) => {
  try {
    const complaints = await complaintStore.find();

    const areaMap = {};

    complaints.forEach((c) => {
      const area = c.area || "Unspecified Area";
      if (!areaMap[area]) {
        areaMap[area] = {
          area,
          total: 0,
          leakage: 0,
          shortage: 0,
          quality: 0,
          lowPressure: 0,
          pipelineDamage: 0,
          pending: 0,
          assigned: 0,
          inProgress: 0,
          resolved: 0,
        };
      }

      areaMap[area].total += 1;
      if (c.complaintType === "Leakage") areaMap[area].leakage += 1;
      else if (c.complaintType === "Water Shortage") areaMap[area].shortage += 1;
      else if (c.complaintType === "Water Quality") areaMap[area].quality += 1;
      else if (c.complaintType === "Low Pressure") areaMap[area].lowPressure += 1;
      else if (c.complaintType === "Pipeline Damage") areaMap[area].pipelineDamage += 1;

      if (c.status === "Pending") areaMap[area].pending += 1;
      else if (c.status === "Assigned") areaMap[area].assigned += 1;
      else if (c.status === "In Progress") areaMap[area].inProgress += 1;
      else if (c.status === "Resolved") areaMap[area].resolved += 1;
    });

    const areaRows = Object.values(areaMap).map((row) => {
      const openCount = row.pending + row.assigned + row.inProgress;
      const rate = row.total > 0 ? Math.round((row.resolved / row.total) * 100) : 100;
      let health = "Good";
      if (openCount >= 3 || row.quality > 0) health = "Attention Needed";
      else if (openCount > 0) health = "Moderate";

      return {
        ...row,
        openCount,
        resolutionRatePercent: rate,
        health,
      };
    });

    // Sort by highest complaint volume
    areaRows.sort((a, b) => b.total - a.total);

    res.status(200).json({
      success: true,
      reportName: "Area-wise Complaint Report",
      generatedAt: new Date().toISOString(),
      totalAreasMonitored: areaRows.length,
      areas: areaRows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Water Supply Schedule Report
const getWaterSupplyScheduleReport = async (req, res) => {
  try {
    const schedules = await scheduleStore.find();
    const total = schedules.length;

    const onTime = schedules.filter((s) => s.status === "On Time").length;
    const delayed = schedules.filter((s) => s.status === "Delayed").length;
    const maintenance = schedules.filter((s) => s.status === "Under Maintenance").length;
    const interrupted = schedules.filter((s) => s.status === "Interrupted").length;

    const totalHours = schedules.reduce((sum, s) => sum + (s.durationHours || 4), 0);
    const avgDailySupplyHours = total > 0 ? Number((totalHours / total).toFixed(1)) : 0;
    const complianceRate = total > 0 ? Math.round((onTime / total) * 100) : 100;

    res.status(200).json({
      success: true,
      reportName: "Water Supply Schedule Report",
      generatedAt: new Date().toISOString(),
      summary: {
        totalSchedules: total,
        onTimeCount: onTime,
        delayedCount: delayed,
        maintenanceCount: maintenance,
        interruptedCount: interrupted,
        complianceRatePercent: complianceRate,
        avgDailySupplyHours,
      },
      schedules: schedules.map((s) => ({
        id: s.scheduleId,
        ward: s.wardNumber,
        area: s.area,
        source: s.source,
        morningWindow: s.morningSupply,
        eveningWindow: s.eveningSupply,
        days: s.supplyDays,
        dailyHours: s.durationHours,
        pressure: s.pressureLevel,
        status: s.status,
        remarks: s.remarks,
        publishedBy: s.publishedBy,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Resolution Time Report
const getResolutionTimeReport = async (req, res) => {
  try {
    const complaints = await complaintStore.find();
    const resolvedComplaints = complaints.filter((c) => c.status === "Resolved");

    // Overall Average Resolution Time
    const totalResolved = resolvedComplaints.length;
    const totalHours = resolvedComplaints.reduce((acc, c) => acc + (c.resolutionHours || 4.5), 0);
    const overallAvgHours = totalResolved > 0 ? Number((totalHours / totalResolved).toFixed(1)) : 0;

    // Type-wise Resolution Time
    const typeGroup = {};
    complaints.forEach((c) => {
      const t = c.complaintType;
      if (!typeGroup[t]) {
        typeGroup[t] = { type: t, total: 0, resolved: 0, sumHours: 0 };
      }
      typeGroup[t].total += 1;
      if (c.status === "Resolved") {
        typeGroup[t].resolved += 1;
        typeGroup[t].sumHours += c.resolutionHours || 4.5;
      }
    });

    const categoryResolution = Object.values(typeGroup).map((cg) => ({
      complaintType: cg.type,
      totalLodged: cg.total,
      totalResolved: cg.resolved,
      avgResolutionHours: cg.resolved > 0 ? Number((cg.sumHours / cg.resolved).toFixed(1)) : 0,
    }));

    // Technician Performance
    const techMap = {};
    complaints.forEach((c) => {
      if (c.assignedTechnicianName && c.assignedTechnicianName !== "Unassigned") {
        const name = c.assignedTechnicianName;
        if (!techMap[name]) {
          techMap[name] = {
            technicianName: name,
            assignedCount: 0,
            resolvedCount: 0,
            totalHours: 0,
            ratings: [],
          };
        }
        techMap[name].assignedCount += 1;
        if (c.status === "Resolved") {
          techMap[name].resolvedCount += 1;
          techMap[name].totalHours += c.resolutionHours || 5;
          if (c.citizenRating) techMap[name].ratings.push(c.citizenRating);
        }
      }
    });

    const technicianMetrics = Object.values(techMap).map((t) => {
      const avgHours = t.resolvedCount > 0 ? Number((t.totalHours / t.resolvedCount).toFixed(1)) : 0;
      const avgRating = t.ratings.length
        ? Number((t.ratings.reduce((a, b) => a + b, 0) / t.ratings.length).toFixed(1))
        : 5.0;
      const efficiency = t.assignedCount > 0 ? Math.round((t.resolvedCount / t.assignedCount) * 100) : 0;
      return {
        technicianName: t.technicianName,
        assignedCount: t.assignedCount,
        resolvedCount: t.resolvedCount,
        avgResolutionHours: avgHours,
        citizenRatingAvg: avgRating,
        completionEfficiencyPercent: efficiency,
      };
    });

    res.status(200).json({
      success: true,
      reportName: "Resolution Time & Efficiency Report",
      generatedAt: new Date().toISOString(),
      summary: {
        totalResolved,
        overallAvgHours,
        fastestResolutionHours: resolvedComplaints.length
          ? Math.min(...resolvedComplaints.map((c) => c.resolutionHours || 99))
          : 0,
        longestResolutionHours: resolvedComplaints.length
          ? Math.max(...resolvedComplaints.map((c) => c.resolutionHours || 0))
          : 0,
      },
      categoryResolution,
      technicianMetrics,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getComplaintStatusReport,
  getAreaWiseReport,
  getWaterSupplyScheduleReport,
  getResolutionTimeReport,
};

