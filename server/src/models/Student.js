const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  admissionNumber: { type: String, index: true },
  rollNumber: { type: String, index: true },
  fullName: { type: String, trim: true },
  name: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String },
  parentName: { type: String },
  contactNumber: { type: String },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  className: { type: String, trim: true },
  academicYear: { type: String, trim: true },
  promotionHistory: [{
    academicYear: { type: String, trim: true },
    fromClass: { type: String, trim: true },
    toClass: { type: String, trim: true },
    promotedAt: { type: Date, default: Date.now }
  }],
  section: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male','female','other'] },
  guardian: {
    fatherName: { type: String },
    motherName: { type: String },
    contact: { type: String },
    address: { type: String }
  },
  status: { type: String, enum: ['active','alumni','suspended'], default: 'active' },
  profilePhoto: { type: String },
  photoUrl: { type: String },
  photo: { type: String },
  image: { type: String },
  profilePhotoObj: {
    fileUrl: { type: String },
    publicId: { type: String }
  },
  enrollmentDate: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: Object },
}, { timestamps: true });

StudentSchema.index(
  { class: 1, admissionNumber: 1 },
  {
    unique: true,
    // Use a partial index to ignore documents where class or admissionNumber are missing/null.
    partialFilterExpression: { class: { $exists: true, $ne: null }, admissionNumber: { $exists: true, $ne: null } }
  }
);

StudentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (this.admissionNumber && !this.rollNumber) {
    this.rollNumber = this.admissionNumber;
  }
  // keep backward-compatible `name` field
  if (!this.name && this.fullName) this.name = this.fullName;
  next();
});

module.exports = mongoose.model('Student', StudentSchema);
