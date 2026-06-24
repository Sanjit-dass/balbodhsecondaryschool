const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const feeController = require('../controllers/feeController');
const feeNewController = require('../controllers/feeNewController');

// Debug endpoint
router.get('/debug/payments/:studentId', auth, roles(['superadmin','admin','principal','accountant']), feeController.debugPayments);

// Operational fee endpoints — no manual/legacy fee CRUD exposed.
router.get('/dashboard', auth, roles(['superadmin','admin','principal','accountant']), feeController.dashboard);
router.get('/class/:classId/students', auth, roles(['superadmin','admin','principal','accountant']), feeController.classStudents);
router.get('/student/:studentId', auth, roles(['superadmin','admin','principal','accountant','parent','student']), feeController.studentProfile);
router.get('/student/:studentId/locks', auth, roles(['superadmin','admin','principal','accountant','parent','student']), feeController.getStudentFeeLocks);
// Allow students to claim their student record by matching class + roll/admission number
router.post('/student/claim', auth, roles(['student','parent','superadmin','admin']), feeController.claimStudent);
// Public lookup endpoint used by student portal to verify name/class/roll
router.post('/lookup', feeNewController.lookupStudent);
// Public fetch endpoint to return payments/receipts and summary by class+roll (no student link required)
router.post('/public/fetch', feeNewController.publicFetchFees);
router.post('/collect', auth, roles(['superadmin','admin','principal','accountant']), feeController.collectFee);
router.post('/initialize', auth, roles(['superadmin','admin','principal','accountant']), feeController.initializeFees);
router.get('/student/:studentId/history', auth, roles(['superadmin','admin','principal','accountant','parent','student']), feeController.feeHistory);
router.get('/payments/:id', auth, roles(['superadmin','admin','principal','accountant','parent','student']), feeController.getPayment);
router.get('/payments/:id/pdf', auth, roles(['superadmin','admin','principal','accountant','parent','student']), feeController.getPaymentPdf);
router.get('/payments/:id/receipt', auth, roles(['superadmin','admin','principal','accountant','parent','student']), feeController.getReceipt);
router.get('/receipts/:receiptId', auth, roles(['superadmin','admin','principal','accountant','parent','student']), feeController.getReceipt);
router.get('/receipts/by-id/:receiptId', auth, roles(['superadmin','admin','principal','accountant','parent','student']), feeController.getReceipt);
router.get('/receipts', auth, roles(['superadmin','admin','principal','accountant','parent','student']), feeController.getReceipt);
router.get('/receipt/:id', auth, roles(['superadmin','admin','principal','accountant','parent','student']), feeController.getReceipt);
router.get('/receipt', auth, roles(['superadmin','admin','principal','accountant','parent','student']), feeController.getReceipt);

// Fee category management
router.get('/categories', auth, roles(['superadmin','admin','principal','accountant']), feeController.listCategories);
router.post('/categories', auth, roles(['superadmin','admin','principal','accountant']), feeController.createCategory);
router.put('/categories/:id', auth, roles(['superadmin','admin','principal','accountant']), feeController.updateCategory);
router.delete('/categories/:id', auth, roles(['superadmin','admin','principal','accountant']), feeController.deleteCategory);

// Fee Category Assignment - NEW ENDPOINTS
// Get all classes in proper sorted order for dropdown (Nursery, LKG, UKG, 1-10)
router.get('/classes-dropdown', auth, roles(['superadmin','admin','principal','accountant']), feeController.getClassesForDropdown);

// Assign fee categories to a class (both mandatory and optional)
router.post('/class/:classId/assign-categories', auth, roles(['superadmin','admin','principal','accountant']), (req, res) => {
	res.status(501).json({ success: false, message: 'assignFeeCategoryToClass temporarily unavailable' });
});

// Get fee structure for a class with separated mandatory and optional items
router.get('/class/:classId/fee-structure', auth, roles(['superadmin','admin','principal','accountant']), feeController.getClassFeeStructureWithSeparation);

// Class fee structure
router.get('/structure', auth, roles(['superadmin','admin','principal','accountant']), feeController.getAllClassStructures);
router.get('/structure/:classId', auth, roles(['superadmin','admin','principal','accountant']), feeController.getClassStructure);
router.post('/structure/:classId', auth, roles(['superadmin','admin','principal','accountant']), feeController.saveClassStructure);
router.get('/payments', auth, roles(['superadmin','admin','principal','accountant']), feeController.allPayments);
router.put('/payments/:id', auth, roles(['superadmin','admin','principal','accountant']), feeController.updatePayment);
router.delete('/payments/:id', auth, roles(['superadmin','admin','accountant']), feeController.deletePayment);

module.exports = router;
