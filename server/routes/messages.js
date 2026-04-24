const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messagesController');
const { authenticateToken } = require('../middleware/auth');

// All routes in this file require authentication
router.use(authenticateToken);

// Get all messages for the current user
router.get('/', messagesController.getUserMessages);

// Mark a message as read
router.put('/:id/read', messagesController.markAsRead);

// Create a new message
router.post('/', messagesController.createMessage);

module.exports = router; 