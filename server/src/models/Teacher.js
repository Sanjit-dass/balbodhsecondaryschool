const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
  fullName: { type: String, trim: true },
  employeeId: { type: String, trim: true, unique: true, sparse: true },
  username: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String },
  address: { type: String, trim: true },
  classTeacher: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male','female','other'] },
  qualifications: { type: String },
  experience: { type: String },
  joiningDate: { type: Date },
  subject: { type: String, trim: true },
  assignedClass: { type: String, trim: true },
  role: { type: String, enum: ['teacher'], default: 'teacher' },
  status: { type: String, enum: ['active','inactive','suspended'], default: 'active' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // legacy string URL
  photoUrl: { type: String },
  // structured photo object for Cloudinary
  photo: {
    fileUrl: { type: String },
    publicId: { type: String }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

TeacherSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Teacher', TeacherSchema);
