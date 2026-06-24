/**
 * Quick utility to list Class documents for verification
 * Usage: node scripts/listClasses.js
 */

require('dotenv').config();
const { connectDB, disconnectDB } = require('../src/config/db');
const Class = require('../src/models/Class');

const MONGO_URI = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/balbodh';

async function listClasses() {
  try {
    await connectDB(MONGO_URI);
    const docs = await Class.find({}).sort({ numeric: 1, name: 1 }).lean();
    console.log(`Found ${docs.length} class documents:\n`);
    docs.forEach(d => {
      console.log(`- id: ${d._id} | name: ${d.name || ''} | numeric: ${d.numeric || ''} | sections: ${Array.isArray(d.sections) ? d.sections.length : 'N/A'}`);
    });
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('Error listing classes:', err && err.message ? err.message : err);
    try { await disconnectDB(); } catch(e) {}
    process.exit(1);
  }
}

listClasses();
