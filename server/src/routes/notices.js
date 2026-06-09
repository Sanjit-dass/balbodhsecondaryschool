const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const validate = require('../middleware/validate');
const audit = require('../middleware/audit');
const noticeController = require('../controllers/noticeController');

router.post('/', auth, roles(['superadmin','principal','admin']), [
  body('title').notEmpty(),
  body('audience').isIn(['all','public','students','teachers','parents','specificClass']),
  body('category').optional().isIn(['Admissions','Holidays','Events','Academics','General','Academic','Exam','Holiday','Event','Emergency','Fee']),
  body('priority').optional().isIn(['Low','Medium','High','Urgent']),
  body('pinned').optional().isBoolean(),
  body('targetClassId').optional({ checkFalsy: true }).isMongoId(),
  body('status').optional().isIn(['draft','published','archived'])
], validate, audit('create_notice'), noticeController.createNotice);

router.get('/public', noticeController.listPublic);
router.get('/events/public', noticeController.listPublicEvents);
router.get('/stream', noticeController.noticeStream);
router.get('/', auth, noticeController.listNotices);
router.get('/:id', auth, param('id').isMongoId(), validate, noticeController.getNotice);
router.put('/:id', auth, roles(['superadmin','principal','admin']), [
  param('id').isMongoId(),
  body('audience').optional().isIn(['all','public','students','teachers','parents','specificClass']),
  body('category').optional().isIn(['Admissions','Holidays','Events','Academics','General','Academic','Exam','Holiday','Event','Emergency','Fee']),
  body('priority').optional().isIn(['Low','Medium','High','Urgent']),
  body('pinned').optional().isBoolean(),
  body('targetClassId').optional({ checkFalsy: true }).isMongoId(),
  body('status').optional().isIn(['draft','published','archived'])
], validate, audit('update_notice'), noticeController.updateNotice);
router.delete('/:id', auth, roles(['superadmin','principal','admin']), param('id').isMongoId(), validate, audit('delete_notice'), noticeController.deleteNotice);
router.get('/export/csv', auth, roles(['superadmin','principal','teacher','accountant']), async (req,res)=>{
  try{
    const { Parser } = require('json2csv');
    const list = await require('../models/Notice').find().lean();
    const data = list.map(item => ({ title:item.title, audience:item.audience, category:item.category, publishedAt:item.publishedAt ? item.publishedAt.toISOString() : '' }));
    const parser = new Parser({ fields:['title','audience','category','publishedAt'] });
    res.header('Content-Type','text/csv');
    res.attachment('notices.csv');
    res.send(parser.parse(data));
  }catch(err){console.error(err); res.status(500).send('Server error'); }
});

module.exports = router;
