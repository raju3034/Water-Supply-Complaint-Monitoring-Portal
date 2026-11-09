const bcrypt = require("bcryptjs");
const { isMongoActive } = require("../config/db");
const User = require("../models/user");
const Complaint = require("../models/complaint");
const Schedule = require("../models/schedule");
const ServiceUpdate = require("../models/serviceUpdate");
const { seedUsers, seedSchedules, seedComplaints, seedUpdates } = require("./seedData");

// In-Memory collections clone
let memUsers = JSON.parse(JSON.stringify(seedUsers)).map((u, i) => ({
  _id: u._id || `usr_mem_${i + 1}`,
  ...u,
  comparePassword: async function (entered) {
    return bcrypt.compare(entered, this.password);
  },
}));

let memComplaints = JSON.parse(JSON.stringify(seedComplaints)).map((c, i) => ({
  _id: c._id || `cmp_mem_${i + 1}`,
  ...c,
}));
let memSchedules = JSON.parse(JSON.stringify(seedSchedules)).map((s, i) => ({
  _id: s._id || `sch_mem_${i + 1}`,
  ...s,
}));
let memUpdates = JSON.parse(JSON.stringify(seedUpdates)).map((up, i) => ({
  _id: up._id || `upd_mem_${i + 1}`,
  ...up,
}));

// Helpers
const matchesFilter = (item, filter = {}) => {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const [key, val] of Object.entries(filter)) {
    if (val === undefined || val === null) continue;
    if (key === "$or" && Array.isArray(val)) {
      const matchAny = val.some((subFilter) => matchesFilter(item, subFilter));
      if (!matchAny) return false;
      continue;
    }
    if (typeof val === "object" && val.$regex) {
      const regex = new RegExp(val.$regex, val.$options || "i");
      if (!regex.test(item[key] || "")) return false;
      continue;
    }
    if (item[key] != val) return false;
  }
  return true;
};

// User Store
const userStore = {
  find: async (filter = {}) => {
    if (isMongoActive()) {
      return User.find(filter);
    }
    return memUsers.filter((u) => matchesFilter(u, filter));
  },

  findById: async (id) => {
    if (isMongoActive()) {
      return User.findById(id);
    }
    return memUsers.find((u) => u._id === id || u.id === id) || null;
  },

  findOne: async (filter = {}) => {
    if (isMongoActive()) {
      return User.findOne(filter).select("+password");
    }
    const user = memUsers.find((u) => matchesFilter(u, filter));
    return user || null;
  },

  create: async (userData) => {
    if (isMongoActive()) {
      return User.create(userData);
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    const newUser = {
      _id: `usr_${Date.now()}`,
      name: userData.name,
      email: userData.email.toLowerCase().trim(),
      phone: userData.phone,
      password: hashedPassword,
      role: userData.role || "Citizen",
      department: userData.department || "General Operations",
      assignedArea: userData.assignedArea || "All Zones",
      isActive: true,
      createdAt: new Date(),
      comparePassword: async function (entered) {
        return bcrypt.compare(entered, this.password);
      },
    };
    memUsers.push(newUser);
    return newUser;
  },
};

// Complaint Store
const complaintStore = {
  find: async (filter = {}, sort = { createdAt: -1 }) => {
    if (isMongoActive()) {
      return Complaint.find(filter).sort(sort);
    }
    let list = memComplaints.filter((c) => matchesFilter(c, filter));
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  },

  findById: async (id) => {
    if (isMongoActive()) {
      return Complaint.findById(id);
    }
    return (
      memComplaints.find(
        (c) => c._id === id || c.complaintId === id
      ) || null
    );
  },

  findOne: async (filter = {}) => {
    if (isMongoActive()) {
      return Complaint.findOne(filter);
    }
    return memComplaints.find((c) => matchesFilter(c, filter)) || null;
  },

  create: async (data) => {
    if (isMongoActive()) {
      return Complaint.create(data);
    }
    const complaintId = `CMP-${Date.now().toString().slice(-6)}`;
    const newComplaint = {
      _id: `cmp_${Date.now()}`,
      complaintId,
      citizenName: data.citizenName,
      phone: data.phone,
      citizenEmail: data.citizenEmail || "",
      citizenId: data.citizenId || null,
      complaintType: data.complaintType || "Leakage",
      area: data.area,
      address: data.address,
      landmark: data.landmark || "",
      description: data.description,
      priority: data.priority || "Medium",
      status: "Pending",
      assignedOfficer: null,
      assignedOfficerName: "Unassigned",
      assignedTechnician: null,
      assignedTechnicianName: "Unassigned",
      targetResolutionDate: "",
      resolutionNote: "",
      actionTaken: "",
      materialUsed: "",
      resolvedAt: null,
      resolutionHours: 0,
      citizenRating: null,
      citizenFeedback: "",
      statusHistory: [
        {
          status: "Pending",
          updatedBy: data.citizenName,
          role: "Citizen",
          timestamp: new Date(),
          note: "Complaint submitted via portal.",
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memComplaints.unshift(newComplaint);
    return newComplaint;
  },

  findByIdAndUpdate: async (id, updates) => {
    if (isMongoActive()) {
      return Complaint.findByIdAndUpdate(id, updates, { new: true });
    }
    const idx = memComplaints.findIndex(
      (c) => c._id === id || c.complaintId === id
    );
    if (idx === -1) return null;

    memComplaints[idx] = {
      ...memComplaints[idx],
      ...updates,
      updatedAt: new Date(),
    };
    return memComplaints[idx];
  },

  countDocuments: async (filter = {}) => {
    if (isMongoActive()) {
      return Complaint.countDocuments(filter);
    }
    return memComplaints.filter((c) => matchesFilter(c, filter)).length;
  },
};

// Schedule Store
const scheduleStore = {
  find: async (filter = {}) => {
    if (isMongoActive()) {
      return Schedule.find(filter).sort({ area: 1 });
    }
    let list = memSchedules.filter((s) => matchesFilter(s, filter));
    list.sort((a, b) => a.area.localeCompare(b.area));
    return list;
  },

  findById: async (id) => {
    if (isMongoActive()) {
      return Schedule.findById(id);
    }
    return memSchedules.find((s) => s._id === id || s.scheduleId === id) || null;
  },

  create: async (data) => {
    if (isMongoActive()) {
      return Schedule.create(data);
    }
    const scheduleId = `SCH-${Date.now().toString().slice(-4)}`;
    const newSchedule = {
      _id: `sch_${Date.now()}`,
      scheduleId,
      area: data.area,
      wardNumber: data.wardNumber || "Ward 1",
      morningSupply: data.morningSupply || "06:00 AM - 08:30 AM",
      eveningSupply: data.eveningSupply || "06:00 PM - 08:00 PM",
      supplyDays: data.supplyDays || "Daily",
      durationHours: Number(data.durationHours) || 4.5,
      source: data.source || "Central Reservoir",
      pressureLevel: data.pressureLevel || "Normal",
      status: data.status || "On Time",
      remarks: data.remarks || "Regular scheduled supply.",
      publishedBy: data.publishedBy || "Water Department Operations",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memSchedules.push(newSchedule);
    return newSchedule;
  },

  findByIdAndUpdate: async (id, updates) => {
    if (isMongoActive()) {
      return Schedule.findByIdAndUpdate(id, updates, { new: true });
    }
    const idx = memSchedules.findIndex(
      (s) => s._id === id || s.scheduleId === id
    );
    if (idx === -1) return null;

    memSchedules[idx] = {
      ...memSchedules[idx],
      ...updates,
      updatedAt: new Date(),
    };
    return memSchedules[idx];
  },

  findByIdAndDelete: async (id) => {
    if (isMongoActive()) {
      return Schedule.findByIdAndDelete(id);
    }
    const idx = memSchedules.findIndex(
      (s) => s._id === id || s.scheduleId === id
    );
    if (idx === -1) return null;
    const removed = memSchedules.splice(idx, 1);
    return removed[0];
  },
};

// Service Updates Store
const serviceUpdateStore = {
  find: async (filter = {}) => {
    if (isMongoActive()) {
      return ServiceUpdate.find(filter).sort({ createdAt: -1 });
    }
    let list = memUpdates.filter((u) => matchesFilter(u, filter));
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  },

  findById: async (id) => {
    if (isMongoActive()) {
      return ServiceUpdate.findById(id);
    }
    return memUpdates.find((u) => u._id === id || u.updateId === id) || null;
  },

  create: async (data) => {
    if (isMongoActive()) {
      return ServiceUpdate.create(data);
    }
    const updateId = `ALR-${Date.now().toString().slice(-4)}`;
    const newUpdate = {
      _id: `upd_${Date.now()}`,
      updateId,
      title: data.title,
      area: data.area,
      type: data.type || "Scheduled Maintenance",
      severity: data.severity || "Info",
      message: data.message,
      effectiveFrom: data.effectiveFrom,
      effectiveTo: data.effectiveTo,
      status: data.status || "Active",
      publishedBy: data.publishedBy || "Municipal Water Board",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memUpdates.unshift(newUpdate);
    return newUpdate;
  },

  findByIdAndUpdate: async (id, updates) => {
    if (isMongoActive()) {
      return ServiceUpdate.findByIdAndUpdate(id, updates, { new: true });
    }
    const idx = memUpdates.findIndex(
      (u) => u._id === id || u.updateId === id
    );
    if (idx === -1) return null;

    memUpdates[idx] = {
      ...memUpdates[idx],
      ...updates,
      updatedAt: new Date(),
    };
    return memUpdates[idx];
  },

  findByIdAndDelete: async (id) => {
    if (isMongoActive()) {
      return ServiceUpdate.findByIdAndDelete(id);
    }
    const idx = memUpdates.findIndex(
      (u) => u._id === id || u.updateId === id
    );
    if (idx === -1) return null;
    const removed = memUpdates.splice(idx, 1);
    return removed[0];
  },
};

module.exports = {
  userStore,
  complaintStore,
  scheduleStore,
  serviceUpdateStore,
};

