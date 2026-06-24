const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const eventController = require('../controllers/eventController');

// Public listing
router.get('/public', eventController.listPublicEvents);
router.get('/', eventController.listPublicEvents);

// Admin protected endpoints
router.get('/admin/list', auth, roles(['superadmin','principal','admin']), eventController.listEventsAdmin);
router.get('/:id', eventController.getEvent);
router.post('/', auth, roles(['superadmin','principal','admin']), eventController.createEvent);
router.put('/:id', auth, roles(['superadmin','principal','admin']), eventController.updateEvent);
router.delete('/:id', auth, roles(['superadmin','principal','admin']), eventController.deleteEvent);

module.exports = router;
