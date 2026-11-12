const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Reads the Bearer token (if any) and attaches req.user and req.clinicId.
// Returns "ok", "missing" (no token sent) or "inactive" (user gone/disabled).
// Throws if the token itself is invalid or expired.
const resolveUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return "missing";

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) return "inactive";

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
  return "ok";
};

// Verifies JWT and attaches the user (and their clinic) to the request
const protect = async (req, res, next) => {
  try {
    const result = await resolveUser(req);
    if (result === "missing") {
      return res.status(401).json({ message: "Not authorized, no token provided" });
    }
    if (result === "inactive") {
      return res.status(401).json({ message: "Not authorized, user not found or inactive" });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token invalid or expired" });
  }
};

// For public routes: if a valid token is sent, scope the request to that
// user's clinic. If there is no token (or it's invalid), carry on as an
// anonymous visitor exactly like before.
const optionalAuth = async (req, res, next) => {
  try {
    await resolveUser(req);
  } catch (err) {
    // ignore: treated as anonymous
  }
  next();
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

module.exports = { protect, optionalAuth, authorize };