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

const morganFormat = (tokens, req, res) => {
  const sanitizeBody = (body) => {
    if (!body || Object.keys(body).length === 0) return undefined;
    const safeBody = {};
    const safeKeys = ['clinicId', 'doctorId', 'date', 'time', 'appointmentId'];
    safeKeys.forEach(k => {
      if (body[k]) safeBody[k] = body[k];
    });
    if (body.message) safeBody.message_length = body.message.length;
    if (body.reason) safeBody.reason_length = body.reason.length;
    return Object.keys(safeBody).length ? safeBody : { _redacted: true };
  };

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
    query: req.query && Object.keys(req.query).length ? req.query : undefined,
    body: sanitizeBody(req.body)
  });
};

// Morgan middleware to log HTTP requests
const requestLogger = morgan(morganFormat, { stream: logger.stream });

module.exports = {
  assignRequestId,
  requestLogger
};
