import express from 'express';
import { authenticateUser } from '../../middleware/auth.js';
import { requireTokens, deductTokensAfterSuccess } from '../../middleware/tokenMiddleware.js';
import { citationService } from '../../services/citationService.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

/**
 * POST /api/ai/citations/extract
 * Extract citations from essay text
 */
router.post('/extract', authenticateUser, requireTokens('citations'), async (req, res, next) => {
  try {
    const { text, essayHtml, model } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Text is required',
      });
    }

    logger.info('Citation extraction request', { userId: req.userId });

    const result = await citationService.extractCitations({
      text,
      essayHtml,
      model,
    });

    // Deduct tokens after successful extraction
    const tokensRemaining = await deductTokensAfterSuccess(req, res, 'citations');

    res.json({
      ...result,
      tokensRemaining,
    });

    logger.info(`Citation extraction completed: ${result.metadata.citationsFound} citations found`);
  } catch (error) {
    logger.error('Citation extraction error:', error);
    next(error);
  }
});

/**
 * POST /api/ai/citations/format
 * Format citations in specified style
 */
router.post('/format', authenticateUser, requireTokens('citations'), async (req, res, next) => {
  try {
    const { citations, style = 'APA', model } = req.body;

    if (!citations || !Array.isArray(citations)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Citations array is required',
      });
    }

    logger.info('Citation formatting request', { userId: req.userId, style });

    const result = await citationService.formatCitations({
      citations,
      style,
      model,
    });

    // Deduct tokens after successful formatting
    const tokensRemaining = await deductTokensAfterSuccess(req, res, 'citations');

    res.json({
      ...result,
      tokensRemaining,
    });

    logger.info(`Citation formatting completed in ${style} style`);
  } catch (error) {
    logger.error('Citation formatting error:', error);
    next(error);
  }
});

/**
 * POST /api/ai/citations/generate
 * Generate bibliography from citations
 */
router.post('/generate', authenticateUser, requireTokens('citations'), async (req, res, next) => {
  try {
    const { citations, style = 'APA', sortBy = 'alphabetical', model } = req.body;

    if (!citations || !Array.isArray(citations)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Citations array is required',
      });
    }

    logger.info('Bibliography generation request', { userId: req.userId, style });

    const result = await citationService.generateBibliography({
      citations,
      style,
      sortBy,
      model,
    });

    // Deduct tokens after successful generation
    const tokensRemaining = await deductTokensAfterSuccess(req, res, 'citations');

    res.json({
      ...result,
      tokensRemaining,
    });

    logger.info('Bibliography generation completed');
  } catch (error) {
    logger.error('Bibliography generation error:', error);
    next(error);
  }
});

/**
 * POST /api/ai/citations/validate
 * Validate citation completeness
 */
router.post('/validate', authenticateUser, async (req, res, next) => {
  try {
    const { citation, style = 'APA', model } = req.body;

    if (!citation) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Citation object is required',
      });
    }

    logger.info('Citation validation request', { userId: req.userId });

    const result = await citationService.validateCitation({
      citation,
      style,
      model,
    });

    res.json(result);

    logger.info('Citation validation completed');
  } catch (error) {
    logger.error('Citation validation error:', error);
    next(error);
  }
});

/**
 * POST /api/ai/citations/suggest
 * Suggest in-text citation placement
 */
router.post('/suggest', authenticateUser, async (req, res, next) => {
  try {
    const { sentence, sourceInfo, style = 'APA', model } = req.body;

    if (!sentence || !sourceInfo) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Sentence and sourceInfo are required',
      });
    }

    logger.info('In-text citation suggestion request', { userId: req.userId });

    const result = await citationService.suggestInTextCitation({
      sentence,
      sourceInfo,
      style,
      model,
    });

    res.json(result);

    logger.info('In-text citation suggestion completed');
  } catch (error) {
    logger.error('In-text citation suggestion error:', error);
    next(error);
  }
});

export default router;
