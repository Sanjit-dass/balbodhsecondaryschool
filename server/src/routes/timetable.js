const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const validate = require('../middleware/validate');
const audit = require('../middleware/audit');
const timetableController = require('../controllers/timetableController');

router.post('/', auth, roles(['superadmin','principal','teacher']), [
  body('class').notEmpty(),
  body('entries').isArray({ min: 1 })
], validate, audit('create_timetable'), timetableController.createTimetable);
router.get('/', auth, timetableController.listTimetables);
router.get('/:id', auth, param('id').isMongoId(), validate, timetableController.getTimetable);
router.put('/:id', auth, roles(['superadmin','principal','teacher']), param('id').isMongoId(), validate, audit('update_timetable'), timetableController.updateTimetable);
router.delete('/:id', auth, roles(['superadmin','principal']), param('id').isMongoId(), validate, audit('delete_timetable'), timetableController.deleteTimetable);

module.exports = router;
