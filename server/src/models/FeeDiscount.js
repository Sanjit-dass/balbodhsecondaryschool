const mongoose = require('mongoose');

const FeeDiscountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['percentage','fixed'], default: 'fixed' },
  value: { type: Number, required: true },
  applicableTo: { type: String, enum: ['student','class','global'], default: 'student' },
  targetId: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

module.exports = mongoose.model('FeeDiscount', FeeDiscountSchema);
