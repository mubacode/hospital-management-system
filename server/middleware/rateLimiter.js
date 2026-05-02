const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const valkeyClient = require('../config/valkey');
const logger = require('../config/logger');

// Fallback to memory store if Valkey is unavailable
let store;
if (valkeyClient) {
  store = new RedisStore({
    sendCommand: (...args) => valkeyClient.call(...args)
  });
}

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 login requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  store: store, // Defaults to memory if store is undefined
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      event: 'rate_limit_exceeded',
      requestId: req.requestId,
      ip: req.ip,
      endpoint: '/api/auth/login'
    });
    return res.status(options.statusCode).json({
      success: false,
      error: 'Too many login attempts, please try again after a minute',
      requestId: req.requestId
    });
  }
});

const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP/user to 10 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  store: store,
  keyGenerator: (req, res) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    return req.user ? String(req.user.id) : ipKeyGenerator(req, res);
  },
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      event: 'rate_limit_exceeded',
      requestId: req.requestId,
      userId: req.user ? req.user.id : 'anonymous',
      ip: req.ip,
      endpoint: '/api/chatbot/message'
    });
    return res.status(options.statusCode).json({
      success: false,
      error: 'Too many chatbot requests, please try again later',
      requestId: req.requestId
    });
  }
});

module.exports = {
  loginLimiter,
  chatbotLimiter
};
