const mongoose = require('mongoose');

/**
 * PAYMENT MODEL - TRANSACTION LAYER ONLY
 * Records payment transactions against invoices
 * NO calculation logic - purely a transaction record
 */
const PaymentSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },

    // Payment Details
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'check', 'bank_transfer', 'card', 'online', 'other'],
      required: true,
    },

    // Transaction Reference
    transactionId: String, // e.g., Payment gateway transaction ID
    referenceNumber: String, // e.g., Check number, bank reference
    remarks: String,

    // Breakdown (optional - which items were paid against)
    breakdown: {
      type: Map,
      of: Number, // { 'Tuition': 1000, 'Bus': 500 }
      description: 'Payment allocation per category',
    },

    // Receipt Link
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Receipt',
    },

    // Status
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed', 'cancelled'],
      default: 'completed',
    },

    // Processing Information
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'payments',
  }
);

// Indexes for queries
PaymentSchema.index({ studentId: 1, invoiceId: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);
