const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
  publicId: { type: String },
  url: { type: String, required: true },
  filename: { type: String, required: true },
  bytes: { type: Number }
}, { _id: false });

const DraftSchema = new mongoose.Schema({
  to: { type: String, required: true },
  cc: { type: [String], default: [] },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  attachments: { type: [AttachmentSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

DraftSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Draft', DraftSchema);







