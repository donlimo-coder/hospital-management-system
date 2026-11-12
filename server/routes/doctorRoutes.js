const express = require("express");
const { getDoctors, getDoctorById, updateDoctor, deleteDoctor, getDoctorAvailability } = require("../controllers/doctorController");
const { protect, optionalAuth, authorize } = require("../middleware/auth");

const router = express.Router();

// Browsing stays open to visitors, but a logged-in user only sees their own clinic's doctors
router.get("/", optionalAuth, getDoctors);
router.get("/:id", optionalAuth, getDoctorById);
router.get("/:id/availability", optionalAuth, getDoctorAvailability);
router.put("/:id", protect, authorize("admin", "doctor"), updateDoctor);
router.delete("/:id", protect, authorize("admin"), deleteDoctor);

module.exports = router;