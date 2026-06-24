const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true },
  caption: { type: String, trim: true },
  publicId: { type: String, trim: true }
}, { _id: true });

const FacilitySchema = new mongoose.Schema({
  facilityName: { type: String, required: true, trim: true },
  shortDescription: { type: String, required: true, trim: true },
  fullDescription: { type: String, trim: true },
  category: { 
    type: String, 
    enum: ['Academic', 'Technology', 'Science', 'Sports', 'Hostel', 'Library', 'Transportation', 'Medical', 'Infrastructure', 'Other'],
    default: 'Infrastructure',
    trim: true 
  },
  status: { type: String, enum: ['draft', 'published', 'hidden'], default: 'published' },
  featured: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },
  photos: { type: [PhotoSchema], default: [] },
  coverPhoto: { type: mongoose.Schema.Types.ObjectId },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

FacilitySchema.pre('save', function(next){
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.Facility || mongoose.model('Facility', FacilitySchema);
