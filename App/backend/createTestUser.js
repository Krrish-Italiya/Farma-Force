const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config({ path: './config.env' });

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'shreyp693@gmail.com' });
    if (existingUser) {
      console.log('Test user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create test user
    const testUser = new User({
      employeeId: 'TEST001',
      email: 'shreyp693@gmail.com',
      phone: '+1234567890',
      name: 'Shrey Patel',
      password: hashedPassword,
      isVerified: true
    });

    await testUser.save();
    console.log('Test user created successfully');
    console.log('Email: shreyp693@gmail.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestUser();















