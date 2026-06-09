const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  type: { type: String, trim: true, default: 'other' },
  folder: { type: String, trim: true },
  fileUrl: { type: String, required: true, trim: true },
  publicId: { type: String, trim: true },
  originalName: { type: String, trim: true },
  mimetype: { type: String, trim: true },
  size: { type: Number },
  audience: { type: String, enum: ['public', 'private', 'all'], default: 'public' },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

DocumentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Document', DocumentSchema);
