require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const Clinic = require('./models/Clinic');
const User = require('./models/User');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let clinicB = await Clinic.findOne({ clinicCode: 'KMC002' });
    if (!clinicB) {
      clinicB = await Clinic.create({
        name: 'Litein Medical Clinic',
        clinicCode: 'KMC002',
      });
      console.log('Created Clinic B:', clinicB._id.toString());
    } else {
      console.log('Clinic B already exists:', clinicB._id.toString());
    }

    let clinicBAdmin = await User.findOne({ email: 'admin.clinicb@hospital.com' });
    if (!clinicBAdmin) {
      clinicBAdmin = await User.create({
        name: 'Clinic B Admin',
        email: 'admin.clinicb@hospital.com',
        password: 'clinicb123',
        role: 'admin',
        clinic: clinicB._id,
      });
      console.log('Created Clinic B admin: admin.clinicb@hospital.com / clinicb123');
    } else {
      console.log('Clinic B admin already exists');
    }

    let superadmin = await User.findOne({ email: 'superadmin@hospital.com' });
    if (!superadmin) {
      superadmin = await User.create({
        name: 'Super Admin',
        email: 'superadmin@hospital.com',
        password: 'superadmin123',
        role: 'superadmin',
      });
      console.log('Created superadmin: superadmin@hospital.com / superadmin123');
    } else {
      console.log('Superadmin already exists');
    }

    console.log('\nDone. Login credentials:');
    console.log('  Clinic B admin: admin.clinicb@hospital.com / clinicb123');
    console.log('  Superadmin:     superadmin@hospital.com / superadmin123');
    console.log('\nExisting Clinic A admin (KMC001): admin@hospital.com / admin123');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

run();