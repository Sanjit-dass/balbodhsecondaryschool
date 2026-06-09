const mongoose = require('mongoose');

const AssignmentSubmissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, trim: true },
  attachments: [{ fileUrl: { type: String }, publicId: { type: String } }],
  status: { type: String, enum: ['submitted','reviewed','graded'], default: 'submitted' },
  grade: { type: String },
  feedback: { type: String },
  submittedAt: { type: Date, default: Date.now }
});

AssignmentSubmissionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AssignmentSubmission', AssignmentSubmissionSchema);
