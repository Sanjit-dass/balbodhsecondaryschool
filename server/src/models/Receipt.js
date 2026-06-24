const mongoose = require('mongoose');

/**
 * RECEIPT MODEL - DOCUMENT LAYER ONLY
 * Represents PDF receipt links and identification codes. No calculation logic.
 */
const ReceiptSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      unique: true,
      index: true,
    },
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        index: true,
      },
      // denormalized fields for quick public lookup
      rollNumber: String,
      studentName: String,
      className: String,
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    pdfUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'receipts',
  }
);

module.exports = mongoose.model('Receipt', ReceiptSchema);
