const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const { extractCloudinaryPublicId, getCloudinaryResourceType } = require('../utils/cloudinaryHelpers');
// Create a new assignment. Assignment creation does not auto-publish notifications.
router.post('/', auth, roles(['teacher','principal','admin','superadmin']), async (req,res)=>{ 
  try{ 
    const payload = { ...req.body, createdBy: req.user.id || req.user._id };
    // Normalize attachments to { fileUrl, publicId }
    const { normalizeAttachmentsArray, resolveAttachmentRemote } = require('../utils/cloudinaryHelpers');
    payload.attachments = normalizeAttachmentsArray(payload.attachments);
    if (payload.attachments.length) {
      payload.attachments = await Promise.all(payload.attachments.map(a => resolveAttachmentRemote(a)));
    }
    console.log('SAVING ASSIGNMENT, NORMALIZED ATTACHMENTS:', payload.attachments);
    const a = new Assignment(payload);
    await a.save();
    res.json(a);
  }catch(err){console.error(err); res.status(500).send('Server error')} 
});
router.get('/', auth, async (req,res)=>{ try{ const { resolveAttachmentRemote } = require('../utils/cloudinaryHelpers');
    const list = await Assignment.find().populate('createdBy','name').lean();
    await Promise.all(list.map(async (item) => {
      if (item.attachments && item.attachments.length) {
        item.attachments = await Promise.all(item.attachments.map(a => resolveAttachmentRemote(a)));
      }
    }));
    res.json({assignments:list});
  }catch(err){console.error(err); res.status(500).send('Server error')} });
router.post('/:id/submissions', auth, roles(['student']), async (req,res)=>{ 
  try{ 
    const userId = req.user.id || req.user._id; 
    const { normalizeAttachmentsArray, resolveAttachmentRemote } = require('../utils/cloudinaryHelpers');
    let attachments = normalizeAttachmentsArray(req.body.attachments);
    if (attachments.length) {
      attachments = await Promise.all(attachments.map(a => resolveAttachmentRemote(a)));
    }
    const submission = new AssignmentSubmission({ assignment: req.params.id, student: userId, content: req.body.content, attachments });
    await submission.save(); 
    res.json(submission);
  }catch(err){console.error(err); res.status(500).send('Server error')} 
});
router.get('/:id/submissions', auth, async (req,res)=>{ try{ const { resolveAttachmentRemote } = require('../utils/cloudinaryHelpers'); const query = { assignment: req.params.id }; const userId = req.user.id || req.user._id; if (req.user.role === 'student') query.student = userId; const submissions = await AssignmentSubmission.find(query).populate('student','name email').lean(); await Promise.all(submissions.map(async (item) => { if (item.attachments && item.attachments.length) { item.attachments = await Promise.all(item.attachments.map(a => resolveAttachmentRemote(a))); } })); res.json({submissions}); }catch(err){console.error(err); res.status(500).send('Server error')} });
// Update a submission: students can edit their own submission; teachers/principals can grade or delete
router.put('/:id/submissions/:sid', auth, async (req,res)=>{
  try{
    const sub = await AssignmentSubmission.findById(req.params.sid);
    if(!sub) return res.status(404).json({ message: 'Submission not found' });
    const userId = req.user.id || req.user._id;
    const role = req.user.role;
    // Student editing their own submission
    if(role === 'student' && String(sub.student) === String(userId)){
      // allow updating content and attachments
      sub.content = req.body.content !== undefined ? req.body.content : sub.content;
      if(req.body.attachments) {
        const { normalizeAttachmentsArray, resolveAttachmentRemote } = require('../utils/cloudinaryHelpers');
        sub.attachments = normalizeAttachmentsArray(req.body.attachments);
        sub.attachments = await Promise.all(sub.attachments.map(a => resolveAttachmentRemote(a)));
      }
      sub.status = 'submitted';
      await sub.save();
      return res.json(sub);
    }
    // Teacher/principal grading
    if(['teacher','principal','admin','superadmin'].includes(role)){
      if(req.body.grade !== undefined) sub.grade = req.body.grade;
      if(req.body.feedback !== undefined) sub.feedback = req.body.feedback;
      if(req.body.status) sub.status = req.body.status;
      await sub.save();
      return res.json(sub);
    }
    return res.status(403).json({ message: 'Not authorized to edit this submission' });
  }catch(err){ console.error(err); res.status(500).send('Server error'); }
});

// Delete a submission: students can delete their own; teachers/principals can delete any
router.delete('/:id/submissions/:sid', auth, async (req,res)=>{
  try{
    const sub = await AssignmentSubmission.findById(req.params.sid).lean();
    if(!sub) return res.status(404).json({ message: 'Submission not found' });
    const userId = req.user.id || req.user._id;
    const role = req.user.role;
    if(String(sub.student) === String(userId) || ['teacher','principal','admin','superadmin'].includes(role)){
      // delete associated cloudinary attachments if any
      if(sub.attachments && sub.attachments.length){
        const cloudinary = require('../utils/cloudinary');
        for(const att of sub.attachments){
          try{
            let pub = att.publicId || att.public_id || (att.fileUrl ? extractCloudinaryPublicId(att.fileUrl) : null);
            let resourceType = att.fileUrl ? getCloudinaryResourceType(att.fileUrl) : 'auto';
            if(pub) await cloudinary.uploader.destroy(pub, { resource_type: resourceType });
          }catch(e){ console.error('Failed remove submission asset', e); }
        }
      }
      await AssignmentSubmission.findByIdAndDelete(req.params.sid);
      return res.json({ message: 'Deleted' });
    }
    return res.status(403).json({ message: 'Not authorized to delete this submission' });
  }catch(err){ console.error(err); res.status(500).send('Server error'); }
});
router.put('/:id', auth, roles(['teacher','principal','admin','superadmin']), async (req,res)=>{ 
  try{
    const { normalizeAttachmentsArray, resolveAttachmentRemote } = require('../utils/cloudinaryHelpers');
    if (req.body.attachments) {
      req.body.attachments = normalizeAttachmentsArray(req.body.attachments);
      req.body.attachments = await Promise.all(req.body.attachments.map(a => resolveAttachmentRemote(a)));
    }
    const a = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new:true });
    res.json(a);
  }catch(err){console.error(err); res.status(500).send('Server error')} 
});
router.delete('/:id', auth, roles(['teacher','principal','admin','superadmin']), async (req,res)=>{
  try{
    const a = await Assignment.findById(req.params.id).lean();
    if (a && a.attachments && a.attachments.length) {
      const cloudinary = require('../utils/cloudinary');
      for (const att of a.attachments) {
        let pub = null;
        let resourceType = 'auto';
        if (!att) continue;
        if (typeof att === 'string') {
          pub = extractCloudinaryPublicId(att);
          resourceType = getCloudinaryResourceType(att);
        } else {
          pub = att.publicId || att.public_id || (att.fileUrl ? extractCloudinaryPublicId(att.fileUrl) : null);
          resourceType = att.fileUrl ? getCloudinaryResourceType(att.fileUrl) : 'auto';
        }
        if (pub) {
          try{ await cloudinary.uploader.destroy(pub, { resource_type: resourceType }); }catch(e){ console.error('Failed to delete asset', e); }
        }
      }
    }
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({message:'Deleted'});
  }catch(err){console.error(err); res.status(500).send('Server error')}
});
router.get('/export/csv', auth, async (req,res)=>{
  try{
    const { Parser } = require('json2csv');
    const list = await Assignment.find().lean();
    const data = list.map(item => ({ title:item.title, class:item.class, dueDate:item.dueDate ? item.dueDate.toISOString().slice(0,10) : '' }));
    const parser = new Parser({ fields:['title','class','dueDate'] });
    res.header('Content-Type','text/csv');
    res.attachment('assignments.csv');
    res.send(parser.parse(data));
  }catch(err){console.error(err); res.status(500).send('Server error'); }
});

module.exports = router;
