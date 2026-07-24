const express = require("express");
const {
  getPatients,
  getPatientById,
  updatePatient,
  uploadReport,
  getReports,
  deleteReport,
  createWalkInPatient,
  getPatientByMemberNumber,
} = require("../controllers/patientController");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", protect, authorize("admin", "doctor"), getPatients);

// Front-desk flow: register a walk-in patient with no online account,
// and look patients up by the member number they quote at reception.
// These must be declared BEFORE "/:id" so "member" isn't read as an id.
router.post("/walk-in", protect, authorize("admin", "doctor"), createWalkInPatient);
router.get("/member/:memberNumber", protect, authorize("admin", "doctor"), getPatientByMemberNumber);

router.get("/:id", protect, getPatientById);
router.put("/:id", protect, updatePatient);

// Lab reports / X-rays / scanned documents (Cloudinary-backed)
router.post("/:id/reports", protect, upload.single("file"), uploadReport);
router.get("/:id/reports", protect, getReports);
router.delete("/:id/reports/:reportId", protect, deleteReport);

module.exports = router;
