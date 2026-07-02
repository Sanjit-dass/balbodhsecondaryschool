const mongoose = require('mongoose');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const TeacherSubjectAssignment = require('../models/TeacherSubjectAssignment');
const { getAcademicYearCandidates } = require('../utils/teacherAssignmentQuery');

// Middleware to verify teacher can only access their assigned subjects and classes
module.exports = async function (req, res, next) {
  const overrideTeacherId = req.query?.teacherId || req.body?.teacherId;

  // Allow admins, principals, and superadmins to bypass this check
  if (['admin', 'principal', 'superadmin', 'examcontroller'].includes(req.user.role)) {
    if (overrideTeacherId) {
      try {
        const teacherQuery = [];
        if (mongoose.Types.ObjectId.isValid(String(overrideTeacherId))) {
          teacherQuery.push({ _id: String(overrideTeacherId) });
        }
        teacherQuery.push({ employeeId: String(overrideTeacherId) });
        const overrideTeacher = await Teacher.findOne({ $or: teacherQuery }).lean();
        if (overrideTeacher) {
          req.teacher = overrideTeacher;
        }
      } catch (overrideErr) {
        console.warn('Failed to resolve override teacher for admin access:', overrideErr.message);
      }
    }
    return next();
  }

  // Only teachers need this check
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Access denied. Teachers only.' });
  }

  try {
    const userId = req.user.id || req.user._id;
    let teacherProfile = await Teacher.findOne({ user: userId }).lean();

    let userProfile = null;
    if (userId) {
      try {
        const userLookupId = mongoose.Types.ObjectId.isValid(userId) ? userId : null;
        userProfile = userLookupId
          ? await User.findById(userLookupId).select('assignedSubjects assignedClasses employeeId').lean()
          : null;
      } catch (lookupErr) {
        console.warn('Could not resolve teacher user profile:', lookupErr.message);
      }
    }

    const overrideTeacherId = req.query?.teacherId || req.body?.teacherId;
    if (!teacherProfile && overrideTeacherId) {
      const teacherQuery = [];
      if (mongoose.Types.ObjectId.isValid(String(overrideTeacherId))) {
        teacherQuery.push({ _id: String(overrideTeacherId) });
      }
      teacherQuery.push({ employeeId: String(overrideTeacherId) });
      teacherProfile = await Teacher.findOne({ $or: teacherQuery }).lean();
    }

    if (!teacherProfile && userProfile?.employeeId) {
      teacherProfile = await Teacher.findOne({ employeeId: userProfile.employeeId }).lean();
    }

    if (!teacherProfile && !userProfile) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const academicYearCandidates = getAcademicYearCandidates(new Date().getFullYear().toString());
    const assignmentQuery = { status: 'active' };

    if (teacherProfile?._id || teacherProfile?.employeeId) {
      assignmentQuery.$or = [];
      if (teacherProfile?._id) {
        assignmentQuery.$or.push({ teacher: teacherProfile._id });
      }
      if (teacherProfile?.employeeId) {
        assignmentQuery.$or.push({ teacherId: teacherProfile.employeeId });
      }
    }

    if (academicYearCandidates.length === 1) {
      assignmentQuery.academicYear = academicYearCandidates[0];
    } else if (academicYearCandidates.length > 1) {
      assignmentQuery.academicYear = { $in: academicYearCandidates };
    }

    const assignments = teacherProfile || teacherProfile?.employeeId
      ? await TeacherSubjectAssignment.find(assignmentQuery).select('class subjects subjectNames').lean()
      : [];

    const classIds = Array.from(new Set((assignments || []).map(a => a.class).filter(Boolean).map(id => String(id))));

    const subjectIdsSet = new Set();
    const subjectNameCandidates = [];
    (assignments || []).forEach(a => {
      (a.subjects || []).forEach(subject => {
        if (subject) subjectIdsSet.add(String(subject));
      });
      (a.subjectNames || []).forEach(name => {
        if (name && typeof name === 'string') subjectNameCandidates.push(name.trim());
      });
    });

    if (subjectNameCandidates.length > 0) {
      const subjectsByName = await require('../models/Subject').find({ name: { $in: subjectNameCandidates } }).select('_id name').lean();
      subjectsByName.forEach(subject => {
        if (subject?._id) subjectIdsSet.add(String(subject._id));
      });
      subjectNameCandidates.forEach(name => {
        if (name && !Array.from(subjectIdsSet).includes(name)) {
          subjectIdsSet.add(name);
        }
      });
    }

    const subjectIds = Array.from(subjectIdsSet);

    req.teacher = teacherProfile;
    req.teacherAssignments = {
      subjects: subjectIds.length > 0 ? subjectIds : (teacherProfile?.assignedSubjects || userProfile?.assignedSubjects || []).map(id => String(id)),
      classes: classIds.length > 0 ? classIds : (teacherProfile?.assignedClasses || userProfile?.assignedClasses || []).map(id => String(id))
    };

    next();
  } catch (err) {
    console.error('Teacher access check error:', err);
    res.status(500).json({ message: 'Server error checking teacher assignments' });
  }
};

// Helper function to check if teacher can access a specific subject
exports.canAccessSubject = function (teacher, subjectId) {
  if (!teacher || !teacher.assignedSubjects) return false;
  return teacher.assignedSubjects.some(id => id.toString() === subjectId.toString());
};

// Helper function to check if teacher can access a specific class
exports.canAccessClass = function (teacher, classId) {
  if (!teacher || !teacher.assignedClasses) return false;
  return teacher.assignedClasses.some(id => id.toString() === classId.toString());
};
