const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB, disconnectDB } = require('./config/db');

const envResult = dotenv.config();

if (envResult.error) {
  console.warn('⚠️ .env file not loaded:', envResult.error.message);
} else {
  console.log('✅ .env file loaded successfully');
  console.log('   loaded keys:', Object.keys(envResult.parsed).join(', '));
}

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;
const MONGODB_DIRECT_URI = process.env.MONGODB_DIRECT_URI || process.env.MONGODB_DIRECT_URL;
const JWT_SECRET = process.env.JWT_SECRET;

console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('Working directory:', process.cwd());
console.log('MONGODB_URL loaded:', Boolean(process.env.MONGODB_URL));
console.log('MONGODB_URI loaded:', Boolean(process.env.MONGODB_URI));
console.log('Using MongoDB connection source:', process.env.MONGODB_URI ? 'MONGODB_URI' : process.env.MONGODB_URL ? 'MONGODB_URL' : 'none');
console.log('MONGODB_DIRECT_URI loaded:', Boolean(MONGODB_DIRECT_URI));
console.log('JWT_SECRET loaded:', Boolean(JWT_SECRET));
console.log('PORT:', PORT);

const missingEnv = [];
if (!MONGODB_URI) missingEnv.push('MONGODB_URI (or MONGODB_URL)');
if (!JWT_SECRET) missingEnv.push('JWT_SECRET');

if (missingEnv.length > 0) {
  console.error(`❌ Missing required environment variable(s): ${missingEnv.join(', ')}`);
  process.exit(1);
}

/* ========================
   CORS CONFIG
======================== */
let allowedOrigins = [];
if (process.env.CORS_ORIGIN && String(process.env.CORS_ORIGIN).trim()) {
  allowedOrigins = process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
} else if ((process.env.NODE_ENV || 'development') === 'production') {
  console.error('❌ CORS_ORIGIN is not set. In production you must set CORS_ORIGIN to the allowed origins.');
  process.exit(1);
} else {
  // Development defaults: use only 127.0.0.1 and current hostname, avoid hardcoded localhost
  const devOrigins = [
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5177',
    'http://127.0.0.1:5000',
  ];
  // Add current hostname dynamically in dev (if available)
  if (typeof process.env.FRONTEND_URL === 'string' && process.env.FRONTEND_URL.trim()) {
    devOrigins.push(process.env.FRONTEND_URL);
  }
  allowedOrigins = devOrigins;
}

// In development, use a permissive CORS policy for the known local frontends.
// This ensures preflight responses include the correct Access-Control-Allow-* headers.
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like curl or native apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
// Ensure preflight OPTIONS requests are handled for all routes
app.options('*', cors(corsOptions));

/* ========================
   BASIC SECURITY
======================== */
app.set('trust proxy', 1);
app.disable('x-powered-by');
require('./middleware/security')(app);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

/* ========================
   STATIC FILES
======================== */
// Cloudinary is used for all file uploads; no local upload hosting.

/* ========================
   ROUTES
======================== */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/students', require('./routes/students'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/contact', require('./routes/contact'));
// Online admissions API (public submission + admin management)
app.use('/api/admissions', require('./routes/admissions'));
// Brochure management
app.use('/api/brochures', require('./routes/brochures'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/library', require('./routes/library'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/results', require('./routes/results'));
app.use('/api/exports', require('./routes/exports'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/pdf', require('./routes/pdf'));
app.use('/api/fileview', require('./routes/fileview'));
app.use('/api/download', require('./routes/download'));
app.use('/api/cloudinary', require('./routes/cloudinaryCheck'));
app.use('/api/events', require('./routes/events'));
// New dedicated events API (v2)
app.use('/api/events-v2', require('./routes/events_api'));

// School Leadership (public + admin)
app.use('/api/staff-leadership', require('./routes/staffLeadership'));

// Achievements (Academic Excellence)
app.use('/api/achievements', require('./routes/achievements'));

// New dedicated endpoints for separated modules
app.use('/api/academic-excellence', require('./routes/academicExcellence'));
app.use('/api/student-achievements', require('./routes/studentAchievements'));

// Photo Gallery (public + admin)
app.use('/api/photo-gallery', require('./routes/photoGallery'));

// Facilities (World-Class Facilities)
app.use('/api/facilities', require('./routes/facilities'));

// Redesigned ERP Fee System Routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/accountant', require('./routes/accountant'));
app.use('/api/student', require('./routes/student'));

app.use('/admin', require('./routes/admin'));
app.use('/accountant', require('./routes/accountant'));
app.use('/student', require('./routes/student'));

app.get('/api/dashboard', async (req, res) => {
  try {
    const Student = require('./models/Student');
    const Teacher = require('./models/Teacher');
    const Exam = require('./models/Exam');
    const Fee = require('./models/Fee');
    const Notice = require('./models/Notice');
    const Assignment = require('./models/Assignment');
    const Library = require('./models/Library');
    const Vehicle = require('./models/Vehicle');
    const Notification = require('./models/Notification');
    const Result = require('./models/Result');
    const ClassModel = require('./models/Class');
    const Subject = require('./models/Subject');
    const Attendance = require('./models/Attendance');

    const [
      totalTeachers,
      totalClasses,
      totalSubjects,
      totalExams,
      totalFees,
      totalNotices,
      totalAssignments,
      totalBooks,
      totalVehicles,
      totalNotifications,
      totalResults,
      totalAttendanceRecords,
      totalStudents,
    ] = await Promise.all([
      Teacher.countDocuments(),
      ClassModel.countDocuments(),
      Subject.countDocuments(),
      Exam.countDocuments(),
      Fee.countDocuments(),
      Notice.countDocuments(),
      Assignment.countDocuments(),
      Library.countDocuments(),
      Vehicle.countDocuments(),
      Notification.countDocuments(),
      Result.countDocuments(),
      Attendance.countDocuments(),
      Student.countDocuments({ status: 'active' }),
    ]);

    const eligibleClassNames = ['Nursery', 'Nursury', 'LKG', 'UKG'];

    const eligibleClasses = await ClassModel.find({
      $or: [
        { numeric: { $gte: 0, $lte: 10 } },
        { name: { $regex: /^(nursery|nursury|lkg|ukg)$/i } }
      ]
    }).select('_id name').sort({ numeric: 1, name: 1 }).lean();

    // also compute unassigned student count for admin visibility
    const totalUnassignedStudents = await Student.countDocuments({ $or: [{ class: { $exists: false } }, { class: null }] });

    const classCountResults = await Student.aggregate([
      { $match: { status: 'active', class: { $exists: true, $ne: null } } },
      { $group: { _id: '$class', count: { $sum: 1 } } }
    ]);
    const classCountMap = classCountResults.reduce((map, item) => {
      map[item._id?.toString()] = item.count;
      return map;
    }, {});

    const classCounts = eligibleClasses.map((cls) => ({
      classId: cls._id,
      className: cls.name,
      count: classCountMap[cls._id.toString()] || 0
    }));

    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.aggregate([
      { $match: { date: { $gte: today, $lt: tomorrow } } },
      { $unwind: '$records' },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq:['$records.status','present'] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq:['$records.status','absent'] }, 1, 0] } },
        leave: { $sum: { $cond: [{ $eq:['$records.status','leave'] }, 1, 0] } }
      } }
    ]);

    const todayTotals = (todayAttendance[0] || { total: 0, present: 0, absent: 0, leave: 0 });
    const todayAttendancePercentage = todayTotals.total ? Math.round((todayTotals.present / todayTotals.total) * 100) : 0;

    res.json({
      totalStudents,
      totalUnassignedStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      totalExams,
      totalFees,
      totalNotices,
      totalAssignments,
      totalBooks,
      totalVehicles,
      totalNotifications,
      totalResults,
      totalAttendanceRecords,
      todayAttendanceCount: todayTotals.total,
      todayPresentCount: todayTotals.present,
      todayAbsentCount: todayTotals.absent,
      todayLeaveCount: todayTotals.leave,
      todayAttendancePercentage,
      classCounts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/debug/students', async (req, res) => {
  try {
    const Student = require('./models/Student');
    const allStudents = await Student.find().select('admissionNumber fullName status class className').lean();
    const activeStudents = await Student.find({ status: 'active' }).select('admissionNumber fullName status class className').lean();
    res.json({
      totalAll: allStudents.length,
      totalActive: activeStudents.length,
      allStudents,
      activeStudents
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Debug error', error: err.message });
  }
});

app.options('*', cors(corsOptions));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  next();
});

app.use(require('./middleware/errorHandler'));

let server;

const ensureStudentIndexes = async () => {
  const Student = require('./models/Student');
  try {
    const indexes = await Student.collection.indexes();
    const hasGlobalAdmissionIndex = indexes.some((index) => index.name === 'admissionNumber_1');
    if (hasGlobalAdmissionIndex) {
      console.log('🔧 Dropping legacy global admissionNumber index');
      await Student.collection.dropIndex('admissionNumber_1');
    }

    const sameKeyIndexes = indexes.filter((index) => {
      return index.key && index.key.class === 1 && index.key.admissionNumber === 1;
    });

    for (const idx of sameKeyIndexes) {
      console.log(`🔧 Dropping existing student index on class+admissionNumber (${idx.name})`);
      await Student.collection.dropIndex(idx.name);
    }

    try {
      await Student.collection.createIndex(
        { class: 1, admissionNumber: 1 },
        {
          unique: true,
          sparse: true
        }
      );
      console.log('✅ Student class+admissionNumber sparse index ensured');
    } catch (sparseErr) {
      console.warn('⚠️ Could not create sparse student index:', sparseErr.message);
      // Don't attempt fallback - sparse index with null values is problematic
      // Just skip and continue - the constraint isn't critical for functionality
      console.log('⚠️ Continuing without this index - functionality will still work');
    }
  } catch (indexErr) {
    console.error('❌ Failed to ensure student indexes:', indexErr.message);
    // Don't fail the server startup due to index issues
    console.log('⚠️ Continuing despite index error - server will function normally');
  }
};

const startServer = async () => {
  try {
    await connectDB(MONGODB_URI, MONGODB_DIRECT_URI);
    await ensureStudentIndexes();

    server = app.listen(PORT)
      .on('listening', () => {
        console.log(`🚀 Server running on port ${PORT}`);
      })
      .on('error', (err) => {
        console.error('❌ Server listen error:', err);
        if (err.code === 'EADDRINUSE') {
          console.error(`Port ${PORT} is already in use. Stop the other process or set a different PORT in .env.`);
        }
        process.exit(1);
      });
  } catch (err) {
    console.error('❌ MongoDB connection failed during startup:', err.message || err);
    console.error('⚠️ Continuing to start HTTP server without MongoDB. Some endpoints will be unavailable.');
    // Start HTTP server even if MongoDB connection failed so non-DB endpoints (e.g., /api/fileview) remain usable
    server = app.listen(PORT)
      .on('listening', () => {
        console.log(`🚀 Server running on port ${PORT} (without MongoDB)`);
      })
      .on('error', (err2) => {
        console.error('❌ Server listen error:', err2);
        if (err2.code === 'EADDRINUSE') {
          console.error(`Port ${PORT} is already in use. Stop the other process or set a different PORT in .env.`);
        }
        process.exit(1);
      });
  }
};

const shutdown = async (signal) => {
  console.log(`
Received ${signal}. Shutting down gracefully...`);

  if (server) {
    server.close(() => console.log('✅ HTTP server closed'));
  }

  try {
    await disconnectDB();
  } catch (disconnectError) {
    console.error('❌ Error while disconnecting MongoDB:', disconnectError);
  }

  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
  shutdown('unhandledRejection');
});
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  shutdown('uncaughtException');
});

startServer();