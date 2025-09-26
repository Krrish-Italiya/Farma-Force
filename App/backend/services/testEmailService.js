// Test email service that simulates sending emails without actual SMTP
const fs = require('fs');
const path = require('path');

// Create a logs directory if it doesn't exist
const logsDir = 'email-logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Simulate sending email with attachments
const sendEmail = async (emailData) => {
  try {
    const { to, cc, subject, message, attachments = [] } = emailData;
    
    // Create email log entry
    const emailLog = {
      timestamp: new Date().toISOString(),
      messageId: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      to: to,
      cc: cc || null,
      subject: subject,
      message: message,
      attachments: attachments.map(att => ({
        filename: att.filename,
        size: fs.existsSync(att.path) ? fs.statSync(att.path).size : 0
      })),
      status: 'sent'
    };

    // Save email log to file
    const logFile = path.join(logsDir, `email-${Date.now()}.json`);
    fs.writeFileSync(logFile, JSON.stringify(emailLog, null, 2));

    // Log to console
    console.log('📧 Email sent successfully (simulated):');
    console.log(`   To: ${to}`);
    console.log(`   CC: ${cc || 'None'}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Attachments: ${attachments.length} files`);
    console.log(`   Message ID: ${emailLog.messageId}`);
    console.log(`   Log saved to: ${logFile}`);

    // Simulate email content preview
    console.log('\n📄 Email Content Preview:');
    console.log('─'.repeat(50));
    console.log(`From: FarmaForce <noreply@farmaforce.com>`);
    console.log(`To: ${to}`);
    if (cc) console.log(`CC: ${cc}`);
    console.log(`Subject: ${subject}`);
    console.log('─'.repeat(50));
    console.log(message);
    if (attachments.length > 0) {
      console.log('\n📎 Attachments:');
      attachments.forEach(att => {
        console.log(`   • ${att.filename}`);
      });
    }
    console.log('─'.repeat(50));

    return {
      messageId: emailLog.messageId,
      accepted: [to],
      response: 'Email sent successfully (simulated)'
    };

  } catch (error) {
    console.error('Error in test email service:', error);
    throw error;
  }
};

module.exports = {
  sendEmail
};



