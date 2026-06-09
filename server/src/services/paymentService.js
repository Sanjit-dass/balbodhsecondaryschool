const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Receipt = require('../models/Receipt');
const Ledger = require('../models/Ledger');
const Student = require('../models/Student');

/**
 * PAYMENT SERVICE
 * Handles all payment processing and transaction recording
 * Core business logic for fee collection
 */

class PaymentService {
  /**
   * Process payment against an invoice
   * THIS IS THE MAIN PAYMENT FLOW
   * @param {Object} paymentData
   *   - studentId: ObjectId
   *   - invoiceId: ObjectId
   *   - amount: Number
   *   - paymentMethod: String (cash, check, card, online, etc)
   *   - transactionId: String (optional)
   *   - referenceNumber: String (optional)
   *   - breakdown: Object (optional) - { 'Tuition': 1000, 'Bus': 500 }
   *   - remarks: String (optional)
   *   - processedBy: ObjectId (optional)
   * @returns {Promise<Object>} - { payment, invoice, receipt }
   */
  async processPayment(paymentData) {
    try {
      // 1. VALIDATE INVOICE
      const invoice = await Invoice.findById(paymentData.invoiceId);

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (!invoice.isActive) {
        throw new Error('Invoice is inactive and cannot accept payments');
      }

      if (!invoice.canAcceptPayment()) {
        throw new Error(`Invoice already paid. Outstanding: ${invoice.dueAmount}`);
      }

      // 2. VALIDATE PAYMENT AMOUNT
      if (paymentData.amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      if (paymentData.amount > invoice.dueAmount) {
        throw new Error(
          `Payment amount (${paymentData.amount}) exceeds outstanding amount (${invoice.dueAmount})`
        );
      }

      // 3. CREATE PAYMENT RECORD
      // 3.a Validate per-category locks (if breakdown provided)
      if (paymentData.breakdown && Object.keys(paymentData.breakdown).length > 0) {
        try {
          const StudentFeeLock = require('../models/StudentFeeLock');
          const breakdown = paymentData.breakdown || {};
          // build queries for possible keys (ids or names)
          const lockChecks = [];
          for (const key of Object.keys(breakdown)) {
            // if key looks like an ObjectId, check feeCategoryId; otherwise check feeName
            const isId = /^[0-9a-fA-F]{24}$/.test(key);
            if (isId) lockChecks.push({ feeCategoryId: key });
            else lockChecks.push({ feeName: key });
          }
          if (lockChecks.length > 0) {
            const query = { studentId: paymentData.studentId, locked: true, $or: lockChecks };
            const existing = await StudentFeeLock.findOne(query).lean();
            if (existing) {
              throw new Error(`Payment rejected: fee category already locked (${existing.feeName || existing.feeCategoryId})`);
            }
          }
        } catch (err) {
          // bubble validation errors
          if (err.message && err.message.startsWith('Payment rejected')) throw err;
          // otherwise warn and continue
          console.warn('Lock validation skipped:', err.message);
        }
      }

      const payment = new Payment({
        studentId: paymentData.studentId,
        invoiceId: paymentData.invoiceId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        transactionId: paymentData.transactionId,
        referenceNumber: paymentData.referenceNumber,
        breakdown: paymentData.breakdown || {},
        remarks: paymentData.remarks,
        processedBy: paymentData.processedBy,
        status: 'completed',
      });

      await payment.save();

      // 4. UPDATE INVOICE WITH PAYMENT
      invoice.addPayment(paymentData.amount);
      await invoice.save();

      // 4.a Allocate payment to invoice items
      try {
        const StudentFeeLock = require('../models/StudentFeeLock');
        const FeeCategory = require('../models/FeeCategory');

        const breakdown = paymentData.breakdown || {};

        // Prepare list of existing locks for this student to avoid allocating to locked items
        const existingLocks = await StudentFeeLock.find({ studentId: paymentData.studentId, locked: true }).lean();
        const lockedById = new Set(existingLocks.filter(l => l.feeCategoryId).map(l => String(l.feeCategoryId)));
        const lockedByName = new Set(existingLocks.filter(l => l.feeName).map(l => l.feeName));

        // If breakdown provided, allocate using breakdown keys (itemId/name/category)
        if (breakdown && Object.keys(breakdown).length > 0 && Array.isArray(invoice.items)) {
          const bd = { ...breakdown };
          for (const item of invoice.items) {
            let keyFound = null;
            if (item.itemId) {
              const idKey = String(item.itemId);
              if (bd[idKey] !== undefined) keyFound = idKey;
            }
            if (!keyFound && bd[item.name] !== undefined) keyFound = item.name;
            if (!keyFound && bd[item.category] !== undefined) keyFound = item.category;

            // skip locked items
            if ((item.itemId && lockedById.has(String(item.itemId))) || lockedByName.has(item.name)) continue;

            if (keyFound) {
              let allocate = Number(bd[keyFound]) || 0;
              const remaining = Math.max(0, (item.amount || 0) - (item.paid || 0));
              const toApply = Math.min(allocate, remaining);
              if (toApply > 0) {
                item.paid = (item.paid || 0) + toApply;
                bd[keyFound] = allocate - toApply;
              }
              if ((item.paid || 0) >= (item.amount || 0)) {
                try {
                  const feeCatId = item.itemId || null;
                  const query = feeCatId ? { studentId: paymentData.studentId, feeCategoryId: feeCatId } : { studentId: paymentData.studentId, feeName: item.name };
                  const update = {
                    studentId: paymentData.studentId,
                    feeCategoryId: feeCatId,
                    feeName: item.name,
                    classId: invoice.classId,
                    locked: true,
                    lockedAt: new Date(),
                    reason: 'Fully paid'
                  };
                  await StudentFeeLock.findOneAndUpdate(query, update, { upsert: true, new: true, setDefaultsOnInsert: true });
                } catch (errLock) {
                  console.warn('Failed to create StudentFeeLock:', errLock.message);
                }
              }
            }
          }
          await invoice.save();
        }

        // If no breakdown provided, allocate payment amount across unlocked items in order
        if ((!breakdown || Object.keys(breakdown).length === 0) && Array.isArray(invoice.items)) {
          let remaining = Number(paymentData.amount) || 0;
          for (const item of invoice.items) {
            if (remaining <= 0) break;
            // skip locked items
            if ((item.itemId && lockedById.has(String(item.itemId))) || lockedByName.has(item.name)) continue;
            const remainingItem = Math.max(0, (item.amount || 0) - (item.paid || 0));
            if (remainingItem <= 0) continue;
            const toApply = Math.min(remaining, remainingItem);
            item.paid = (item.paid || 0) + toApply;
            remaining -= toApply;
            if ((item.paid || 0) >= (item.amount || 0)) {
              try {
                const feeCatId = item.itemId || null;
                const query = feeCatId ? { studentId: paymentData.studentId, feeCategoryId: feeCatId } : { studentId: paymentData.studentId, feeName: item.name };
                const update = {
                  studentId: paymentData.studentId,
                  feeCategoryId: feeCatId,
                  feeName: item.name,
                  classId: invoice.classId,
                  locked: true,
                  lockedAt: new Date(),
                  reason: 'Fully paid'
                };
                await StudentFeeLock.findOneAndUpdate(query, update, { upsert: true, new: true, setDefaultsOnInsert: true });
              } catch (errLock) {
                console.warn('Failed to create StudentFeeLock:', errLock.message);
              }
            }
          }
          await invoice.save();
        }

        // 4.b If invoice fully paid, lock all mandatory fee categories for this student
        if (invoice.dueAmount === 0) {
          try {
            const mandatoryCats = await FeeCategory.find({ classId: invoice.classId, categoryType: 'Mandatory Fee', status: 'active' }).lean();
            for (const fc of mandatoryCats) {
              try {
                await StudentFeeLock.findOneAndUpdate({ studentId: paymentData.studentId, feeCategoryId: fc._id }, {
                  studentId: paymentData.studentId,
                  feeCategoryId: fc._id,
                  feeName: fc.name,
                  classId: invoice.classId,
                  locked: true,
                  lockedAt: new Date(),
                  reason: 'All mandatory fees settled (invoice fully paid)'
                }, { upsert: true, new: true, setDefaultsOnInsert: true });
              } catch (err) {
                console.warn('Failed to lock mandatory fee category:', err.message);
              }
            }
          } catch (err) {
            console.warn('Failed to fetch mandatory fee categories for locking:', err.message);
          }
        }
      } catch (err) {
        console.warn('Allocation/locking step skipped:', err.message);
      }

      // 5. CREATE LEDGER ENTRY (optional accounting)
      await this.createLedgerEntry({
        studentId: paymentData.studentId,
        paymentId: payment._id,
        invoiceId: invoice._id,
        amount: paymentData.amount,
        type: 'payment',
        balance: invoice.dueAmount, // New balance after payment
        month: invoice.month,
        academicYear: invoice.academicYear,
      });

      // 6. GENERATE RECEIPT
      const receipt = await this.generateReceipt({
        paymentId: payment._id,
        invoiceId: invoice._id,
        studentId: paymentData.studentId,
        payment,
        invoice,
      });

      payment.receiptId = receipt._id;
      await payment.save();

      return {
        success: true,
        payment: payment.toObject(),
        invoice: invoice.toObject(),
        receipt: receipt.toObject(),
      };
    } catch (error) {
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  /**
   * Get all payments for a student
   * @param {ObjectId} studentId
   * @param {Object} filters - { invoiceId, month, academicYear }
   * @returns {Promise<Payment[]>}
   */
  async getStudentPayments(studentId, filters = {}) {
    const query = { studentId, status: 'completed' };

    if (filters.invoiceId) query.invoiceId = filters.invoiceId;
    if (filters.month) {
      // Find invoices with this month and join
      const Invoice = require('../models/Invoice');
      const invoices = await Invoice.find({ month: filters.month });
      query.invoiceId = { $in: invoices.map((inv) => inv._id) };
    }

    return await Payment.find(query)
      .populate('invoiceId', 'month academicYear totalAmount paidAmount dueAmount')
      .sort({ createdAt: -1 });
  }

  /**
   * Get payment details
   * @param {ObjectId} paymentId
   * @returns {Promise<Payment>}
   */
  async getPaymentDetails(paymentId) {
    return await Payment.findById(paymentId)
      .populate('studentId', 'name email rollNumber')
      .populate('invoiceId')
      .populate('receiptId');
  }

  /**
   * Get all payments for an invoice
   * @param {ObjectId} invoiceId
   * @returns {Promise<Payment[]>}
   */
  async getInvoicePayments(invoiceId) {
    return await Payment.find({
      invoiceId,
      status: 'completed',
    }).sort({ createdAt: -1 });
  }

  /**
   * Generate receipt from payment
   * @param {Object} receiptData
   * @returns {Promise<Receipt>}
   */
  async generateReceipt(receiptData) {
    try {
      const { paymentId, invoiceId, studentId, payment, invoice } = receiptData;

      // Generate unique receipt number
      const receiptNumber = await this.generateReceiptNumber();

      // Get student info
      const student = await Student.findById(studentId);

      // Get previous balance (sum of all prior payments for student)
      const previousPayments = await Payment.find({
        studentId,
        createdAt: { $lt: payment.createdAt },
        status: 'completed',
      }).sort({ createdAt: -1 });

      let previousBalance = 0;
      if (previousPayments.length > 0) {
        previousBalance = previousPayments[0].amount || 0;
      }

      // Create receipt
      const receipt = new Receipt({
        paymentId,
        invoiceId,
        studentId,
        receiptNumber,
        rollNumber: student?.rollNumber || student?.admissionNumber,
        studentName: student?.fullName || student?.name,
        className: invoice?.className,
        receiptData: {
          amount: payment.amount,
          method: payment.paymentMethod,
          transactionId: payment.transactionId,
          date: new Date(),
          invoiceAmount: invoice.totalAmount,
          previousBalance,
          currentBalance: invoice.dueAmount,
        },
        isGenerated: true,
        pdfUrl: null, // Will be set by PDF generation service
      });

      await receipt.save();
      return receipt;
    } catch (error) {
      throw new Error(`Error generating receipt: ${error.message}`);
    }
  }

  /**
   * Generate unique receipt number
   * Format: RCP-YYYYMMDD-XXXXX
   * @returns {Promise<String>}
   */
  async generateReceiptNumber() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    // Get count of receipts created today
    const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const count = await Receipt.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const sequence = String(count + 1).padStart(5, '0');
    return `RCP-${dateStr}-${sequence}`;
  }

  /**
   * Create ledger entry for accounting
   * @param {Object} ledgerData
   * @returns {Promise<Ledger>}
   */
  async createLedgerEntry(ledgerData) {
    try {
      const {
        studentId,
        paymentId,
        invoiceId,
        amount,
        type,
        balance,
        month,
        academicYear,
      } = ledgerData;

      // Get previous balance
      const lastEntry = await Ledger.findOne({ studentId }).sort({ createdAt: -1 });
      const previousBalance = lastEntry?.balance || 0;

      const ledger = new Ledger({
        studentId,
        paymentId,
        invoiceId,
        transactionType: type,
        debit: type === 'invoice' ? amount : 0,
        credit: type === 'payment' ? amount : 0,
        balance: balance || previousBalance + (type === 'payment' ? -amount : amount),
        month,
        academicYear,
      });

      await ledger.save();
      return ledger;
    } catch (error) {
      console.warn('Ledger creation skipped:', error.message);
      // Don't throw - ledger is optional
      return null;
    }
  }

  /**
   * Get payment statistics for reporting
   * @param {Object} filters - { startDate, endDate, paymentMethod, classId }
   * @returns {Promise<Object>}
   */
  async getPaymentStats(filters = {}) {
    const query = { status: 'completed' };

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;

    const payments = await Payment.find(query);

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const byMethod = {};

    payments.forEach((p) => {
      if (!byMethod[p.paymentMethod]) {
        byMethod[p.paymentMethod] = { count: 0, amount: 0 };
      }
      byMethod[p.paymentMethod].count++;
      byMethod[p.paymentMethod].amount += p.amount;
    });

    return {
      totalPayments: payments.length,
      totalAmount,
      byMethod,
      averagePayment: payments.length > 0 ? (totalAmount / payments.length).toFixed(2) : 0,
    };
  }
}

module.exports = new PaymentService();
