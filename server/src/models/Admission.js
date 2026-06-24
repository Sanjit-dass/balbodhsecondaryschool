const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const AdmissionSchema = new mongoose.Schema({
  applicationId: { type: String, index: true, unique: true, default: () => `ADM-${uuidv4().slice(0,8).toUpperCase()}` },
  studentName: { type: String, required: true, trim: true },
  parentName: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  applyingClass: { type: String, trim: true },
  address: { type: String },
  status: { type: String, enum: ['Pending','Under Review','Approved','Rejected'], default: 'Pending', index: true },
  submissionDate: { type: Date, default: Date.now },
  rejectionReason: { type: String },
  metadata: { type: Object }
}, { timestamps: true });

AdmissionSchema.index({ applicationId: 1, email: 1, phone: 1 });

module.exports = mongoose.model('Admission', AdmissionSchema);
