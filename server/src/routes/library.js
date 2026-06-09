const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const Library = require('../models/Library');

router.post('/', auth, roles(['superadmin','librarian','principal']), async (req,res)=>{ try{ const l=new Library(req.body); await l.save(); res.json(l);}catch(err){console.error(err); res.status(500).send('Server error')} });
router.get('/', auth, async (req,res)=>{ try{ const list=await Library.find(); res.json({books:list}); }catch(err){console.error(err); res.status(500).send('Server error')} });
router.put('/:id', auth, roles(['superadmin','librarian','principal']), async (req,res)=>{ try{ const l = await Library.findByIdAndUpdate(req.params.id, req.body, { new:true }); res.json(l);}catch(err){console.error(err); res.status(500).send('Server error')} });
router.delete('/:id', auth, roles(['superadmin','librarian','principal']), async (req,res)=>{ try{ await Library.findByIdAndDelete(req.params.id); res.json({message:'Deleted'});}catch(err){console.error(err); res.status(500).send('Server error')} });
router.get('/export/csv', auth, async (req,res)=>{
  try{
    const { Parser } = require('json2csv');
    const list = await Library.find().lean();
    const data = list.map(item => ({ title:item.title, author:item.author, isbn:item.isbn, available:item.available }));
    const parser = new Parser({ fields:['title','author','isbn','available'] });
    res.header('Content-Type','text/csv');
    res.attachment('library.csv');
    res.send(parser.parse(data));
  }catch(err){console.error(err); res.status(500).send('Server error'); }
});

module.exports = router;
