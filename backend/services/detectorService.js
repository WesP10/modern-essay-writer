import { ollamaClient } from '../config/ollama.js';
import { contextExtractor } from './contextExtractor.js';
import { detectPrompt, detectDetailedPrompt, compareTextsPrompt, explainDetectionPrompt } from '../utils/prompts/detector.js';
import { logger } from '../utils/logger.js';

export class DetectorService {
  constructor(client = ollamaClient) {
    this.client = client;
  }

  /**
   * Detect AI-generated content signatures in text
   * @param {Object} params - Detection parameters
   * @param {string} params.text - Text to analyze
   * @param {string} params.essayHtml - Full essay HTML for context
   * @param {string} params.model - Ollama model to use (optional)
   * @returns {Promise<Object>} - Detection results with confidence score
   */
  async detect({ text, essayHtml = '', model = null }) {
    try {
      const startTime = Date.now();

      if (!text || text.trim().length === 0) {
        throw new Error('Text is required for detection');
      }

      // Extract context if provided
      let context = '';
      if (essayHtml) {
        const extracted = contextExtractor.extractSimple(essayHtml, 1000);
        context = extracted.text;
      }

      const fullPrompt = detectPrompt({ text, context });

      logger.info('Analyzing text for AI signatures with Ollama...');

      const response = await this.client.generate({
        model,
        prompt: fullPrompt,
        temperature: 0.3, // Lower temperature for consistent analysis
        max_tokens: 800,
      });

      // Parse JSON response
      let analysis = {};
      try {
        analysis = JSON.parse(response.trim());
      } catch (parseError) {
        logger.error('Failed to parse detection response:', parseError);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Invalid JSON response from AI detection');
        }
      }

      const latency = Date.now() - startTime;

      // Validate and normalize response
      const confidence = Math.max(0, Math.min(100, analysis.confidence || 50));
      const reasoning = analysis.reasoning || 'Analysis completed';
      const flaggedPatterns = Array.isArray(analysis.flaggedPatterns) ? analysis.flaggedPatterns : [];
      const perplexity = analysis.perplexity || 'medium';
      const burstiness = analysis.burstiness || 'medium';
      const humanLikelihood = analysis.humanLikelihood || 'medium';

      logger.info(`AI detection completed in ${latency}ms (confidence: ${confidence}%)`);

      return {
        success: true,
        confidence,
        reasoning,
        flaggedPatterns,
        perplexity,
        burstiness,
        humanLikelihood,
        isLikelyAI: confidence > 60,
        metadata: {
          model: model || ollamaClient.defaultModel,
          textLength: text.length,
          latency,
        },
      };
    } catch (error) {
      logger.error('AI detection error:', error);
      throw new Error(`AI detection failed: ${error.message}`);
    }
  }

  /**
   * Perform detailed section-by-section analysis
   * @param {Object} params - Analysis parameters
   * @param {string} params.text - Text to analyze
   * @param {string} params.model - Ollama model to use (optional)
   * @returns {Promise<Object>} - Section-level analysis
   */
  async detectDetailed({ text, model = null }) {
    try {
      const startTime = Date.now();

      const fullPrompt = detectDetailedPrompt(text);

      logger.info('Performing detailed section analysis...');

      const response = await this.client.generate({
        model,
        prompt: fullPrompt,
        temperature: 0.3,
        max_tokens: 1200,
      });

      // Parse JSON response
      let sections = [];
      try {
        sections = JSON.parse(response.trim());
      } catch (parseError) {
        logger.error('Failed to parse detailed detection response:', parseError);
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          sections = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Invalid JSON response from detailed detection');
        }
      }

      const latency = Date.now() - startTime;

      return {
        success: true,
        sections,
        metadata: {
          model: model || ollamaClient.defaultModel,
          sectionCount: sections.length,
          latency,
        },
      };
    } catch (error) {
      logger.error('Detailed detection error:', error);
      throw new Error(`Detailed AI detection failed: ${error.message}`);
    }
  }

  /**
   * Compare two text samples to determine which is more likely AI-generated
   * @param {Object} params - Comparison parameters
   * @param {string} params.text1 - First text sample
   * @param {string} params.text2 - Second text sample
   * @param {string} params.model - Ollama model to use (optional)
   * @returns {Promise<Object>} - Comparison results
   */
  async compareTexts({ text1, text2, model = null }) {
    try {
      const startTime = Date.now();

      const fullPrompt = compareTextsPrompt(text1, text2);

      logger.info('Comparing text samples...');

      const response = await this.client.generate({
        model,
        prompt: fullPrompt,
        temperature: 0.3,
        max_tokens: 500,
      });

      // Parse JSON response
      let comparison = {};
      try {
        comparison = JSON.parse(response.trim());
      } catch (parseError) {
        logger.error('Failed to parse comparison response:', parseError);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          comparison = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Invalid JSON response from text comparison');
        }
      }

      const latency = Date.now() - startTime;

      return {
        success: true,
        comparison,
        metadata: {
          latency,
        },
      };
    } catch (error) {
      logger.error('Text comparison error:', error);
      throw new Error(`Text comparison failed: ${error.message}`);
    }
  }

  /**
   * Generate educational explanation of flagged patterns
   * @param {Object} params - Explanation parameters
   * @param {string} params.text - Text that was analyzed
   * @param {Array<string>} params.flaggedPatterns - Detected patterns
   * @param {string} params.model - Ollama model to use (optional)
   * @returns {Promise<Object>} - Educational feedback
   */
  async explainDetection({ text, flaggedPatterns, model = null }) {
    try {
      const startTime = Date.now();

      const fullPrompt = explainDetectionPrompt(text, flaggedPatterns);

      logger.info('Generating educational explanation...');

      const response = await this.client.generate({
        model,
        prompt: fullPrompt,
        temperature: 0.6,
        max_tokens: 300,
      });

      const latency = Date.now() - startTime;

      return {
        success: true,
        explanation: response.trim(),
        metadata: {
          latency,
        },
      };
    } catch (error) {
      logger.error('Explanation generation error:', error);
      throw new Error(`Explanation generation failed: ${error.message}`);
    }
  }

  /**
   * Calculate basic text metrics (fallback for when LLM is unavailable)
   * @param {string} text - Text to analyze
   * @returns {Object} - Basic metrics
   */
  calculateBasicMetrics(text) {
    // Sentence analysis
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceLengths = sentences.map(s => s.length);
    const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentences.length;

    // Calculate sentence length variance (burstiness indicator)
    const variance = sentenceLengths.reduce((sum, len) =>
      sum + Math.pow(len - avgSentenceLength, 2), 0) / sentences.length;
    const stdDev = Math.sqrt(variance);

    // Word analysis
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words);
    const wordDiversity = uniqueWords.size / words.length;

    // Transition word detection
    const transitions = ['however', 'furthermore', 'moreover', 'therefore', 'consequently', 'additionally'];
    const transitionCount = transitions.filter(t => text.toLowerCase().includes(t)).length;
    const transitionDensity = transitionCount / sentences.length;

    // Simple heuristics for AI detection
    const lowVariance = stdDev < avgSentenceLength * 0.3;
    const highTransitionDensity = transitionDensity > 0.5;
    const lowDiversity = wordDiversity < 0.4;

    let confidence = 50;
    const flags = [];

    if (lowVariance) {
      confidence += 15;
      flags.push('uniform sentence length');
    }
    if (highTransitionDensity) {
      confidence += 10;
      flags.push('excessive transition words');
    }
    if (lowDiversity) {
      confidence += 15;
      flags.push('limited vocabulary diversity');
    }

    return {
      confidence: Math.min(100, confidence),
      reasoning: 'Basic statistical analysis of text patterns',
      flaggedPatterns: flags,
      perplexity: lowDiversity ? 'low' : 'medium',
      burstiness: lowVariance ? 'low' : 'medium',
      humanLikelihood: confidence < 60 ? 'high' : 'medium',
    };
  }
}

export const detectorService = new DetectorService();
