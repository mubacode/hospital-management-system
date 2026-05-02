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
  
  // Use the res.error helper (it should be available since middleware was applied)
  if (res.error) {
    // In development or non-standard 500s, show the actual message
    const message = (statusCode === 500 && process.env.NODE_ENV === 'production') 
      ? 'Internal Server Error' 
      : err.message;
      
    return res.error(message, statusCode);
  }

  // Fallback if res.error is not attached
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    requestId: req.requestId
  });
};

module.exports = errorHandler;
