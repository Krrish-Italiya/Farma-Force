require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const Performance = require('./models/Performance');

// MongoDB connection
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const samplePerformanceData = [
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

async function createPerformanceData() {
  try {
    // Clear existing data for FarmaForce
    await Performance.deleteMany({ company: 'FarmaForce' });
    console.log('Cleared existing performance data for FarmaForce');

    // Create performance documents
    const performanceDocs = samplePerformanceData.map(data => ({
      company: 'FarmaForce',
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

    const result = await Performance.insertMany(performanceDocs);
    console.log(`Successfully created ${result.length} performance records`);

    // Verify the data
    const count = await Performance.countDocuments({ company: 'FarmaForce' });
    console.log(`Total performance records in database: ${count}`);

    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error creating performance data:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

createPerformanceData();
