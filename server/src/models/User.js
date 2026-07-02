const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['superadmin','admin','principal','teacher','accountant','examcontroller','student','parent'], default: 'student' },
  status: { type: String, enum: ['active','inactive','suspended'], default: 'active' },
  profile: {
    phone: { type: String },
    photoUrl: { type: String },
    department: { type: String },
    designation: { type: String },
    address: { type: String }
  },
  // Teacher-specific assignments
  assignedSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  assignedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  permissions: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', UserSchema);
