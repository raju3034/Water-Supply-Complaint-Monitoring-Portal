const mongoose = require("mongoose");
const { seedUsers, seedSchedules, seedComplaints, seedUpdates } = require("../data/seedData");
const User = require("../models/user");
const Complaint = require("../models/complaint");
const Schedule = require("../models/schedule");
const ServiceUpdate = require("../models/serviceUpdate");

let isMongo = false;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/water_supply_portal";
  console.log(`Connecting to MongoDB at: ${uri}`);

  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    isMongo = true;
    console.log("MongoDB connected successfully");

    // Seed initial data if database is empty
    await seedMongoIfEmpty();
  } catch (error) {
    isMongo = false;
    console.warn(
      `MongoDB connection failed (${error.message}). Using resilient in-memory storage mode.`
    );
  }
};

const seedMongoIfEmpty = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log("Seeding MongoDB users...");
      await User.insertMany(seedUsers);
    }

    const scheduleCount = await Schedule.countDocuments();
    if (scheduleCount === 0) {
      console.log("Seeding MongoDB schedules...");
      await Schedule.insertMany(seedSchedules);
    }

    const complaintCount = await Complaint.countDocuments();
    if (complaintCount === 0) {
      console.log("Seeding MongoDB complaints...");
      await Complaint.insertMany(seedComplaints);
    }

    const updateCount = await ServiceUpdate.countDocuments();
    if (updateCount === 0) {
      console.log("Seeding MongoDB service updates...");
      await ServiceUpdate.insertMany(seedUpdates);
    }
  } catch (err) {
    console.warn("MongoDB initial seed note:", err.message);
  }
};

const getDbMode = () => {
  return isMongo ? "MongoDB (Active)" : "In-Memory Store (Resilient Evaluation Mode)";
};

const isMongoActive = () => isMongo;

module.exports = {
  connectDB,
  getDbMode,
  isMongoActive,
};
