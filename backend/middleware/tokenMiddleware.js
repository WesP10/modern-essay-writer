import { tokenService } from '../services/tokenService.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to check if user has sufficient tokens for a service
 * @param {string} service - Service name (generation, humanizer, detector, citations)
 * @returns {Function} - Express middleware function
 */
export function requireTokens(service) {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated (should be called after authenticateUser)
      if (!req.userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const userId = req.userId;

      // Check rate limits first
      const rateLimitStatus = await tokenService.checkRateLimits(userId);
      if (rateLimitStatus.limited) {
        logger.warn(`Rate limit exceeded for user ${userId}`);
        return res.status(429).json({
          error: 'Rate Limit Exceeded',
          message: 'Too many requests. Please wait before trying again.',
          rateLimit: {
            minute: rateLimitStatus.minute,
            hour: rateLimitStatus.hour,
          },
        });
      }

      // Check token availability
      const tokenStatus = await tokenService.checkTokens(userId, service);
      if (!tokenStatus.hasTokens) {
        logger.warn(`Insufficient tokens for user ${userId} (service: ${service})`);
        return res.status(402).json({
          error: 'Insufficient Tokens',
          message: `You need ${tokenStatus.required} tokens to use this service. You have ${tokenStatus.remaining} tokens remaining.`,
          tokensRequired: tokenStatus.required,
          tokensRemaining: tokenStatus.remaining,
        });
      }

      // Attach token info to request
      req.tokenInfo = {
        service,
        required: tokenStatus.required,
        remaining: tokenStatus.remaining,
      };

      // Refresh session activity
      await tokenService.refreshSession(userId);

      next();
    } catch (error) {
      logger.error('Token middleware error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check token status',
      });
    }
  };
}

/**
 * Middleware to deduct tokens after successful service execution
 * Call this AFTER the service completes successfully
 */
export async function deductTokensAfterSuccess(req, res, service) {
  try {
    if (!req.userId) {
      logger.warn('Cannot deduct tokens: No user ID');
      return;
    }

    const userId = req.userId;

    // Deduct tokens
    const result = await tokenService.deductTokens(userId, service);
    
    if (!result.success) {
      logger.error(`Failed to deduct tokens for user ${userId}`);
      return;
    }

    // Increment rate limits
    await tokenService.incrementRateLimits(userId);

    logger.info(`Deducted tokens for ${service}: user ${userId} has ${result.remaining} remaining`);
    
    return result.remaining;
  } catch (error) {
    logger.error('Error deducting tokens:', error);
  }
}

/**
 * Middleware to attach session state to request
 */
export async function attachSessionState(req, res, next) {
  try {
    if (!req.userId) {
      req.sessionActive = false;
      return next();
    }

    const sessionStatus = await tokenService.getSessionStatus(req.userId);
    req.sessionActive = sessionStatus.active;
    req.lastActivity = sessionStatus.lastActivity;

    next();
  } catch (error) {
    logger.error('Session state middleware error:', error);
    req.sessionActive = false;
    next();
  }
}
