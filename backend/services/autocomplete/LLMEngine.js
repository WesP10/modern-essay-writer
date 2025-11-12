import { logger } from '../../utils/logger.js';
import ollamaConfig from '../../config/ollama.js';

/**
 * LLMEngine - Contextual suggestions using LLM
 * Target latency: 200-500ms (async, non-blocking)
 * Purpose: Long-form contextual suggestions after idle timeout
 */
class LLMEngine {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 100;
    this.pendingRequests = new Map();
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; // 1 second between LLM calls (reduced for responsiveness)
    this.totalQueries = 0;
    this.cacheHits = 0;
    this.timeouts = 0;
    
    logger.info('LLMEngine initialized');
  }

  /**
   * Get contextual suggestion from LLM
   * @param {Object} params - Request parameters
   * @returns {Array} - Array of suggestions (usually 1-2)
   */
  async getSuggestion({ context, cursorPosition, essayType, timeout = 5000 }) {
    const startTime = Date.now();
    this.totalQueries++;
    
    // Throttle requests
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      logger.info(`LLMEngine: Throttled (${timeSinceLastRequest}ms < ${this.minRequestInterval}ms) - returning no suggestions`);
      return [];
    }
    
    // Validate context
    // Require a modest amount of context, but be permissive for idle triggers
    const contextLength = context ? context.trim().length : 0;
    if (!context || contextLength < 30) {
      logger.info(`LLMEngine: Context too short (length=${contextLength}) - returning no suggestions`);
      return [];
    }
    
    // Check cache
    const cacheKey = this.getCacheKey(context, essayType);
    if (this.cache.has(cacheKey)) {
      this.cacheHits++;
      logger.debug('LLMEngine: Cache hit');
      return this.cache.get(cacheKey);
    }
    
    // Check if duplicate request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      logger.debug('LLMEngine: Duplicate request pending');
      return this.pendingRequests.get(cacheKey);
    }
    
    // Create async request
    const requestPromise = this.makeLLMRequest(context, essayType, timeout);
    this.pendingRequests.set(cacheKey, requestPromise);
    this.lastRequestTime = Date.now();
    
    try {
      const suggestions = await requestPromise;
      
      // Cache successful result
      this.cacheResult(cacheKey, suggestions);
      
      const duration = Date.now() - startTime;
      logger.info(`LLMEngine: Generated ${suggestions.length} suggestions in ${duration}ms`);
      
      return suggestions;
      
    } catch (error) {
      logger.error('LLMEngine: Request failed', error);
      return [];
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Make actual LLM API request
   * @private
   */
  async makeLLMRequest(context, essayType, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      this.timeouts++;
    }, timeout);
    
    try {
      // Determine suggestion type from context
      const suggestionType = this.determineSuggestionType(context);
      
      // Build prompt based on type
      const prompt = this.buildPrompt(context, suggestionType, essayType);
      
      // Use autocomplete model (gemma3:1b is faster, gpt-oss:20b is more accurate but much slower)
      const model = ollamaConfig.autocompleteModel || 'gemma3:1b';
      
      // Call Ollama API - optimized for speed with gemma3:1b
      const response = await fetch(`${ollamaConfig.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            num_predict: 50,   // 50 tokens for short phrases
            stop: ['\n\n\n', '---']  // Only stop at triple newline
          }
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }
      
      const data = await response.json();
      const suggestion = data.response?.trim();
      
      logger.info(`LLMEngine: Raw response length: ${suggestion?.length || 0}, first 200 chars: ${suggestion?.substring(0, 200) || '(empty)'}`);
      
      if (!suggestion || suggestion.length === 0) {
        return [];
      }
      
      // Parse and format suggestion
      return this.formatSuggestion(suggestion, suggestionType);
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        logger.warn('LLMEngine: Request timed out');
      } else {
        logger.error('LLMEngine: API call failed', error);
      }
      
      return [];
    }
  }

  /**
   * Determine what type of suggestion to generate
   * @private
   */
  determineSuggestionType(context) {
    const trimmed = context.trim();
    
    // Blank line or very short context
    if (trimmed.length === 0) {
      return 'sentence_starter';
    }
    
    // Ends with punctuation (., !, ?)
    if (/[.!?]\s*$/.test(trimmed)) {
      return 'next_sentence';
    }
    
    // Mid-word (no space at end)
    if (!/\s$/.test(context) && trimmed.length > 0) {
      return 'word_completion';
    }
    
    // After space (new word)
    if (/\s$/.test(context)) {
      return 'phrase_continuation';
    }
    
    return 'general';
  }

  /**
   * Extract minimal relevant context - just the last few words
   * @private
   */
  extractRelevantContext(context) {
    const trimmed = context.trim();
    
    // Check if we're mid-sentence (no ending punctuation)
    const isIncompleteSentence = !/[.!?]\s*$/.test(trimmed);
    
    if (isIncompleteSentence) {
      // Find the last sentence boundary
      const lastPunctIndex = Math.max(
        trimmed.lastIndexOf('. '),
        trimmed.lastIndexOf('! '),
        trimmed.lastIndexOf('? ')
      );
      
      if (lastPunctIndex > 0) {
        // Get text after last sentence - this is the incomplete part
        const incompletePart = trimmed.slice(lastPunctIndex + 2).trim();
        
        // Return only last 40 chars of incomplete sentence for speed
        return incompletePart.slice(-40);
      }
      
      // No previous sentence found, return last 40 chars
      return trimmed.slice(-40);
    } else {
      // Complete sentence - return last 60 chars for next sentence context
      return trimmed.slice(-60);
    }
  }

  /**
   * Build LLM prompt - ultra-minimal for speed
   * @private
   */
  buildPrompt(context, suggestionType, essayType) {
    // Extract minimal context
    const minimalContext = this.extractRelevantContext(context);
    const isIncompleteSentence = !/[.!?]\s*$/.test(minimalContext.trim());
    
    if (isIncompleteSentence) {
      // Mid-sentence - ultra-direct prompt
      return `"${minimalContext}"\n\nComplete with 3 short options:\n1.\n2.\n3.`;
    } else {
      // After sentence - ultra-direct prompt  
      return `"${minimalContext}"\n\n3 next phrases:\n1.\n2.\n3.`;
    }
  }

  /**
   * Format LLM response into suggestion objects
   * @private
   */
  formatSuggestion(text, suggestionType) {
    let cleaned = text.trim();
    
    if (!cleaned || cleaned.length === 0) {
      return [];
    }
    
    // AGGRESSIVE meta-text removal
    // Remove entire first line if it contains meta-text
    const lines = cleaned.split(/\n+/);
    let startIndex = 0;
    
    for (let i = 0; i < Math.min(lines.length, 3); i++) {
      const lower = lines[i].toLowerCase();
      if (lower.includes('here are') || lower.includes('complete') || lower.includes('option') ||
          lower.includes('ways to') || lower.includes('possible') || lower.includes('following')) {
        startIndex = i + 1;  // Skip this meta-text line
      } else {
        break;  // Found actual content
      }
    }
    
    const suggestions = [];
    const contentLines = lines.slice(startIndex)
      .map(l => l.trim())
      .filter(l => {
        if (l.length === 0) return false;
        const withoutMarkers = l.replace(/^[\d.)\-*•\[\]]+\s*|\*+/g, '');
        if (withoutMarkers.length < 5) return false;
        return true;
      });
    
    logger.info(`LLMEngine: Formatted ${contentLines.length} suggestions from ${contentLines.length} lines`);
    
    for (const line of contentLines.slice(0, 3)) {
      let cleanLine = line
        .replace(/^\**\d+[\.\)]\**\s*/, '') // Remove **1.** or 1. or 1)
        .replace(/^[-*•\[\]]+\s*/, '') // Remove bullets and brackets
        .replace(/\*+/g, '') // Remove remaining asterisks
        .replace(/^["']|["']$/g, '') // Remove quotes
        .replace(/\(.+?\)/g, '') // Remove parenthetical notes
        .trim();
      
      if (cleanLine.length >= 5 && cleanLine.length <= 150) {
        suggestions.push({
          text: cleanLine,
          confidence: 0.80,
          type: 'phrase',
          source: 'llm',
          context: suggestionType
        });
      }
    }
    
    logger.info(`LLMEngine: Formatted ${suggestions.length} suggestions from ${lines.length} lines`);
    
    return suggestions;
  }

  /**
   * Generate cache key
   * @private
   */
  getCacheKey(context, essayType) {
    // Use last 100 chars of context for cache key
    const contextKey = context.slice(-100).trim();
    return `${essayType || 'general'}:${contextKey}`;
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
    logger.info('LLMEngine: Cache cleared');
  }

  /**
   * Get engine statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      cacheHitRate: this.totalQueries > 0 
        ? (this.cacheHits / this.totalQueries).toFixed(3)
        : 0,
      totalQueries: this.totalQueries,
      timeouts: this.timeouts,
      pendingRequests: this.pendingRequests.size
    };
  }

  /**
   * Check if LLM is available
   */
  async checkHealth() {
    try {
      const response = await fetch(`${ollamaConfig.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      
      if (response.ok) {
        const data = await response.json();
        const modelToCheck = ollamaConfig.autocompleteModel || 'gemma3:1b';
        const hasModel = data.models?.some(m => 
          m.name === modelToCheck || m.name.startsWith(modelToCheck.split(':')[0])
        );
        return hasModel;
      }
      
      return false;
    } catch (error) {
      logger.error('LLMEngine: Health check failed', error);
      return false;
    }
  }
}

export default LLMEngine;
