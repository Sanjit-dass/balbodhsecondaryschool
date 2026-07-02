const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const TeacherSubjectAssignment = require('../models/TeacherSubjectAssignment');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

async function getNextTeacherId() {
  let nextNumber = 1;
  while (true) {
    const candidateId = `BBS${String(nextNumber).padStart(2, '0')}`;
    const existingTeacher = await Teacher.findOne({ employeeId: candidateId }).lean();
    if (!existingTeacher) {
      return candidateId;
    }
    nextNumber += 1;
  }
}

async function normalizeTeacherId(teacherDoc) {
  if (!teacherDoc) return null;
  if (teacherDoc.employeeId && /^BBS\d+$/.test(teacherDoc.employeeId)) {
    return teacherDoc.employeeId;
  }

  const previousEmployeeId = teacherDoc.employeeId;
  const nextId = await getNextTeacherId();
  teacherDoc.employeeId = nextId;
  await teacherDoc.save();

  if (teacherDoc._id) {
    const updateQuery = { teacher: teacherDoc._id };
    if (previousEmployeeId) {
      updateQuery.teacherId = previousEmployeeId;
    }
    await TeacherSubjectAssignment.updateMany(updateQuery, { $set: { teacherId: nextId } });
  }

  return nextId;
}

async function normalizeAssignmentTeacherId(assignment) {
  if (assignment?.teacher && typeof assignment.teacher === 'object') {
    const normalizedId = await normalizeTeacherId(assignment.teacher);
    if (normalizedId) {
      assignment.teacherId = normalizedId;
    }
  }
  return assignment;
}

// Get all teacher subject assignments (Admin only)
router.get('/', auth, roles(['admin', 'superadmin']), async (req, res) => {
  try {
    const assignments = await TeacherSubjectAssignment.find()
      .populate('teacher', 'fullName employeeId')
      .populate('class', 'name')
      .populate('subjects', 'name')
      .sort({ academicYear: -1, teacherName: 1, className: 1 });

    const normalizedAssignments = await Promise.all(assignments.map(normalizeAssignmentTeacherId));
    res.json(normalizedAssignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching assignments' });
  }
});

// Get assignments by teacher ID (for teachers - simplified without auth requirement)
router.get('/my-assignments', async (req, res) => {
  try {
    const requestedTeacherId = req.query.teacherId;
    const teacherLookupId = requestedTeacherId || req.user?.teacherId || req.user?.employeeId || req.user?.id || req.user?._id;

    const teacher = await Teacher.findOne({
      $or: [
        { user: teacherLookupId },
        { _id: teacherLookupId },
        { employeeId: teacherLookupId },
        { username: teacherLookupId }
      ]
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    const assignments = await TeacherSubjectAssignment.find({
      teacher: teacher._id,
      status: 'active'
    })
      .populate('teacher', 'fullName employeeId')
      .populate('class', 'name')
      .populate('subjects', 'name')
      .sort({ className: 1 });

    const normalizedAssignments = await Promise.all(assignments.map(normalizeAssignmentTeacherId));
    res.json(normalizedAssignments);
  } catch (err) {
    console.error('Error fetching teacher assignments:', err);
    res.status(500).json({ message: 'Error fetching your assignments' });
  }
});

// Get assignments by teacher ID (Admin)
router.get('/teacher/:teacherId', auth, roles(['admin', 'superadmin']), async (req, res) => {
  try {
    const assignments = await TeacherSubjectAssignment.find({ teacherId: req.params.teacherId })
      .populate('teacher', 'fullName employeeId')
      .populate('class', 'name')
      .populate('subjects', 'name')
      .sort({ academicYear: -1, className: 1 });

    const normalizedAssignments = await Promise.all(assignments.map(normalizeAssignmentTeacherId));
    res.json(normalizedAssignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching teacher assignments' });
  }
});

// Create new teacher subject assignment (Admin only)
router.post('/', auth, roles(['admin', 'superadmin']), async (req, res) => {
  try {
    const { teacher, class: classId, subjects, academicYear } = req.body;

    console.log('Creating assignment with data:', { teacher, class: classId, subjects, academicYear });

    // Validate teacher exists
    const teacherDoc = await Teacher.findById(teacher);
    if (!teacherDoc) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Auto-generate teacherId from teacher's employeeId
    const autoTeacherId = await normalizeTeacherId(teacherDoc);

    // Validate class exists (handle both ObjectId and class name)
    let classDoc;
    // First try to find by name since frontend sends class names like "10", "Nursery", etc.
    classDoc = await Class.findOne({ name: classId });
    
    // If not found by name and it's a valid ObjectId, try by ID
    if (!classDoc && mongoose.Types.ObjectId.isValid(classId)) {
      classDoc = await Class.findById(classId);
    }
    
    if (!classDoc) {
      console.log('Class not found for:', classId);
      return res.status(404).json({ message: 'Class not found' });
    }

    console.log('Class found:', classDoc);

    // Use the actual class ObjectId
    const actualClassId = classDoc._id;

    // Validate subjects array
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: 'At least one subject must be selected' });
    }

    // Validate each subject exists
    const subjectDocs = await Subject.find({ _id: { $in: subjects } });
    if (subjectDocs.length !== subjects.length) {
      return res.status(404).json({ message: 'One or more subjects not found' });
    }

    // Check for duplicate assignments (same teacher, class, and any subject overlap)
    const existingAssignment = await TeacherSubjectAssignment.findOne({
      teacher,
      class: actualClassId,
      academicYear
    });

    if (existingAssignment) {
      // Check if any of the new subjects are already assigned
      const existingSubjects = existingAssignment.subjects.map(s => s.toString());
      const overlap = subjects.some(s => existingSubjects.includes(s.toString()));
      if (overlap) {
        return res.status(400).json({ message: 'This subject is already assigned to this teacher for this class.' });
      }
      // If no overlap, add new subjects to existing assignment
      existingAssignment.subjects.push(...subjects);
      existingAssignment.subjectNames.push(...subjectDocs.map(s => s.name));
      await existingAssignment.save();
      return res.status(201).json(existingAssignment);
    }

    const assignment = new TeacherSubjectAssignment({
      teacher,
      teacherName: teacherDoc.fullName,
      teacherId: autoTeacherId,
      class: actualClassId,
      className: classDoc.name,
      subjects,
      subjectNames: subjectDocs.map(s => s.name),
      academicYear
    });

    await assignment.save();
    res.status(201).json(assignment);
  } catch (err) {
    console.error('Error creating assignment:', err);
    res.status(500).json({ message: 'Error creating assignment', error: err.message });
  }
});

// Update assignment (Admin only)
router.put('/:id', auth, roles(['admin', 'superadmin']), async (req, res) => {
  try {
    const { teacher, teacherId, class: classId, subjects, academicYear, status } = req.body;

    const assignment = await TeacherSubjectAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // If teacher is being changed, validate and update teacher info
    if (teacher && teacher !== assignment.teacher.toString()) {
      const teacherDoc = await Teacher.findById(teacher);
      if (!teacherDoc) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
      assignment.teacher = teacher;
      assignment.teacherName = teacherDoc.fullName;
    }

    if (teacherId) assignment.teacherId = teacherId;

    // If class is being changed, validate and update class info
    if (classId && classId !== assignment.class.toString()) {
      const classDoc = await Class.findById(classId);
      if (!classDoc) {
        return res.status(404).json({ message: 'Class not found' });
      }
      assignment.class = classId;
      assignment.className = classDoc.name;
    }

    // If subjects are being changed, validate and update
    if (subjects && Array.isArray(subjects)) {
      if (subjects.length === 0) {
        return res.status(400).json({ message: 'At least one subject must be selected' });
      }
      const subjectDocs = await Subject.find({ _id: { $in: subjects } });
      if (subjectDocs.length !== subjects.length) {
        return res.status(404).json({ message: 'One or more subjects not found' });
      }
      assignment.subjects = subjects;
      assignment.subjectNames = subjectDocs.map(s => s.name);
    }

    if (academicYear) assignment.academicYear = academicYear;
    if (status) assignment.status = status;

    assignment.updatedAt = Date.now();
    await assignment.save();

    res.json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating assignment' });
  }
});

// Delete assignment (Admin only)
router.delete('/:id', auth, roles(['admin', 'superadmin']), async (req, res) => {
  try {
    const assignment = await TeacherSubjectAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    await TeacherSubjectAssignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting assignment' });
  }
});

// Check if teacher is assigned to a specific class and subject
router.get('/check-assignment/:teacherId/:classId/:subjectId', auth, async (req, res) => {
  try {
    const { teacherId, classId, subjectId } = req.params;
    const academicYear = new Date().getFullYear().toString();

    const assignment = await TeacherSubjectAssignment.findOne({
      teacherId,
      class: classId,
      subjects: subjectId,
      academicYear,
      status: 'active'
    });

    res.json({ isAssigned: !!assignment, assignment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error checking assignment' });
  }
});

module.exports = router;
