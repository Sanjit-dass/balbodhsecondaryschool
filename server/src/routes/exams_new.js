const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const Exam = require('../models/Exam');
const ExamMarks = require('../models/ExamMarks');
const ExamResult = require('../models/ExamResult');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');

// GET: List all exams
router.get('/', auth, async (req, res) => {
  try {
    const list = await Exam.find().populate('class', 'name').populate('subjects', 'name code').lean();
    res.json({ exams: list });
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
    
    const exam = new Exam({
      ...req.body,
      createdBy: req.user.id || req.user._id
    });
    await exam.save();
    await exam.populate('class', 'name').populate('subjects', 'name code');
    res.json(exam);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating exam', error: err.message });
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
    
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await exam.populate('class', 'name').populate('subjects', 'name code');
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
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const students = await Student.find({ class: exam.class })
      .populate('user', 'name email')
      .select('user rollNumber class')
      .lean();
    
    res.json({ students });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST: Enter marks
router.post('/:examId/marks', auth, roles(['admin', 'examcontroller', 'superadmin', 'principal']), async (req, res) => {
  try {
    const { studentId, subjectId, marksObtained, maxMarks, classId } = req.body;

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
    const { classId, subjectId } = req.query;

    const marks = await ExamMarks.find({
      exam: req.params.examId,
      class: classId,
      subject: subjectId
    }).populate('student', 'rollNumber user').populate('subject', 'name').lean();

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

    // Get all students in the class
    const students = await Student.find({ class: exam.class }).select('_id');
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
      .populate('student', 'rollNumber admissionNumber user')
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
