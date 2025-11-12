/**
 * Simple test script for autocomplete service
 * Run with: node test-autocomplete.js
 */
import autocompleteService from '../services/autocompleteService.js';

console.log('🧪 Testing AutocompleteService...\n');

// Test 1: Simple prefix match
console.log('Test 1: Prefix "concl"');
const result1 = await autocompleteService.getSuggestions({
  prefix: 'concl',
  context: '',
  essayType: 'argumentative'
});
console.log('Results:', result1.suggestions.map(s => s.text));
console.log('Latency:', result1.latency + 'ms');
console.log('Cached:', result1.cached);
console.log();

// Test 2: With context for phrase suggestions
console.log('Test 2: Prefix "addi" with context "in"');
const result2 = await autocompleteService.getSuggestions({
  prefix: 'addi',
  context: 'The research shows positive results. In',
  essayType: 'research'
});
console.log('Results:', result2.suggestions.map(s => s.text));
console.log('Latency:', result2.latency + 'ms');
console.log();

// Test 3: Cache test (same query as Test 1)
console.log('Test 3: Cache test - same query as Test 1');
const result3 = await autocompleteService.getSuggestions({
  prefix: 'concl',
  context: '',
  essayType: 'argumentative'
});
console.log('Results:', result3.suggestions.map(s => s.text));
console.log('Latency:', result3.latency + 'ms');
console.log('Cached:', result3.cached);
console.log();

// Test 4: Essay-type specific
console.log('Test 4: Prefix "arg" with essay type "argumentative"');
const result4 = await autocompleteService.getSuggestions({
  prefix: 'arg',
  context: '',
  essayType: 'argumentative'
});
console.log('Results:', result4.suggestions.map(s => `${s.text} (${s.source})`));
console.log('Latency:', result4.latency + 'ms');
console.log();

// Test 5: Performance test
console.log('Test 5: Performance test (100 queries)');
const start = Date.now();
for (let i = 0; i < 100; i++) {
  await autocompleteService.getSuggestions({
    prefix: 'demo',
    context: '',
    essayType: 'research'
  });
}
const total = Date.now() - start;
console.log('Total time for 100 queries:', total + 'ms');
console.log('Average per query:', (total / 100).toFixed(2) + 'ms');
console.log();

console.log('✅ All tests completed!');
process.exit(0);
