const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { authenticateToken } = require('../middleware/auth');
const { chatbotLimiter } = require('../middleware/rateLimiter');

// All chatbot interactions require a logged-in user and are rate-limited
router.post('/message', authenticateToken, chatbotLimiter, chatbotController.processMessage);

// Poll for job result
router.get('/result/:jobId', authenticateToken, chatbotController.getJobResult);

module.exports = router;
