const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  schoolName: { type: String },
  schoolAddress: { type: String },
  logoUrl: { type: String },
  logo: { fileUrl: { type: String }, publicId: { type: String } },
  admitCardHeader: { type: String },
  admitCardWatermark: { type: String },
  // Principal / Founder's message content (public)
  principalName: { type: String },
  principalDesignation: { type: String },
  principalImage: { type: String },
  principalMessageEnglish: { type: String },
  principalMessageNepali: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Setting', SettingSchema);
