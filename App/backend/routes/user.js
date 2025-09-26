const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Update user profile
router.put('/update-profile', auth, async (req, res) => {
  console.log('Received update-profile request:', req.body);
  try {
    const { fullName, email, phone, location } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    user.name = fullName || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.location = location || user.location;

    await user.save();

    console.log('Profile updated successfully for user:', user._id);
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile image
router.put('/update-profile-image', auth, async (req, res) => {
  console.log('Received update-profile-image request:', req.body);
  try {
    const { profileImage } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.profileImage = profileImage;
    await user.save();

    console.log('Profile image updated successfully for user:', user._id);
    res.json({
      message: 'Profile image updated successfully',
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error('Error updating profile image:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update KPI thresholds
router.put('/update-kpi-thresholds', auth, async (req, res) => {
  console.log('Received update-kpi-thresholds request:', req.body);
  try {
    const { callRateTarget, customerCoverage, frequencyOfVisits } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update KPI thresholds
    if (callRateTarget !== undefined) user.kpiThresholds.callRateTarget = callRateTarget;
    if (customerCoverage !== undefined) user.kpiThresholds.customerCoverage = customerCoverage;
    if (frequencyOfVisits !== undefined) user.kpiThresholds.frequencyOfVisits = frequencyOfVisits;

    await user.save();

    console.log('KPI thresholds updated successfully for user:', user._id);
    res.json({
      message: 'KPI thresholds updated successfully',
      kpiThresholds: user.kpiThresholds
    });
  } catch (error) {
    console.error('Error updating KPI thresholds:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update notification settings
router.put('/update-notifications', auth, async (req, res) => {
  console.log('Received update-notifications request:', req.body);
  try {
    const { kpiAlerts, emailAlerts, aiRecommendation } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update notification settings
    if (kpiAlerts !== undefined) user.notifications.kpiAlerts = kpiAlerts;
    if (emailAlerts !== undefined) user.notifications.emailAlerts = emailAlerts;
    if (aiRecommendation !== undefined) user.notifications.aiRecommendation = aiRecommendation;

    await user.save();

    console.log('Notification settings updated successfully for user:', user._id);
    res.json({
      message: 'Notification settings updated successfully',
      notifications: user.notifications
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  console.log('Received profile request for user:', req.user.id);
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Profile data fetched:', {
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      kpiThresholds: user.kpiThresholds,
      notifications: user.notifications
    });
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user account
router.delete('/delete-account', auth, async (req, res) => {
  console.log('Received delete-account request for user:', req.user.id);
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the user and all associated data
    await User.findByIdAndDelete(req.user.id);
    
    // Also delete any OTP records associated with this user
    const OTP = require('../models/OTP');
    await OTP.deleteMany({ email: user.email });

    console.log('User account deleted successfully:', req.user.id);
    res.json({ 
      success: true,
      message: 'Account deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
