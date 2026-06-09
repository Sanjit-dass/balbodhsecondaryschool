const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const Result = require('../models/Result');
const { createNotificationFromData } = require('../utils/notificationUtils');

router.post('/', auth, roles(['superadmin','principal','teacher']), async (req,res)=>{
  try{
    const result = new Result(req.body);
    await result.save();
    if (result.published) {
      try {
        await createNotificationFromData({
          title: 'Result Published',
          message: `Your result has been published.`,
          audience: 'students',
          classId: result.classId || result.class || null,
          priority: 'Medium',
          status: 'sent'
        }, req.user.id || req.user._id);
      } catch (e) {
        console.error('Failed to create result notification', e);
      }
    }
    res.json(result);
  }catch(err){
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/', auth, roles(['superadmin','principal','teacher','student','parent']), async (req,res)=>{
  try{
    const userId = req.user.id || req.user._id;
    const query = {};
    if (req.user.role === 'student') {
      query.student = userId;
      query.published = true;
    }
    if (req.user.role === 'parent') {
      query.published = true;
    }
    const list = await Result.find(query)
      .populate('student','fullName admissionNumber class section')
      .populate('exam','title startDate subjects')
      .populate('marks.subject','name code');
    res.json({results:list});
  }catch(err){
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.put('/:id', auth, roles(['superadmin','principal','teacher']), async (req,res)=>{
  try{
    const result = await Result.findByIdAndUpdate(req.params.id, req.body, { new:true });
    res.json(result);
  }catch(err){
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.delete('/:id', auth, roles(['superadmin','principal','teacher']), async (req,res)=>{
  try{
    await Result.findByIdAndDelete(req.params.id);
    res.json({message:'Deleted'});
  }catch(err){
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/export/csv', auth, roles(['superadmin','principal','teacher','student','parent']), async (req,res)=>{
  try{
    const { Parser } = require('json2csv');
    const list = await Result.find().populate('student','fullName admissionNumber').populate('exam','title').lean();
    const data = list.map(item => ({
      student: item.student?.fullName || '',
      admissionNumber: item.student?.admissionNumber || '',
      exam: item.exam?.title || '',
      grade: item.grade,
      gpa: item.gpa,
      published: item.published
    }));
    const parser = new Parser({ fields:['student','admissionNumber','exam','grade','gpa','published'] });
    res.header('Content-Type','text/csv');
    res.attachment('results.csv');
    res.send(parser.parse(data));
  }catch(err){
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
