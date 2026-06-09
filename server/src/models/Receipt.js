const mongoose = require('mongoose');

/**
 * RECEIPT MODEL - DOCUMENT LAYER ONLY
 * Represents the PDF/document generated from a payment
 * Pure documentation - no calculations
 */
const ReceiptSchema = new mongoose.Schema(
  {
    // Reference Information
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
      unique: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },

    // Receipt Identification
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Denormalized Info (for fast lookup without joins)
    rollNumber: String,
    studentName: String,
    className: String,

    // Document Details
    pdfUrl: String, // Cloudinary URL or local path
    htmlContent: String, // For regeneration if needed

    // Receipt Data (Snapshot of payment data)
    receiptData: {
      amount: Number,
      method: String,
      transactionId: String,
      date: Date,
      invoiceAmount: Number,
      previousBalance: Number,
      currentBalance: Number,
    },

    // Document Status
    isGenerated: {
      type: Boolean,
      default: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },

    // Access Control
    isArchived: {
      type: Boolean,
      default: false,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'receipts',
  }
);

// Indexes for retrieval
ReceiptSchema.index({ studentId: 1, createdAt: -1 });
ReceiptSchema.index({ receiptNumber: 1 });

module.exports = mongoose.model('Receipt', ReceiptSchema);
