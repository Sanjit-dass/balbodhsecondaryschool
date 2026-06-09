const mongoose = require('mongoose');

/**
 * IMPROVED FEE STRUCTURE MODEL - Master Data Layer
 * Defines all fee categories and amounts for a class in an academic year
 * This is the master configuration that generates invoices
 */
const FeeStructureV2Schema = new mongoose.Schema(
  {
    // Identification
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    academicYear: {
      type: String,
      required: true, // e.g., "2024-2025"
      index: true,
    },

    // Fee Items
    items: [
      {
        _id: false,
        name: {
          type: String,
          required: true, // e.g., "Tuition Fee", "Bus Fee"
        },
        category: {
          type: String,
          required: true, // e.g., "tuition", "transportation", "hostel"
        },
        type: {
          type: String,
          enum: ['mandatory', 'optional'],
          default: 'mandatory',
        },
        description: String,
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        frequency: {
          type: String,
          enum: ['monthly', 'quarterly', 'semi-annual', 'annual'],
          default: 'monthly',
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Version Control
    version: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Metadata
    createdBy: mongoose.Schema.Types.ObjectId,
    updatedBy: mongoose.Schema.Types.ObjectId,

    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: Date,
  },
  {
    timestamps: true,
    collection: 'fee_structures',
  }
);

// Ensure one active structure per class per year
FeeStructureV2Schema.index({ classId: 1, academicYear: 1, isActive: 1 }, { unique: true, sparse: true });

// Calculate total mandatory fees
FeeStructureV2Schema.methods.getTotalMandatoryAmount = function () {
  return this.items
    .filter((item) => item.type === 'mandatory' && item.isActive)
    .reduce((sum, item) => sum + item.amount, 0);
};

// Calculate total optional fees
FeeStructureV2Schema.methods.getTotalOptionalAmount = function () {
  return this.items
    .filter((item) => item.type === 'optional' && item.isActive)
    .reduce((sum, item) => sum + item.amount, 0);
};

// Get all active items
FeeStructureV2Schema.methods.getActiveItems = function () {
  return this.items.filter((item) => item.isActive);
};

// Get item by category
FeeStructureV2Schema.methods.getItemByCategory = function (category) {
  return this.items.find((item) => item.category === category && item.isActive);
};

module.exports = mongoose.model('FeeStructureV2', FeeStructureV2Schema);
