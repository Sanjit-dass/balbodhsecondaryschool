const mongoose = require('mongoose');

const EcaCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  applicableClasses: [{ type: String, trim: true }],
  applyToAllClasses: { type: Boolean, default: false },
  academicYear: { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

EcaCategorySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('EcaCategory', EcaCategorySchema);
