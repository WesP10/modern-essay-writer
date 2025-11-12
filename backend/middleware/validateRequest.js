import Joi from 'joi';
import { ValidationError } from './errorHandler.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware factory to validate request body against Joi schema
 */
export function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Request validation failed:', { path: req.path, errors: details });

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request data',
        details
      });
    }

    // Replace req.body with validated value
    req.body = value;
    next();
  };
}

// Validation schemas for AI services

export const autocompleteSchema = Joi.object({
  prefix: Joi.string().allow('', null).optional().default('').max(50),
  context: Joi.string().allow('', null).optional().default('').max(5000),
  cursorPosition: Joi.number().integer().min(0).optional(),
  essayType: Joi.string().valid('argumentative', 'research', 'narrative', 'expository').optional(),
  enableLLM: Joi.boolean().optional().default(true),
  maxSuggestions: Joi.number().integer().min(1).max(20).optional().default(5),
  triggerType: Joi.string().valid('auto', 'keystroke', 'space', 'idle').optional().default('auto')
});

export const detectSchema = Joi.object({
  text: Joi.string().required().min(10).max(50000),
  granularity: Joi.string().valid('document', 'paragraph', 'sentence').default('document')
});

export const humanizeSchema = Joi.object({
  text: Joi.string().required().min(10).max(10000),
  context: Joi.string().max(5000).optional(),
  tone: Joi.string().valid('formal', 'casual', 'academic', 'creative').default('academic'),
  preserveMeaning: Joi.boolean().default(true),
  options: Joi.object({
    addPersonalTouch: Joi.boolean().default(false),
    simplifyLanguage: Joi.boolean().default(false),
    varyStructure: Joi.boolean().default(true)
  }).optional()
});

export const generateSchema = Joi.object({
  prompt: Joi.string().required().min(5).max(500),
  context: Joi.string().max(5000).optional(),
  insertPosition: Joi.number().integer().min(0).optional(),
  generationType: Joi.string()
    .valid('outline', 'paragraph', 'introduction', 'conclusion', 'custom')
    .default('custom'),
  tone: Joi.string().valid('formal', 'casual', 'academic', 'creative').default('academic'),
  length: Joi.string().valid('short', 'medium', 'long').default('medium'),
  essayType: Joi.string()
    .valid('argumentative', 'research', 'narrative', 'expository')
    .optional()
});

export default validateRequest;
