const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes in this file require authentication
router.use(authenticateToken);

// Get all users (admin only)
router.get('/', authorize(['admin']), usersController.getAllUsers);

// Get system stats
router.get('/stats', authorize(['admin']), usersController.getStats);

// Get a specific user
router.get('/:id', authorize(['admin']), usersController.getUserById);

// Update a user
router.put('/:id', authorize(['admin']), usersController.updateUser);

// Delete a user
router.delete('/:id', authorize(['admin']), usersController.deleteUser);

module.exports = router; 