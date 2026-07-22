const express = require('express');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const validate = require('../middleware/validate');
const audit = require('../middleware/audit');
const Student = require('../models/Student');
const User = require('../models/User');
const ExamResult = require('../models/ExamResult');
const EcaMark = require('../models/EcaMark');
const { isSameClass } = require('../utils/studentPromotion');
const { buildSubjectPromotionPlan } = require('../utils/subjectPromotion');
const Subject = require('../models/Subject');
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function findClassByName(className) {
  if (!className || typeof className !== 'string') return null;
  const Class = require('../models/Class');
  let normalized = className.trim();
  normalized = normalized.replace(/:\d+$/, '').trim();
  normalized = normalized.replace(/^class\s*/i, '').trim();
  normalized = normalized.replace(/(?:st|nd|rd|th)$/i, '').trim();
  if (!normalized) return null;

  if (mongoose.Types.ObjectId.isValid(normalized)) {
    const classDoc = await Class.findById(normalized).lean();
    if (classDoc) return classDoc;
  }

  let classDoc = await Class.findOne({ name: new RegExp(`^${escapeRegex(normalized)}$`, 'i') }).lean();
  if (classDoc) return classDoc;

  const numericMatch = normalized.match(/^(\d+)$/);
  if (numericMatch) {
    classDoc = await Class.findOne({ numeric: parseInt(numericMatch[1], 10) }).lean();
    if (classDoc) return classDoc;
  }

  classDoc = await Class.findOne({ name: new RegExp(escapeRegex(normalized), 'i') }).lean();
  return classDoc;
}

async function resolveClassId(className) {
  const classDoc = await findClassByName(className);
  return classDoc ? classDoc._id : null;
}

async function getStudentClassName(student) {
  if (!student) return '';
  if (student.className) return String(student.className).trim();
  if (typeof student.class === 'string' && student.class.trim()) {
    const classDoc = await findClassByName(student.class);
    return classDoc?.name || student.class;
  }
  if (student.class && typeof student.class === 'object' && student.class !== null) {
    return student.class.name || student.class.className || '';
  }
  if (student.class && mongoose.Types.ObjectId.isValid(String(student.class))) {
    const Class = require('../models/Class');
    const classDoc = await Class.findById(student.class).lean();
    return classDoc?.name || '';
  }
  return '';
}

// Create student
// New admissions are stored without sending an automatic notification.
router.post('/', auth, roles(['superadmin','admin','principal','teacher','accountant']), validate, audit('create_student'), async (req, res) => {
  try {
    let classNameValue = '';
    if (req.body.className) classNameValue = String(req.body.className).trim();

    if (req.body.class && typeof req.body.class === 'string' && !mongoose.Types.ObjectId.isValid(req.body.class)) {
      classNameValue = classNameValue || String(req.body.class).trim();
      const classId = await resolveClassId(req.body.class);
      if (classId) {
        req.body.class = classId;
        delete req.body.className;
      } else {
        delete req.body.class;
        req.body.className = classNameValue;
      }
    } else if (classNameValue && !req.body.class) {
      const classId = await resolveClassId(classNameValue);
      if (classId) {
        req.body.class = classId;
        delete req.body.className;
      } else {
        req.body.className = classNameValue;
      }
    }

    const payload = { ...req.body };
    Object.keys(payload).forEach((k) => {
      if (typeof payload[k] === 'string' && payload[k].trim() === '') delete payload[k];
    });
    if (payload.gender && !['male','female','other'].includes(payload.gender)) delete payload.gender;
    if (payload.class && payload.className) delete payload.className;
    if (payload.class === null) delete payload.class;

    const student = new Student(payload);
    if(!student.admissionNumber){
      student.admissionNumber = 'ADM' + Date.now().toString().slice(-6);
    }
    await student.save();
    const saved = await Student.findById(student._id).populate('class', 'name section numeric').lean();
    res.json(saved || student);
  } catch (err) {
    console.error(err);
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'Duplicate key error', detail: err.keyValue });
    }
    if (err && err.name === 'ValidationError') {
      const details = Object.keys(err.errors).map((field) => ({ field, message: err.errors[field].message }));
      return res.status(400).json({ message: 'Validation failed', errors: details });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// (CSV export removed - PDF only exports are served via /api/exports)

router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    if (!userId) return res.status(401).json({ message: 'User ID not found in token' });

    let student = await Student.findOne({ user: userId }).populate('class', 'name section academicYear').lean();
    if (!student) {
      const user = await User.findById(userId).lean();
      if (user?.email) {
        student = await Student.findOne({ email: user.email }).populate('class', 'name section academicYear').lean();
        if (student && !student.user) {
          await Student.updateOne({ _id: student._id }, { user: userId }).catch(() => {});
        }
      }
    }

    if (!student) {
      console.warn(`No student profile found for user: ${userId}`);
      return res.status(404).json({ message: 'Student profile not found for this user. Contact your administrator.' });
    }
    res.json({ student });
  } catch (err) {
    console.error('Error fetching student profile:', err.message);
    res.status(500).send('Server error');
  }
});

router.get('/me/results', auth, roles(['student']), async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    if (!userId) return res.status(401).json({ message: 'User ID not found in token' });

    let student = await Student.findOne({ user: userId }).lean();
    if (!student) {
      const user = await User.findById(userId).lean();
      if (user?.email) {
        student = await Student.findOne({ email: user.email }).lean();
        if (student && !student.user) {
          await Student.updateOne({ _id: student._id }, { user: userId }).catch(() => {});
        }
      }
    }

    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const filter = { student: student._id };
    if (req.query.examId && mongoose.Types.ObjectId.isValid(req.query.examId)) {
      filter.exam = req.query.examId;
    }

    const results = await ExamResult.find(filter)
      .populate('exam', 'title type startDate endDate resultsPublished')
      .populate('subjectMarks.subject', 'name code')
      .lean();

    const ecaMarks = await EcaMark.find({ student: student._id, status: 'published' })
      .populate('category', 'name')
      .sort({ academicYear: 1, createdAt: 1 })
      .lean();

    res.json({ studentId: student._id, results, ecaMarks });
  } catch (err) {
    console.error('Error fetching student results:', err.message);
    res.status(500).send('Server error');
  }
});

router.get('/me/timetable', auth, roles(['student']), async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const student = await Student.findOne({ user: userId });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const Timetable = require('../models/Timetable');
    const filter = { class: student.class };
    if (student.section) filter.section = student.section;

    const timetables = await Timetable.find(filter)
      .populate('class', 'name numeric academicYear')
      .populate('entries.subject', 'name code')
      .populate('entries.teacher', 'fullName email');

    res.json({ timetables });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/me/admit-card', auth, roles(['student']), async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const student = await Student.findOne({ user: userId }).populate('class', 'name numeric academicYear').lean();
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const Exam = require('../models/Exam');
    const Result = require('../models/Result');
    const Setting = require('../models/Setting');

    const exams = await Exam.find({ class: student.class, admitCardUrl: { $exists: true, $ne: '' } })
      .sort({ startDate: 1 })
      .populate('subjects', 'name code')
      .lean();
    const results = await Result.find({ student: student._id, published: true })
      .populate('exam', 'title startDate endDate admitCardUrl')
      .populate('marks.subject', 'name code')
      .lean();
    const settings = await Setting.findOne().lean();

    res.json({ student, exams, results, settings: settings || {} });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get students (with basic search)
router.get('/', auth, roles(['superadmin','admin','principal','teacher','accountant','parent','student','examcontroller']), async (req, res) => {
  try {
    const { q, class: classId, classId: classIdParam, className, section, admissionNumber, page = 1, limit = 200 } = req.query;
    const queryParts = [];
    const resolvedClassId = classIdParam || classId;
    let classNameForId = null;

    if (resolvedClassId && mongoose.Types.ObjectId.isValid(resolvedClassId)) {
      const classDoc = await require('../models/Class').findById(resolvedClassId).lean();
      if (classDoc) classNameForId = classDoc.name;
    }

    if (resolvedClassId) {
      if (classNameForId) {
        queryParts.push({
          $or: [
            { class: resolvedClassId },
            { className: classNameForId }
          ]
        });
      } else {
        queryParts.push({ class: resolvedClassId });
      }
    }
    if (className) {
      const classDoc = await findClassByName(className);
      if (classDoc) {
        queryParts.push({
          $or: [
            { class: classDoc._id },
            { className: classDoc.name },
            { className },
            { className: new RegExp(`^${escapeRegex(className)}$`, 'i') },
            { className: new RegExp(escapeRegex(className), 'i') }
          ]
        });
      } else {
        queryParts.push({
          $or: [
            { className },
            { className: new RegExp(`^${escapeRegex(className)}$`, 'i') },
            { className: new RegExp(escapeRegex(className), 'i') }
          ]
        });
      }
    }
    if (section) queryParts.push({ section });
    if (admissionNumber) queryParts.push({ admissionNumber });
    if (q) {
      queryParts.push({
        $or: [
          { fullName: new RegExp(escapeRegex(q), 'i') },
          { admissionNumber: new RegExp(`^${escapeRegex(q)}$`, 'i') }
        ]
      });
    }

    const filter = queryParts.length ? { $and: queryParts } : {};
    const students = await Student.find(filter).populate('class', 'name section numeric').skip((page-1)*limit).limit(parseInt(limit)).lean();
    const total = await Student.countDocuments(filter);
    res.json({ students, total });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/export/full-class/pdf', auth, roles(['superadmin','admin','principal','teacher','accountant']), async (req, res) => {
  try {
    const { className } = req.query;
    if (!className) {
      return res.status(400).json({ message: 'Class name is required' });
    }

    const classDoc = await findClassByName(className);
    const classFilter = classDoc
      ? { $or: [{ class: classDoc._id }, { className: classDoc.name }, { className: className }] }
      : { className: className };

    const students = await Student.find(classFilter).populate('class', 'name section numeric').sort({ admissionNumber: 1, rollNumber: 1, fullName: 1 }).lean();

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="full_class_student_details.pdf"');
      res.send(Buffer.concat(chunks));
    });
    doc.on('error', (err) => {
      console.error('PDF generation error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Unable to generate PDF' });
      }
    });

    const schoolName = 'Bal Bodh Secondary School';
    const schoolAddress = 'Kanchanrup Municipality-08, Kanchanpur';
    const established = 'ESTD. 2055';
    const generatedDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const classLabel = classDoc?.name || className || 'Selected Class';
    const academicYear = classDoc?.academicYear || '2026';

    doc.fontSize(20).font('Helvetica-Bold').text(schoolName, { align: 'center' });
    doc.fontSize(11).font('Helvetica').text(schoolAddress, { align: 'center' });
    doc.fontSize(11).font('Helvetica').text(established, { align: 'center' });
    doc.moveDown(0.5);

    doc.rect(30, 90, 535, 28).lineWidth(1).stroke();
    doc.fontSize(14).font('Helvetica-Bold').text('Full Class Student Details', 30, 96, { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Academic Year: ${academicYear}`, { align: 'left' });
    doc.text(`Class: ${classLabel}`, { align: 'left' });
    doc.text(`Generated Date: ${generatedDate}`, { align: 'left' });
    doc.moveDown(0.6);

    const tableTop = 145;
    const rowHeight = 20;
    const colWidths = [28, 42, 88, 34, 54, 54, 56, 52, 58, 40];
    const xPositions = [30, 58, 100, 188, 222, 276, 330, 386, 438, 496];

    const headerY = tableTop;
    const headers = ['S.N.', 'Roll No.', 'Student Name', 'Gender', 'Father Name', 'Mother Name', 'Guardian Name', 'Phone Number', 'Address', 'Section'];
    headers.forEach((header, index) => {
      const x = xPositions[index];
      const width = colWidths[index];
      doc.rect(x, headerY, width, rowHeight).stroke();
      doc.fontSize(7.2).font('Helvetica-Bold');
      doc.text(header, x + 2, headerY + 4, { width: width - 4, align: index === 0 || index === 1 || index === 3 || index === 4 || index === 5 || index === 6 || index === 7 || index === 9 ? 'center' : 'left' });
    });

    let y = headerY + rowHeight;
    students.forEach((student, index) => {
      if (y > 760) {
        doc.addPage();
        y = 40;
      }

      const guardianName = student.guardian?.guardianName || student.parentName || student.guardian?.fatherName || student.guardian?.motherName || '-';
      const rowData = [
        String(index + 1),
        student.rollNumber || student.admissionNumber || '-',
        student.fullName || student.name || '-',
        student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : '-',
        student.guardian?.fatherName || '-',
        student.guardian?.motherName || '-',
        guardianName,
        student.phone || student.contactNumber || student.guardian?.contact || '-',
        student.guardian?.address || '-',
        student.section || '-'
      ];

      rowData.forEach((value, valueIndex) => {
        const x = xPositions[valueIndex];
        const width = colWidths[valueIndex];
        doc.rect(x, y, width, rowHeight).stroke();
        doc.fontSize(6.8).font('Helvetica');
        const align = valueIndex === 0 || valueIndex === 1 || valueIndex === 3 || valueIndex === 4 || valueIndex === 5 || valueIndex === 6 || valueIndex === 7 || valueIndex === 9 ? 'center' : 'left';
        doc.text(String(value || '-'), x + 2, y + 4, { width: width - 4, align });
      });
      y += rowHeight;
    });

    doc.moveDown(2);
    doc.fontSize(11).font('Helvetica-Bold').text('----------------------------------------', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Total Students: ${students.length}`, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica').text('Generated by:', { align: 'center' });
    doc.fontSize(10).font('Helvetica-Bold').text('Bal Bodh Secondary School Management System', { align: 'center' });
    doc.fontSize(11).font('Helvetica-Bold').text('----------------------------------------', { align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/promote', auth, roles(['superadmin','admin','principal']), async (req, res) => {
  try {
    const { className, academicYear, targetClass, studentIds = [] } = req.body;

    if (!className || !targetClass || !academicYear || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Current class, academic year, target class, and at least one student are required.' });
    }

    if (isSameClass(className, targetClass)) {
      return res.status(400).json({ message: 'This student is already in the selected class.' });
    }

    const sourceClassName = String(className).trim();
    const targetClassName = String(targetClass).trim();
    const academicYearValue = String(academicYear).trim();
    const targetClassDoc = await findClassByName(targetClassName);
    const targetClassId = targetClassDoc ? targetClassDoc._id : null;

    const students = await Student.find({ _id: { $in: studentIds } }).lean();
    if (!students.length) {
      return res.status(404).json({ message: 'No matching students were found.' });
    }

    const updates = [];
    const errors = [];
    let copiedSubjectCount = 0;

    for (const student of students) {
      const currentClassName = await getStudentClassName(student);
      if (isSameClass(currentClassName || sourceClassName, targetClassName)) {
        errors.push({ id: student._id, message: 'This student is already in the selected class.' });
        continue;
      }

      updates.push({
        id: student._id,
        payload: {
          className: targetClassName,
          ...(targetClassId ? { class: targetClassId } : {}),
          academicYear: academicYearValue,
          promotionHistory: [
            ...(student.promotionHistory || []),
            {
              academicYear: academicYearValue,
              fromClass: currentClassName || sourceClassName,
              toClass: targetClassName,
              promotedAt: new Date()
            }
          ]
        }
      });
    }

    if (!updates.length) {
      return res.status(400).json({ message: errors[0]?.message || 'This student is already in the selected class.', errors });
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const item of updates) {
          await Student.updateOne({ _id: item.id }, { $set: item.payload }, { session });
        }

        const sourceSubjects = await Subject.find({
          class: sourceClassName,
          academicYear: academicYearValue
        }).lean();

        if (sourceSubjects.length) {
          const normalizedSourceClass = sourceClassName;
          const normalizedTargetClass = targetClassName;
          const existingDestinationSubjects = await Subject.find({
            class: normalizedTargetClass,
            academicYear: academicYearValue
          }).select('_id name').lean();

          const promotionPlan = buildSubjectPromotionPlan(
            sourceSubjects,
            existingDestinationSubjects,
            normalizedTargetClass,
            academicYearValue
          );

          if (promotionPlan.payloads.length) {
            await Subject.insertMany(promotionPlan.payloads, { session });
            copiedSubjectCount = promotionPlan.payloads.length;
          }
        }
      });
    } catch (err) {
      await session.endSession();
      throw err;
    }
    await session.endSession();

    const subjectMessage = copiedSubjectCount > 0
      ? `${copiedSubjectCount} subjects copied successfully to ${targetClassName} for Academic Year ${academicYearValue}.`
      : 'Subjects already exist for this class and academic year.';

    res.json({
      promotedCount: updates.length,
      copiedSubjectCount,
      targetClass: targetClassName,
      sourceClass: sourceClassName,
      academicYear: academicYearValue,
      message: `${updates.length} students promoted successfully. ${subjectMessage}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to promote students right now.' });
  }
});

router.get('/class/:name', auth, roles(['superadmin','admin','principal','teacher','accountant','parent','examcontroller']), async (req, res) => {
  try {
    const className = req.params.name;
    const { q, section, admissionNumber } = req.query;
    const classDoc = await findClassByName(className);

    const classFilter = classDoc
      ? { $or: [{ class: classDoc._id }, { className: classDoc.name }, { className: className }] }
      : { className: className };

    const filter = { $and: [classFilter] };
    if (section) filter.$and.push({ section });
    if (admissionNumber) filter.$and.push({ admissionNumber: admissionNumber });
    if (q) {
      filter.$and.push({
        $or: [
          { fullName: new RegExp(escapeRegex(q), 'i') },
          { admissionNumber: new RegExp(`^${escapeRegex(q)}$`, 'i') }
        ]
      });
    }

    const students = await Student.find(filter).populate('class', 'name section numeric').lean();
    res.json({ students, total: students.length });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get single student
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('class', 'name section numeric').lean();
    if(!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// List students without a class (orphans) - admin access
router.get('/orphans', auth, roles(['superadmin','admin','principal','teacher','accountant']), async (req, res) => {
  try {
    const filter = { $or: [{ class: { $exists: false } }, { class: null }] };
    const students = await Student.find(filter).lean();
    res.json({ students, total: students.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fix students where `class` is missing or a non-ObjectId string by resolving className/class string
router.post('/fix-classes', auth, roles(['superadmin','admin','principal']), async (req, res) => {
  try {
    const candidates = await Student.find({ $or: [{ class: null }, { class: { $exists: false } }, { class: { $type: 'string' } }] }).lean();
    const results = [];
    for (const s of candidates) {
      const currentClassValue = s.class || s.className || '';
      if (!currentClassValue || typeof currentClassValue !== 'string') {
        results.push({ id: s._id, status: 'skipped', reason: 'no class/className string present' });
        continue;
      }
      const classId = await resolveClassId(currentClassValue);
      if (!classId) {
        results.push({ id: s._id, status: 'not_found', classValue: currentClassValue });
        continue;
      }
      try {
        await Student.findByIdAndUpdate(s._id, { class: classId });
        results.push({ id: s._id, status: 'updated', classId });
      } catch (e) {
        console.error('Failed to update student', s._id, e);
        results.push({ id: s._id, status: 'error', error: e.message });
      }
    }
    const updated = results.filter(r => r.status === 'updated').length;
    res.json({ totalChecked: candidates.length, updated, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update student
router.put('/:id', auth, roles(['superadmin','admin','principal','teacher','accountant']), async (req, res) => {
  try {
    let classNameValue = '';
    if (req.body.className) classNameValue = String(req.body.className).trim();

    if (req.body.class && typeof req.body.class === 'string' && !mongoose.Types.ObjectId.isValid(req.body.class)) {
      classNameValue = classNameValue || String(req.body.class).trim();
      const classId = await resolveClassId(req.body.class);
      if (classId) {
        req.body.class = classId;
        delete req.body.className;
      } else {
        delete req.body.class;
        req.body.className = classNameValue;
      }
    } else if (classNameValue && !req.body.class) {
      const classId = await resolveClassId(classNameValue);
      if (classId) {
        req.body.class = classId;
        delete req.body.className;
      } else {
        req.body.className = classNameValue;
      }
    }
    const payload = { ...req.body };
    Object.keys(payload).forEach((k) => {
      if (typeof payload[k] === 'string' && payload[k].trim() === '') delete payload[k];
    });
    if (payload.class && payload.className) delete payload.className;
    if (payload.gender && !['male','female','other'].includes(payload.gender)) delete payload.gender;
    if (payload.class === null) delete payload.class;
    // If admissionNumber is being updated, sync it to rollNumber
    if (payload.admissionNumber && !payload.rollNumber) {
      payload.rollNumber = payload.admissionNumber;
    }
    const updated = await Student.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    const student = updated ? await Student.findById(updated._id).populate('class', 'name section numeric').lean() : null;
    res.json(student || updated);
  } catch (err) {
    console.error(err);
    if (err && err.name === 'ValidationError') {
      const details = Object.keys(err.errors).map((field) => ({ field, message: err.errors[field].message }));
      return res.status(400).json({ message: 'Validation failed', errors: details });
    }
    res.status(500).send('Server error');
  }
});

// Upload profile photo for student
const { createStorage } = require('../middleware/upload');
const cloudinary = require('../utils/cloudinary');
const { extractCloudinaryPublicId, getCloudinaryResourceType } = require('../utils/cloudinaryHelpers');

router.post('/:id/photo', auth, roles(['superadmin','admin','principal','teacher','accountant']), (req, res) => {
  const upload = createStorage('students').single('file');
  upload(req, res, async function(err) {
    if (err) return res.status(400).json({ message: err.message || 'Upload error' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    try{
      const fileUrl = req.file.secure_url || req.file.path || req.file.location || '';
      const publicId = req.file.public_id || req.file.filename || req.file.key || '';
      const student = await Student.findByIdAndUpdate(req.params.id, { profilePhoto: fileUrl, profilePhotoObj: { fileUrl, publicId } }, { new: true });
      res.json({ student });
    }catch(e){ console.error(e); res.status(500).json({ message: 'Server error' }); }
  });
});

// Delete student
router.delete('/:id', auth, roles(['superadmin','admin','principal']), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).lean();
    if (student) {
      const pub = (student.profilePhoto && student.profilePhoto.publicId) || student.profilePhoto || student.profilePhotoUrl;
      const resourceType = pub ? getCloudinaryResourceType(pub) : 'auto';
      if (pub) {
        try{ await cloudinary.uploader.destroy(pub, { resource_type: resourceType }); }catch(e){ console.error('Failed to delete cloudinary asset', e); }
      }
    }
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
