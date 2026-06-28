const mongoose = require('mongoose');

const StatisticSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true }
}, { _id: false });

const PhotoSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true },
  caption: { type: String, trim: true },
  publicId: { type: String, trim: true }
}, { _id: true });

const AcademicExcellenceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  studentName: { type: String, trim: true },
  studentClass: { type: String, trim: true },
  rollNumber: { type: String, trim: true },
  shortDescription: { type: String, trim: true },
  description: { type: String, trim: true },
  category: { type: String, enum: ['Academic', 'Sports', 'Cultural', 'Science', 'Technology', 'Other'], default: 'Academic', trim: true },
  academicYear: { type: String, trim: true },
  percentage: { type: String, trim: true },
  gpa: { type: String, trim: true },
  marks: { type: String, trim: true },
  position: { type: String, trim: true },
  rank: { type: String, trim: true },
  status: { type: String, enum: ['draft','published','hidden'], default: 'published' },
  featured: { type: Boolean, default: false },
  statistics: { type: [StatisticSchema], default: [] },
  photos: { type: [PhotoSchema], default: [] },
  coverPhoto: { type: mongoose.Schema.Types.ObjectId },
  certificatePhoto: { type: PhotoSchema },
  displayOrder: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

AcademicExcellenceSchema.pre('save', function(next){
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.AcademicExcellence || mongoose.model('AcademicExcellence', AcademicExcellenceSchema);
