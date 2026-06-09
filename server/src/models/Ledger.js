const mongoose = require('mongoose');

/**
 * LEDGER MODEL - OPTIONAL ACCOUNTING LAYER
 * Maintains double-entry accounting for financial reporting
 * Can be used for advanced financial analysis and auditing
 */
const LedgerSchema = new mongoose.Schema(
  {
    // Reference Information
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },

    // Transaction Type
    transactionType: {
      type: String,
      enum: ['invoice', 'payment', 'adjustment', 'discount', 'reversal'],
      required: true,
    },

    // Amount Breakdown
    debit: {
      type: Number,
      default: 0, // Increases receivable (fee amount)
    },
    credit: {
      type: Number,
      default: 0, // Decreases receivable (payment)
    },

    // Running Balance
    balance: {
      type: Number,
      required: true, // Running balance for student
    },

    // Metadata
    description: String,
    month: Number,
    academicYear: String,
    remarks: String,

    // Status
    isReconciled: {
      type: Boolean,
      default: false,
    },
    reconciledAt: Date,
    reconciledBy: mongoose.Schema.Types.ObjectId,

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'ledgers',
  }
);

// Indexes for reporting
LedgerSchema.index({ studentId: 1, createdAt: -1 });
LedgerSchema.index({ invoiceId: 1 });
LedgerSchema.index({ paymentId: 1 });
LedgerSchema.index({ academicYear: 1, transactionType: 1 });

module.exports = mongoose.model('Ledger', LedgerSchema);
