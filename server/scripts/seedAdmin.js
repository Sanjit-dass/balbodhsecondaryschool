require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGODB_URL || process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/balbodh';

async function seed(){
  await connectDB(MONGO_URI);
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@balbodh.edu';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@1234';
  let admin = await User.findOne({ email: adminEmail });
  if(admin){ console.log('Admin exists'); process.exit(0); }
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(adminPassword, salt);
  admin = new User({ name: 'Super Admin', email: adminEmail, password: hashed, role: 'superadmin' });
  await admin.save();
  console.log('Seeded superadmin:', adminEmail);
  process.exit(0);
}

seed().catch(err=>{ console.error(err); process.exit(1); });
