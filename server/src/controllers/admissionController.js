const Admission = require('../models/Admission');
const Student = require('../models/Student');

exports.createAdmission = async (req, res) => {
  try {
    // accept both `class` (from frontend form) and `applyingClass` for robustness
    const { studentName, parentName, email, phone, address, metadata } = req.body;
    const applyingClass = req.body.applyingClass || req.body.class || '';
    if (!studentName || !phone) {
      return res.status(400).json({ message: 'studentName and phone are required' });
    }

    const admission = new Admission({ studentName, parentName, email, phone, applyingClass, address, metadata });
    await admission.save();
    res.status(201).json({ message: 'Application submitted', applicationId: admission.applicationId, admission });
  } catch (err) {
    console.error('createAdmission error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listAdmissions = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const q = {};
    if (status) q.status = status;
    if (search) {
      const re = new RegExp(String(search), 'i');
      q.$or = [{ studentName: re }, { parentName: re }, { email: re }, { phone: re }, { applicationId: re }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Admission.countDocuments(q);
    const items = await Admission.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean();
    res.json({ total, page: Number(page), limit: Number(limit), items });
  } catch (err) {
    console.error('listAdmissions error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAdmission = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id).lean();
    if (!admission) return res.status(404).json({ message: 'Not found' });
    res.json(admission);
  } catch (err) {
    console.error('getAdmission error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const admission = await Admission.findById(req.params.id);
    if (!admission) return res.status(404).json({ message: 'Not found' });
    if (status) admission.status = status;
    if (rejectionReason) admission.rejectionReason = rejectionReason;
    await admission.save();
    res.json({ message: 'Status updated', admission });
  } catch (err) {
    console.error('updateStatus error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteAdmission = async (req, res) => {
  try {
    await Admission.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('deleteAdmission error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.convertAdmission = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);
    if (!admission) return res.status(404).json({ message: 'Not found' });

    // By default do NOT create a Student record when approving an application.
    // If the caller intentionally wants to create the Student, pass { createStudent: true }
    const { createStudent } = req.body || {};

    let student = null;
    if (createStudent) {
      const studentData = {
        fullName: admission.studentName,
        name: admission.studentName,
        email: admission.email,
        phone: admission.phone,
        parentName: admission.parentName,
        className: admission.applyingClass || admission.class || '',
        status: 'active'
      };
      student = new Student(studentData);
      await student.save();
    }

    admission.status = 'Approved';
    await admission.save();

    res.json({ message: createStudent ? 'Converted to student' : 'Admission approved', student, admission });
  } catch (err) {
    console.error('convertAdmission error', err);
    res.status(500).json({ message: 'Server error' });
  }
};
