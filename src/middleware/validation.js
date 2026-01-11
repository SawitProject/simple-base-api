/**
 * Validation Middleware
 * Input validation menggunakan express-validator
 */
const { body, query, param, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/response');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().reduce((acc, err) => {
      const field = err.path;
      if (!acc[field]) {
        acc[field] = [];
      }
      acc[field].push({
        message: err.msg,
        value: err.value,
        type: err.type
      });
      return acc;
    }, {});

    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Validation failed',
      error: {
        type: 'Validation Error',
        details: formattedErrors
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Common validation rules
 */
const validations = {
  // URL validation
  url: (field = 'url', required = true) => {
    const rule = query(field)
      .optional(!required)
      .isURL({ require_protocol: true, require_valid_protocol: true })
      .withMessage(`Invalid URL format for ${field}`);
    return rule;
  },

  // Text validation
  text: (field = 'text', required = true, minLength = 1, maxLength = 10000) => {
    let rule = query(field);
    if (required) rule = rule.notEmpty().withMessage(`${field} is required`);
    rule = rule
      .isString()
      .isLength({ min: minLength, max: maxLength })
      .trim()
      .escape();
    return rule;
  },

  // API key validation
  apiKey: (field = 'apikey', required = true) => {
    let rule = query(field);
    if (required) rule = rule.notEmpty().withMessage(`${field} is required`);
    rule = rule.isLength({ min: 10 }).withMessage('Invalid API key format');
    return rule;
  },

  // Numeric validation
  numeric: (field = 'page', required = false, min = 1, max = 1000) => {
    let rule = query(field);
    if (required) rule = rule.notEmpty().withMessage(`${field} is required`);
    rule = rule
      .isInt({ min, max })
      .withMessage(`${field} must be between ${min} and ${max}`)
      .toInt();
    return rule;
  }
};

/**
 * Validation middleware factory
 */
const validate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      await validation.run(req);
    }
    
    handleValidationErrors(req, res, next);
  };
};

/**
 * AI Endpoints Validations
 */
const aiValidations = {
  gemini: [
    query('text')
      .notEmpty().withMessage('Parameter text wajib diisi')
      .isString()
      .isLength({ min: 1, max: 5000 })
      .trim(),
    query('apikey')
      .notEmpty().withMessage('Parameter apikey wajib diisi')
      .isString()
      .isLength({ min: 10 })
      .trim(),
    handleValidationErrors
  ],
  
  geminiWithSystem: [
    query('text')
      .notEmpty().withMessage('Parameter text wajib diisi')
      .isString()
      .isLength({ min: 1, max: 5000 })
      .trim(),
    query('system')
      .notEmpty().withMessage('Parameter system wajib diisi')
      .isString()
      .isLength({ min: 1, max: 2000 })
      .trim(),
    query('apikey')
      .notEmpty().withMessage('Parameter apikey wajib diisi')
      .isString()
      .isLength({ min: 10 })
      .trim(),
    handleValidationErrors
  ]
};

/**
 * Downloader Validations
 */
const downloaderValidations = {
  videy: [
    query('url')
      .notEmpty().withMessage('Parameter url wajib diisi')
      .isURL({ require_protocol: true, protocols: ['http', 'https'] })
      .withMessage('Format URL tidak valid')
      .custom((value) => {
        if (!value.includes('videy.co') && !value.includes('=')) {
          throw new Error('URL harus berasal dari videy.co');
        }
        return true;
      }),
    handleValidationErrors
  ],
  
  threads: [
    query('url')
      .notEmpty().withMessage('Parameter url wajib diisi')
      .isURL({ require_protocol: true, protocols: ['http', 'https'] })
      .withMessage('Format URL tidak valid')
      .custom((value) => {
        if (!value.includes('threads.net')) {
          throw new Error('URL harus berasal dari threads.net');
        }
        return true;
      }),
    handleValidationErrors
  ]
};

/**
 * Tools Validations
 */
const toolsValidations = {
  ssweb: [
    query('url')
      .notEmpty().withMessage('Parameter url wajib diisi')
      .isURL({ require_protocol: true, protocols: ['http', 'https'] })
      .withMessage('Format URL tidak valid')
      .custom((value) => {
        if (value.length > 2000) {
          throw new Error('URL terlalu panjang');
        }
        return true;
      }),
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  validate,
  validations,
  aiValidations,
  downloaderValidations,
  toolsValidations
};
