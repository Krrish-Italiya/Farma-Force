const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  profileImage: {
    type: String,
    default: null
  },
  location: {
    type: String,
    default: "New York, NY"
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  kpiThresholds: {
    callRateTarget: {
      type: Number,
      default: 90
    },
    customerCoverage: {
      type: Number,
      default: 75
    },
    frequencyOfVisits: {
      type: Number,
      default: 15
    }
  },
  notifications: {
    kpiAlerts: {
      type: Boolean,
      default: false
    },
    emailAlerts: {
      type: Boolean,
      default: true
    },
    aiRecommendation: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);





