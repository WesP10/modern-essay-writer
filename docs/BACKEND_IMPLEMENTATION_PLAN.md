# Backend Implementation Plan - EssayForge

**Created:** November 11, 2025  
**Status:** Planning Phase  
**Target Completion:** Phase 3 (Week 4-6)

---

## 🎯 Overview

This document outlines the backend architecture for integrating four core AI services into EssayForge:

1. **Autocomplete Service** - Real-time text suggestions as users type
2. **AI Detection Service** - Identify AI-generated content with scoring
3. **AI Humanizer Service** - Rewrite AI-like text to sound more human
4. **Text Generation Service** - Generate content directly into the document

All services follow a **microservices architecture** with clear separation of concerns, enabling independent development, testing, and scaling.

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (SvelteKit)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Editor   │  │ Humanizer│  │ Detector │  │  Prompt  │  │
│  │Component │  │  Panel   │  │  Panel   │  │  Panel   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
└───────┼─────────────┼─────────────┼─────────────┼─────────┘
        │             │             │             │
        │             │             │             │
┌───────▼─────────────▼─────────────▼─────────────▼─────────┐
│                   API Gateway / Router                      │
│              (Express.js on Railway/Render)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Rate Limiting & Authentication               │  │
│  └──────────────────────────────────────────────────────┘  │
└───────┬─────────────┬─────────────┬─────────────┬─────────┘
        │             │             │             │
   ┌────▼────┐   ┌───▼────┐   ┌────▼────┐   ┌───▼─────┐
   │Autocomplete│ │ Detector│  │Humanizer│  │Generator│
   │  Service  │  │ Service │  │ Service │  │ Service │
   └────┬────┘   └───┬────┘   └────┬────┘   └───┬─────┘
        │            │              │            │
        └────────────┼──────────────┼────────────┘
                     │              │
              ┌──────▼──────────────▼──────┐
              │    Ollama / LLM Provider   │
              │   (Local or Cloud-based)   │
              └─────────────────────────────┘
                     │
              ┌──────▼──────┐
              │  Supabase   │
              │  (Storage)  │
              └─────────────┘
```

---

## 📋 Service Contracts & API Specifications

### 1️⃣ Autocomplete Service

**Purpose:** Provide real-time word/phrase suggestions as users type.

#### API Endpoint
```
POST /api/ai/autocomplete
```

#### Request Schema
```typescript
{
  prefix: string;          // Current word being typed (e.g., "pri")
  context: string;         // Previous 100-200 characters
  cursorPosition: number;  // Position in document
  essayType?: string;      // "academic" | "creative" | "research"
}
```

#### Response Schema
```typescript
{
  suggestions: Array<{
    text: string;          // Suggested completion
    confidence: number;    // 0.0-1.0 score
    type: "word" | "phrase";
  }>;
  latency: number;         // Response time in ms
}
```

#### Example
```json
// Request
{
  "prefix": "benefi",
  "context": "Exercise has many health ",
  "cursorPosition": 125,
  "essayType": "academic"
}

// Response
{
  "suggestions": [
    { "text": "benefits", "confidence": 0.95, "type": "word" },
    { "text": "beneficial effects", "confidence": 0.87, "type": "phrase" }
  ],
  "latency": 45
}
```

#### Performance Requirements
- **Latency:** < 10ms (p95) - Rule-based, no LLM
- **Trigger:** On keystroke (debounced 150ms)
- **Method:** Trie data structure + academic vocabulary dictionary
- **Caching:** In-memory Map + Redis for phrase patterns
- **No LLM:** Uses prefix matching and context-aware rules for instant suggestions

---

### 2️⃣ AI Detection Service

**Purpose:** Analyze text and identify AI-generated content with detailed scoring.

#### API Endpoint
```
POST /api/ai/detect
```

#### Request Schema
```typescript
{
  text: string;           // Full essay or selected text
  granularity: "document" | "paragraph" | "sentence";
}
```

#### Response Schema
```typescript
{
  overallScore: number;   // 0.0-1.0 (1.0 = likely AI-generated)
  verdict: "human" | "likely_human" | "unclear" | "likely_ai" | "ai";
  analysis: {
    perplexity: number;
    burstiness: number;
    semanticConsistency: number;
  };
  sections: Array<{
    text: string;
    startIndex: number;
    endIndex: number;
    score: number;
    reason: string;       // Explanation for flagging
  }>;
  recommendations: string[];
  confidence: number;
}
```

#### Example
```json
// Request
{
  "text": "The benefits of exercise are numerous and well-documented...",
  "granularity": "sentence"
}

// Response
{
  "overallScore": 0.82,
  "verdict": "likely_ai",
  "analysis": {
    "perplexity": 12.4,
    "burstiness": 0.31,
    "semanticConsistency": 0.89
  },
  "sections": [
    {
      "text": "The benefits of exercise are numerous and well-documented.",
      "startIndex": 0,
      "endIndex": 58,
      "score": 0.91,
      "reason": "Overly formal phrasing and generic topic introduction"
    }
  ],
  "recommendations": [
    "Add personal anecdotes",
    "Vary sentence structure",
    "Use more specific examples"
  ],
  "confidence": 0.85
}
```

#### Performance Requirements
- **Latency:** < 100ms for 1000 words (statistical only), < 3s with LLM fallback
- **Trigger:** On-demand (user clicks "Scan Essay")
- **Method:** Statistical analysis first (perplexity, burstiness, lexical diversity)
- **LLM Fallback:** Only used when statistical score is unclear (0.4-0.7 range)
- **Cost:** 70-80% of requests handled by statistics alone (no LLM cost)

---

### 3️⃣ AI Humanizer Service

**Purpose:** Rewrite AI-like text to sound more natural and human.

#### API Endpoint
```
POST /api/ai/humanize
```

#### Request Schema
```typescript
{
  text: string;           // Text to rewrite (max 2000 words)
  context?: string;       // Surrounding text for coherence
  tone: "formal" | "casual" | "academic" | "creative";
  preserveMeaning: boolean;
  options?: {
    addPersonalTouch: boolean;
    simplifyLanguage: boolean;
    varyStructure: boolean;
  };
}
```

#### Response Schema
```typescript
{
  rewritten: string;
  changes: Array<{
    original: string;
    updated: string;
    reason: string;
  }>;
  metrics: {
    readabilityScore: number;  // Flesch-Kincaid
    aiLikelihoodBefore: number;
    aiLikelihoodAfter: number;
  };
  suggestions: string[];  // Additional improvements
}
```

#### Example
```json
// Request
{
  "text": "The benefits of exercise are numerous and well-documented in scientific literature.",
  "tone": "casual",
  "preserveMeaning": true,
  "options": {
    "addPersonalTouch": true,
    "simplifyLanguage": true,
    "varyStructure": true
  }
}

// Response
{
  "rewritten": "I've noticed that working out has so many advantages—and there's plenty of research to back it up!",
  "changes": [
    {
      "original": "The benefits of exercise are numerous",
      "updated": "working out has so many advantages",
      "reason": "More conversational phrasing"
    }
  ],
  "metrics": {
    "readabilityScore": 72.5,
    "aiLikelihoodBefore": 0.87,
    "aiLikelihoodAfter": 0.23
  },
  "suggestions": [
    "Consider adding a specific example",
    "Try breaking into shorter sentences"
  ]
}
```

#### Performance Requirements
- **Latency:** < 100ms for rule-based (70% of cases), < 5s for LLM fallback
- **Trigger:** User selects text + clicks "Humanize"
- **Tiered Approach:**
  - **Tier 1 (AI score < 0.7):** Rule-based transformations (contractions, sentence variation, phrase replacement)
  - **Tier 2 (AI score ≥ 0.7):** LLM-based rewriting with context
- **Cost:** 70% of requests use rules only (no LLM cost)

---

### 4️⃣ Text Generation Service

**Purpose:** Generate new content based on prompts and insert directly into document.

#### API Endpoint
```
POST /api/ai/generate
```

#### Request Schema
```typescript
{
  prompt: string;         // User's generation request
  context?: string;       // Existing essay content
  insertPosition?: number;
  generationType: "outline" | "paragraph" | "introduction" | "conclusion" | "custom";
  tone: "formal" | "casual" | "academic" | "creative";
  length: "short" | "medium" | "long";  // ~100/300/500 words
  essayType?: "argumentative" | "research" | "narrative" | "expository";
}
```

#### Response Schema
```typescript
{
  generatedText: string;
  metadata: {
    wordCount: number;
    readabilityScore: number;
    estimatedAIScore: number;  // Pre-emptive detection
  };
  citations?: Array<{       // If research mode
    text: string;
    source: string;
    format: string;         // APA, MLA, Chicago
  }>;
  alternatives?: string[];  // 2-3 alternative versions
}
```

#### Example
```json
// Request
{
  "prompt": "Write an introduction about the impact of social media on mental health",
  "generationType": "introduction",
  "tone": "academic",
  "length": "medium",
  "essayType": "argumentative"
}

// Response
{
  "generatedText": "In recent years, the proliferation of social media platforms has fundamentally altered how individuals communicate and perceive themselves. While these platforms offer unprecedented connectivity, growing evidence suggests they may contribute to rising rates of anxiety and depression, particularly among adolescents. This essay examines the multifaceted relationship between social media usage and mental health outcomes.",
  "metadata": {
    "wordCount": 58,
    "readabilityScore": 48.2,
    "estimatedAIScore": 0.78
  },
  "alternatives": [
    "Social media has become an integral part of modern life, but at what cost?...",
    "The debate over social media's impact on mental health has intensified..."
  ]
}
```

#### Performance Requirements
- **Latency:** < 4s for short content (qwen2.5:3b), < 8s for long content (llama3.1:8b)
- **Streaming:** Support SSE (Server-Sent Events) for real-time generation
- **Trigger:** User enters prompt in Prompt Panel
- **Smart Model Selection:** Uses faster, smaller model for short content
- **Caching:** Common prompts cached in Redis for instant retrieval

---

## 🗂️ Backend Folder Structure

```
backend/
├── server.js                    # Express app entry point
├── .env.example                 # Environment variables template
├── package.json
│
├── config/
│   ├── database.js              # Supabase connection
│   ├── ollama.js                # Ollama client config
│   └── redis.js                 # Redis cache config
│
├── routes/
│   ├── auth.js                  # User authentication routes
│   ├── essays.js                # Essay CRUD operations
│   └── ai/
│       ├── autocomplete.js      # POST /api/ai/autocomplete
│       ├── detect.js            # POST /api/ai/detect
│       ├── humanize.js          # POST /api/ai/humanize
│       └── generate.js          # POST /api/ai/generate
│
├── services/
│   ├── autocompleteService.js   # Autocomplete logic
│   ├── detectorService.js       # AI detection algorithms
│   ├── humanizerService.js      # Text rewriting logic
│   ├── generatorService.js      # Content generation logic
│   ├── ollamaClient.js          # Ollama API wrapper
│   └── cacheService.js          # Redis caching layer
│
├── middleware/
│   ├── auth.js                  # JWT verification
│   ├── rateLimiter.js           # Rate limiting per service
│   ├── errorHandler.js          # Global error handling
│   └── validateRequest.js       # Request schema validation
│
├── models/
│   ├── Essay.js                 # Essay data model
│   └── Usage.js                 # API usage tracking
│
├── utils/
│   ├── logger.js                # Winston logger
│   ├── metrics.js               # Performance tracking
│   └── prompts/
│       ├── autocomplete.js      # Autocomplete prompt templates
│       ├── detector.js          # Detection prompt templates
│       ├── humanizer.js         # Humanizer prompt templates
│       └── generator.js         # Generator prompt templates
│
└── tests/
    ├── unit/
    │   ├── autocomplete.test.js
    │   ├── detector.test.js
    │   ├── humanizer.test.js
    │   └── generator.test.js
    └── integration/
        └── ai-workflow.test.js
```

---

## 🔧 Technology Stack

### Core Backend
- **Runtime:** Node.js 20+ with Express.js
- **Language:** TypeScript (compiled to JS)
- **API Style:** RESTful with optional SSE for streaming

### AI/ML Layer
- **Primary:** Hybrid approach (optimized for speed and cost)
  - **Rule-Based (No LLM):**
    - Autocomplete - Trie data structure + academic dictionary
    - Humanizer (Tier 1) - Pattern-based transformations
  - **Statistical Analysis (No LLM):**
    - Detector (primary) - Perplexity, burstiness, lexical diversity
  - **Ollama Models (LLM - when needed):**
    - `qwen2.5:3b` - Short text generation
    - `llama3.1:8b` - Long-form generation, heavy humanization
    - Detector fallback - Only for unclear cases (0.4-0.7 score)
- **Fallback:** OpenAI API / Anthropic Claude (cloud)

### Data & Caching
- **Database:** Supabase (PostgreSQL)
- **Cache:** Redis (for autocomplete suggestions, frequent queries)
- **Session:** JWT tokens (stored in httpOnly cookies)

### Infrastructure
- **Hosting:** Railway / Render (with persistent Ollama instance)
- **CDN:** Cloudflare (for static assets)
- **Monitoring:** Sentry (errors) + Prometheus (metrics)

---

## 🔐 Security & Rate Limiting

### Authentication Flow
1. User logs in via Supabase Auth
2. Backend receives JWT from frontend
3. Middleware validates JWT on each AI request
4. User ID attached to request for usage tracking

### Rate Limits (per user)
```javascript
const RATE_LIMITS = {
  autocomplete: {
    windowMs: 60_000,      // 1 minute
    max: 120               // 120 requests/min (2/sec)
  },
  detect: {
    windowMs: 60_000,
    max: 10                // 10 scans/min
  },
  humanize: {
    windowMs: 60_000,
    max: 20                // 20 rewrites/min
  },
  generate: {
    windowMs: 60_000,
    max: 15                // 15 generations/min
  }
};
```

### API Key Management
```env
# .env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
OLLAMA_BASE_URL=http://localhost:11434
REDIS_URL=redis://localhost:6379
JWT_SECRET=xxx
OPENAI_API_KEY=xxx  # Fallback
```

---

## 📊 Service Implementation Details

### 1️⃣ Autocomplete Service Implementation (Rule-Based - No LLM)

```javascript
// services/autocompleteService.js

class AutocompleteService {
  constructor() {
    // Load academic vocabulary using Trie data structure
    this.trie = this.buildTrie();
    this.commonPhrases = this.loadPhrasePatterns();
    this.cache = new Map(); // In-memory cache for speed
    this.essayTypeVocab = this.loadEssayTypeVocabulary();
  }

  async getSuggestions({ prefix, context, essayType }) {
    // Check in-memory cache (< 1ms)
    const cacheKey = `${prefix}_${essayType}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const suggestions = [];

    // 1. Trie-based prefix matching (< 5ms)
    const wordMatches = this.trie.search(prefix, 10);
    suggestions.push(...wordMatches.map(word => ({
      text: word,
      confidence: 0.9,
      type: 'word',
      source: 'dictionary'
    })));

    // 2. Context-aware phrase suggestions (< 5ms)
    const lastWords = this.getLastWords(context, 3);
    const phraseMatches = this.findPhrases(lastWords, prefix);
    suggestions.push(...phraseMatches.map(phrase => ({
      text: phrase,
      confidence: 0.85,
      type: 'phrase',
      source: 'pattern'
    })));

    // 3. Essay-type specific vocabulary
    if (essayType && this.essayTypeVocab[essayType]) {
      const contextual = this.essayTypeVocab[essayType]
        .filter(w => w.startsWith(prefix.toLowerCase()))
        .slice(0, 5);
      suggestions.push(...contextual.map(word => ({
        text: word,
        confidence: 0.95,
        type: 'word',
        source: 'contextual'
      })));
    }

    // Rank and deduplicate
    const ranked = this.rankSuggestions(suggestions).slice(0, 5);
    
    // Cache for 10 minutes
    this.cache.set(cacheKey, ranked);
    setTimeout(() => this.cache.delete(cacheKey), 600000);
    
    return { suggestions: ranked, latency: Date.now() };
  }

  buildTrie() {
    // Build Trie from academic vocabulary dictionary
    // Load from JSON: 50k common academic words
    const trie = new Trie();
    const vocabulary = require('../data/academic-vocabulary.json');
    vocabulary.forEach(word => trie.insert(word));
    return trie;
  }

  loadPhrasePatterns() {
    // Common academic phrases indexed by trigger words
    return {
      'in': ['in addition', 'in conclusion', 'in contrast', 'in other words'],
      'on': ['on the other hand', 'on the contrary', 'on balance'],
      'for': ['for example', 'for instance', 'furthermore'],
      // ... more patterns
    };
  }

  loadEssayTypeVocabulary() {
    return {
      'argumentative': ['contend', 'argue', 'assert', 'claim', 'refute'],
      'research': ['analyze', 'investigate', 'examine', 'demonstrate'],
      'narrative': ['describe', 'illustrate', 'recount', 'portray'],
      'expository': ['explain', 'clarify', 'elucidate', 'define']
    };
  }

  rankSuggestions(suggestions) {
    // Prioritize: contextual > phrase > dictionary
    const weights = { contextual: 3, pattern: 2, dictionary: 1 };
    return suggestions
      .sort((a, b) => {
        const scoreA = a.confidence * weights[a.source];
        const scoreB = b.confidence * weights[b.source];
        return scoreB - scoreA;
      })
      .filter((s, i, arr) => arr.findIndex(x => x.text === s.text) === i);
  }
}

// Simple Trie implementation
class Trie {
  constructor() {
    this.root = {};
  }

  insert(word) {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node[char]) node[char] = {};
      node = node[char];
    }
    node.isWord = true;
    node.word = word;
  }

  search(prefix, limit = 10) {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!node[char]) return [];
      node = node[char];
    }
    return this.collectWords(node, limit);
  }

  collectWords(node, limit, results = []) {
    if (results.length >= limit) return results;
    if (node.isWord) results.push(node.word);
    for (const char in node) {
      if (char !== 'isWord' && char !== 'word') {
        this.collectWords(node[char], limit, results);
      }
    }
    return results;
  }
}

module.exports = AutocompleteService;
```

### 2️⃣ AI Detector Service Implementation (Statistical First, LLM Fallback)

```javascript
// services/detectorService.js

class DetectorService {
  constructor() {
    this.model = "llama3.1:8b"; // Only used for unclear cases
  }

  async detectAI({ text, granularity }) {
    const startTime = Date.now();
    
    // Split text based on granularity
    const segments = this.splitText(text, granularity);
    
    // 1. FAST: Statistical analysis first (< 100ms)
    const statisticalScores = this.statisticalAnalysis(segments);
    const overallStatScore = this.calculateOverall(statisticalScores);
    
    // 2. SLOW: Only use LLM if score is unclear (0.4-0.7 range)
    let finalScores = statisticalScores;
    let method = 'statistical';
    
    if (overallStatScore >= 0.4 && overallStatScore <= 0.7) {
      // Unclear - use LLM for refinement
      const llmScores = await this.llmAnalysis(segments);
      finalScores = statisticalScores.map((statScore, idx) => ({
        ...statScore,
        score: (statScore.score * 0.4) + (llmScores[idx] * 0.6) // LLM weighted higher
      }));
      method = 'hybrid';
    }
    
    const overallScore = this.calculateOverall(finalScores);
    const processingTime = Date.now() - startTime;

    return {
      overallScore,
      verdict: this.getVerdict(overallScore),
      analysis: this.getDetailedAnalysis(text, finalScores[0]),
      sections: finalScores.filter(s => s.score > 0.7),
      recommendations: this.generateRecommendations(finalScores),
      confidence: this.calculateConfidence(finalScores),
      method, // 'statistical' or 'hybrid'
      processingTime
    };
  }

  statisticalAnalysis(segments) {
    return segments.map(segment => {
      // Calculate multiple statistical metrics
      const perplexity = this.calculatePerplexity(segment);
      const burstiness = this.calculateBurstiness(segment);
      const lexicalDiversity = this.calculateLexicalDiversity(segment);
      const repetitionScore = this.calculateRepetition(segment);
      const syntaxComplexity = this.calculateSyntaxComplexity(segment);
      
      // Weighted combination of metrics
      const score = (
        (1 - perplexity) * 0.25 +     // Low perplexity = AI-like
        (1 - burstiness) * 0.25 +      // Low burstiness = AI-like
        (1 - lexicalDiversity) * 0.20 + // Low diversity = AI-like
        repetitionScore * 0.15 +        // High repetition = AI-like
        (1 - syntaxComplexity) * 0.15   // Low complexity = AI-like
      );
      
      return {
        text: segment,
        score: Math.max(0, Math.min(1, score)),
        metrics: { perplexity, burstiness, lexicalDiversity, repetitionScore, syntaxComplexity }
      };
    });
  }

  calculatePerplexity(text) {
    // Vocabulary richness (0-1, lower = more AI-like)
    const words = text.split(/\s+/);
    const uniqueWords = new Set(words);
    return uniqueWords.size / words.length;
  }

  calculateBurstiness(text) {
    // Sentence length variation (0-1, lower = more AI-like)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length < 2) return 0.5;
    
    const lengths = sentences.map(s => s.split(/\s+/).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    
    // Coefficient of variation (normalized)
    return Math.min(1, stdDev / mean);
  }

  calculateLexicalDiversity(text) {
    // Type-Token Ratio (0-1, lower = more AI-like)
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const uniqueWords = new Set(words);
    return uniqueWords.size / Math.max(words.length, 1);
  }

  calculateRepetition(text) {
    // N-gram repetition (0-1, higher = more AI-like)
    const words = text.toLowerCase().split(/\s+/);
    const trigrams = [];
    for (let i = 0; i < words.length - 2; i++) {
      trigrams.push(words.slice(i, i + 3).join(' '));
    }
    
    const uniqueTrigrams = new Set(trigrams);
    return 1 - (uniqueTrigrams.size / Math.max(trigrams.length, 1));
  }

  calculateSyntaxComplexity(text) {
    // Sentence structure variety (0-1, lower = more AI-like)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const starters = sentences.map(s => s.trim().split(/\s+/)[0]?.toLowerCase());
    const uniqueStarters = new Set(starters);
    return uniqueStarters.size / Math.max(sentences.length, 1);
  }

  async llmAnalysis(segments) {
    // Only called when statistical analysis is unclear
    const prompt = `Analyze if these text segments were written by AI. Rate each 0.0-1.0 (1.0 = definitely AI).

${segments.map((s, i) => `[${i}] ${s.text || s}`).join("\n\n")}

Output only scores as CSV: 0.8,0.6,0.9`;

    const response = await ollamaClient.generate({
      model: this.model,
      prompt,
      temperature: 0.1,
      max_tokens: 100
    });

    return response.split(",").map(s => parseFloat(s.trim()) || 0.5);
  }

  getVerdict(score) {
    if (score < 0.3) return "human";
    if (score < 0.5) return "likely_human";
    if (score < 0.7) return "unclear";
    if (score < 0.85) return "likely_ai";
    return "ai";
  }

  getDetailedAnalysis(text, firstSegment) {
    return {
      perplexity: firstSegment?.metrics?.perplexity || 0,
      burstiness: firstSegment?.metrics?.burstiness || 0,
      semanticConsistency: firstSegment?.metrics?.lexicalDiversity || 0
    };
  }

  calculateOverall(scores) {
    const values = scores.map(s => s.score || s);
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  calculateConfidence(scores) {
    // Higher confidence if scores are consistent
    const values = scores.map(s => s.score || s);
    const mean = this.calculateOverall(scores);
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.max(0, 1 - Math.sqrt(variance));
  }

  generateRecommendations(scores) {
    const overall = this.calculateOverall(scores);
    const recs = [];
    
    if (overall > 0.6) {
      recs.push('Add personal anecdotes or experiences');
      recs.push('Vary sentence structure and length');
      recs.push('Use more specific examples instead of generic statements');
      recs.push('Include contractions and conversational language');
    }
    
    return recs;
  }

  splitText(text, granularity) {
    switch (granularity) {
      case 'sentence':
        return text.split(/[.!?]+/).filter(s => s.trim()).map(s => ({ text: s.trim() }));
      case 'paragraph':
        return text.split(/\n\n+/).filter(p => p.trim()).map(p => ({ text: p.trim() }));
      default:
        return [{ text }];
    }
  }
}

module.exports = DetectorService;
```

### 3️⃣ Humanizer Service Implementation (Rule-Based First, LLM Fallback)

```javascript
// services/humanizerService.js
import { DetectorService } from './detectorService.js';

class HumanizerService {
  constructor() {
    this.model = "llama3.1:8b";
    this.detector = new DetectorService();
    this.humanizationRules = this.loadRules();
  }

  async humanize({ text, context, tone, preserveMeaning, options }) {
    const startTime = Date.now();
    
    // Quick AI detection to determine approach
    const aiScore = await this.quickDetect(text);
    
    let result;
    let method;
    
    // Tier 1: Light AI score - use fast rule-based approach
    if (aiScore < 0.7) {
      result = await this.ruleBasedHumanization(text, tone, options);
      method = 'rule-based';
    } 
    // Tier 2: Heavy AI score - use LLM
    else {
      result = await this.llmHumanization(text, context, tone, options);
      method = 'llm';
    }
    
    const aiAfter = await this.quickDetect(result.rewritten);
    const processingTime = Date.now() - startTime;
    
    return {
      ...result,
      metrics: {
        readabilityScore: this.calculateReadability(result.rewritten),
        aiLikelihoodBefore: aiScore,
        aiLikelihoodAfter: aiAfter,
        improvement: aiScore - aiAfter
      },
      method,
      processingTime
    };
  }

  async ruleBasedHumanization(text, tone, options) {
    let rewritten = text;
    const changes = [];

    // 1. Split long sentences (> 25 words)
    if (options?.varyStructure) {
      const split = this.splitLongSentences(rewritten);
      if (split !== rewritten) {
        changes.push({ original: rewritten, updated: split, reason: 'Split long sentences' });
        rewritten = split;
      }
    }

    // 2. Add contractions for casual tone
    if (tone === 'casual' && options?.simplifyLanguage) {
      const contracted = this.addContractions(rewritten);
      if (contracted !== rewritten) {
        changes.push({ original: rewritten, updated: contracted, reason: 'Added contractions' });
        rewritten = contracted;
      }
    }

    // 3. Replace overly formal phrases
    const naturalized = this.replaceFormalPhrases(rewritten, tone);
    if (naturalized !== rewritten) {
      changes.push({ original: rewritten, updated: naturalized, reason: 'Replaced formal language' });
      rewritten = naturalized;
    }

    // 4. Vary sentence starters
    if (options?.varyStructure) {
      const varied = this.varySentenceStarters(rewritten);
      if (varied !== rewritten) {
        changes.push({ original: rewritten, updated: varied, reason: 'Varied sentence starters' });
        rewritten = varied;
      }
    }

    // 5. Add discourse markers
    const withMarkers = this.naturalizeTransitions(rewritten, tone);
    if (withMarkers !== rewritten) {
      changes.push({ original: rewritten, updated: withMarkers, reason: 'Naturalized transitions' });
      rewritten = withMarkers;
    }

    return {
      rewritten,
      changes: this.consolidateChanges(changes),
      suggestions: this.generateSuggestions(rewritten)
    };
  }

  async llmHumanization(text, context, tone, options) {
    const prompt = this.buildHumanizerPrompt(text, context, tone, options);
    
    const rewritten = await ollamaClient.generate({
      model: this.model,
      prompt,
      temperature: 0.7,
      max_tokens: text.split(/\s+/).length * 2
    });

    return {
      rewritten,
      changes: this.detectChanges(text, rewritten),
      suggestions: []
    };
  }

  loadRules() {
    return {
      formalToNatural: {
        'numerous': ['many', 'lots of', 'plenty of'],
        'furthermore': ['also', 'plus', 'and'],
        'however': ['but', 'yet', 'though'],
        'in conclusion': ['so', 'overall', 'to sum up'],
        'it is important to note': ['note that', 'keep in mind', 'remember'],
        'in order to': ['to'],
        'due to the fact that': ['because', 'since'],
        'at this point in time': ['now', 'currently'],
        'in spite of the fact that': ['although', 'even though'],
        'for the purpose of': ['to', 'for'],
        'in the event that': ['if'],
        'prior to': ['before'],
        'subsequent to': ['after'],
        'utilize': ['use'],
        'demonstrate': ['show'],
        'indicate': ['show', 'suggest'],
        'possess': ['have'],
        'commence': ['start', 'begin'],
        'terminate': ['end', 'finish']
      },
      
      contractions: {
        'do not': "don't",
        'does not': "doesn't",
        'did not': "didn't",
        'is not': "isn't",
        'are not': "aren't",
        'was not': "wasn't",
        'were not': "weren't",
        'have not': "haven't",
        'has not': "hasn't",
        'had not': "hadn't",
        'will not': "won't",
        'would not': "wouldn't",
        'could not': "couldn't",
        'should not': "shouldn't",
        'cannot': "can't",
        'it is': "it's",
        'that is': "that's",
        'there is': "there's",
        'I am': "I'm",
        'you are': "you're",
        'we are': "we're",
        'they are': "they're"
      },
      
      genericStarters: /^(The |This |These |Those |It is |There is |There are )/i
    };
  }

  splitLongSentences(text) {
    const sentences = text.split(/([.!?]+)/);
    const result = [];
    
    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i];
      const punctuation = sentences[i + 1] || '.';
      
      if (sentence) {
        const words = sentence.split(/\s+/);
        if (words.length > 25) {
          // Find good split point (conjunctions: and, but, or, because, while)
          const splitPoints = ['and', 'but', 'or', 'because', 'while', 'although'];
          let splitIndex = -1;
          
          for (let j = Math.floor(words.length / 2); j < words.length; j++) {
            if (splitPoints.includes(words[j].toLowerCase())) {
              splitIndex = j;
              break;
            }
          }
          
          if (splitIndex > 0) {
            result.push(words.slice(0, splitIndex).join(' ') + '.');
            result.push(words[splitIndex].charAt(0).toUpperCase() + words[splitIndex].slice(1) + ' ' + words.slice(splitIndex + 1).join(' ') + punctuation);
            continue;
          }
        }
        result.push(sentence + punctuation);
      }
    }
    
    return result.join(' ');
  }

  addContractions(text) {
    let result = text;
    for (const [full, contracted] of Object.entries(this.humanizationRules.contractions)) {
      const regex = new RegExp(`\\b${full}\\b`, 'gi');
      result = result.replace(regex, contracted);
    }
    return result;
  }

  replaceFormalPhrases(text, tone) {
    let result = text;
    const replacements = this.humanizationRules.formalToNatural;
    
    for (const [formal, alternatives] of Object.entries(replacements)) {
      const regex = new RegExp(`\\b${formal}\\b`, 'gi');
      if (regex.test(result)) {
        // Pick random alternative for variety
        const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
        result = result.replace(regex, replacement);
      }
    }
    
    return result;
  }

  varySentenceStarters(text) {
    const sentences = text.split(/([.!?]+\s+)/);
    const result = [];
    let consecutiveGeneric = 0;
    
    for (let i = 0; i < sentences.length; i += 2) {
      let sentence = sentences[i];
      const separator = sentences[i + 1] || '';
      
      if (sentence && this.humanizationRules.genericStarters.test(sentence)) {
        consecutiveGeneric++;
        
        // If 2+ consecutive generic starters, restructure
        if (consecutiveGeneric >= 2) {
          // Try to invert or add transition
          sentence = this.restructureSentence(sentence);
          consecutiveGeneric = 0;
        }
      } else {
        consecutiveGeneric = 0;
      }
      
      result.push(sentence + separator);
    }
    
    return result.join('');
  }

  restructureSentence(sentence) {
    // Simple restructuring: remove generic starter
    return sentence.replace(this.humanizationRules.genericStarters, '');
  }

  naturalizeTransitions(text, tone) {
    const transitions = {
      formal: { 'However,': 'But', 'Furthermore,': 'Also', 'Moreover,': 'Plus' },
      casual: { 'However,': 'But', 'Therefore,': 'So', 'Additionally,': 'Also' }
    };
    
    let result = text;
    const toUse = transitions[tone] || transitions.casual;
    
    for (const [formal, natural] of Object.entries(toUse)) {
      const regex = new RegExp(`\\b${formal}`, 'gi');
      result = result.replace(regex, natural + ',');
    }
    
    return result;
  }

  async quickDetect(text) {
    // Use detector service's fast statistical analysis
    const result = await this.detector.detectAI({ text, granularity: 'document' });
    return result.overallScore;
  }

  calculateReadability(text) {
    // Flesch Reading Ease approximation
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
    const words = text.split(/\s+/).length;
    const syllables = text.split(/[aeiouy]+/).length;
    
    if (sentences === 0 || words === 0) return 0;
    
    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
    return Math.max(0, Math.min(100, score));
  }

  consolidateChanges(changes) {
    // Take first and last for summary
    if (changes.length === 0) return [];
    if (changes.length <= 3) return changes;
    
    return [
      changes[0],
      { original: '...', updated: '...', reason: `${changes.length - 2} more changes` },
      changes[changes.length - 1]
    ];
  }

  generateSuggestions(text) {
    const suggestions = [];
    
    // Check for passive voice
    if (/\b(is|are|was|were|been|being)\s+\w+ed\b/i.test(text)) {
      suggestions.push('Consider using active voice instead of passive');
    }
    
    // Check for repetitive words
    const words = text.toLowerCase().split(/\s+/);
    const wordCount = {};
    words.forEach(w => wordCount[w] = (wordCount[w] || 0) + 1);
    const repeated = Object.entries(wordCount).filter(([w, c]) => c > 3 && w.length > 4);
    if (repeated.length > 0) {
      suggestions.push(`Word "${repeated[0][0]}" appears ${repeated[0][1]} times - consider synonyms`);
    }
    
    return suggestions;
  }

  buildHumanizerPrompt(text, context, tone, options) {
    return `Rewrite this text to sound more natural and human. Make it ${tone} in tone.

${options?.addPersonalTouch ? 'Add personal perspective.' : ''}
${options?.simplifyLanguage ? 'Use simpler language.' : ''}
${options?.varyStructure ? 'Vary sentence structure.' : ''}

Text: "${text}"

Rewritten:`;
  }

  detectChanges(original, rewritten) {
    const origSentences = original.split(/[.!?]+/).filter(s => s.trim());
    const newSentences = rewritten.split(/[.!?]+/).filter(s => s.trim());
    
    const changes = [];
    const maxLen = Math.min(origSentences.length, newSentences.length);
    
    for (let i = 0; i < maxLen; i++) {
      if (origSentences[i].trim() !== newSentences[i].trim()) {
        changes.push({
          original: origSentences[i].trim(),
          updated: newSentences[i].trim(),
          reason: 'Rewritten by LLM'
        });
      }
    }
    
    return changes.slice(0, 5); // Limit to 5 examples
  }
}

module.exports = HumanizerService;
```

### 4️⃣ Generator Service Implementation

```javascript
// services/generatorService.js

class GeneratorService {
  constructor() {
    this.model = "llama3.1:8b";
  }

  async generate({ prompt, context, generationType, tone, length, essayType }) {
    const systemPrompt = this.buildSystemPrompt(generationType, tone, essayType);
    const wordTarget = this.getWordTarget(length);
    
    const fullPrompt = `${systemPrompt}

${context ? `Existing essay content:\n"${context}"\n\n` : ""}

User request: ${prompt}

Target length: ~${wordTarget} words

Generated content:`;

    const generated = await ollamaClient.generate({
      model: this.model,
      prompt: fullPrompt,
      temperature: 0.8,
      max_tokens: wordTarget * 2
    });

    // Generate alternatives with different temperatures
    const alternatives = await this.generateAlternatives(fullPrompt);

    return {
      generatedText: generated,
      metadata: {
        wordCount: generated.split(/\s+/).length,
        readabilityScore: this.calculateReadability(generated),
        estimatedAIScore: await this.quickDetect(generated)
      },
      alternatives
    };
  }

  buildSystemPrompt(type, tone, essayType) {
    const prompts = {
      outline: `You are an expert essay planner. Create a structured outline with clear sections.`,
      introduction: `You are an expert at writing engaging ${tone} introductions for ${essayType} essays.`,
      paragraph: `You are an expert at writing coherent ${tone} paragraphs for ${essayType} essays.`,
      conclusion: `You are an expert at writing strong ${tone} conclusions for ${essayType} essays.`,
      custom: `You are an expert academic writer specializing in ${essayType} essays with a ${tone} tone.`
    };
    return prompts[type] || prompts.custom;
  }

  getWordTarget(length) {
    const targets = { short: 100, medium: 300, long: 500 };
    return targets[length] || 300;
  }

  async generateAlternatives(prompt) {
    const temps = [0.6, 0.9];
    const alternatives = await Promise.all(
      temps.map(temp => 
        ollamaClient.generate({
          model: this.model,
          prompt,
          temperature: temp,
          max_tokens: 500
        })
      )
    );
    return alternatives;
  }
}

module.exports = GeneratorService;
```

---

## 🚀 Deployment Strategy

### Phase 1: Local Development (Week 4)
```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Start Redis
docker run -d -p 6379:6379 redis:alpine

# Terminal 3: Start Backend
cd backend
npm run dev

# Terminal 4: Start Frontend
cd frontend
npm run dev
```

### Phase 2: Staging (Week 5)
- Deploy backend to Railway
- Use Railway's Redis addon
- Deploy Ollama as a separate container
- Connect to Supabase cloud instance

### Phase 3: Production (Week 6)
- Set up load balancer for multiple Ollama instances
- Enable CloudFlare CDN
- Configure auto-scaling rules
- Set up monitoring dashboards

---

## 📈 Monitoring & Observability

### Key Metrics to Track
```javascript
// utils/metrics.js

const metrics = {
  autocomplete: {
    latency: histogram("autocomplete_latency_ms"),
    cacheHitRate: gauge("autocomplete_cache_hit_rate"),
    requestsPerMinute: counter("autocomplete_requests_total")
  },
  detector: {
    latency: histogram("detector_latency_ms"),
    averageScore: gauge("detector_avg_score"),
    requestsPerMinute: counter("detector_requests_total")
  },
  humanizer: {
    latency: histogram("humanizer_latency_ms"),
    improvementRate: gauge("humanizer_improvement_rate"),
    requestsPerMinute: counter("humanizer_requests_total")
  },
  generator: {
    latency: histogram("generator_latency_ms"),
    wordsGenerated: counter("generator_words_total"),
    requestsPerMinute: counter("generator_requests_total")
  }
};
```

### Logging Strategy
- **Info:** Successful requests, cache hits
- **Warn:** Slow responses (>500ms), cache misses
- **Error:** Failed requests, timeouts, model errors
- **Debug:** Full request/response payloads (dev only)

---

## 🧪 Testing Strategy

### Unit Tests (90%+ coverage)
```javascript
// tests/unit/autocomplete.test.js

describe("AutocompleteService", () => {
  test("should return suggestions for valid prefix", async () => {
    const service = new AutocompleteService();
    const result = await service.getSuggestions({
      prefix: "ben",
      context: "Exercise has many health ",
      essayType: "academic"
    });
    
    expect(result.suggestions).toHaveLength(3);
    expect(result.suggestions[0].text).toMatch(/^ben/i);
    expect(result.suggestions[0].confidence).toBeGreaterThan(0.5);
  });

  test("should use cache for repeated requests", async () => {
    const service = new AutocompleteService();
    await service.getSuggestions({ prefix: "test", context: "test" });
    
    const cacheHit = await service.cache.get("test-test");
    expect(cacheHit).toBeDefined();
  });
});
```

### Integration Tests
```javascript
// tests/integration/ai-workflow.test.js

describe("Complete AI Workflow", () => {
  test("should generate, detect, and humanize text", async () => {
    // 1. Generate text
    const generated = await request(app)
      .post("/api/ai/generate")
      .send({ prompt: "Write about AI", length: "short" });
    
    expect(generated.body.generatedText).toBeDefined();
    
    // 2. Detect AI score
    const detection = await request(app)
      .post("/api/ai/detect")
      .send({ text: generated.body.generatedText });
    
    expect(detection.body.overallScore).toBeGreaterThan(0.7);
    
    // 3. Humanize the text
    const humanized = await request(app)
      .post("/api/ai/humanize")
      .send({ text: generated.body.generatedText, tone: "casual" });
    
    expect(humanized.body.metrics.aiLikelihoodAfter)
      .toBeLessThan(humanized.body.metrics.aiLikelihoodBefore);
  });
});
```

---

## 📝 Development Workflow

### Sprint 1: Backend Foundation (Week 4)
- [ ] Set up Express server with TypeScript
- [ ] Configure Supabase and Redis connections
- [ ] Implement authentication middleware
- [ ] Create rate limiting system
- [ ] Set up error handling and logging
- [ ] Write API documentation (OpenAPI/Swagger)

### Sprint 2: Core Services (Week 5)
- [ ] Implement AutocompleteService with caching
- [ ] Implement DetectorService (hybrid approach)
- [ ] Implement HumanizerService with context awareness
- [ ] Implement GeneratorService with streaming
- [ ] Write unit tests for all services (80%+ coverage)
- [ ] Set up CI/CD pipeline

### Sprint 3: Integration & Optimization (Week 6)
- [ ] Connect all services to Ollama
- [ ] Optimize prompt templates
- [ ] Implement request queuing for heavy load
- [ ] Add performance monitoring
- [ ] Write integration tests
- [ ] Deploy to staging environment

### Sprint 4: Frontend Integration (Week 7)
- [ ] Update frontend to call new endpoints
- [ ] Implement real-time autocomplete UI
- [ ] Add streaming generation in Prompt Panel
- [ ] Update Detector Panel with detailed results
- [ ] Add Humanizer comparison view
- [ ] User acceptance testing

---

## 🎯 Success Metrics

### Performance Targets
- **Autocomplete:** < 10ms latency (p95) - Rule-based
- **Detection:** < 100ms for 1000 words (statistical), < 3s with LLM fallback
- **Humanizer:** < 100ms for 500 words (rule-based), < 5s with LLM fallback
- **Generator:** < 4s for short content, < 8s for long content

### Quality Targets
- **Autocomplete Accuracy:** > 70% acceptance rate
- **Detection Accuracy:** > 85% on benchmark tests
- **Humanizer Effectiveness:** Reduce AI score by > 40%
- **Generator Quality:** User satisfaction > 4/5 stars

### Infrastructure Targets
- **Uptime:** 99.5%
- **Error Rate:** < 1%
- **Cache Hit Rate:** > 60% for autocomplete

---

## 💰 Cost Estimates (Monthly)

### Free Tier (MVP)
- Supabase: Free (500MB database, 50k monthly active users)
- Redis: **Local self-hosted with Docker ($0)**
- Ollama: **Local on your machine ($0)** - runs models on your GPU/CPU
- Hosting: **Railway Hobby Plan** (500 hrs/month free, then $5)
- **Total: $0/month**

### Startup Tier (100 users)
- Supabase: Pro ($25)
- Redis: Railway addon ($10)
- Ollama: Dedicated instance ($20)
- Hosting: Railway Pro ($20)
- Monitoring: Sentry Team ($26)
- **Total: ~$101/month**

### Growth Tier (1000+ users)
- Supabase: Pro ($25)
- Redis: Upstash Pay-as-you-go (~$30)
- Ollama: Multiple instances ($100)
- Hosting: Railway Team ($100)
- OpenAI Fallback: ~$50
- Monitoring: Sentry Team ($26)
- **Total: ~$331/month**

---

## 🔄 Orchestration Flow Examples

### Example 1: Autocomplete While Typing
```
User types "benefi" in editor
  ↓
Frontend debounces (200ms), sends request
  ↓
Backend checks Redis cache (miss)
  ↓
AutocompleteService builds prompt with context
  ↓
Ollama (qwen2.5:3b) generates 5 suggestions in 45ms
  ↓
Service ranks suggestions by confidence
  ↓
Response cached in Redis (TTL: 5min)
  ↓
Frontend displays suggestions
  ↓
User selects "benefits" → Cache hit on next similar query
```

### Example 2: Generate → Detect → Humanize Workflow
```
User enters prompt: "Write an intro about climate change"
  ↓
GeneratorService creates intro (8s)
  ↓
Text inserted into editor
  ↓
User clicks "Scan for AI" button
  ↓
DetectorService analyzes text (2.5s)
  ↓
Score: 0.85 (likely_ai) → UI highlights suspicious sections
  ↓
User selects flagged text + clicks "Humanize"
  ↓
HumanizerService rewrites with context (4s)
  ↓
DetectorService re-scans: Score drops to 0.32 (likely_human)
  ↓
User accepts changes → Text replaced in editor
```

### Example 3: Error Handling Chain
```
User requests text generation
  ↓
Ollama service is down
  ↓
Backend catches error, logs to Sentry
  ↓
Fallback to OpenAI API
  ↓
If OpenAI also fails → Return cached template
  ↓
If no cache → Return friendly error message
  ↓
Frontend displays: "AI service unavailable. Try again in a moment."
```

---

## 📚 API Documentation (OpenAPI Excerpt)

```yaml
openapi: 3.0.0
info:
  title: EssayForge AI API
  version: 1.0.0
  description: Backend API for AI-powered essay writing

paths:
  /api/ai/autocomplete:
    post:
      summary: Get word/phrase suggestions
      tags: [AI Services]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AutocompleteRequest'
      responses:
        200:
          description: Suggestions returned
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AutocompleteResponse'
        429:
          description: Rate limit exceeded

  /api/ai/detect:
    post:
      summary: Detect AI-generated content
      tags: [AI Services]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DetectRequest'
      responses:
        200:
          description: Detection results
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DetectResponse'

components:
  schemas:
    AutocompleteRequest:
      type: object
      required: [prefix, context]
      properties:
        prefix:
          type: string
          example: "benefi"
        context:
          type: string
          example: "Exercise has many health "
        cursorPosition:
          type: integer
        essayType:
          type: string
          enum: [academic, creative, research]
```

---

## 🚦 Next Steps

1. **Week 4 (Nov 11-17):**
   - [ ] Review and approve this plan
   - [ ] Set up backend folder structure
   - [ ] Initialize Express server with TypeScript
   - [ ] Configure Ollama locally and test models
   - [ ] Create stubbed API routes

2. **Week 5 (Nov 18-24):**
   - [ ] Implement all four services
   - [ ] Write unit tests
   - [ ] Set up Redis caching
   - [ ] Deploy to Railway staging

3. **Week 6 (Nov 25-Dec 1):**
   - [ ] Optimize prompts and performance
   - [ ] Write integration tests
   - [ ] Connect frontend to backend
   - [ ] User testing and iteration

4. **Week 7 (Dec 2-8):**
   - [ ] Production deployment
   - [ ] Monitoring setup
   - [ ] Documentation
   - [ ] Launch! 🚀

---

## 📎 Additional Resources

- **Ollama Documentation:** https://ollama.ai/docs
- **Express.js Best Practices:** https://expressjs.com/en/advanced/best-practice-performance.html
- **Supabase API Reference:** https://supabase.com/docs/reference/javascript
- **Redis Caching Patterns:** https://redis.io/topics/client-side-caching

---

**Document Version:** 1.0  
**Last Updated:** November 11, 2025  
**Owner:** EssayForge Development Team  
**Status:** Ready for Implementation
