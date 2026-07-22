const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const teacherAccess = require('../middleware/teacherAccess');
const EcaCategory = require('../models/EcaCategory');
const EcaMark = require('../models/EcaMark');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const ClassModel = require('../models/Class');
const { isClassApplicableForCategory } = require('../utils/ecaHelpers');

const CLASS_OPTIONS = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

function normalizeClassName(value) {
  if (!value && value !== 0) return '';
  return String(value).trim().replace(/^class\s+/i, '').trim();
}

function normalizeClassKey(value) {
  return normalizeClassName(value).toLowerCase().replace(/\s+/g, '');
}

function getClassValue(classDoc) {
  if (!classDoc) return null;
  const id = classDoc?._id || classDoc?.id || null;
  const name = classDoc?.name || classDoc?.className || classDoc?.class || '';
  return { _id: id, name: String(name).trim() || '' };
}

async function resolveClassIdForName(value) {
  if (!value) return null;
  if (mongoose.Types.ObjectId.isValid(String(value))) return String(value);
  const normalized = normalizeClassName(value);
  const classDoc = await ClassModel.findOne({ $or: [{ name: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, { numeric: Number(normalized) }] }).lean();
  return classDoc?._id ? String(classDoc._id) : null;
}

router.get('/categories', auth, roles(['superadmin', 'admin', 'principal', 'teacher', 'examcontroller']), async (req, res) => {
  try {
    const categories = await EcaCategory.find({ status: 'active' }).sort({ createdAt: -1 }).lean();
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching ECA categories', error);
    res.status(500).json({ message: 'Failed to load ECA categories' });
  }
});

router.post('/categories', auth, roles(['superadmin', 'admin', 'principal', 'examcontroller']), async (req, res) => {
  try {
    const payload = {
      name: String(req.body?.name || '').trim(),
      applyToAllClasses: Boolean(req.body?.applyToAllClasses),
      applicableClasses: Array.isArray(req.body?.applicableClasses) ? req.body.applicableClasses.map((value) => String(value).trim()).filter(Boolean) : [],
      academicYear: String(req.body?.academicYear || '').trim(),
      createdBy: req.user?.id || req.user?._id || null
    };

    if (!payload.name) {
      return res.status(400).json({ message: 'ECA category name is required' });
    }

    if (!payload.applyToAllClasses && payload.applicableClasses.length === 0) {
      return res.status(400).json({ message: 'Please select at least one class or apply to all classes' });
    }

    if (payload.applyToAllClasses) {
      payload.applicableClasses = CLASS_OPTIONS.slice();
    }

    const category = new EcaCategory(payload);
    await category.save();
    res.status(201).json({ category });
  } catch (error) {
    console.error('Error creating ECA category', error);
    res.status(500).json({ message: 'Failed to create ECA category' });
  }
});

router.put('/categories/:id', auth, roles(['superadmin', 'admin', 'principal', 'examcontroller']), async (req, res) => {
  try {
    const category = await EcaCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'ECA category not found' });

    const payload = {
      name: String(req.body?.name || '').trim(),
      applyToAllClasses: Boolean(req.body?.applyToAllClasses),
      applicableClasses: Array.isArray(req.body?.applicableClasses) ? req.body.applicableClasses.map((value) => String(value).trim()).filter(Boolean) : [],
      academicYear: String(req.body?.academicYear || '').trim()
    };

    if (!payload.name) return res.status(400).json({ message: 'ECA category name is required' });
    if (!payload.applyToAllClasses && payload.applicableClasses.length === 0) return res.status(400).json({ message: 'Please select at least one class or apply to all classes' });

    if (payload.applyToAllClasses) payload.applicableClasses = CLASS_OPTIONS.slice();

    Object.assign(category, payload);
    await category.save();
    res.json({ category });
  } catch (error) {
    console.error('Error updating ECA category', error);
    res.status(500).json({ message: 'Failed to update ECA category' });
  }
});

router.delete('/categories/:id', auth, roles(['superadmin', 'admin', 'principal', 'examcontroller']), async (req, res) => {
  try {
    const category = await EcaCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'ECA category not found' });
    category.status = 'inactive';
    await category.save();
    await EcaMark.deleteMany({ category: category._id });
    res.json({ message: 'ECA category deleted successfully' });
  } catch (error) {
    console.error('Error deleting ECA category', error);
    res.status(500).json({ message: 'Failed to delete ECA category' });
  }
});

router.get('/teacher/available', auth, teacherAccess, async (req, res) => {
  try {
    const { classId, academicYear } = req.query;
    const classValue = await resolveClassIdForName(classId || req.query.class || '');
    const year = String(academicYear || req.query.academicYear || '').trim();
    const query = { status: 'active' };

    if (classValue) {
      const className = await ClassModel.findById(classValue).lean().then((doc) => doc?.name || '');
      const categoriesForClass = await EcaCategory.find({ status: 'active' }).lean();
      const filteredCategories = categoriesForClass.filter((category) => isClassApplicableForCategory(category, className));
      return res.json({ categories: filteredCategories });
    }

    if (year) query.academicYear = year;

    const categories = await EcaCategory.find(query).sort({ name: 1 }).lean();
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching teacher ECA categories', error);
    res.status(500).json({ message: 'Failed to load ECA categories for teacher' });
  }
});

router.get('/teacher/students', auth, teacherAccess, async (req, res) => {
  try {
    const { classId, academicYear } = req.query;
    const resolvedClassId = await resolveClassIdForName(classId || '');
    if (!resolvedClassId) return res.status(400).json({ message: 'A valid class is required' });

    const students = await Student.find({ class: resolvedClassId, status: 'active' })
      .populate('user', 'name email')
      .sort({ rollNumber: 1, admissionNumber: 1, fullName: 1 })
      .lean();

    const className = (await ClassModel.findById(resolvedClassId).lean())?.name || '';
    const categories = await EcaCategory.find({ status: 'active' }).sort({ name: 1 }).lean();
    const applicableCategories = categories.filter((category) => isClassApplicableForCategory(category, className));

    res.json({ students, categories: applicableCategories, classId: resolvedClassId, academicYear: academicYear || '' });
  } catch (error) {
    console.error('Error fetching teacher ECA students', error);
    res.status(500).json({ message: 'Failed to load students for ECA marks entry' });
  }
});

router.get('/teacher/marks', auth, teacherAccess, async (req, res) => {
  try {
    const { classId, academicYear } = req.query;
    const resolvedClassId = await resolveClassIdForName(classId || '');
    if (!resolvedClassId) return res.status(400).json({ message: 'A valid class is required' });

    const marks = await EcaMark.find({ classId: resolvedClassId, academicYear: academicYear || { $exists: true } })
      .populate('student', 'fullName rollNumber admissionNumber user')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ marks });
  } catch (error) {
    console.error('Error fetching teacher ECA marks', error);
    res.status(500).json({ message: 'Failed to load ECA marks' });
  }
});

router.post('/teacher/marks', auth, teacherAccess, async (req, res) => {
  try {
    const payload = req.body || {};
    const resolvedClassId = await resolveClassIdForName(payload.className || payload.classId || '');
    if (!resolvedClassId) return res.status(400).json({ message: 'A valid class is required' });

    const category = await EcaCategory.findById(payload.categoryId);
    if (!category) return res.status(404).json({ message: 'ECA category not found' });

    const academicYear = String(payload.academicYear || '').trim();
    if (!academicYear) return res.status(400).json({ message: 'Academic year is required' });

    const studentDoc = await Student.findById(payload.studentId);
    if (!studentDoc) return res.status(404).json({ message: 'Student not found' });

    const existing = await EcaMark.findOne({ student: payload.studentId, classId: resolvedClassId, academicYear, category: payload.categoryId });
    const gradeValue = String(payload.marks ?? '').trim();
    const mark = existing || new EcaMark({
      student: payload.studentId,
      teacher: req.teacher?._id || null,
      classId: resolvedClassId,
      academicYear,
      category: payload.categoryId,
      categoryName: category.name,
      marks: gradeValue,
      createdBy: req.user?.id || req.user?._id || null,
      status: 'draft'
    });

    mark.marks = gradeValue;
    mark.categoryName = category.name;
    mark.teacher = req.teacher?._id || mark.teacher || null;
    mark.createdBy = req.user?.id || req.user?._id || mark.createdBy || null;
    mark.status = payload.status || mark.status || 'draft';
    await mark.save();
    res.json({ mark });
  } catch (error) {
    console.error('Error saving ECA marks', error);
    res.status(500).json({ message: 'Failed to save ECA marks' });
  }
});

router.get('/admin/marks', auth, roles(['superadmin', 'admin', 'principal', 'examcontroller']), async (req, res) => {
  try {
    const marks = await EcaMark.find({ status: { $ne: 'deleted' } })
      .populate('student', 'fullName rollNumber admissionNumber user')
      .populate('category', 'name')
      .populate('classId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ marks });
  } catch (error) {
    console.error('Error fetching all ECA marks', error);
    res.status(500).json({ message: 'Failed to load ECA marks for admin' });
  }
});

router.put('/admin/marks/:id', auth, roles(['superadmin', 'admin', 'principal', 'examcontroller']), async (req, res) => {
  try {
    const mark = await EcaMark.findById(req.params.id);
    if (!mark) return res.status(404).json({ message: 'ECA mark entry not found' });
    if (req.body?.marks !== undefined) {
      mark.marks = String(req.body?.marks ?? '').trim();
    }
    mark.status = req.body?.status || mark.status;
    await mark.save();
    res.json({ mark });
  } catch (error) {
    console.error('Error updating ECA mark', error);
    res.status(500).json({ message: 'Failed to update ECA mark entry' });
  }
});

router.delete('/admin/marks/:id', auth, roles(['superadmin', 'admin', 'principal', 'examcontroller']), async (req, res) => {
  try {
    const mark = await EcaMark.findById(req.params.id);
    if (!mark) return res.status(404).json({ message: 'ECA mark entry not found' });
    mark.status = 'deleted';
    await mark.save();
    res.json({ message: 'ECA mark entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting ECA mark', error);
    res.status(500).json({ message: 'Failed to delete ECA mark entry' });
  }
});

router.get('/student/:studentId', auth, roles(['superadmin', 'admin', 'principal', 'teacher', 'student', 'parent', 'examcontroller']), async (req, res) => {
  try {
    const marks = await EcaMark.find({ student: req.params.studentId, status: 'published' })
      .populate('category', 'name')
      .sort({ academicYear: 1, createdAt: 1 })
      .lean();
    res.json({ marks });
  } catch (error) {
    console.error('Error fetching ECA marks for student', error);
    res.status(500).json({ message: 'Failed to load ECA marks for student' });
  }
});

module.exports = router;
