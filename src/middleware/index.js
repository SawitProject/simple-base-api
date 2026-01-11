/**
 * Middleware Index
 * Export semua middleware dari satu tempat
 */
const { errorHandler, notFoundHandler, asyncHandler, unhandledRejectionHandler, uncaughtExceptionHandler } = require('./errorHandler');
const { generateRequestId } = require('./requestId');
const { corsMiddleware, helmetMiddleware, handleCorsErrors, preventHpp, secureResponseHeaders, noCacheHeaders } = require('./security');
const { createRateLimiter, authRateLimiter, slidingWindowLimiter, dynamicRateLimiter } = require('./rateLimiter');
const { handleValidationErrors, validate, validations, aiValidations, downloaderValidations, toolsValidations } = require('./validation');

module.exports = {
  // Error Handling
  errorHandler,
  notFoundHandler,
  asyncHandler,
  unhandledRejectionHandler,
  uncaughtExceptionHandler,
  
  // Request ID
  generateRequestId,
  
  // Security
  corsMiddleware,
  helmetMiddleware,
  handleCorsErrors,
  preventHpp,
  secureResponseHeaders,
  noCacheHeaders,
  
  // Rate Limiting
  createRateLimiter,
  authRateLimiter,
  slidingWindowLimiter,
  dynamicRateLimiter,
  
  // Validation
  handleValidationErrors,
  validate,
  validations,
  aiValidations,
  downloaderValidations,
  toolsValidations
};
