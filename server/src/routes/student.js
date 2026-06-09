const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const studentController = require('../controllers/studentController');

// All student routes require authentication and the student, parent, admin, or superadmin role
router.get('/dashboard', auth, roles(['student', 'parent', 'admin', 'superadmin']), studentController.getDashboard);
router.get('/invoices', auth, roles(['student', 'parent', 'admin', 'superadmin']), studentController.getInvoices);
router.get('/payments', auth, roles(['student', 'parent', 'admin', 'superadmin']), studentController.getPayments);
router.get('/receipt/:id', auth, roles(['student', 'parent', 'admin', 'superadmin']), studentController.getReceipt);

module.exports = router;
