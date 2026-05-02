const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  // Log the error using winston
  logger.error(err.message || 'Internal Server Error', {
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    requestId: req.requestId,
    userId: req.user ? req.user.id : 'unauthenticated',
    body: req.body ? { ...req.body, password: req.body.password ? '[REDACTED]' : undefined } : undefined,
    query: req.query
  });

  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Create generic response
  const errorResponse = {
    error: statusCode === 500 ? 'Internal Server Error' : err.message,
    requestId: req.requestId
  };

  // Include error details in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = err.message;
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
