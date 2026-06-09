const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  class: { type: String, enum: ['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10'], default: 'Nursery' },
  code: { type: String },
  marksDistribution: { type: Object },
  assignedTeachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subject', SubjectSchema);
