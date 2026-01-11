/**
 * API Response Standardization
 * Menjadikan semua response API konsisten dan predictable
 */
const config = require('../config');

/**
 * Standard API Response Structure
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Indicates if the request was successful
 * @property {number} statusCode - HTTP status code
 * @property {string} message - Human-readable message
 * @property {*} data - Response data
 * @property {Object} meta - Additional metadata (pagination, etc.)
 * @property {Object} error - Error details (only on failure)
 * @property {string} requestId - Unique request identifier
 * @property {string} timestamp - Response timestamp
 */

/**
 * Create a standardized success response
 * @param {Object} options - Response options
 * @param {*} options.data - The data to return
 * @param {string} [options.message] - Success message
 * @param {number} [options.statusCode] - HTTP status code (default: 200)
 * @param {Object} [options.meta] - Additional metadata (pagination, etc.)
 * @param {Object} [options.req] - Express request object for requestId
 * @returns {Object} Standardized response object
 */
const successResponse = ({ data, message = 'Success', statusCode = 200, meta = {}, req }) => {
  return {
    success: true,
    statusCode,
    message,
    data,
    meta,
    requestId: req?.headers['x-request-id'] || null,
    timestamp: new Date().toISOString()
  };
};

/**
 * Create a standardized error response
 * @param {Object} options - Response options
 * @param {string|Error} options.error - Error message or Error object
 * @param {number} [options.statusCode] - HTTP status code (default: 500)
 * @param {Object} [options.details] - Additional error details
 * @param {Object} [options.req] - Express request object for requestId
 * @returns {Object} Standardized error response object
 */
const errorResponse = ({ error, statusCode = 500, details = {}, req }) => {
  const errorMessage = error instanceof Error ? error.message : error;
  
  const response = {
    success: false,
    statusCode,
    message: errorMessage,
    error: {
      type: getErrorType(statusCode),
      details: Object.keys(details).length > 0 ? details : undefined
    },
    requestId: req?.headers['x-request-id'] || null,
    timestamp: new Date().toISOString()
  };

  // Include stack trace in development mode
  if (config.server.nodeEnv === 'development' && error instanceof Error) {
    response.error.stack = error.stack;
  }

  return response;
};

/**
 * Get error type based on status code
 * @param {number} statusCode - HTTP status code
 * @returns {string} Error type
 */
const getErrorType = (statusCode) => {
  const errorTypes = {
    400: 'Validation Error',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };
  return errorTypes[statusCode] || 'Unknown Error';
};

/**
 * Pagination metadata helper
 * @param {Object} options - Pagination options
 * @param {number} options.page - Current page number
 * @param {number} options.limit - Items per page
 * @param {number} options.total - Total items count
 * @param {number} options.totalPages - Total pages
 * @returns {Object} Pagination metadata
 */
const paginationMeta = ({ page, limit, total, totalPages }) => ({
  pagination: {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  }
});

/**
 * Wrap async route handlers to catch errors automatically
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function with error handling
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(statusCode, message, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error
 */
class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

/**
 * Validation Error
 */
class ValidationError extends ApiError {
  constructor(message = 'Validation failed', details = {}) {
    super(400, message, details);
  }
}

/**
 * Unauthorized Error
 */
class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

/**
 * Forbidden Error
 */
class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

/**
 * Rate Limit Error
 */
class RateLimitError extends ApiError {
  constructor(message = 'Too many requests', retryAfter = 60) {
    super(429, message, { retryAfter });
  }
}

module.exports = {
  successResponse,
  errorResponse,
  paginationMeta,
  asyncHandler,
  ApiError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  RateLimitError
};
