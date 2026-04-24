const db = require('../config/db');

// Helper to verify patient ownership or doctor/admin access
const verifyAccess = async (req, res, targetUserId) => {
  if (req.user.role === 'admin') return true;
  
  if (req.user.role === 'patient') {
    if (req.user.id != targetUserId) {
      res.status(403).json({ message: 'Forbidden: You can only access your own medical data' });
      return false;
    }
    return true;
  }
  
  if (req.user.role === 'doctor') {
    // Doctors can access records of patients they have appointments with
    const [patientRows] = await db.query('SELECT id FROM patients WHERE user_id = ?', [targetUserId]);
    if (patientRows.length === 0) return false;
    const patientId = patientRows[0].id;
    
    const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
    if (doctorRows.length === 0) return false;
    const doctorId = doctorRows[0].id;
    
    const [appointmentCheck] = await db.query(
      'SELECT id FROM appointments WHERE doctor_id = ? AND patient_id = ? LIMIT 1',
      [doctorId, patientId]
    );
    
    if (appointmentCheck.length === 0) {
      res.status(403).json({ message: 'Forbidden: You can only access records of patients assigned to you' });
      return false;
    }
    return true;
  }
  
  return false;
};

// Get patient medical records
exports.getPatientMedicalRecords = async (req, res) => {
  try {
    const { patientUserId } = req.query;
    const targetUserId = patientUserId || req.user.id;
    
    if (!await verifyAccess(req, res, targetUserId)) return;
    
    // Fetch simulated records (in production replace with real DB query)
    res.json([
      { id: 1, type: 'checkup', date: '2026-03-10', notes: 'Routine checkup, everything normal.' },
      { id: 2, type: 'blood_test', date: '2026-02-15', notes: 'Normal glucose levels.' }
    ]);
  } catch (error) {
    console.error('Error getting medical records:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get patient medications
exports.getPatientMedications = async (req, res) => {
  try {
    const { patientUserId } = req.query;
    const targetUserId = patientUserId || req.user.id;
    
    if (!await verifyAccess(req, res, targetUserId)) return;
    
    res.json([
      { id: 1, name: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily' },
      { id: 2, name: 'Vitamin C', dosage: '1000mg', frequency: 'Once daily' }
    ]);
  } catch (error) {
    console.error('Error getting medications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get patient allergies
exports.getPatientAllergies = async (req, res) => {
  try {
    const { patientUserId } = req.query;
    const targetUserId = patientUserId || req.user.id;
    
    if (!await verifyAccess(req, res, targetUserId)) return;
    
    res.json([
      { id: 1, allergen: 'Penicillin', severity: 'High' },
      { id: 2, allergen: 'Peanuts', severity: 'Moderate' }
    ]);
  } catch (error) {
    console.error('Error getting allergies:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get patient vaccinations
exports.getPatientVaccinations = async (req, res) => {
  try {
    const { patientUserId } = req.query;
    const targetUserId = patientUserId || req.user.id;
    
    if (!await verifyAccess(req, res, targetUserId)) return;
    
    res.json([
      { id: 1, vaccine: 'COVID-19', date: '2024-05-20' },
      { id: 2, vaccine: 'Flu', date: '2025-11-15' }
    ]);
  } catch (error) {
    console.error('Error getting vaccinations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};