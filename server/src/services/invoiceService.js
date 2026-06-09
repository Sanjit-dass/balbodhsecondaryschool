const Invoice = require('../models/Invoice');
const FeeStructureV2 = require('../models/FeeStructureV2');
const Student = require('../models/Student');
const ClassModel = require('../models/Class');

/**
 * INVOICE SERVICE
 * Handles all invoice creation, retrieval, and management
 * This is where the monthly billing logic lives
 */

class InvoiceService {
  /**
   * Create or retrieve monthly invoice for a student
   * @param {ObjectId} studentId
   * @param {ObjectId} classId
   * @param {Number} month
   * @param {String} academicYear
   * @returns {Promise<Invoice>}
   */
  async createOrGetInvoice(studentId, classId, month, academicYear) {
    try {
      // Check if invoice already exists
      let invoice = await Invoice.findOne({
        studentId,
        classId,
        month,
        academicYear,
      });

      if (invoice) {
        return invoice;
      }

      // Get fee structure for this class
      const feeStructure = await FeeStructureV2.findOne({
        classId,
        academicYear,
        isActive: true,
      });

      if (!feeStructure) {
        throw new Error(`No active fee structure found for class ${classId} in year ${academicYear}`);
      }

      // Get student and class info for denormalization
      const student = await Student.findById(studentId);
      const classInfo = await ClassModel.findById(classId);

      // Calculate total amount
      const totalAmount = feeStructure.getTotalMandatoryAmount();

      // Build items array from fee structure
      const items = feeStructure.getActiveItems().map((item) => ({
        itemId: item._id,
        name: item.name,
        category: item.category,
        amount: item.amount,
        paid: 0,
      }));

      // Create invoice
      invoice = new Invoice({
        studentId,
        classId,
        month,
        academicYear,
        rollNumber: student?.rollNumber || student?.admissionNumber,
        studentName: student?.fullName || student?.name,
        className: classInfo?.name,
        items,
        totalAmount,
        discount: 0,
        netAmount: totalAmount,
        paidAmount: 0,
        dueAmount: totalAmount,
        status: 'unpaid',
      });

      await invoice.save();
      return invoice;
    } catch (error) {
      throw new Error(`Error creating invoice: ${error.message}`);
    }
  }

  /**
   * Get invoice by ID
   * @param {ObjectId} invoiceId
   * @returns {Promise<Invoice>}
   */
  async getInvoiceById(invoiceId) {
    return await Invoice.findById(invoiceId).populate('studentId', 'name email rollNumber');
  }

  /**
   * Get all invoices for a student
   * @param {ObjectId} studentId
   * @param {Object} filters - { academicYear, status, month }
   * @returns {Promise<Invoice[]>}
   */
  async getStudentInvoices(studentId, filters = {}) {
    const query = { studentId, isActive: true };

    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.status) query.status = filters.status;
    if (filters.month) query.month = filters.month;

    return await Invoice.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get pending invoices for a student
   * @param {ObjectId} studentId
   * @returns {Promise<Invoice[]>}
   */
  async getPendingInvoices(studentId) {
    return await Invoice.find({
      studentId,
      status: { $in: ['unpaid', 'partial'] },
      isActive: true,
    }).sort({ dueAmount: -1 });
  }

  /**
   * Get summary of student's outstanding dues
   * @param {ObjectId} studentId
   * @returns {Promise<Object>}
   */
  async getStudentOutstanding(studentId) {
    const invoices = await Invoice.find({
      studentId,
      status: { $in: ['unpaid', 'partial'] },
      isActive: true,
    });

    return {
      totalDue: invoices.reduce((sum, inv) => sum + inv.dueAmount, 0),
      invoiceCount: invoices.length,
      invoices: invoices.map((inv) => ({
        id: inv._id,
        month: inv.month,
        academicYear: inv.academicYear,
        dueAmount: inv.dueAmount,
        status: inv.status,
      })),
    };
  }

  /**
   * Apply discount to invoice
   * @param {ObjectId} invoiceId
   * @param {Number} discountAmount
   * @param {String} reason
   * @returns {Promise<Invoice>}
   */
  async applyDiscount(invoiceId, discountAmount, reason = '') {
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    invoice.discount = (invoice.discount || 0) + discountAmount;
    invoice.remarks = (invoice.remarks || '') + `\nDiscount: ${discountAmount} (${reason})`;
    invoice.calculateTotals();

    await invoice.save();
    return invoice;
  }

  /**
   * Validate invoice and check if it can accept payment
   * @param {ObjectId} invoiceId
   * @returns {Promise<Object>}
   */
  async validateInvoice(invoiceId) {
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (!invoice.isActive) {
      throw new Error('Invoice is inactive');
    }

    return {
      valid: invoice.canAcceptPayment(),
      outstanding: invoice.getOutstanding(),
      invoice,
    };
  }

  /**
   * Get invoices by class for a specific month
   * Useful for billing reports
   * @param {ObjectId} classId
   * @param {Number} month
   * @param {String} academicYear
   * @returns {Promise<Array>}
   */
  async getClassInvoicesByMonth(classId, month, academicYear) {
    return await Invoice.find({
      classId,
      month,
      academicYear,
      isActive: true,
    })
      .select('studentId studentName rollNumber status totalAmount paidAmount dueAmount')
      .sort({ rollNumber: 1 });
  }

  /**
   * Get billing summary for a class
   * @param {ObjectId} classId
   * @param {String} academicYear
   * @returns {Promise<Object>}
   */
  async getClassBillingSummary(classId, academicYear) {
    const invoices = await Invoice.find({
      classId,
      academicYear,
      isActive: true,
    });

    if (invoices.length === 0) {
      return {
        totalStudents: 0,
        totalBilled: 0,
        totalCollected: 0,
        totalPending: 0,
        paymentRate: 0,
      };
    }

    const totalBilled = invoices.reduce((sum, inv) => sum + inv.netAmount, 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalPending = invoices.reduce((sum, inv) => sum + inv.dueAmount, 0);

    return {
      totalStudents: invoices.length,
      totalBilled,
      totalCollected,
      totalPending,
      paymentRate: totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(2) : 0,
      byStatus: {
        paid: invoices.filter((inv) => inv.status === 'paid').length,
        partial: invoices.filter((inv) => inv.status === 'partial').length,
        unpaid: invoices.filter((inv) => inv.status === 'unpaid').length,
      },
    };
  }

  /**
   * Auto-generate monthly invoices for all students in a class
   * This would typically run as a cron job
   * @param {ObjectId} classId
   * @param {Number} month
   * @param {String} academicYear
   * @returns {Promise<Object>}
   */
  async generateMonthlyInvoices(classId, month, academicYear) {
    try {
      const students = await Student.find({
        classId,
        isActive: true,
      });

      const results = {
        created: 0,
        failed: 0,
        errors: [],
      };

      for (const student of students) {
        try {
          await this.createOrGetInvoice(student._id, classId, month, academicYear);
          results.created++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            studentId: student._id,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Error generating invoices: ${error.message}`);
    }
  }
}

module.exports = new InvoiceService();
