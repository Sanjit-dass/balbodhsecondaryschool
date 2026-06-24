require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { connectDB, disconnectDB } = require('../src/config/db');
const mongoose = require('mongoose');

const ClassModel = require('../src/models/Class');
const Student = require('../src/models/Student');
const User = require('../src/models/User');
const FeeStructure = require('../src/models/FeeStructure');
const Invoice = require('../src/models/Invoice');
const Payment = require('../src/models/Payment');
const Receipt = require('../src/models/Receipt');
const Ledger = require('../src/models/Ledger');

const MONGO_URI = process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/balbodh';

async function removeTestClass() {
  await connectDB(MONGO_URI);
  try {
    const testClassName = 'Test Class ERP';
    console.log(`Searching for class named: ${testClassName}`);
    const cls = await ClassModel.findOne({ name: testClassName });
    if (!cls) {
      console.log('No class found. Nothing to remove.');
      await disconnectDB();
      return;
    }

    console.log(`Found class: ${cls._id}. Removing associated records...`);
    // Remove students and their user accounts
    const students = await Student.find({ class: cls._id });
    for (const s of students) {
      if (s.user) {
        await User.deleteOne({ _id: s.user }).catch(() => {});
      }
      await Payment.deleteMany({ studentId: s._id }).catch(() => {});
      await Invoice.deleteMany({ studentId: s._id }).catch(() => {});
      await Receipt.deleteMany({ studentId: s._id }).catch(() => {});
      await Ledger.deleteMany({ studentId: s._id }).catch(() => {});
      await Student.deleteOne({ _id: s._id }).catch(() => {});
      console.log(` - Removed student ${s._id}`);
    }

    // Remove fee structures, invoices, payments, receipts linked by classId
    await FeeStructure.deleteMany({ classId: cls._id }).catch(() => {});
    await Invoice.deleteMany({ classId: cls._id }).catch(() => {});
    await Payment.deleteMany({ classId: cls._id }).catch(() => {});
    await Receipt.deleteMany({ classId: cls._id }).catch(() => {});
    await Ledger.deleteMany({ classId: cls._id }).catch(() => {});

    // Finally remove the class
    await ClassModel.deleteOne({ _id: cls._id });
    console.log('Class and associated records removed successfully.');
  } catch (err) {
    console.error('Error removing test class:', err);
  } finally {
    await disconnectDB();
  }
}

removeTestClass().catch(err => { console.error(err); process.exit(1); });
