const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    clinic: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic" },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    time: { type: String, required: true }, // "HH:mm"
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    reason: { type: String, trim: true },
    diagnosis: { type: String, trim: true },
    prescription: [
      {
        medicine: String,
        dosage: String,
        duration: String,
      },
    ],
    followUpDate: { type: String },
    source: { type: String, enum: ["online", "walk-in"], default: "online" },
  },
  { timestamps: true }
);

// Prevent double-booking the same doctor at the same date/time
appointmentSchema.index({ doctor: 1, date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model("Appointment", appointmentSchema);