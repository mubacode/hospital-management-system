const express = require('express');
const router = express.Router();
const medicalRecordsController = require('../controllers/medicalRecordsController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get patient's medical records (Must be the patient themselves, their doctor, or an admin)
router.get('/records', authorize(['patient', 'doctor', 'admin']), medicalRecordsController.getPatientMedicalRecords);

// Get patient's medications
router.get('/medications', authorize(['patient', 'doctor', 'admin']), medicalRecordsController.getPatientMedications);

// Get patient's allergies
router.get('/allergies', authorize(['patient', 'doctor', 'admin']), medicalRecordsController.getPatientAllergies);

// Get patient's vaccinations
router.get('/vaccinations', authorize(['patient', 'doctor', 'admin']), medicalRecordsController.getPatientVaccinations);

module.exports = router;