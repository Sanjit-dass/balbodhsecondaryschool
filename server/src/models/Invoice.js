const mongoose = require('mongoose');

/**
 * INVOICE MODEL - THE SINGLE SOURCE OF TRUTH FOR STUDENT DUES
 * Represents a monthly billing statement for a student
 * This is where all calculations happen - NOT in Payment or Receipt
 */
const InvoiceSchema = new mongoose.Schema(
  {
    // Reference Information
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

    // Billing Period
    month: {
      type: Number,
      required: true, // 1-12
      min: 1,
      max: 12,
    },
    academicYear: {
      type: String,
      required: true, // e.g., "2024-2025"
      index: true,
    },

    // Denormalized for Quick Lookup (Reporting)
    rollNumber: String,
    studentName: String,
    className: String,

    // Items (Breakdown of fees)
    items: [
      {
        itemId: mongoose.Schema.Types.ObjectId,
        name: String,
        category: String, // e.g., "Tuition", "Bus", "Hostel"
        amount: Number,
        paid: { type: Number, default: 0 },
        _id: false,
      },
    ],

    // Financial Summary (CALCULATED FIELDS)
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0, // Scholarship/Concession
      description: 'Total discount applied',
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

    // Status Tracking
    status: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
      index: true,
    },

    // Payment Related
    paymentCount: {
      type: Number,
      default: 0,
    },
    lastPaymentDate: Date,

    // Notes
    remarks: String,
    isActive: {
      type: Boolean,
      default: true,
    },

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: Date,
  },
  {
    timestamps: true,
    collection: 'invoices',
  }
);

// Compound index for finding invoices by student, month, year
InvoiceSchema.index({ studentId: 1, month: 1, academicYear: 1 }, { unique: true });

// Index for reporting - pending invoices
InvoiceSchema.index({ status: 1, academicYear: 1 });

// Calculate net amount and due amount
InvoiceSchema.methods.calculateTotals = function () {
  this.netAmount = this.totalAmount - (this.discount || 0);
  this.dueAmount = Math.max(0, this.netAmount - (this.paidAmount || 0));

  // Update status
  if (this.dueAmount === 0) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else {
    this.status = 'unpaid';
  }

  return this;
};

// Get outstanding amount
InvoiceSchema.methods.getOutstanding = function () {
  return this.dueAmount || 0;
};

// Check if invoice can accept more payments
InvoiceSchema.methods.canAcceptPayment = function () {
  return this.dueAmount > 0;
};

// Add payment to invoice
InvoiceSchema.methods.addPayment = function (amount) {
  this.paidAmount = (this.paidAmount || 0) + amount;
  this.paymentCount = (this.paymentCount || 0) + 1;
  this.lastPaymentDate = new Date();
  this.calculateTotals();
  return this;
};

module.exports = mongoose.model('Invoice', InvoiceSchema);
