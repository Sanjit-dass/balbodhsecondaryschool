const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  dueDate: { type: Date },
  // attachments stored as objects with fileUrl and publicId (Cloudinary)
  attachments: [{ fileUrl: { type: String }, publicId: { type: String } }],
  totalMarks: { type: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  academicYear: { type: String },
  status: { type: String, enum: ['active','closed'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

AssignmentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Assignment', AssignmentSchema);
