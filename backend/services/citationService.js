import { ollamaClient } from '../config/ollama.js';
import { contextExtractor } from './contextExtractor.js';
import { 
  extractCitationsPrompt, 
  formatCitationsPrompt, 
  generateBibliographyPrompt,
  validateCitationPrompt,
  suggestInTextPrompt
} from '../utils/prompts/citation.js';
import { logger } from '../utils/logger.js';

class CitationService {
  /**
   * Extract citations from essay text
   * @param {Object} params - Extraction parameters
   * @param {string} params.text - Text to analyze
   * @param {string} params.essayHtml - Full essay HTML for context
   * @param {string} params.model - Ollama model to use (optional)
   * @returns {Promise<Object>} - Extracted citations with metadata
   */
  async extractCitations({ text, essayHtml = '', model = null }) {
    try {
      const startTime = Date.now();

      // Extract context if full essay provided
      let context = '';
      if (essayHtml) {
        const extracted = contextExtractor.extractSimple(essayHtml, 1000);
        context = extracted.text;
      }

      const fullPrompt = extractCitationsPrompt({ text, context });

      logger.info('Extracting citations with Ollama...');

      const response = await ollamaClient.generate({
        model,
        prompt: fullPrompt,
        temperature: 0.3, // Lower temperature for more consistent extraction
        max_tokens: 1000,
      });

      // Parse JSON response
      let citations = [];
      try {
        citations = JSON.parse(response.trim());
      } catch (parseError) {
        logger.error('Failed to parse citation extraction response:', parseError);
        // Try to extract JSON from response if wrapped in text
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          citations = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Invalid JSON response from citation extraction');
        }
      }

      const latency = Date.now() - startTime;

      logger.info(`Extracted ${citations.length} citations in ${latency}ms`);

      return {
        success: true,
        citations,
        metadata: {
          model: model || ollamaClient.defaultModel,
          citationsFound: citations.length,
          latency,
        },
      };
    } catch (error) {
      logger.error('Citation extraction error:', error);
      throw new Error(`Citation extraction failed: ${error.message}`);
    }
  }

  /**
   * Format citations in specific style
   * @param {Object} params - Formatting parameters
   * @param {Array} params.citations - Array of citation objects
   * @param {string} params.style - Citation style (APA, MLA, Chicago)
   * @param {string} params.model - Ollama model to use (optional)
   * @returns {Promise<Object>} - Formatted citations
   */
  async formatCitations({ citations, style = 'APA', model = null }) {
    try {
      const startTime = Date.now();

      const fullPrompt = formatCitationsPrompt({ citations, style });

      logger.info(`Formatting ${citations.length} citations in ${style} style...`);

      const response = await ollamaClient.generate({
        model,
        prompt: fullPrompt,
        temperature: 0.2, // Very low temperature for consistent formatting
        max_tokens: 1500,
      });

      // Parse JSON response
      let formattedCitations = [];
      try {
        formattedCitations = JSON.parse(response.trim());
      } catch (parseError) {
        logger.error('Failed to parse citation formatting response:', parseError);
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          formattedCitations = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Invalid JSON response from citation formatting');
        }
      }

      const latency = Date.now() - startTime;

      logger.info(`Formatted citations in ${latency}ms`);

      return {
        success: true,
        formattedCitations,
        style,
        metadata: {
          model: model || ollamaClient.defaultModel,
          style,
          latency,
        },
      };
    } catch (error) {
      logger.error('Citation formatting error:', error);
      throw new Error(`Citation formatting failed: ${error.message}`);
    }
  }

  /**
   * Generate bibliography from citations
   * @param {Object} params - Bibliography parameters
   * @param {Array} params.citations - Array of formatted citation objects
   * @param {string} params.style - Citation style
   * @param {string} params.sortBy - Sorting method
   * @param {string} params.model - Ollama model to use (optional)
   * @returns {Promise<Object>} - Generated bibliography
   */
  async generateBibliography({ citations, style = 'APA', sortBy = 'alphabetical', model = null }) {
    try {
      const startTime = Date.now();

      const fullPrompt = generateBibliographyPrompt({ citations, style, sortBy });

      logger.info(`Generating ${style} bibliography...`);

      const response = await ollamaClient.generate({
        model,
        prompt: fullPrompt,
        temperature: 0.2,
        max_tokens: 2000,
      });

      const latency = Date.now() - startTime;

      return {
        success: true,
        bibliography: response.trim(),
        metadata: {
          model: model || ollamaClient.defaultModel,
          style,
          sortBy,
          citationCount: citations.length,
          latency,
        },
      };
    } catch (error) {
      logger.error('Bibliography generation error:', error);
      throw new Error(`Bibliography generation failed: ${error.message}`);
    }
  }

  /**
   * Validate citation completeness and format
   * @param {Object} params - Validation parameters
   * @param {Object} params.citation - Citation object to validate
   * @param {string} params.style - Citation style
   * @param {string} params.model - Ollama model to use (optional)
   * @returns {Promise<Object>} - Validation results
   */
  async validateCitation({ citation, style = 'APA', model = null }) {
    try {
      const startTime = Date.now();

      const fullPrompt = validateCitationPrompt(citation, style);

      logger.info('Validating citation...');

      const response = await ollamaClient.generate({
        model,
        prompt: fullPrompt,
        temperature: 0.2,
        max_tokens: 500,
      });

      // Parse JSON response
      let validation = {};
      try {
        validation = JSON.parse(response.trim());
      } catch (parseError) {
        logger.error('Failed to parse validation response:', parseError);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          validation = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Invalid JSON response from validation');
        }
      }

      const latency = Date.now() - startTime;

      return {
        success: true,
        validation,
        metadata: {
          latency,
        },
      };
    } catch (error) {
      logger.error('Citation validation error:', error);
      throw new Error(`Citation validation failed: ${error.message}`);
    }
  }

  /**
   * Suggest in-text citation placement
   * @param {Object} params - Suggestion parameters
   * @param {string} params.sentence - Sentence needing citation
   * @param {string} params.sourceInfo - Available source information
   * @param {string} params.style - Citation style
   * @param {string} params.model - Ollama model to use (optional)
   * @returns {Promise<Object>} - Citation suggestion
   */
  async suggestInTextCitation({ sentence, sourceInfo, style = 'APA', model = null }) {
    try {
      const startTime = Date.now();

      const fullPrompt = suggestInTextPrompt({ sentence, sourceInfo, style });

      logger.info('Suggesting in-text citation...');

      const response = await ollamaClient.generate({
        model,
        prompt: fullPrompt,
        temperature: 0.3,
        max_tokens: 300,
      });

      // Parse JSON response
      let suggestion = {};
      try {
        suggestion = JSON.parse(response.trim());
      } catch (parseError) {
        logger.error('Failed to parse suggestion response:', parseError);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          suggestion = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Invalid JSON response from suggestion');
        }
      }

      const latency = Date.now() - startTime;

      return {
        success: true,
        suggestion,
        metadata: {
          latency,
        },
      };
    } catch (error) {
      logger.error('In-text citation suggestion error:', error);
      throw new Error(`In-text citation suggestion failed: ${error.message}`);
    }
  }
}

export const citationService = new CitationService();
