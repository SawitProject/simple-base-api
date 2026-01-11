/**
 * Rate Limiting Middleware
 * Mencegah abuse dan melindungi API dari DDoS
 */
const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../utils/logger');
const { RateLimitError } = require('../utils/response');

/**
 * Create standard rate limiter
 * Default: 100 requests per 15 minutes
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = config.rateLimit.windowMs,
    max = config.rateLimit.maxRequests,
    message = config.rateLimit.message.error,
    keyGenerator = (req) => req.ip,
    skipFailedRequests = false,
    skipSuccessfulRequests = false
  } = options;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    message: {
      success: false,
      statusCode: 429,
      message: message,
      error: {
        type: 'Too Many Requests',
        details: {
          retryAfter: Math.ceil(windowMs / 1000)
        }
      }
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      if (req.path === '/health' || req.path === '/ready') {
        return true;
      }
      return false;
    },
    skipFailedRequests,
    skipSuccessfulRequests,
    handler: (req, res, next, options) => {
      const retryAfter = Math.ceil(options.windowMs / 1000);
      
      // Set rate limit headers
      res.setHeader('Retry-After', retryAfter);
      res.setHeader('X-RateLimit-Limit', options.max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000 + options.windowMs / 1000));
      
      logger.warnRequest('Rate limit exceeded', {
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        retryAfter
      });
      
      res.status(429).json(options.message);
    }
  });
};

/**
 * Strict rate limiter for authentication endpoints
 * More restrictive: 5 requests per hour
 */
const authRateLimiter = createRateLimiter({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMaxRequests,
  message: 'Terlalu banyak percobaan autenticasi, coba lagi dalam 1 jam',
  keyGenerator: (req) => {
    // Combine IP and endpoint for more granular limiting
    return `${req.ip}:${req.path}`;
  }
});

/**
 * Sliding window rate limiter untuk endpoint sensitif
 * Menggunakan sliding window algorithm untuk lebih akurat
 */
const slidingWindowLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Terlalu banyak permintaan, tunggu sebentar'
});

/**
 * Rate limiter with IP whitelist
 */
const createWhitelistedRateLimiter = (whitelist = []) => {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests * 10, // Whitelisted IPs get 10x limit
    keyGenerator: (req) => req.ip,
    skip: (req) => whitelist.includes(req.ip),
    message: {
      success: false,
      statusCode: 429,
      message: 'Terlalu banyak permintaan'
    }
  });
};

/**
 * Dynamic rate limiter based on endpoint sensitivity
 */
const dynamicRateLimiter = (req, res, next) => {
  const sensitiveEndpoints = ['/api/v1/auth/', '/api/v1/login', '/api/v1/register'];
  const isSensitiveEndpoint = sensitiveEndpoints.some(endpoint => 
    req.path.startsWith(endpoint)
  );

  if (isSensitiveEndpoint) {
    return authRateLimiter(req, res, next);
  }

  return createRateLimiter()(req, res, next);
};

module.exports = {
  createRateLimiter,
  authRateLimiter,
  slidingWindowLimiter,
  createWhitelistedRateLimiter,
  dynamicRateLimiter
};
