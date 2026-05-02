const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const usersRoutes = require('./routes/users');
const notificationsRoutes = require('./routes/notifications');
const messagesRoutes = require('./routes/messages');
const doctorsRoutes = require('./routes/doctors');
const clinicsRoutes = require('./routes/clinics');
const medicalRecordsRoutes = require('./routes/medical-records');
const patientsRoutes = require('./routes/patients');
const chatbotRoutes = require('./routes/chatbot');

const logger = require('./config/logger');
const { assignRequestId, requestLogger } = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables with explicit path
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Initialize express app
const app = express();
const PORT = process.env.PORT;

// Debug environment variables
logger.info('Environment variables loaded:', {
  PORT: process.env.PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS_LENGTH: process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0,
  OPENROUTER_API_KEY_PRESENT: !!process.env.OPENROUTER_API_KEY,
  GEMINI_API_KEY_PRESENT: !!process.env.GEMINI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(assignRequestId);
app.use(requestLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/clinics', clinicsRoutes);
app.use('/api/medical-records', medicalRecordsRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Hospital Management System API');
});

// Global Error Handler
app.use(errorHandler);

// Start the server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Handle uncaught exceptions and unhandled rejections
const shutdown = (err, type) => {
  logger.error(`${type} occurred`, { stack: err ? err.stack : undefined, details: err ? (err.message || err) : undefined });
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

process.on('uncaughtException', (err) => shutdown(err, 'Uncaught Exception'));
process.on('unhandledRejection', (reason) => shutdown(reason, 'Unhandled Rejection'));

module.exports = app; 