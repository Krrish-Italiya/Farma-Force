const express = require('express');
const router = express.Router();

// GET /api/schedule/appointments
// Returns upcoming appointments and navigation details
router.get('/appointments', async (req, res) => {
  try {
    // In a real app, fetch from DB. For now, respond from backend (not frontend static)
    const now = new Date();
    const toISOTime = (h, m) => {
      const d = new Date(now);
      d.setHours(h, m, 0, 0);
      return d.toISOString();
    };

    const appointments = [
      {
        id: 'a1',
        doctorName: 'Dr. Wilson',
        specialty: 'Pediatrician',
        time: toISOTime(8, 0),
        location: {
          address: '215 Vine St, Scranton PA 18503',
          city: 'Melbourne VIC',
          lat: -37.8136,
          lng: 144.9631
        },
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=DW'
      },
      {
        id: 'a2',
        doctorName: 'Dr. Mehta',
        specialty: 'Cardiologist',
        time: toISOTime(11, 30),
        location: {
          address: '19 Collins St, Melbourne VIC',
          city: 'Melbourne VIC',
          lat: -37.815,
          lng: 144.9706
        },
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=DM'
      },
      {
        id: 'a3',
        doctorName: 'Dr. Johnson',
        specialty: 'Neurologist',
        time: toISOTime(14, 0),
        location: {
          address: '5 Swanston St, Melbourne VIC',
          city: 'Melbourne VIC',
          lat: -37.8183,
          lng: 144.9671
        },
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=DJ'
      }
    ];

    // Next appointment is the soonest upcoming
    const upcoming = appointments
      .filter(a => new Date(a.time).getTime() >= now.getTime())
      .sort((a, b) => new Date(a.time) - new Date(b.time))[0] || appointments[0];

    res.json({
      success: true,
      data: {
        date: now.toISOString(),
        appointments,
        nextAppointment: upcoming
      }
    });
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ success: false, message: 'Failed to load appointments' });
  }
});

module.exports = router;






