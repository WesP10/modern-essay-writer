import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Build n-gram models from training corpus
 * This script processes text files and generates bigram, trigram, and higher-order n-grams
 */
class NgramBuilder {
  constructor() {
    this.bigrams = new Map();
    this.trigrams = new Map();
    this.fourgrams = new Map();
    this.fivegrams = new Map();
    
    this.bigramCounts = new Map();
    this.trigramCounts = new Map();
  }

  /**
   * Tokenize text into words
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  /**
   * Process text and extract n-grams
   */
  processText(text) {
    const words = this.tokenize(text);
    
    if (words.length < 2) return;
    
    // Extract n-grams
    for (let i = 0; i < words.length; i++) {
      // Bigrams
      if (i < words.length - 1) {
        this.addBigram(words[i], words[i + 1]);
      }
      
      // Trigrams
      if (i < words.length - 2) {
        this.addTrigram(words[i], words[i + 1], words[i + 2]);
      }
      
      // 4-grams
      if (i < words.length - 3) {
        this.addFourgram(words[i], words[i + 1], words[i + 2], words[i + 3]);
      }
      
      // 5-grams
      if (i < words.length - 4) {
        this.addFivegram(words[i], words[i + 1], words[i + 2], words[i + 3], words[i + 4]);
      }
    }
  }

  /**
   * Add bigram
   */
  addBigram(w1, w2) {
    const key = w1;
    
    if (!this.bigrams.has(key)) {
      this.bigrams.set(key, new Map());
    }
    
    const continuations = this.bigrams.get(key);
    continuations.set(w2, (continuations.get(w2) || 0) + 1);
    
    // Track counts for probability calculation
    const countKey = `${w1}`;
    this.bigramCounts.set(countKey, (this.bigramCounts.get(countKey) || 0) + 1);
  }

  /**
   * Add trigram
   */
  addTrigram(w1, w2, w3) {
    const key = `${w1}_${w2}`;
    
    if (!this.trigrams.has(key)) {
      this.trigrams.set(key, new Map());
    }
    
    const continuations = this.trigrams.get(key);
    continuations.set(w3, (continuations.get(w3) || 0) + 1);
    
    // Track counts
    const countKey = `${w1}_${w2}`;
    this.trigramCounts.set(countKey, (this.trigramCounts.get(countKey) || 0) + 1);
  }

  /**
   * Add 4-gram
   */
  addFourgram(w1, w2, w3, w4) {
    const key = `${w1}_${w2}_${w3}`;
    
    if (!this.fourgrams.has(key)) {
      this.fourgrams.set(key, new Map());
    }
    
    const continuations = this.fourgrams.get(key);
    continuations.set(w4, (continuations.get(w4) || 0) + 1);
  }

  /**
   * Add 5-gram
   */
  addFivegram(w1, w2, w3, w4, w5) {
    const key = `${w1}_${w2}_${w3}_${w4}`;
    
    if (!this.fivegrams.has(key)) {
      this.fivegrams.set(key, new Map());
    }
    
    const continuations = this.fivegrams.get(key);
    continuations.set(w5, (continuations.get(w5) || 0) + 1);
  }

  /**
   * Convert n-gram maps to JSON format
   */
  toJSON(ngramMap, minCount = 2, topN = 10) {
    const result = {};
    
    for (const [key, continuations] of ngramMap) {
      // Convert continuations to sorted array
      const sorted = Array.from(continuations.entries())
        .filter(([word, count]) => count >= minCount)
        .sort((a, b) => b[1] - a[1]) // Sort by count descending
        .slice(0, topN)
        .map(([word, count]) => ({
          text: word,
          count
        }));
      
      if (sorted.length > 0) {
        result[key] = sorted;
      }
    }
    
    return result;
  }

  /**
   * Save n-grams to files
   */
  save(outputDir) {
    console.log('Converting n-grams to JSON...');
    
    const bigrams = this.toJSON(this.bigrams, 2, 15);
    const trigrams = this.toJSON(this.trigrams, 2, 10);
    const fourgrams = this.toJSON(this.fourgrams, 2, 8);
    const fivegrams = this.toJSON(this.fivegrams, 2, 5);
    
    console.log('Writing files...');
    
    writeFileSync(
      join(outputDir, 'bigrams.json'),
      JSON.stringify(bigrams, null, 2)
    );
    
    writeFileSync(
      join(outputDir, 'trigrams.json'),
      JSON.stringify(trigrams, null, 2)
    );
    
    writeFileSync(
      join(outputDir, 'fourgrams.json'),
      JSON.stringify(fourgrams, null, 2)
    );
    
    writeFileSync(
      join(outputDir, 'fivegrams.json'),
      JSON.stringify(fivegrams, null, 2)
    );
    
    console.log('Statistics:');
    console.log(`  Unique bigrams: ${Object.keys(bigrams).length}`);
    console.log(`  Unique trigrams: ${Object.keys(trigrams).length}`);
    console.log(`  Unique 4-grams: ${Object.keys(fourgrams).length}`);
    console.log(`  Unique 5-grams: ${Object.keys(fivegrams).length}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('Building n-gram models...\n');
  
  const builder = new NgramBuilder();
  
  // Option 1: Load from corpus file
  try {
    const corpusPath = join(__dirname, 'train-corpus.txt');
    const corpus = readFileSync(corpusPath, 'utf-8');
    
    console.log(`Processing corpus (${corpus.length} characters)...`);
    builder.processText(corpus);
    
  } catch (error) {
    console.log('No train-corpus.txt found, using sample academic text...');
    
    // Option 2: Use sample academic text
    const sampleText = `
      In conclusion, the evidence suggests that climate change poses a significant threat to global ecosystems.
      Furthermore, research indicates that immediate action is necessary to mitigate the effects.
      According to the data, temperatures have risen by an average of 1.5 degrees Celsius over the past century.
      This suggests that human activities are the primary driver of environmental degradation.
      On the other hand, some argue that natural cycles contribute to temperature variations.
      However, the overwhelming consensus among scientists supports the anthropogenic hypothesis.
      For this reason, policymakers must prioritize sustainable development initiatives.
      In addition to regulatory measures, public awareness campaigns are essential.
      As a result, many countries have committed to reducing carbon emissions.
      It is important to note that individual actions also play a crucial role.
      For example, reducing energy consumption and supporting renewable resources can make a difference.
      In summary, addressing climate change requires coordinated global efforts.
      Despite the challenges, there is reason for optimism if we act decisively.
      The fact that renewable energy technologies are becoming more affordable is encouraging.
      Moreover, the data shows that investments in green infrastructure yield positive returns.
      Therefore, we must continue to innovate and adapt our strategies.
      With regard to policy implementation, transparency and accountability are paramount.
      As mentioned earlier, stakeholder engagement is critical for success.
      To begin with, education plays a fundamental role in shaping public opinion.
      By comparison, previous environmental movements have demonstrated the power of collective action.
      In other words, change is possible when society mobilizes around shared values.
      This indicates that hope and determination can drive meaningful progress.
    `.repeat(10); // Repeat for more data
    
    builder.processText(sampleText);
  }
  
  // Save to output directory
  const outputDir = join(__dirname, '../data/ngrams');
  builder.save(outputDir);
  
  console.log('\n✓ N-gram models saved successfully!');
  console.log(`  Location: ${outputDir}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default NgramBuilder;
