import { logger } from '../../utils/logger.js';

/**
 * TrieEngine - Ultra-fast word completion using compressed radix trie
 * Target latency: <10ms
 * Purpose: Word-level completion on every keystroke
 */
class TrieEngine {
  constructor() {
    this.root = {};
    this.cache = new Map();
    this.maxCacheSize = 1000;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.totalQueries = 0;
    
    logger.info('TrieEngine initialized');
  }

  /**
   * Insert a word with frequency score
   * @param {string} word - The word to insert
   * @param {number} frequency - Frequency score for ranking
   */
  insert(word, frequency = 1) {
    if (!word || typeof word !== 'string') return;
    
    let node = this.root;
    const lowerWord = word.toLowerCase();
    
    for (let i = 0; i < lowerWord.length; i++) {
      const char = lowerWord[i];
      
      if (!node[char]) {
        node[char] = {};
      }
      
      node = node[char];
    }
    
    // Mark as complete word with metadata
    node.isWord = true;
    node.word = word;
    node.frequency = frequency;
  }

  /**
   * Batch insert words from array
   * @param {Array} words - Array of {word, frequency} objects or strings
   */
  bulkInsert(words) {
    const startTime = Date.now();
    let count = 0;
    
    for (const item of words) {
      if (typeof item === 'string') {
        this.insert(item, 1);
      } else if (item.word) {
        this.insert(item.word, item.frequency || 1);
      }
      count++;
    }
    
    const duration = Date.now() - startTime;
    logger.info(`TrieEngine: Bulk inserted ${count} words in ${duration}ms`);
  }

  /**
   * Search for words matching prefix
   * @param {string} prefix - The prefix to search for
   * @param {number} limit - Maximum number of results
   * @returns {Array} - Sorted array of suggestions
   */
  search(prefix, limit = 10) {
    const startTime = Date.now();
    this.totalQueries++;
    
    if (!prefix || prefix.length === 0) {
      return [];
    }
    
    const lowerPrefix = prefix.toLowerCase();
    
    // Check cache first (LRU)
    const cacheKey = `${lowerPrefix}_${limit}`;
    if (this.cache.has(cacheKey)) {
      this.cacheHits++;
      const cached = this.cache.get(cacheKey);
      
      // Move to end (LRU)
      this.cache.delete(cacheKey);
      this.cache.set(cacheKey, cached);
      
      return cached;
    }
    
    this.cacheMisses++;
    
    // Navigate to prefix node
    let node = this.root;
    for (let i = 0; i < lowerPrefix.length; i++) {
      const char = lowerPrefix[i];
      if (!node[char]) {
        // No matches found
        this.cacheResult(cacheKey, []);
        return [];
      }
      node = node[char];
    }
    
    // Collect all words from this node
    const words = [];
    this.collectWords(node, words, limit * 3); // Collect more for sorting
    
    // Sort by frequency (descending)
    words.sort((a, b) => b.frequency - a.frequency);
    
    // Take top N
    const results = words.slice(0, limit).map(item => ({
      text: item.word,
      confidence: this.calculateConfidence(item.frequency),
      type: 'word',
      source: 'trie',
      frequency: item.frequency
    }));
    
    // Cache result
    this.cacheResult(cacheKey, results);
    
    const duration = Date.now() - startTime;
    
    if (duration > 10) {
      logger.warn(`TrieEngine: Slow query "${prefix}" took ${duration}ms`);
    }
    
    return results;
  }

  /**
   * Recursively collect all words from a node
   * @private
   */
  collectWords(node, results, limit) {
    if (results.length >= limit) {
      return;
    }
    
    // If this node represents a word, add it
    if (node.isWord) {
      results.push({
        word: node.word,
        frequency: node.frequency || 1
      });
    }
    
    // Recursively traverse children
    // Sort keys for consistent ordering
    const keys = Object.keys(node).filter(k => 
      k !== 'isWord' && k !== 'word' && k !== 'frequency'
    );
    
    for (const char of keys) {
      if (results.length >= limit) {
        break;
      }
      this.collectWords(node[char], results, limit);
    }
  }

  /**
   * Calculate confidence score from frequency
   * Maps frequency to 0.6-0.95 range
   * @private
   */
  calculateConfidence(frequency) {
    // Log scale for better distribution
    const normalized = Math.log10(frequency + 1) / 6; // Assumes max ~1M frequency
    return Math.min(0.95, Math.max(0.6, 0.6 + (normalized * 0.35)));
  }

  /**
   * Cache a result with LRU eviction
   * @private
   */
  cacheResult(key, result) {
    // If cache is full, remove oldest (first) entry
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, result);
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    logger.info('TrieEngine: Cache cleared');
  }

  /**
   * Get engine statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      maxCacheSize: this.maxCacheSize,
      cacheHitRate: this.totalQueries > 0 
        ? (this.cacheHits / this.totalQueries).toFixed(3)
        : 0,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      totalQueries: this.totalQueries
    };
  }

  /**
   * Check if a word exists in the trie
   */
  has(word) {
    if (!word) return false;
    
    let node = this.root;
    const lowerWord = word.toLowerCase();
    
    for (let i = 0; i < lowerWord.length; i++) {
      const char = lowerWord[i];
      if (!node[char]) {
        return false;
      }
      node = node[char];
    }
    
    return node.isWord === true;
  }

  /**
   * Get word frequency
   */
  getFrequency(word) {
    if (!word) return 0;
    
    let node = this.root;
    const lowerWord = word.toLowerCase();
    
    for (let i = 0; i < lowerWord.length; i++) {
      const char = lowerWord[i];
      if (!node[char]) {
        return 0;
      }
      node = node[char];
    }
    
    return node.isWord ? (node.frequency || 1) : 0;
  }

  /**
   * Get total word count in trie
   */
  size() {
    const words = [];
    this.collectWords(this.root, words, Infinity);
    return words.length;
  }
}

export default TrieEngine;
