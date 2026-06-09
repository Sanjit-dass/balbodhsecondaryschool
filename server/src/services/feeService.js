const FeeStructure = require('../models/FeeStructure');
const Receipt = require('../models/Receipt');
const Invoice = require('../models/Invoice');

class FeeService {
  /**
   * Create or update class-wise fee structure
   * @param {Object} structureData
   * @returns {Promise<FeeStructure>}
   */
  async createOrUpdateFeeStructure(structureData) {
    const { classId, academicYear, items } = structureData;

    try {
      // Find and update or create new fee structure
      const feeStructure = await FeeStructure.findOneAndUpdate(
        { classId, academicYear },
        { items },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      return feeStructure;
    } catch (error) {
      throw new Error(`Error setting fee structure: ${error.message}`);
    }
  }

  /**
   * Get active fee structure for a class
   * @param {ObjectId} classId
   * @param {String} academicYear
   * @returns {Promise<FeeStructure>}
   */
  async getFeeStructure(classId, academicYear) {
    return await FeeStructure.findOne({ classId, academicYear });
  }

  /**
   * Delete fee structure for a class and year
   * @param {ObjectId} classId
   * @param {String} academicYear
   * @returns {Promise<Boolean>}
   */
  async deleteFeeStructure(classId, academicYear) {
    const result = await FeeStructure.deleteOne({ classId, academicYear });
    return result.deletedCount > 0;
  }

  /**
   * Get receipt details by ID
   * @param {ObjectId} receiptId
   * @returns {Promise<Receipt>}
   */
  async getReceipt(receiptId) {
    return await Receipt.findById(receiptId)
      .populate('paymentId')
      .populate('invoiceId')
      .populate('studentId', 'fullName email rollNumber admissionNumber');
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
      .populate('studentId', 'fullName email rollNumber admissionNumber');
  }

  /**
   * Get all receipts for a student
   * @param {ObjectId} studentId
   * @returns {Promise<Receipt[]>}
   */
  async getStudentReceipts(studentId) {
    return await Receipt.find({ studentId })
      .populate('paymentId')
      .populate('invoiceId')
      .sort({ createdAt: -1 });
  }

  /**
   * Get student fee summary
   * @param {ObjectId} studentId
   * @param {String} academicYear
   * @returns {Promise<Object>}
   */
  async getStudentFeeSummary(studentId, academicYear) {
    try {
      const query = { studentId, isActive: true };
      if (academicYear) query.academicYear = academicYear;

      const invoices = await Invoice.find(query).sort({ month: 1 });

      if (invoices.length === 0) {
        return {
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
        totalBilled,
        totalPaid,
        totalDue,
        paymentPercentage: totalBilled > 0 ? Number(((totalPaid / totalBilled) * 100).toFixed(2)) : 0,
        invoices: invoices.map((inv) => ({
          invoiceId: inv._id,
          month: inv.month,
          academicYear: inv.academicYear,
          totalAmount: inv.totalAmount,
          discount: inv.discount,
          netAmount: inv.netAmount,
          paidAmount: inv.paidAmount,
          dueAmount: inv.dueAmount,
          status: inv.status,
          items: inv.items,
        })),
      };
    } catch (error) {
      throw new Error(`Error getting student fee summary: ${error.message}`);
    }
  }
}

module.exports = new FeeService();
