/**
 * Prompt templates for text humanization service
 */

/**
 * Generate humanization prompt
 * @param {Object} params - Humanization parameters
 * @param {string} params.text - Text to humanize
 * @param {string} params.tone - Desired tone (academic, casual, formal)
 * @param {boolean} params.preserveMeaning - Whether to strictly preserve original meaning
 * @param {string} params.context - Surrounding essay context
 * @returns {string} - Complete prompt for LLM
 */
export function humanizePrompt({ text, tone = 'academic', preserveMeaning = true, context = '' }) {
  const systemMessage = `You are an expert at rewriting text to sound naturally human-written. Your goal is to make the text flow more naturally while maintaining its core message and quality.`;

  const toneInstructions = {
    academic: 'Maintain sophisticated vocabulary and formal structure, but add natural variations in sentence patterns and word choices that reflect human writing.',
    casual: 'Make the text conversational and relaxed, as if speaking to a friend, while keeping it informative.',
    formal: 'Keep professional tone but add subtle personality and natural flow that distinguishes it from robotic writing.',
  };

  const humanizationGuidelines = [
    'Vary sentence length and structure naturally (mix short, medium, and long sentences)',
    'Use diverse vocabulary without being repetitive',
    'Add natural transitions and connective phrases',
    'Include subtle personality and voice',
    'Avoid overly perfect or mechanical patterns',
    'Use contractions and natural phrasing where appropriate',
    'Add occasional informal touches without compromising quality',
    'Ensure ideas flow conversationally between sentences',
  ];

  let fullPrompt = `${systemMessage}\n\n`;

  if (context) {
    fullPrompt += `## Essay Context (for reference):\n${context}\n\n`;
  }

  fullPrompt += `## Text to Humanize:\n${text}\n\n`;
  fullPrompt += `## Tone:\n${toneInstructions[tone] || toneInstructions.academic}\n\n`;
  fullPrompt += `## Humanization Guidelines:\n`;
  humanizationGuidelines.forEach(guideline => {
    fullPrompt += `- ${guideline}\n`;
  });
  
  if (preserveMeaning) {
    fullPrompt += `\n## Important:\nPreserve the original meaning, key points, and factual accuracy. Only improve the natural flow and human-like quality.\n`;
  }

  fullPrompt += `\nProvide ONLY the rewritten text without any explanations, comments, or meta-commentary:`;

  return fullPrompt;
}

/**
 * Generate comparison analysis prompt (for before/after metrics)
 * @param {string} originalText - Original text
 * @param {string} humanizedText - Humanized text
 * @returns {string} - Prompt to analyze improvements
 */
export function analyzeImprovementPrompt(originalText, humanizedText) {
  return `Compare these two versions of text and analyze the improvements:

## Original:
${originalText}

## Humanized:
${humanizedText}

Provide a JSON object with the following metrics (0-100 scale):
{
  "naturalness": <score>,
  "varietyScore": <score>,
  "flowScore": <score>,
  "overallImprovement": <score>,
  "keyChanges": ["change1", "change2", "change3"]
}

Respond with ONLY the JSON object, no additional text:`;
}

/**
 * Generate prompt for tone adjustment only
 * @param {Object} params - Tone adjustment parameters
 * @param {string} params.text - Text to adjust
 * @param {string} params.fromTone - Current tone
 * @param {string} params.toTone - Target tone
 * @returns {string} - Complete prompt for tone shift
 */
export function adjustTonePrompt({ text, fromTone, toTone }) {
  const toneDescriptions = {
    academic: 'formal, sophisticated, objective, research-oriented',
    casual: 'conversational, friendly, relaxed, accessible',
    formal: 'professional, polished, respectful, structured',
    persuasive: 'compelling, emotive, convincing, engaging',
    neutral: 'objective, balanced, factual, unbiased',
  };

  return `Rewrite the following text to shift from ${fromTone} tone (${toneDescriptions[fromTone]}) to ${toTone} tone (${toneDescriptions[toTone]}):

## Original Text:
${text}

Maintain the core message but adjust language, word choice, and structure to match the target tone. Provide ONLY the rewritten text:`;
}

/**
 * Estimate token count for humanization prompts
 * @param {Object} params - Prompt parameters
 * @returns {number} - Estimated token count
 */
export function estimateHumanizationTokens(params) {
  const { text = '', context = '' } = params;
  // Rough estimate: system message (~150) + text + context + guidelines (~300)
  const CHARS_PER_TOKEN = 4;
  return Math.ceil((450 + text.length + context.length) / CHARS_PER_TOKEN);
}
