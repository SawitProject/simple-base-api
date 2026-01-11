/**
 * Konfigurasi aplikasi terpusat
 * Semua environment variables dan konfigurasi ada di sini
 */
require('dotenv').config();

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    name: process.env.APP_NAME || 'Sawit Base API',
    version: process.env.APP_VERSION || '2.0.0'
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    authWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 5,
    message: {
      error: 'Terlalu banyak permintaan, coba lagi nanti',
      retryAfter: 'Silakan coba lagi dalam {seconds} detik'
    }
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    credentials: true,
    maxAge: 86400 // 24 hours
  },

  // Security Configuration
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://fonts.gstatic.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'"]
        }
      },
      crossOriginEmbedderPolicy: false
    }
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'production' ? 'json' : 'simple',
    console: process.env.LOG_CONSOLE !== 'false',
    file: process.env.LOG_FILE || 'logs/app.log',
    maxSize: '10m',
    maxFiles: 5
  },

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes in seconds
    checkperiod: parseInt(process.env.CACHE_CHECK_PERIOD) || 60
  },

  // API Keys Configuration
  apiKeys: {
    gemini: process.env.GEMINI_API_KEY,
    requiredForProtectedEndpoints: true
  },

  // Feature Flags
  features: {
    rateLimiting: process.env.FEATURE_RATE_LIMIT !== 'false',
    helmet: process.env.FEATURE_HELMET !== 'false',
    cors: process.env.FEATURE_CORS !== 'false',
    compression: process.env.FEATURE_COMPRESSION !== 'false',
    logging: process.env.FEATURE_LOGGING !== 'false',
    caching: process.env.FEATURE_CACHING !== 'false',
    validation: process.env.FEATURE_VALIDATION !== 'false',
    healthCheck: process.env.FEATURE_HEALTH_CHECK !== 'false',
    swagger: process.env.FEATURE_SWAGGER !== 'false'
  }
};
