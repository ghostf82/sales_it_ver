/**
 * Global error handler middleware
 * Formats all errors in consistent JSON format for Odoo compatibility
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.code === 'PGRST116') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (err.code === '23505') {
    statusCode = 409;
    message = 'Resource already exists';
  } else if (err.code === '23503') {
    statusCode = 400;
    message = 'Invalid reference to related resource';
  } else if (err.message) {
    message = err.message;
  }

  // Send error response in Odoo-compatible format
  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};

module.exports = errorHandler;