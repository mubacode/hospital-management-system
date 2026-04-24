const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { authenticateToken } = require('../middleware/auth');

// All chatbot interactions require a logged-in user
router.post('/message', authenticateToken, chatbotController.processMessage);

module.exports = router;
