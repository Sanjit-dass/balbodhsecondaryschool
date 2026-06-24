/**
 * Migration script to populate rollNumber field from admissionNumber for existing students
 * Run this once to update all existing student records
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Student = require('../src/models/Student');

async function migrateRollNumbers() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;
    if (!mongoUri) {
      console.error('MONGODB_URI (or MONGODB_URL) is required for migration scripts. Set it in .env or the environment.');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully!');

    console.log('Updating students to populate rollNumber from admissionNumber...');
    
    // Find all students where rollNumber is not set but admissionNumber exists
    const result = await Student.updateMany(
      {
        admissionNumber: { $exists: true, $ne: null },
        rollNumber: { $exists: false }
      },
      [
        {
          $set: {
            rollNumber: '$admissionNumber'
          }
        }
      ]
    );

    console.log(`Migration completed!`);
    console.log(`Matched: ${result.matchedCount} students`);
    console.log(`Modified: ${result.modifiedCount} students`);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateRollNumbers();
