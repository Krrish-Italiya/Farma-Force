const mongoose = require('mongoose');

const EmailHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    userEmail: { type: String, index: true },
    to: { type: String, required: true },
    cc: [{ type: String }],
    subject: { type: String, required: true },
    message: { type: String, required: true },
    attachments: [{ filename: String, path: String }],
    messageId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailHistory', EmailHistorySchema);


