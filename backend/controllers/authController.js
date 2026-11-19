const jwt = require("jsonwebtoken");
const { userStore } = require("../data/store");

const JWT_SECRET = process.env.JWT_SECRET || "devops_water_portal_super_secure_jwt_secret_key_2026";

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id || user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Citizen registration
const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, assignedArea } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: name, email, phone, password",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await userStore.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email is already registered",
      });
    }

    // Public registration must never grant staff or administrator roles.
    const userRole = "Citizen";

    const user = await userStore.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      role: userRole,
      assignedArea: assignedArea || "Ward 1 - Old Town Heritage",
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department,
        assignedArea: user.assignedArea,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

// User login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await userStore.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your account is marked inactive. Contact municipal support.",
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department,
        assignedArea: user.assignedArea,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

// Current logged in user info
const getCurrentUser = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id || req.user.id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        department: req.user.department,
        assignedArea: req.user.assignedArea,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get officers & technicians roster (for complaint assignment dropdowns)
const getStaffRoster = async (req, res) => {
  try {
    const allUsers = await userStore.find();
    const staff = allUsers
      .filter((u) => ["Water Department Officer", "Field Technician"].includes(u.role))
      .map((u) => ({
        id: u._id || u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        assignedArea: u.assignedArea,
      }));

    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Provide demo accounts list for evaluation convenience
const getDemoCredentials = async (req, res) => {
  res.status(200).json({
    success: true,
    data: [
      {
        role: "Admin",
        label: "Administrator",
        email: "admin@jalconnect.gov.in",
        password: "Admin@1234",
        badge: "Full System Control",
      },
      {
        role: "Water Department Officer",
        label: "Department Officer",
        email: "officer@jalconnect.gov.in",
        password: "Officer@1234",
        badge: "Assignment & Schedules",
      },
      {
        role: "Field Technician",
        label: "Field Technician",
        email: "technician@jalconnect.gov.in",
        password: "Tech@1234",
        badge: "Resolution & Work Logs",
      },
      {
        role: "Citizen",
        label: "Citizen Consumer",
        email: "citizen@example.com",
        password: "Citizen@1234",
        badge: "Lodge & Track Issues",
      },
    ],
  });
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  getStaffRoster,
  getDemoCredentials,
};
