const mongoose = require('mongoose');

const LibrarySchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String },
  isbn: { type: String },
  copies: { type: Number, default: 1 },
  issuedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  finePerDay: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Library', LibrarySchema);
