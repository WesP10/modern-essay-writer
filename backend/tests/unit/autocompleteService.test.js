import autocompleteService from '../../services/autocompleteService.js';
import fs from 'fs';

describe('AutocompleteService', () => {
  beforeAll(() => {
    // Manually insert some words into the trie for testing
    autocompleteService.trie.insert('uniqueworks');
    autocompleteService.trie.insert('thesis');
    autocompleteService.trie.insert('theory');
  });

  describe('Trie Data Structure', () => {
    test('should insert and search words correctly', () => {
      const results = autocompleteService.trie.search('unique', 10);
      expect(results).toContain('uniqueworks');
    });

    test('should limit results', () => {
      autocompleteService.trie.insert('apple');
      autocompleteService.trie.insert('apply');
      autocompleteService.trie.insert('apt');
      const results = autocompleteService.trie.search('ap', 2);
      expect(results.length).toBe(2);
    });

    test('should return dictionary matches', () => {
      const results = autocompleteService.trie.search('thes', 10);
      expect(results).toContain('thesis');
    });

    test('should return empty array for no matches', () => {
      const results = autocompleteService.trie.search('zxy', 10);
      expect(results).toEqual([]);
    });
  });

  describe('getSuggestions', () => {
    test('should return dictionary matches', async () => {
      try {
        autocompleteService.trie.insert('apple');
        const result = await autocompleteService.getSuggestions({
          prefix: 'appl',
          context: '',
          essayType: 'academic'
        });

        if (!result.suggestions || result.suggestions.length === 0) {
          throw new Error('Suggestions empty: ' + JSON.stringify(result));
        }

        const texts = result.suggestions.map(s => s.text);
        if (!texts.includes('apple')) {
          throw new Error('Apple not found in: ' + JSON.stringify(texts));
        }

        expect(result.suggestions).toBeDefined();
        expect(result.suggestions.length).toBeGreaterThan(0);
        expect(texts).toContain('apple');
      } catch (e) {
        fs.writeFileSync('autocomplete_error.txt', String(e.stack || e));
        throw e;
      }
    });

    test('should cache results', async () => {
      const params = { prefix: 'test', context: '', essayType: 'academic' };

      // First call
      const result1 = await autocompleteService.getSuggestions(params);
      expect(result1.cached).toBe(false);

      // Second call
      const result2 = await autocompleteService.getSuggestions(params);
      expect(result2.cached).toBe(true);
      expect(result2.suggestions).toEqual(result1.suggestions);
    });

    test('should handle empty prefix gracefully', async () => {
      const result = await autocompleteService.getSuggestions({ prefix: '' });
      expect(result.suggestions).toEqual([]);
    });
  });
});
