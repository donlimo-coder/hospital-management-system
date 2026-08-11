const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
require("dotenv").config();

const Clinic = require("./models/Clinic");
const User = require("./models/User");
const Patient = require("./models/Patient");
const Appointment = require("./models/Appointment");
const Bill = require("./models/Bill");

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    let clinic = await Clinic.findOne({ clinicCode: "KMC001" });

    if (!clinic) {
      clinic = await Clinic.create({
        name: "Kericho Medical Clinic",
        clinicCode: "KMC001",
        isActive: true,
      });
      console.log("Created clinic:", clinic._id);
    } else {
      console.log("Clinic already exists:", clinic._id);
    }

    const clinicId = clinic._id;

    const userCountBefore = await User.countDocuments({ clinic: { $exists: false } });
    const patientCountBefore = await Patient.countDocuments({ clinic: { $exists: false } });
    const appointmentCountBefore = await Appointment.countDocuments({ clinic: { $exists: false } });
    const billCountBefore = await Bill.countDocuments({ clinic: { $exists: false } });

    console.log("Records missing clinic field before migration:");
    console.log("  Users:", userCountBefore);
    console.log("  Patients:", patientCountBefore);
    console.log("  Appointments:", appointmentCountBefore);
    console.log("  Bills:", billCountBefore);

    const userResult = await User.updateMany(
      { clinic: { $exists: false } },
      { $set: { clinic: clinicId } }
    );
    const patientResult = await Patient.updateMany(
      { clinic: { $exists: false } },
      { $set: { clinic: clinicId } }
    );
    const appointmentResult = await Appointment.updateMany(
      { clinic: { $exists: false } },
      { $set: { clinic: clinicId } }
    );
    const billResult = await Bill.updateMany(
      { clinic: { $exists: false } },
      { $set: { clinic: clinicId } }
    );

    console.log("Migration results:");
    console.log("  Users updated:", userResult.modifiedCount);
    console.log("  Patients updated:", patientResult.modifiedCount);
    console.log("  Appointments updated:", appointmentResult.modifiedCount);
    console.log("  Bills updated:", billResult.modifiedCount);

    const userCountAfter = await User.countDocuments({ clinic: { $exists: false } });
    const patientCountAfter = await Patient.countDocuments({ clinic: { $exists: false } });
    const appointmentCountAfter = await Appointment.countDocuments({ clinic: { $exists: false } });
    const billCountAfter = await Bill.countDocuments({ clinic: { $exists: false } });

    console.log("Records still missing clinic field after migration (should be 0):");
    console.log("  Users:", userCountAfter);
    console.log("  Patients:", patientCountAfter);
    console.log("  Appointments:", appointmentCountAfter);
    console.log("  Bills:", billCountAfter);

    console.log("Migration complete.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
