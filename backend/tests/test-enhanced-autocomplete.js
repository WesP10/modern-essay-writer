/**
 * Enhanced Autocomplete Service Test Suite
 * Demonstrates multi-tier suggestions with LLM integration
 * 
 * Run with: node test-enhanced-autocomplete.js
 */
import enhancedAutocompleteService from '../services/enhancedAutocompleteService.js';

console.log('🚀 Testing Enhanced AutocompleteService with LLM Integration\n');
console.log('=' .repeat(70));

// Test 1: Simple prefix - should use Tier 1 (dictionary)
console.log('\n📝 Test 1: Basic Prefix Matching (Tier 1 - Dictionary)');
console.log('-'.repeat(70));
const result1 = await enhancedAutocompleteService.getSuggestions({
  prefix: 'concl',
  context: '',
  essayType: 'argumentative',
  enableLLM: false
});
console.log(`Query: "concl"`);
console.log(`Suggestions: ${result1.suggestions.map(s => `${s.text} (${s.source})`).join(', ')}`);
console.log(`Latency: ${result1.latency}ms | Tier: ${result1.tier} | Cached: ${result1.cached}`);

// Test 2: Context-based phrase suggestions - Tier 2 (N-gram + patterns)
console.log('\n📝 Test 2: Context-Aware Phrase Suggestions (Tier 2 - N-gram)');
console.log('-'.repeat(70));
const result2 = await enhancedAutocompleteService.getSuggestions({
  prefix: 'addi',
  context: 'The research shows positive results. In',
  essayType: 'research',
  enableLLM: false
});
console.log(`Query: "addi" with context: "...In"`);
console.log(`Suggestions:`);
result2.suggestions.forEach(s => {
  console.log(`  - ${s.text} (confidence: ${s.confidence.toFixed(2)}, source: ${s.source}, tier: ${s.tier})`);
});
console.log(`Latency: ${result2.latency}ms | Tier: ${result2.tier}`);

// Test 3: Multi-word phrase completion
console.log('\n📝 Test 3: Multi-Word Phrase Completion (Tier 2)');
console.log('-'.repeat(70));
const result3 = await enhancedAutocompleteService.getSuggestions({
  prefix: 'oth',
  context: 'Some argue one way. On the',
  essayType: 'argumentative',
  enableLLM: false
});
console.log(`Query: "oth" with context: "On the"`);
console.log(`Suggestions:`);
result3.suggestions.forEach(s => {
  console.log(`  - ${s.text} (${s.source}) ${s.fullPhrase ? `[from: "${s.fullPhrase}"]` : ''}`);
});
console.log(`Latency: ${result3.latency}ms`);

// Test 4: LLM-powered suggestions (Tier 3)
console.log('\n📝 Test 4: LLM-Powered Context Suggestions (Tier 3 - Smart)');
console.log('-'.repeat(70));
console.log('⚠️  Note: This test requires Ollama running with llama2 model');
console.log('    If Ollama is not available, it will fall back to Tier 1/2');
const result4 = await enhancedAutocompleteService.getSuggestions({
  prefix: 'there',
  context: 'Climate change is a significant global issue. The evidence clearly demonstrates that temperatures are rising. Moreover, scientific consensus supports this conclusion.',
  essayType: 'argumentative',
  enableLLM: true, // Enable LLM for this test
  maxSuggestions: 8
});
console.log(`Query: "there" with rich context`);
console.log(`Suggestions:`);
result4.suggestions.forEach(s => {
  console.log(`  - ${s.text} (confidence: ${s.confidence.toFixed(2)}, source: ${s.source}, tier: ${s.tier}, type: ${s.type})`);
});
console.log(`Latency: ${result4.latency}ms | Tier: ${result4.tier} | Cached: ${result4.cached}`);

// Test 5: User preference learning
console.log('\n📝 Test 5: User Preference Learning');
console.log('-'.repeat(70));
// Simulate user selections
enhancedAutocompleteService.recordSelection('furthermore', 'argumentative');
enhancedAutocompleteService.recordSelection('furthermore', 'argumentative');
enhancedAutocompleteService.recordSelection('furthermore', 'argumentative');

const result5a = await enhancedAutocompleteService.getSuggestions({
  prefix: 'furth',
  context: '',
  essayType: 'argumentative',
  enableLLM: false
});
console.log('After recording 3 selections of "furthermore":');
console.log(`Suggestions:`);
result5a.suggestions.forEach(s => {
  console.log(`  - ${s.text} (confidence: ${s.confidence.toFixed(2)})`);
});

// Test 6: Cache performance
console.log('\n📝 Test 6: Cache Performance Test');
console.log('-'.repeat(70));
const result6a = await enhancedAutocompleteService.getSuggestions({
  prefix: 'demon',
  context: 'The study clearly',
  essayType: 'research',
  enableLLM: false
});
console.log(`First call - Latency: ${result6a.latency}ms (not cached)`);

const result6b = await enhancedAutocompleteService.getSuggestions({
  prefix: 'demon',
  context: 'The study clearly',
  essayType: 'research',
  enableLLM: false
});
console.log(`Second call - Latency: ${result6b.latency}ms (cached: ${result6b.cached})`);

// Test 7: Performance benchmark
console.log('\n📝 Test 7: Performance Benchmark (100 queries)');
console.log('-'.repeat(70));
const testPrefixes = ['concl', 'furth', 'howev', 'there', 'moreo', 'neverthel', 'demon', 'indic', 'sugge', 'impor'];
const start = Date.now();
let tier1Count = 0, tier2Count = 0, tier3Count = 0;

for (let i = 0; i < 100; i++) {
  const prefix = testPrefixes[i % testPrefixes.length];
  const result = await enhancedAutocompleteService.getSuggestions({
    prefix,
    context: i % 3 === 0 ? 'The research shows' : '',
    essayType: 'research',
    enableLLM: false
  });
  
  if (result.tier === 1) tier1Count++;
  else if (result.tier === 2) tier2Count++;
  else if (result.tier === 3) tier3Count++;
}

const total = Date.now() - start;
console.log(`Total time: ${total}ms`);
console.log(`Average per query: ${(total / 100).toFixed(2)}ms`);
console.log(`Tier distribution: T1: ${tier1Count}, T2: ${tier2Count}, T3: ${tier3Count}`);

// Test 8: Statistics
console.log('\n📊 Service Statistics');
console.log('-'.repeat(70));
const stats = enhancedAutocompleteService.getStats();
console.log(`Cache size: ${stats.cacheSize}/${1000}`);
console.log(`LLM cache size: ${stats.llmCacheSize}/100`);
console.log(`User preferences: ${stats.userPreferences}`);
console.log(`N-gram contexts: ${stats.ngramContexts}`);

console.log('\n' + '='.repeat(70));
console.log('✅ All tests completed!');
console.log('\n💡 Key Improvements:');
console.log('  ✓ Multi-tier architecture (instant → fast → smart)');
console.log('  ✓ N-gram statistical predictions');
console.log('  ✓ Enhanced phrase pattern matching');
console.log('  ✓ LLM integration for context-aware suggestions');
console.log('  ✓ User preference learning');
console.log('  ✓ Advanced caching strategy');
console.log('  ✓ Multi-word completion support');

process.exit(0);
