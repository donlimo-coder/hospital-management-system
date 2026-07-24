const express = require("express");
const { getDoctors, getDoctorById, updateDoctor, deleteDoctor } = require("../controllers/doctorController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", getDoctors); // public: browse doctors
router.get("/:id", getDoctorById); // public: view doctor profile
router.put("/:id", protect, authorize("admin", "doctor"), updateDoctor);
router.delete("/:id", protect, authorize("admin"), deleteDoctor);

module.exports = router;
