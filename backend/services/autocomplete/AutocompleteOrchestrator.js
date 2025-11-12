import { logger } from '../../utils/logger.js';
import TrieEngine from './TrieEngine.js';
import NgramEngine from './NgramEngine.js';
import LLMEngine from './LLMEngine.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * AutocompleteOrchestrator - Coordinates all three autocomplete engines
 * Decides which engine(s) to invoke based on context and trigger conditions
 */
class AutocompleteOrchestrator {
  constructor() {
    this.trieEngine = new TrieEngine();
    this.ngramEngine = new NgramEngine();
    this.llmEngine = new LLMEngine();
    
    this.stats = {
      totalRequests: 0,
      trieRequests: 0,
      ngramRequests: 0,
      llmRequests: 0,
      avgLatency: 0
    };
    
    this.initialized = false;
    
    logger.info('AutocompleteOrchestrator created');
  }

  /**
   * Initialize all engines with data
   */
  async initialize() {
    if (this.initialized) {
      return;
    }
    
    const startTime = Date.now();
    logger.info('Initializing AutocompleteOrchestrator...');
    
    try {
      // Load dictionaries for Trie
      await this.loadDictionaries();
      
      // Load n-grams
      await this.loadNgrams();
      
      // Check LLM availability
      const llmAvailable = await this.llmEngine.checkHealth();
      if (!llmAvailable) {
        logger.warn('LLM engine not available - will use fallback');
      }
      
      this.initialized = true;
      
      const duration = Date.now() - startTime;
      logger.info(`AutocompleteOrchestrator initialized in ${duration}ms`);
      
    } catch (error) {
      logger.error('Failed to initialize AutocompleteOrchestrator', error);
      throw error;
    }
  }

  /**
   * Load dictionaries into TrieEngine
   * @private
   */
  async loadDictionaries() {
    try {
      // Load comprehensive word frequency data (333k+ words)
      const wordFreqPath = join(__dirname, '../../data/word-frequencies.json');
      const wordFrequencies = JSON.parse(readFileSync(wordFreqPath, 'utf-8'));
      
      // Convert to {word, frequency} format
      const baseWords = Object.entries(wordFrequencies).map(([word, frequency]) => ({
        word,
        frequency
      }));
      
      this.trieEngine.bulkInsert(baseWords);
      logger.info(`TrieEngine loaded with ${baseWords.length} base words`);
      
      // Load academic vocabulary with frequency boost
      const academicPath = join(__dirname, '../../data/academic-vocabulary.json');
      const academicWords = JSON.parse(readFileSync(academicPath, 'utf-8'));
      
      // Boost academic words by adding extra frequency
      const boostedAcademic = academicWords.map((word, index) => ({
        word,
        frequency: (wordFrequencies[word] || 500) + 200 // Boost by 200 points
      }));
      
      this.trieEngine.bulkInsert(boostedAcademic);
      
      // Load essay-specific vocabulary with even higher boost
      const essayPath = join(__dirname, '../../data/essay-vocabulary.json');
      const essayVocab = JSON.parse(readFileSync(essayPath, 'utf-8'));
      
      // Insert all essay type words with high priority
      for (const [essayType, words] of Object.entries(essayVocab)) {
        const essayWords = words.map((word, index) => ({
          word,
          frequency: (wordFrequencies[word] || 500) + 300 // Boost by 300 points
        }));
        this.trieEngine.bulkInsert(essayWords);
      }
      
      logger.info(`TrieEngine loaded with ${this.trieEngine.size()} words`);
      
    } catch (error) {
      logger.error('Error loading dictionaries', error);
      throw error;
    }
  }

  /**
   * Load n-gram models into NgramEngine
   * @private
   */
  async loadNgrams() {
    try {
      // Load common phrases (use as bigrams)
      const phrasesPath = join(__dirname, '../../data/common-phrases.json');
      const phrases = JSON.parse(readFileSync(phrasesPath, 'utf-8'));
      
      // Convert common phrases to bigram format
      const bigrams = {};
      for (const [trigger, continuations] of Object.entries(phrases)) {
        bigrams[trigger] = continuations;
      }
      
      // Try to load additional n-grams if available
      try {
        const bigramsPath = join(__dirname, '../../data/ngrams/bigrams.json');
        const trigramsPath = join(__dirname, '../../data/ngrams/trigrams.json');
        const fourgramsPath = join(__dirname, '../../data/ngrams/fourgrams.json');
        const fivegramsPath = join(__dirname, '../../data/ngrams/fivegrams.json');
        
        const additionalBigrams = JSON.parse(readFileSync(bigramsPath, 'utf-8'));
        const additionalTrigrams = JSON.parse(readFileSync(trigramsPath, 'utf-8'));
        const additionalFourgrams = JSON.parse(readFileSync(fourgramsPath, 'utf-8'));
        const additionalFivegrams = JSON.parse(readFileSync(fivegramsPath, 'utf-8'));
        
        // Merge common phrases with additional bigrams
        Object.assign(bigrams, additionalBigrams);
        
        this.ngramEngine.load({
          bigrams,
          trigrams: additionalTrigrams,
          fourgrams: additionalFourgrams,
          fivegrams: additionalFivegrams
        });
        
        logger.info('NgramEngine loaded all n-gram data');
      } catch (err) {
        // Fallback to just common phrases
        this.ngramEngine.load({ bigrams });
        logger.debug('Additional n-gram files not found, using common phrases only');
      }
      
    } catch (error) {
      logger.error('Error loading n-grams', error);
      throw error;
    }
  }

  /**
   * Main entry point for autocomplete suggestions
   * @param {Object} params - Request parameters
   * @returns {Object} - Suggestions with metadata
   */
  async getSuggestions({ 
    text, 
    cursorPosition, 
    essayType,
    triggerType = 'auto', // 'keystroke', 'space', 'idle', 'auto'
    enableLLM = true,
    maxSuggestions = 5
  }) {
    const startTime = Date.now();
    this.stats.totalRequests++;
    
    // Ensure initialized
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Analyze context
    const analysis = this.analyzeContext(text, cursorPosition);
    
    // Determine which engine(s) to use based on trigger and context
    const engines = this.selectEngines(triggerType, analysis, enableLLM);
    
    logger.debug('Orchestrator: Using engines', engines);
    
    // Collect suggestions from selected engines
    const allSuggestions = [];
    let primaryEngine = 'none';
    
    // Trie Engine (word completion)
    if (engines.includes('trie') && analysis.currentWord.length > 0) {
      this.stats.trieRequests++;
      primaryEngine = 'trie';
      
      const trieSuggestions = this.trieEngine.search(
        analysis.currentWord, 
        maxSuggestions
      );
      allSuggestions.push(...trieSuggestions);
    }
    
    // N-gram Engine (phrase prediction)
    if (engines.includes('ngram') && analysis.context.length > 0) {
      this.stats.ngramRequests++;
      if (primaryEngine === 'none') primaryEngine = 'ngram';
      
      const ngramSuggestions = this.ngramEngine.predict(
        analysis.context,
        analysis.currentWord,
        maxSuggestions
      );
      allSuggestions.push(...ngramSuggestions);
    }
    
    // LLM Engine (contextual)
    if (engines.includes('llm') && analysis.context.length >= 30) {
      this.stats.llmRequests++;
      if (primaryEngine === 'none') primaryEngine = 'llm';
      
      try {
        const llmSuggestions = await this.llmEngine.getSuggestion({
          context: text, // Pass FULL text for LLM, not just analysis.context
          cursorPosition,
          essayType,
          timeout: 5000 // 5 second timeout for fast gemma3:1b queries
        });
        allSuggestions.push(...llmSuggestions);
      } catch (error) {
        logger.warn('LLM engine failed, continuing without it', error);
      }
    }
    
    // Merge and rank all suggestions
    const finalSuggestions = this.mergeSuggestions(
      allSuggestions, 
      analysis,
      maxSuggestions
    );
    
    const latency = Date.now() - startTime;
    this.updateAvgLatency(latency);
    
    logger.info(`Orchestrator: ${finalSuggestions.length} suggestions in ${latency}ms`, {
      engine: primaryEngine,
      engines: engines.join('+'),
      triggerType
    });
    
    return {
      suggestions: finalSuggestions,
      latency,
      engine: primaryEngine,
      engines,
      metadata: {
        triggerType,
        analysisType: analysis.type,
        contextLength: analysis.context.length
      }
    };
  }

  /**
   * Analyze the context and current typing state
   * @private
   */
  analyzeContext(text, cursorPosition) {
    // Extract text before cursor
    const beforeCursor = text.substring(0, cursorPosition);
    
    // Find current word being typed
    const match = beforeCursor.match(/(\S+)$/);
    const currentWord = match ? match[1] : '';
    
    // Get context (everything before current word)
    const context = currentWord.length > 0 
      ? beforeCursor.substring(0, beforeCursor.length - currentWord.length)
      : beforeCursor;
    
    // Determine context type
    let type = 'general';
    const trimmed = context.trim();
    
    if (currentWord.length > 0) {
      // User is actively typing a word - prioritize Trie
      type = 'mid_word';
    } else if (trimmed.length === 0) {
      // Empty document, no word being typed
      type = 'start';
    } else if (/[.!?]\s*$/.test(trimmed)) {
      type = 'after_sentence';
    } else if (/\s$/.test(context)) {
      type = 'after_space';
    }
    
    return {
      currentWord,
      context,
      type,
      hasContext: context.trim().length > 0
    };
  }

  /**
   * Select which engines to use based on trigger and context
   * @private
   */
  selectEngines(triggerType, analysis, enableLLM) {
    const engines = [];
    
    // Auto mode: smart selection based on context
    if (triggerType === 'auto') {
      switch (analysis.type) {
        case 'start':
          // New document: only LLM for sentence starters
          if (enableLLM) engines.push('llm');
          break;
          
        case 'mid_word':
          // Typing a word: Trie only
          engines.push('trie');
          break;
          
        case 'after_space':
          // After space: N-gram and maybe Trie
          engines.push('ngram');
          if (analysis.currentWord.length > 0) {
            engines.push('trie');
          }
          break;
          
        case 'after_sentence':
          // After punctuation: N-gram and LLM
          engines.push('ngram');
          if (enableLLM) engines.push('llm');
          break;
          
        default:
          // General: Trie + N-gram
          if (analysis.currentWord.length > 0) {
            engines.push('trie');
          }
          engines.push('ngram');
      }
      
      return engines;
    }
    
    // Manual trigger type
    switch (triggerType) {
      case 'keystroke':
        if (analysis.currentWord.length > 0) {
          engines.push('trie');
        }
        break;
        
      case 'space':
        engines.push('ngram');
        break;
        
      case 'idle':
        // Idle trigger: Always try LLM first, then n-gram as fallback
        if (enableLLM && analysis.context.length >= 50) {
          engines.push('llm');
        }
        // Always include n-gram as fallback for idle
        engines.push('ngram');
        // Also try trie if in middle of word
        if (analysis.currentWord.length > 0) {
          engines.push('trie');
        }
        break;
    }
    
    return engines;
  }

  /**
   * Merge and rank suggestions from multiple engines
   * @private
   */
  mergeSuggestions(suggestions, analysis, limit) {
    if (suggestions.length === 0) {
      return [];
    }
    
    // Deduplicate by text (case-insensitive)
    const map = new Map();
    
    for (const sug of suggestions) {
      const key = sug.text.toLowerCase();
      
      if (!map.has(key)) {
        map.set(key, sug);
      } else {
        // Keep higher confidence version
        const existing = map.get(key);
        if (sug.confidence > existing.confidence) {
          map.set(key, sug);
        }
      }
    }
    
    // Convert to array and rank
    const unique = Array.from(map.values());
    
    // Sort by confidence and source priority
    const sourcePriority = {
      trie: 3,
      ngram: 2,
      llm: 1
    };
    
    unique.sort((a, b) => {
      // Primary sort: confidence
      if (Math.abs(a.confidence - b.confidence) > 0.05) {
        return b.confidence - a.confidence;
      }
      
      // Secondary sort: source priority
      const aPriority = sourcePriority[a.source] || 0;
      const bPriority = sourcePriority[b.source] || 0;
      return bPriority - aPriority;
    });
    
    return unique.slice(0, limit);
  }

  /**
   * Update average latency stat
   * @private
   */
  updateAvgLatency(latency) {
    const total = this.stats.avgLatency * (this.stats.totalRequests - 1);
    this.stats.avgLatency = (total + latency) / this.stats.totalRequests;
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    return {
      orchestrator: {
        totalRequests: this.stats.totalRequests,
        trieRequests: this.stats.trieRequests,
        ngramRequests: this.stats.ngramRequests,
        llmRequests: this.stats.llmRequests,
        avgLatency: Math.round(this.stats.avgLatency)
      },
      trie: this.trieEngine.getStats(),
      ngram: this.ngramEngine.getStats(),
      llm: this.llmEngine.getStats()
    };
  }

  /**
   * Clear all caches
   */
  clearCaches() {
    this.trieEngine.clearCache();
    this.ngramEngine.clearCache();
    this.llmEngine.clearCache();
    logger.info('All autocomplete caches cleared');
  }
}

// Export singleton instance
const orchestrator = new AutocompleteOrchestrator();
export default orchestrator;
