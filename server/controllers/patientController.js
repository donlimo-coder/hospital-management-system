const Patient = require("../models/Patient");
const cloudinary = require("../config/cloudinary");

// @route GET /api/patients (admin, doctor)
const getPatients = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

   const filter = {};
    if (req.query.search) {
      const search = req.query.search.trim();
      filter.$or = [
        { name: new RegExp(search, "i") },
        { memberNumber: new RegExp(search, "i") },
        { phone: new RegExp(search, "i") },
      ];
    }
    const [patients, total] = await Promise.all([
      Patient.find(filter).skip(skip).limit(limit).sort({ name: 1 }),
      Patient.countDocuments(filter),
    ]);

    res.json({ patients, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/patients/:id
const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const isOwner = req.user.patientProfile && req.user.patientProfile.toString() === patient._id.toString();
    if (!["admin", "doctor"].includes(req.user.role) && !isOwner) {
      return res.status(403).json({ message: "Not authorized to view this patient record" });
    }

    res.json({ patient });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/patients/:id
const updatePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const isOwner = req.user.patientProfile && req.user.patientProfile.toString() === patient._id.toString();
    if (!["admin", "doctor"].includes(req.user.role) && !isOwner) {
      return res.status(403).json({ message: "Not authorized to update this patient record" });
    }
const allowedFields = ["name", "age", "gender", "address", "phone"];
       allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) patient[field] = req.body[field];
    });

    // Only doctors/admins can append medical history entries
    if (req.body.medicalHistoryEntry && ["admin", "doctor"].includes(req.user.role)) {
      patient.medicalHistory.push(req.body.medicalHistoryEntry);
    }

    await patient.save();
    res.json({ patient });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/patients/:id/reports  (multipart/form-data, field name "file")
// @desc  Upload a lab report / X-ray / scanned document for a patient.
//        Doctors/admins can upload for any patient; a patient can upload for themself.
const uploadReport = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const isOwner = req.user.patientProfile && req.user.patientProfile.toString() === patient._id.toString();
    if (!["admin", "doctor"].includes(req.user.role) && !isOwner) {
      return res.status(403).json({ message: "Not authorized to upload reports for this patient" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded. Attach a file under the 'file' field." });
    }

    patient.reports.push({
      label: req.body.label || req.file.originalname,
      url: req.file.path, // Cloudinary secure URL
      publicId: req.file.filename, // Cloudinary public_id
      uploadedBy: req.user._id,
    });

    await patient.save();
    res.status(201).json({ report: patient.reports[patient.reports.length - 1] });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/patients/:id/reports
const getReports = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id).select("reports");
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const isOwner = req.user.patientProfile && req.user.patientProfile.toString() === patient._id.toString();
    if (!["admin", "doctor"].includes(req.user.role) && !isOwner) {
      return res.status(403).json({ message: "Not authorized to view these reports" });
    }

    res.json({ reports: patient.reports });
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/patients/:id/reports/:reportId
const deleteReport = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const report = patient.reports.id(req.params.reportId);
    if (!report) return res.status(404).json({ message: "Report not found" });

    const isOwner = req.user.patientProfile && req.user.patientProfile.toString() === patient._id.toString();
    if (!["admin", "doctor"].includes(req.user.role) && !isOwner) {
      return res.status(403).json({ message: "Not authorized to delete this report" });
    }

    if (report.publicId) {
      await cloudinary.uploader.destroy(report.publicId).catch(() => {});
    }
    report.deleteOne();
    await patient.save();

    res.json({ message: "Report deleted" });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/patients/walk-in (admin, doctor)
// @desc  Register a patient who has no online account — front desk creates
//        their file directly and hands them their new member number.
const createWalkInPatient = async (req, res, next) => {
  try {
    const { name, age, gender, phone, address } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Patient name is required" });
    }

    const patient = await Patient.create({
      name,
      age,
      gender,
      phone,
      address,
      registeredBy: req.user._id,
    });

    res.status(201).json({ patient });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/patients/member/:memberNumber (admin, doctor)
// @desc  Front-desk lookup: patient states their member number, staff pulls up the file.
const getPatientByMemberNumber = async (req, res, next) => {
  try {
    const memberNumber = req.params.memberNumber.trim().toUpperCase();
    const patient = await Patient.findOne({ memberNumber });
    if (!patient) {
      return res.status(404).json({ message: "No patient found with that member number" });
    }
    res.json({ patient });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPatients,
  getPatientById,
  updatePatient,
  uploadReport,
  getReports,
  deleteReport,
  createWalkInPatient,
  getPatientByMemberNumber,
};
