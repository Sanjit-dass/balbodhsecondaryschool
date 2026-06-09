const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, trim: true },
  body: { type: String, trim: true },
  audience: { type: String, enum: ['all','students','teachers','parents','specificClass'], default: 'all' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
  priority: { type: String, enum: ['Low','Medium','High','Urgent'], default: 'Medium' },
  status: { type: String, enum: ['draft','sent'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

NotificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (!this.message && this.body) {
    this.message = this.body;
  }
  if (!this.body && this.message) {
    this.body = this.message;
  }
  next();
});

module.exports = mongoose.model('Notification', NotificationSchema);
