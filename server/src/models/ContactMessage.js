const mongoose = require('mongoose');

const ContactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  subject: {
    type: String,
    required: true,
    enum: ['admission', 'fees', 'academics', 'facilities', 'other'],
    default: 'other'
  },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['new', 'read', 'archived'], default: 'new' },
  readAt: { type: Date },
  ipAddress: { type: String },
  userAgent: { type: String },
  metadata: { type: Object },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ContactMessageSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);
