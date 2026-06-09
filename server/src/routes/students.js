const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const validate = require('../middleware/validate');
const audit = require('../middleware/audit');
const Student = require('../models/Student');
const User = require('../models/User');
const ExamResult = require('../models/ExamResult');
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

    res.json({ studentId: student._id, results });
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
