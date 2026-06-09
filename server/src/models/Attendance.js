const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: { type: String, enum: ['student','teacher'], default: 'student' },
  class: { type: String },
  section: { type: String },
  period: { type: String },
  subject: { type: String },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submitted: { type: Boolean, default: false },
  topic: { type: String },
  homeworkGiven: { type: Boolean, default: false },
  homework: { type: String },
  teachingNotes: { type: String },
  records: [{
    person: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Student' },
    rollNumber: { type: String },
    name: { type: String },
    status: { type: String, enum: ['present','absent','leave'], default: 'present' },
    note: { type: String }
  }],
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

AttendanceSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (Array.isArray(this.records)) {
    const seen = new Set();
    this.records = this.records.reduce((acc, record) => {
      const key = String(record.person || record.rollNumber || record.name || Math.random());
      if (!seen.has(key)) {
        seen.add(key);
        acc.push(record);
      }
      return acc;
    }, []);
  }
  next();
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
