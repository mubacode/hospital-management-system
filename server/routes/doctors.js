const express = require('express');
const router = express.Router();
const doctorsController = require('../controllers/doctorsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all doctors
router.get('/', doctorsController.getAllDoctors);

// Get doctor by ID
router.get('/:id', doctorsController.getDoctorById);

// Get doctors by clinic
router.get('/clinic/:clinicId', doctorsController.getDoctorsByClinic);

// Get doctor availability
router.get('/:id/availability', doctorsController.getDoctorAvailability);

module.exports = router; 