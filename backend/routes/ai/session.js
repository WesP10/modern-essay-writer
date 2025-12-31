import express from 'express';
import { authenticateUser } from '../../middleware/auth.js';
import { tokenService } from '../../services/tokenService.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

/**
 * POST /api/ai/session/init
 * Initialize user session on AI panel open
 */
router.post('/init', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    // Initialize session
    const result = await tokenService.initSession(userId);

    logger.info(`Session initialized for user ${userId}`);

    return res.json({
      success: true,
      tokensRemaining: result.tokensRemaining,
      sessionActive: result.sessionActive,
      canUseServices: result.canUseServices,
      message: 'Session initialized successfully',
    });
  } catch (error) {
    logger.error('Session init error:', error);
    return res.status(500).json({
      error: 'Session Initialization Failed',
      message: 'Failed to initialize AI session',
    });
  }
});

/**
 * GET /api/ai/session/status
 * Get current session status (tokens, rate limits, etc.)
 */
router.get('/status', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    // Get full status
    const status = await tokenService.getFullStatus(userId);
    
    // Check session activity
    const sessionStatus = await tokenService.getSessionStatus(userId);

    return res.json({
      success: true,
      tokensRemaining: status.tokensRemaining,
      sessionActive: sessionStatus.active,
      rateLimit: {
        minute: status.rateLimit.minute,
        hour: status.rateLimit.hour,
      },
      canUseServices: status.canUseServices,
    });
  } catch (error) {
    logger.error('Session status error:', error);
    return res.status(500).json({
      error: 'Failed to Get Status',
      message: 'Could not retrieve session status',
    });
  }
});

/**
 * POST /api/ai/session/refresh
 * Manually refresh session activity timestamp
 */
router.post('/refresh', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    await tokenService.refreshSession(userId);

    return res.json({
      success: true,
      message: 'Session refreshed',
    });
  } catch (error) {
    logger.error('Session refresh error:', error);
    return res.status(500).json({
      error: 'Refresh Failed',
      message: 'Could not refresh session',
    });
  }
});

export default router;
