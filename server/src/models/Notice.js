const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  body: { type: String, trim: true },
  category: { type: String, enum: ['Admissions','Holidays','Events','Academics','General','Academic','Exam','Holiday','Event','Emergency','Fee'], default: 'General' },
  audience: { type: String, enum: ['all','public','students','teachers','parents','specificClass'], default: 'all' },
  // attachments stored as objects with fileUrl and publicId
  attachments: [{ fileUrl: { type: String }, publicId: { type: String } }],
  publishedAt: { type: Date },
  expiryDate: { type: Date },
  priority: { type: String, enum: ['Low','Medium','High','Urgent'], default: 'Medium' },
  targetClassId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  targetClassName: { type: String },
  status: { type: String, enum: ['draft','published','archived'], default: 'draft' },
  pinned: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: Object },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

NoticeSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Notice', NoticeSchema);
