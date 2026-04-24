const express = require('express');
const router = express.Router();
const clinicsController = require('../controllers/clinicsController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all clinics
router.get('/', clinicsController.getAllClinics);

// Get clinic by ID
router.get('/:id', clinicsController.getClinicById);

// Get doctors by clinic ID
router.get('/:id/doctors', clinicsController.getDoctorsByClinicId);

// Administrative Routes for Department Management
router.post('/', authorize(['admin']), clinicsController.createClinic);
router.put('/:id', authorize(['admin']), clinicsController.updateClinic);
router.delete('/:id', authorize(['admin']), clinicsController.deleteClinic);

module.exports = router;