const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// Import controllers
const invoiceController = require('../controllers/invoiceController');
const paymentController = require('../controllers/paymentController');
const feeController = require('../controllers/feeNewController');

/**
 * ============================================
 * INVOICE ROUTES
 * ============================================
 */

// Create monthly invoice
router.post(
  '/invoice/create',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant']),
  invoiceController.createInvoice
);

// Get all invoices for a student
router.get(
  '/invoice/:studentId',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant', 'parent', 'student']),
  invoiceController.getStudentInvoices
);

// Get specific invoice details
router.get(
  '/invoice/details/:invoiceId',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant', 'parent', 'student']),
  invoiceController.getInvoiceDetails
);

// Get outstanding dues for a student
router.get(
  '/invoice/:studentId/outstanding',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant', 'parent', 'student']),
  invoiceController.getOutstanding
);

// Apply discount to invoice
router.post(
  '/invoice/:invoiceId/discount',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant']),
  invoiceController.applyDiscount
);

// Get billing summary for a class
router.get(
  '/invoice/class/:classId/summary',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant']),
  invoiceController.getClassBillingSummary
);

// Generate monthly invoices for a class
router.post(
  '/invoice/generate-monthly',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant']),
  invoiceController.generateMonthlyInvoices
);

/**
 * ============================================
 * PAYMENT ROUTES
 * ============================================
 */

// Process payment - MAIN PAYMENT ENDPOINT
router.post(
  '/pay',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant']),
  paymentController.processPayment
);

// Get all payments for a student
router.get(
  '/payments/:studentId',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant', 'parent', 'student']),
  paymentController.getStudentPayments
);

// Get specific payment details
router.get(
  '/payments/details/:paymentId',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant', 'parent', 'student']),
  paymentController.getPaymentDetails
);

// Get all payments for an invoice
router.get(
  '/payments/invoice/:invoiceId',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant']),
  paymentController.getInvoicePayments
);

// Get payment statistics
router.get(
  '/payments/stats',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant']),
  paymentController.getPaymentStats
);

// Validate invoice for payment
router.post(
  '/validate-invoice',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant']),
  paymentController.validateInvoice
);

/**
 * ============================================
 * FEE STRUCTURE ROUTES
 * ============================================
 */

// Create fee structure for a class
router.post(
  '/structure',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant']),
  feeController.createFeeStructure
);

// Get active fee structure
router.get(
  '/structure/:classId',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant', 'teacher', 'parent', 'student']),
  feeController.getFeeStructure
);

// Get fee structure history
router.get(
  '/structure/:classId/history',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant']),
  feeController.getFeeStructureHistory
);

/**
 * ============================================
 * RECEIPT ROUTES
 * ============================================
 */

// Get receipt by ID
router.get(
  '/receipt/:receiptId',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant', 'parent', 'student']),
  feeController.getReceipt
);

// Get receipt by receipt number
router.get(
  '/receipt/number/:receiptNumber',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant', 'parent', 'student']),
  feeController.getReceiptByNumber
);

// Get all receipts for a student
router.get(
  '/receipts/:studentId',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant', 'parent', 'student']),
  feeController.getStudentReceipts
);

/**
 * ============================================
 * REPORT & SUMMARY ROUTES
 * ============================================
 */

// Get student fee summary
router.get(
  '/student/:studentId/summary',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant', 'parent', 'student']),
  feeController.getStudentFeeSummary
);

// Get class billing report
router.get(
  '/class/:classId/billing-report',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant']),
  feeController.getClassBillingReport
);

// Export class billing data
router.get(
  '/class/:classId/export',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant']),
  feeController.exportClassBillingData
);

/**
 * ============================================
 * DASHBOARD ROUTE
 * ============================================
 */

// Get fee dashboard
router.get(
  '/dashboard',
  auth,
  roles(['superadmin', 'admin', 'principal', 'accountant']),
  feeController.getDashboard
);

module.exports = router;
