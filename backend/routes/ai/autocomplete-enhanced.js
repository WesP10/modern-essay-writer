/**
 * Example: Using Enhanced Autocomplete in API Route
 * 
 * This shows how to integrate the enhanced autocomplete service
 * into your existing Express routes
 */
import express from 'express';
import enhancedAutocompleteService from '../services/enhancedAutocompleteService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/ai/autocomplete
 * 
 * Enhanced autocomplete with multi-tier suggestions
 */
router.post('/autocomplete', async (req, res) => {
  try {
    const {
      prefix,
      context = '',
      cursorPosition,
      essayType,
      enableLLM = true, // Can be controlled by user settings
      maxSuggestions = 5
    } = req.body;

    // Validate input
    if (!prefix || prefix.length < 2) {
      return res.status(400).json({
        error: 'Prefix must be at least 2 characters',
        suggestions: []
      });
    }

    if (prefix.length > 50) {
      return res.status(400).json({
        error: 'Prefix too long (max 50 characters)',
        suggestions: []
      });
    }

    // Get suggestions from enhanced service
    const result = await enhancedAutocompleteService.getSuggestions({
      prefix,
      context,
      cursorPosition,
      essayType,
      enableLLM,
      maxSuggestions
    });

    // Log for analytics
    logger.info(`Autocomplete: "${prefix}" -> ${result.suggestions.length} suggestions (${result.latency}ms, tier ${result.tier})`);

    // Return results
    res.json({
      success: true,
      prefix,
      suggestions: result.suggestions,
      metadata: {
        latency: result.latency,
        cached: result.cached,
        tier: result.tier,
        count: result.suggestions.length
      }
    });

  } catch (error) {
    logger.error('Autocomplete error:', error);
    res.status(500).json({
      error: 'Autocomplete failed',
      message: error.message,
      suggestions: []
    });
  }
});

/**
 * POST /api/ai/autocomplete/record-selection
 * 
 * Record user's selection for learning
 */
router.post('/autocomplete/record-selection', async (req, res) => {
  try {
    const { suggestion, essayType } = req.body;

    if (!suggestion) {
      return res.status(400).json({
        error: 'Suggestion text required'
      });
    }

    // Record the selection
    enhancedAutocompleteService.recordSelection(suggestion, essayType);

    res.json({
      success: true,
      message: 'Selection recorded'
    });

  } catch (error) {
    logger.error('Record selection error:', error);
    res.status(500).json({
      error: 'Failed to record selection',
      message: error.message
    });
  }
});

/**
 * GET /api/ai/autocomplete/stats
 * 
 * Get service statistics (for admin/debugging)
 */
router.get('/autocomplete/stats', async (req, res) => {
  try {
    const stats = enhancedAutocompleteService.getStats();
    
    res.json({
      success: true,
      stats: {
        cacheSize: stats.cacheSize,
        llmCacheSize: stats.llmCacheSize,
        userPreferences: stats.userPreferences,
        ngramContexts: stats.ngramContexts
      }
    });

  } catch (error) {
    logger.error('Stats error:', error);
    res.status(500).json({
      error: 'Failed to get stats',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/autocomplete/clear-cache
 * 
 * Clear all caches (for admin/debugging)
 */
router.post('/autocomplete/clear-cache', async (req, res) => {
  try {
    enhancedAutocompleteService.clearCache();
    
    res.json({
      success: true,
      message: 'All caches cleared'
    });

  } catch (error) {
    logger.error('Clear cache error:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

export default router;
