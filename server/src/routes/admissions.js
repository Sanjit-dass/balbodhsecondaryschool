const express = require('express');
const router = express.Router();
const admissionController = require('../controllers/admissionController');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// Public: submit an application
router.post('/', admissionController.createAdmission);

// Admin: list, view, update, delete, convert
router.get('/', auth, roles(['admin','superadmin','principal']), admissionController.listAdmissions);
router.get('/:id', auth, roles(['admin','superadmin','principal']), admissionController.getAdmission);
router.put('/:id/status', auth, roles(['admin','superadmin','principal']), admissionController.updateStatus);
router.delete('/:id', auth, roles(['admin','superadmin','principal']), admissionController.deleteAdmission);
router.post('/:id/convert', auth, roles(['admin','superadmin','principal']), admissionController.convertAdmission);

module.exports = router;
