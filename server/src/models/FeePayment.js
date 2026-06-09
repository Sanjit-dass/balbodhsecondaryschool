const mongoose = require('mongoose');

const FeePaymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  receiptNumber: { type: String, required: true, unique: true },
  paymentMethod: { type: String, required: true },
  // denormalized student & class info for easier reporting
  rollNumber: String,
  studentName: String,
  className: String,
  totalFee: { type: Number, default: 0 },
  paidToday: { type: Number, default: 0 },
  transactionId: String,
  referenceNumber: String,
  amountPaid: { type: Number, required: true },
  dueAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  status: { type: String, enum: ['Paid','Partial','Pending'], default: 'Paid' },
  feeMonth: String,
  breakdown: { type: Object },
  remarks: String,
}, { timestamps: true });

module.exports = mongoose.model('FeePayment', FeePaymentSchema);
