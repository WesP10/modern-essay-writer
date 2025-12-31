import express from 'express';
import { authenticateUser } from '../../middleware/auth.js';
import { requireTokens, deductTokensAfterSuccess } from '../../middleware/tokenMiddleware.js';
import { validateRequest, humanizeSchema } from '../../middleware/validateRequest.js';
import { humanizerService } from '../../services/humanizerService.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

/**
 * POST /api/ai/humanize
 * Humanize AI-generated text
 */
router.post(
  '/',
  authenticateUser,
  requireTokens('humanizer'),
  validateRequest(humanizeSchema),
  async (req, res, next) => {
    try {
      const { text, essayHtml, tone = 'academic', preserveMeaning = true, model } = req.body;

      if (!text) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Text is required',
        });
      }

      logger.info('Humanize request', {
        userId: req.userId,
        textLength: text.length,
        tone,
      });

      const result = await humanizerService.humanize({
        text,
        tone,
        preserveMeaning,
        essayHtml,
        model,
      });

      // Deduct tokens after successful humanization
      const tokensRemaining = await deductTokensAfterSuccess(req, res, 'humanizer');

      res.json({
        success: true,
        originalText: result.originalText,
        humanizedText: result.humanizedText,
        improvement: result.improvement,
        metadata: result.metadata,
        tokensRemaining,
      });

      logger.info(`Humanize completed in ${result.metadata.latency}ms`);
    } catch (error) {
      logger.error('Humanize error:', error);
      next(error);
    }
  }
);

/**
 * POST /api/ai/humanize/tone
 * Adjust tone of text
 */
router.post(
  '/tone',
  authenticateUser,
  requireTokens('humanizer'),
  async (req, res, next) => {
    try {
      const { text, fromTone, toTone, model } = req.body;

      if (!text || !fromTone || !toTone) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Text, fromTone, and toTone are required',
        });
      }

      logger.info('Tone adjustment request', { userId: req.userId, fromTone, toTone });

      const result = await humanizerService.adjustTone({
        text,
        fromTone,
        toTone,
        model,
      });

      // Deduct tokens after successful adjustment
      const tokensRemaining = await deductTokensAfterSuccess(req, res, 'humanizer');

      res.json({
        ...result,
        tokensRemaining,
      });

      logger.info(`Tone adjustment completed in ${result.metadata.latency}ms`);
    } catch (error) {
      logger.error('Tone adjustment error:', error);
      next(error);
    }
  }
);

export default router;
