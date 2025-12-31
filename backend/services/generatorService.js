import { ollamaClient } from '../config/ollama.js';
import { contextExtractor } from './contextExtractor.js';
import { generatePrompt, generateOutlinePrompt, expandSectionPrompt } from '../utils/prompts/generator.js';
import { logger } from '../utils/logger.js';

export class GeneratorService {
  constructor(client = ollamaClient) {
    this.client = client;
  }
  /**
   * Generate essay content or outline
   * @param {Object} params - Generation parameters
   * @param {string} params.prompt - User's generation request
   * @param {string} params.essayType - Type of essay
   * @param {string} params.tone - Desired tone
   * @param {string} params.length - Desired length
   * @param {number} params.temperature - LLM temperature (0-1)
   * @param {string} params.essayHtml - Current essay HTML for context
   * @param {string} params.model - Ollama model to use (optional)
   * @returns {Promise<Object>} - Generated content with metadata
   */
  async generate({
    prompt,
    essayType = 'academic',
    tone = 'formal',
    length = 'medium',
    temperature = 0.7,
    essayHtml = '',
    model = null
  }) {
    try {
      const startTime = Date.now();

      // Extract context from essay
      let context = '';
      if (essayHtml) {
        const extracted = contextExtractor.extract(essayHtml);
        context = extracted.context;
        logger.info(`Context extracted: ${extracted.tokensUsed} tokens (truncated: ${extracted.truncated})`);
      }

      // Build prompt
      const fullPrompt = generatePrompt({
        prompt,
        essayType,
        tone,
        length,
        context,
      });

      logger.info('Generating content with Ollama...');

      // Generate with Ollama
      const response = await this.client.generate({
        model,
        prompt: fullPrompt,
        temperature,
        max_tokens: this.getLengthTokens(length),
      });

      const latency = Date.now() - startTime;

      logger.info(`Generation completed in ${latency}ms`);

      return {
        success: true,
        content: response.trim(),
        metadata: {
          model: model || ollamaClient.defaultModel,
          essayType,
          tone,
          length,
          temperature,
          latency,
          contextTokens: contextExtractor.estimateTokens(context),
        },
      };
    } catch (error) {
      logger.error('Generation error:', error);
      throw new Error(`Content generation failed: ${error.message}`);
    }
  }

  /**
   * Generate essay outline
   * @param {Object} params - Outline parameters
   * @param {string} params.topic - Essay topic
   * @param {string} params.essayType - Type of essay
   * @param {number} params.sections - Number of main sections
   * @param {string} params.model - Ollama model to use (optional)
   * @returns {Promise<Object>} - Generated outline
   */
  async generateOutline({ topic, essayType = 'argumentative', sections = 3, model = null }) {
    try {
      const startTime = Date.now();

      const fullPrompt = generateOutlinePrompt({ topic, essayType, sections });

      logger.info('Generating outline with Ollama...');

      const response = await this.client.generate({
        model,
        prompt: fullPrompt,
        temperature: 0.7,
        max_tokens: 800,
      });

      const latency = Date.now() - startTime;

      return {
        success: true,
        outline: response.trim(),
        metadata: {
          model: model || ollamaClient.defaultModel,
          topic,
          essayType,
          sections,
          latency,
        },
      };
    } catch (error) {
      logger.error('Outline generation error:', error);
      throw new Error(`Outline generation failed: ${error.message}`);
    }
  }

  /**
   * Expand existing section with additional content
   * @param {Object} params - Expansion parameters
   * @param {string} params.section - Current section text
   * @param {string} params.direction - What to add
   * @param {string} params.essayHtml - Full essay HTML for context
   * @param {string} params.model - Ollama model to use (optional)
   * @returns {Promise<Object>} - Expanded content
   */
  async expandSection({ section, direction, essayHtml = '', model = null }) {
    try {
      const startTime = Date.now();

      // Extract context
      let context = '';
      if (essayHtml) {
        const extracted = contextExtractor.extract(essayHtml);
        context = extracted.context;
      }

      const fullPrompt = expandSectionPrompt({ section, direction, context });

      logger.info('Expanding section with Ollama...');

      const response = await this.client.generate({
        model,
        prompt: fullPrompt,
        temperature: 0.7,
        max_tokens: 500,
      });

      const latency = Date.now() - startTime;

      return {
        success: true,
        expandedContent: response.trim(),
        metadata: {
          model: model || ollamaClient.defaultModel,
          latency,
        },
      };
    } catch (error) {
      logger.error('Section expansion error:', error);
      throw new Error(`Section expansion failed: ${error.message}`);
    }
  }

  /**
   * Get max tokens for length parameter
   * @param {string} length - Length parameter
   * @returns {number} - Max tokens to generate
   */
  getLengthTokens(length) {
    const lengths = {
      short: 200,
      medium: 400,
      long: 700,
    };
    return lengths[length] || lengths.medium;
  }
}

export const generatorService = new GeneratorService();
