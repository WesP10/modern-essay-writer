import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/auth/verify
 * Verify JWT token
 */
router.post('/verify', authenticateUser, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: {
      id: req.user.id,
      email: req.user.email
    }
  });
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticateUser, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      created_at: req.user.created_at
    }
  });
});

export default router;
