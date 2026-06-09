const invoiceService = require('../services/invoiceService');
const paymentService = require('../services/paymentService');
const reportService = require('../services/reportService');

class AccountantController {
  /**
   * POST /accountant/invoice/create
   * Generate invoice for a specific student
   */
  async createInvoice(req, res) {
    try {
      const { studentId, classId, month, academicYear } = req.body;

      if (!studentId || !classId || !month || !academicYear) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: studentId, classId, month (1-12), academicYear',
        });
      }

      const invoice = await invoiceService.createSingleInvoice(studentId, classId, Number(month), academicYear);

      res.status(201).json({
        success: true,
        message: 'Student invoice generated successfully',
        data: invoice,
      });
    } catch (error) {
      console.error('Error in createInvoice:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /accountant/invoice/bulk-create
   * Bulk generate invoices for all active students in a class
   */
  async bulkCreateInvoices(req, res) {
    try {
      const { classId, month, academicYear } = req.body;

      if (!classId || !month || !academicYear) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: classId, month (1-12), academicYear',
        });
      }

      const results = await invoiceService.bulkCreateInvoices(classId, Number(month), academicYear);

      res.status(201).json({
        success: true,
        message: 'Bulk invoice generation run completed',
        data: results,
      });
    } catch (error) {
      console.error('Error in bulkCreateInvoices:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /accountant/fees/pay
   * Collect student payment, update invoice, generate receipt, update ledger
   */
  async collectPayment(req, res) {
    try {
      const { studentId, invoiceId, amount, method, transactionId, breakdown } = req.body;
      const processedBy = req.user?.id || req.user?._id;

      if (!studentId || !invoiceId || !amount || !method) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: studentId, invoiceId, amount, method',
        });
      }

      const result = await paymentService.processPayment({
        studentId,
        invoiceId,
        amount: Number(amount),
        method,
        transactionId,
        breakdown,
        processedBy,
      });

      res.status(200).json({
        success: true,
        message: 'Payment processed and receipt generated successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error in collectPayment:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /accountant/dues
   * Track unpaid students. Filter by class/month/academicYear
   */
  async getPendingDues(req, res) {
    try {
      const { classId, month, academicYear } = req.query;

      const duesList = await reportService.getPendingDues(
        classId,
        month ? Number(month) : undefined,
        academicYear
      );

      res.status(200).json({
        success: true,
        count: duesList.length,
        data: duesList,
      });
    } catch (error) {
      console.error('Error in getPendingDues:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /accountant/reports
   * Daily / monthly collections, pending list, class-wise totals
   */
  async getReports(req, res) {
    try {
      const { date, academicYear } = req.query;

      const dailyCollection = await reportService.getDailyCollection(date ? new Date(date) : new Date());
      const classRevenue = await reportService.getClassWiseRevenue(academicYear);
      const monthlyIncome = await reportService.getMonthlyIncome(academicYear);

      res.status(200).json({
        success: true,
        data: {
          dailyCollection,
          classRevenue,
          monthlyIncome,
        },
      });
    } catch (error) {
      console.error('Error in getReports:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new AccountantController();
