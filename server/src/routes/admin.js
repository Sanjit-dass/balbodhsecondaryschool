const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const adminController = require('../controllers/adminController');

// All admin routes require authentication and the admin or superadmin role
router.post('/fee-structure', auth, roles(['admin', 'superadmin']), adminController.createFeeStructure);
router.get('/reports', auth, roles(['admin', 'superadmin']), adminController.getReports);
router.post('/users', auth, roles(['admin', 'superadmin']), adminController.manageUsers);

module.exports = router;
