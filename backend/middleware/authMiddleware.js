const jwt = require("jsonwebtoken");
const { userStore } = require("../data/store");

// Verify JWT token
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "devops_water_portal_super_secure_jwt_secret_key_2026";
    const decoded = jwt.verify(token, secret);

    const user = await userStore.findById(decoded.userId);

    if (!user || user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: "User account not found or inactive.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
};

// Restrict access by role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${roles.join(", ")}]. Current role: ${req.user ? req.user.role : "None"}`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
