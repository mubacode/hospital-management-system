const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Send verification code for email
router.post('/send-verification-code', authController.sendVerificationCode);

// Verify email code
router.post('/verify-code', authController.verifyCode);

// Register new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Get user profile (protected route)
router.get('/profile', authenticateToken, authController.getProfile);

// Change password (protected route)
router.patch('/change-password', authenticateToken, authController.changePassword);

// Invitation Flow
router.post('/invite', authenticateToken, authController.inviteUser);
router.get('/verify-invite', authController.verifyInvite);
router.post('/setup-invited', authController.setupInvitedAccount);

module.exports = router;