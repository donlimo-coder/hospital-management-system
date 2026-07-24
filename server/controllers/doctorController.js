const Doctor = require("../models/Doctor");

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

module.exports = { getDoctors, getDoctorById, updateDoctor, deleteDoctor };
