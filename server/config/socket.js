/**
 * Socket.io Server Configuration
 * 
 * - Dedicated JWT authentication (does NOT reuse Express middleware)
 * - User-specific rooms for multi-device support
 * - Redis adapter for cross-process pub/sub (workers → socket server → client)
 */
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const jwt = require('jsonwebtoken');
const Valkey = require('ioredis');
const logger = require('./logger');

let io = null;

/**
 * Initialize Socket.io on the given HTTP server.
 * @param {http.Server} httpServer
 * @param {import('ioredis').Redis|null} valkeyClient - The existing Valkey client (for adapter)
 */
function initSocket(httpServer, valkeyClient) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    // Prevent socket from interfering with normal HTTP routes
    path: '/socket.io'
  });

  // ── Redis Adapter for cross-process event delivery ──
  if (valkeyClient) {
    try {
      // Create dedicated pub/sub clients (required by the adapter)
      const pubClient = valkeyClient.duplicate();
      const subClient = valkeyClient.duplicate();

      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.io Redis adapter initialized');
    } catch (err) {
      logger.error('Failed to initialize Socket.io Redis adapter', { error: err.message });
    }
  } else {
    logger.warn('Socket.io running without Redis adapter (single-process mode only)');
  }

  // ── Dedicated JWT Authentication Middleware ──
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      logger.warn('Socket connection rejected: no token', {
        event: 'socket_auth_failed',
        ip: socket.handshake.address
      });
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      logger.warn('Socket connection rejected: invalid token', {
        event: 'socket_auth_failed',
        ip: socket.handshake.address,
        error: err.message
      });
      return next(new Error('Invalid token'));
    }
  });

  // ── Connection Handler ──
  io.on('connection', (socket) => {
    const userId = socket.user.id;

    // Join user-specific room for targeted event delivery
    socket.join(`user:${userId}`);

    logger.info('Socket connected', {
      event: 'socket_connected',
      userId,
      socketId: socket.id
    });

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', {
        event: 'socket_disconnected',
        userId,
        socketId: socket.id,
        reason
      });
    });
  });

  // ── Listen for worker events via Redis pub/sub ──
  if (valkeyClient) {
    const subscriber = valkeyClient.duplicate();
    subscriber.subscribe('socket_events', (err) => {
      if (err) {
        logger.error('Failed to subscribe to socket_events channel', { error: err.message });
      } else {
        logger.info('Subscribed to socket_events Redis channel');
      }
    });

    subscriber.on('message', (channel, message) => {
      try {
        const event = JSON.parse(message);
        const { userId, ...payload } = event;

        if (userId && io) {
          io.to(`user:${userId}`).emit(event.event, payload);
          logger.debug('Socket event emitted via Redis', {
            event: event.event,
            userId,
            requestId: event.requestId
          });
        }
      } catch (err) {
        logger.error('Failed to parse socket_events message', { error: err.message });
      }
    });
  }

  return io;
}

/**
 * Get the Socket.io instance (for use within the HTTP server process only).
 * Workers should NOT call this — they publish via Redis.
 */
function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
