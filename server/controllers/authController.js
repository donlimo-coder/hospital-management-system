const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { sendSMS } = require("../utils/sms");

// Reduces any Kenyan phone format (0722..., 254722..., +254722...) down to
// the last 9 digits, so we can match a stored number regardless of how it
// was originally saved.
const phoneSuffix = (phone) => phone.replace(/\D/g, "").slice(-9);
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

// @route POST /api/auth/forgot-password
// @desc  Generate a 6-digit reset code, SMS it to the user's phone
const forgotPassword = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "phone is required" });

    const suffix = phoneSuffix(phone);
    const user = await User.findOne({ phone: { $regex: suffix + "$" } });
    // Respond the same way whether or not the number matches an account,
    // so we don't reveal which phone numbers are registered.
    if (user) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const salt = await bcrypt.genSalt(10);
      user.resetPasswordCode = await bcrypt.hash(code, salt);
      user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
      await user.save();

      await sendSMS(`+254${suffix}`, `Hospital: Your password reset code is ${code}. It expires in 10 minutes.`);
    }

    res.json({ message: "If an account exists for this number, a reset code has been sent." });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/reset-password
// @desc  Verify the code and set a new password
const resetPassword = async (req, res, next) => {
  try {
    const { phone, code, newPassword } = req.body;
    if (!phone || !code || !newPassword) {
      return res.status(400).json({ message: "phone, code and newPassword are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const suffix = phoneSuffix(phone);
    const user = await User.findOne({ phone: { $regex: suffix + "$" } }).select("+resetPasswordCode +resetPasswordExpires");
    if (!user || !user.resetPasswordCode || !user.resetPasswordExpires) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }
    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: "This reset code has expired. Please request a new one." });
    }

    const isValidCode = await bcrypt.compare(code, user.resetPasswordCode);
    if (!isValidCode) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    user.password = newPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful. You can now log in with your new password." });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };
