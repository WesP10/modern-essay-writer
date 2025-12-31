import express from 'express';
import { authenticateUser } from '../../middleware/auth.js';
import { requireTokens, deductTokensAfterSuccess } from '../../middleware/tokenMiddleware.js';
import { validateRequest, generateSchema } from '../../middleware/validateRequest.js';
import { generatorService } from '../../services/generatorService.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

/**
 * POST /api/ai/generate
 * Generate text content
 */
router.post(
  '/',
  authenticateUser,
  requireTokens('generation'),
  validateRequest(generateSchema),
  async (req, res, next) => {
    try {
      const { 
        prompt, 
        essayHtml, 
        generationType = 'content', 
        tone = 'formal', 
        length = 'medium', 
        essayType = 'academic',
        temperature = 0.7,
        model
      } = req.body;

      logger.info('Generate request', {
        userId: req.userId,
        generationType,
        tone,
        length,
        essayType
      });

      let result;

      // Route to appropriate generator method
      if (generationType === 'outline') {
        const { topic, sections = 3 } = req.body;
        result = await generatorService.generateOutline({
          topic: topic || prompt,
          essayType,
          sections,
          model,
        });
      } else if (generationType === 'expand') {
        const { section, direction } = req.body;
        result = await generatorService.expandSection({
          section: section || prompt,
          direction: direction || 'add examples and details',
          essayHtml,
          model,
        });
      } else {
        // Default: generate content
        result = await generatorService.generate({
          prompt,
          essayType,
          tone,
          length,
          temperature,
          essayHtml,
          model,
        });
      }

      // Deduct tokens after successful generation
      const tokensRemaining = await deductTokensAfterSuccess(req, res, 'generation');

      res.json({
        success: true,
        generatedText: result.content || result.outline || result.expandedContent,
        metadata: result.metadata,
        tokensRemaining,
      });

      logger.info(`Generate completed: ${result.metadata.latency}ms`);
    } catch (error) {
      logger.error('Generate error:', error);
      next(error);
    }
  }
);

export default router;
