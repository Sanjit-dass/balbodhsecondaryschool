const mongoose = require('mongoose');

const FeeStructureSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('FeeStructure', FeeStructureSchema);
