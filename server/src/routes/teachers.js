const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const TeacherSubjectAssignment = require('../models/TeacherSubjectAssignment');
const { createStorage } = require('../middleware/upload');
const cloudinary = require('../utils/cloudinary');
const { getCloudinaryResourceType } = require('../utils/cloudinaryHelpers');

const teacherAdminRoles = ['superadmin','admin','principal'];

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

// Export teachers CSV
router.get('/export/csv', auth, roles(teacherAdminRoles), async (req,res)=>{
  try{
    const { Parser } = require('json2csv');
    const teachers = await Teacher.find().lean();
    const fields = ['employeeId','fullName','email','phone','subject','assignedClass','qualifications','experience','joiningDate','status','createdAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(teachers);
    res.header('Content-Type', 'text/csv');
    res.attachment('teachers.csv');
    return res.send(csv);
  }catch(err){ console.error(err); res.status(500).send('Server error'); }
});

// Export teachers PDF
router.get('/export/pdf', auth, roles(teacherAdminRoles), async (req,res)=>{
  try{
    const PDFDocument = require('pdfkit');
    const teachers = await Teacher.find().lean().sort({ fullName: 1 });
    
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="teachers_report.pdf"');
    doc.pipe(res);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('Teacher Management Report', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1);

    // Summary
    const activeCount = teachers.filter(t => t.status === 'active').length;
    const inactiveCount = teachers.filter(t => t.status === 'inactive').length;
    doc.fontSize(11).font('Helvetica-Bold').text('Summary:');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Teachers: ${teachers.length}`);
    doc.text(`Active: ${activeCount}`);
    doc.text(`Inactive: ${inactiveCount}`);
    doc.moveDown(0.5);

    // Table Header
    doc.fontSize(10).font('Helvetica-Bold');
    const columns = { id: 80, name: 100, subject: 80, class: 70, status: 60 };
    const startX = 50;
    let y = doc.y;
    
    doc.text('Employee ID', startX, y, { width: columns.id });
    doc.text('Name', startX + columns.id + 10, y, { width: columns.name });
    doc.text('Subject', startX + columns.id + columns.name + 20, y, { width: columns.subject });
    doc.text('Class', startX + columns.id + columns.name + columns.subject + 30, y, { width: columns.class });
    doc.text('Status', startX + columns.id + columns.name + columns.subject + columns.class + 40, y, { width: columns.status });
    
    doc.moveTo(startX, y + 15).lineTo(550, y + 15).stroke();
    doc.moveDown(1);

    // Table Rows
    doc.font('Helvetica').fontSize(9);
    teachers.forEach((teacher, idx) => {
      y = doc.y;
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
      const status = teacher.status === 'active' ? '✓ Active' : '✗ Inactive';
      doc.text(teacher.employeeId || '-', startX, y, { width: columns.id });
      doc.text((teacher.fullName || 'N/A').substring(0, 20), startX + columns.id + 10, y, { width: columns.name });
      doc.text(teacher.subject || '-', startX + columns.id + columns.name + 20, y, { width: columns.subject });
      doc.text(teacher.assignedClass || '-', startX + columns.id + columns.name + columns.subject + 30, y, { width: columns.class });
      doc.text(status, startX + columns.id + columns.name + columns.subject + columns.class + 40, y, { width: columns.status });
      doc.moveDown(0.7);
    });

    doc.end();
  }catch(err){ 
    console.error(err); 
    res.status(500).send('Server error'); 
  }
});

router.post('/', auth, roles(teacherAdminRoles), async (req, res) => {
  try {
    const {
      fullName,
      email,
      username,
      employeeId,
      gender,
      dateOfBirth,
      phone,
      address,
      qualification,
      experience,
      joiningDate,
      subject,
      assignedClass,
      assignedSubjects,
      assignedClasses,
      status,
      photoUrl
    } = req.body;

    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (employeeId && await Teacher.findOne({ employeeId })) {
      return res.status(400).json({ message: 'Employee ID already exists.' });
    }

    let generatedEmployeeId = employeeId;
    if (!generatedEmployeeId) {
      generatedEmployeeId = await getNextTeacherId();
    }

    const teacher = await Teacher.create({
      fullName,
      employeeId: generatedEmployeeId,
      username,
      email: normalizedEmail || undefined,
      gender,
      dateOfBirth,
      phone,
      address,
      qualifications: qualification,
      experience,
      joiningDate,
      subject,
      assignedClass,
      assignedSubjects: assignedSubjects || [],
      assignedClasses: assignedClasses || [],
      status: status || 'active',
      role: 'teacher',
      photoUrl
    });

    // If teacher has a user account, update their assignments
    if (teacher.user) {
      await User.findByIdAndUpdate(teacher.user, {
        assignedSubjects: assignedSubjects || [],
        assignedClasses: assignedClasses || []
      });
    }

    res.status(201).json(teacher);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Upload teacher photo
router.post('/:id/photo', auth, roles(teacherAdminRoles), (req, res) => {
  const upload = createStorage('teachers').single('file');
  upload(req, res, async function(err) {
    if (err) return res.status(400).json({ message: err.message || 'Upload error' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    try{
      const fileUrl = req.file.secure_url || req.file.path || req.file.location || '';
      const publicId = req.file.public_id || req.file.filename || req.file.key || '';
      const teacher = await Teacher.findByIdAndUpdate(req.params.id, { photoUrl: fileUrl, photo: { fileUrl, publicId } }, { new: true });
      res.json({ teacher });
    }catch(e){ console.error(e); res.status(500).json({ message: 'Server error' }); }
  });
});

router.get('/', auth, async (req, res) => {
  try {
    const { q, employeeId, subject, assignedClass, phone, status } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { fullName: new RegExp(q, 'i') },
        { employeeId: new RegExp(q, 'i') },
        { subject: new RegExp(q, 'i') },
        { assignedClass: new RegExp(q, 'i') },
        { phone: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') }
      ];
    }
    if (employeeId) filter.employeeId = new RegExp(employeeId, 'i');
    if (subject) filter.subject = new RegExp(subject, 'i');
    if (assignedClass) filter.assignedClass = new RegExp(assignedClass, 'i');
    if (phone) filter.phone = new RegExp(phone, 'i');
    if (status) filter.status = status;

    const teachers = await Teacher.find(filter).sort({ createdAt: -1 });
    const normalizedTeachers = await Promise.all(teachers.map(async (teacher) => {
      if (!teacher.employeeId || !/^BBS\d+$/.test(teacher.employeeId)) {
        await normalizeTeacherId(teacher);
      }
      return teacher;
    }));
    res.json(normalizedTeachers);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/:id', auth, roles(teacherAdminRoles), async (req,res)=>{
  try{
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    if (!teacher.employeeId || !/^BBS\d+$/.test(teacher.employeeId)) {
      await normalizeTeacherId(teacher);
    }
    res.json(teacher);
  }catch(err){
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.put('/:id', auth, roles(teacherAdminRoles), async (req,res)=>{
  try{
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    const {
      fullName,
      email,
      password,
      username,
      employeeId,
      gender,
      dateOfBirth,
      phone,
      address,
      qualification,
      experience,
      joiningDate,
      subject,
      assignedClass,
      assignedSubjects,
      assignedClasses,
      status,
      photoUrl
    } = req.body;

    if (email && String(email).trim().toLowerCase() !== String(teacher.email).trim().toLowerCase()) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (await User.findOne({ email: normalizedEmail })) {
        return res.status(400).json({ message: 'Email already exists.' });
      }
      teacher.email = normalizedEmail;
    }

    if (employeeId && employeeId !== teacher.employeeId) {
      if (await Teacher.findOne({ employeeId })) {
        return res.status(400).json({ message: 'Employee ID already exists.' });
      }
      teacher.employeeId = employeeId;
    }

    teacher.fullName = fullName ?? teacher.fullName;
    teacher.username = username ?? teacher.username;
    teacher.gender = gender ?? teacher.gender;
    teacher.dateOfBirth = dateOfBirth ?? teacher.dateOfBirth;
    teacher.phone = phone ?? teacher.phone;
    teacher.address = address ?? teacher.address;
    teacher.qualifications = qualification ?? teacher.qualifications;
    teacher.experience = experience ?? teacher.experience;
    teacher.joiningDate = joiningDate ?? teacher.joiningDate;
    teacher.subject = subject ?? teacher.subject;
    teacher.assignedClass = assignedClass ?? teacher.assignedClass;
    teacher.assignedSubjects = assignedSubjects ?? teacher.assignedSubjects;
    teacher.assignedClasses = assignedClasses ?? teacher.assignedClasses;
    teacher.status = status ?? teacher.status;
    if (photoUrl) teacher.photoUrl = photoUrl;

    if (teacher.user) {
      const user = await User.findById(teacher.user).select('+password');
      if (user) {
        user.name = teacher.fullName || user.name;
        if (teacher.email) user.email = teacher.email;
        user.status = teacher.status;
        user.profile.phone = teacher.phone || user.profile.phone;
        user.profile.department = teacher.subject || user.profile.department;
        user.profile.address = teacher.address || user.profile.address;
        user.assignedSubjects = teacher.assignedSubjects || [];
        user.assignedClasses = teacher.assignedClasses || [];
        if (password) {
          user.password = await bcrypt.hash(password, 10);
        }
        await user.save();
      }
    }

    const updatedTeacher = await teacher.save();
    res.json(updatedTeacher);
  }catch(err){
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.delete('/:id', auth, roles(teacherAdminRoles), async (req,res)=>{
  try{
    const teacher = await Teacher.findById(req.params.id).lean();
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    if (teacher.user) {
      await User.findByIdAndDelete(teacher.user);
    }

    const pub = (teacher.photo && teacher.photo.publicId) || teacher.photoUrl || teacher.photo;
    const resourceType = pub ? getCloudinaryResourceType(pub) : 'auto';
    if (pub) {
      try{ await cloudinary.uploader.destroy(pub, { resource_type: resourceType }); }catch(e){ console.error('Failed to delete cloudinary asset', e); }
    }

    await Teacher.findByIdAndDelete(req.params.id);
    res.json({message:'Deleted'});
  }catch(err){
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
