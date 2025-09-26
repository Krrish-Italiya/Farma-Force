const mongoose = require('mongoose');

const PerformanceSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, index: true },
    period: { type: String, required: true, enum: ['daily', 'weekly', 'monthly', 'quarterly'], default: 'monthly' },
    year: { type: Number, required: true },
    month: { type: String, required: true },
    sales: { type: Number, required: true, default: 0 },
    calls: { type: Number, required: true, default: 0 },
    coverage: { type: Number, required: true, default: 0 }, // percentage
    frequency: { type: Number, required: true, default: 0 }, // visits per customer
    target: { type: Number, default: 0 },
    achieved: { type: Number, default: 0 }, // percentage of target achieved
    notes: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

// Compound index for efficient queries
PerformanceSchema.index({ company: 1, period: 1, year: 1, month: 1 }, { unique: true });

// Virtual for calculating growth
PerformanceSchema.virtual('growth').get(function() {
  // This would need to be calculated in the application logic
  return 0;
});

module.exports = mongoose.model('Performance', PerformanceSchema);
