const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Receipt = require('../models/Receipt');
const Ledger = require('../models/Ledger');
const Student = require('../models/Student');
const { generateReceiptPdfBuffer, uploadPdfBuffer } = require('../utils/pdfGenerator');

class PaymentService {
  /**
   * Process payment against an invoice
   * @param {Object} paymentData
   *   - studentId: ObjectId
   *   - invoiceId: ObjectId
   *   - amount: Number
   *   - method: String
   *   - transactionId: String
   *   - breakdown: Object (optional) - e.g. { tuition: 1000, bus: 500 }
   *   - processedBy: ObjectId
   * @returns {Promise<Object>}
   */
  async processPayment(paymentData) {
    const { studentId, invoiceId, amount, method, transactionId, breakdown, processedBy } = paymentData;

    // 1. Fetch and validate invoice
    const invoice = await Invoice.findOne({ _id: invoiceId, studentId, isActive: true });
    if (!invoice) {
      throw new Error('Invoice not found or inactive');
    }

    if (invoice.dueAmount === 0) {
      throw new Error('Invoice is already fully paid');
    }

    if (amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    if (amount > invoice.dueAmount) {
      throw new Error(`Payment amount (${amount}) exceeds outstanding invoice due (${invoice.dueAmount})`);
    }

    // 2. Allocate payment amount to invoice items
    const finalBreakdown = {};
    if (breakdown && Object.keys(breakdown).length > 0) {
      // Allocate according to custom breakdown
      invoice.items.forEach((item) => {
        const allocated = Number(breakdown[item.name] || breakdown[item.name.toLowerCase()] || 0);
        if (allocated > 0) {
          const itemDue = Math.max(0, item.amount - (item.paid || 0));
          const actualAllocated = Math.min(itemDue, allocated);
          item.paid = (item.paid || 0) + actualAllocated;
          finalBreakdown[item.name] = actualAllocated;
        } else {
          finalBreakdown[item.name] = 0;
        }
      });
    } else {
      // Allocate sequentially (first unpaid gets paid first)
      let remaining = amount;
      invoice.items.forEach((item) => {
        const itemDue = Math.max(0, item.amount - (item.paid || 0));
        if (itemDue > 0 && remaining > 0) {
          const allocated = Math.min(itemDue, remaining);
          item.paid = (item.paid || 0) + allocated;
          remaining -= allocated;
          finalBreakdown[item.name] = allocated;
        } else {
          finalBreakdown[item.name] = 0;
        }
      });
    }

    // 3. Save payment transaction (NO calculations inside Payment)
    const payment = new Payment({
      studentId,
      invoiceId,
      amount,
      method,
      transactionId,
      breakdown: finalBreakdown,
      processedBy,
    });
    await payment.save();

    // 4. Update Invoice totals & status
    invoice.addPayment(amount);
    await invoice.save();

    // 5. Create Ledger entry (Audit log)
    try {
      const ledgerEntry = new Ledger({
        studentId,
        invoiceId,
        paymentId: payment._id,
        transactionType: 'payment',
        debit: 0,
        credit: amount,
        balance: invoice.dueAmount,
        academicYear: invoice.academicYear,
        month: invoice.month,
        description: `Payment collected via ${method.toUpperCase()}`
      });
      await ledgerEntry.save();
    } catch (ledgerErr) {
      console.warn('⚠️ Ledger logging failed (optional step):', ledgerErr.message);
    }

    // 6. Generate PDF Receipt and upload to Cloudinary
    let receipt;
    try {
      const student = await Student.findById(studentId).lean();
      const receiptNumber = await this.generateReceiptNumber();

      const pdfBuffer = await generateReceiptPdfBuffer({
        receiptNumber,
        student,
        invoice,
        payment,
      });

      const pdfUrl = await uploadPdfBuffer(
        pdfBuffer,
        'receipts',
        `receipt_${receiptNumber}`
      );

      // Save Receipt document (include denormalized student info)
      receipt = new Receipt({
        paymentId: payment._id,
        invoiceId: invoice._id,
        receiptNumber,
        pdfUrl,
        studentId: student?._id,
        studentName: student?.name || student?.fullName || student?.fullname || '',
        className: invoice?.className || student?.className || '',
        rollNumber: invoice?.rollNumber || student?.rollNumber || student?.admissionNumber || ''
      });
      await receipt.save();

      // Link receiptId back to Payment
      payment.receiptId = receipt._id;
      await payment.save();
    } catch (pdfErr) {
      console.error('❌ PDF Receipt generation failed:', pdfErr);
      // Create partial receipt record without PDF so flow is not broken
      const receiptNumber = await this.generateReceiptNumber();
      receipt = new Receipt({
        paymentId: payment._id,
        invoiceId: invoice._id,
        receiptNumber,
        pdfUrl: '',
        studentId: student?._id,
        studentName: student?.name || student?.fullName || student?.fullname || '',
        className: invoice?.className || student?.className || '',
        rollNumber: invoice?.rollNumber || student?.rollNumber || student?.admissionNumber || ''
      });
      await receipt.save();
    }

    return {
      success: true,
      payment,
      invoice,
      receipt,
    };
  }

  /**
   * Generate next receipt number
   * Format: RCP-YYYYMMDD-XXXXX
   */
  async generateReceiptNumber() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const count = await Receipt.countDocuments({
      createdAt: { $gte: start, $lt: end },
    });

    const sequence = String(count + 1).padStart(5, '0');
    return `RCP-${dateStr}-${sequence}`;
  }

  /**
   * Get all payments for a student
   * @param {ObjectId} studentId
   * @returns {Promise<Payment[]>}
   */
  async getStudentPayments(studentId) {
    return await Payment.find({ studentId })
      .populate('invoiceId', 'month academicYear')
      .sort({ createdAt: -1 });
  }

  /**
   * Get payment details by ID
   * @param {ObjectId} paymentId
   * @returns {Promise<Payment>}
   */
  async getPaymentDetails(paymentId) {
    return await Payment.findById(paymentId)
      .populate('studentId', 'fullName rollNumber admissionNumber')
      .populate('invoiceId')
      .populate('receiptId');
  }

  /**
   * Get all payments for a specific invoice
   * @param {ObjectId} invoiceId
   * @returns {Promise<Payment[]>}
   */
  async getInvoicePayments(invoiceId) {
    return await Payment.find({ invoiceId }).sort({ createdAt: -1 });
  }
}

module.exports = new PaymentService();
