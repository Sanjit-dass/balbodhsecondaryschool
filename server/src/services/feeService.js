const FeeStructureV2 = require('../models/FeeStructureV2');
const Receipt = require('../models/Receipt');
const Invoice = require('../models/Invoice');

/**
 * FEE SERVICE
 * High-level fee operations and utilities
 * Handles fee structure management and reporting
 */

class FeeService {
  /**
   * Create fee structure for a class
   * @param {Object} structureData
   *   - classId: ObjectId
   *   - academicYear: String
   *   - items: Array of fee items
   *   - createdBy: ObjectId
   * @returns {Promise<FeeStructureV2>}
   */
  async createFeeStructure(structureData) {
    try {
      // Check if active structure already exists
      const existing = await FeeStructureV2.findOne({
        classId: structureData.classId,
        academicYear: structureData.academicYear,
        isActive: true,
      });

      if (existing) {
        // Deactivate previous structure
        existing.isActive = false;
        await existing.save();
      }

      const feeStructure = new FeeStructureV2({
        classId: structureData.classId,
        academicYear: structureData.academicYear,
        items: structureData.items,
        createdBy: structureData.createdBy,
        isActive: true,
      });

      await feeStructure.save();
      return feeStructure;
    } catch (error) {
      throw new Error(`Error creating fee structure: ${error.message}`);
    }
  }

  /**
   * Get active fee structure for a class
   * @param {ObjectId} classId
   * @param {String} academicYear
   * @returns {Promise<FeeStructureV2>}
   */
  async getFeeStructure(classId, academicYear) {
    return await FeeStructureV2.findOne({
      classId,
      academicYear,
      isActive: true,
    });
  }

  /**
   * Get all fee structures (with version history)
   * @param {ObjectId} classId
   * @param {String} academicYear
   * @returns {Promise<FeeStructureV2[]>}
   */
  async getFeeStructureHistory(classId, academicYear) {
    return await FeeStructureV2.find({
      classId,
      academicYear,
    }).sort({ createdAt: -1 });
  }

  /**
   * Update fee structure
   * @param {ObjectId} structureId
   * @param {Object} updateData
   * @returns {Promise<FeeStructureV2>}
   */
  async updateFeeStructure(structureId, updateData) {
    try {
      const structure = await FeeStructureV2.findByIdAndUpdate(structureId, updateData, {
        new: true,
      });

      if (!structure) {
        throw new Error('Fee structure not found');
      }

      return structure;
    } catch (error) {
      throw new Error(`Error updating fee structure: ${error.message}`);
    }
  }

  /**
   * Get receipt by ID
   * @param {ObjectId} receiptId
   * @returns {Promise<Receipt>}
   */
  async getReceipt(receiptId) {
    return await Receipt.findById(receiptId)
      .populate('paymentId')
      .populate('invoiceId')
      .populate('studentId', 'name email rollNumber');
  }

  /**
   * Get receipt by receipt number
   * @param {String} receiptNumber
   * @returns {Promise<Receipt>}
   */
  async getReceiptByNumber(receiptNumber) {
    return await Receipt.findOne({ receiptNumber })
      .populate('paymentId')
      .populate('invoiceId')
      .populate('studentId');
  }

  /**
   * Get all receipts for a student
   * @param {ObjectId} studentId
   * @returns {Promise<Receipt[]>}
   */
  async getStudentReceipts(studentId) {
    return await Receipt.find({
      studentId,
      isArchived: false,
    })
      .populate('paymentId')
      .populate('invoiceId')
      .sort({ createdAt: -1 });
  }

  /**
   * Get student fee summary
   * Comprehensive view of student's fee status
   * @param {ObjectId} studentId
   * @param {String} academicYear
   * @returns {Promise<Object>}
   */
  async getStudentFeeSummary(studentId, academicYear) {
    try {
      // Get all invoices for student
      const invoices = await Invoice.find({
        studentId,
        academicYear,
        isActive: true,
      });

      if (invoices.length === 0) {
        return {
          studentId,
          academicYear,
          totalBilled: 0,
          totalPaid: 0,
          totalDue: 0,
          paymentPercentage: 0,
          invoices: [],
        };
      }

      const totalBilled = invoices.reduce((sum, inv) => sum + inv.netAmount, 0);
      const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
      const totalDue = invoices.reduce((sum, inv) => sum + inv.dueAmount, 0);

      return {
        studentId,
        academicYear,
        totalBilled,
        totalPaid,
        totalDue,
        paymentPercentage: totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(2) : 0,
        invoices: invoices.map((inv) => ({
          id: inv._id,
          month: inv.month,
          totalAmount: inv.totalAmount,
          discount: inv.discount,
          paidAmount: inv.paidAmount,
          dueAmount: inv.dueAmount,
          status: inv.status,
        })),
      };
    } catch (error) {
      throw new Error(`Error getting fee summary: ${error.message}`);
    }
  }

  /**
   * Get class-wise billing report
   * @param {ObjectId} classId
   * @param {String} academicYear
   * @returns {Promise<Object>}
   */
  async getClassBillingReport(classId, academicYear) {
    try {
      const invoices = await Invoice.find({
        classId,
        academicYear,
        isActive: true,
      });

      if (invoices.length === 0) {
        return {
          classId,
          academicYear,
          totalStudents: 0,
          report: [],
        };
      }

      const report = invoices.map((inv) => ({
        studentId: inv.studentId,
        studentName: inv.studentName,
        rollNumber: inv.rollNumber,
        totalBilled: inv.netAmount,
        paid: inv.paidAmount,
        due: inv.dueAmount,
        status: inv.status,
        paymentPercentage: inv.netAmount > 0 ? ((inv.paidAmount / inv.netAmount) * 100).toFixed(2) : 0,
      }));

      return {
        classId,
        academicYear,
        totalStudents: invoices.length,
        totalBilled: invoices.reduce((sum, inv) => sum + inv.netAmount, 0),
        totalCollected: invoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
        totalPending: invoices.reduce((sum, inv) => sum + inv.dueAmount, 0),
        report,
      };
    } catch (error) {
      throw new Error(`Error getting billing report: ${error.message}`);
    }
  }

  /**
   * Export class billing data
   * @param {ObjectId} classId
   * @param {String} academicYear
   * @returns {Promise<Array>}
   */
  async exportClassBillingData(classId, academicYear) {
    try {
      const report = await this.getClassBillingReport(classId, academicYear);

      return report.report.map((row) => ({
        'Student Name': row.studentName,
        'Roll Number': row.rollNumber,
        'Total Billed': row.totalBilled,
        'Paid': row.paid,
        'Due': row.due,
        'Status': row.status,
        'Payment %': row.paymentPercentage,
      }));
    } catch (error) {
      throw new Error(`Error exporting data: ${error.message}`);
    }
  }

  /**
   * Validate if fee can be collected
   * @param {ObjectId} studentId
   * @param {ObjectId} invoiceId
   * @returns {Promise<Object>}
   */
  async validateFeeCollection(studentId, invoiceId) {
    try {
      const invoice = await Invoice.findById(invoiceId);

      if (!invoice) {
        return {
          valid: false,
          message: 'Invoice not found',
        };
      }

      if (invoice.studentId.toString() !== studentId.toString()) {
        return {
          valid: false,
          message: 'Invoice does not belong to this student',
        };
      }

      if (!invoice.isActive) {
        return {
          valid: false,
          message: 'Invoice is inactive',
        };
      }

      if (!invoice.canAcceptPayment()) {
        return {
          valid: false,
          message: 'Invoice cannot accept more payments',
        };
      }

      return {
        valid: true,
        invoice,
        outstanding: invoice.dueAmount,
      };
    } catch (error) {
      return {
        valid: false,
        message: error.message,
      };
    }
  }
}

module.exports = new FeeService();
