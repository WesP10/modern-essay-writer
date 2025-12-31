import { contextExtractor } from '../../services/contextExtractor.js';
import { JSDOM } from 'jsdom';

describe('ContextExtractor', () => {
  describe('estimateTokens', () => {
    test('should estimate tokens correctly', () => {
      const text = 'Hello world';
      // 11 chars / 4 = 2.75 -> 3
      expect(contextExtractor.estimateTokens(text)).toBe(3);
    });
  });

  describe('extractTextContent', () => {
    test('should strip unwanted elements', () => {
      const html = '<div><p>Hello <cite>Source</cite> World</p></div>';
      const dom = new JSDOM(html);
      const element = dom.window.document.querySelector('p');
      const text = contextExtractor.extractTextContent(element);
      expect(text).toBe('Hello  World');
    });
  });

  describe('categorizeParagraphs', () => {
    test('should categorize paragraphs correctly', () => {
      const paragraphs = [
        { text: 'Intro 1' },
        { text: 'Intro 2' },
        { text: 'Body 1' },
        { text: 'Body 2' },
        { text: 'Body 3' },
        { text: 'Conclusion 1' },
        { text: 'Conclusion 2' }
      ];

      const { intro, body, conclusion } = contextExtractor.categorizeParagraphs(paragraphs);

      expect(intro.length).toBe(1);
      expect(intro[0].text).toBe('Intro 1');

      expect(conclusion.length).toBe(1);
      expect(conclusion[0].text).toBe('Conclusion 2');

      expect(body.length).toBe(5);
      expect(body[0].text).toBe('Intro 2'); // Becomes body because index start is 1
    });

    test('should handle small number of paragraphs', () => {
      const paragraphs = [
        { text: 'Para 1' },
        { text: 'Para 2' }
      ];

      // 20% of 2 is 0.4 -> 0 intro/conclusion based on floor
      // Wait, logic says Math.min(2, Math.floor(0.4)) -> 0.
      // Let's verify expectations based on implementation

      const { intro, body, conclusion } = contextExtractor.categorizeParagraphs(paragraphs);

      // implementation: floor(length * 0.2)
      // 2 * 0.2 = 0.4 -> 0
      expect(intro.length).toBe(0);
      expect(conclusion.length).toBe(0);
      expect(body.length).toBe(2);
    });
  });

  describe('extractSimple', () => {
    test('should extract simple text', () => {
      const html = '<p>Test content</p>';
      const result = contextExtractor.extractSimple(html);
      expect(result.text).toBe('Test content');
      expect(result.tokensUsed).toBeGreaterThan(0);
    });

    test('should handle invalid html', () => {
      // JSDOM handles invalid HTML gracefully usually, but let's try empty
      const result = contextExtractor.extractSimple('');
      expect(result.text).toBe('');
    });
  });
});
