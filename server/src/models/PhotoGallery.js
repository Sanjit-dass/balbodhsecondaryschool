const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  category: { type: String, default: 'Other' },
  // optional class association for class-specific galleries/photos
  className: { type: String, default: '' },
  url: { type: String, required: true },
  caption: { type: String },
  publicId: { type: String },
}, { timestamps: true });

const PhotoGallerySchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  category: { type: String, default: 'other' },
  // optional gallery-level class association (useful for class galleries)
  className: { type: String, default: '' },
  photos: [PhotoSchema],
  coverPhoto: { type: mongoose.Schema.Types.ObjectId },
  status: { type: String, default: 'published' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('PhotoGallery', PhotoGallerySchema);
