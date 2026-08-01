const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// @route POST /api/auth/register
// @desc  Register a user as patient, doctor, or admin
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, doctorInfo, patientInfo } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    // Only admins should be able to create other admins/doctors in a real system.
    // For this MVP, self-registration is allowed but doctor accounts should
    // normally be provisioned by an admin. We keep it open for demo purposes.
    const user = await User.create({
      name,
      email,
      password,
      role: role || "patient",
      phone,
    });

    if (user.role === "doctor") {
    const doctor = await Doctor.create({
        user: user._id,
        name,
        specialization: doctorInfo?.specialization || "General Practice",
        experienceYears: doctorInfo?.experienceYears || 0,
        consultationFee: doctorInfo?.consultationFee || 0,
      });
      user.doctorProfile = doctor._id;
      await user.save();
    } else if (user.role === "patient") {
        const patient = await Patient.create({
        user: user._id,
        name,
        age: patientInfo?.age,
        gender: patientInfo?.gender,
        address: patientInfo?.address,
        phone,
      });
      user.patientProfile = patient._id;
      await user.save();
    }
    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "This account has been deactivated" });
    }

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    res.json({ user: req.user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
