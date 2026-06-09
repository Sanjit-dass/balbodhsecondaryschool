const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  name: { type: String, required: true },
  numeric: { type: Number },
  sections: [{ type: String }],
  classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  academicYear: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Class', ClassSchema);
