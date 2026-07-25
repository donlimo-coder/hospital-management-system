const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOT_MINUTES = 30;

const timeToMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const minutesToTime = (mins) => {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
};

// @route GET /api/doctors/:id/availability?date=YYYY-MM-DD
// @desc  Returns bookable 30-min time slots for a doctor on a given date,
//        based on their weekly schedule, minus slots already booked.
const getDoctorAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "date (YYYY-MM-DD) is required" });

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const dayAbbr = DAY_ABBR[new Date(`${date}T00:00:00Z`).getUTCDay()];
    const windows = doctor.availability.filter((a) => a.day === dayAbbr);

    if (!windows.length) {
      return res.json({ date, day: dayAbbr, slots: [] });
    }

    const booked = await Appointment.find({
      doctor: doctor._id,
      date,
      status: { $ne: "cancelled" },
    }).select("time");
    const bookedTimes = new Set(booked.map((b) => b.time));

    const slots = [];
    for (const w of windows) {
      let start = timeToMinutes(w.startTime);
      const end = timeToMinutes(w.endTime);
      while (start + SLOT_MINUTES <= end) {
        const slotTime = minutesToTime(start);
        slots.push({ time: slotTime, available: !bookedTimes.has(slotTime) });
        start += SLOT_MINUTES;
      }
    }

    res.json({ date, day: dayAbbr, slots });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/doctors
// @desc  List doctors, optionally filtered by specialization (?specialization=Cardiologist)
const getDoctors = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.specialization) {
      filter.specialization = new RegExp(req.query.specialization, "i");
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [doctors, total] = await Promise.all([
      Doctor.find(filter).skip(skip).limit(limit).sort({ name: 1 }),
      Doctor.countDocuments(filter),
    ]);

    res.json({ doctors, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ doctor });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/doctors/:id  (admin, or the doctor themself)
const updateDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const isOwner = req.user.doctorProfile && req.user.doctorProfile.toString() === doctor._id.toString();
    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({ message: "Not authorized to update this doctor profile" });
    }

    const allowedFields = [
      "specialization",
      "experienceYears",
      "consultationFee",
      "availability",
      "bio",
      "isAcceptingPatients",
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) doctor[field] = req.body[field];
    });

    await doctor.save();
    res.json({ doctor });
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/doctors/:id (admin only)
const deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ message: "Doctor removed" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDoctors, getDoctorById, updateDoctor, deleteDoctor, getDoctorAvailability };