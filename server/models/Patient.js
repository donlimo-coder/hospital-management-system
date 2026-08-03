const mongoose = require("mongoose");
const { getNextSequence } = require("./Counter");

const patientSchema = new mongoose.Schema(
  {
    // Optional: only set if the patient has an online login account.
    // Walk-in patients registered by reception may not have one.
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, sparse: true },
    memberNumber: { type: String, unique: true }, // e.g. "HMS-000123" — auto-generated
    name: { type: String, required: true },
    age: { type: Number, min: 0 },
    gender: { type: String, enum: ["male", "female", "other"] },
    phone: { type: String, trim: true },
    idType: { type: String, enum: ["national_id", "passport", "birth_certificate"] },
    idNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // staff member who created a walk-in file
    medicalHistory: [
      {
        condition: String,
        diagnosedOn: Date,
        notes: String,
      },
    ],
    reports: [
      {
        label: { type: String, required: true }, // e.g. "Chest X-ray", "Blood test - Jan 2026"
        url: { type: String, required: true },
        publicId: { type: String }, // Cloudinary public_id, needed to delete later
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Auto-assign a member number like "HMS-000123" the first time a patient is saved.
patientSchema.pre("save", async function (next) {
  if (!this.isNew || this.memberNumber) return next();
  try {
    const seq = await getNextSequence("patientMemberNumber");
    this.memberNumber = `HMS-${String(seq).padStart(6, "0")}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Patient", patientSchema);
