const mongoose = require('mongoose');

/**
 * INVOICE MODEL - THE BILLING LAYER & SINGLE SOURCE OF TRUTH FOR STUDENT DUES
 * Represents student fee dues per month/year
 */
const InvoiceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true, // 1-12 representing school calendar billing months
      min: 1,
      max: 12,
    },
    academicYear: {
      type: String,
      required: true,
      index: true,
    },

    // Denormalized for quick reporting lookups
    rollNumber: String,
    studentName: String,
    className: String,

    // Fee breakdown items
    items: [
      {
        name: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
        paid: { type: Number, default: 0 },
      },
    ],

    // Financial calculations
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      default: 0, // totalAmount - discount
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    dueAmount: {
      type: Number,
      default: 0, // netAmount - paidAmount
    },

    status: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
      index: true,
    },

    remarks: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'invoices',
  }
);

// Compound index to ensure only one invoice per student, month, and academic year
InvoiceSchema.index({ studentId: 1, month: 1, academicYear: 1 }, { unique: true });

// Totals calculation helper
InvoiceSchema.methods.calculateTotals = function () {
  this.netAmount = Math.max(0, this.totalAmount - (this.discount || 0));
  this.dueAmount = Math.max(0, this.netAmount - (this.paidAmount || 0));

  if (this.dueAmount === 0) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else {
    this.status = 'unpaid';
  }

  return this;
};

// Add payment helper
InvoiceSchema.methods.addPayment = function (amount) {
  this.paidAmount = (this.paidAmount || 0) + amount;
  this.calculateTotals();
  return this;
};

module.exports = mongoose.model('Invoice', InvoiceSchema);
