/**
 * Prompt templates for AI detection service
 */

/**
 * Generate AI detection analysis prompt
 * @param {Object} params - Detection parameters
 * @param {string} params.text - Text to analyze
 * @param {string} params.context - Surrounding essay context (optional)
 * @returns {string} - Complete prompt for LLM
 */
export function detectPrompt({ text, context = '' }) {
  const systemMessage = `You are an expert at analyzing text to identify signs of AI generation. Examine the text carefully for patterns, structures, and characteristics commonly associated with AI-written content.`;

  const detectionCriteria = [
    'Repetitive patterns: Does the text repeat similar sentence structures or phrases?',
    'Vocabulary diversity: Is the vocabulary varied and natural, or repetitive and limited?',
    'Sentence flow: Are sentences naturally varied in length and complexity?',
    'Transition usage: Are transitions overused or mechanically placed?',
    'Tone consistency: Is the tone unnaturally uniform throughout?',
    'Specificity: Does the text include specific details or stay vague and general?',
    'Natural errors: Are there natural human imperfections vs. AI-like perfection?',
    'Logical flow: Do ideas progress naturally or follow predictable AI patterns?',
    'Depth vs. breadth: Does the text go deep into topics or skim many surfaces?',
    'Contextual coherence: Does it maintain context naturally or lose thread?',
  ];

  let fullPrompt = `${systemMessage}\n\n`;

  if (context) {
    fullPrompt += `## Essay Context (for comparison):\n${context}\n\n`;
  }

  fullPrompt += `## Text to Analyze:\n${text}\n\n`;
  fullPrompt += `## Analysis Criteria:\n`;
  detectionCriteria.forEach(criterion => {
    fullPrompt += `- ${criterion}\n`;
  });

  fullPrompt += `\n## Task:
Analyze the text and provide a structured JSON response with:
- "confidence": A score from 0-100 indicating likelihood of AI generation (0 = definitely human, 100 = definitely AI)
- "reasoning": A brief explanation of your assessment (2-3 sentences)
- "flaggedPatterns": An array of specific patterns or issues found (e.g., ["repetitive transitions", "uniform sentence length"])
- "perplexity": Your assessment of text unpredictability (low/medium/high)
- "burstiness": Your assessment of sentence variation (low/medium/high)
- "humanLikelihood": Overall human-written likelihood (low/medium/high)

Respond with ONLY the JSON object, no additional text:`;

  return fullPrompt;
}

/**
 * Generate detailed section analysis prompt
 * @param {string} text - Text to analyze in detail
 * @returns {string} - Prompt for section-by-section analysis
 */
export function detectDetailedPrompt(text) {
  return `Analyze this text section by section for AI-generation signatures:

## Text:
${text}

Divide the text into logical sections (paragraphs or sentence groups) and provide a JSON array where each element represents a section:

[
  {
    "section": "first ~50 chars of section",
    "confidence": 0-100,
    "issues": ["issue1", "issue2"]
  },
  ...
]

Respond with ONLY the JSON array:`;
}

/**
 * Generate comparative analysis prompt
 * @param {string} text1 - First text sample
 * @param {string} text2 - Second text sample
 * @returns {string} - Prompt to compare two texts
 */
export function compareTextsPrompt(text1, text2) {
  return `Compare these two text samples and determine which is more likely to be AI-generated:

## Text A:
${text1}

## Text B:
${text2}

Provide a JSON response:
{
  "moreAI": "A" or "B",
  "confidenceA": 0-100,
  "confidenceB": 0-100,
  "reasoning": "brief explanation"
}

Respond with ONLY the JSON object:`;
}

/**
 * Generate educational prompt explaining AI signatures
 * @param {string} text - Example text
 * @param {Array<string>} flaggedPatterns - Detected patterns
 * @returns {string} - Prompt to explain findings
 */
export function explainDetectionPrompt(text, flaggedPatterns) {
  return `Explain to a student why these patterns in their text might be flagged as AI-generated:

## Text Sample:
${text}

## Flagged Patterns:
${flaggedPatterns.map(p => `- ${p}`).join('\n')}

Provide constructive, educational feedback in 2-3 sentences that helps them understand what to improve. Be encouraging and specific:`;
}

/**
 * Estimate token count for detection prompts
 * @param {Object} params - Prompt parameters
 * @returns {number} - Estimated token count
 */
export function estimateDetectionTokens(params) {
  const { text = '', context = '' } = params;
  // Rough estimate: system message (~200) + text + context + criteria (~400)
  const CHARS_PER_TOKEN = 4;
  return Math.ceil((600 + text.length + context.length) / CHARS_PER_TOKEN);
}
