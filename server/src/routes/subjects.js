const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const Subject = require('../models/Subject');
const ClassModel = require('../models/Class');
const { buildSubjectPromotionPlan } = require('../utils/subjectPromotion');

// CSV export removed - PDF exports are available via /api/exports

router.post('/', auth, roles(['superadmin','principal','admin']), async (req, res) => { try{ const s=new Subject(req.body); await s.save(); res.json(s);}catch(err){res.status(500).send('Server error')} });
router.get('/', auth, async (req,res)=>{
	try{
		const filter = {};
		console.debug('Subjects route query:', JSON.stringify(req.query));
		let classParam = req.query.classId || req.query.class || req.query.className;
		let className = null;
		
		if (classParam) {
			if (typeof classParam === 'string') {
				const trimmed = classParam.trim();
				// Try to resolve ObjectId to class name
				if (/^[0-9a-fA-F]{24}$/.test(trimmed)) {
					try {
						const ClassModel = require('../models/Class');
						const cls = await ClassModel.findById(trimmed).select('name');
						className = cls?.name || trimmed;
					} catch (e) {
						className = trimmed;
					}
				} else {
					className = trimmed;
				}
			} else if (typeof classParam === 'object') {
				className = classParam.name || classParam.className || null;
				if (!className && classParam._id) {
					try {
						const ClassModel = require('../models/Class');
						const cls = await ClassModel.findById(classParam._id).select('name');
						className = cls?.name || null;
					} catch (e) {
						console.debug('Could not resolve classParam._id to name:', e.message);
					}
				}
				if (!className) {
					const queue = [classParam];
					while (queue.length && !className) {
						const obj = queue.shift();
						for (const k of Object.keys(obj || {})) {
							const v = obj[k];
							if (typeof v === 'string' && v.trim()) { className = v.trim(); break; }
							if (typeof v === 'object' && v !== null) queue.push(v);
						}
					}
				}
				if (!className) {
					try { className = JSON.stringify(classParam); } catch (e) { className = String(classParam); }
				}
			} else {
				className = String(classParam).trim();
			}
		}
		if (className) filter.class = className;
		console.debug('Subjects filter:', JSON.stringify(filter));
		const list=await Subject.find(filter);
		console.debug('Subjects found:', list.length);
		res.json({subjects:list});
	}catch(err){
		console.error('Subjects route error:', err);
		res.status(500).send('Server error')
	}
});
router.post('/promote', auth, roles(['superadmin','principal','admin']), async (req, res) => {
  try {
    const { currentClass, academicYear, targetClass, subjectIds = [] } = req.body;

    if (!currentClass || !targetClass || !academicYear) {
      return res.status(400).json({ message: 'Current class, target class, and academic year are required.' });
    }

    if (String(currentClass).trim() === String(targetClass).trim()) {
      return res.status(400).json({ message: 'The destination class cannot be the same as the current class.' });
    }

    const sourceClassName = String(currentClass).trim();
    const targetClassName = String(targetClass).trim();
    const academicYearValue = String(academicYear).trim();

    const sourceSubjects = await Subject.find({
      class: sourceClassName,
      $or: [
        { academicYear: academicYearValue },
        { academicYear: { $exists: false } },
        { academicYear: null }
      ]
    }).lean();

    if (!sourceSubjects.length) {
      return res.status(404).json({ message: 'No subjects found for this class and academic year.' });
    }

    const selectedSourceSubjects = Array.isArray(subjectIds) && subjectIds.length
      ? sourceSubjects.filter((subject) => subjectIds.includes(String(subject._id)))
      : sourceSubjects;

    if (!selectedSourceSubjects.length) {
      return res.status(400).json({ message: 'Select at least one subject to promote.' });
    }

    const existingDestinationSubjects = await Subject.find({
      class: targetClassName,
      $or: [
        { academicYear: academicYearValue },
        { academicYear: { $exists: false } },
        { academicYear: null }
      ]
    }).select('_id name').lean();

    const promotionPlan = buildSubjectPromotionPlan(selectedSourceSubjects, existingDestinationSubjects, targetClassName, academicYearValue);

    if (promotionPlan.payloads.length) {
      await Subject.insertMany(promotionPlan.payloads);
    }

    if (promotionPlan.sourceSubjectIdsToDelete.length) {
      await Subject.deleteMany({ _id: { $in: promotionPlan.sourceSubjectIdsToDelete } });
    }

    res.json({
      message: `${promotionPlan.payloads.length} subjects moved successfully to ${targetClassName} for Academic Year ${academicYearValue}.`,
      copiedCount: promotionPlan.payloads.length,
      removedCount: promotionPlan.sourceSubjectIdsToDelete.length,
      promotedCount: selectedSourceSubjects.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unable to promote subjects right now.' });
  }
});

router.put('/:id', auth, roles(['superadmin','principal','admin']), async (req,res)=>{ try{ const s=await Subject.findByIdAndUpdate(req.params.id, req.body, {new:true}); res.json(s);}catch(err){res.status(500).send('Server error')} });
router.delete('/:id', auth, roles(['superadmin','principal','admin']), async (req,res)=>{ try{ await Subject.findByIdAndDelete(req.params.id); res.json({message:'Deleted'});}catch(err){res.status(500).send('Server error')} });

module.exports = router;
