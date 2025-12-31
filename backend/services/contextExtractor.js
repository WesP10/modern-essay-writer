import { JSDOM } from 'jsdom';
import { logger } from '../utils/logger.js';

const OLLAMA_CONTEXT_WINDOW = parseInt(process.env.OLLAMA_CONTEXT_WINDOW || '4096', 10);
const OLLAMA_PROMPT_RESERVE = parseInt(process.env.OLLAMA_PROMPT_RESERVE || '1024', 10);
const CHARS_PER_TOKEN = 4; // Conservative estimate

class ContextExtractor {
  /**
   * Calculate available tokens for context
   * @param {number} generationBuffer - Tokens reserved for generation output
   * @returns {number} - Available context tokens
   */
  getAvailableContextTokens(generationBuffer = 512) {
    return OLLAMA_CONTEXT_WINDOW - OLLAMA_PROMPT_RESERVE - generationBuffer;
  }

  /**
   * Estimate token count from text
   * @param {string} text - Text to estimate
   * @returns {number} - Estimated token count
   */
  estimateTokens(text) {
    return Math.ceil(text.length / CHARS_PER_TOKEN);
  }

  /**
   * Extract text content from HTML element, stripping unwanted elements
   * @param {Element} element - DOM element
   * @returns {string} - Extracted text
   */
  extractTextContent(element) {
    // Clone to avoid modifying original
    const clone = element.cloneNode(true);

    // Remove unwanted elements
    const unwantedSelectors = [
      'cite',
      'code',
      'math',
      '[data-footnote]',
      '.footnote',
      '.citation',
    ];

    unwantedSelectors.forEach(selector => {
      const elements = clone.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    return clone.textContent.trim();
  }

  /**
   * Extract body paragraphs with associated headings
   * @param {Document} doc - JSDOM document
   * @returns {Array<{type: string, text: string, heading: string|null}>}
   */
  extractBodyParagraphs(doc) {
    const results = [];
    const paragraphs = doc.querySelectorAll('p');

    paragraphs.forEach(p => {
      const text = this.extractTextContent(p);
      if (!text) return;

      // Find closest preceding heading
      let heading = null;
      let current = p.previousElementSibling;

      while (current && !heading) {
        if (current.matches('h1, h2, h3, h4, h5, h6')) {
          heading = this.extractTextContent(current);
          break;
        }
        current = current.previousElementSibling;
      }

      results.push({
        type: 'paragraph',
        text,
        heading,
      });
    });

    return results;
  }

  /**
   * Extract list items
   * @param {Document} doc - JSDOM document
   * @returns {Array<{type: string, text: string}>}
   */
  extractLists(doc) {
    const results = [];
    const lists = doc.querySelectorAll('ul, ol');

    lists.forEach(list => {
      const items = list.querySelectorAll('li');
      items.forEach(item => {
        const text = this.extractTextContent(item);
        if (text) {
          results.push({
            type: 'list-item',
            text,
          });
        }
      });
    });

    return results;
  }

  /**
   * Extract block quotes
   * @param {Document} doc - JSDOM document
   * @returns {Array<{type: string, text: string}>}
   */
  extractBlockQuotes(doc) {
    const results = [];
    const quotes = doc.querySelectorAll('blockquote');

    quotes.forEach(quote => {
      const text = this.extractTextContent(quote);
      if (text) {
        results.push({
          type: 'blockquote',
          text,
        });
      }
    });

    return results;
  }

  /**
   * Identify introduction and conclusion paragraphs
   * @param {Array} paragraphs - Array of paragraph objects
   * @returns {Object} - {intro: Array, body: Array, conclusion: Array}
   */
  categorizeParagraphs(paragraphs) {
    if (paragraphs.length === 0) {
      return { intro: [], body: [], conclusion: [] };
    }

    // Simple heuristic: first 2 paragraphs are intro, last 2 are conclusion
    const introCount = Math.min(2, Math.floor(paragraphs.length * 0.2));
    const conclusionCount = Math.min(2, Math.floor(paragraphs.length * 0.2));

    const intro = paragraphs.slice(0, introCount);
    const conclusion = conclusionCount > 0 ? paragraphs.slice(-conclusionCount) : [];
    const body = paragraphs.slice(introCount, paragraphs.length - conclusionCount);

    return { intro, body, conclusion };
  }

  /**
   * Build context text from extracted elements, respecting token limit
   * @param {Array} elements - Array of extracted elements
   * @param {number} maxTokens - Maximum tokens to include
   * @returns {Object} - {context: string, tokensUsed: number, truncated: boolean}
   */
  buildContextText(elements, maxTokens) {
    const parts = [];
    let tokensUsed = 0;
    let truncated = false;

    for (const element of elements) {
      let text = '';

      if (element.heading) {
        text = `## ${element.heading}\n\n${element.text}\n\n`;
      } else {
        text = `${element.text}\n\n`;
      }

      const elementTokens = this.estimateTokens(text);

      if (tokensUsed + elementTokens > maxTokens) {
        truncated = true;
        break;
      }

      parts.push(text);
      tokensUsed += elementTokens;
    }

    return {
      context: parts.join(''),
      tokensUsed,
      truncated,
    };
  }

  /**
   * Extract prioritized context from HTML
   * @param {string} html - HTML content from editor
   * @param {number} maxTokens - Maximum tokens to extract (optional, uses default if not provided)
   * @returns {Object} - Context object with metadata
   */
  extract(html, maxTokens = null) {
    try {
      if (!html || typeof html !== 'string') {
        logger.warn('Invalid HTML provided to context extractor');
        return {
          context: '',
          tokensUsed: 0,
          truncated: false,
          metadata: { error: 'Invalid HTML input' },
        };
      }

      const dom = new JSDOM(html);
      const doc = dom.window.document;

      // Use provided maxTokens or calculate default
      const availableTokens = maxTokens || this.getAvailableContextTokens();

      // Extract all content types
      const bodyParagraphs = this.extractBodyParagraphs(doc);
      const lists = this.extractLists(doc);
      const blockQuotes = this.extractBlockQuotes(doc);

      // Categorize paragraphs
      const { intro, body, conclusion } = this.categorizeParagraphs(bodyParagraphs);

      // Priority order: body paragraphs → lists → intro/conclusion → quotes
      const prioritizedElements = [
        ...body,
        ...lists,
        ...intro,
        ...conclusion,
        ...blockQuotes,
      ];

      // Build context text respecting token limit
      const result = this.buildContextText(prioritizedElements, availableTokens);

      if (result.truncated) {
        logger.warn(`Context truncated: exceeded ${availableTokens} token limit`);
      }

      logger.info(`Extracted ${result.tokensUsed} tokens from essay context`);

      return {
        ...result,
        metadata: {
          totalParagraphs: bodyParagraphs.length,
          bodyParagraphs: body.length,
          introParagraphs: intro.length,
          conclusionParagraphs: conclusion.length,
          lists: lists.length,
          blockQuotes: blockQuotes.length,
          maxTokens: availableTokens,
        },
      };
    } catch (error) {
      logger.error('Error extracting context:', error);
      return {
        context: '',
        tokensUsed: 0,
        truncated: false,
        metadata: { error: error.message },
      };
    }
  }

  /**
   * Extract just the raw text without prioritization (for simpler use cases)
   * @param {string} html - HTML content
   * @param {number} maxTokens - Maximum tokens to extract
   * @returns {Object} - {text: string, tokensUsed: number}
   */
  extractSimple(html, maxTokens = null) {
    try {
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      // Remove unwanted elements
      const unwantedSelectors = [
        'cite',
        'code',
        'math',
        '[data-footnote]',
        '.footnote',
        '.citation',
      ];

      unwantedSelectors.forEach(selector => {
        const elements = doc.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });

      let text = doc.body.textContent.trim();
      const availableTokens = maxTokens || this.getAvailableContextTokens();
      const maxChars = availableTokens * CHARS_PER_TOKEN;

      if (text.length > maxChars) {
        text = text.substring(0, maxChars) + '...';
      }

      return {
        text,
        tokensUsed: this.estimateTokens(text),
      };
    } catch (error) {
      logger.error('Error in simple extraction:', error);
      return { text: '', tokensUsed: 0 };
    }
  }
}

export const contextExtractor = new ContextExtractor();
