/**
 * Error Handling Middleware
 * Centralized error handling untuk seluruh aplikasi
 */
const logger = require('../utils/logger');
const config = require('../config');
const { errorResponse, ApiError } = require('../utils/response');

/**
 * Custom error class untuk operational errors
 */
class OperationalError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Generate request ID
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = {};
  
  // Log error
  if (statusCode >= 500) {
    logger.errorRequest(`Server Error: ${message}`, err, {
      requestId,
      path: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
  } else {
    logger.warnRequest(`Client Error: ${message}`, {
      requestId,
      path: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation Error';
    details = formatMongooseValidationError(err);
  } else if (err.name === 'CastError') {
    // Mongoose cast error (invalid ObjectId)
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    message = 'Duplicate entry';
    details = { field: getDuplicateField(err) };
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    // JSON parsing error
    statusCode = 400;
    message = 'Invalid JSON format';
  }

  // Send error response
  const errorObj = errorResponse({
    error: message,
    statusCode,
    details,
    req
  });

  // Only include stack trace in development
  if (config.server.nodeEnv === 'development') {
    errorObj.error.stack = err.stack;
  }

  res.status(statusCode).json(errorObj);
};

/**
 * Format mongoose validation error
 */
function formatMongooseValidationError(err) {
  const errors = {};
  if (err.errors) {
    Object.keys(err.errors).forEach(key => {
      errors[key] = {
        message: err.errors[key].message,
        kind: err.errors[key].kind
      };
    });
  }
  return errors;
}

/**
 * Get duplicate field from MongoDB error
 */
function getDuplicateField(err) {
  const fieldMatch = err.message.match(/index: (.+?)_1/);
  return fieldMatch ? fieldMatch[1] : 'unknown';
}

/**
 * Handle 404 - Not Found
 */
const notFoundHandler = (req, res, next) => {
  const error = new OperationalError(
    `Route ${req.originalUrl} not found`,
    404
  );
  next(error);
};

/**
 * Async handler wrapper to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Unhandled rejection handler
 */
const unhandledRejectionHandler = (server) => {
  process.on('unhandledRejection', (reason, promise) => {
    logger.errorRequest('Unhandled Rejection', reason, {
      reason: reason?.message || reason
    });
    
    // Graceful shutdown
    server.close(() => {
      logger.errorRequest('Server closed due to unhandled rejection');
      process.exit(1);
    });
  });
};

/**
 * Uncaught exception handler
 */
const uncaughtExceptionHandler = () => {
  process.on('uncaughtException', (error) => {
    logger.errorRequest('Uncaught Exception', error, {
      stack: error.stack
    });
    process.exit(1);
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  unhandledRejectionHandler,
  uncaughtExceptionHandler,
  OperationalError
};
