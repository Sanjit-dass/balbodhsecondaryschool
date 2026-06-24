const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true },
  caption: { type: String, trim: true },
  publicId: { type: String, trim: true }
}, { _id: true });

const ScheduleItem = new mongoose.Schema({
  time: { type: String, trim: true },
  activity: { type: String, trim: true }
}, { _id: true });

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  eventDate: { type: Date, required: true },
  shortDescription: { type: String, trim: true },
  fullDescription: { type: String, trim: true },
  category: { type: String, trim: true, default: 'General' },
  location: { type: String, trim: true },
  status: { type: String, enum: ['draft','published','hidden'], default: 'draft' },
  coverPhoto: { type: PhotoSchema, default: null },
  photos: { type: [PhotoSchema], default: [] },
  schedule: { type: [ScheduleItem], default: [] },
  additionalInfo: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

EventSchema.pre('save', function(next){
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.Event || mongoose.model('Event', EventSchema);
