const express = require('express');
const router = express.Router();
const SalesTrend = require('../models/SalesTrend');
const Performance = require('../models/Performance');

// Upsert sales trend data
router.post('/sales', async (req, res) => {
  try {
    const { company, metric, unit, data } = req.body;
    if (!company || !metric || !unit || !Array.isArray(data)) {
      return res.status(400).json({ message: 'company, metric, unit, and data[] are required' });
    }

    const sanitized = data
      .filter((d) => d && typeof d.year === 'number' && typeof d.sales === 'number')
      .sort((a, b) => a.year - b.year);

    const doc = await SalesTrend.findOneAndUpdate(
      { company, metric },
      { company, metric, unit, data: sanitized },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, trend: doc });
  } catch (err) {
    console.error('POST /api/trends/sales error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sales trend
router.get('/sales', async (req, res) => {
  try {
    const { company = 'FarmaForce', metric = 'annual_sales' } = req.query;
    const doc = await SalesTrend.findOne({ company, metric });
    if (!doc) return res.status(404).json({ message: 'No data found' });
    res.json(doc);
  } catch (err) {
    console.error('GET /api/trends/sales error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get performance data for charts
router.get('/performance', async (req, res) => {
  try {
    const { company = 'FarmaForce', period = 'monthly', metric = 'sales' } = req.query;

    // normalize metric to one of: sales | calls | coverage | frequency
    const normalizedMetric = String(metric).toLowerCase();
    const metricKey = ['sales', 'calls', 'coverage', 'frequency'].includes(normalizedMetric)
      ? normalizedMetric
      : 'sales';
    
    // If period is monthly, return fiscal year data structure
    if (period === 'monthly' && metricKey === 'sales') {
      const fiscalYearData = {
        "fiscal_year": 2022,
        "monthly_sales_aud": {
          "Jul-2021": 290000,
          "Aug-2021": 350000,
          "Sep-2021": 450000,
          "Oct-2021": 1000000,
          "Nov-2021": 1300000,
          "Dec-2021": 1200000,
          "Jan-2022": 1000000,
          "Feb-2022": 1100000,
          "Mar-2022": 1050000,
          "Apr-2022": 950000,
          "May-2022": 970000,
          "Jun-2022": 1010000
        },
        "total_revenue_aud": 11600000,
        "note": "Estimated with seasonal weighting, not flat split"
      };

      // Transform the data for frontend charts
      const transformedData = Object.entries(fiscalYearData.monthly_sales_aud).map(([month, value]) => ({
        month: month,
        value: value,
        calls: Math.floor(Math.random() * 200) + 150, // Random data for other metrics
        coverage: Math.floor(Math.random() * 20) + 80,
        frequency: Math.floor(Math.random() * 2) + 3,
        target: value * 1.1, // Target is 10% higher
        achieved: Math.floor((value / (value * 1.1)) * 100)
      }));

      return res.json({
        success: true,
        data: transformedData,
        fiscalYearData: fiscalYearData,
        summary: {
          latestAmount: transformedData[transformedData.length - 1].value,
          growth: 0,
          growthType: 'neutral',
          period: period,
          company: company,
          totalCalls: transformedData.reduce((sum, item) => sum + item.calls, 0),
          avgCoverage: (transformedData.reduce((sum, item) => sum + item.coverage, 0) / transformedData.length).toFixed(1),
          avgFrequency: (transformedData.reduce((sum, item) => sum + item.frequency, 0) / transformedData.length).toFixed(1)
        }
      });
    }
    
    // Try to get data from database first for other periods
    let performanceData = await Performance.find({ 
      company, 
      period: period === 'monthly' ? 'monthly' : 'monthly' // Default to monthly for now
    }).sort({ year: 1, month: 1 }).limit(12);

    // If no data in database, create sample data and save it
    if (performanceData.length === 0) {
      const sampleData = [
        { month: "Jan", year: 2024, sales: 20000, calls: 150, coverage: 85, frequency: 3.2, target: 22000, achieved: 91 },
        { month: "Feb", year: 2024, sales: 18000, calls: 140, coverage: 82, frequency: 3.0, target: 20000, achieved: 90 },
        { month: "Mar", year: 2024, sales: 22000, calls: 165, coverage: 88, frequency: 3.5, target: 21000, achieved: 105 },
        { month: "Apr", year: 2024, sales: 21000, calls: 160, coverage: 86, frequency: 3.3, target: 21500, achieved: 98 },
        { month: "May", year: 2024, sales: 23000, calls: 175, coverage: 90, frequency: 3.7, target: 22500, achieved: 102 },
        { month: "Jun", year: 2024, sales: 24000, calls: 180, coverage: 92, frequency: 3.8, target: 23000, achieved: 104 },
        { month: "Jul", year: 2024, sales: 23500, calls: 178, coverage: 91, frequency: 3.6, target: 23500, achieved: 100 },
        { month: "Aug", year: 2024, sales: 25000, calls: 185, coverage: 93, frequency: 3.9, target: 24000, achieved: 104 },
        { month: "Sep", year: 2024, sales: 24500, calls: 182, coverage: 92, frequency: 3.7, target: 24500, achieved: 100 },
        { month: "Oct", year: 2024, sales: 26000, calls: 190, coverage: 94, frequency: 4.0, target: 25000, achieved: 104 },
        { month: "Nov", year: 2024, sales: 25500, calls: 188, coverage: 93, frequency: 3.8, target: 25500, achieved: 100 },
        { month: "Dec", year: 2024, sales: 27000, calls: 195, coverage: 95, frequency: 4.1, target: 26000, achieved: 104 }
      ];

      // Save sample data to database
      const performanceDocs = sampleData.map(data => ({
        company,
        period: 'monthly',
        year: data.year,
        month: data.month,
        sales: data.sales,
        calls: data.calls,
        coverage: data.coverage,
        frequency: data.frequency,
        target: data.target,
        achieved: data.achieved
      }));

      await Performance.insertMany(performanceDocs);
      performanceData = await Performance.find({ company, period: 'monthly' }).sort({ year: 1, month: 1 });
    }

    // Transform data for frontend
    const transformedData = performanceData.map(item => {
      let value;
      switch (metricKey) {
        case 'calls':
          value = item.calls; break;
        case 'coverage':
          value = item.coverage; break;
        case 'frequency':
          value = item.frequency; break;
        case 'sales':
        default:
          value = item.sales; break;
      }
      return {
        month: item.month,
        value,
        calls: item.calls,
        coverage: item.coverage,
        frequency: item.frequency,
        target: item.target,
        achieved: item.achieved
      };
    });

    // Calculate summary metrics
    const latest = transformedData[transformedData.length - 1];
    const previous = transformedData[transformedData.length - 2];
    const growth = previous ? ((latest.value - previous.value) / (previous.value || 1) * 100).toFixed(1) : 0;
    const growthType = growth >= 0 ? 'positive' : 'negative';

    res.json({
      success: true,
      data: transformedData,
      summary: {
        latestAmount: latest.value,
        growth: Math.abs(growth),
        growthType,
        period: period,
        company: company,
        totalCalls: transformedData.reduce((sum, item) => sum + item.calls, 0),
        avgCoverage: (transformedData.reduce((sum, item) => sum + item.coverage, 0) / transformedData.length).toFixed(1),
        avgFrequency: (transformedData.reduce((sum, item) => sum + item.frequency, 0) / transformedData.length).toFixed(1)
      }
    });
  } catch (err) {
    console.error('GET /api/trends/performance error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get product sale categories
router.get('/product-categories', async (req, res) => {
  try {
    const { company = 'FarmaForce' } = req.query;
    
    const productCategories = {
      company: company,
      fiscal_year: 2022,
      categories: [
        {
          name: "Cardiovascular",
          sales_aud: 2900000,
          percentage: 25,
          growth: 12.5,
          target: 3000000,
          achieved: 96.7
        },
        {
          name: "Oncology",
          sales_aud: 2320000,
          percentage: 20,
          growth: 8.2,
          target: 2400000,
          achieved: 96.7
        },
        {
          name: "Central Nervous System",
          sales_aud: 1740000,
          percentage: 15,
          growth: 15.3,
          target: 1800000,
          achieved: 96.7
        },
        {
          name: "Respiratory",
          sales_aud: 1450000,
          percentage: 12.5,
          growth: 6.8,
          target: 1500000,
          achieved: 96.7
        },
        {
          name: "Gastrointestinal",
          sales_aud: 1160000,
          percentage: 10,
          growth: 11.2,
          target: 1200000,
          achieved: 96.7
        },
        {
          name: "Other",
          sales_aud: 2030000,
          percentage: 17.5,
          growth: 9.1,
          target: 2100000,
          achieved: 96.7
        }
      ],
      total_sales: 11600000,
      note: "Product category breakdown for fiscal year 2022"
    };

    res.json({
      success: true,
      data: productCategories
    });
  } catch (err) {
    console.error('GET /api/trends/product-categories error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new performance data
router.post('/performance', async (req, res) => {
  try {
    const { company, period, year, month, sales, calls, coverage, frequency, target, achieved, notes } = req.body;
    
    if (!company || !period || !year || !month || typeof sales !== 'number') {
      return res.status(400).json({ message: 'company, period, year, month, and sales are required' });
    }

    const performanceData = {
      company,
      period,
      year,
      month,
      sales,
      calls: calls || 0,
      coverage: coverage || 0,
      frequency: frequency || 0,
      target: target || 0,
      achieved: achieved || 0,
      notes: notes || ''
    };

    const doc = await Performance.findOneAndUpdate(
      { company, period, year, month },
      performanceData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, performance: doc });
  } catch (err) {
    console.error('POST /api/trends/performance error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


