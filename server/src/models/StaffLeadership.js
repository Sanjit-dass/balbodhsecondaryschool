const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String },
  caption: { type: String }
}, { _id: false });

const StaffLeadershipSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  designation: { type: String, trim: true },
  department: { type: String, trim: true },
  roleCategory: { type: String, trim: true },
  shortBio: { type: String },
  photo: PhotoSchema,
  status: { type: String, enum: ['active','inactive','draft'], default: 'active' },
  displayOrder: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('StaffLeadership', StaffLeadershipSchema);
