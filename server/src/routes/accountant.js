const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const accountantController = require('../controllers/accountantController');

// All accountant routes require authentication and the accountant, admin, or superadmin role
router.post('/invoice/create', auth, roles(['accountant', 'admin', 'superadmin']), accountantController.createInvoice);
router.post('/invoice/bulk-create', auth, roles(['accountant', 'admin', 'superadmin']), accountantController.bulkCreateInvoices);
router.post('/fees/pay', auth, roles(['accountant', 'admin', 'superadmin']), accountantController.collectPayment);
router.get('/dues', auth, roles(['accountant', 'admin', 'superadmin']), accountantController.getPendingDues);
router.get('/reports', auth, roles(['accountant', 'admin', 'superadmin']), accountantController.getReports);

module.exports = router;
