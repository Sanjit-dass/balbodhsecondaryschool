const mongoose = require('mongoose');

const ExamResultSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  subjectMarks: [
    {
      subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
      marksObtained: Number,
      maxMarks: Number,
      percentage: Number,
      grade: String
    }
  ],
  totalMarksObtained: { type: Number },
  totalMaxMarks: { type: Number },
  totalPercentage: { type: Number },
  totalGrade: { type: String },
  passStatus: { type: String, enum: ['Pass', 'Fail'], default: 'Pass' },
  classPosition: { type: Number },
  published: { type: Boolean, default: false },
  publishedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ExamResultSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Unique constraint: one result per student-exam-class
ExamResultSchema.index({ exam: 1, student: 1, class: 1 }, { unique: true });

module.exports = mongoose.model('ExamResult', ExamResultSchema);
