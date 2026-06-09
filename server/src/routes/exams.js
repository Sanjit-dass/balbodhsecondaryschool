const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const Exam = require('../models/Exam');
const ExamMarks = require('../models/ExamMarks');
const ExamResult = require('../models/ExamResult');
const Student = require('../models/Student');
const ClassModel = require('../models/Class');
const Subject = require('../models/Subject');

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function resolveClassId(value) {
  if (!value) return null;
  if (mongoose.Types.ObjectId.isValid(value)) {
    const existing = await ClassModel.findById(value);
    if (existing) return existing._id;
  }

  const normalized = String(value).trim();
  if (!normalized) return null;

  let cls = await ClassModel.findOne({ name: new RegExp(`^${escapeRegex(normalized)}$`, 'i') });
  if (!cls) {
    const numericMatch = normalized.match(/^(\d+)$/);
    if (numericMatch) {
      cls = await ClassModel.findOne({ numeric: parseInt(numericMatch[1], 10) });
    }
  }

  if (!cls) {
    cls = new ClassModel({ name: normalized, numeric: Number(normalized) || undefined });
    await cls.save();
  }
  return cls._id;
}

function normalizeClassLabel(value) {
  if (!value) return null;
  let label = String(value).trim();
  label = label.replace(/^class\s*/i, '').trim();
  label = label.replace(/(?:st|nd|rd|th)$/i, '').trim();
  if (!label) return null;
  return label;
}

function buildClassNameFilters(rawClassName) {
  const filters = [];
  if (!rawClassName) return filters;
  const label = normalizeClassLabel(rawClassName);
  const exact = String(rawClassName).trim();
  if (exact) {
    filters.push({ className: exact });
    filters.push({ className: new RegExp(`^${escapeRegex(exact)}$`, 'i') });
  }
  if (label && label !== exact) {
    filters.push({ className: label });
    filters.push({ className: new RegExp(`^${escapeRegex(label)}$`, 'i') });
    filters.push({ className: new RegExp(escapeRegex(label), 'i') });
  }
  return filters;
}

function addUniqueFilters(destination, items) {
  for (const item of items) {
    const key = JSON.stringify(item);
    if (!destination.some(existing => JSON.stringify(existing) === key)) {
      destination.push(item);
    }
  }
}

async function resolveClassNameFromId(classValue) {
  if (!classValue) return null;
  if (mongoose.Types.ObjectId.isValid(classValue)) {
    try {
      const cls = await ClassModel.findById(classValue).select('name').lean();
      if (cls?.name) return cls.name;
    } catch (e) {
      console.debug('Could not resolve class ID to name:', e.message);
    }
  }
  return null;
}

async function buildStudentClassFilters(rawClassValue) {
  const filters = [];
  if (!rawClassValue) return filters;

  let classInput = rawClassValue;
  let resolvedClassName = null;

  if (typeof classInput === 'object' && classInput !== null) {
    if (classInput._id) {
      classInput = classInput._id;
    } else if (classInput.class) {
      classInput = classInput.class;
    } else if (classInput.name) {
      classInput = classInput.name;
    } else if (classInput.className) {
      classInput = classInput.className;
    } else if (mongoose.Types.ObjectId.isValid(classInput)) {
      classInput = String(classInput);
    }
  }

  // If it's an ObjectId, resolve to class name
  if (mongoose.Types.ObjectId.isValid(classInput)) {
    resolvedClassName = await resolveClassNameFromId(classInput);
    filters.push({ class: classInput });
    if (resolvedClassName) {
      filters.push({ className: resolvedClassName });
      // Apply numeric variations for resolved numeric class names (e.g., "10" -> "Class 10", "10th", etc.)
      if (/^\d+$/.test(resolvedClassName)) {
        addUniqueFilters(filters, [
          { className: `Class ${resolvedClassName}` },
          { className: `${resolvedClassName}th` },
          { className: `Grade ${resolvedClassName}` },
          { className: `Std ${resolvedClassName}` },
          { className: new RegExp(`\\b${escapeRegex(resolvedClassName)}\\b`, 'i') }
        ]);
      }
    }
  } else if (typeof classInput === 'string') {
    const rawValue = classInput.trim();
    if (!rawValue) return filters;

    // Match both ObjectId in class field and string in className field
    filters.push({ class: rawValue });
    filters.push({ className: rawValue });
    filters.push({ className: new RegExp(`^${escapeRegex(rawValue)}$`, 'i') });
    filters.push({ className: new RegExp(escapeRegex(rawValue), 'i') });

    // Support patterns like 'Class 10', '10th', 'Grade 10', 'Std 10', etc.
    if (/^\d+$/.test(rawValue)) {
      addUniqueFilters(filters, [
        { className: `Class ${rawValue}` },
        { className: `${rawValue}th` },
        { className: `Grade ${rawValue}` },
        { className: `Std ${rawValue}` },
        { className: new RegExp(`\\b${escapeRegex(rawValue)}\\b`, 'i') },
        { class: `Class ${rawValue}` },
        { class: `${rawValue}th` },
        { class: `Grade ${rawValue}` },
        { class: `Std ${rawValue}` }
      ]);
    }
  }

  return filters;
}

// GET: List all exams, optionally filtered by class
router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.class) {
      if (mongoose.Types.ObjectId.isValid(req.query.class)) {
        filter.class = req.query.class;
      } else {
        const resolvedClassId = await resolveClassId(req.query.class);
        if (resolvedClassId) {
          filter.class = resolvedClassId;
        } else {
          filter.className = req.query.class;
        }
      }
    }
    const list = await Exam.find(filter).populate('class', 'name').populate('subjects', 'name code').lean();
    res.json({ exams: list });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET: Get exam by id
router.get('/:id', auth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('class', 'name')
      .populate('subjects', 'name code')
      .lean();
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json({ exam });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST: Create new exam (Admin/Exam Controller)
router.post('/', auth, roles(['admin', 'examcontroller', 'superadmin', 'principal']), async (req, res) => {
  try {
    const { normalizeAttachment, resolveAttachmentRemote } = require('../utils/cloudinaryHelpers');
    if (req.body.admitCardUrl) req.body.admitCard = normalizeAttachment(req.body.admitCardUrl);
    if (req.body.marksheetUrl) req.body.marksheet = normalizeAttachment(req.body.marksheetUrl);
    if (req.body.admitCard) req.body.admitCard = normalizeAttachment(req.body.admitCard);
    if (req.body.marksheet) req.body.marksheet = normalizeAttachment(req.body.marksheet);
    if (req.body.admitCard) req.body.admitCard = await resolveAttachmentRemote(req.body.admitCard);
    if (req.body.marksheet) req.body.marksheet = await resolveAttachmentRemote(req.body.marksheet);

    const ALL_CLASS_VALUE = 'all';
    let className = null;
    let createdExams = null;

    if (req.body.class && req.body.class !== ALL_CLASS_VALUE) {
      req.body.class = await resolveClassId(req.body.class);
      const classDoc = await ClassModel.findById(req.body.class);
      className = classDoc?.name;
    }

    if (req.body.class === ALL_CLASS_VALUE) {
      const classes = await ClassModel.find();
      if (!classes.length) {
        return res.status(400).json({ message: 'No classes available to create exam for all classes' });
      }

      const exams = await Promise.all(classes.map(async (cls) => {
        const examPayload = {
          ...req.body,
          class: cls._id,
          title: req.body.title || `${req.body.type}${cls.name ? ` - ${cls.name}` : ''}${req.body.academicYear ? ` (${req.body.academicYear})` : ''}`.trim(),
          createdBy: req.user.id || req.user._id
        };
        const exam = new Exam(examPayload);
        await exam.save();
        await exam.populate('class', 'name');
        await exam.populate('subjects', 'name code');
        return exam;
      }));

      return res.json({ exams });
    }

    if (!req.body.title) {
      req.body.title = `${req.body.type}${className ? ` - ${className}` : ''}${req.body.academicYear ? ` (${req.body.academicYear})` : ''}`.trim();
    }

    const exam = new Exam({
      ...req.body,
      createdBy: req.user.id || req.user._id
    });
    await exam.save();
    await exam.populate('class', 'name');
    await exam.populate('subjects', 'name code');
    res.json(exam);
  } catch (err) {
    console.error('Exam creation error:', err);
    res.status(500).json({ message: 'Error creating exam', error: err.message, stack: err.stack });
  }
});

// PUT: Update exam
router.put('/:id', auth, roles(['admin', 'examcontroller', 'superadmin', 'principal']), async (req, res) => {
  try {
    const { normalizeAttachment, resolveAttachmentRemote } = require('../utils/cloudinaryHelpers');
    if (req.body.admitCardUrl) req.body.admitCard = normalizeAttachment(req.body.admitCardUrl);
    if (req.body.marksheetUrl) req.body.marksheet = normalizeAttachment(req.body.marksheetUrl);
    if (req.body.admitCard) req.body.admitCard = normalizeAttachment(req.body.admitCard);
    if (req.body.marksheet) req.body.marksheet = normalizeAttachment(req.body.marksheet);
    if (req.body.admitCard) req.body.admitCard = await resolveAttachmentRemote(req.body.admitCard);
    if (req.body.marksheet) req.body.marksheet = await resolveAttachmentRemote(req.body.marksheet);

    if (req.body.class) {
      req.body.class = await resolveClassId(req.body.class);
    }

    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await exam.populate('class', 'name');
    await exam.populate('subjects', 'name code');
    res.json(exam);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// DELETE: Delete exam
router.delete('/:id', auth, roles(['admin', 'examcontroller', 'superadmin', 'principal']), async (req, res) => {
  try {
    await Exam.findByIdAndDelete(req.params.id);
    await ExamMarks.deleteMany({ exam: req.params.id });
    await ExamResult.deleteMany({ exam: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET: Get students for marks entry
router.get('/:examId/students', auth, roles(['admin', 'examcontroller', 'superadmin', 'principal']), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId).populate('class', 'name').lean();
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const overrideClassRaw = req.query.classId || req.query.class || req.query.className;
    const effectiveClass = overrideClassRaw || exam.class;
    
    // Resolve to class document for better information
    let resolvedClass = null;
    let resolvedClassName = null;
    if (mongoose.Types.ObjectId.isValid(effectiveClass)) {
      resolvedClass = await ClassModel.findById(effectiveClass).select('name numeric').lean();
      resolvedClassName = resolvedClass?.name || null;
    } else if (typeof effectiveClass === 'string') {
      resolvedClassName = effectiveClass;
    } else if (typeof effectiveClass === 'object' && effectiveClass?.name) {
      resolvedClassName = effectiveClass.name;
    }

    console.debug('=== Marks Entry Student Fetch ===');
    console.debug('Selected Class ID:', effectiveClass);
    console.debug('Resolved Class Name:', resolvedClassName);

    const classQuery = await buildStudentClassFilters(effectiveClass);
    console.debug('Built class query filters:', JSON.stringify(classQuery));

    if (!classQuery || classQuery.length === 0) {
      return res.status(400).json({ message: 'Class filter could not be resolved. Provide a valid classId or className.' });
    }

    const students = await Student.find({ $or: classQuery })
      .select('_id user admissionNumber rollNumber class className fullName')
      .lean();

    console.debug('Students Found:', students.length);
    console.debug('=== End Marks Entry Student Fetch ===');

    res.json({ students, className: resolvedClassName, classId: effectiveClass });
  } catch (err) {
    console.error('Error fetching students for marks:', err);
    res.status(500).json({ message: 'Error fetching students', error: err.message });
  }
});

// GET: Get subjects for marks entry (for a specific exam-class)
router.get('/:examId/subjects', auth, roles(['admin', 'examcontroller', 'superadmin', 'principal']), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId)
      .populate('class', 'name')
      .populate('subjects', 'name code')
      .lean();
    
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const overrideClassRaw = req.query.classId || req.query.class || req.query.className;
    const effectiveClass = overrideClassRaw || exam.class;
    
    let resolvedClassName = null;
    if (mongoose.Types.ObjectId.isValid(effectiveClass)) {
      const cls = await ClassModel.findById(effectiveClass).select('name').lean();
      resolvedClassName = cls?.name || null;
    } else if (typeof effectiveClass === 'string') {
      resolvedClassName = effectiveClass;
    } else if (typeof effectiveClass === 'object' && effectiveClass?.name) {
      resolvedClassName = effectiveClass.name;
    }

    console.debug('=== Marks Entry Subject Fetch ===');
    console.debug('Selected Class:', effectiveClass);
    console.debug('Resolved Class Name:', resolvedClassName);

    // First, use subjects linked to the exam
    let subjects = exam.subjects || [];
    
    // If no subjects linked to exam, fetch by class name
    if (subjects.length === 0 && resolvedClassName) {
      const byClass = await Subject.find({ class: resolvedClassName }).lean();
      subjects = byClass;
    }

    console.debug('Subjects Found:', subjects.length);
    console.debug('=== End Marks Entry Subject Fetch ===');

    res.json({ subjects, className: resolvedClassName, classId: effectiveClass });
  } catch (err) {
    console.error('Error fetching subjects for marks:', err);
    res.status(500).json({ message: 'Error fetching subjects', error: err.message });
  }
});

// POST: Enter marks
router.post('/:examId/marks', auth, roles(['admin', 'examcontroller', 'superadmin', 'principal']), async (req, res) => {
  try {
    const { studentId, subjectId: rawSubject, marksObtained, maxMarks, classId: rawClassId } = req.body;
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const classId = rawClassId || exam.class;
    if (!classId) return res.status(400).json({ message: 'Class ID is required for saving marks' });

    let subjectId = rawSubject;
    if (subjectId && !mongoose.Types.ObjectId.isValid(subjectId)) {
      const normalized = String(subjectId).trim();
      let subj = await Subject.findOne({ name: new RegExp(`^${escapeRegex(normalized)}$`, 'i') });
      if (!subj && normalized) {
        subj = new Subject({ name: normalized });
        await subj.save();
      }
      subjectId = subj ? subj._id : null;
    }

    if (!subjectId) return res.status(400).json({ message: 'Invalid subject' });

    let marks = await ExamMarks.findOne({
      exam: req.params.examId,
      student: studentId,
      subject: subjectId,
      class: classId
    });

    if (!marks) {
      marks = new ExamMarks({
        exam: req.params.examId,
        student: studentId,
        subject: subjectId,
        class: classId,
        marksObtained,
        maxMarks,
        enteredBy: req.user.id || req.user._id
      });
    } else {
      marks.marksObtained = marksObtained;
      marks.maxMarks = maxMarks;
      marks.enteredBy = req.user.id || req.user._id;
    }

    await marks.save();
    res.json(marks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving marks', error: err.message });
  }
});

// GET: Get marks for an exam-class-subject
router.get('/:examId/marks', auth, async (req, res) => {
  try {
    const { classId: rawClassId, subjectId: rawSubject } = req.query;
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const classId = rawClassId || exam.class;
    let subjectId = rawSubject;
    if (subjectId && !mongoose.Types.ObjectId.isValid(subjectId)) {
      const normalized = String(subjectId).trim();
      const subj = await Subject.findOne({ name: new RegExp(`^${escapeRegex(normalized)}$`, 'i') });
      subjectId = subj ? subj._id : null;
    }

    if (!classId) return res.json({ marks: [] });

    if (!subjectId) {
      const allMarks = await ExamMarks.find({ exam: req.params.examId, class: classId })
        .populate('student', 'rollNumber user fullName')
        .populate('subject', 'name')
        .lean();
      return res.json({ marks: allMarks });
    }

    const marks = await ExamMarks.find({
      exam: req.params.examId,
      class: classId,
      subject: subjectId
    }).populate('student', 'rollNumber user fullName').populate('subject', 'name').lean();

    res.json({ marks });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// PUT: Update marks
router.put('/:examId/marks/:marksId', auth, roles(['admin', 'examcontroller', 'superadmin', 'principal']), async (req, res) => {
  try {
    const marks = await ExamMarks.findByIdAndUpdate(req.params.marksId, req.body, { new: true });
    res.json(marks);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// DELETE: Delete marks entry
router.delete('/:examId/marks/:marksId', auth, roles(['admin', 'examcontroller', 'superadmin', 'principal']), async (req, res) => {
  try {
    await ExamMarks.findByIdAndDelete(req.params.marksId);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST: Generate results (calculate totals, grades, positions)
router.post('/:examId/generate-results', auth, roles(['admin', 'examcontroller', 'superadmin', 'principal']), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    // Get all students in the class, including legacy records that store className instead of class ObjectId
    const studentClassFilters = await buildStudentClassFilters(exam.class);
    if (!studentClassFilters || studentClassFilters.length === 0) {
      return res.status(400).json({ message: 'Exam class could not be resolved to students. Ensure exam has a class set.' });
    }
    const students = await Student.find({ $or: studentClassFilters }).select('_id');
    const studentIds = students.map(s => s._id);

    // Delete existing results for this exam
    await ExamResult.deleteMany({ exam: req.params.examId });

    // Calculate results for each student
    for (const studentId of studentIds) {
      const marks = await ExamMarks.find({ exam: req.params.examId, student: studentId }).populate('subject');
      
      if (marks.length === 0) continue;

      let totalMarksObtained = 0;
      let totalMaxMarks = 0;
      const subjectMarks = [];

      marks.forEach(m => {
        totalMarksObtained += m.marksObtained;
        totalMaxMarks += m.maxMarks;
        subjectMarks.push({
          subject: m.subject._id,
          marksObtained: m.marksObtained,
          maxMarks: m.maxMarks,
          percentage: (m.marksObtained / m.maxMarks) * 100,
          grade: m.grade
        });
      });

      const totalPercentage = (totalMarksObtained / totalMaxMarks) * 100;
      let totalGrade = 'F';
      if (totalPercentage >= 90) totalGrade = 'A+';
      else if (totalPercentage >= 80) totalGrade = 'A';
      else if (totalPercentage >= 70) totalGrade = 'B+';
      else if (totalPercentage >= 60) totalGrade = 'B';
      else if (totalPercentage >= 50) totalGrade = 'C';

      const passMarks = Number(exam.passMarks ?? 40);
      const failedAnySubject = marks.some(m => Number(m.marksObtained) < passMarks);
      const passStatus = failedAnySubject ? 'Fail' : 'Pass';

      const result = new ExamResult({
        exam: req.params.examId,
        student: studentId,
        class: exam.class,
        subjectMarks,
        totalMarksObtained,
        totalMaxMarks,
        totalPercentage,
        totalGrade,
        passStatus
      });

      await result.save();
    }

    // Calculate class positions for all students by total percentage
    const results = await ExamResult.find({ exam: req.params.examId }).sort({ totalPercentage: -1 });
    for (let i = 0; i < results.length; i++) {
      results[i].classPosition = i + 1;
      await results[i].save();
    }

    res.json({ message: 'Results generated successfully', count: results.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating results', error: err.message });
  }
});

// GET: Get exam results
router.get('/:examId/results', auth, async (req, res) => {
  try {
    const results = await ExamResult.find({ exam: req.params.examId })
      .populate({
        path: 'student',
        select: 'rollNumber admissionNumber user fullName',
        populate: { path: 'user', select: 'name' }
      })
      .populate('exam', 'type academicYear passMarks maxMarks')
      .populate('class', 'name')
      .populate('subjectMarks.subject', 'name')
      .lean();

    results.sort((a, b) => {
      const posA = Number.isFinite(a.classPosition) ? a.classPosition : Number.MAX_SAFE_INTEGER;
      const posB = Number.isFinite(b.classPosition) ? b.classPosition : Number.MAX_SAFE_INTEGER;
      if (posA !== posB) return posA - posB;
      return (b.totalPercentage || 0) - (a.totalPercentage || 0);
    });

    // Map results to ensure rollNumber is populated from admissionNumber if needed
    const mappedResults = results.map(result => ({
      ...result,
      student: {
        ...result.student,
        rollNumber: result.student?.rollNumber || result.student?.admissionNumber
      }
    }));

    res.json({ results: mappedResults });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET: Get results for a student
router.get('/:examId/results/:studentId', auth, async (req, res) => {
  try {
    const result = await ExamResult.findOne({ exam: req.params.examId, student: req.params.studentId })
      .populate('student', 'rollNumber admissionNumber user')
      .populate('subjectMarks.subject', 'name');

    if (!result) return res.status(404).json({ message: 'Result not found' });
    
    // Ensure rollNumber is populated from admissionNumber if needed
    if (result.student) {
      result.student = {
        ...result.student.toObject?.() || result.student,
        rollNumber: result.student.rollNumber || result.student.admissionNumber
      };
    }
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST: Publish results
router.post('/:examId/publish-results', auth, roles(['admin', 'examcontroller', 'superadmin', 'principal']), async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.examId, {
      resultsPublished: true,
      publishedAt: new Date()
    }, { new: true });

    res.json({ message: 'Results published', exam });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET: Dashboard stats
router.get('/dashboard/stats', auth, async (req, res) => {
  try {
    const totalExams = await Exam.countDocuments();
    const resultsPublished = await Exam.countDocuments({ resultsPublished: true });
    
    const allResults = await ExamResult.find();
    const studentsPassed = allResults.filter(r => r.passStatus === 'Pass').length;
    const studentsFailed = allResults.filter(r => r.passStatus === 'Fail').length;

    res.json({
      totalExams,
      resultsPublished,
      studentsPassed,
      studentsFailed
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/export/csv', auth, async (req, res) => {
  try {
    const { Parser } = require('json2csv');
    const list = await Exam.find().lean();
    const data = list.map(item => ({
      title: item.title,
      type: item.type,
      class: item.class,
      date: item.startDate ? item.startDate.toISOString().slice(0, 10) : ''
    }));
    const parser = new Parser({ fields: ['title', 'type', 'class', 'date'] });
    res.header('Content-Type', 'text/csv');
    res.attachment('exams.csv');
    res.send(parser.parse(data));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
