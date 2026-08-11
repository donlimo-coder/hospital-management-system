const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies JWT and attaches the user (and their clinic) to the request
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Not authorized, user not found or inactive" });
    }

    req.user = user;

    if (user.role === "superadmin") {
      // Super-admin sees all clinics by default (req.clinicId = null means "no filter").
      // They can optionally scope to one clinic via ?clinicId=xxx
      req.clinicId = req.query.clinicId || null;
    } else {
      // Always trust the user's current clinic from the DB, not the token's
      // clinicId claim, in case they were ever reassigned to another clinic.
      req.clinicId = user.clinic;
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token invalid or expired" });
  }
};

// Restrict route to specific roles: authorize("admin", "doctor")
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role permissions" });
    }
    next();
  };
};

module.exports = { protect, authorize };