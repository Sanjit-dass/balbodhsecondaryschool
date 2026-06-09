/**
 * Seed script to create test student records for development
 * Usage: node scripts/seedStudents.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Student = require('../src/models/Student');
const Class = require('../src/models/Class');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/balbodh';

async function seed() {
  try {
    console.log('🔄 Starting seed script...');
    console.log('📍 Using MongoDB URI:', MONGO_URI.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB');
    
    await connectDB(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Get or create Class 10
    let classRecord = await Class.findOne({ name: 'Class 10' });
    if (!classRecord) {
      classRecord = new Class({
        name: 'Class 10',
        numeric: 10,
        section: 'A',
        strength: 40,
        createdAt: new Date()
      });
      await classRecord.save();
      console.log('✓ Created Class 10');
    } else {
      console.log('✓ Class 10 already exists');
    }

    // Create test students with their user accounts
    const testStudents = [
      {
        email: 'sanjit@balbodh.edu',
        password: 'Student@1234',
        name: 'Sanjit Das',
        admissionNumber: 'ADM001',
        rollNumber: '1',
        className: 'Class 10'
      },
      {
        email: 'student2@balbodh.edu',
        password: 'Student@1234',
        name: 'Aarav Kumar',
        admissionNumber: 'ADM002',
        rollNumber: '2',
        className: 'Class 10'
      },
      {
        email: 'student3@balbodh.edu',
        password: 'Student@1234',
        name: 'Priya Singh',
        admissionNumber: 'ADM003',
        rollNumber: '3',
        className: 'Class 10'
      }
    ];

    for (const studentData of testStudents) {
      try {
        // Check if user exists
        let user = await User.findOne({ email: studentData.email });
        if (!user) {
          const salt = await bcrypt.genSalt(10);
          const hashed = await bcrypt.hash(studentData.password, salt);
          user = new User({
            name: studentData.name,
            email: studentData.email,
            password: hashed,
            role: 'student'
          });
          await user.save();
          console.log(`✓ Created user: ${studentData.email}`);
        } else {
          console.log(`✓ User already exists: ${studentData.email}`);
        }

        // Check if student record exists
        let student = await Student.findOne({ admissionNumber: studentData.admissionNumber });
        if (!student) {
          student = new Student({
            name: studentData.name,
            fullName: studentData.name,
            email: studentData.email,
            admissionNumber: studentData.admissionNumber,
            rollNumber: studentData.rollNumber,
            className: studentData.className,
            class: classRecord._id,
            classId: classRecord._id,
            section: 'A',
            status: 'active',
            user: user._id,
            enrollmentDate: new Date(),
            gender: 'male',
            guardian: {
              fatherName: 'Father Name',
              motherName: 'Mother Name',
              contact: '9800000000'
            }
          });
          await student.save();
          console.log(`✓ Created student record: ${studentData.name} (${studentData.admissionNumber})`);
        } else {
          console.log(`✓ Student record already exists: ${studentData.name}`);
        }
      } catch (err) {
        console.error(`✗ Error creating student ${studentData.email}:`, err.message);
      }
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📝 Test Student Credentials:');
    testStudents.forEach((s) => {
      console.log(`   Email: ${s.email} | Password: ${s.password}`);
    });
    console.log('\n🔐 Login to the student portal to test the Fee module.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
