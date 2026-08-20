// Populates a dedicated "Demo Clinic" tenant with realistic data for client pitches.
// Run with: node seedDemo.js  (from the server folder, MONGO_URI must be set in .env)
require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require("mongoose");
const Clinic = require("./models/Clinic");
const User = require("./models/User");
const Doctor = require("./models/Doctor");
const Patient = require("./models/Patient");
const Appointment = require("./models/Appointment");
const Bill = require("./models/Bill");

const KENYAN_NAMES = [
  { name: "Faith Chebet", gender: "female" },
  { name: "Brian Kiprotich", gender: "male" },
  { name: "Mercy Nyambura", gender: "female" },
  { name: "Dennis Ochieng", gender: "male" },
  { name: "Sharon Wambui", gender: "female" },
  { name: "Kevin Langat", gender: "male" },
  { name: "Ann Chepkemoi", gender: "female" },
  { name: "Peter Kimutai", gender: "male" },
  { name: "Lilian Adhiambo", gender: "female" },
  { name: "Samuel Rotich", gender: "male" },
  { name: "Esther Wangari", gender: "female" },
  { name: "Collins Mutai", gender: "male" },
  { name: "Purity Nyokabi", gender: "female" },
  { name: "Victor Kirui", gender: "male" },
  { name: "Diana Auma", gender: "female" },
  { name: "Erick Bett", gender: "male" },
  { name: "Joyce Cherop", gender: "female" },
  { name: "Nicholas Omondi", gender: "male" },
  { name: "Beatrice Wairimu", gender: "female" },
  { name: "Moses Sang", gender: "male" },
];

const CONDITIONS = [
  "Malaria", "Common Cold", "Hypertension", "Typhoid", "Urinary Tract Infection",
  "Gastritis", "Diabetes Type 2", "Respiratory Tract Infection", "Migraine", "Arthritis",
];

const MEDICINES = [
  { medicine: "Amoxicillin", dosage: "500mg", duration: "5 days" },
  { medicine: "Paracetamol", dosage: "500mg", duration: "3 days" },
  { medicine: "Coartem", dosage: "4 tabs twice daily", duration: "3 days" },
  { medicine: "Metformin", dosage: "500mg", duration: "30 days" },
  { medicine: "Amlodipine", dosage: "5mg", duration: "30 days" },
  { medicine: "ORS + Zinc", dosage: "As directed", duration: "5 days" },
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomPhone() {
  const prefixes = ["0722", "0733", "0711", "0700", "0745", "0729"];
  return `${randomFrom(prefixes)}${String(Math.floor(100000 + Math.random() * 900000))}`;
}
function randomIdNumber() {
  return String(Math.floor(20000000 + Math.random() * 15000000));
}
function dateOffset(daysFromToday) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Seeding Demo Clinic...");

  // 1. Create (or reuse) the demo clinic
  let clinic = await Clinic.findOne({ clinicCode: "DEMO01" });
  if (!clinic) {
    clinic = await Clinic.create({ name: "Demo Clinic", clinicCode: "DEMO01" });
    console.log("Created Demo Clinic:", clinic._id.toString());
  } else {
    console.log("Demo Clinic already exists, clearing its old data first...");
    const oldPatients = await Patient.find({ clinic: clinic._id }).select("_id");
    const oldPatientIds = oldPatients.map((p) => p._id);
    await Appointment.deleteMany({ clinic: clinic._id });
    await Bill.deleteMany({ patient: { $in: oldPatientIds } });
    await Patient.deleteMany({ clinic: clinic._id });
    await Doctor.deleteMany({ clinic: clinic._id });
    await User.deleteMany({ clinic: clinic._id, role: { $in: ["admin", "doctor"] } });
  }

  // 2. Admin user for the demo clinic
  const admin = await User.create({
    name: "Demo Clinic Admin",
    email: "admin@democlinic.com",
    password: "demo123",
    role: "admin",
    clinic: clinic._id,
  });

    // 3. Doctors — full specialist roster
  const DOCTOR_DATA = [
    { name: "Dr. Caroline Jepkosgei", email: "caroline@democlinic.com", specialization: "General Practitioner", experienceYears: 9, consultationFee: 1000,
      availability: [{ day: "Mon", startTime: "08:00", endTime: "17:00" }, { day: "Tue", startTime: "08:00", endTime: "17:00" }, { day: "Thu", startTime: "08:00", endTime: "17:00" }, { day: "Fri", startTime: "08:00", endTime: "13:00" }] },
    { name: "Dr. Felix Onyango", email: "felix@democlinic.com", specialization: "Pediatrician", experienceYears: 5, consultationFee: 900,
      availability: [{ day: "Mon", startTime: "09:00", endTime: "16:00" }, { day: "Wed", startTime: "09:00", endTime: "16:00" }, { day: "Sat", startTime: "09:00", endTime: "12:00" }] },
    { name: "Dr. Amina Wanjiru", email: "amina.card@democlinic.com", specialization: "Cardiologist", experienceYears: 14, consultationFee: 2000,
      availability: [{ day: "Tue", startTime: "09:00", endTime: "15:00" }, { day: "Thu", startTime: "09:00", endTime: "15:00" }] },
    { name: "Dr. John Kiptoo", email: "john.derm@democlinic.com", specialization: "Dermatologist", experienceYears: 7, consultationFee: 1500,
      availability: [{ day: "Mon", startTime: "10:00", endTime: "16:00" }, { day: "Fri", startTime: "10:00", endTime: "16:00" }] },
    { name: "Dr. Grace Nyabuto", email: "grace.gyn@democlinic.com", specialization: "Gynecologist", experienceYears: 11, consultationFee: 1800,
      availability: [{ day: "Wed", startTime: "08:00", endTime: "14:00" }, { day: "Fri", startTime: "08:00", endTime: "14:00" }] },
    { name: "Dr. Peter Mwangi", email: "peter.ortho@democlinic.com", specialization: "Orthopedic Surgeon", experienceYears: 16, consultationFee: 2500,
      availability: [{ day: "Tue", startTime: "08:00", endTime: "13:00" }, { day: "Thu", startTime: "08:00", endTime: "13:00" }] },
    { name: "Dr. Susan Chepkurui", email: "susan.neuro@democlinic.com", specialization: "Neurologist", experienceYears: 13, consultationFee: 2200,
      availability: [{ day: "Mon", startTime: "09:00", endTime: "14:00" }, { day: "Wed", startTime: "09:00", endTime: "14:00" }] },
    { name: "Dr. Daniel Kiplangat", email: "daniel.dent@democlinic.com", specialization: "Dentist", experienceYears: 8, consultationFee: 1200,
      availability: [{ day: "Mon", startTime: "08:00", endTime: "17:00" }, { day: "Tue", startTime: "08:00", endTime: "17:00" }, { day: "Wed", startTime: "08:00", endTime: "17:00" }, { day: "Thu", startTime: "08:00", endTime: "17:00" }, { day: "Fri", startTime: "08:00", endTime: "17:00" }] },
    { name: "Dr. Ruth Achieng", email: "ruth.psych@democlinic.com", specialization: "Psychiatrist", experienceYears: 10, consultationFee: 2000,
      availability: [{ day: "Tue", startTime: "10:00", endTime: "16:00" }, { day: "Thu", startTime: "10:00", endTime: "16:00" }] },
    { name: "Dr. Michael Rono", email: "michael.ent@democlinic.com", specialization: "ENT Specialist", experienceYears: 9, consultationFee: 1700,
      availability: [{ day: "Mon", startTime: "09:00", endTime: "15:00" }, { day: "Sat", startTime: "09:00", endTime: "12:00" }] },
    { name: "Dr. Faith Wekesa", email: "faith.oph@democlinic.com", specialization: "Ophthalmologist", experienceYears: 12, consultationFee: 1900,
      availability: [{ day: "Wed", startTime: "09:00", endTime: "15:00" }, { day: "Fri", startTime: "09:00", endTime: "15:00" }] },
    { name: "Dr. Josephat Kimani", email: "josephat.uro@democlinic.com", specialization: "Urologist", experienceYears: 15, consultationFee: 2300,
      availability: [{ day: "Tue", startTime: "08:00", endTime: "14:00" }] },
    { name: "Dr. Winnie Cherotich", email: "winnie.onco@democlinic.com", specialization: "Oncologist", experienceYears: 17, consultationFee: 3000,
      availability: [{ day: "Thu", startTime: "08:00", endTime: "13:00" }] },
    { name: "Dr. Emmanuel Otieno", email: "emmanuel.pulmo@democlinic.com", specialization: "Pulmonologist", experienceYears: 10, consultationFee: 1800,
      availability: [{ day: "Mon", startTime: "08:00", endTime: "14:00" }, { day: "Wed", startTime: "08:00", endTime: "14:00" }] },
    { name: "Dr. Lucy Chepngeno", email: "lucy.endo@democlinic.com", specialization: "Endocrinologist", experienceYears: 9, consultationFee: 2000,
      availability: [{ day: "Fri", startTime: "08:00", endTime: "14:00" }] },
    { name: "Dr. Brian Wafula", email: "brian.nephro@democlinic.com", specialization: "Nephrologist", experienceYears: 12, consultationFee: 2200,
      availability: [{ day: "Tue", startTime: "09:00", endTime: "14:00" }] },
    { name: "Dr. Alice Nafula", email: "alice.rheum@democlinic.com", specialization: "Rheumatologist", experienceYears: 8, consultationFee: 1800,
      availability: [{ day: "Thu", startTime: "09:00", endTime: "14:00" }] },
    { name: "Dr. Kevin Simiyu", email: "kevin.gastro@democlinic.com", specialization: "Gastroenterologist", experienceYears: 11, consultationFee: 2100,
      availability: [{ day: "Mon", startTime: "10:00", endTime: "15:00" }, { day: "Thu", startTime: "10:00", endTime: "15:00" }] },
    { name: "Dr. Mercy Jelagat", email: "mercy.derm2@democlinic.com", specialization: "Physiotherapist", experienceYears: 6, consultationFee: 1000,
      availability: [{ day: "Mon", startTime: "08:00", endTime: "17:00" }, { day: "Wed", startTime: "08:00", endTime: "17:00" }, { day: "Fri", startTime: "08:00", endTime: "17:00" }] },
    { name: "Dr. Stephen Korir", email: "stephen.rad@democlinic.com", specialization: "Radiologist", experienceYears: 13, consultationFee: 1600,
      availability: [{ day: "Tue", startTime: "08:00", endTime: "16:00" }, { day: "Thu", startTime: "08:00", endTime: "16:00" }] },
  ];

  const doctors = [];
  for (const d of DOCTOR_DATA) {
    const doctorUser = await User.create({
      name: d.name,
      email: d.email,
      password: "demo123",
      role: "doctor",
      clinic: clinic._id,
    });
    const doctor = await Doctor.create({
      user: doctorUser._id,
      clinic: clinic._id,
      name: d.name,
      specialization: d.specialization,
      experienceYears: d.experienceYears,
      consultationFee: d.consultationFee,
      availability: d.availability,
    });
    doctorUser.doctorProfile = doctor._id;
    await doctorUser.save();
    doctors.push(doctor);
  }
  console.log(`Created ${doctors.length} doctors`);

  // 4. Patients (mix of walk-in registered, no user login — realistic for reception-driven demo)
  const patients = [];
  for (const p of KENYAN_NAMES) {
    const patient = await Patient.create({
      clinic: clinic._id,
      name: p.name,
      age: 18 + Math.floor(Math.random() * 55),
      gender: p.gender,
      phone: randomPhone(),
      idType: "national_id",
      idNumber: randomIdNumber(),
      address: "Kericho, Kenya",
      registeredBy: admin._id,
      medicalHistory: Math.random() > 0.6 ? [{
        condition: randomFrom(CONDITIONS),
        diagnosedOn: new Date(Date.now() - Math.floor(Math.random() * 180) * 86400000),
        notes: "Managed with medication, patient stable.",
      }] : [],
    });
    patients.push(patient);
  }
  console.log(`Created ${patients.length} patients`);

  // 5. Appointments — 25 past (completed, with bills), 8 upcoming (pending/confirmed)
  let completedCount = 0;
  let upcomingCount = 0;

  // Past appointments, spread over last 45 days
  for (let i = 0; i < 25; i++) {
    const patient = randomFrom(patients);
    const doctor = randomFrom(doctors);
    const daysAgo = -(1 + Math.floor(Math.random() * 45));
    const date = dateOffset(daysAgo);
    const hour = 8 + Math.floor(Math.random() * 8);
    const time = `${String(hour).padStart(2, "0")}:00`;

    try {
      const appt = await Appointment.create({
        patient: patient._id,
        doctor: doctor._id,
        clinic: clinic._id,
        date,
        time,
        status: "completed",
        reason: randomFrom(CONDITIONS),
        diagnosis: randomFrom(CONDITIONS),
        prescription: [randomFrom(MEDICINES)],
        source: Math.random() > 0.5 ? "walk-in" : "online",
      });

      const consultationFee = doctor.consultationFee;
      const medicineCharges = 200 + Math.floor(Math.random() * 800);
      const labCharges = Math.random() > 0.6 ? 300 + Math.floor(Math.random() * 700) : 0;
      const isPaid = Math.random() > 0.15; // most are paid, a few outstanding

      await Bill.create({
        appointment: appt._id,
        patient: patient._id,
        clinic: clinic._id,
        consultationFee,
        medicineCharges,
        labCharges,
        discount: 0,
        isPaid,
        paidAt: isPaid ? new Date() : undefined,
      });

      completedCount++;
    } catch (err) {
      // Skip on rare double-booking collision (unique index on doctor+date+time)
    }
  }

  // Upcoming appointments, next 7 days
  for (let i = 0; i < 8; i++) {
    const patient = randomFrom(patients);
    const doctor = randomFrom(doctors);
    const daysAhead = 1 + Math.floor(Math.random() * 7);
    const date = dateOffset(daysAhead);
    const hour = 8 + Math.floor(Math.random() * 8);
    const time = `${String(hour).padStart(2, "0")}:00`;

    try {
      await Appointment.create({
        patient: patient._id,
        doctor: doctor._id,
        clinic: clinic._id,
        date,
        time,
        status: Math.random() > 0.3 ? "confirmed" : "pending",
        reason: randomFrom(CONDITIONS),
        source: Math.random() > 0.5 ? "walk-in" : "online",
      });
      upcomingCount++;
    } catch (err) {
      // Skip on rare collision
    }
  }

  console.log(`Created ${completedCount} completed appointments (with bills)`);
  console.log(`Created ${upcomingCount} upcoming appointments`);

  console.log("\n=== Demo Clinic seed complete ===");
  console.log("Clinic:", clinic.name, `(${clinic.clinicCode})`);
  console.log("Admin login:    admin@democlinic.com / demo123");
  console.log("Doctor login:   caroline@democlinic.com / demo123");
  console.log("Doctor login:   felix@democlinic.com / demo123");

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});