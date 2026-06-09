const mongoose = require('mongoose');

const ExamMarksSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  marksObtained: { type: Number, required: true, min: 0 },
  maxMarks: { type: Number, required: true, min: 0 },
  percentage: { type: Number },
  grade: { type: String },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ExamMarksSchema.pre('save', function (next) {
  // Calculate percentage and grade
  if (this.marksObtained !== undefined && this.maxMarks) {
    this.percentage = (this.marksObtained / this.maxMarks) * 100;
    if (this.percentage >= 90) this.grade = 'A+';
    else if (this.percentage >= 80) this.grade = 'A';
    else if (this.percentage >= 70) this.grade = 'B+';
    else if (this.percentage >= 60) this.grade = 'B';
    else if (this.percentage >= 50) this.grade = 'C';
    else this.grade = 'F';
  }
  this.updatedAt = Date.now();
  next();
});

// Unique constraint: one entry per student-exam-subject-class
ExamMarksSchema.index({ exam: 1, class: 1, subject: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('ExamMarks', ExamMarksSchema);
