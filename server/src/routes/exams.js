const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const teacherAccess = require('../middleware/teacherAccess');
const Exam = require('../models/Exam');
const ExamMarks = require('../models/ExamMarks');
const ExamResult = require('../models/ExamResult');
const Student = require('../models/Student');
const ClassModel = require('../models/Class');
const Subject = require('../models/Subject');
const User = require('../models/User');
const TeacherSubjectAssignment = require('../models/TeacherSubjectAssignment');
const { buildTeacherAssignmentQuery, getAcademicYearCandidates } = require('../utils/teacherAssignmentQuery');
const { attachClassPositions } = require('../utils/examResultRanking');

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

async function lookupClassId(value) {
  if (!value) return null;
  if (mongoose.Types.ObjectId.isValid(value)) {
    const existing = await ClassModel.findById(value).select('_id').lean();
    if (existing) return existing._id;
  }

  const normalized = String(value).trim();
  if (!normalized) return null;

  let cls = await ClassModel.findOne({ name: new RegExp(`^${escapeRegex(normalized)}$`, 'i') }).select('_id').lean();
  if (!cls) {
    const numericMatch = normalized.match(/^(\d+)$/);
    if (numericMatch) {
      cls = await ClassModel.findOne({ numeric: parseInt(numericMatch[1], 10) }).select('_id').lean();
    }
  }

  return cls ? cls._id : null;
}

async function normalizeSubjectId(value) {
  if (!value) return null;
  if (mongoose.Types.ObjectId.isValid(value)) {
    const existing = await Subject.findById(value).select('_id').lean();
    if (existing) return existing._id;
  }

  const normalized = String(value).trim();
  if (!normalized) return null;

  const subject = await Subject.findOne({ name: new RegExp(`^${escapeRegex(normalized)}$`, 'i') }).select('_id').lean();
  return subject ? subject._id : null;
}

async function getTeacherAssignmentForClass(teacher, classId) {
  if (!teacher || !classId) return null;
  return TeacherSubjectAssignment.findOne(buildTeacherAssignmentQuery({
    teacher,
    classId,
    academicYear: new Date().getFullYear().toString()
  })).lean();
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

async function hasTeacherHistoricalMarksForClass(teacherId, classId) {
  if (!teacherId || !classId) return false;
  return await ExamMarks.exists({ class: classId, enteredBy: teacherId });
}

async function getTeacherHistoricalSubjectsForExamClass(teacherId, examId, classId) {
  if (!teacherId || !classId) return [];
  const query = { class: classId, enteredBy: teacherId };
  if (examId) query.exam = examId;
  return await ExamMarks.distinct('subject', query);
}

async function resolveAssignmentSubjectIds(assignment) {
  if (!assignment) return [];

  const subjectIds = new Set();
  if (Array.isArray(assignment.subjects) && assignment.subjects.length > 0) {
    assignment.subjects.forEach(subject => {
      if (subject) subjectIds.add(String(subject));
    });
  }

  if (Array.isArray(assignment.subjectNames) && assignment.subjectNames.length > 0) {
    const subjectDocs = await Subject.find({
      name: { $in: assignment.subjectNames }
    }).select('_id name').lean();
    subjectDocs.forEach(subject => {
      if (subject?._id) subjectIds.add(String(subject._id));
    });
  }

  return Array.from(subjectIds);
}

async function resolveClassEntries(classIds) {
  if (!classIds || !classIds.length) return [];

  const ids = Array.from(new Set(classIds.filter(Boolean).map(String)));
  const classDocs = await ClassModel.find({ _id: { $in: ids } }).select('_id name').lean();
  const classMap = new Map(classDocs.map(cls => [String(cls._id), { _id: cls._id, id: cls._id, name: cls.name || String(cls._id) }]));

  return ids.map(id => classMap.get(id) || { _id: id, id, name: String(id) });
}

async function resolveSubjectEntries(subjectIds) {
  if (!subjectIds || !subjectIds.length) return [];

  const ids = Array.from(new Set(subjectIds.filter(Boolean).map(String)));
  const objectIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
  const nameValues = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));

  const subjects = [];
  const seen = new Set();

  if (objectIds.length > 0) {
    const subjectDocs = await Subject.find({ _id: { $in: objectIds } }).select('_id name').lean();
    subjectDocs.forEach(subject => {
      if (!subject?._id) return;
      const key = String(subject._id);
      seen.add(key);
      subjects.push({ _id: subject._id, id: subject._id, name: subject.name || String(subject._id) });
    });
  }

  if (nameValues.length > 0) {
    const subjectDocs = await Subject.find({ name: { $in: nameValues } }).select('_id name').lean();
    subjectDocs.forEach(subject => {
      if (!subject?._id) return;
      const key = String(subject._id);
      if (seen.has(key)) return;
      seen.add(key);
      subjects.push({ _id: subject._id, id: subject._id, name: subject.name || String(subject._id) });
    });

    for (const subjectName of nameValues) {
      if (seen.has(subjectName)) continue;
      seen.add(subjectName);
      subjects.push({ _id: subjectName, id: subjectName, name: subjectName });
    }
  }

  return subjects;
}

async function buildAssignmentSubjectEntries(assignment) {
  if (!assignment) return [];

  const classId = assignment.class?._id || assignment.class || assignment.className;
  const subjects = [];
  const seen = new Set();

  if (Array.isArray(assignment.subjects) && assignment.subjects.length > 0) {
    const subjectDocs = await Subject.find({ _id: { $in: assignment.subjects } }).select('_id name').lean();
    for (const subject of subjectDocs) {
      if (!subject?._id) continue;
      const key = String(subject._id);
      if (seen.has(key)) continue;
      seen.add(key);
      subjects.push({
        _id: subject._id,
        id: subject._id,
        name: subject.name || String(subject._id),
        classId
      });
    }

    for (const subjectRef of assignment.subjects) {
      const key = String(subjectRef);
      if (!seen.has(key)) {
        seen.add(key);
        subjects.push({
          _id: subjectRef,
          id: subjectRef,
          name: String(subjectRef),
          classId
        });
      }
    }
  }

  if (Array.isArray(assignment.subjectNames) && assignment.subjectNames.length > 0) {
    const normalizedNames = assignment.subjectNames
      .filter(name => typeof name === 'string' && name.trim())
      .map(name => name.trim());

    const subjectDocs = await Subject.find({ name: { $in: normalizedNames } }).select('_id name').lean();
    const foundIds = new Set();
    for (const subject of subjectDocs) {
      if (!subject?._id) continue;
      const key = String(subject._id);
      if (seen.has(key)) continue;
      seen.add(key);
      foundIds.add(subject.name);
      subjects.push({
        _id: subject._id,
        id: subject._id,
        name: subject.name || String(subject._id),
        classId
      });
    }

    for (const subjectName of normalizedNames) {
      if (foundIds.has(subjectName)) continue;
      const key = subjectName;
      if (seen.has(key)) continue;
      seen.add(key);
      subjects.push({
        _id: subjectName,
        id: subjectName,
        name: subjectName,
        classId
      });
    }
  }

  return subjects;
}

async function buildAssignmentsFromTeacherMarks(teacherId) {
  if (!teacherId) return { classes: [], subjects: [] };

  const marks = await ExamMarks.find({ enteredBy: teacherId })
    .populate('class', 'name')
    .populate('subject', 'name')
    .lean();

  const classesMap = new Map();
  const subjectsMap = new Map();

  marks.forEach(mark => {
    const classId = mark.class?._id || mark.class;
    if (classId && !classesMap.has(String(classId))) {
      classesMap.set(String(classId), {
        _id: classId,
        name: mark.class?.name || mark.className || String(classId),
        id: classId
      });
    }

    const subjectId = mark.subject?._id || mark.subject;
    if (subjectId && !subjectsMap.has(String(subjectId))) {
      subjectsMap.set(String(subjectId), {
        _id: subjectId,
        name: mark.subject?.name || mark.subjectName || String(subjectId),
        id: subjectId,
        classId
      });
    }
  });

  return {
    classes: Array.from(classesMap.values()),
    subjects: Array.from(subjectsMap.values())
  };
}

async function getExamCompletionSummary(examId) {
  const exam = await Exam.findById(examId)
    .populate('class', 'name')
    .populate('subjects', 'name')
    .lean();

  if (!exam) return null;

  const classId = exam.class?._id || exam.class;
  const studentCount = await Student.countDocuments({ class: classId });
  const subjectProgress = [];

  for (const subject of exam.subjects || []) {
    const subjectId = subject._id || subject;
    const marks = await ExamMarks.find({ exam: examId, class: classId, subject: subjectId })
      .populate('enteredBy', 'name')
      .sort({ createdAt: 1 })
      .lean();

    const completed = studentCount > 0 && marks.length >= studentCount;
    subjectProgress.push({
      subject: {
        _id: subjectId,
        name: subject.name || 'Unnamed Subject'
      },
      marksCount: marks.length,
      studentCount,
      completed,
      status: completed ? 'completed' : 'pending',
      submittedBy: marks[0]?.enteredBy?.name || null
    });
  }

  const incompleteSubjects = subjectProgress.filter(item => !item.completed);
  return {
    exam,
    classId,
    studentCount,
    subjectProgress,
    incompleteSubjects,
    allCompleted: incompleteSubjects.length === 0
  };
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

// Teacher-specific routes (must come before generic :examId routes to avoid route conflicts)

// GET: Get marks already entered by the current teacher
router.get('/teacher/my-marks', auth, teacherAccess, async (req, res) => {
  try {
    const teacherId = req.user.id || req.user._id;
    const marks = await ExamMarks.find({ enteredBy: teacherId })
      .populate('exam', 'title type academicYear')
      .populate('subject', 'name')
      .populate('class', 'name')
      .populate('student', 'user fullName admissionNumber rollNumber')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ marks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET: Get teacher's assigned subjects and classes
router.get('/teacher/assignments', auth, teacherAccess, async (req, res) => {
  try {
    const teacher = req.teacher;
    let response = { subjects: [], classes: [] };

    if (teacher) {
      const assignments = await TeacherSubjectAssignment.find(buildTeacherAssignmentQuery({
        teacher,
        academicYear: new Date().getFullYear().toString()
      }))
        .populate('class', 'name')
        .populate('subjects', 'name')
        .lean();

      const classesMap = new Map();
      const subjectsMap = new Map();

      for (const assignment of assignments) {
        const classId = assignment.class?._id || assignment.class || assignment.className;
        if (classId && !classesMap.has(String(classId))) {
          classesMap.set(String(classId), {
            _id: classId,
            name: assignment.class?.name || assignment.className || String(classId),
            id: classId
          });
        }

        const subjectEntries = await buildAssignmentSubjectEntries(assignment);
        subjectEntries.forEach(subject => {
          if (!subject?._id) return;
          const subjectId = subject._id;
          if (!subjectsMap.has(String(subjectId))) {
            subjectsMap.set(String(subjectId), {
              _id: subjectId,
              name: subject.name || String(subjectId),
              id: subjectId,
              classId
            });
          }
        });
      }

      response = {
        subjects: Array.from(subjectsMap.values()),
        classes: Array.from(classesMap.values())
      };
    }

    if ((response.classes.length === 0 && response.subjects.length === 0) &&
      (req.teacherAssignments?.classes?.length > 0 || req.teacherAssignments?.subjects?.length > 0)
    ) {
      response = {
        classes: await resolveClassEntries(req.teacherAssignments.classes || []),
        subjects: await resolveSubjectEntries(req.teacherAssignments.subjects || [])
      };
    }

    if (response.classes.length === 0 && response.subjects.length === 0) {
      const fallback = await buildAssignmentsFromTeacherMarks(req.user.id || req.user._id);
      if (fallback.classes.length > 0 || fallback.subjects.length > 0) {
        response = fallback;
      }
    }

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET: Get students for teacher's assigned class
router.get('/teacher/students/:classId', auth, teacherAccess, async (req, res) => {
  try {
    const { classId: rawClassId } = req.params;
    const classId = await lookupClassId(rawClassId);

    if (!classId) {
      return res.status(400).json({ message: 'Invalid class ID' });
    }

    const assignment = await getTeacherAssignmentForClass(req.teacher, classId);
    if (!assignment) {
      const historyExists = await hasTeacherHistoricalMarksForClass(req.user.id || req.user._id, classId);
      if (!historyExists) {
        return res.status(403).json({ message: 'Access denied. You are not assigned to this class.' });
      }
    }

    const students = await Student.find({ class: classId, status: 'active' })
      .populate('user', 'name')
      .select('_id user fullName admissionNumber rollNumber')
      .lean();

    res.json({ students });
  } catch (err) {
    console.error('Error in teacher students endpoint:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET: Get teacher's assigned subjects for a specific class
router.get('/teacher/subjects/:classId', auth, teacherAccess, async (req, res) => {
  try {
    const { classId: rawClassId } = req.params;
    const classId = await lookupClassId(rawClassId);
    let subjects = [];

    if (classId) {
      const assignment = await getTeacherAssignmentForClass(req.teacher, classId);
      if (assignment) {
        if (Array.isArray(assignment.subjects) && assignment.subjects.length > 0) {
          subjects = await Subject.find({ _id: { $in: assignment.subjects } }).lean();
        }

        if (subjects.length === 0 && Array.isArray(assignment.subjectNames) && assignment.subjectNames.length > 0) {
          const normalizedNames = assignment.subjectNames
            .filter(name => typeof name === 'string' && name.trim())
            .map(name => name.trim());

          const subjectDocs = await Subject.find({ name: { $in: normalizedNames } }).lean();
          const foundNames = new Set(subjectDocs.map(s => String(s.name).trim()));

          subjects = subjectDocs.slice();
          normalizedNames.forEach(name => {
            if (!foundNames.has(name)) {
              subjects.push({ _id: name, name });
            }
          });
        }
      }
    }

    if (subjects.length === 0) {
      const className = classId ? await resolveClassNameFromId(classId) : String(rawClassId || '').trim();
      if (className) {
        subjects = await Subject.find({ class: className }).lean();
      }
    }

    if (subjects.length === 0) {
      return res.status(200).json({ subjects: [] });
    }

    res.json({ subjects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST: Teacher save marks (with access validation)
router.post('/teacher/:examId/marks', auth, teacherAccess, async (req, res) => {
  try {
    const { studentId, subjectId: rawSubject, theoryMarks, practicalMarks, maxTheoryMarks, maxPracticalMarks, classId: rawClassId } = req.body;
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const classId = await lookupClassId(rawClassId || exam.class);
    if (!classId) return res.status(400).json({ message: 'Valid class ID is required' });

    const assignment = await getTeacherAssignmentForClass(req.teacher, classId);
    if (!assignment) {
      return res.status(403).json({ message: 'Access denied. You are not assigned to this class.' });
    }

    const allowedSubjectIds = await resolveAssignmentSubjectIds(assignment);
    if (!allowedSubjectIds.length) {
      return res.status(403).json({ message: 'No assigned subjects found for this class.' });
    }

    const subjectId = await normalizeSubjectId(rawSubject);
    if (!subjectId) {
      return res.status(400).json({ message: 'Invalid subject' });
    }

    if (!allowedSubjectIds.includes(String(subjectId))) {
      return res.status(403).json({ message: 'Access denied. You are not assigned to this subject for this class.' });
    }

    const marks = await ExamMarks.findOneAndUpdate(
      { exam: req.params.examId, student: studentId, subject: subjectId, class: classId },
      {
        exam: req.params.examId,
        student: studentId,
        subject: subjectId,
        class: classId,
        theoryMarks,
        practicalMarks,
        maxTheoryMarks,
        maxPracticalMarks,
        enteredBy: req.user.id || req.user._id
      },
      { upsert: true, new: true }
    );

    await marks.save();
    res.json(marks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving marks', error: err.message });
  }
});

// GET: Get marks for teacher's subject assignments in a class
router.get('/teacher/:examId/marks', auth, teacherAccess, async (req, res) => {
  try {
    const { classId: rawClassId, subjectId: rawSubject } = req.query;
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const classId = await lookupClassId(rawClassId || exam.class);
    if (!classId) {
      return res.status(400).json({ message: 'Valid class ID is required' });
    }

    const assignment = await getTeacherAssignmentForClass(req.teacher, classId);
    let allowedSubjectIds = [];
    if (assignment) {
      allowedSubjectIds = await resolveAssignmentSubjectIds(assignment);
      if (allowedSubjectIds.length === 0) {
        return res.status(403).json({ message: 'No assigned subjects found for this class.' });
      }
    } else {
      const subjectHistory = await getTeacherHistoricalSubjectsForExamClass(req.user.id || req.user._id, req.params.examId, classId);
      if (!subjectHistory || subjectHistory.length === 0) {
        return res.status(403).json({ message: 'Access denied. You are not assigned to this class and no previous marks exist.' });
      }
      allowedSubjectIds = subjectHistory.map(String);
    }

    let subjectId = null;
    if (rawSubject) {
      subjectId = await normalizeSubjectId(rawSubject);
      if (!subjectId) {
        return res.status(400).json({ message: 'Invalid subject' });
      }
      if (!allowedSubjectIds.includes(String(subjectId))) {
        return res.status(403).json({ message: 'Access denied. You are not assigned to this subject for this class.' });
      }
    }

    const query = {
      exam: req.params.examId,
      class: classId,
      subject: subjectId ? subjectId : { $in: allowedSubjectIds }
    };

    const marks = await ExamMarks.find(query)
      .populate('student', 'user fullName admissionNumber rollNumber')
      .populate('subject', 'name')
      .lean();

    res.json({ marks });
  } catch (err) {
    console.error('Error in teacher marks endpoint:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generic exam routes (must come after teacher-specific routes)

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
    const { studentId, subjectId: rawSubject, theoryMarks, practicalMarks, maxTheoryMarks, maxPracticalMarks, classId: rawClassId } = req.body;
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const classId = rawClassId || exam.class;
    if (!classId) return res.status(400).json({ message: 'Class ID is required for saving marks' });

    // Validate theory and practical marks
    if (theoryMarks === undefined || theoryMarks === null || theoryMarks === '') {
      return res.status(400).json({ message: 'Theory marks are required' });
    }
    if (practicalMarks === undefined || practicalMarks === null || practicalMarks === '') {
      return res.status(400).json({ message: 'Practical marks are required' });
    }
    if (isNaN(theoryMarks) || isNaN(practicalMarks)) {
      return res.status(400).json({ message: 'Marks must be numeric values' });
    }

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
        theoryMarks: Number(theoryMarks) || 0,
        practicalMarks: Number(practicalMarks) || 0,
        maxTheoryMarks: Number(maxTheoryMarks) || 50,
        maxPracticalMarks: Number(maxPracticalMarks) || 50,
        enteredBy: req.user.id || req.user._id
      });
    } else {
      marks.theoryMarks = Number(theoryMarks) || 0;
      marks.practicalMarks = Number(practicalMarks) || 0;
      if (maxTheoryMarks !== undefined) marks.maxTheoryMarks = Number(maxTheoryMarks) || 50;
      if (maxPracticalMarks !== undefined) marks.maxPracticalMarks = Number(maxPracticalMarks) || 50;
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

    const completion = await getExamCompletionSummary(req.params.examId);
    if (!completion?.allCompleted) {
      const pendingNames = (completion?.incompleteSubjects || [])
        .map(item => item.subject?.name || 'Unnamed Subject')
        .join(', ');
      return res.status(400).json({
        message: 'Results cannot be generated until all subjects are fully marked.',
        pendingSubjects: pendingNames
      });
    }

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
        const theoryObtained = Number(m.theoryMarks) || 0;
        const practicalObtained = Number(m.practicalMarks) || 0;
        const obtained = theoryObtained + practicalObtained;

        const maxTheory = Number(m.maxTheoryMarks) || 50;
        const maxPractical = Number(m.maxPracticalMarks) || 50;
        const entryMax = maxTheory + maxPractical;

        const theoryPass = Number(m.maxTheoryMarks) > 0 ? Math.min(20, Number(m.maxTheoryMarks) || 50) : 20;
        const practicalPass = Number(m.maxPracticalMarks) > 0 ? Math.min(20, Number(m.maxPracticalMarks) || 50) : 20;
        const subjectPassed = theoryObtained > theoryPass && practicalObtained > practicalPass;

        totalMarksObtained += obtained;
        totalMaxMarks += entryMax;
        const percentageForSubject = entryMax > 0 ? (obtained / entryMax) * 100 : 0;
        subjectMarks.push({
          subject: m.subject._id,
          theoryMarks: theoryObtained,
          practicalMarks: practicalObtained,
          maxTheoryMarks: maxTheory,
          maxPracticalMarks: maxPractical,
          marksObtained: obtained,
          maxMarks: entryMax,
          passMarks: theoryPass + practicalPass,
          percentage: percentageForSubject,
          grade: m.grade,
          passStatus: subjectPassed ? 'Pass' : 'Fail'
        });
      });

      const totalPercentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
      let totalGrade = 'F';
      if (totalPercentage >= 90) totalGrade = 'A+';
      else if (totalPercentage >= 80) totalGrade = 'A';
      else if (totalPercentage >= 70) totalGrade = 'B+';
      else if (totalPercentage >= 60) totalGrade = 'B';
      else if (totalPercentage >= 50) totalGrade = 'C';

      const failedAnySubject = subjectMarks.some(s => {
        const theory = Number(s.theoryMarks) || 0;
        const practical = Number(s.practicalMarks) || 0;
        const theoryPass = Number(s.maxTheoryMarks) > 0 ? Math.min(20, Number(s.maxTheoryMarks)) : 20;
        const practicalPass = Number(s.maxPracticalMarks) > 0 ? Math.min(20, Number(s.maxPracticalMarks)) : 20;
        return theory <= theoryPass || practical <= practicalPass;
      });
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

    // Calculate class positions using actual marks/percentage so the leaderboard is accurate.
    const allResults = await ExamResult.find({ exam: req.params.examId });
    allResults.sort((a, b) => {
      const pa = (a.passStatus === 'Pass') ? 0 : 1;
      const pb = (b.passStatus === 'Pass') ? 0 : 1;
      if (pa !== pb) return pa - pb;

      const marksA = Number(a.totalMarksObtained) || 0;
      const marksB = Number(b.totalMarksObtained) || 0;
      if (marksA !== marksB) return marksB - marksA;

      const pctA = Number(a.totalPercentage) || 0;
      const pctB = Number(b.totalPercentage) || 0;
      if (pctA !== pctB) return pctB - pctA;

      return (a.student?.toString() || '').localeCompare(b.student?.toString() || '');
    });
    for (let i = 0; i < allResults.length; i++) {
      allResults[i].classPosition = i + 1;
      await allResults[i].save();
    }

    // Return the number of results computed
    const generatedCount = Array.isArray(allResults) ? allResults.length : await ExamResult.countDocuments({ exam: req.params.examId });
    res.json({ message: 'Results generated successfully', count: generatedCount });
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
      const pa = (a.passStatus === 'Pass') ? 0 : 1;
      const pb = (b.passStatus === 'Pass') ? 0 : 1;
      if (pa !== pb) return pa - pb;

      const marksA = Number(a.totalMarksObtained) || 0;
      const marksB = Number(b.totalMarksObtained) || 0;
      if (marksA !== marksB) return marksB - marksA;

      const pctA = Number(a.totalPercentage) || 0;
      const pctB = Number(b.totalPercentage) || 0;
      if (pctA !== pctB) return pctB - pctA;

      const posA = Number.isFinite(a.classPosition) ? a.classPosition : Number.MAX_SAFE_INTEGER;
      const posB = Number.isFinite(b.classPosition) ? b.classPosition : Number.MAX_SAFE_INTEGER;
      if (posA !== posB) return posA - posB;
      return (a.student?.toString() || '').localeCompare(b.student?.toString() || '');
    });

    const rankedResults = attachClassPositions(results);
    const mappedResults = rankedResults.map((result) => ({
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

    const rankedResults = attachClassPositions([result.toObject ? result.toObject() : result]);
    const rankedResult = rankedResults[0];

    // Ensure rollNumber is populated from admissionNumber if needed
    if (rankedResult.student) {
      rankedResult.student = {
        ...rankedResult.student,
        rollNumber: rankedResult.student.rollNumber || rankedResult.student.admissionNumber
      };
    }

    res.json(rankedResult);
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

// ==================== TEACHER-SPECIFIC ENDPOINTS ====================

// GET: Get exam subject completion progress for admins
router.get('/:examId/progress', auth, roles(['admin', 'examcontroller', 'superadmin', 'principal']), async (req, res) => {
  try {
    const completion = await getExamCompletionSummary(req.params.examId);
    if (!completion) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json({
      exam: {
        _id: completion.exam._id,
        title: completion.exam.title,
        type: completion.exam.type,
        className: completion.exam.class?.name || null
      },
      subjectProgress: completion.subjectProgress,
      allCompleted: completion.allCompleted
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;



