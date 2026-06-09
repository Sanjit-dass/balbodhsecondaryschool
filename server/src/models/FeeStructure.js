const mongoose = require('mongoose');

const FeeStructureSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true,
  },
  academicYear: {
    type: String,
    required: true,
    index: true,
  },
  items: [
    {
      name: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['mandatory', 'optional'],
        default: 'mandatory',
      },
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  ],
}, { timestamps: true });

// Ensure unique fee structure per class per academic year
FeeStructureSchema.index({ classId: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('FeeStructure', FeeStructureSchema);
