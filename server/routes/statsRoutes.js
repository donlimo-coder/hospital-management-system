const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Bill = require("../models/Bill");

const router = express.Router();

// @route GET /api/stats/overview (admin only)
router.get("/overview", protect, authorize("admin"), async (req, res, next) => {
  try {
    const [doctorCount, patientCount, appointmentCount, pendingAppointments, revenueAgg] = await Promise.all([
      Doctor.countDocuments(),
      Patient.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: "pending" }),
      Bill.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
    ]);

    res.json({
      doctorCount,
      patientCount,
      appointmentCount,
      pendingAppointments,
      totalRevenue: revenueAgg[0]?.total || 0,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
