const express = require('express');
const router = express.Router();
const Location = require('../models/Location');

// GET /api/navigation/locations?doctorId=...
router.get('/locations', async (req, res, next) => {
  try {
    const { doctorId } = req.query;
    const filter = doctorId ? { doctorId } : {};
    const items = await Location.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

// POST /api/navigation/locations
router.post('/locations', async (req, res, next) => {
  try {
    const { doctorId, label, category, lat, lng } = req.body;
    if (!doctorId || !label || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'doctorId, label, lat, lng are required' });
    }
    const item = await Location.create({ doctorId, label, category, lat, lng });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/navigation/locations/:id
router.delete('/locations/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await Location.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;



