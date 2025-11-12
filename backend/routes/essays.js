import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { supabase } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * GET /api/essays
 * Get all essays for authenticated user
 */
router.get('/', authenticateUser, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('essays')
      .select('*')
      .eq('user_id', req.userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json({ essays: data || [] });
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
    const { data, error } = await supabase
      .from('essays')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (error || !data) {
      throw new NotFoundError('Essay not found');
    }

    res.json({ essay: data });
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
    const { title, content, word_count, char_count } = req.body;

    const { data, error } = await supabase
      .from('essays')
      .insert({
        user_id: req.userId,
        title,
        content,
        word_count: word_count || 0,
        char_count: char_count || 0
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ essay: data });
  } catch (error) {
    logger.error('Error creating essay:', error);
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

    const { data, error } = await supabase
      .from('essays')
      .update({
        title,
        content,
        word_count,
        char_count,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundError('Essay not found');
    }

    res.json({ essay: data });
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
    const { error } = await supabase
      .from('essays')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);

    if (error) throw error;

    res.json({ message: 'Essay deleted successfully' });
  } catch (error) {
    logger.error('Error deleting essay:', error);
    next(error);
  }
});

export default router;
