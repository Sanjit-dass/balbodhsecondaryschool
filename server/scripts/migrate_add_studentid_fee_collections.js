/*
Migration: Add studentId to FeePayment and FeeReceipt documents when missing.
Usage: NODE_ENV=development node scripts/migrate_add_studentid_fee_collections.js

This script will:
 - connect to MongoDB using environment variables from server/.env (if any)
 - scan FeePayment and FeeReceipt collections for documents without studentId
 - attempt to find a Student by className + rollNumber/admissionNumber
 - update documents with resolved studentId and log results
*/

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const FeePayment = require('../src/models/FeePayment');
const FeeReceipt = require('../src/models/FeeReceipt');
const Student = require('../src/models/Student');

async function connect() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGODB_URI (or MONGODB_URL) is required for migration scripts. Set it in .env or the environment.');
    process.exit(1);
  }
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');
}

function escapeRegex(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function resolveForPayment(doc) {
  const className = doc.className || '';
  const roll = String(doc.rollNumber || doc.admissionNumber || '').trim();
  if (!className || !roll) return null;

  const classRegex = new RegExp(escapeRegex(String(className).trim()), 'i');
  const rollQuery = {
    $or: [
      { rollNumber: roll },
      { admissionNumber: roll },
      { rollNumber: new RegExp(`^${escapeRegex(roll)}$`, 'i') },
      { admissionNumber: new RegExp(`^${escapeRegex(roll)}$`, 'i') }
    ]
  };

  const student = await Student.findOne({ $and: [ { $or: [ { className: classRegex }, { className: new RegExp(escapeRegex(String(className || '')), 'i') } ] }, rollQuery ] }).lean();
  return student ? student._id : null;
}

async function migrateFeePayments() {
  console.log('Scanning FeePayment documents for missing studentId...');
  const cursor = FeePayment.find({ $or: [ { studentId: { $exists: false } }, { studentId: null } ] }).cursor();
  let updated = 0, total = 0;
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    total++;
    try {
      const resolved = await resolveForPayment(doc);
      if (resolved) {
        await FeePayment.updateOne({ _id: doc._id }, { $set: { studentId: resolved } });
        updated++;
        console.log(`Updated FeePayment ${doc._id} -> studentId ${resolved}`);
      } else {
        console.log(`No student match for FeePayment ${doc._id} (class=${doc.className} roll=${doc.rollNumber || doc.admissionNumber})`);
      }
    } catch (err) {
      console.error('Error processing FeePayment', doc._id, err.message);
    }
  }
  console.log(`FeePayment migration complete: scanned=${total} updated=${updated}`);
}

async function migrateFeeReceipts() {
  console.log('Scanning FeeReceipt documents for missing studentId...');
  const cursor = FeeReceipt.find({ $or: [ { studentId: { $exists: false } }, { studentId: null } ] }).cursor();
  let updated = 0, total = 0;
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    total++;
    try {
      const className = doc.className || '';
      const roll = String(doc.rollNumber || doc.admissionNumber || '').trim();
      if (!className || !roll) { console.log(`Skipping FeeReceipt ${doc._id} missing class/roll`); continue; }
      const classRegex = new RegExp(escapeRegex(String(className).trim()), 'i');
      const rollQuery = {
        $or: [
          { rollNumber: roll },
          { admissionNumber: roll },
          { rollNumber: new RegExp(`^${escapeRegex(roll)}$`, 'i') },
          { admissionNumber: new RegExp(`^${escapeRegex(roll)}$`, 'i') }
        ]
      };
      const student = await Student.findOne({ $and: [ { $or: [ { className: classRegex }, { className: new RegExp(escapeRegex(String(className || '')), 'i') } ] }, rollQuery ] }).lean();
      if (student) {
        await FeeReceipt.updateOne({ _id: doc._id }, { $set: { studentId: student._id } });
        updated++;
        console.log(`Updated FeeReceipt ${doc._id} -> studentId ${student._id}`);
      } else {
        console.log(`No student match for FeeReceipt ${doc._id} (class=${doc.className} roll=${doc.rollNumber || doc.admissionNumber})`);
      }
    } catch (err) {
      console.error('Error processing FeeReceipt', doc._id, err.message);
    }
  }
  console.log(`FeeReceipt migration complete: scanned=${total} updated=${updated}`);
}

async function run() {
  try {
    await connect();
    await migrateFeePayments();
    await migrateFeeReceipts();
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
