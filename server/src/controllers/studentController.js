const feeService = require('../services/feeService');
const invoiceService = require('../services/invoiceService');
const paymentService = require('../services/paymentService');
const reportService = require('../services/reportService');
const Student = require('../models/Student');

class StudentController {
  /**
   * Helper: Resolve student record from user ID
   */
  async _resolveStudent(userId) {
    const student = await Student.findOne({ user: userId });
    if (!student) {
      throw new Error('Student profile not found for the logged in user');
    }
    return student;
  }

  /**
   * GET /student/dashboard
   * View total fee, paid amount, due amount, and payment history
   */
  async getDashboard(req, res) {
    try {
      const student = await this._resolveStudent(req.user.id);
      const { academicYear } = req.query;

      const [summary, payments] = await Promise.all([
        feeService.getStudentFeeSummary(student._id, academicYear),
        paymentService.getStudentPayments(student._id),
      ]);

      res.status(200).json({
        success: true,
        data: {
          studentDetails: {
            fullName: student.fullName,
            rollNumber: student.rollNumber || student.admissionNumber,
            admissionNumber: student.admissionNumber,
            classId: student.class,
          },
          totalBilled: summary.totalBilled,
          totalPaid: summary.totalPaid,
          totalDue: summary.totalDue,
          paymentPercentage: summary.paymentPercentage,
          paymentHistory: payments,
        },
      });
    } catch (error) {
      console.error('Error in getDashboard:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /student/invoices
   * Get all monthly invoices for the logged-in student
   */
  async getInvoices(req, res) {
    try {
      const student = await this._resolveStudent(req.user.id);
      const { academicYear, status, month } = req.query;

      const invoices = await invoiceService.getStudentInvoices(student._id, {
        academicYear,
        status,
        month: month ? Number(month) : undefined,
      });

      res.status(200).json({
        success: true,
        count: invoices.length,
        data: invoices,
      });
    } catch (error) {
      console.error('Error in getInvoices:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /student/payments
   * Get all payments made by the student
   */
  async getPayments(req, res) {
    try {
      const student = await this._resolveStudent(req.user.id);

      const payments = await paymentService.getStudentPayments(student._id);

      res.status(200).json({
        success: true,
        count: payments.length,
        data: payments,
      });
    } catch (error) {
      console.error('Error in getPayments:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /student/receipt/:id
   * Download or view PDF receipt details by receipt ID (or payment ID)
   */
  async getReceipt(req, res) {
    try {
      const { id } = req.params;

      // Try to find by receipt ID first, otherwise find by payment ID
      let receipt = await feeService.getReceipt(id);
      if (!receipt) {
        receipt = await feeService.getReceiptByNumber(id);
      }

      if (!receipt) {
        // Fallback: search by paymentId
        const ReceiptModel = require('../models/Receipt');
        receipt = await ReceiptModel.findOne({ paymentId: id });
      }

      if (!receipt) {
        return res.status(404).json({
          success: false,
          message: 'Receipt not found',
        });
      }

      res.status(200).json({
        success: true,
        data: receipt,
      });
    } catch (error) {
      console.error('Error in getReceipt:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new StudentController();
