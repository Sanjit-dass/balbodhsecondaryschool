/**
 * Direct seed script using mongoose directly
 * No external connectDB wrapper
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGODB_URL;

if (!MONGO_URI) {
  console.error('❌ MONGODB_URL not set in .env file');
  process.exit(1);
}

console.log('🔄 Starting direct seed...');
console.log('📍 MongoDB URI:', MONGO_URI.substring(0, 40) + '...');

// Import models directly
const User = require('../src/models/User');
const Student = require('../src/models/Student');
const Class = require('../src/models/Class');

async function seed() {
  try {
    console.log('⏳ Connecting to MongoDB...');
    
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    
    console.log('✓ Connected to MongoDB');

    // Get or create Class 10
    console.log('⏳ Processing Class 10...');
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

    console.log(`⏳ Creating ${testStudents.length} test students...`);
    for (const studentData of testStudents) {
      try {
        // Check if user already exists
        let user = await User.findOne({ email: studentData.email });
        if (!user) {
          const hashedPassword = await bcrypt.hash(studentData.password, 10);
          user = new User({
            name: studentData.name,
            email: studentData.email,
            password: hashedPassword,
            role: 'student',
            createdAt: new Date()
          });
          await user.save();
          console.log(`  ✓ Created user: ${studentData.email}`);
        } else {
          console.log(`  ✓ User already exists: ${studentData.email}`);
        }

        // Check if student record already exists
        let student = await Student.findOne({ email: studentData.email });
        if (!student) {
          student = new Student({
            admissionNumber: studentData.admissionNumber,
            rollNumber: studentData.rollNumber,
            fullName: studentData.name,
            name: studentData.name,
            email: studentData.email,
            class: classRecord._id,
            classId: classRecord._id,
            className: studentData.className,
            section: classRecord.section,
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
          console.log(`  ✓ Created student record: ${studentData.name} (${studentData.admissionNumber})`);
        } else {
          console.log(`  ✓ Student record already exists: ${studentData.name}`);
        }
      } catch (err) {
        console.error(`  ✗ Error creating student ${studentData.email}:`, err.message);
      }
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📝 Test Student Credentials:');
    testStudents.forEach((s) => {
      console.log(`   Email: ${s.email} | Password: ${s.password}`);
    });
    console.log('\n🔐 Now refresh your browser and log in with one of these credentials.');
    console.log('   Then navigate to Sidebar → Fee to see your student fee portal.\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

seed();
