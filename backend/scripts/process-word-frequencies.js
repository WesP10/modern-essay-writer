import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Process the count_1w.txt file and create a JSON file with word frequencies
 * Format: word\tcount
 * We'll normalize frequencies to a 0-1000 scale for better trie performance
 */

const inputFile = path.join(__dirname, '../data/count_1w.txt');
const outputFile = path.join(__dirname, '../data/word-frequencies.json');

console.log('Processing word frequency data...');
console.log('Input:', inputFile);
console.log('Output:', outputFile);

try {
  const data = fs.readFileSync(inputFile, 'utf8');
  const lines = data.split('\n').filter(line => line.trim());
  
  console.log(`\nTotal lines: ${lines.length}`);
  
  // Parse words and frequencies
  const wordFreqs = [];
  let maxFreq = 0;
  
  for (const line of lines) {
    const parts = line.trim().split('\t');
    if (parts.length !== 2) continue;
    
    const word = parts[0].toLowerCase();
    const count = parseInt(parts[1], 10);
    
    if (!word || isNaN(count) || count <= 0) continue;
    
    // Skip very short words (single letters except 'a' and 'i')
    if (word.length === 1 && word !== 'a' && word !== 'i') continue;
    
    // Skip words with non-alphabetic characters
    if (!/^[a-z]+$/.test(word)) continue;
    
    wordFreqs.push({ word, count });
    maxFreq = Math.max(maxFreq, count);
  }
  
  console.log(`Valid words: ${wordFreqs.length}`);
  console.log(`Max frequency: ${maxFreq.toLocaleString()}`);
  
  // Normalize frequencies to 0-1000 scale using log scale
  // This gives better distribution for autocomplete ranking
  const logMax = Math.log(maxFreq);
  
  const normalized = wordFreqs.map(({ word, count }) => {
    // Use logarithmic scaling to compress the range
    const logCount = Math.log(count);
    const normalized = Math.round((logCount / logMax) * 1000);
    return { word, frequency: Math.max(1, normalized) };
  });
  
  // Sort by frequency (highest first) for better trie insertion
  normalized.sort((a, b) => b.frequency - a.frequency);
  
  // Convert to object format for faster lookups
  const result = {};
  for (const { word, frequency } of normalized) {
    result[word] = frequency;
  }
  
  // Write to file
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
  
  console.log('\n✅ Processing complete!');
  console.log(`Words processed: ${Object.keys(result).length}`);
  console.log(`Output file: ${outputFile}`);
  console.log(`File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
  
  // Show some examples
  console.log('\nTop 20 words by frequency:');
  const top20 = normalized.slice(0, 20);
  for (const { word, frequency } of top20) {
    console.log(`  ${word.padEnd(15)} ${frequency}`);
  }
  
  // Show some example words for autocomplete testing
  console.log('\nExample autocomplete words:');
  const examples = ['conclude', 'conclusion', 'concept', 'research', 'analyze', 'important'];
  for (const word of examples) {
    if (result[word]) {
      console.log(`  ${word.padEnd(15)} ${result[word]}`);
    }
  }
  
} catch (error) {
  console.error('❌ Error processing file:', error);
  process.exit(1);
}
