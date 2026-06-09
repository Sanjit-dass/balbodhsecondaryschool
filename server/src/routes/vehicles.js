const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const Vehicle = require('../models/Vehicle');

router.post('/', auth, roles(['superadmin','principal']), async (req,res)=>{ try{ const v=new Vehicle(req.body); await v.save(); res.json(v);}catch(err){console.error(err); res.status(500).send('Server error')} });
router.get('/', auth, async (req,res)=>{ try{ const list=await Vehicle.find(); res.json({vehicles:list}); }catch(err){console.error(err); res.status(500).send('Server error')} });
router.put('/:id', auth, roles(['superadmin','principal']), async (req,res)=>{ try{ const v = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new:true }); res.json(v);}catch(err){console.error(err); res.status(500).send('Server error')} });
router.delete('/:id', auth, roles(['superadmin','principal']), async (req,res)=>{ try{ await Vehicle.findByIdAndDelete(req.params.id); res.json({message:'Deleted'});}catch(err){console.error(err); res.status(500).send('Server error')} });
router.get('/export/csv', auth, async (req,res)=>{
  try{
    const { Parser } = require('json2csv');
    const list = await Vehicle.find().lean();
    const data = list.map(item => ({ name:item.name, route:item.route, capacity:item.capacity, driver:item.driver }));
    const parser = new Parser({ fields:['name','route','capacity','driver'] });
    res.header('Content-Type','text/csv');
    res.attachment('vehicles.csv');
    res.send(parser.parse(data));
  }catch(err){console.error(err); res.status(500).send('Server error'); }
});

module.exports = router;
