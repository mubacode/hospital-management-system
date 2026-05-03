const path = require('path');
const dotenv = require('dotenv');

// Load environment variables with explicit path before anything else
dotenv.config({ path: path.resolve(__dirname, '.env') });

const http = require('http');
const express = require('express');
const cors = require('cors');
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
const responseHelpers = require('./middleware/responseHelpers');
const { authenticateToken } = require('./middleware/auth');
const db = require('./config/db');
const valkeyClient = require('./config/valkey');
const { initSocket } = require('./config/socket');
const { setupBullBoard } = require('./config/bullBoard');

// Initialize express app
const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT;

// Initialize Socket.io with Redis adapter
initSocket(httpServer, valkeyClient);

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
app.use(responseHelpers);

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    services: {
      db: 'down',
      valkey: valkeyClient ? 'up' : 'disabled'
    }
  };

  try {
    await db.query('SELECT 1');
    health.services.db = 'up';
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    health.status = 'degraded';
  }

  if (valkeyClient) {
    try {
      await valkeyClient.ping();
    } catch (error) {
      logger.error('Valkey health check failed', { error: error.message });
      health.services.valkey = 'down';
      health.status = 'degraded';
    }
  }

  res.json(health);
});

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

// Bull-Board Dashboard — admin-only access with backend auth
const bullBoardMiddleware = setupBullBoard();
if (bullBoardMiddleware) {
  app.use('/admin/queues', authenticateToken, (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
  }, bullBoardMiddleware);
  logger.info('Bull-Board dashboard mounted at /admin/queues');
}

// Root route
app.get('/', (req, res) => {
  res.send('Hospital Management System API');
});

// Global Error Handler
app.use(errorHandler);

// Initialize background workers
const emailWorker = require('./workers/emailWorker');
const chatbotWorker = require('./workers/chatbotWorker');

// Start the server
const server = httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Handle uncaught exceptions and unhandled rejections
const shutdown = async (err, type) => {
  if (err) {
    logger.error(`${type} occurred`, { stack: err.stack, details: err.message });
  } else {
    logger.info(`Graceful shutdown initiated: ${type}`);
  }

  // Set a timeout for forced exit
  const forceExit = setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);

  try {
    // 1. Close Server (Stop accepting new requests)
    if (server) {
      await new Promise(resolve => server.close(resolve));
      logger.info('HTTP server closed');
    }

    // 2. Close BullMQ Workers
    if (emailWorker) {
      await emailWorker.close();
      logger.info('Email worker closed');
    }
    if (chatbotWorker) {
      await chatbotWorker.close();
      logger.info('Chatbot worker closed');
    }

    // 3. Close Valkey Client
    if (valkeyClient) {
      await valkeyClient.quit();
      logger.info('Valkey connection closed');
    }

    // 4. Close Database Pool
    if (db && db.end) {
      await db.end();
      logger.info('Database pool closed');
    }

    clearTimeout(forceExit);
    logger.info('All services shut down gracefully');
    process.exit(err ? 1 : 0);
  } catch (shutdownErr) {
    logger.error('Error during graceful shutdown', { error: shutdownErr.message });
    process.exit(1);
  }
};

process.on('uncaughtException', (err) => shutdown(err, 'Uncaught Exception'));
process.on('unhandledRejection', (reason) => shutdown(reason, 'Unhandled Rejection'));
process.on('SIGTERM', () => shutdown(null, 'SIGTERM'));
process.on('SIGINT', () => shutdown(null, 'SIGINT'));

module.exports = app; 