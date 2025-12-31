/**
 * Prompt templates for text generation service
 */

/**
 * Generate essay outline or content
 * @param {Object} params - Generation parameters
 * @param {string} params.prompt - User's generation request
 * @param {string} params.essayType - Type of essay (argumentative, narrative, expository, etc.)
 * @param {string} params.tone - Desired tone (academic, casual, formal, etc.)
 * @param {string} params.length - Desired length (short, medium, long)
 * @param {string} params.context - Extracted essay context
 * @returns {string} - Complete prompt for LLM
 */
export function generatePrompt({ prompt, essayType = 'academic', tone = 'formal', length = 'medium', context = '' }) {
  const systemMessage = `You are an expert essay writing assistant. Your task is to generate high-quality, original content that matches the user's requirements while maintaining coherence with their existing essay.`;

  const lengthGuide = {
    short: '1-2 paragraphs (150-300 words)',
    medium: '3-4 paragraphs (300-500 words)',
    long: '5-7 paragraphs (500-800 words)',
  };

  const essayTypeGuides = {
    argumentative: 'Present a clear thesis with supporting evidence and counterarguments.',
    narrative: 'Tell a compelling story with descriptive details and a clear arc.',
    expository: 'Explain the topic clearly and objectively with facts and examples.',
    persuasive: 'Convince the reader using emotional appeals and logical arguments.',
    descriptive: 'Use vivid sensory details and figurative language.',
    analytical: 'Break down and examine components with critical thinking.',
  };

  const toneGuides = {
    academic: 'Use formal language, sophisticated vocabulary, and objective analysis.',
    formal: 'Maintain professional tone with clear, structured arguments.',
    casual: 'Use conversational language while staying informative.',
    persuasive: 'Use compelling language and rhetorical devices.',
    neutral: 'Present information objectively without bias.',
  };

  let fullPrompt = `${systemMessage}\n\n`;

  if (context) {
    fullPrompt += `## Existing Essay Context:\n${context}\n\n`;
  }

  fullPrompt += `## Task:\n${prompt}\n\n`;
  fullPrompt += `## Requirements:\n`;
  fullPrompt += `- Essay Type: ${essayType} - ${essayTypeGuides[essayType] || 'Follow standard essay conventions.'}\n`;
  fullPrompt += `- Tone: ${tone} - ${toneGuides[tone] || 'Maintain appropriate tone.'}\n`;
  fullPrompt += `- Length: ${lengthGuide[length] || lengthGuide.medium}\n`;
  fullPrompt += `- Ensure the content flows naturally with the existing essay context\n`;
  fullPrompt += `- Use varied sentence structures and natural transitions\n`;
  fullPrompt += `- Provide original, thoughtful content without clichés\n\n`;
  fullPrompt += `Generate the requested content now:`;

  return fullPrompt;
}

/**
 * Generate essay outline
 * @param {Object} params - Outline parameters
 * @param {string} params.topic - Essay topic
 * @param {string} params.essayType - Type of essay
 * @param {number} params.sections - Number of main sections
 * @returns {string} - Complete prompt for outline generation
 */
export function generateOutlinePrompt({ topic, essayType = 'argumentative', sections = 3 }) {
  const systemMessage = `You are an expert essay planning assistant. Generate a well-structured essay outline.`;

  return `${systemMessage}

## Topic:
${topic}

## Essay Type:
${essayType}

## Requirements:
- Create an outline with introduction, ${sections} body sections, and conclusion
- Include thesis statement in introduction
- Provide 2-3 key points for each body section
- Include a strong concluding statement
- Use clear hierarchical structure

Generate a detailed essay outline in markdown format:`;
}

/**
 * Expand on existing section
 * @param {Object} params - Expansion parameters
 * @param {string} params.section - Current section text
 * @param {string} params.direction - What to add (examples, evidence, analysis, etc.)
 * @param {string} params.context - Surrounding essay context
 * @returns {string} - Complete prompt for section expansion
 */
export function expandSectionPrompt({ section, direction, context = '' }) {
  return `You are helping expand an essay section. 

${context ? `## Essay Context:\n${context}\n\n` : ''}## Current Section:
${section}

## Expansion Request:
${direction}

Generate additional content that seamlessly extends this section while maintaining consistency with the existing text. Provide 2-3 new paragraphs:`;
}

/**
 * Estimate token count for generation prompts
 * @param {Object} params - Prompt parameters
 * @returns {number} - Estimated token count
 */
export function estimateGenerationTokens(params) {
  const { prompt = '', context = '' } = params;
  // Rough estimate: system message (~100) + context + user prompt + template (~200)
  const CHARS_PER_TOKEN = 4;
  return Math.ceil((300 + context.length + prompt.length) / CHARS_PER_TOKEN);
}
