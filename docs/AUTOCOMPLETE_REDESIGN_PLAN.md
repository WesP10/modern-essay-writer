# 🎯 Autocomplete Redesign Plan

## Overview
Restructuring the autocomplete system into three distinct, modular engines with clear performance targets and separation of concerns.

---

## 🏗️ Architecture

```
User Types
    ↓
┌─────────────────────────────────────────────────────────┐
│                  ORCHESTRATOR                            │
│  Decides which engine(s) to invoke based on context     │
└─────────────────────────────────────────────────────────┘
    ↓ ↓ ↓
    │ │ └──────────────────────────────────────┐
    │ └──────────────────────┐                  │
    ↓                        ↓                  ↓
┌─────────────┐    ┌──────────────────┐   ┌──────────────┐
│ TRIE ENGINE │    │  N-GRAM ENGINE   │   │  LLM ENGINE  │
│  <10ms      │    │    <50ms         │   │  200-500ms   │
│  Word-level │    │  Phrase-level    │   │  Contextual  │
└─────────────┘    └──────────────────┘   └──────────────┘
```

---

## 📊 Layer Specifications

### **Layer 1: Trie Engine** (Every keystroke)
**Purpose:** Ultra-fast word completion  
**Trigger:** Every keystroke while typing a word  
**Target Latency:** <10ms  
**Output:** Top 5-10 word completions with frequency scores

**Implementation:**
- **Compressed Radix Trie** (reduces memory by ~40%)
- **Frequency-weighted nodes** for smart ranking
- **LRU cache** for recent prefix queries (1000 entries)
- **Dictionary size:** 500k+ words (expandable)

**Data Structure:**
```javascript
{
  root: {
    'a': {
      'c': {
        'a': { 
          'd': { 
            'e': { 
              'm': { 
                'i': { 
                  'c': { 
                    isWord: true, 
                    frequency: 8523,
                    word: 'academic'
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

---

### **Layer 2: N-gram Engine** (After word boundary)
**Purpose:** Short phrase prediction  
**Trigger:** Space bar pressed (word boundary detected)  
**Target Latency:** <50ms  
**Output:** Top 3-5 phrase continuations

**Implementation:**
- **Bi-grams, Tri-grams, 4-grams, 5-grams**
- **Kneser-Ney smoothing** for unseen n-grams
- **Context window:** Last 3 words typed
- **Precomputed probabilities** stored in hash map

**Algorithm:**
```
P(w₃ | w₁, w₂) = Count(w₁, w₂, w₃) / Count(w₁, w₂)

With smoothing:
P_KN(w₃ | w₁, w₂) = max(Count(w₁,w₂,w₃) - δ, 0) / Count(w₁,w₂) + λ × P_KN(w₃ | w₂)
```

**Training Corpus:**
- Academic writing samples
- Essay databases
- Research papers
- Common phrase patterns

**Example:**
```javascript
Bigrams: {
  "in": ["addition", "conclusion", "fact", "summary", "contrast"],
  "on": ["the", "behalf", "account", "average"],
  "for": ["example", "instance", "this", "the"]
}

Trigrams: {
  "in_addition": ["to", "the", "it"],
  "on_the": ["other", "contrary", "basis", "whole"],
  "for_this": ["reason", "purpose", "study"]
}
```

---

### **Layer 3: LLM Engine** (Idle timeout)
**Purpose:** Contextual, long-form suggestions  
**Trigger:** User stops typing for 2-3 seconds  
**Target Latency:** 200-500ms (async, non-blocking)  
**Output:** 1-3 contextual suggestions (shown as ghost text)

**Rules:**
- **If blank/new line:** Suggest sentence starters
- **If mid-word:** Only complete current word (fallback if Trie fails)
- **If after sentence:** Suggest next sentence continuation
- **Context window:** Last 200 characters

**Optimization:**
- **Smaller model:** Use gemma3:1b or distilled models
- **Async execution:** Non-blocking UI
- **Visual distinction:** Ghost text (gray, italic)
- **Cache:** Store recent context→suggestion mappings

**Throttling Logic:**
```javascript
- If typing: LLM disabled
- If idle 2s + context >50 chars: LLM enabled
- If LLM call in progress: Queue, don't duplicate
- Max 1 LLM call per 3 seconds
```

---

## 🎯 Decision Tree

```
User types character
    ↓
Is it mid-word?
    ├── YES → Trie Engine (instant word completions)
    └── NO → Is it a space?
            ├── YES → N-gram Engine (phrase suggestions)
            └── NO → Is user idle >2s?
                    ├── YES → LLM Engine (contextual)
                    └── NO → Wait
```

---

## 📈 Performance Targets

| Engine | Trigger | Latency | Success Rate |
|--------|---------|---------|--------------|
| Trie | Every keystroke | <10ms | 85% relevance |
| N-gram | Word boundary | <50ms | 90% relevance |
| LLM | Idle timeout | 200-500ms | 95% relevance |

**Overall Goals:**
- 95% of interactions <50ms
- 99% of interactions <500ms
- Zero blocking operations
- Smooth, imperceptible transitions

---

## 🗂️ File Structure

```
backend/
  services/
    autocomplete/
      TrieEngine.js           # Fast word completion
      NgramEngine.js          # Phrase prediction
      LLMEngine.js            # Contextual suggestions
      AutocompleteOrchestrator.js  # Coordinates all engines
  data/
    dictionaries/
      words-500k.json         # Large word dictionary
      academic-vocab.json     # Academic-specific words
    ngrams/
      bigrams.json           # Precomputed bigrams
      trigrams.json          # Precomputed trigrams
      fourgrams.json         # Precomputed 4-grams
  training/
    build-ngrams.js          # Script to build n-gram models
    train-corpus.txt         # Training text corpus
```

---

## 🔧 Implementation Steps

### Phase 1: Trie Engine (Week 1)
1. ✅ Implement compressed radix trie
2. ✅ Load 500k word dictionary with frequencies
3. ✅ Add LRU caching layer
4. ✅ Benchmark: Ensure <10ms lookups
5. ✅ Unit tests for edge cases

### Phase 2: N-gram Engine (Week 2)
1. ✅ Collect training corpus (academic essays, papers)
2. ✅ Build n-gram model (bi/tri/4/5-grams)
3. ✅ Implement Kneser-Ney smoothing
4. ✅ Precompute probabilities, store in efficient format
5. ✅ Benchmark: Ensure <50ms lookups
6. ✅ Unit tests for phrase prediction

### Phase 3: LLM Engine (Week 3)
1. ✅ Implement idle detection (debounce)
2. ✅ Add async LLM call with timeout
3. ✅ Implement throttling logic
4. ✅ Add context-aware rules (blank/mid-word/sentence)
5. ✅ Cache LLM results
6. ✅ Visual distinction (ghost text API)

### Phase 4: Orchestrator (Week 4)
1. ✅ Build decision tree logic
2. ✅ Merge results from multiple engines
3. ✅ Implement conflict resolution
4. ✅ Add telemetry (which engine served result)
5. ✅ Integration tests

### Phase 5: Frontend Integration (Week 5)
1. ✅ Update Editor component for idle detection
2. ✅ Implement ghost text rendering
3. ✅ Add visual indicators (engine badges)
4. ✅ Performance monitoring
5. ✅ UX testing

---

## 📊 Data Preparation

### Dictionary Sources
- **SCOWL (500k+ words):** http://wordlist.aspell.net/
- **Google Books Ngrams:** Word frequencies
- **Academic Word List (AWL):** Specialized vocabulary
- **User-contributed words:** Dynamic additions

### N-gram Training Corpus
- **Academic essays:** 1000+ sample essays
- **Research papers:** 500+ abstracts
- **Common phrases:** Manually curated
- **Total corpus size:** ~5-10 million words

### Precomputation
```bash
# Build n-grams
node backend/training/build-ngrams.js

# Output:
# - bigrams.json (~2 MB)
# - trigrams.json (~10 MB)
# - fourgrams.json (~20 MB)
# Total: ~32 MB (gzipped: ~8 MB)
```

---

## 🎨 UX Improvements

### Visual Feedback
```
User types: "in a"

Trie suggestions (instant):
  in a[ddition]    [Trie]
  in a[ccordance]  [Trie]
  in a[ll]         [Trie]

N-gram suggestions (after space):
  in addition to   [N-gram]
  in accordance with [N-gram]

LLM suggestion (after 2s idle):
  "in addition to this, the evidence suggests..." [LLM] (ghost text)
```

### Dropdown Design
```
┌─────────────────────────────────────────┐
│ addition        [Trie]  95%            │  ← Selected
│ in addition to  [N-gram] 92%           │
│ accordance      [Trie]  88%            │
│ all likelihood  [N-gram] 85%           │
│ a similar vein  [N-gram] 82%           │
├─────────────────────────────────────────┤
│ 💡 in addition to this, the evidence... │  ← Ghost text (LLM)
│    (Press Tab to accept)                 │
└─────────────────────────────────────────┘
```

---

## 🧪 Testing Strategy

### Unit Tests
- Trie: Prefix lookups, edge cases, memory usage
- N-gram: Probability calculations, smoothing
- LLM: Throttling, caching, context rules

### Integration Tests
- Orchestrator decision tree
- Multi-engine result merging
- Cache coherence

### Performance Tests
- Load test: 1000 queries/second
- Latency test: P50, P95, P99
- Memory profiling

### UX Tests
- A/B testing different trigger timings
- User feedback on suggestion quality
- Acceptance rate tracking

---

## 📈 Success Metrics

### Technical Metrics
- **Trie latency:** <10ms (99th percentile)
- **N-gram latency:** <50ms (99th percentile)
- **LLM latency:** <500ms (95th percentile)
- **Memory usage:** <100 MB (all engines combined)
- **Cache hit rate:** >70%

### User Metrics
- **Acceptance rate:** >40% (industry standard: 25-30%)
- **Keystroke savings:** >30%
- **User satisfaction:** >4.0/5.0
- **No perceived lag:** <5% user complaints

---

## 🔒 Scalability Considerations

### Memory Management
- Trie: ~50 MB (500k words)
- N-grams: ~32 MB (compressed)
- Caches: ~20 MB
- **Total:** ~100 MB

### Horizontal Scaling
- All engines stateless (except caches)
- Can run on separate processes
- Redis for shared cache layer

### Future Enhancements
- WebAssembly trie for browser-side completion
- Federated learning for personalization
- Domain-specific n-gram models
- Real-time model updates

---

## 🚀 Migration Plan

### Week 1: Parallel Development
- Keep existing system running
- Build new engines alongside
- Feature flag for testing

### Week 2: A/B Testing
- 10% traffic to new system
- Monitor metrics
- Fix bugs

### Week 3: Gradual Rollout
- 50% traffic
- Performance tuning
- User feedback

### Week 4: Full Migration
- 100% traffic
- Deprecate old system
- Documentation

---

## 📚 References

- **Radix Trie:** https://en.wikipedia.org/wiki/Radix_tree
- **Kneser-Ney Smoothing:** https://www.cs.cornell.edu/courses/cs4740/2014sp/lectures/smoothing+backoff.pdf
- **Google N-gram Viewer:** https://books.google.com/ngrams
- **Academic Word List:** https://www.victoria.ac.nz/lals/resources/academicwordlist

---

## ✅ Action Items

**Immediate (This Week):**
- [ ] Set up new file structure
- [ ] Download 500k word dictionary
- [ ] Implement basic TrieEngine
- [ ] Benchmark current vs new system

**Short-term (Next 2 Weeks):**
- [ ] Complete TrieEngine with caching
- [ ] Build n-gram training pipeline
- [ ] Implement NgramEngine
- [ ] Create Orchestrator skeleton

**Medium-term (Next Month):**
- [ ] LLM throttling and async execution
- [ ] Frontend integration (ghost text)
- [ ] A/B testing framework
- [ ] Performance monitoring dashboard

---

**This plan transforms the autocomplete from "clunky" to "blazing fast + intelligent"** 🚀
