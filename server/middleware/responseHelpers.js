/**
 * Middleware to attach standard response formatters to the res object.
 */
module.exports = (req, res, next) => {
  res.success = function(data = {}, statusCode = 200) {
    return this.status(statusCode).json({
      success: true,
      data,
      requestId: req.requestId
    });
  };

  res.error = function(message = 'Server Error', statusCode = 500) {
    return this.status(statusCode).json({
      success: false,
      error: message,
      requestId: req.requestId
    });
  };

  next();
};
