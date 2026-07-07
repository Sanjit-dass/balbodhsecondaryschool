const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  class: { type: String, enum: ['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10'], default: 'Nursery' },
  academicYear: { type: String, trim: true },
  code: { type: String },
  marksDistribution: { type: Object },
  displayOrder: { type: Number, default: 0 },
  subjectType: { type: String, trim: true },
  passMarks: { type: Number },
  theoryMarks: { type: Number },
  practicalMarks: { type: Number },
  fullMarks: { type: Number },
  assignedTeachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

SubjectSchema.index({ class: 1, academicYear: 1, name: 1 }, { unique: false });

module.exports = mongoose.model('Subject', SubjectSchema);
