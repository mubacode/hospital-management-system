const express = require('express');
const router = express.Router();
const appointmentsController = require('../controllers/appointmentsController');
const { authenticateToken, authorize } = require('../middleware/auth');
const db = require('../config/db');

// Get all appointments (filtered by query params)
router.get('/', authenticateToken, authorize(['admin', 'doctor', 'patient', 'receptionist']), appointmentsController.getAppointments);

// Get appointment by ID
router.get('/:id', authenticateToken, appointmentsController.getAppointmentById);

// ─── Availability check: returns { isAvailable, bookedSlots, suggestions } ───
// GET /appointments/availability?doctor_id=1&date=2026-05-10&time=10:00
router.get('/availability', authenticateToken, async (req, res) => {
  try {
    const { doctor_id, date, time } = req.query;
    if (!doctor_id || !date || !time) {
      return res.status(400).json({ message: 'doctor_id, date, and time are required' });
    }

    const normalizedTime = time.slice(0, 5); // HH:MM

    // Check if the exact slot is taken
    const [conflicts] = await db.query(
      `SELECT id FROM appointments 
       WHERE doctor_id = ? AND appointment_date = ? AND TIME_FORMAT(appointment_time,'%H:%i') = ? 
       AND status NOT IN ('cancelled')`,
      [doctor_id, date, normalizedTime]
    );

    const isAvailable = conflicts.length === 0;

    // Get all booked slots for that doctor on that day
    const [booked] = await db.query(
      `SELECT TIME_FORMAT(appointment_time,'%H:%i') as t FROM appointments 
       WHERE doctor_id = ? AND appointment_date = ? AND status NOT IN ('cancelled')`,
      [doctor_id, date]
    );

    const bookedTimes = booked.map(r => r.t);

    // Generate standard working slots: 09:00 – 17:00 in 30-min increments
    const allSlots = [];
    for (let h = 9; h < 17; h++) {
      allSlots.push(`${String(h).padStart(2,'0')}:00`);
      allSlots.push(`${String(h).padStart(2,'0')}:30`);
    }

    const suggestions = allSlots.filter(s => !bookedTimes.includes(s)).slice(0, 6);

    return res.json({ isAvailable, bookedSlots: bookedTimes, suggestions });
  } catch (err) {
    console.error('Availability check error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ─── Admin analytics: appointment stats, per-doctor breakdown, daily trend ───
// GET /appointments/analytics  (admin only)
router.get('/analytics', authenticateToken, authorize(['admin']), appointmentsController.getAnalytics);

// Create new appointment
router.post('/', authenticateToken, authorize(['patient', 'receptionist']), appointmentsController.createAppointment);

// Update appointment status
router.patch('/:id/status', authenticateToken, appointmentsController.updateAppointmentStatus);

// Delete appointment (admin and reception only)
router.delete('/:id', authenticateToken, authorize(['admin', 'receptionist']), appointmentsController.deleteAppointment);

module.exports = router;