/**
 * Request ID Middleware
 * Menambahkan unique identifier untuk setiap request
 */
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

/**
 * Generate atau extract request ID
 */
const generateRequestId = (req, res, next) => {
  // Check if request ID already exists (from load balancer/proxy)
  let requestId = req.headers['x-request-id'] || req.headers['x-correlation-id'];
  
  if (!requestId) {
    requestId = uuidv4();
  }

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  
  // Add to request object
  req.requestId = requestId;

  next();
};

module.exports = { generateRequestId };
