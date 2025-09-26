const mongoose = require('mongoose');

const SalesPointSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true },
    sales: { type: Number, required: true },
  },
  { _id: false }
);

const SalesTrendSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, index: true },
    metric: { type: String, required: true, index: true },
    unit: { type: String, required: true },
    data: { type: [SalesPointSchema], default: [] },
  },
  { timestamps: true }
);

SalesTrendSchema.index({ company: 1, metric: 1 }, { unique: true });

module.exports = mongoose.model('SalesTrend', SalesTrendSchema);


