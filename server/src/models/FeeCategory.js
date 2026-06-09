const mongoose = require('mongoose');

const FeeCategorySchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  name: { type: String, required: true },
  description: String,
  amount: { type: Number, default: 0 },
  defaultAmount: { type: Number, default: 0 },
  categoryType: { type: String, enum: ['Mandatory Fee', 'Optional Service'], default: 'Mandatory Fee' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

FeeCategorySchema.index({ classId: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports = mongoose.model('FeeCategory', FeeCategorySchema);
