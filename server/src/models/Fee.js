const mongoose = require('mongoose');

/**
 * LEGACY FEE MODEL (kept for backward compatibility)
 * NEW SYSTEM should use StudentFeeAccount model instead
 */

const FeeSchema = new mongoose.Schema({
  // 👇 BASIC INFO
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },

  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    index: true
  },

  academicYear: {
    type: String,
    default: ''
  },

  // 👇 FEE HEAD (Admission / Tuition / etc)
  category: {
    type: String,
    enum: ['Tuition', 'Transport', 'Admission', 'Library', 'Exam', 'Other'],
    required: true
  },

  // 👇 AMOUNTS
  amount: {
    type: Number,
    required: true,
    min: 0
  },

  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  remainingAmount: {
    type: Number,
    default: function () {
      return this.amount - this.paidAmount;
    }
  },

  // 👇 STATUS CONTROL (VERY IMPORTANT FOR LOCKING)
  status: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid',
    index: true
  },

  isLocked: {
    type: Boolean,
    default: false
  },

  // 👇 OPTIONAL FEE SUPPORT
  isOptional: {
    type: Boolean,
    default: false
  },

  selected: {
    type: Boolean,
    default: true
  },

  // 👇 PAYMENT INFO
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank', 'online', 'cheque'],
    default: 'cash'
  },

  transactionId: {
    type: String,
    default: null
  },

  receiptUrl: {
    type: String
  },

  receipt: {
    fileUrl: String,
    publicId: String
  },

  notes: {
    type: String,
    default: ''
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // 👇 IMPORTANT FOR CONTROL
  lastPaymentDate: {
    type: Date
  },

  dueDate: {
    type: Date
  }

}, { timestamps: true });

/**
 * AUTO STATUS + LOCKING LOGIC
 */
FeeSchema.pre('save', function (next) {
  this.updatedAt = Date.now();

  // AUTO CALCULATE STATUS
  if (this.paidAmount >= this.amount) {
    this.status = 'paid';
    this.isLocked = true;
    this.paidAmount = this.amount;
    this.remainingAmount = 0;
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
    this.isLocked = false;
    this.remainingAmount = this.amount - this.paidAmount;
  } else {
    this.status = 'unpaid';
    this.isLocked = false;
    this.remainingAmount = this.amount;
  }

  next();
});

module.exports = mongoose.model('Fee', FeeSchema);