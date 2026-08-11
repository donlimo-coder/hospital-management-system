const Bill = require("../models/Bill");
const Appointment = require("../models/Appointment");
const { withClinicScope } = require("../utils/clinicScope");

// Returns true if the doc's clinic matches req.clinicId, or req.clinicId is null
// (super-admin viewing all clinics).
const inScope = (doc, req) => {
  if (req.clinicId === null || req.clinicId === undefined) return true;
  return doc.clinic && doc.clinic.toString() === req.clinicId.toString();
};

// @route POST /api/bills (doctor, admin) - generate a bill for a completed appointment
const createBill = async (req, res, next) => {
  try {
    const { appointmentId, medicineCharges, labCharges, discount } = req.body;

    const appointment = await Appointment.findById(appointmentId).populate("doctor", "consultationFee");
    if (!appointment || !inScope(appointment, req)) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const existing = await Bill.findOne({ appointment: appointmentId });
    if (existing) return res.status(409).json({ message: "A bill already exists for this appointment" });

    const bill = await Bill.create({
      appointment: appointmentId,
      patient: appointment.patient,
      clinic: appointment.clinic,
      consultationFee: appointment.doctor.consultationFee || 0,
      medicineCharges: medicineCharges || 0,
      labCharges: labCharges || 0,
      discount: discount || 0,
    });

    res.status(201).json({ bill });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/bills (role-aware)
const getBills = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === "patient") filter.patient = req.user.patientProfile;
    filter = withClinicScope(filter, req);

    const bills = await Bill.find(filter)
      .populate("patient", "name")
      .populate({ path: "appointment", populate: { path: "doctor", select: "name specialization" } })
      .sort({ createdAt: -1 });

    res.json({ bills });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/bills/:id/pay
const markBillPaid = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill || !inScope(bill, req)) {
      return res.status(404).json({ message: "Bill not found" });
    }

    bill.isPaid = true;
    bill.paidAt = new Date();
    await bill.save();

    res.json({ bill });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/bills/:id (owner patient, doctor, admin) — used by the printable receipt page
const getBillById = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate("patient", "name memberNumber")
      .populate({ path: "appointment", populate: { path: "doctor", select: "name specialization" } });
    if (!bill || !inScope(bill, req)) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const isOwner = req.user.patientProfile && req.user.patientProfile.toString() === bill.patient._id.toString();
    if (!["admin", "doctor", "superadmin"].includes(req.user.role) && !isOwner) {
      return res.status(403).json({ message: "Not authorized to view this bill" });
    }

    res.json({ bill });
  } catch (err) {
    next(err);
  }
};

module.exports = { createBill, getBills, getBillById, markBillPaid };