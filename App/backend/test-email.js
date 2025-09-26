// Test script to verify email functionality
require('dotenv').config({ path: './config.env' });
const emailService = require('./services/emailService');

async function testEmail() {
  try {
    console.log('Testing email service...');
    
    const testData = {
      to: 'shreyp693@gmail.com', // Replace with your test email
      subject: 'Test Email from FarmaForce',
      message: 'This is a test email to verify the email service is working correctly.',
      attachments: []
    };

    const result = await emailService.sendEmail(testData);
    console.log('Email sent successfully:', result.messageId);
  } catch (error) {
    console.error('Error testing email:', error);
  }
}

testEmail();
