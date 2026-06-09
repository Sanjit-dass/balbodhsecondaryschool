const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
  title: { type: String, trim: true },
  type: { type: String, enum: ['First Terminal Exam','Second Terminal Exam','Third Terminal Exam','Final Exam','Quarterly','Half-Yearly','Annual','Entrance','Custom'], default: 'Custom' },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  academicYear: { type: String, required: true },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  startDate: { type: Date },
  endDate: { type: Date },
  maxMarks: { type: Number, default: 100 },
  passMarks: { type: Number, default: 40 },
  // legacy URL fields (may contain full URL or publicId)
  admitCardUrl: { type: String },
  marksheetUrl: { type: String },
  // structured objects for Cloudinary attachments
  admitCard: { fileUrl: { type: String }, publicId: { type: String } },
  marksheet: { fileUrl: { type: String }, publicId: { type: String } },
  notes: { type: String },
  resultsPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ExamSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Exam', ExamSchema);
