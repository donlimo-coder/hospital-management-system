const express = require("express");
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  sendReminder,
} = require("../controllers/appointmentController");
const { protect, authorize } = require("../middleware/auth");
const router = express.Router();
router.post("/", protect, authorize("patient", "admin", "doctor"), createAppointment);
router.get("/", protect, getAppointments);
router.get("/:id", protect, getAppointmentById);
router.put("/:id/status", protect, authorize("doctor", "admin"), updateAppointment);
router.put("/:id/cancel", protect, cancelAppointment);
router.post("/:id/reminder", protect, authorize("doctor", "admin"), sendReminder);
module.exports = router;