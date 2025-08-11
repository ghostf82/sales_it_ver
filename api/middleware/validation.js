const Joi = require('joi');

/**
 * Validation middleware factory
 * Creates middleware to validate request body against Joi schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      return res.status(400).json({
        success: false,
        error: `Validation error: ${errorMessage}`
      });
    }

    req.body = value;
    next();
  };
};

// Common validation schemas
const schemas = {
  representative: Joi.object({
    name: Joi.string().required().min(2).max(100),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional().pattern(/^[+]?[0-9\s\-()]+$/)
  }),

  sale: Joi.object({
    representative_id: Joi.string().uuid().required(),
    company_id: Joi.string().uuid().required(),
    category: Joi.string().required().min(1).max(100),
    sales: Joi.number().min(0).required(),
    target: Joi.number().min(0).required(),
    year: Joi.number().integer().min(2020).max(2030).required(),
    month: Joi.number().integer().min(1).max(12).required()
  }),

  commissionRule: Joi.object({
    category: Joi.string().required().min(1).max(100),
    tier1_from: Joi.number().min(0).max(100).required(),
    tier1_to: Joi.number().min(0).max(100).required(),
    tier1_rate: Joi.number().min(0).max(1).required(),
    tier2_from: Joi.number().min(0).max(100).required(),
    tier2_to: Joi.number().min(0).max(100).required(),
    tier2_rate: Joi.number().min(0).max(1).required(),
    tier3_from: Joi.number().min(0).max(100).required(),
    tier3_rate: Joi.number().min(0).max(1).required()
  }),

  collection: Joi.object({
    representative_id: Joi.string().uuid().required(),
    company_id: Joi.string().uuid().required(),
    year: Joi.number().integer().min(2020).max(2030).required(),
    month: Joi.number().integer().min(1).max(12).required(),
    amount: Joi.number().min(0).required()
  })
};

module.exports = {
  validate,
  schemas
};