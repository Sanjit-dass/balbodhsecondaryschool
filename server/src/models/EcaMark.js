const mongoose = require('mongoose');

const EcaMarkSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  academicYear: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'EcaCategory', required: true },
  categoryName: { type: String, trim: true },
  marks: { type: String, required: true, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['draft', 'verified', 'published', 'deleted'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

EcaMarkSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

EcaMarkSchema.index({ student: 1, classId: 1, academicYear: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('EcaMark', EcaMarkSchema);
