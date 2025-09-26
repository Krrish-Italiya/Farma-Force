const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true, index: true },
    label: { type: String, required: true },
    category: { type: String, enum: ['Parking', 'Lunch', 'Pharmacy', 'Entrance', 'Waiting Area', 'Other'], default: 'Other' },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Location', LocationSchema);





