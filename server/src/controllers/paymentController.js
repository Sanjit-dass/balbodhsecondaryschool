const paymentService = require('../services/paymentService');
const feeService = require('../services/feeService');
const Invoice = require('../models/Invoice');

/**
 * PAYMENT CONTROLLER
 * Handles all payment processing HTTP requests
 */

class PaymentController {
  /**
   * POST /fees/pay
   * Process payment against invoice
   * THIS IS THE MAIN PAYMENT ENDPOINT
   */
  async processPayment(req, res) {
    try {
      const {
        studentId,
        invoiceId,
        amount,
        paymentMethod,
        transactionId,
        referenceNumber,
        breakdown,
        remarks,
      } = req.body;

      // Validation
      if (!studentId || !invoiceId || !amount || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message:
            'Missing required fields: studentId, invoiceId, amount, paymentMethod',
        });
      }

      // Process payment
      const result = await paymentService.processPayment({
        studentId,
        invoiceId,
        amount,
        paymentMethod,
        transactionId,
        referenceNumber,
        breakdown,
        remarks,
        processedBy: req.user?._id, // From auth middleware
      });

      res.status(201).json({
        success: true,
        message: 'Payment processed successfully',
        data: result,
      });
    } catch (error) {
      console.error('Process payment error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /fees/payments/:studentId
   * Get all payments for a student
   */
  async getStudentPayments(req, res) {
    try {
      const { studentId } = req.params;
      const { invoiceId, month } = req.query;

      const payments = await paymentService.getStudentPayments(studentId, {
        invoiceId,
        month: month ? parseInt(month) : undefined,
      });

      res.status(200).json({
        success: true,
        count: payments.length,
        data: payments,
      });
    } catch (error) {
      console.error('Get student payments error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /fees/payments/details/:paymentId
   * Get specific payment details
   */
  async getPaymentDetails(req, res) {
    try {
      const { paymentId } = req.params;

      const payment = await paymentService.getPaymentDetails(paymentId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      console.error('Get payment details error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /fees/payments/invoice/:invoiceId
   * Get all payments for an invoice
   */
  async getInvoicePayments(req, res) {
    try {
      const { invoiceId } = req.params;

      const payments = await paymentService.getInvoicePayments(invoiceId);

      res.status(200).json({
        success: true,
        count: payments.length,
        data: payments,
      });
    } catch (error) {
      console.error('Get invoice payments error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /fees/payments/stats
   * Get payment statistics for reporting
   */
  async getPaymentStats(req, res) {
    try {
      const { startDate, endDate, paymentMethod, classId } = req.query;

      const stats = await paymentService.getPaymentStats({
        startDate,
        endDate,
        paymentMethod,
        classId,
      });

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Get payment stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /fees/validate-invoice
   * Validate if invoice can accept payment
   */
  async validateInvoice(req, res) {
    try {
      const { invoiceId } = req.body;

      if (!invoiceId) {
        return res.status(400).json({
          success: false,
          message: 'Invoice ID is required',
        });
      }

      const result = await feeService.validateFeeCollection(
        req.body.studentId,
        invoiceId
      );

      res.status(200).json({
        success: result.valid,
        data: result,
      });
    } catch (error) {
      console.error('Validate invoice error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new PaymentController();
