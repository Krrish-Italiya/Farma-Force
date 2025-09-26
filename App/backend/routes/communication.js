const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const emailService = require('../services/emailService');
const EmailHistory = require('../models/EmailHistory');
const auth = require('../middleware/auth');
const testEmailService = require('../services/testEmailService');
const Draft = require('../models/Draft');
const { uploadFile, deleteFile } = require('../services/cloudinaryService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/attachments';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: function (req, file, cb) {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, documents, and archives are allowed!'));
    }
  }
});

// Send email endpoint (auth optional). If token is provided it will be used to attribute history; otherwise email still sends.
router.post('/send-email', (req, res, next) => {
  upload.array('attachments', 5)(req, res, function(err) {
    if (err) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({
        success: false,
        message: err.message || 'File upload error'
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { to, subject, cc, message } = req.body;
    const uploadedFiles = req.files || [];

    // Accept existing cloud attachments metadata as JSON
    let existingAttachments = [];
    if (req.body.existingAttachments) {
      try {
        const parsed = JSON.parse(req.body.existingAttachments);
        if (Array.isArray(parsed)) {
          existingAttachments = parsed
            .map(a => ({ filename: a.filename, path: a.url }))
            .filter(a => a.filename && a.path);
        }
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid existingAttachments payload' });
      }
    }

    // Validation
    if (!to || !to.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email (To) is required'
      });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Subject is required'
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipient email format'
      });
    }

    // Validate CC email(s) if provided (supports comma-separated list)
    let ccList = [];
    if (cc && cc.trim()) {
      ccList = cc
        .split(',')
        .map(e => e.trim())
        .filter(Boolean);

      const invalidCc = ccList.find(e => !emailRegex.test(e));
      if (invalidCc) {
        return res.status(400).json({
          success: false,
          message: `Invalid CC email format: ${invalidCc}`
        });
      }
    }

    // Prepare email data
    const emailData = {
      to: to.trim(),
      cc: ccList.length > 0 ? ccList : undefined,
      subject: subject.trim(),
      message: message.trim(),
      attachments: [
        ...uploadedFiles.map(file => ({ filename: file.originalname, path: file.path })),
        ...existingAttachments
      ]
    };

    // Send email using real email service
    const result = await emailService.sendEmail(emailData);

    // Persist to history (if user available via optional auth header)
    try {
      // Try to decode token if provided to capture userId
      if (!req.user) {
        const jwt = require('jsonwebtoken');
        const header = req.header('x-auth-token') || req.header('Authorization');
        if (header) {
          const token = header.replace('Bearer ', '');
          try { const decoded = jwt.verify(token, process.env.JWT_SECRET); req.user = { id: decoded.userId, email: decoded.email }; } catch (_) {}
        }
      }
      const userId = req.user?.id || null;
      await EmailHistory.create({
        userId,
        userEmail: req.user?.email || undefined,
        to: emailData.to,
        cc: emailData.cc || [],
        subject: emailData.subject,
        message: emailData.message,
        attachments: emailData.attachments || [],
        messageId: result?.messageId
      });
    } catch (e) { console.error('Failed to save email history:', e); }

    // If this send was based on a draft id, delete the draft
    if (req.body.draftId) {
      try { await Draft.deleteOne({ _id: req.body.draftId }); } catch (_) {}
    }

    // Clean up uploaded files after sending
    uploadedFiles.forEach(file => {
      try {
        fs.unlinkSync(file.path);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    });

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: {
        messageId: result.messageId,
        recipients: {
          to: emailData.to,
          cc: Array.isArray(emailData.cc) ? emailData.cc.join(', ') : emailData.cc
        }
      }
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    // Clean up files on error
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

// History endpoint
router.get('/history', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const userId = req.user.id;
    const userEmail = req.user.email;

    const filter = { $or: [{ userId }, { userEmail }] };
    const [items, total] = await Promise.all([
      EmailHistory.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      EmailHistory.countDocuments(filter)
    ]);

    res.json({ success: true, data: items, page, total });
  } catch (e) {
    console.error('GET /api/communication/history error:', e);
    res.status(500).json({ success: false, message: 'Failed to load history' });
  }
});

// Save draft: uploads attachments to Cloudinary and stores draft in DB
router.post('/drafts', upload.array('attachments', 5), async (req, res) => {
  try {
    const { to, subject, cc, message } = req.body;
    if (!to || !to.trim() || !subject || !subject.trim() || !message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'To, subject and message are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid recipient email format' });
    }

    let ccList = [];
    if (cc && cc.trim()) {
      ccList = cc.split(',').map(e => e.trim()).filter(Boolean);
      const invalidCc = ccList.find(e => !emailRegex.test(e));
      if (invalidCc) {
        return res.status(400).json({ success: false, message: `Invalid CC email format: ${invalidCc}` });
      }
    }

    const localFiles = req.files || [];
    const uploaded = [];
    for (const file of localFiles) {
      try {
        const info = await uploadFile(file.path, process.env.FOLDER_NAME);
        uploaded.push(info);
      } finally {
        try { fs.unlinkSync(file.path); } catch (_) {}
      }
    }

    const draft = await Draft.create({
      to: to.trim(),
      cc: ccList,
      subject: subject.trim(),
      message: message.trim(),
      attachments: uploaded
    });

    res.status(201).json({ success: true, data: draft });
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ success: false, message: 'Failed to save draft', error: error.message });
  }
});

// List drafts
router.get('/drafts', async (req, res) => {
  try {
    const drafts = await Draft.find({}).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, data: drafts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load drafts' });
  }
});

// Delete draft
router.delete('/drafts/:id', async (req, res) => {
  try {
    const draft = await Draft.findById(req.params.id);
    if (!draft) return res.status(404).json({ success: false, message: 'Draft not found' });

    // best-effort delete attachments from Cloudinary
    for (const att of draft.attachments || []) {
      try { await deleteFile(att.publicId); } catch (_) {}
    }

    await Draft.deleteOne({ _id: draft._id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete draft' });
  }
});

// Get email templates (optional)
router.get('/templates', (req, res) => {
  const templates = [
    {
      id: 'welcome',
      name: 'Welcome Message',
      subject: 'Welcome to FarmaForce',
      content: 'Welcome to our pharmaceutical platform!'
    },
    {
      id: 'meeting',
      name: 'Meeting Invitation',
      subject: 'Meeting Invitation',
      content: 'You are invited to a meeting.'
    }
  ];

  res.json({
    success: true,
    data: templates
  });
});

module.exports = router;
