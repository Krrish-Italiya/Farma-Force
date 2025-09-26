const express = require('express');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const os = require('os');
const auth = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Helper to build a KPI report PDF and return file path
function generateKPIReportPdf({ userName, company, period, performance, alerts }) {
  const tempDir = path.join(os.tmpdir(), 'farmaforce-reports');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const filePath = path.join(tempDir, `KPI_Report_${Date.now()}.pdf`);

  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Header bar
  doc.rect(0, 0, doc.page.width, 60).fill('#F3E8FF');
  doc.fillColor('#491C7C').fontSize(18).text('FarmaForce', 50, 20, { align: 'left' });
  doc.fillColor('#111').fontSize(16).text('Call Activity & Notes Report', 50, 45, { align: 'left' });
  doc.moveDown(2);
  doc.fillColor('#111');

  // Meta
  // Meta line
  doc
    .fontSize(10)
    .fillColor('#555')
    .text(`User: ${userName}`, 50)
    .text(`Company: ${company}`)
    .text(`Period: ${period}`)
    .moveDown(0.5);

  // Divider
  const drawDivider = () => {
    const y = doc.y + 5;
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#E5E7EB').lineWidth(1).stroke();
    doc.moveDown();
  };
  drawDivider();

  // Summary
  const summary = performance?.summary || {};
  doc
    .fontSize(12)
    .fillColor('#111')
    .text('Summary', { underline: false, continued: false })
    .moveDown(0.5);

  const summaryBoxTop = doc.y;
  const boxX = 50;
  const boxW = doc.page.width - 100;
  const lineH = 16;
  doc.roundedRect(boxX, summaryBoxTop - 6, boxW, 6 * lineH + 12, 6).fillOpacity(1).fill('#F9FAFB');
  doc.fillColor('#111').fontSize(11);
  const writeRow = (label, value, row) => {
    const y = summaryBoxTop + row * lineH;
    doc.fillColor('#6B7280').text(label, boxX + 12, y, { width: boxW / 2 - 24, continued: false });
    doc.fillColor('#111').text(String(value), boxX + boxW / 2, y, { width: boxW / 2 - 24, align: 'right' });
  };
  writeRow('Latest Amount', summary.latestAmount ?? '-', 0);
  writeRow('Growth', `${summary.growth ?? '-'}% (${summary.growthType || '-'})`, 1);
  writeRow('Total Calls', summary.totalCalls ?? '-', 2);
  writeRow('Avg Coverage', `${summary.avgCoverage ?? '-'}%`, 3);
  writeRow('Avg Frequency', summary.avgFrequency ?? '-', 4);
  doc.moveDown(6);
  drawDivider();

  // Recent data table (last 7 points if exist)
  const rows = (performance?.data || []).slice(-7);
  if (rows.length) {
    doc.fontSize(12).fillColor('#111').text('Recent Activity').moveDown(0.5);
    const tableX = 50;
    const tableW = doc.page.width - 100;
    const cols = [0.30, 0.175, 0.175, 0.175, 0.175];
    const colX = (i) => tableX + Math.round(cols.slice(0, i).reduce((a, b) => a + b, 0) * tableW);
    const colW = (i) => Math.round(cols[i] * tableW);
    const rowHeight = 20;

    // Header row background
    const headerY = doc.y;
    doc.roundedRect(tableX, headerY - 6, tableW, rowHeight, 6).fill('#EEF2FF');
    doc.fillColor('#4B5563').fontSize(10);
    const headers = ['Month/Day', 'Sales', 'Calls', 'Coverage', 'Freq'];
    headers.forEach((h, i) => {
      doc.text(h, colX(i) + 10, headerY - 2, { width: colW(i) - 20, align: i === 0 ? 'left' : 'right' });
    });
    doc.moveDown(1.4);

    // Data rows with zebra striping and right-aligned numbers
    doc.fontSize(11).fillColor('#111');
    rows.forEach((r, idx) => {
      const y = doc.y - 6;
      if (idx % 2 === 0) {
        doc.rect(tableX, y, tableW, rowHeight).fill('#F9FAFB');
      }
      const values = [r.month || r.date || '-', r.value ?? r.sales ?? '-', r.calls ?? '-', r.coverage ?? '-', r.frequency ?? '-'];
      values.forEach((v, i) => {
        const align = i === 0 ? 'left' : 'right';
        doc.fillColor('#111').text(String(v), colX(i) + 10, y + 8, { width: colW(i) - 20, align });
      });
      doc.moveDown(1.2);
    });
    doc.moveDown(0.5);
    drawDivider();
  }

  // Alerts section
  if (Array.isArray(alerts) && alerts.length) {
    doc.fontSize(12).fillColor('#111').text('Alerts & Notes Highlights').moveDown(0.5);
    const alertBoxTop = doc.y - 6;
    const alertH = Math.min(10, alerts.length) * 18 + 18;
    doc.roundedRect(50, alertBoxTop, doc.page.width - 100, alertH, 6).fill('#FFF7ED');
    doc.fontSize(10).fillColor('#7C2D12');
    alerts.slice(0, 10).forEach((a, idx) => {
      const y = alertBoxTop + 10 + idx * 18;
      doc.text(`• [${a.priority}] ${a.title}`, 60, y, { width: doc.page.width - 120 });
    });
    doc.moveDown(2);
  }

  // Next steps
  doc
    .fontSize(12)
    .fillColor('#111')
    .text('Next Steps & Compliance Reminders')
    .moveDown(0.5);
  const nsTop = doc.y - 6;
  const nsW = doc.page.width - 100;
  doc.roundedRect(50, nsTop, nsW, 100, 6).fill('#ECFDF5');
  const bullets = [
    'Focus on territories with low coverage and below-target frequency.',
    'Prioritize GP calls where growth decelerated week-over-week.',
    'Reinforce messaging for Ferro-grad, Ostelin, Nicovape Q based on recent performance.',
    'Ensure call notes are captured accurately to support coaching and compliance.'
  ];
  doc.fontSize(10).fillColor('#065F46');
  bullets.forEach((b, i) => {
    doc.text(`• ${b}`, 60, nsTop + 10 + i * 18, { width: nsW - 20 });
  });

  doc.end();

  return new Promise((resolve) => {
    stream.on('finish', () => resolve(filePath));
  });
}

// Fetch performance data using existing trends endpoint internally
async function fetchPerformanceExternal(req) {
  const base = `${req.protocol}://${req.get('host')}`;
  const period = req.query.period || 'weekly';
  const company = req.query.company || 'FarmaForce';
  const url = `${base}/api/trends/performance?company=${encodeURIComponent(company)}&period=${encodeURIComponent(period)}`;
  const res = await fetch(url);
  const json = await res.json();
  return json;
}

// GET /api/reports/kpi/download - returns PDF
router.get('/kpi/download', auth, async (req, res) => {
  try {
    const userName = req.user?.name || 'User';
    const period = req.query.period || 'weekly';
    const company = req.query.company || 'FarmaForce';
    const perf = await fetchPerformanceExternal(req);
    const alerts = []; // Could be enhanced to fetch real alerts

    const pdfPath = await generateKPIReportPdf({ userName, company, period, performance: perf, alerts });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="KPI_Report.pdf"');
    const stream = fs.createReadStream(pdfPath);
    stream.pipe(res);
    stream.on('close', () => fs.unlink(pdfPath, () => {}));
  } catch (e) {
    console.error('Download KPI report error:', e);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
});

// POST /api/reports/kpi/email - emails PDF to logged-in user
router.post('/kpi/email', auth, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const userName = req.body.userName || 'User';
    if (!userEmail) return res.status(400).json({ success: false, message: 'User email not found' });

    const period = req.body.period || 'weekly';
    const company = req.body.company || 'FarmaForce';
    const perf = await fetchPerformanceExternal(req);
    const alerts = req.body.alerts || [];

    const pdfPath = await generateKPIReportPdf({ userName, company, period, performance: perf, alerts });

    const subject = '📊 Your Call Activity & Notes Report';
    const message = `Hi ${userName},\n\nPlease find attached your Call Activity & Notes Report. This report provides:\n\nGP call activity summary across all territories\n\nPerformance insights for Ferro-grad, Ostelin, and Nicovape Q\n\nFeedback highlights (Good, Bad, Ugly) from call notes\n\nNext steps and compliance reminders\n\nWe recommend reviewing the report and focusing on suggested improvements.`;

    await emailService.sendEmail({
      to: userEmail,
      subject,
      message,
      attachments: [{ filename: 'KPI_Report.pdf', path: pdfPath }]
    });

    fs.unlink(pdfPath, () => {});
    res.json({ success: true, message: 'Report emailed successfully' });
  } catch (e) {
    console.error('Email KPI report error:', e);
    res.status(500).json({ success: false, message: 'Failed to email report' });
  }
});

module.exports = router;


