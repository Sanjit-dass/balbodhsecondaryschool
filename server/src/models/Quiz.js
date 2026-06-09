const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, enum: ['mcq','descriptive'], default: 'mcq' },
  options: [{ type: String }],
  answer: { type: String },
  marks: { type: Number, default: 1 }
}, { _id: false });

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  instructions: { type: String },
  academicYear: { type: String },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  section: { type: String },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  questions: [QuestionSchema],
  durationMinutes: { type: Number, default: 30 },
  publishDate: { type: Date },
  isPublished: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', QuizSchema);
