/**
 * Security Middleware
 * Implementasi keamanan untuk melindungi API
 */
const helmet = require('helmet');
const cors = require('cors');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Configure Helmet untuk security headers
 */
const helmetMiddleware = helmet({
  contentSecurityPolicy: config.server.nodeEnv === 'production' 
    ? config.security.helmet.contentSecurityPolicy 
    : false,
  crossOriginEmbedderPolicy: config.security.helmet.crossOriginEmbedderPolicy,
  
  // Additional security headers
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
});

/**
 * Configure CORS
 */
const corsMiddleware = cors({
  origin: config.cors.origin,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders,
  exposedHeaders: config.cors.exposedHeaders,
  credentials: config.cors.credentials,
  maxAge: config.cors.maxAge,
  
  // Validate origin function untuk production
  origin: (origin, callback) => {
    if (config.server.nodeEnv === 'development') {
      callback(null, true);
      return;
    }
    
    // In production, validate origin
    const allowedOrigins = config.cors.origin.split(',').map(o => o.trim());
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warnRequest('CORS rejected origin', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  }
});

/**
 * Handle CORS errors
 */
const handleCorsErrors = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      success: false,
      statusCode: 403,
      message: 'CORS not allowed for this origin',
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
  } else {
    next(err);
  }
};

/**
 * Prevent HTTP parameter pollution
 */
const preventHpp = (req, res, next) => {
  // Use hpp library for more robust protection
  if (req.query) {
    const seen = {};
    for (const key in req.query) {
      const value = req.query[key];
      if (Array.isArray(value) && value.length > 1) {
        // Keep only the last value
        req.query[key] = value[value.length - 1];
      }
    }
  }
  next();
};

/**
 * Secure headers for API responses
 */
const secureResponseHeaders = (req, res, next) => {
  // Remove information disclosure headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  // Add additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

/**
 * Request size limiter
 */
const limitRequestSize = (req, res, next) => {
  const maxBodySize = '10mb';
  
  // Express built-in limit handles this
  req.on('data', (chunk) => {
    // This is handled by express.json() with limit option
  });
  
  next();
};

/**
 * No cache headers untuk sensitive data
 */
const noCacheHeaders = (req, res, next) => {
  // For authenticated routes, prevent caching
  if (req.headers.authorization) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  next();
};

module.exports = {
  helmetMiddleware,
  corsMiddleware,
  handleCorsErrors,
  preventHpp,
  secureResponseHeaders,
  limitRequestSize,
  noCacheHeaders
};
