const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  registrationNumber: { type: String },
  driverName: { type: String },
  route: { type: String },
  capacity: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vehicle', VehicleSchema);
