// Populates the database with a demo admin, two doctors, and a patient.
// Run with: npm run seed  (make sure MONGO_URI in .env points to your DB)
require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require("mongoose");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Seeding...");

  await Promise.all([User.deleteMany({}), Doctor.deleteMany({}), Patient.deleteMany({})]);

  const admin = await User.create({
    name: "Hospital Admin",
    email: "admin@hospital.com",
    password: "admin123",
    role: "admin",
  });

  const doctorUser1 = await User.create({
    name: "Dr. Amina Wanjiru",
    email: "amina@hospital.com",
    password: "doctor123",
    role: "doctor",
  });
  const doctor1 = await Doctor.create({
    user: doctorUser1._id,
    name: "Dr. Amina Wanjiru",
    specialization: "Cardiologist",
    experienceYears: 12,
    consultationFee: 1500,
    availability: [
      { day: "Mon", startTime: "09:00", endTime: "17:00" },
      { day: "Wed", startTime: "09:00", endTime: "17:00" },
      { day: "Fri", startTime: "09:00", endTime: "13:00" },
    ],
  });
  doctorUser1.doctorProfile = doctor1._id;
  await doctorUser1.save();

  const doctorUser2 = await User.create({
    name: "Dr. John Kiptoo",
    email: "john@hospital.com",
    password: "doctor123",
    role: "doctor",
  });
  const doctor2 = await Doctor.create({
    user: doctorUser2._id,
    name: "Dr. John Kiptoo",
    specialization: "General Practitioner",
    experienceYears: 6,
    consultationFee: 800,
    availability: [
      { day: "Tue", startTime: "08:00", endTime: "16:00" },
      { day: "Thu", startTime: "08:00", endTime: "16:00" },
      { day: "Sat", startTime: "09:00", endTime: "12:00" },
    ],
  });
  doctorUser2.doctorProfile = doctor2._id;
  await doctorUser2.save();

  const patientUser = await User.create({
    name: "Grace Mwangi",
    email: "grace@example.com",
    password: "patient123",
    role: "patient",
  });
  const patient = await Patient.create({
    user: patientUser._id,
    name: "Grace Mwangi",
    age: 27,
    gender: "female",
    address: "Kericho, Kenya",
  });
  patientUser.patientProfile = patient._id;
  await patientUser.save();

  console.log("Seed complete:");
  console.log("  Admin:   admin@hospital.com / admin123");
  console.log("  Doctor:  amina@hospital.com / doctor123");
  console.log("  Doctor:  john@hospital.com / doctor123");
  console.log("  Patient: grace@example.com / patient123");

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});