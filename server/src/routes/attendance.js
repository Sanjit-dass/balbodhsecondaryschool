const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const Attendance = require('../models/Attendance');
const audit = require('../middleware/audit');
const Student = require('../models/Student');

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeDateRange(dateString) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  const start = new Date(d);
  start.setHours(0,0,0,0);
  const end = new Date(d);
  end.setHours(23,59,59,999);
  return { start, end };
}

async function resolveStudentByUser(userId) {
  if (!userId) return null;
  return await Student.findOne({ user: userId });
}

// Create or update daily attendance record
// Routine attendance submission should not generate automatic notifications.
// Notifications are reserved for manual notices, published results, and other explicit announcements.
router.post('/', auth, roles(['superadmin','admin','principal','teacher']), async (req,res)=>{
  try{
    const { date, class: className, section, period, periods, subject, records, topic, homeworkGiven, homework, notes } = req.body;
    if(!date || !className) return res.status(400).json({ message: 'Missing required fields: date or class' });

    const range = normalizeDateRange(date);
    if (!range) return res.status(400).json({ message: 'Invalid date' });

    const selectedPeriods = Array.isArray(periods) ? periods.filter(p => typeof p === 'string' && p.trim()) : [];
    if (period && !selectedPeriods.length) selectedPeriods.push(period);
    if (!selectedPeriods.length) return res.status(400).json({ message: 'Please select at least one period' });

    const preparedRecords = (Array.isArray(records) ? records : []).map((record) => ({
      person: record.person,
      rollNumber: record.rollNumber,
      name: record.name,
      status: ['present','absent','leave'].includes(record.status) ? record.status : 'absent',
      note: record.note || ''
    }));

    const results = [];
    for (const p of selectedPeriods) {
      const existingQuery = { class: className, date: { $gte: range.start, $lte: range.end }, period: p };
      if (section) existingQuery.section = section;
      const existing = await Attendance.findOne(existingQuery);
      if (existing) {
        if (req.user.role === 'teacher' && existing.submitted && existing.date.toDateString() !== new Date().toDateString()) {
          return res.status(403).json({ message: 'Submitted attendance for a previous date cannot be edited by teacher' });
        }
        existing.records = preparedRecords;
        existing.period = p;
        existing.subject = subject;
        existing.topic = topic;
        existing.homeworkGiven = !!homeworkGiven;
        existing.homework = homework;
        existing.notes = notes;
        existing.recordedBy = req.user.id;
        existing.submitted = true;
        existing.date = date;
        await existing.save();
        results.push(existing);
      } else {
        const a = new Attendance({ date, class: className, section, period: p, subject, records: preparedRecords, topic, homeworkGiven: !!homeworkGiven, homework, notes, recordedBy: req.user.id, submitted: true });
        await a.save();
        results.push(a);
      }
    }

    res.json(results.length === 1 ? results[0] : { attendance: results });
  }catch(err){console.error(err); res.status(500).send('Server error')} 
});

// List / filter attendance
router.get('/', auth, roles(['superadmin','admin','principal','teacher','accountant','parent','student']), async (req,res)=>{
  try{
    const { class: classId, section, subject, date, month, period, page = 1, limit = 100, studentId, studentUserId, studentName, rollNumber, q } = req.query;
    const isStudent = req.user.role === 'student';
    const query = {};
    
    // DEBUG: Log incoming request
    console.log(`[ATTENDANCE] ${isStudent ? 'STUDENT' : req.user.role.toUpperCase()} request:`, { 
      classId, studentName, rollNumber, studentUserId, userId: req.user.id 
    });

    // Apply top-level filters (skip for student name/roll as they'll be handled specially)
    if (classId) query.class = classId;
    if (section) query.section = section;
    if (subject) query.subject = subject;
    if (period) query.period = period;
    if (date) {
      const range = normalizeDateRange(date);
      if (range) query.date = { $gte: range.start, $lte: range.end };
    }
    if (month) {
      const [y,m] = month.split('-').map(Number);
      if (y && m) {
        const start = new Date(y, m-1, 1);
        const end = new Date(y, m, 0, 23,59,59,999);
        query.date = { $gte: start, $lte: end };
      }
    }

    // Handle non-student roles
    if (!isStudent) {
      if (studentId) query['records.person'] = studentId;
      if (studentUserId) {
        const userStudent = await resolveStudentByUser(studentUserId);
        if (userStudent) query['records.person'] = userStudent._id;
      }
      if (studentName) query['records.name'] = new RegExp(escapeRegex(studentName), 'i');
      if (rollNumber) query['records.rollNumber'] = new RegExp(escapeRegex(rollNumber), 'i');
    }
    
    if (q) {
      query.$or = [
        { class: new RegExp(escapeRegex(q), 'i') },
        { section: new RegExp(escapeRegex(q), 'i') },
        { subject: new RegExp(escapeRegex(q), 'i') },
        { 'records.name': new RegExp(escapeRegex(q), 'i') },
        { 'records.rollNumber': new RegExp(escapeRegex(q), 'i') }
      ];
    }

    // students should only see their own attendance records
    if (isStudent) {
      const userStudent = await resolveStudentByUser(req.user.id);
      const studentMatch = { $or: [] };

      console.log(`[ATTENDANCE] Student ${req.user.id} lookup:`, userStudent ? `Found: ${userStudent._id}` : 'Not found in database');

      if (userStudent) {
        studentMatch.$or.push({ 'records.person': userStudent._id });
        console.log(`[ATTENDANCE] Added person match for ObjectId: ${userStudent._id}`);
      }

      // Always add name and roll filters for students (both with and without profile)
      if (rollNumber) {
        const requestedRoll = String(rollNumber).trim();
        const rollRegex = new RegExp(`^${escapeRegex(requestedRoll)}$`, 'i');
        studentMatch.$or.push({ 'records.rollNumber': rollRegex });
        console.log(`[ATTENDANCE] Added rollNumber match: ${requestedRoll}`);
      }

      if (studentName) {
        const requestedName = String(studentName).trim();
        const nameRegex = new RegExp(`^${escapeRegex(requestedName)}$`, 'i');
        studentMatch.$or.push({ 'records.name': nameRegex });
        console.log(`[ATTENDANCE] Added studentName match: ${requestedName}`);
      }

      if (!studentMatch.$or.length) {
        console.log(`[ATTENDANCE] No student match criteria provided`);
        return res.status(403).json({ message: 'Student profile not found and no identifying details provided' });
      }

      query.$and = query.$and || [];
      query.$and.push(studentMatch);
    }

    console.log(`[ATTENDANCE] Final query:`, JSON.stringify(query, null, 2));
    
    const list = await Attendance.find(query).sort({ date:-1 }).skip((page-1)*limit).limit(parseInt(limit));
    
    console.log(`[ATTENDANCE] Query returned ${list.length} records`);
    
    // Log sample record structure for debugging
    if (list.length > 0) {
      console.log(`[ATTENDANCE] Sample record class:`, list[0].class);
      console.log(`[ATTENDANCE] Sample record has ${(list[0].records || []).length} student records`);
      if (list[0].records && list[0].records.length > 0) {
        console.log(`[ATTENDANCE] First student in record:`, {
          rollNumber: list[0].records[0].rollNumber,
          name: list[0].records[0].name,
          person: list[0].records[0].person
        });
      }
    }
    
    res.json({ attendance: list });
  }catch(err){
    console.error('[ATTENDANCE] Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } 
});

// DEBUG endpoint - Check what attendance records exist for a class/roll combination
router.get('/debug/check-records', auth, roles(['superadmin','admin','principal','teacher','student']), async (req,res)=>{
  try{
    const { class: targetClass, rollNumber: targetRoll } = req.query;
    
    console.log(`[ATTENDANCE-DEBUG] Check records request:`, { targetClass, targetRoll });
    
    if (!targetClass || !targetRoll) {
      return res.json({ error: 'Provide ?class=CLASSNAME&rollNumber=ROLLNUM' });
    }

    // Find all attendance records for this class
    const allForClass = await Attendance.find({ class: targetClass }).select('class date period records');
    console.log(`[ATTENDANCE-DEBUG] Found ${allForClass.length} attendance records for class "${targetClass}"`);

    // Check how many have the target roll number
    let matchingRecords = [];
    allForClass.forEach(record => {
      const found = (record.records || []).find(r => String(r.rollNumber).trim().toLowerCase() === String(targetRoll).trim().toLowerCase());
      if (found) {
        matchingRecords.push({
          attendanceId: record._id,
          date: record.date,
          period: record.period,
          studentRecord: found
        });
      }
    });

    res.json({
      debug: true,
      query: { targetClass, targetRoll },
      totalForClass: allForClass.length,
      matchingRecords: matchingRecords.length,
      details: {
        allClassesInDB: await Attendance.distinct('class'),
        sampleRecordsForClass: allForClass.slice(0, 3).map(r => ({
          date: r.date,
          period: r.period,
          studentCount: (r.records || []).length,
          rollNumbers: (r.records || []).map(x => x.rollNumber)
        })),
        matching: matchingRecords.slice(0, 5)
      }
    });
  }catch(err){
    console.error('[ATTENDANCE-DEBUG] Error:', err);
    res.status(500).json({ message: 'Debug error', error: err.message });
  }
});

// Update attendance
router.put('/:id', auth, roles(['superadmin','admin','principal','teacher']), audit('update_attendance'), async (req,res)=>{
  try{
    const a = await Attendance.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Attendance not found' });
    if (a.submitted && req.user.role === 'teacher') {
      const today = new Date().toDateString();
      if (a.date.toDateString() !== today) return res.status(403).json({ message: 'Submitted attendance for a previous date cannot be edited by teacher' });
    }
    Object.assign(a, req.body);
    await a.save();
    res.json(a);
  }catch(err){console.error(err); res.status(500).send('Server error')} 
});

router.delete('/:id', auth, roles(['superadmin','admin','principal']), audit('delete_attendance'), async (req,res)=>{ try{ await Attendance.findByIdAndDelete(req.params.id); res.json({message:'Deleted'});}catch(err){console.error(err); res.status(500).send('Server error')} });

// Reopen attendance (set submitted=false) - admin only
router.post('/:id/reopen', auth, roles(['superadmin','admin','principal']), audit('reopen_attendance'), async (req,res)=>{
  try{
    const a = await Attendance.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Attendance not found' });
    a.submitted = false;
    await a.save();
    res.json({ message: 'Attendance reopened', attendance: a });
  }catch(err){ console.error(err); res.status(500).send('Server error'); }
});

module.exports = router;
