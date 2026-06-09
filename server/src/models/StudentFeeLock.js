const mongoose = require('mongoose');

const StudentFeeLockSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  feeCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeCategory' },
  feeName: { type: String },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  locked: { type: Boolean, default: true },
  lockedAt: { type: Date, default: Date.now },
  reason: { type: String },
}, { timestamps: true });

StudentFeeLockSchema.index({ studentId: 1, feeCategoryId: 1 }, { unique: true, sparse: true });
StudentFeeLockSchema.index({ studentId: 1, feeName: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('StudentFeeLock', StudentFeeLockSchema);
