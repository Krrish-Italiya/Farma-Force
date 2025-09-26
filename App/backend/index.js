require('dotenv').config({ path: './config.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const uploadRoutes = require('./routes/upload');
const trendRoutes = require('./routes/trends');
const alertRoutes = require('./routes/alerts');
const communicationRoutes = require('./routes/communication');
const scheduleRoutes = require('./routes/schedule');
const navigationRoutes = require('./routes/navigation');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/trends', trendRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/reports', reportsRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('FarmaForce API is running');
});

// Global error handler to ensure JSON responses
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
