const Invoice = require('../models/Invoice');
const FeeStructure = require('../models/FeeStructure');
const Student = require('../models/Student');
const ClassModel = require('../models/Class');

class InvoiceService {
  /**
   * Create or fetch monthly invoice for a student
   * @param {ObjectId} studentId
   * @param {ObjectId} classId
   * @param {Number} month - 1-12
   * @param {String} academicYear
   * @returns {Promise<Invoice>}
   */
  async createSingleInvoice(studentId, classId, month, academicYear) {
    try {
      // 1. Check if invoice already exists
      let invoice = await Invoice.findOne({
        studentId,
        month,
        academicYear,
        isActive: true,
      });

      if (invoice) {
        return invoice;
      }

      // 2. Fetch Fee Structure for class
      const feeStructure = await FeeStructure.findOne({ classId, academicYear });
      if (!feeStructure) {
        throw new Error(`Fee structure not found for class in academic year ${academicYear}`);
      }

      // 3. Fetch Student and Class details
      const student = await Student.findById(studentId);
      const classObj = await ClassModel.findById(classId);

      // 4. Construct invoice items (bill mandatory items by default)
      const invoiceItems = feeStructure.items
        .filter(item => item.type === 'mandatory')
        .map(item => ({
          name: item.name,
          amount: item.amount,
          paid: 0,
        }));

      if (invoiceItems.length === 0) {
        throw new Error('No mandatory fee items defined in the fee structure');
      }

      const totalAmount = invoiceItems.reduce((sum, item) => sum + item.amount, 0);

      // 5. Create invoice
      invoice = new Invoice({
        studentId,
        classId,
        month,
        academicYear,
        rollNumber: student?.rollNumber || student?.admissionNumber || '',
        studentName: student?.fullName || student?.name || '',
        className: classObj?.name || '',
        items: invoiceItems,
        totalAmount,
        discount: 0,
        paidAmount: 0,
        dueAmount: totalAmount,
        status: 'unpaid',
      });

      await invoice.save();
      return invoice;
    } catch (error) {
      throw new Error(`Failed to create invoice: ${error.message}`);
    }
  }

  /**
   * Generate monthly invoices in bulk for a class
   * @param {ObjectId} classId
   * @param {Number} month
   * @param {String} academicYear
   * @returns {Promise<Object>} - summary of execution
   */
  async bulkCreateInvoices(classId, month, academicYear) {
    try {
      // Fetch all active students in this class
      const students = await Student.find({ class: classId, status: 'active' });

      const results = {
        total: students.length,
        created: 0,
        skipped: 0,
        failed: 0,
        errors: [],
      };

      for (const student of students) {
        try {
          // Check if invoice already exists
          const existing = await Invoice.findOne({
            studentId: student._id,
            month,
            academicYear,
            isActive: true,
          });

          if (existing) {
            results.skipped++;
            continue;
          }

          await this.createSingleInvoice(student._id, classId, month, academicYear);
          results.created++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            studentId: student._id,
            studentName: student.fullName,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Bulk invoice generation failed: ${error.message}`);
    }
  }

  /**
   * Get all invoices for a student
   * @param {ObjectId} studentId
   * @param {Object} filters
   * @returns {Promise<Invoice[]>}
   */
  async getStudentInvoices(studentId, filters = {}) {
    const query = { studentId, isActive: true };
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.status) query.status = filters.status;
    if (filters.month) query.month = filters.month;

    return await Invoice.find(query).sort({ month: 1 });
  }

  /**
   * Override invoice items or apply discount (Admin Override)
   * @param {ObjectId} invoiceId
   * @param {Array} newItems
   * @param {Number} discount
   * @returns {Promise<Invoice>}
   */
  async overrideInvoice(invoiceId, newItems, discount) {
    try {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (newItems && Array.isArray(newItems)) {
        invoice.items = newItems.map(item => ({
          name: item.name,
          amount: item.amount,
          paid: item.paid || 0,
        }));
        invoice.totalAmount = invoice.items.reduce((sum, item) => sum + item.amount, 0);
      }

      if (discount !== undefined) {
        invoice.discount = discount;
      }

      invoice.calculateTotals();
      await invoice.save();
      return invoice;
    } catch (error) {
      throw new Error(`Invoice override failed: ${error.message}`);
    }
  }
}

module.exports = new InvoiceService();
