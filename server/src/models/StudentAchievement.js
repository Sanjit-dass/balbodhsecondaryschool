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

const StudentAchievementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  studentName: { type: String, trim: true },
  studentClass: { type: String, trim: true },
  achievementDate: { type: Date },
  shortDescription: { type: String, trim: true },
  description: { type: String, trim: true },
  category: { type: String, enum: ['Academic', 'Sports', 'Cultural', 'Science', 'Technology', 'Other'], default: 'Academic', trim: true },
  status: { type: String, enum: ['draft','published','hidden'], default: 'published' },
  statistics: { type: [StatisticSchema], default: [] },
  photos: { type: [PhotoSchema], default: [] },
  coverPhoto: { type: mongoose.Schema.Types.ObjectId },
  displayOrder: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

StudentAchievementSchema.pre('save', function(next){
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.StudentAchievement || mongoose.model('StudentAchievement', StudentAchievementSchema);
