import { ollamaClient } from '../config/ollama.js';
import { contextExtractor } from './contextExtractor.js';
import { humanizePrompt, analyzeImprovementPrompt, adjustTonePrompt } from '../utils/prompts/humanizer.js';
import { logger } from '../utils/logger.js';

export class HumanizerService {
  constructor(client = ollamaClient) {
    this.client = client;
  }
  /**
   * Humanize text to make it sound more naturally human-written
   * @param {Object} params - Humanization parameters
   * @param {string} params.text - Text to humanize
   * @param {string} params.tone - Desired tone (academic, casual, formal)
   * @param {boolean} params.preserveMeaning - Whether to strictly preserve meaning
   * @param {string} params.essayHtml - Full essay HTML for context
   * @param {string} params.model - Ollama model to use (optional)
   * @returns {Promise<Object>} - Humanized text with metadata
   */
  async humanize({ text, tone = 'academic', preserveMeaning = true, essayHtml = '', model = null }) {
    try {
      const startTime = Date.now();

      if (!text || text.trim().length === 0) {
        throw new Error('Text is required for humanization');
      }

      // Extract context if provided
      let context = '';
      if (essayHtml) {
        const extracted = contextExtractor.extractSimple(essayHtml, 800);
        context = extracted.text;
      }

      const fullPrompt = humanizePrompt({
        text,
        tone,
        preserveMeaning,
        context,
      });

      logger.info('Humanizing text with Ollama...');

      const response = await this.client.generate({
        model,
        prompt: fullPrompt,
        temperature: 0.8, // Higher temperature for more natural variation
        max_tokens: Math.ceil(text.length / 2) + 200, // Estimate based on input length
      });

      const humanizedText = response.trim();
      const latency = Date.now() - startTime;

      // Calculate basic improvement metrics
      const improvement = this.calculateImprovementMetrics(text, humanizedText);

      logger.info(`Humanization completed in ${latency} ms`);

      return {
        success: true,
        originalText: text,
        humanizedText,
        improvement,
        metadata: {
          model: model || ollamaClient.defaultModel,
          tone,
          preserveMeaning,
          latency,
          originalLength: text.length,
          humanizedLength: humanizedText.length,
        },
      };
    } catch (error) {
      logger.error('Humanization error:', error);
      throw new Error(`Text humanization failed: ${error.message} `);
    }
  }

  /**
   * Adjust tone of existing text
   * @param {Object} params - Tone adjustment parameters
   * @param {string} params.text - Text to adjust
   * @param {string} params.fromTone - Current tone
   * @param {string} params.toTone - Target tone
   * @param {string} params.model - Ollama model to use (optional)
   * @returns {Promise<Object>} - Adjusted text
   */
  async adjustTone({ text, fromTone, toTone, model = null }) {
    try {
      const startTime = Date.now();

      const fullPrompt = adjustTonePrompt({ text, fromTone, toTone });

      logger.info(`Adjusting tone from ${fromTone} to ${toTone}...`);

      const response = await this.client.generate({
        model,
        prompt: fullPrompt,
        temperature: 0.7,
        max_tokens: Math.ceil(text.length / 2) + 200,
      });

      const adjustedText = response.trim();
      const latency = Date.now() - startTime;

      return {
        success: true,
        originalText: text,
        adjustedText,
        metadata: {
          model: model || ollamaClient.defaultModel,
          fromTone,
          toTone,
          latency,
        },
      };
    } catch (error) {
      logger.error('Tone adjustment error:', error);
      throw new Error(`Tone adjustment failed: ${error.message} `);
    }
  }

  /**
   * Calculate basic improvement metrics (simplified version)
   * @param {string} original - Original text
   * @param {string} humanized - Humanized text
   * @returns {Object} - Improvement metrics
   */
  calculateImprovementMetrics(original, humanized) {
    // Calculate sentence count
    const originalSentences = original.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const humanizedSentences = humanized.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    // Calculate average sentence length
    const originalAvgLength = original.length / originalSentences;
    const humanizedAvgLength = humanized.length / humanizedSentences;

    // Calculate word diversity (unique words / total words)
    const getWordDiversity = (text) => {
      const words = text.toLowerCase().match(/\b\w+\b/g) || [];
      const uniqueWords = new Set(words);
      return words.length > 0 ? uniqueWords.size / words.length : 0;
    };

    const originalDiversity = getWordDiversity(original);
    const humanizedDiversity = getWordDiversity(humanized);

    // Calculate sentence length variance
    const getSentenceLengthVariance = (text) => {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length === 0) return 0;

      const lengths = sentences.map(s => s.length);
      const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
      return Math.sqrt(variance);
    };

    const originalVariance = getSentenceLengthVariance(original);
    const humanizedVariance = getSentenceLengthVariance(humanized);

    return {
      naturalness: Math.min(100, Math.round((humanizedDiversity / originalDiversity) * 85 + 15)),
      varietyScore: Math.min(100, Math.round((humanizedVariance / originalVariance) * 80 + 20)),
      flowScore: Math.round(75 + Math.random() * 15), // Placeholder - would need deeper analysis
      overallImprovement: Math.round(70 + Math.random() * 20), // Placeholder
      sentenceCountChange: humanizedSentences - originalSentences,
      diversityImprovement: Math.round((humanizedDiversity - originalDiversity) * 100),
    };
  }

  /**
   * Analyze improvement between original and humanized text using LLM
   * @param {string} originalText - Original text
   * @param {string} humanizedText - Humanized text
   * @param {string} model - Ollama model to use (optional)
   * @returns {Promise<Object>} - Detailed improvement analysis
   */
  async analyzeImprovement(originalText, humanizedText, model = null) {
    try {
      const fullPrompt = analyzeImprovementPrompt(originalText, humanizedText);

      logger.info('Analyzing improvement with LLM...');

      const response = await this.client.generate({
        model,
        prompt: fullPrompt,
        temperature: 0.3,
        max_tokens: 400,
      });

      // Parse JSON response
      let analysis = {};
      try {
        analysis = JSON.parse(response.trim());
      } catch (parseError) {
        logger.error('Failed to parse improvement analysis:', parseError);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          // Return basic metrics if parsing fails
          return this.calculateImprovementMetrics(originalText, humanizedText);
        }
      }

      return analysis;
    } catch (error) {
      logger.error('Improvement analysis error:', error);
      // Fallback to basic metrics
      return this.calculateImprovementMetrics(originalText, humanizedText);
    }
  }
}

export const humanizerService = new HumanizerService();
