const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      required: true,
    },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "17:00"
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    clinic: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic" },
    name: { type: String, required: true },
    specialization: { type: String, required: true, trim: true },
    experienceYears: { type: Number, default: 0, min: 0 },
    consultationFee: { type: Number, required: true, min: 0 },
    availability: [availabilitySchema],
    bio: { type: String, trim: true },
    isAcceptingPatients: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
