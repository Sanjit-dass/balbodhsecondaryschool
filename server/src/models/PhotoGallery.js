const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  category: { type: String, default: 'Other' },
  url: { type: String, required: true },
  caption: { type: String },
  publicId: { type: String },
}, { timestamps: true });

const PhotoGallerySchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  category: { type: String, default: 'other' },
  photos: [PhotoSchema],
  coverPhoto: { type: mongoose.Schema.Types.ObjectId },
  status: { type: String, default: 'published' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('PhotoGallery', PhotoGallerySchema);
