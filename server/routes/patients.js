const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes in this file require authentication
router.use(authenticateToken);

// Get all patients (for receptionists and doctors)
router.get('/', authorize(['receptionist', 'doctor', 'admin']), async (req, res) => {
  try {
    const [patients] = await db.query(`
      SELECT p.id, p.first_name, p.last_name, p.phone, p.user_id
      FROM patients p
      ORDER BY p.last_name, p.first_name
    `);
    
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient by ID
// Note: Patients can only access their own profile (checked in business logic or via role gate)
// In a real system, we'd add row-level security here.
router.get('/:id', authorize(['receptionist', 'doctor', 'admin', 'patient']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ownership check if user is a patient
    if (req.user.role === 'patient') {
        const [patientCheck] = await db.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
        if (patientCheck.length === 0 || patientCheck[0].id != id) {
             return res.status(403).json({ message: 'Forbidden: You can only view your own patient record' });
        }
    }
    
    const [patients] = await db.query(`
      SELECT p.id, p.first_name, p.last_name, p.phone, p.user_id
      FROM patients p
      WHERE p.id = ?
    `, [id]);
    
    if (patients.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.json(patients[0]);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;