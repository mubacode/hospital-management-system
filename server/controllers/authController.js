const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const emailService = require('../config/email');

// Store verification codes temporarily (in a real app, use Redis or a database)
const verificationCodes = {};

// Generate random verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

// Send verification code
exports.sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.error('Email is required', 400);
    }
    
    // Check if email is already registered
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.error('Email already registered', 409);
    }
    
    // Generate and store verification code
    const code = generateVerificationCode();
    verificationCodes[email] = {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    };
    
    // Send verification email
    await emailService.sendVerificationEmail(email, code);
    res.success({ message: 'Verification code sent' });
  } catch (error) {
    next(error);
  }
};

// Verify code
exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.error('Email and code are required', 400);
    }
    
    // Check if verification code exists and is valid
    if (!verificationCodes[email] || 
        verificationCodes[email].code !== code ||
        verificationCodes[email].expiresAt < Date.now()) {
      return res.error('Invalid or expired verification code', 400);
    }
    
    // Store verification status so registration doesn't require another code
    verificationCodes[email].verified = true;
    res.success({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

// Register new user (Classic Registration)
exports.register = async (req, res) => {
  try {
    const { username, email, password, role, first_name, last_name, phone, specialization, qualification, verificationCode } = req.body;

    if (!username || !email || !password || !role) {
      return res.error('All fields are required', 400);
    }
    
    // Check if email verification is enabled
    if (process.env.EMAIL_VERIFICATION_ENABLED === 'true') {
      if (!verificationCodes[email] || !verificationCodes[email].verified) {
        if (verificationCode) {
          if (!verificationCodes[email] || 
              verificationCodes[email].code !== verificationCode ||
              verificationCodes[email].expiresAt < Date.now()) {
            return res.error('Invalid or expired verification code', 400);
          }
          verificationCodes[email].verified = true;
        } else {
          const code = generateVerificationCode();
          verificationCodes[email] = {
            code,
            expiresAt: Date.now() + 10 * 60 * 1000,
            verified: false
          };
          await emailService.sendVerificationEmail(email, code);
          return res.error('Email verification required', 400);
        }
      }
      delete verificationCodes[email];
    }

    // Check if user already exists
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.error('Username or email already exists', 409);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (role !== 'patient') {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.error('Access Restricted: Staff registration requires administrative authorization.', 403);

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hospital_system_jwt_secret_key');
        if (decoded.role !== 'admin') return res.error('Authorization Failed: Admin privileges required for this role.', 403);
      } catch (err) {
        return res.error('Security Validation Failed: Invalid or expired administrative token.', 403);
      }
    }

    await db.query('START TRANSACTION');

    try {
      const [result] = await db.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, role]
      );

      const userId = result.insertId;

      if (role === 'doctor') {
        await db.query(
          'INSERT INTO doctors (user_id, first_name, last_name, specialization, qualification, phone) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, first_name || '', last_name || '', specialization || '', qualification || '', phone || '']
        );
      } else if (role === 'patient') {
        await db.query(
          'INSERT INTO patients (user_id, first_name, last_name, phone) VALUES (?, ?, ?, ?)',
          [userId, first_name || '', last_name || '', phone || '']
        );
      } else if (role === 'receptionist') {
        await db.query(
          'INSERT INTO receptionists (user_id, first_name, last_name, phone) VALUES (?, ?, ?, ?)',
          [userId, first_name || '', last_name || '', phone || '']
        );
      }

      const token = jwt.sign(
        { id: userId, username, email, role },
        process.env.JWT_SECRET || 'hospital_system_jwt_secret_key',
        { expiresIn: '1d' }
      );

      await db.query('COMMIT');
      res.success({
        message: 'User registered successfully',
        token,
        user: { id: userId, username, email, role, first_name, last_name }
      }, 201);
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// User login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.error('Username and password are required', 400);
    }

    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) return res.error('Invalid credentials', 401);

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.error('Invalid credentials', 401);

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'hospital_system_jwt_secret_key',
      { expiresIn: '1d' }
    );

    let doctorId = null;
    if (user.role === 'doctor') {
      const [doctors] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [user.id]);
      if (doctors.length > 0) doctorId = doctors[0].id;
    }

    res.success({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role, ...(doctorId && { doctorId }) }
    });
  } catch (error) {
    next(error);
  }
};

// Get profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [users] = await db.query('SELECT id, username, email, role FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.error('User not found', 404);
    
    const user = users[0];
    let profileData = {};
    if (user.role === 'doctor') {
      const [doctors] = await db.query('SELECT * FROM doctors WHERE user_id = ?', [userId]);
      if (doctors.length > 0) profileData = doctors[0];
    } else if (user.role === 'patient') {
      const [patients] = await db.query('SELECT * FROM patients WHERE user_id = ?', [userId]);
      if (patients.length > 0) profileData = patients[0];
    }
    
    res.success({ user, profile: profileData });
  } catch (error) {
    next(error);
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.error('Current and new passwords are required', 400);
    }

    const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.error('User not found', 404);

    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) return res.error('Incorrect current password', 401);

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);
    res.success({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * MODERN INVITATION SYSTEM
 */

// Invite a new user (Admin only)
exports.inviteUser = async (req, res) => {
  try {
    const { email, first_name, last_name, role, specialization, clinic_id } = req.body;

    if (!email || !role || !first_name || !last_name) {
      return res.error('All staff details (Email, Name, Role) are required.', 400);
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.error('A user with this email already exists.', 409);
    }

    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
    const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

    await db.query('START TRANSACTION');

    try {
      const [userResult] = await db.query(
        'INSERT INTO users (username, email, password, role, status, invitation_token, invitation_expires) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [username, email, '', role, 'pending', invitationToken, invitationExpires]
      );

      const userId = userResult.insertId;

      if (role === 'doctor') {
        await db.query(
          'INSERT INTO doctors (user_id, first_name, last_name, specialization, clinic_id) VALUES (?, ?, ?, ?, ?)',
          [userId, first_name, last_name, specialization || '', clinic_id || null]
        );
      } else if (role === 'receptionist') {
        await db.query(
          'INSERT INTO receptionists (user_id, first_name, last_name) VALUES (?, ?, ?)',
          [userId, first_name, last_name]
        );
      } else if (role === 'patient') {
        await db.query(
          'INSERT INTO patients (user_id, first_name, last_name) VALUES (?, ?, ?)',
          [userId, first_name, last_name]
        );
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const setupLink = `${frontendUrl}/setup-account?token=${invitationToken}`;
      
      const emailSent = await emailService.sendInvitationEmail(email, first_name, role, setupLink);
      
      if (!emailSent) {
        throw new Error('Email service failed to deliver the invitation.');
      }

      await db.query('COMMIT');
      res.success({ message: 'Invitation sent successfully.' });
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

// Verify invitation token
exports.verifyInvite = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.error('Token is required.', 400);

    const [users] = await db.query(
      'SELECT id, username, email, role FROM users WHERE invitation_token = ? AND invitation_expires > NOW() AND status = \'pending\'',
      [token]
    );

    if (users.length === 0) {
      return res.error('Invitation link is invalid or has expired.', 400);
    }

    res.success({ user: users[0] });
  } catch (error) {
    next(error);
  }
};

// Finalize account setup
exports.setupInvitedAccount = async (req, res) => {
  try {
    const { token, password, username } = req.body;

    if (!token || !password) return res.error('Token and Password are required.', 400);

    const [users] = await db.query(
      'SELECT id FROM users WHERE invitation_token = ? AND invitation_expires > NOW() AND status = \'pending\'',
      [token]
    );

    if (users.length === 0) return res.error('Invalid or expired setup session.', 400);

    const userId = users[0].id;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.query(
      'UPDATE users SET password = ?, username = ?, status = \'active\', invitation_token = NULL, invitation_expires = NULL WHERE id = ?',
      [hashedPassword, username || undefined, userId]
    );

    res.success({ message: 'Account activated successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};
