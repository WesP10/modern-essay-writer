import rateLimit from 'express-rate-limit';
import { RateLimitError } from './errorHandler.js';
import { logger } from '../utils/logger.js';

// Rate limit configurations for different AI services
export const RATE_LIMITS = {
  autocomplete: {
    windowMs: 60_000, // 1 minute
    max: 120, // 120 requests per minute (2/sec)
    message: 'Too many autocomplete requests. Please slow down.'
  },
  detect: {
    windowMs: 60_000,
    max: 10, // 10 scans per minute
    message: 'Too many detection requests. Please wait before scanning again.'
  },
  humanize: {
    windowMs: 60_000,
    max: 20, // 20 rewrites per minute
    message: 'Too many humanize requests. Please wait before rewriting again.'
  },
  generate: {
    windowMs: 60_000,
    max: 15, // 15 generations per minute
    message: 'Too many generation requests. Please wait before generating more content.'
  },
  general: {
    windowMs: 60_000,
    max: 100, // 100 requests per minute for general API
    message: 'Too many requests. Please try again later.'
  }
};

/**
 * Create rate limiter middleware for specific service
 */
function createRateLimiter(config) {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: { error: 'Rate Limit Exceeded', message: config.message },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for ${req.path} by ${req.ip}`);
      res.status(429).json({
        error: 'Rate Limit Exceeded',
        message: config.message,
        retryAfter: Math.ceil(config.windowMs / 1000)
      });
    },
    skip: (req) => {
      // Skip rate limiting in development if needed
      return process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true';
    }
  });
}

// Export individual rate limiters
export const autocompleteLimiter = createRateLimiter(RATE_LIMITS.autocomplete);
export const detectLimiter = createRateLimiter(RATE_LIMITS.detect);
export const humanizeLimiter = createRateLimiter(RATE_LIMITS.humanize);
export const generateLimiter = createRateLimiter(RATE_LIMITS.generate);
export const generalLimiter = createRateLimiter(RATE_LIMITS.general);

export default {
  autocompleteLimiter,
  detectLimiter,
  humanizeLimiter,
  generateLimiter,
  generalLimiter
};
