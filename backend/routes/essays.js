import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import essayService from '../services/essayService.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * GET /api/essays
 * Get all essays for authenticated user
 */
router.get('/', authenticateUser, async (req, res, next) => {
  try {
    const essays = await essayService.getUserEssays(req.userId);
    res.json({ essays });
  } catch (error) {
    logger.error('Error fetching essays:', error);
    next(error);
  }
});

/**
 * GET /api/essays/:id
 * Get specific essay
 */
router.get('/:id', authenticateUser, async (req, res, next) => {
  try {
    const essay = await essayService.getEssay(req.params.id, req.userId);

    if (!essay) {
      throw new NotFoundError('Essay not found');
    }

    res.json({ essay });
  } catch (error) {
    logger.error('Error fetching essay:', error);
    next(error);
  }
});

/**
 * POST /api/essays
 * Create new essay
 */
router.post('/', authenticateUser, async (req, res, next) => {
  try {
    const { id, title, content, word_count, char_count, created_at } = req.body;

    const essay = await essayService.createEssay(req.userId, {
      id,
      title,
      content,
      word_count,
      char_count,
      created_at
    });

    res.status(201).json({ essay });
  } catch (error) {
    logger.error('Error creating essay:', error);
    next(error);
  }
});

/**
 * PUT /api/essays/:id/sync
 * Create or update essay (upsert)
 */
router.put('/:id/sync', authenticateUser, async (req, res, next) => {
  try {
    const { title, content, word_count, char_count, created_at } = req.body;

    const essay = await essayService.createOrUpdateEssay(req.userId, req.params.id, {
      title,
      content,
      word_count,
      char_count,
      created_at
    });

    res.json({ essay });
  } catch (error) {
    logger.error('Error syncing essay:', error);
    next(error);
  }
});

/**
 * PUT /api/essays/:id
 * Update essay
 */
router.put('/:id', authenticateUser, async (req, res, next) => {
  try {
    const { title, content, word_count, char_count } = req.body;

    const essay = await essayService.updateEssay(req.params.id, req.userId, {
      title,
      content,
      word_count,
      char_count
    });

    if (!essay) {
      throw new NotFoundError('Essay not found');
    }

    res.json({ essay });
  } catch (error) {
    logger.error('Error updating essay:', error);
    next(error);
  }
});

/**
 * DELETE /api/essays/:id
 * Delete essay
 */
router.delete('/:id', authenticateUser, async (req, res, next) => {
  try {
    const success = await essayService.deleteEssay(req.params.id, req.userId);

    if (!success) {
      throw new NotFoundError('Essay not found');
    }

    res.json({ message: 'Essay deleted successfully' });
  } catch (error) {
    logger.error('Error deleting essay:', error);
    next(error);
  }
});

/**
 * GET /api/essays/:id/versions
 * Get version history for an essay
 */
router.get('/:id/versions', authenticateUser, async (req, res, next) => {
  try {
    const versions = await essayService.getVersions(req.params.id, req.userId);

    if (versions === null) {
      throw new NotFoundError('Essay not found');
    }

    res.json({ versions });
  } catch (error) {
    logger.error('Error fetching versions:', error);
    next(error);
  }
});

/**
 * POST /api/essays/:id/restore/:versionId
 * Restore a specific version
 */
router.post('/:id/restore/:versionId', authenticateUser, async (req, res, next) => {
  try {
    const essay = await essayService.restoreVersion(
      req.params.id, 
      req.params.versionId, 
      req.userId
    );

    if (!essay) {
      throw new NotFoundError('Essay or version not found');
    }

    res.json({ essay, message: 'Version restored successfully' });
  } catch (error) {
    logger.error('Error restoring version:', error);
    next(error);
  }
});

export default router;
