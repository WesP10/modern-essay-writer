import express from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { tokenService } from '../services/tokenService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/admin/tokens/grant
 * Manually grant tokens to a user
 */
router.post('/tokens/grant', authenticateUser, requireAdmin, async (req, res, next) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Valid userId and positive amount are required',
      });
    }

    logger.info(`Admin ${req.userId} granting ${amount} tokens to user ${userId}`);

    const result = await tokenService.grantTokens(userId, amount);

    res.json({
      success: result.success,
      userId,
      tokensGranted: amount,
      newBalance: result.newBalance,
      message: `Successfully granted ${amount} tokens to user ${userId}`,
    });

    logger.info(`Tokens granted: ${amount} to ${userId} (new balance: ${result.newBalance})`);
  } catch (error) {
    logger.error('Token grant error:', error);
    next(error);
  }
});

/**
 * POST /api/admin/tokens/reset
 * Reset user tokens to initial amount
 */
router.post('/tokens/reset', authenticateUser, requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'userId is required',
      });
    }

    logger.info(`Admin ${req.userId} resetting tokens for user ${userId}`);

    const result = await tokenService.resetTokens(userId);

    res.json({
      success: result.success,
      userId,
      newBalance: result.newBalance,
      message: `Successfully reset tokens for user ${userId}`,
    });

    logger.info(`Tokens reset for ${userId} (new balance: ${result.newBalance})`);
  } catch (error) {
    logger.error('Token reset error:', error);
    next(error);
  }
});

/**
 * POST /api/admin/ratelimit/adjust
 * Adjust rate limits for a specific user
 * NOTE: Placeholder implementation - rate limit adjustment logic to be implemented
 */
router.post('/ratelimit/adjust', authenticateUser, requireAdmin, async (req, res, next) => {
  try {
    const { userId, minuteLimit, hourLimit } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'userId is required',
      });
    }

    logger.info(`Admin ${req.userId} adjusting rate limits for user ${userId}`);

    // TODO: Implement custom rate limit adjustment in Redis
    // For now, return success message
    res.json({
      success: true,
      userId,
      message: 'Rate limit adjustment feature coming soon',
      note: 'This is a placeholder endpoint. Custom per-user rate limits will be implemented in a future update.',
      requestedLimits: { minuteLimit, hourLimit },
    });

    logger.info(`Rate limit adjustment requested for ${userId} (placeholder response)`);
  } catch (error) {
    logger.error('Rate limit adjustment error:', error);
    next(error);
  }
});

/**
 * GET /api/admin/usage/stats
 * View system-wide usage statistics
 * NOTE: Placeholder implementation - full analytics to be implemented
 */
router.get('/usage/stats', authenticateUser, requireAdmin, async (req, res, next) => {
  try {
    logger.info(`Admin ${req.userId} requesting usage stats`);

    // TODO: Implement comprehensive usage statistics
    // Would include: total users, tokens consumed, service usage breakdown, etc.
    
    res.json({
      success: true,
      message: 'Usage statistics feature coming soon',
      note: 'This is a placeholder endpoint. Full analytics dashboard will be implemented in a future update.',
      placeholder: {
        totalUsers: 0,
        totalTokensConsumed: 0,
        serviceBreakdown: {
          generation: 0,
          humanizer: 0,
          detector: 0,
          citations: 0,
        },
        lastUpdated: new Date().toISOString(),
      },
    });

    logger.info('Usage stats requested (placeholder response)');
  } catch (error) {
    logger.error('Usage stats error:', error);
    next(error);
  }
});

/**
 * POST /api/admin/users/reset
 * Reset user tokens and session
 */
router.post('/users/reset', authenticateUser, requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'userId is required',
      });
    }

    logger.info(`Admin ${req.userId} performing full reset for user ${userId}`);

    // Reset tokens
    const tokenResult = await tokenService.resetTokens(userId);

    // TODO: Could also clear rate limit counters, session data, etc.

    res.json({
      success: true,
      userId,
      tokensReset: tokenResult.success,
      newTokenBalance: tokenResult.newBalance,
      message: `Successfully reset user ${userId}`,
    });

    logger.info(`Full reset completed for ${userId}`);
  } catch (error) {
    logger.error('User reset error:', error);
    next(error);
  }
});

/**
 * GET /api/admin/user/:userId/status
 * Get detailed status for a specific user
 */
router.get('/user/:userId/status', authenticateUser, requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;

    logger.info(`Admin ${req.userId} requesting status for user ${userId}`);

    const status = await tokenService.getFullStatus(userId);
    const sessionStatus = await tokenService.getSessionStatus(userId);

    res.json({
      success: true,
      userId,
      tokensRemaining: status.tokensRemaining,
      rateLimit: status.rateLimit,
      canUseServices: status.canUseServices,
      session: {
        active: sessionStatus.active,
        lastActivity: sessionStatus.lastActivity,
      },
    });

    logger.info(`User status retrieved for ${userId}`);
  } catch (error) {
    logger.error('User status error:', error);
    next(error);
  }
});

export default router;
