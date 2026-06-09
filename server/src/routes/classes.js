const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const ClassModel = require('../models/Class');

// CSV export removed - PDF exports are available via /api/exports

router.post('/', auth, roles(['superadmin','principal']), async (req, res) => { try{ const c=new ClassModel(req.body); await c.save(); res.json(c);}catch(err){res.status(500).send('Server error')} });
router.get('/', auth, async (req,res)=>{ try{ const list=await ClassModel.find(); res.json({classes:list}); }catch(err){res.status(500).send('Server error')} });
router.put('/:id', auth, roles(['superadmin','principal']), async (req,res)=>{ try{ const c=await ClassModel.findByIdAndUpdate(req.params.id, req.body, {new:true}); res.json(c);}catch(err){res.status(500).send('Server error')} });
router.delete('/:id', auth, roles(['superadmin','principal']), async (req,res)=>{ try{ await ClassModel.findByIdAndDelete(req.params.id); res.json({message:'Deleted'});}catch(err){res.status(500).send('Server error')} });

module.exports = router;
