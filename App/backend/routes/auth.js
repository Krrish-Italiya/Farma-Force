const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendOTPEmail } = require('../services/emailService');

const router = express.Router();

// Generate 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { employeeId, email, phone, name, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Check if employee ID already exists
    const existingEmployee = await User.findOne({ employeeId });
    if (existingEmployee) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee ID already exists' 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    console.log(`Generated initial OTP: ${otp} for email: ${email}`);

    // Save OTP to database
    const otpRecord = await OTP.create({
      email,
      otp,
      expiresAt
    });
    console.log(`Saved initial OTP record with ID: ${otpRecord._id}`);

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send OTP email' 
      });
    }
    console.log(`Initial OTP sent successfully to ${email}: ${otp}`);

    // Hash password and create user (but don't save yet)
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Password hashed successfully, length:', hashedPassword.length);
    
    // Store user data temporarily for verification
    // In production, use Redis or session storage
    const tempUserData = {
      employeeId,
      email,
      phone,
      name,
      hashedPassword
    };
    
    console.log('Sending userData to frontend:', {
      ...tempUserData,
      hashedPassword: tempUserData.hashedPassword ? '***' : 'undefined'
    });

    const responseData = {
      success: true,
      message: 'OTP sent successfully',
      email: email,
      userData: tempUserData // Send user data to frontend
    };
    
    console.log('Sending response to frontend:', {
      ...responseData,
      userData: {
        ...responseData.userData,
        hashedPassword: responseData.userData.hashedPassword ? '***' : 'undefined'
      }
    });
    
    res.status(200).json(responseData);

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

  // Verify OTP route
  router.post('/verify-otp', async (req, res) => {
    try {
      const { email, otp, userData } = req.body;
      console.log(`Verifying OTP: ${otp} for email: ${email}`);
      console.log('Received userData:', userData);

      // Find the OTP in database
      const otpRecord = await OTP.findOne({
        email,
        otp,
        isUsed: false,
        expiresAt: { $gt: new Date() }
      });

      if (!otpRecord) {
        console.log(`OTP verification failed: Invalid OTP ${otp} for email: ${email}`);
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP'
        });
      }
      console.log(`OTP verification successful: OTP ${otp} found in database for email: ${email}`);

      // Mark OTP as used
      otpRecord.isUsed = true;
      await otpRecord.save();

      // Create user with hashed password
      console.log('Full userData received:', userData);
      
      // Check if userData has the expected structure
      if (!userData || typeof userData !== 'object') {
        console.error('userData is not an object:', userData);
        return res.status(400).json({
          success: false,
          message: 'Invalid user data format. Please sign up again.'
        });
      }
      
      const { employeeId, phone, name, hashedPassword } = userData;
      console.log('Creating user with data:', { employeeId, email, phone, name, hashedPassword: hashedPassword ? '***' : 'undefined' });
      console.log('userData keys:', Object.keys(userData));
      console.log('userData values:', Object.values(userData));
      
      if (!hashedPassword) {
        console.error('hashedPassword is missing! userData:', userData);
        return res.status(400).json({
          success: false,
          message: 'User data is incomplete. Please sign up again.'
        });
      }
      
      const user = await User.create({
        employeeId,
        email,
        phone,
        name,
        password: hashedPassword,
        isVerified: true
      });

      res.status(201).json({
        success: true,
        message: 'Account Created Successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name
        }
      });

    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email first'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        employeeId: user.employeeId,
        phone: user.phone,
        location: user.location,
        profileImage: user.profileImage
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Resend OTP route
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`Resending OTP for email: ${email}`);

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'User already verified'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    console.log(`Generated new OTP: ${otp} for email: ${email}`);

    // Delete old OTPs for this email
    const deletedCount = await OTP.deleteMany({ email });
    console.log(`Deleted ${deletedCount.deletedCount} old OTPs for email: ${email}`);

    // Save new OTP
    const newOtpRecord = await OTP.create({
      email,
      otp,
      expiresAt
    });
    console.log(`Saved new OTP record with ID: ${newOtpRecord._id}`);

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email'
      });
    }

    console.log(`New OTP sent successfully to ${email}: ${otp}`);
    res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
      otp: otp // Temporarily include OTP in response for testing
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
