/**
 * Utility script: restore default classes (Class 1 .. Class 10)
 * Usage: node scripts/restoreDefaultClasses.js
 *
 * Behavior:
 * - Connects to MongoDB using MONGODB_URL or a local default
 * - Verifies classes 1..10 exist (matches by `numeric` or common name formats)
 * - Creates only missing classes with { name: 'Class N', numeric: N, sections: [] }
 * - Does NOT modify other collections or existing documents
 */

require('dotenv').config();
const { connectDB, disconnectDB } = require('../src/config/db');
const Class = require('../src/models/Class');

const MONGO_URI = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/balbodh';

// Required master class names (preserve these exact display names where appropriate)
const requiredNames = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

async function restore() {
  try {
    console.log('🔄 Restore default classes script starting...');
    console.log('📍 MongoDB URI:', MONGO_URI.includes('mongodb+srv') ? 'MongoDB Atlas' : MONGO_URI);

    await connectDB(MONGO_URI);

    const created = [];
    const skipped = [];

    for (const name of requiredNames) {
      const isNumeric = /^\d+$/.test(String(name).trim());
      const numericVal = isNumeric ? parseInt(String(name).trim(), 10) : undefined;

      // Build search conditions to avoid duplicates
      const conditions = [];
      if (numericVal !== undefined) {
        // Match by numeric field
        conditions.push({ numeric: numericVal });
        // Match common naming patterns: 'Class 1', '1', 'Class 01'
        conditions.push({ name: `Class ${numericVal}` });
        conditions.push({ name: `${numericVal}` });
        conditions.push({ name: new RegExp(`^\\s*class\\s*0*${numericVal}\\s*$`, 'i') });
        conditions.push({ name: new RegExp(`^\\s*0*${numericVal}\\s*$`, 'i') });
      } else {
        // Non-numeric names - match case-insensitive exact or common variants
        conditions.push({ name });
        conditions.push({ name: new RegExp(`^\\s*${name}\\s*$`, 'i') });
      }

      const exists = await Class.findOne({ $or: conditions }).lean();

      if (exists) {
        skipped.push({ name, id: exists._id?.toString(), numeric: exists.numeric });
        console.log(`✓ Skipping existing class for '${name}' (id: ${exists._id})`);
        continue;
      }

      // Create minimal class document following existing schema shape
      const docData = {
        name: isNumeric ? String(numericVal) : name,
        sections: [],
        createdAt: new Date()
      };
      if (numericVal !== undefined) docData.numeric = numericVal;

      const doc = new Class(docData);
      await doc.save();
      created.push({ name, numeric: doc.numeric, id: doc._id.toString() });
      console.log(`+ Created missing class: '${doc.name}' (id: ${doc._id})`);
    }

    console.log('\nSummary:');
    console.log(`  Created: ${created.length}`);
    created.forEach(c => console.log(`    - Class ${c.numeric} (id: ${c.id})`));
    console.log(`  Skipped (already existed): ${skipped.length}`);
    skipped.forEach(s => console.log(`    - Class ${s.numeric} (existing id: ${s.id})`));

    await disconnectDB();
    console.log('\n✅ restoreDefaultClasses finished.');
    process.exit(0);
  } catch (err) {
    console.error('❌ restoreDefaultClasses failed:', err && err.message ? err.message : err);
    try { await disconnectDB(); } catch (e) {}
    process.exit(1);
  }
}

restore();