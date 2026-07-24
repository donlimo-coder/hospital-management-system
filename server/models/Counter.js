const mongoose = require("mongoose");

// Generic auto-increment counter, used to generate sequential, human-friendly
// IDs (like patient member numbers) without clashing under concurrent writes.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. "patientMemberNumber"
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

// Returns the next number in the sequence, creating the counter if needed.
const getNextSequence = async (name) => {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

module.exports = { Counter, getNextSequence };
