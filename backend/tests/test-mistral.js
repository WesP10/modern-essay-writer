import orchestrator from '../services/autocomplete/AutocompleteOrchestrator.js';

async function testMistral() {
  console.log('🧪 Testing Optimized Fast LLM Queries...\n');
  
  await orchestrator.initialize();
  
  // Test 1: Mid-sentence completion (minimal context)
  const context1 = 'Climate change represents one of the most pressing challenges facing humanity today. Rising global temperatures have led to more frequent extreme weather events. Scientists worldwide have documented alarming trends in ice sheet';
  
  console.log('Test 1: Fast mid-sentence completion');
  console.log('Last 40 chars:', '...' + context1.slice(-40));
  
  let startTime = Date.now();
  let result = await orchestrator.getSuggestions({
    text: context1,
    cursorPosition: context1.length,
    triggerType: 'idle',
    enableLLM: true,
    essayType: 'argumentative'
  });
  let elapsed = Date.now() - startTime;
  
  console.log(`✅ Response in ${elapsed}ms`);
  console.log('LLM Suggestions:', result.suggestions.filter(s => s.source === 'llm').length);
  result.suggestions.slice(0, 5).forEach((s, i) => {
    const text = typeof s === 'string' ? s : s.text || JSON.stringify(s);
    const source = s.source ? ` [${s.source}]` : '';
    console.log(`  ${i + 1}. ${text}${source}`);
  });
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 2: After sentence (minimal context)
  const context2 = 'Climate change represents one of the most pressing challenges facing humanity today. Rising global temperatures have led to more frequent extreme weather events. Scientists worldwide have documented alarming trends.';
  
  console.log('Test 2: Fast next phrase after sentence');
  console.log('Last 60 chars:', '...' + context2.slice(-60));
  
  startTime = Date.now();
  result = await orchestrator.getSuggestions({
    text: context2,
    cursorPosition: context2.length,
    triggerType: 'idle',
    enableLLM: true,
    essayType: 'research'
  });
  elapsed = Date.now() - startTime;
  
  console.log(`✅ Response in ${elapsed}ms`);
  console.log('LLM Suggestions:', result.suggestions.filter(s => s.source === 'llm').length);
  result.suggestions.slice(0, 5).forEach((s, i) => {
    const text = typeof s === 'string' ? s : s.text || JSON.stringify(s);
    const source = s.source ? ` [${s.source}]` : '';
    console.log(`  ${i + 1}. ${text}${source}`);
  });
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 3: Very short context
  const context3 = 'The evidence suggests that immediate';
  
  console.log('Test 3: Very minimal context (last few words)');
  console.log('Context:', context3);
  
  startTime = Date.now();
  result = await orchestrator.getSuggestions({
    text: context3,
    cursorPosition: context3.length,
    triggerType: 'idle',
    enableLLM: true
  });
  elapsed = Date.now() - startTime;
  
  console.log(`✅ Response in ${elapsed}ms`);
  console.log('LLM Suggestions:', result.suggestions.filter(s => s.source === 'llm').length);
  result.suggestions.slice(0, 5).forEach((s, i) => {
    const text = typeof s === 'string' ? s : s.text || JSON.stringify(s);
    const source = s.source ? ` [${s.source}]` : '';
    console.log(`  ${i + 1}. ${text}${source}`);
  });
}

testMistral().catch(console.error);
