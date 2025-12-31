import express from 'express';
import { authenticateUser } from '../../middleware/auth.js';
import { requireTokens, deductTokensAfterSuccess } from '../../middleware/tokenMiddleware.js';
import { validateRequest, detectSchema } from '../../middleware/validateRequest.js';
import { detectorService } from '../../services/detectorService.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

/**
 * POST /api/ai/detect
 * Detect AI-generated content
 */
router.post(
  '/',
  authenticateUser,
  requireTokens('detector'),
  validateRequest(detectSchema),
  async (req, res, next) => {
    try {
      const { text, essayHtml, granularity = 'standard', model } = req.body;

      if (!text) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Text is required',
        });
      }

      logger.info('AI detection request', {
        userId: req.userId,
        textLength: text.length,
        granularity,
      });

      let result;

      if (granularity === 'detailed') {
        // Detailed section-by-section analysis
        result = await detectorService.detectDetailed({ text, model });
        
        // Also get overall analysis
        const overallResult = await detectorService.detect({ text, essayHtml, model });
        result = {
          ...overallResult,
          sections: result.sections,
        };
      } else {
        // Standard analysis
        result = await detectorService.detect({ text, essayHtml, model });
      }

      // Deduct tokens after successful detection
      const tokensRemaining = await deductTokensAfterSuccess(req, res, 'detector');

      res.json({
        ...result,
        tokensRemaining,
      });

      logger.info(`AI detection completed in ${result.metadata.latency}ms (confidence: ${result.confidence}%)`);
    } catch (error) {
      logger.error('AI detection error:', error);
      next(error);
    }
  }
);

/**
 * POST /api/ai/detect/compare
 * Compare two texts to determine which is more AI-like
 */
router.post(
  '/compare',
  authenticateUser,
  requireTokens('detector'),
  async (req, res, next) => {
    try {
      const { text1, text2, model } = req.body;

      if (!text1 || !text2) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Both text1 and text2 are required',
        });
      }

      logger.info('AI detection comparison request', { userId: req.userId });

      const result = await detectorService.compareTexts({ text1, text2, model });

      // Deduct tokens after successful comparison
      const tokensRemaining = await deductTokensAfterSuccess(req, res, 'detector');

      res.json({
        ...result,
        tokensRemaining,
      });

      logger.info('AI detection comparison completed');
    } catch (error) {
      logger.error('AI detection comparison error:', error);
      next(error);
    }
  }
);

/**
 * POST /api/ai/detect/explain
 * Get educational explanation of flagged patterns
 */
router.post(
  '/explain',
  authenticateUser,
  async (req, res, next) => {
    try {
      const { text, flaggedPatterns, model } = req.body;

      if (!text || !flaggedPatterns) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Text and flaggedPatterns are required',
        });
      }

      logger.info('AI detection explanation request', { userId: req.userId });

      const result = await detectorService.explainDetection({ text, flaggedPatterns, model });

      res.json(result);

      logger.info('AI detection explanation completed');
    } catch (error) {
      logger.error('AI detection explanation error:', error);
      next(error);
    }
  }
);

export default router;
