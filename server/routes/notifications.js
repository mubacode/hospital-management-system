const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const { authenticateToken } = require('../middleware/auth');

// All routes in this file require authentication
router.use(authenticateToken);

// Get all notifications for the current user
router.get('/', notificationsController.getUserNotifications);

// Mark a notification as read
router.put('/:id/read', notificationsController.markAsRead);

// Create a new notification (admin only)
router.post('/', notificationsController.createNotification);

module.exports = router; 