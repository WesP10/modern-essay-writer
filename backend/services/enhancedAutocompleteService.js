import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';
import ollamaClient from '../config/ollama.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Trie data structure for efficient prefix matching
 */
class Trie {
  constructor() {
    this.root = {};
  }

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

  search(prefix, limit = 10) {
    let node = this.root;
    
    for (const char of prefix.toLowerCase()) {
      if (!node[char]) {
        return [];
      }
      node = node[char];
    }
    
    return this.collectWords(node, limit);
  }

  collectWords(node, limit, results = []) {
    if (results.length >= limit) {
      return results;
    }
    
    if (node.isWord) {
      results.push(node.word);
    }
    
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
 * N-gram model for statistical predictions
 */
class NGramModel {
  constructor(n = 3) {
    this.n = n;
    this.ngrams = new Map();
  }

  /**
   * Train on academic text corpus
   */
  train(texts) {
    texts.forEach(text => {
      const words = this.tokenize(text);
      for (let i = 0; i < words.length - this.n; i++) {
        const context = words.slice(i, i + this.n - 1).join(' ');
        const nextWord = words[i + this.n - 1];
        
        if (!this.ngrams.has(context)) {
          this.ngrams.set(context, new Map());
        }
        
        const counts = this.ngrams.get(context);
        counts.set(nextWord, (counts.get(nextWord) || 0) + 1);
      }
    });
    
    logger.info(`N-gram model trained with ${this.ngrams.size} contexts`);
  }

  /**
   * Predict next words given context
   */
  predict(context, prefix = '', limit = 5) {
    const words = this.tokenize(context);
    const recentContext = words.slice(-(this.n - 1)).join(' ');
    
    if (!this.ngrams.has(recentContext)) {
      return [];
    }
    
    const candidates = this.ngrams.get(recentContext);
    const filtered = Array.from(candidates.entries())
      .filter(([word]) => word.toLowerCase().startsWith(prefix.toLowerCase()))
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word, count]) => ({
        text: word,
        confidence: this.normalizeScore(count),
        type: 'word',
        source: 'ngram'
      }));
    
    return filtered;
  }

  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  normalizeScore(count) {
    // Simple normalization - can be improved with TF-IDF
    return Math.min(0.95, 0.5 + (count / 20));
  }
}

/**
 * Enhanced AutocompleteService with LLM and advanced algorithms
 */
class EnhancedAutocompleteService {
  constructor() {
    this.trie = new Trie();
    this.ngramModel = new NGramModel(3);
    this.essayTypeVocab = {};
    this.commonPhrases = {};
    this.cache = new Map();
    this.llmCache = new Map();
    this.maxCacheSize = 1000;
    this.userPreferences = new Map(); // Track user selections
    
    // Performance thresholds
    this.INSTANT_THRESHOLD = 10; // ms
    this.FAST_THRESHOLD = 50; // ms
    this.SMART_THRESHOLD = 200; // ms
    
    this.loadDictionaries();
    this.trainNGramModel();
    
    logger.info('EnhancedAutocompleteService initialized');
  }

  /**
   * Load all dictionaries into memory
   */
  loadDictionaries() {
    try {
      const academicVocab = JSON.parse(
        readFileSync(join(__dirname, '../data/academic-vocabulary.json'), 'utf-8')
      );
      
      academicVocab.forEach(word => this.trie.insert(word));
      logger.info(`Loaded ${academicVocab.length} academic vocabulary words`);

      this.essayTypeVocab = JSON.parse(
        readFileSync(join(__dirname, '../data/essay-vocabulary.json'), 'utf-8')
      );
      
      Object.values(this.essayTypeVocab).forEach(words => {
        words.forEach(word => this.trie.insert(word));
      });
      
      logger.info('Loaded essay-type specific vocabulary');

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
   * Train N-gram model on academic corpus
   */
  trainNGramModel() {
    try {
      // Generate training corpus from phrase patterns
      const trainingTexts = [];
      
      // Extract all phrases as training examples
      Object.values(this.commonPhrases).forEach(phrases => {
        phrases.forEach(phrase => {
          trainingTexts.push(phrase);
        });
      });
      
      // Add constructed academic sentences
      const academicSentences = [
        "In conclusion, the evidence suggests that the hypothesis is supported by the data.",
        "Furthermore, the research indicates significant correlation between these variables.",
        "On the other hand, alternative explanations must be considered in this context.",
        "Nevertheless, it is important to acknowledge the limitations of this study.",
        "To summarize, the findings demonstrate a clear pattern across all experiments.",
        "In addition, previous research has shown similar results in comparable studies.",
        "However, it should be noted that the sample size was relatively small.",
        "Therefore, we can conclude that the methodology was appropriate for this investigation.",
        "Moreover, the statistical analysis reveals several interesting trends in the data.",
        "As a result, these findings have important implications for future research.",
        "Specifically, the results indicate that there is a strong positive correlation.",
        "In contrast, the control group showed no significant changes over time.",
        "For instance, the experimental data clearly demonstrates the predicted effect.",
        "Similarly, other studies have reported comparable outcomes under similar conditions.",
        "Consequently, this evidence supports the theoretical framework proposed earlier.",
        "That is to say, the relationship between these factors is more complex.",
        "In other words, the interpretation of these results requires careful consideration.",
        "By the same token, we must recognize the potential for confounding variables.",
        "For this reason, further investigation is necessary to validate these conclusions.",
        "On balance, the advantages of this approach outweigh the potential drawbacks."
      ];
      
      trainingTexts.push(...academicSentences);
      
      this.ngramModel.train(trainingTexts);
      
      logger.info('N-gram model training completed');
    } catch (error) {
      logger.error('Error training N-gram model:', error);
    }
  }

  /**
   * Main suggestion method with multi-tiered approach
   */
  async getSuggestions({ 
    prefix, 
    context = '', 
    cursorPosition, 
    essayType,
    enableLLM = true,
    maxSuggestions = 5 
  }) {
    const startTime = Date.now();

    // Validate input
    if (!prefix || prefix.length < 2) {
      return {
        suggestions: [],
        latency: Date.now() - startTime,
        cached: false,
        source: 'none',
        tier: 'none'
      };
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(prefix, context, essayType);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      return {
        ...cached,
        latency: Date.now() - startTime,
        cached: true
      };
    }

    const suggestions = [];

    // TIER 1: INSTANT - Dictionary + Trie (<10ms)
    const tier1Results = await this.getTier1Suggestions(prefix, essayType);
    suggestions.push(...tier1Results);

    // TIER 2: FAST - N-grams + Advanced Patterns (<50ms)
    const tier2Results = await this.getTier2Suggestions(prefix, context, essayType);
    suggestions.push(...tier2Results);

    // Check if we have enough good suggestions
    const currentLatency = Date.now() - startTime;
    const hasGoodSuggestions = suggestions.filter(s => s.confidence > 0.8).length >= 3;

    // TIER 3: SMART - LLM-powered context completions (<200ms)
    if (enableLLM && !hasGoodSuggestions && currentLatency < this.FAST_THRESHOLD) {
      const tier3Results = await this.getTier3Suggestions(prefix, context, essayType);
      suggestions.push(...tier3Results);
    }

    // Apply user preference boosting
    const boosted = this.applyUserPreferences(suggestions, essayType);

    // Rank and deduplicate
    const ranked = this.rankSuggestions(boosted);
    const final = ranked.slice(0, maxSuggestions);

    // Cache result
    this.cacheResult(cacheKey, { 
      suggestions: final,
      tier: this.determineTier(final)
    });

    const latency = Date.now() - startTime;
    
    logger.debug(`Autocomplete: "${prefix}" -> ${final.length} suggestions in ${latency}ms`);

    return {
      suggestions: final,
      latency,
      cached: false,
      tier: this.determineTier(final)
    };
  }

  /**
   * TIER 1: Dictionary + Trie lookups (instant)
   */
  async getTier1Suggestions(prefix, essayType) {
    const suggestions = [];

    // 1. Trie-based word matching
    const trieMatches = this.trie.search(prefix, 10);
    suggestions.push(...trieMatches.map(word => ({
      text: word,
      confidence: 0.85,
      type: 'word',
      source: 'dictionary',
      tier: 1
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
        source: 'contextual',
        tier: 1
      })));
    }

    return suggestions;
  }

  /**
   * TIER 2: N-gram predictions + Advanced pattern matching (fast)
   */
  async getTier2Suggestions(prefix, context, essayType) {
    const suggestions = [];

    // 1. N-gram predictions
    if (context) {
      const ngramPredictions = this.ngramModel.predict(context, prefix, 5);
      suggestions.push(...ngramPredictions.map(s => ({ ...s, tier: 2 })));
    }

    // 2. Enhanced phrase matching
    const phraseMatches = this.findAdvancedPhrases(context, prefix);
    suggestions.push(...phraseMatches.map(s => ({ ...s, tier: 2 })));

    // 3. Multi-word completions
    const multiWord = this.findMultiWordCompletions(context, prefix);
    suggestions.push(...multiWord.map(s => ({ ...s, tier: 2 })));

    return suggestions;
  }

  /**
   * TIER 3: LLM-powered context-aware completions (smart)
   */
  async getTier3Suggestions(prefix, context, essayType) {
    try {
      // Check LLM cache
      const llmCacheKey = `${context.slice(-100)}_${prefix}`;
      if (this.llmCache.has(llmCacheKey)) {
        return this.llmCache.get(llmCacheKey);
      }

      // Only use LLM if we have sufficient context
      if (context.length < 50) {
        return [];
      }

      const suggestions = await this.getLLMSuggestions(prefix, context, essayType);
      
      // Cache LLM results (they're expensive)
      this.llmCache.set(llmCacheKey, suggestions);
      if (this.llmCache.size > 100) {
        const firstKey = this.llmCache.keys().next().value;
        this.llmCache.delete(firstKey);
      }

      return suggestions;
    } catch (error) {
      logger.error('Tier 3 LLM suggestions failed:', error);
      return [];
    }
  }

  /**
   * Use LLM for intelligent, context-aware completions
   */
  async getLLMSuggestions(prefix, context, essayType) {
    try {
      const prompt = this.buildLLMPrompt(prefix, context, essayType);
      
      // Use gemma2:2b as default model (faster and lighter than llama2)
      const response = await ollamaClient.generate({
        model: process.env.OLLAMA_MODEL || 'gemma2:2b',
        prompt,
        temperature: 0.3, // Lower for more focused suggestions
        max_tokens: 100  // Reduced since we only need short completions
      });

      return this.parseLLMResponse(response, prefix);
    } catch (error) {
      logger.error('LLM generation failed:', error);
      return [];
    }
  }

  /**
   * Build optimized prompt for LLM completions
   */
  buildLLMPrompt(prefix, context, essayType) {
    const essayTypeHint = essayType ? `This is a ${essayType} essay. ` : '';
    
    return `You are an academic writing assistant. ${essayTypeHint}Given the following text context, provide 3-5 natural completions for the word/phrase starting with "${prefix}".

Context: "${context.slice(-200)}"

Current prefix: "${prefix}"

Instructions:
- Provide completions that fit naturally in academic writing
- Each completion should be 1-5 words maximum
- Consider the essay type and context
- Return ONLY the completions, one per line
- Do NOT include explanations or numbering

Completions:`;
  }

  /**
   * Parse LLM response into suggestions
   */
  parseLLMResponse(response, prefix) {
    const lines = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.toLowerCase().startsWith(prefix.toLowerCase()));

    return lines.slice(0, 5).map(text => ({
      text,
      confidence: 0.88,
      type: text.split(' ').length > 1 ? 'phrase' : 'word',
      source: 'llm',
      tier: 3
    }));
  }

  /**
   * Find advanced phrase patterns with context awareness
   */
  findAdvancedPhrases(context, prefix) {
    const phrases = [];
    const lastWords = this.getLastWords(context, 3);
    
    if (lastWords.length === 0) {
      return phrases;
    }

    // Check multiple context windows
    for (let i = lastWords.length - 1; i >= 0; i--) {
      const contextWord = lastWords[i].toLowerCase();
      
      if (this.commonPhrases[contextWord]) {
        const matchingPhrases = this.commonPhrases[contextWord]
          .filter(phrase => {
            const parts = phrase.split(' ');
            const continuation = parts.slice(i + 1).join(' ');
            return continuation.toLowerCase().startsWith(prefix.toLowerCase());
          })
          .map(phrase => ({
            text: phrase,
            confidence: 0.92,
            type: 'phrase',
            source: 'pattern'
          }));
        
        phrases.push(...matchingPhrases.slice(0, 3));
      }
    }

    return phrases;
  }

  /**
   * Find multi-word completions (e.g., "on the other hand")
   */
  findMultiWordCompletions(context, prefix) {
    const completions = [];
    const lastWords = this.getLastWords(context, 2);
    
    // Check if we're in the middle of a common multi-word phrase
    if (lastWords.length > 0) {
      const searchPattern = lastWords.join(' ').toLowerCase();
      
      Object.values(this.commonPhrases).forEach(phrases => {
        phrases.forEach(phrase => {
          const phraseLower = phrase.toLowerCase();
          if (phraseLower.includes(searchPattern)) {
            const afterMatch = phraseLower.split(searchPattern)[1];
            if (afterMatch && afterMatch.trim().startsWith(prefix.toLowerCase())) {
              completions.push({
                text: afterMatch.trim().split(' ')[0],
                confidence: 0.93,
                type: 'word',
                source: 'multi-word-pattern',
                fullPhrase: phrase
              });
            }
          }
        });
      });
    }

    return completions;
  }

  /**
   * Apply user preference boosting based on selection history
   */
  applyUserPreferences(suggestions, essayType) {
    return suggestions.map(sug => {
      const prefKey = `${essayType || 'general'}_${sug.text}`;
      const userBoost = (this.userPreferences.get(prefKey) || 0) * 0.1;
      
      return {
        ...sug,
        confidence: Math.min(0.99, sug.confidence + userBoost)
      };
    });
  }

  /**
   * Record user selection for learning
   */
  recordSelection(suggestion, essayType) {
    const prefKey = `${essayType || 'general'}_${suggestion}`;
    this.userPreferences.set(prefKey, (this.userPreferences.get(prefKey) || 0) + 1);
    
    // Limit size
    if (this.userPreferences.size > 5000) {
      const entries = Array.from(this.userPreferences.entries());
      entries.sort((a, b) => b[1] - a[1]);
      this.userPreferences = new Map(entries.slice(0, 4000));
    }
  }

  /**
   * Rank suggestions with advanced scoring
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

    const unique = Array.from(uniqueMap.values());
    
    // Complex scoring: source, tier, confidence, type
    const sourceWeights = {
      'contextual': 5,
      'llm': 4,
      'multi-word-pattern': 3.5,
      'pattern': 3,
      'ngram': 2.5,
      'dictionary': 2
    };

    const tierWeights = { 1: 1.0, 2: 1.2, 3: 1.3 };
    const typeWeights = { 'phrase': 1.3, 'word': 1.0 };

    return unique.sort((a, b) => {
      const scoreA = a.confidence * 
                     (sourceWeights[a.source] || 1) * 
                     (tierWeights[a.tier] || 1) * 
                     (typeWeights[a.type] || 1);
      
      const scoreB = b.confidence * 
                     (sourceWeights[b.source] || 1) * 
                     (tierWeights[b.tier] || 1) * 
                     (typeWeights[b.type] || 1);
      
      return scoreB - scoreA;
    });
  }

  /**
   * Determine which tier provided the best results
   */
  determineTier(suggestions) {
    if (suggestions.length === 0) return 0;
    const tiers = suggestions.map(s => s.tier || 1);
    return Math.max(...tiers);
  }

  /**
   * Extract last N words from context
   */
  getLastWords(context, n = 3) {
    const words = context.trim().split(/\s+/);
    return words.slice(-n).filter(w => w.length > 0);
  }

  /**
   * Generate cache key
   */
  generateCacheKey(prefix, context, essayType) {
    const contextHash = context.slice(-50);
    return `${prefix.toLowerCase()}_${essayType || 'general'}_${contextHash}`;
  }

  /**
   * Cache a result with LRU eviction
   */
  cacheResult(key, data) {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, data);
  }

  /**
   * Clear caches
   */
  clearCache() {
    this.cache.clear();
    this.llmCache.clear();
    logger.info('All caches cleared');
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      llmCacheSize: this.llmCache.size,
      userPreferences: this.userPreferences.size,
      ngramContexts: this.ngramModel.ngrams.size
    };
  }
}

// Export singleton instance
const enhancedAutocompleteService = new EnhancedAutocompleteService();
export default enhancedAutocompleteService;
