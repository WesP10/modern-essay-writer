import { logger } from '../../utils/logger.js';

/**
 * NgramEngine - Phrase prediction using n-gram models
 * Target latency: <50ms
 * Purpose: Phrase-level completion after word boundaries (space pressed)
 */
class NgramEngine {
  constructor() {
    this.bigrams = new Map();
    this.trigrams = new Map();
    this.fourgrams = new Map();
    this.fivegrams = new Map();
    
    // Smoothing parameters (Kneser-Ney)
    this.delta = 0.75; // Discount parameter
    this.cache = new Map();
    this.maxCacheSize = 500;
    this.totalQueries = 0;
    this.cacheHits = 0;
    
    logger.info('NgramEngine initialized');
  }

  /**
   * Load n-gram models from data
   * @param {Object} data - Object with bigrams, trigrams, fourgrams, fivegrams
   */
  load(data) {
    const startTime = Date.now();
    
    if (data.bigrams) {
      this.loadBigrams(data.bigrams);
    }
    
    if (data.trigrams) {
      this.loadTrigrams(data.trigrams);
    }
    
    if (data.fourgrams) {
      this.loadFourgrams(data.fourgrams);
    }
    
    if (data.fivegrams) {
      this.loadFivegrams(data.fivegrams);
    }
    
    const duration = Date.now() - startTime;
    logger.info(`NgramEngine: Loaded n-grams in ${duration}ms`, {
      bigrams: this.bigrams.size,
      trigrams: this.trigrams.size,
      fourgrams: this.fourgrams.size,
      fivegrams: this.fivegrams.size
    });
  }

  /**
   * Load bigrams into Map
   * @private
   */
  loadBigrams(bigrams) {
    for (const [key, values] of Object.entries(bigrams)) {
      this.bigrams.set(key.toLowerCase(), values);
    }
  }

  /**
   * Load trigrams into Map
   * @private
   */
  loadTrigrams(trigrams) {
    for (const [key, values] of Object.entries(trigrams)) {
      this.trigrams.set(key.toLowerCase(), values);
    }
  }

  /**
   * Load fourgrams into Map
   * @private
   */
  loadFourgrams(fourgrams) {
    for (const [key, values] of Object.entries(fourgrams)) {
      this.fourgrams.set(key.toLowerCase(), values);
    }
  }

  /**
   * Load fivegrams into Map
   * @private
   */
  loadFivegrams(fivegrams) {
    for (const [key, values] of Object.entries(fivegrams)) {
      this.fivegrams.set(key.toLowerCase(), values);
    }
  }

  /**
   * Get phrase predictions based on context
   * @param {string} context - The text before cursor
   * @param {string} prefix - Current word being typed (optional)
   * @param {number} limit - Maximum number of suggestions
   * @returns {Array} - Array of phrase suggestions
   */
  predict(context, prefix = '', limit = 5) {
    const startTime = Date.now();
    this.totalQueries++;
    
    if (!context || context.trim().length === 0) {
      return [];
    }
    
    // Extract last N words from context
    const words = this.tokenize(context);
    if (words.length === 0) {
      return [];
    }
    
    // Check cache
    const cacheKey = this.getCacheKey(words, prefix);
    if (this.cache.has(cacheKey)) {
      this.cacheHits++;
      return this.cache.get(cacheKey);
    }
    
    // Try different n-gram orders (highest first for better context)
    const suggestions = [];
    
    // 5-gram (4 words context)
    if (words.length >= 4) {
      const key4 = words.slice(-4).join('_');
      suggestions.push(...this.getPredictions(this.fivegrams, key4, prefix, 0.95));
    }
    
    // 4-gram (3 words context)
    if (words.length >= 3) {
      const key3 = words.slice(-3).join('_');
      suggestions.push(...this.getPredictions(this.fourgrams, key3, prefix, 0.90));
    }
    
    // Trigram (2 words context)
    if (words.length >= 2) {
      const key2 = words.slice(-2).join('_');
      suggestions.push(...this.getPredictions(this.trigrams, key2, prefix, 0.85));
    }
    
    // Bigram (1 word context)
    const key1 = words[words.length - 1];
    suggestions.push(...this.getPredictions(this.bigrams, key1, prefix, 0.80));
    
    // Deduplicate and rank
    const ranked = this.rankSuggestions(suggestions, limit);
    
    // Cache result
    this.cacheResult(cacheKey, ranked);
    
    const duration = Date.now() - startTime;
    
    if (duration > 50) {
      logger.warn(`NgramEngine: Slow query took ${duration}ms`);
    }
    
    return ranked;
  }

  /**
   * Get predictions from specific n-gram map
   * @private
   */
  getPredictions(ngramMap, key, prefix, baseConfidence) {
    const predictions = ngramMap.get(key.toLowerCase());
    
    if (!predictions || predictions.length === 0) {
      return [];
    }
    
    // Filter by prefix if provided
    let filtered = predictions;
    if (prefix && prefix.length > 0) {
      const lowerPrefix = prefix.toLowerCase();
      filtered = predictions.filter(pred => {
        // Check if prediction starts with prefix
        if (typeof pred === 'string') {
          return pred.toLowerCase().startsWith(lowerPrefix);
        }
        // Handle {text, count} format
        return pred.text && pred.text.toLowerCase().startsWith(lowerPrefix);
      });
    }
    
    // Convert to suggestion format
    return filtered.slice(0, 5).map((pred, index) => {
      let text, count;
      
      if (typeof pred === 'string') {
        text = pred;
        count = 1;
      } else {
        text = pred.text;
        count = pred.count || 1;
      }
      
      // Calculate confidence with frequency weighting
      const freqBoost = Math.log10(count + 1) / 4;
      const positionPenalty = index * 0.02; // Small penalty for lower positions
      const confidence = Math.min(0.98, baseConfidence + freqBoost - positionPenalty);
      
      return {
        text,
        confidence,
        type: 'phrase',
        source: 'ngram',
        count
      };
    });
  }

  /**
   * Tokenize context into words
   * @private
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 0)
      .slice(-5); // Keep last 5 words max for context
  }

  /**
   * Rank and deduplicate suggestions
   * @private
   */
  rankSuggestions(suggestions, limit) {
    // Deduplicate by text (keep highest confidence)
    const map = new Map();
    
    for (const sug of suggestions) {
      const key = sug.text.toLowerCase();
      if (!map.has(key) || map.get(key).confidence < sug.confidence) {
        map.set(key, sug);
      }
    }
    
    // Sort by confidence
    const unique = Array.from(map.values());
    unique.sort((a, b) => b.confidence - a.confidence);
    
    return unique.slice(0, limit);
  }

  /**
   * Generate cache key
   * @private
   */
  getCacheKey(words, prefix) {
    const contextKey = words.slice(-4).join('_');
    return `${contextKey}:${prefix}`;
  }

  /**
   * Cache result with LRU eviction
   * @private
   */
  cacheResult(key, result) {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, result);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.cacheHits = 0;
    this.totalQueries = 0;
    logger.info('NgramEngine: Cache cleared');
  }

  /**
   * Get engine statistics
   */
  getStats() {
    return {
      bigramCount: this.bigrams.size,
      trigramCount: this.trigrams.size,
      fourgramCount: this.fourgrams.size,
      fivegramCount: this.fivegrams.size,
      cacheSize: this.cache.size,
      cacheHitRate: this.totalQueries > 0 
        ? (this.cacheHits / this.totalQueries).toFixed(3)
        : 0,
      totalQueries: this.totalQueries
    };
  }

  /**
   * Check if n-grams are loaded
   */
  isLoaded() {
    return this.bigrams.size > 0 || this.trigrams.size > 0;
  }
}

export default NgramEngine;
