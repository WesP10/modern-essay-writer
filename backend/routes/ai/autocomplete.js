import express from 'express';
import { optionalAuth } from '../../middleware/auth.js';
import { autocompleteLimiter } from '../../middleware/rateLimiter.js';
import { validateRequest, autocompleteSchema } from '../../middleware/validateRequest.js';
import { logger } from '../../utils/logger.js';
import autocompleteOrchestrator from '../../services/autocomplete/AutocompleteOrchestrator.js';

const router = express.Router();

/**
 * POST /api/ai/autocomplete
 * Get autocomplete suggestions using new orchestrator architecture
 */
router.post(
  '/',
  optionalAuth,
  autocompleteLimiter,
  validateRequest(autocompleteSchema),
  async (req, res, next) => {
    const startTime = Date.now();
    
    try {
      const { 
        prefix, 
        context, 
        cursorPosition, 
        essayType,
        enableLLM = true,
        maxSuggestions = 5,
        triggerType = 'auto'
      } = req.body;

      logger.info('Autocomplete request', {
        userId: req.userId || 'anonymous',
        prefix: prefix?.substring(0, 10) || '',
        essayType,
        contextLength: context?.length || 0,
        triggerType
      });

      // Use context as full text (it already includes the prefix/current word)
      // If no context provided, fall back to just the prefix
      const text = context || prefix || '';
      const position = cursorPosition !== undefined ? cursorPosition : text.length;

      // Get suggestions from orchestrator
      const result = await autocompleteOrchestrator.getSuggestions({
        text,
        cursorPosition: position,
        essayType,
        triggerType,
        enableLLM,
        maxSuggestions
      });

      logger.info(`Autocomplete completed in ${result.latency}ms (engine: ${result.engine})`, {
        suggestionCount: result.suggestions.length,
        engines: result.engines.join('+')
      });

      // Return in expected format
      res.json({
        success: true,
        prefix: prefix || '',
        suggestions: result.suggestions,
        metadata: {
          latency: result.latency,
          engine: result.engine,
          engines: result.engines,
          count: result.suggestions.length,
          ...result.metadata
        }
      });
    } catch (error) {
      logger.error('Autocomplete error:', error);
      next(error);
    }
  }
);

/**
 * POST /api/ai/autocomplete/record-selection
 * Record user's selection for learning (placeholder for future)
 */
router.post('/record-selection', optionalAuth, async (req, res, next) => {
  try {
    const { suggestion, essayType } = req.body;

    if (!suggestion) {
      return res.status(400).json({
        error: 'Suggestion text required'
      });
    }

    // TODO: Implement learning/feedback mechanism
    logger.debug('Selection recorded', { suggestion, essayType });

    res.json({
      success: true,
      message: 'Selection recorded'
    });

  } catch (error) {
    logger.error('Record selection error:', error);
    next(error);
  }
});

/**
 * GET /api/ai/autocomplete/stats
 * Get comprehensive statistics from all engines
 */
router.get('/stats', optionalAuth, async (req, res, next) => {
  try {
    const stats = autocompleteOrchestrator.getStats();
    
    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Stats error:', error);
    next(error);
  }
});

/**
 * POST /api/ai/autocomplete/clear-cache
 * Clear all autocomplete caches
 */
router.post('/clear-cache', optionalAuth, async (req, res, next) => {
  try {
    autocompleteOrchestrator.clearCaches();
    
    res.json({
      success: true,
      message: 'All caches cleared'
    });

  } catch (error) {
    logger.error('Clear cache error:', error);
    next(error);
  }
});

export default router;
