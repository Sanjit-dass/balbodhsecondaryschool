const mongoose = require('mongoose');

const BrochureSchema = new mongoose.Schema({
  title: { type: String, trim: true },
  academicSession: { type: String, trim: true },
  fileUrl: { type: String, trim: true },
  fileName: { type: String, trim: true },
  publicId: { type: String, trim: true },
  status: { type: String, enum: ['Published','Draft'], default: 'Draft', index: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Brochure', BrochureSchema);
