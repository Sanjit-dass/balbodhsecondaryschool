const invoiceService = require('../services/invoiceService');
const paymentService = require('../services/paymentService');
const feeService = require('../services/feeService');
const Invoice = require('../models/Invoice');

/**
 * INVOICE CONTROLLER
 * Handles all invoice-related HTTP requests
 */

class InvoiceController {
  /**
   * POST /fees/invoice/create
   * Create monthly invoice for a student
   */
  async createInvoice(req, res) {
    try {
      const { studentId, classId, month, academicYear } = req.body;

      if (!studentId || !classId || !month || !academicYear) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: studentId, classId, month, academicYear',
        });
      }

      const invoice = await invoiceService.createOrGetInvoice(studentId, classId, month, academicYear);

      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: invoice,
      });
    } catch (error) {
      console.error('Create invoice error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /fees/invoice/:studentId
   * Get all invoices for a student
   */
  async getStudentInvoices(req, res) {
    try {
      const { studentId } = req.params;
      const { academicYear, status, month } = req.query;

      const invoices = await invoiceService.getStudentInvoices(studentId, {
        academicYear,
        status,
        month: month ? parseInt(month) : undefined,
      });

      res.status(200).json({
        success: true,
        message: 'Invoices retrieved successfully',
        count: invoices.length,
        data: invoices,
      });
    } catch (error) {
      console.error('Get invoices error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /fees/invoice/details/:invoiceId
   * Get specific invoice details
   */
  async getInvoiceDetails(req, res) {
    try {
      const { invoiceId } = req.params;

      const invoice = await invoiceService.getInvoiceById(invoiceId);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found',
        });
      }

      // Get payments for this invoice
      const payments = await paymentService.getInvoicePayments(invoiceId);

      res.status(200).json({
        success: true,
        data: {
          invoice,
          payments,
          paymentCount: payments.length,
        },
      });
    } catch (error) {
      console.error('Get invoice details error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /fees/invoice/:studentId/outstanding
   * Get outstanding dues for a student
   */
  async getOutstanding(req, res) {
    try {
      const { studentId } = req.params;

      const outstanding = await invoiceService.getStudentOutstanding(studentId);

      res.status(200).json({
        success: true,
        data: outstanding,
      });
    } catch (error) {
      console.error('Get outstanding error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /fees/invoice/:invoiceId/discount
   * Apply discount to invoice (for scholarship/concession)
   */
  async applyDiscount(req, res) {
    try {
      const { invoiceId } = req.params;
      const { amount, reason } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Discount amount must be greater than 0',
        });
      }

      const invoice = await invoiceService.applyDiscount(invoiceId, amount, reason);

      res.status(200).json({
        success: true,
        message: 'Discount applied successfully',
        data: invoice,
      });
    } catch (error) {
      console.error('Apply discount error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /fees/invoice/class/:classId/summary
   * Get billing summary for entire class
   */
  async getClassBillingSummary(req, res) {
    try {
      const { classId } = req.params;
      const { academicYear } = req.query;

      if (!academicYear) {
        return res.status(400).json({
          success: false,
          message: 'Academic year is required',
        });
      }

      const summary = await invoiceService.getClassBillingSummary(classId, academicYear);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error('Get class billing summary error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /fees/invoice/generate-monthly
   * Auto-generate monthly invoices for a class
   * (Admin/Teacher endpoint)
   */
  async generateMonthlyInvoices(req, res) {
    try {
      const { classId, month, academicYear } = req.body;

      if (!classId || !month || !academicYear) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: classId, month, academicYear',
        });
      }

      const result = await invoiceService.generateMonthlyInvoices(classId, month, academicYear);

      res.status(200).json({
        success: true,
        message: 'Monthly invoices generated',
        data: result,
      });
    } catch (error) {
      console.error('Generate monthly invoices error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new InvoiceController();
