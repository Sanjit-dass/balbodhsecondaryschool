const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  marks: [{ subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }, marksObtained: Number, maxMarks: Number }],
  grade: { type: String },
  gpa: { type: Number },
  published: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', ResultSchema);
