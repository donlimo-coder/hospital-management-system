const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    clinic: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic" },
    consultationFee: { type: Number, required: true, default: 0 },
    medicineCharges: { type: Number, default: 0 },
    labCharges: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

billSchema.pre("validate", function (next) {
  this.total = Math.max(
    0,
    (this.consultationFee || 0) + (this.medicineCharges || 0) + (this.labCharges || 0) - (this.discount || 0)
  );
  next();
});

module.exports = mongoose.model("Bill", billSchema);