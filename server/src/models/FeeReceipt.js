const mongoose = require('mongoose');

const FeeReceiptSchema = new mongoose.Schema({
  receiptNumber: { type: String, required: true, unique: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeePayment' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  rollNumber: String,
  studentName: String,
  className: String,
  transactionId: String,
  data: { type: Object },
  pdfUrl: String,
}, { timestamps: true });

module.exports = mongoose.model('FeeReceipt', FeeReceiptSchema);
