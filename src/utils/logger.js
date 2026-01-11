/**
 * Winston Logger - Structured logging dengan dukungan multi-transport
 */
const winston = require('winston');
const path = require('path');
const config = require('../config');

const logFormat = config.server.nodeEnv === 'production'
  ? winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    )
  : winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.colorize(),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (requestId) msg = `${timestamp} [${level}] [RequestID: ${requestId}]: ${message}`;
        if (Object.keys(meta).length > 0) msg += ` ${JSON.stringify(meta)}`;
        return msg;
      })
    );

const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: config.server.name },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add file transport in production
if (config.server.nodeEnv === 'production') {
  logger.add(new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5
  }));

  logger.add(new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log'),
    maxsize: 10 * 1024 * 1024,
    maxFiles: 5
  }));
}

// Helper functions untuk logging yang lebih mudah digunakan
logger.infoRequest = (message, meta = {}) => {
  logger.info(message, { ...meta, timestamp: new Date().toISOString() });
};

logger.errorRequest = (message, error, meta = {}) => {
  logger.error(message, {
    ...meta,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
};

logger.warnRequest = (message, meta = {}) => {
  logger.warn(message, { ...meta, timestamp: new Date().toISOString() });
};

logger.debugRequest = (message, meta = {}) => {
  logger.debug(message, { ...meta, timestamp: new Date().toISOString() });
};

module.exports = logger;
