const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const { sendSMS } = require("../utils/sms");

// @route POST /api/appointments (patient, or admin/doctor booking on a patient's behalf)
// @desc  Book an appointment. Prevents double-booking a doctor's slot.
const createAppointment = async (req, res, next) => {
  try {
    const { doctorId, date, time, reason, patientId } = req.body;
    if (!doctorId || !date || !time) {
      return res.status(400).json({ message: "doctorId, date and time are required" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    if (!doctor.isAcceptingPatients) {
      return res.status(400).json({ message: "This doctor is not currently accepting new appointments" });
    }

    // A logged-in patient books for themself; front-desk staff can book for
    // a walk-in patient by passing patientId (found via member number lookup).
    let targetPatientId;
    if (["admin", "doctor"].includes(req.user.role)) {
      if (!patientId) {
        return res.status(400).json({ message: "patientId is required when staff book on a patient's behalf" });
      }
      targetPatientId = patientId;
    } else {
      if (!req.user.patientProfile) {
        return res.status(400).json({ message: "Only patient accounts can book appointments" });
      }
      targetPatientId = req.user.patientProfile;
    }

    // The unique index on (doctor, date, time) also guards this at the DB level,
    // but we check first to return a friendlier error message.
    const conflict = await Appointment.findOne({ doctor: doctorId, date, time, status: { $ne: "cancelled" } });
    if (conflict) {
      return res.status(409).json({ message: "This time slot is already booked. Please choose another." });
    }

    const appointment = await Appointment.create({
      patient: targetPatientId,
      doctor: doctorId,
      date,
      time,
      reason,
      source: ["admin", "doctor"].includes(req.user.role) ? "walk-in" : "online",
    });
    });

    // Fire off a booking confirmation SMS. This never blocks or fails the
    // booking itself — sendSMS() swallows its own errors.
    const patientRecord = await Patient.findById(targetPatientId);
    if (patientRecord?.phone) {
      const doctorName = doctor.name || "your doctor";
      sendSMS(
        patientRecord.phone,
        `Hospital: Your appointment with Dr. ${doctorName} is confirmed for ${date} at ${time}.`
      );
    }

    res.status(201).json({ appointment });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "This time slot is already booked. Please choose another." });
    }
    next(err);
  }
};

// @route GET /api/appointments (role-aware: patient sees own, doctor sees own, admin sees all)
const getAppointments = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === "patient") filter.patient = req.user.patientProfile;
    if (req.user.role === "doctor") filter.doctor = req.user.doctorProfile;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.date) filter.date = req.query.date;

    const appointments = await Appointment.find(filter)
      .populate("patient", "name age gender")
      .populate("doctor", "name specialization consultationFee")
      .sort({ date: 1, time: 1 });

    res.json({ appointments });
  } catch (err) {
    next(err);
  }
};

const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patient", "name age gender")
      .populate("doctor", "name specialization consultationFee");
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    const isPatientOwner = req.user.role === "patient" && appointment.patient._id.toString() === req.user.patientProfile?.toString();
    const isDoctorOwner = req.user.role === "doctor" && appointment.doctor._id.toString() === req.user.doctorProfile?.toString();
    if (req.user.role !== "admin" && !isPatientOwner && !isDoctorOwner) {
      return res.status(403).json({ message: "Not authorized to view this appointment" });
    }

    res.json({ appointment });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/appointments/:id/status (doctor, admin)
// @desc  Update status, add diagnosis/prescription (consultation outcome)
const updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    const isDoctorOwner = req.user.role === "doctor" && appointment.doctor.toString() === req.user.doctorProfile?.toString();
    if (req.user.role !== "admin" && !isDoctorOwner) {
      return res.status(403).json({ message: "Not authorized to update this appointment" });
    }

    const allowedFields = ["status", "diagnosis", "prescription", "followUpDate"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) appointment[field] = req.body[field];
    });

   await appointment.save();
    await appointment.populate("patient", "name age gender");
    await appointment.populate("doctor", "name specialization consultationFee");
    res.json({ appointment });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/appointments/:id/cancel (patient who owns it, or admin)
const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    const isPatientOwner = req.user.role === "patient" && appointment.patient.toString() === req.user.patientProfile?.toString();
    if (req.user.role !== "admin" && !isPatientOwner) {
      return res.status(403).json({ message: "Not authorized to cancel this appointment" });
    }

    appointment.status = "cancelled";
    await appointment.save();
    res.json({ appointment });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/appointments/:id/reminder (doctor, admin)
// @desc  Manually trigger a reminder SMS for a specific appointment
const sendReminder = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patient", "name phone")
      .populate("doctor", "name");
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    if (!appointment.patient?.phone) {
      return res.status(400).json({ message: "This patient has no phone number on file" });
    }

    const result = await sendSMS(
      appointment.patient.phone,
      `Hospital reminder: You have an appointment with Dr. ${appointment.doctor.name} on ${appointment.date} at ${appointment.time}.`
    );

    res.json({ message: "Reminder sent", result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  sendReminder,
};