const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');
const logger = require('../config/logger');

// Middleware to assign a unique requestId to every incoming request
const assignRequestId = (req, res, next) => {
  req.requestId = uuidv4();
  next();
};

// Morgan custom format to output JSON string
morgan.token('requestId', (req) => req.requestId);
morgan.token('userId', (req) => (req.user ? req.user.id : 'unauthenticated'));
morgan.token('body', (req) => {
  // Avoid logging sensitive information like passwords
  const body = { ...req.body };
  if (body.password) body.password = '[REDACTED]';
  return Object.keys(body).length ? JSON.stringify(body) : undefined;
});
morgan.token('query', (req) => {
  return Object.keys(req.query).length ? JSON.stringify(req.query) : undefined;
});

const morganFormat = (tokens, req, res) => {
  return JSON.stringify({
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: Number.parseFloat(tokens.status(req, res)),
    content_length: tokens.res(req, res, 'content-length'),
    response_time: Number.parseFloat(tokens['response-time'](req, res)),
    requestId: tokens.requestId(req, res),
    userId: tokens.userId(req, res),
    ip: tokens['remote-addr'](req, res),
    user_agent: tokens['user-agent'](req, res),
    query: tokens.query(req, res),
    body: tokens.body(req, res)
  });
};

// Morgan middleware to log HTTP requests
const requestLogger = morgan(morganFormat, { stream: logger.stream });

module.exports = {
  assignRequestId,
  requestLogger
};
