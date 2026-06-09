const mongoose = require('mongoose');

/**
 * PAYMENT MODEL - TRANSACTION LAYER ONLY
 * Stores only actual payment transactions (NO calculations here)
 */
const PaymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      required: true, // e.g. 'cash', 'card', 'bank_transfer', 'online'
    },
    transactionId: {
      type: String,
    },
    breakdown: {
      type: Map,
      of: Number, // { tuition: 1000, bus: 500 }
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Receipt',
    },
    remarks: String,
  },
  {
    timestamps: true,
    collection: 'payments',
  }
);

PaymentSchema.index({ studentId: 1, invoiceId: 1 });
PaymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);
