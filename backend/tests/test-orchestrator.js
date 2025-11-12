import autocompleteOrchestrator from '../services/autocomplete/AutocompleteOrchestrator.js';
import { logger } from '../utils/logger.js';

/**
 * Test the new autocomplete orchestrator
 */
async function runTests() {
  console.log('🧪 Testing AutocompleteOrchestrator\n');
  console.log('='.repeat(60));
  
  try {
    // Initialize orchestrator
    console.log('\n1️⃣  Initializing orchestrator...');
    await autocompleteOrchestrator.initialize();
    console.log('   ✓ Orchestrator initialized');
    
    // Test 1: Trie Engine (mid-word)
    console.log('\n2️⃣  Testing Trie Engine (word completion)');
    const test1 = await autocompleteOrchestrator.getSuggestions({
      text: 'The resea',
      cursorPosition: 9,
      triggerType: 'keystroke',
      enableLLM: false
    });
    
    console.log(`   Latency: ${test1.latency}ms`);
    console.log(`   Engine: ${test1.engine}`);
    console.log(`   Suggestions:`, test1.suggestions.map(s => s.text));
    console.log(`   ✓ ${test1.latency < 10 ? 'PASS' : 'SLOW'} (target: <10ms)`);
    
    // Test 2: N-gram Engine (after space)
    console.log('\n3️⃣  Testing N-gram Engine (phrase prediction)');
    const test2 = await autocompleteOrchestrator.getSuggestions({
      text: 'In conclusion, the ',
      cursorPosition: 19,
      triggerType: 'space',
      enableLLM: false
    });
    
    console.log(`   Latency: ${test2.latency}ms`);
    console.log(`   Engine: ${test2.engine}`);
    console.log(`   Suggestions:`, test2.suggestions.map(s => s.text));
    console.log(`   ✓ ${test2.latency < 50 ? 'PASS' : 'SLOW'} (target: <50ms)`);
    
    // Test 3: LLM Engine (contextual)
    console.log('\n4️⃣  Testing LLM Engine (contextual suggestion)');
    const test3 = await autocompleteOrchestrator.getSuggestions({
      text: 'Climate change poses a significant threat to ecosystems. ',
      cursorPosition: 58,
      triggerType: 'idle',
      enableLLM: true
    });
    
    console.log(`   Latency: ${test3.latency}ms`);
    console.log(`   Engine: ${test3.engine}`);
    console.log(`   Engines used:`, test3.engines);
    console.log(`   Suggestions:`, test3.suggestions.map(s => s.text));
    console.log(`   ✓ ${test3.latency < 1000 ? 'PASS' : 'SLOW'} (target: <500ms, acceptable: <1000ms)`);
    
    // Test 4: Auto mode (orchestrator decides)
    console.log('\n5️⃣  Testing Auto Mode (orchestrator decision tree)');
    const test4 = await autocompleteOrchestrator.getSuggestions({
      text: 'The evidence sugge',
      cursorPosition: 18,
      triggerType: 'auto',
      enableLLM: false
    });
    
    console.log(`   Latency: ${test4.latency}ms`);
    console.log(`   Engine: ${test4.engine}`);
    console.log(`   Context type: ${test4.metadata.analysisType}`);
    console.log(`   Suggestions:`, test4.suggestions.map(s => s.text));
    
    // Test 5: Multiple contexts
    console.log('\n6️⃣  Testing Multiple Contexts');
    
    const contexts = [
      { text: '', pos: 0, desc: 'Empty document' },
      { text: 'The ', pos: 4, desc: 'After space' },
      { text: 'Furthermore, ', pos: 13, desc: 'After comma+space' },
      { text: 'This suggests that human activities are responsible. ', pos: 54, desc: 'After sentence' }
    ];
    
    for (const ctx of contexts) {
      const result = await autocompleteOrchestrator.getSuggestions({
        text: ctx.text,
        cursorPosition: ctx.pos,
        triggerType: 'auto',
        enableLLM: false
      });
      
      console.log(`   ${ctx.desc}:`);
      console.log(`     Engines: ${result.engines.join('+') || 'none'}`);
      console.log(`     Latency: ${result.latency}ms`);
      console.log(`     Suggestions: ${result.suggestions.length}`);
    }
    
    // Statistics
    console.log('\n7️⃣  Overall Statistics');
    const stats = autocompleteOrchestrator.getStats();
    
    console.log(`   Orchestrator:`);
    console.log(`     Total requests: ${stats.orchestrator.totalRequests}`);
    console.log(`     Avg latency: ${stats.orchestrator.avgLatency}ms`);
    console.log(`     Trie requests: ${stats.orchestrator.trieRequests}`);
    console.log(`     N-gram requests: ${stats.orchestrator.ngramRequests}`);
    console.log(`     LLM requests: ${stats.orchestrator.llmRequests}`);
    
    console.log(`\n   Trie Engine:`);
    console.log(`     Cache hit rate: ${(parseFloat(stats.trie.cacheHitRate) * 100).toFixed(1)}%`);
    console.log(`     Total queries: ${stats.trie.totalQueries}`);
    
    console.log(`\n   N-gram Engine:`);
    console.log(`     Bigrams: ${stats.ngram.bigramCount}`);
    console.log(`     Trigrams: ${stats.ngram.trigramCount}`);
    console.log(`     Cache hit rate: ${(parseFloat(stats.ngram.cacheHitRate) * 100).toFixed(1)}%`);
    
    console.log(`\n   LLM Engine:`);
    console.log(`     Cache hit rate: ${(parseFloat(stats.llm.cacheHitRate) * 100).toFixed(1)}%`);
    console.log(`     Timeouts: ${stats.llm.timeouts}`);
    console.log(`     Pending: ${stats.llm.pendingRequests}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!\n');
    
    // Performance summary
    console.log('📊 Performance Summary:');
    console.log(`   Trie (word): ${test1.latency}ms ${test1.latency < 10 ? '✓' : '⚠️'}`);
    console.log(`   N-gram (phrase): ${test2.latency}ms ${test2.latency < 50 ? '✓' : '⚠️'}`);
    console.log(`   LLM (contextual): ${test3.latency}ms ${test3.latency < 500 ? '✓' : test3.latency < 1000 ? '~' : '⚠️'}`);
    console.log(`   Average: ${stats.orchestrator.avgLatency}ms\n`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
