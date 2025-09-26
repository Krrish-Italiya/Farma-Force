const nodemailer = require('nodemailer');
const fs = require('fs');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: 'FarmaForce - Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #491C7C; margin: 0;">FarmaForce</h1>
            <p style="color: #666; margin: 10px 0;">Email Verification</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 10px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
            <p style="color: #666; margin-bottom: 30px;">
              We sent a verification code to verify your email address.<br>
              Enter the 4-digit code in the field below.
            </p>
            
            <div style="background-color: #491C7C; color: white; padding: 20px; border-radius: 8px; display: inline-block; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
              ${otp}
            </div>
            
            <p style="color: #666; margin-top: 30px; font-size: 14px;">
              This code will expire in 5 minutes.<br>
              If you didn't request this code, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
            <p>© 2024 FarmaForce. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email: ', error);
    return false;
  }
};

// Send email with attachments
const sendEmail = async (emailData) => {
  try {
    const { to, cc, subject, message, attachments = [] } = emailData;

    // Prepare mail options
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: to,
      // nodemailer accepts string, array or comma-separated list; pass through as-is if provided
      cc: cc && (Array.isArray(cc) ? cc : cc.toString()) || undefined,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #491C7C; margin: 0;">FarmaForce</h1>
            <p style="color: #666; margin: 10px 0;">Communication</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">${subject}</h2>
            <div style="color: #666; line-height: 1.6; white-space: pre-wrap;">${message}</div>
          </div>
          
          ${attachments.length > 0 ? `
            <div style="margin-top: 20px; padding: 15px; background-color: #e8f4f8; border-radius: 8px;">
              <h3 style="color: #333; margin-bottom: 10px;">Attachments:</h3>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                ${attachments.map(att => `<li>${att.filename}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
            <p>© 2024 FarmaForce. All rights reserved.</p>
          </div>
        </div>
      `,
      attachments: attachments.map(attachment => ({
        filename: attachment.filename,
        path: attachment.path
      }))
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully: ', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};

module.exports = {
  sendOTPEmail,
  sendEmail
};
