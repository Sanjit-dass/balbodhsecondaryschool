const feeService = require('../services/feeService');
const FeeStructureV2 = require('../models/FeeStructureV2');

/**
 * FEE CONTROLLER
 * Handles fee configuration, receipts, and reports
 */

class FeeController {
  /**
   * POST /fees/structure
   * Create or update fee structure for a class
   */
  async createFeeStructure(req, res) {
    try {
      const { classId, academicYear, items } = req.body;

      if (!classId || !academicYear || !items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            'Missing required fields: classId, academicYear, items (array)',
        });
      }

      const structure = await feeService.createFeeStructure({
        classId,
        academicYear,
        items,
        createdBy: req.user?._id,
      });

      res.status(201).json({
        success: true,
        message: 'Fee structure created successfully',
        data: structure,
      });
    } catch (error) {
      console.error('Create fee structure error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /fees/structure/:classId
   * Get active fee structure for a class
   */
  async getFeeStructure(req, res) {
    try {
      const { classId } = req.params;
      const { academicYear } = req.query;

      if (!academicYear) {
        return res.status(400).json({
          success: false,
          message: 'Academic year is required',
        });
      }

      const structure = await feeService.getFeeStructure(classId, academicYear);

      if (!structure) {
        return res.status(404).json({
          success: false,
          message: 'No active fee structure found',
        });
      }

      res.status(200).json({
        success: true,
        data: structure,
      });
    } catch (error) {
      console.error('Get fee structure error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /fees/structure/:classId/history
   * Get fee structure version history
   */
  async getFeeStructureHistory(req, res) {
    try {
      const { classId } = req.params;
      const { academicYear } = req.query;

      if (!academicYear) {
        return res.status(400).json({
          success: false,
          message: 'Academic year is required',
        });
      }

      const history = await feeService.getFeeStructureHistory(classId, academicYear);

      res.status(200).json({
        success: true,
        count: history.length,
        data: history,
      });
    } catch (error) {
      console.error('Get fee structure history error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /fees/receipt/:receiptId
   * Get receipt details
   */
  async getReceipt(req, res) {
    try {
      const { receiptId } = req.params;

      const receipt = await feeService.getReceipt(receiptId);

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
      console.error('Get receipt error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /fees/receipt/number/:receiptNumber
   * Get receipt by receipt number
   */
  async getReceiptByNumber(req, res) {
    try {
      const { receiptNumber } = req.params;

      const receipt = await feeService.getReceiptByNumber(receiptNumber);

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
      console.error('Get receipt by number error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /fees/receipts/:studentId
   * Get all receipts for a student
   */
  async getStudentReceipts(req, res) {
    try {
      const { studentId } = req.params;

      const receipts = await feeService.getStudentReceipts(studentId);

      res.status(200).json({
        success: true,
        count: receipts.length,
        data: receipts,
      });
    } catch (error) {
      console.error('Get student receipts error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /fees/student/:studentId/summary
   * Get comprehensive fee summary for a student
   */
  async getStudentFeeSummary(req, res) {
    try {
      const { studentId } = req.params;
      const { academicYear } = req.query;

      if (!academicYear) {
        return res.status(400).json({
          success: false,
          message: 'Academic year is required',
        });
      }

      const summary = await feeService.getStudentFeeSummary(studentId, academicYear);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error('Get student fee summary error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /fees/class/:classId/billing-report
   * Get comprehensive class billing report
   */
  async getClassBillingReport(req, res) {
    try {
      const { classId } = req.params;
      const { academicYear } = req.query;

      if (!academicYear) {
        return res.status(400).json({
          success: false,
          message: 'Academic year is required',
        });
      }

      const report = await feeService.getClassBillingReport(classId, academicYear);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Get class billing report error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /fees/class/:classId/export
   * Export billing data for a class
   */
  async exportClassBillingData(req, res) {
    try {
      const { classId } = req.params;
      const { academicYear } = req.query;

      if (!academicYear) {
        return res.status(400).json({
          success: false,
          message: 'Academic year is required',
        });
      }

      const data = await feeService.exportClassBillingData(classId, academicYear);

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="billing_${classId}_${academicYear}.csv"`
      );

      // Convert to CSV
      const csv = this._arrayToCSV(data);
      res.send(csv);
    } catch (error) {
      console.error('Export billing data error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Helper: Convert array to CSV
   */
  _arrayToCSV(data) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        }).join(',')
      ),
    ].join('\n');

    return csv;
  }

  /**
   * GET /fees/dashboard
   * Get comprehensive fee dashboard data
   */
  async getDashboard(req, res) {
    try {
      // This can aggregate data from multiple services
      res.status(200).json({
        success: true,
        message: 'Dashboard data retrieved',
        data: {
          // Will be populated based on request params
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new FeeController();
