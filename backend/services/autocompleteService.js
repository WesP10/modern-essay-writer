import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Trie data structure for efficient prefix matching
 */
class Trie {
  constructor() {
    this.root = {};
  }

  /**
   * Insert a word into the Trie
   */
  insert(word) {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node[char]) {
        node[char] = {};
      }
      node = node[char];
    }
    node.isWord = true;
    node.word = word;
  }

  /**
   * Search for words with given prefix
   * @param {string} prefix - The prefix to search for
   * @param {number} limit - Maximum number of results
   * @returns {string[]} - Array of matching words
   */
  search(prefix, limit = 10) {
    let node = this.root;
    
    // Navigate to the prefix node
    for (const char of prefix.toLowerCase()) {
      if (!node[char]) {
        return [];
      }
      node = node[char];
    }
    
    // Collect all words from this node
    return this.collectWords(node, limit);
  }

  /**
   * Recursively collect words from a node
   */
  collectWords(node, limit, results = []) {
    if (results.length >= limit) {
      return results;
    }
    
    if (node.isWord) {
      results.push(node.word);
    }
    
    // Sort keys for consistent ordering
    const keys = Object.keys(node).sort();
    
    for (const char of keys) {
      if (char !== 'isWord' && char !== 'word' && results.length < limit) {
        this.collectWords(node[char], limit, results);
      }
    }
    
    return results;
  }
}

/**
 * AutocompleteService - Fast dictionary-based autocomplete
 * No LLM required - uses Trie data structure for < 10ms latency
 */
class AutocompleteService {
  constructor() {
    this.trie = new Trie();
    this.essayTypeVocab = {};
    this.commonPhrases = {};
    this.cache = new Map();
    this.maxCacheSize = 1000;
    
    // Load dictionaries on initialization
    this.loadDictionaries();
    
    logger.info('AutocompleteService initialized');
  }

  /**
   * Load all dictionaries into memory
   */
  loadDictionaries() {
    try {
      // Load academic vocabulary into Trie
      const academicVocab = JSON.parse(
        readFileSync(join(__dirname, '../data/academic-vocabulary.json'), 'utf-8')
      );
      
      academicVocab.forEach(word => this.trie.insert(word));
      logger.info(`Loaded ${academicVocab.length} academic vocabulary words`);

      // Load essay-type specific vocabulary
      this.essayTypeVocab = JSON.parse(
        readFileSync(join(__dirname, '../data/essay-vocabulary.json'), 'utf-8')
      );
      
      // Add essay-type words to Trie as well
      Object.values(this.essayTypeVocab).forEach(words => {
        words.forEach(word => this.trie.insert(word));
      });
      
      logger.info('Loaded essay-type specific vocabulary');

      // Load common phrases
      this.commonPhrases = JSON.parse(
        readFileSync(join(__dirname, '../data/common-phrases.json'), 'utf-8')
      );
      
      logger.info('Loaded common academic phrases');
      
    } catch (error) {
      logger.error('Error loading dictionaries:', error);
      throw new Error('Failed to load autocomplete dictionaries');
    }
  }

  /**
   * Get autocomplete suggestions
   * @param {Object} params - Request parameters
   * @returns {Object} - Suggestions with metadata
   */
  async getSuggestions({ prefix, context, cursorPosition, essayType }) {
    const startTime = Date.now();

    // Validate input
    if (!prefix || prefix.length < 2) {
      return {
        suggestions: [],
        latency: Date.now() - startTime,
        cached: false,
        source: 'none'
      };
    }

    // Check cache
    const cacheKey = this.generateCacheKey(prefix, essayType);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      return {
        ...cached,
        latency: Date.now() - startTime,
        cached: true
      };
    }

    const suggestions = [];

    // 1. Trie-based word matching (< 5ms)
    const trieMatches = this.trie.search(prefix, 10);
    suggestions.push(...trieMatches.map(word => ({
      text: word,
      confidence: 0.85,
      type: 'word',
      source: 'dictionary'
    })));

    // 2. Essay-type specific suggestions
    if (essayType && this.essayTypeVocab[essayType]) {
      const contextualMatches = this.essayTypeVocab[essayType]
        .filter(word => word.toLowerCase().startsWith(prefix.toLowerCase()))
        .slice(0, 5);
      
      suggestions.push(...contextualMatches.map(word => ({
        text: word,
        confidence: 0.95,
        type: 'word',
        source: 'contextual'
      })));
    }

    // 3. Context-aware phrase suggestions (if context provided)
    if (context) {
      const phraseMatches = this.findPhrases(context, prefix);
      suggestions.push(...phraseMatches);
    }

    // 4. Rank and deduplicate
    const ranked = this.rankSuggestions(suggestions);
    const final = ranked.slice(0, 5);

    // Cache result
    this.cacheResult(cacheKey, final);

    const latency = Date.now() - startTime;
    
    logger.debug(`Autocomplete: "${prefix}" -> ${final.length} suggestions in ${latency}ms`);

    return {
      suggestions: final,
      latency,
      cached: false
    };
  }

  /**
   * Find phrase suggestions based on context
   */
  findPhrases(context, prefix) {
    const phrases = [];
    const lastWords = this.getLastWords(context, 2);
    
    if (lastWords.length === 0) {
      return phrases;
    }

    const lastWord = lastWords[lastWords.length - 1].toLowerCase();
    
    // Check if last word has associated phrases
    if (this.commonPhrases[lastWord]) {
      const matchingPhrases = this.commonPhrases[lastWord]
        .filter(phrase => {
          // Extract the part after the trigger word
          const parts = phrase.split(' ');
          const continuation = parts.slice(1).join(' ');
          return continuation.toLowerCase().startsWith(prefix.toLowerCase());
        })
        .map(phrase => ({
          text: phrase,
          confidence: 0.90,
          type: 'phrase',
          source: 'pattern'
        }));
      
      phrases.push(...matchingPhrases.slice(0, 3));
    }

    return phrases;
  }

  /**
   * Extract last N words from context
   */
  getLastWords(context, n = 3) {
    const words = context.trim().split(/\s+/);
    return words.slice(-n);
  }

  /**
   * Rank suggestions by confidence and source
   */
  rankSuggestions(suggestions) {
    // Remove duplicates (keep highest confidence)
    const uniqueMap = new Map();
    
    suggestions.forEach(sug => {
      const key = sug.text.toLowerCase();
      if (!uniqueMap.has(key) || uniqueMap.get(key).confidence < sug.confidence) {
        uniqueMap.set(key, sug);
      }
    });

    // Convert back to array and sort
    const unique = Array.from(uniqueMap.values());
    
    // Priority weights: contextual > pattern > dictionary
    const weights = {
      contextual: 3,
      pattern: 2,
      dictionary: 1
    };

    return unique.sort((a, b) => {
      const scoreA = a.confidence * weights[a.source];
      const scoreB = b.confidence * weights[b.source];
      return scoreB - scoreA;
    });
  }

  /**
   * Generate cache key
   */
  generateCacheKey(prefix, essayType) {
    return `${prefix.toLowerCase()}_${essayType || 'general'}`;
  }

  /**
   * Cache a result with LRU eviction
   */
  cacheResult(key, suggestions) {
    // Simple LRU: if cache is full, remove oldest entry
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, { suggestions });
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.cache.clear();
    logger.info('Autocomplete cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0
    };
  }
}

// Export singleton instance
const autocompleteService = new AutocompleteService();
export default autocompleteService;
