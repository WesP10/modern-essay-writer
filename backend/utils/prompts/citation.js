/**
 * Prompt templates for citation service
 */

/**
 * Generate citation extraction prompt
 * @param {Object} params - Extraction parameters
 * @param {string} params.text - Text containing citations
 * @param {string} params.context - Full essay context
 * @returns {string} - Complete prompt for LLM
 */
export function extractCitationsPrompt({ text, context = '' }) {
  const systemMessage = `You are an expert at identifying and extracting citations from academic text. Identify all sources, quotes, and references that need proper citation.`;

  let fullPrompt = `${systemMessage}\n\n`;

  if (context) {
    fullPrompt += `## Full Essay Context:\n${context}\n\n`;
  }

  fullPrompt += `## Text to Analyze:\n${text}\n\n`;
  fullPrompt += `## Task:
Identify all sources, quotes, and references that require citation. For each, extract:
- The quoted or referenced material
- Any author/source information present
- The context in which it appears

Provide a JSON array:
[
  {
    "quotedText": "the quoted or referenced material",
    "author": "author name if mentioned",
    "source": "source title if mentioned",
    "type": "direct quote" | "paraphrase" | "reference",
    "context": "brief context of usage",
    "completeness": "complete" | "partial" | "missing"
  }
]

Respond with ONLY the JSON array, no additional text:`;

  return fullPrompt;
}

/**
 * Generate citation formatting prompt
 * @param {Object} params - Formatting parameters
 * @param {Array} params.citations - Array of citation objects
 * @param {string} params.style - Citation style (APA, MLA, Chicago)
 * @returns {string} - Complete prompt for citation formatting
 */
export function formatCitationsPrompt({ citations, style = 'APA' }) {
  const systemMessage = `You are an expert at formatting academic citations according to various style guides.`;

  const styleGuides = {
    APA: 'APA 7th edition: Author, A. A. (Year). Title of work. Publisher. https://doi.org/xxx',
    MLA: 'MLA 9th edition: Author. "Title of Source." Title of Container, Publisher, Year, pages.',
    Chicago: 'Chicago 17th edition: Author. Year. Title. Place: Publisher.',
  };

  let fullPrompt = `${systemMessage}\n\n`;
  fullPrompt += `## Citation Style:\n${style} - ${styleGuides[style] || 'Follow standard academic conventions'}\n\n`;
  fullPrompt += `## Citations to Format:\n${JSON.stringify(citations, null, 2)}\n\n`;
  fullPrompt += `## Task:
Format each citation according to ${style} style. If information is missing, note what's needed.

Provide a JSON array:
[
  {
    "original": {original citation object},
    "formatted": "properly formatted citation string",
    "inText": "in-text citation format (Author, Year) or [1]",
    "missing": ["list", "of", "missing", "fields"],
    "complete": true/false
  }
]

Respond with ONLY the JSON array:`;

  return fullPrompt;
}

/**
 * Generate bibliography generation prompt
 * @param {Object} params - Bibliography parameters
 * @param {Array} params.citations - Array of formatted citations
 * @param {string} params.style - Citation style
 * @param {string} params.sortBy - Sorting method (alphabetical, appearance, etc.)
 * @returns {string} - Complete prompt for bibliography generation
 */
export function generateBibliographyPrompt({ citations, style = 'APA', sortBy = 'alphabetical' }) {
  const systemMessage = `You are creating a properly formatted bibliography for an academic essay.`;

  let fullPrompt = `${systemMessage}\n\n`;
  fullPrompt += `## Citation Style:\n${style}\n\n`;
  fullPrompt += `## Citations:\n${JSON.stringify(citations, null, 2)}\n\n`;
  fullPrompt += `## Task:
Create a complete bibliography section with:
1. Proper heading ("References" for APA, "Works Cited" for MLA, "Bibliography" for Chicago)
2. All citations formatted correctly for ${style}
3. Sorted ${sortBy}
4. Proper indentation (hanging indent for most styles)
5. Double-spacing between entries

Provide the formatted bibliography as plain text, ready to insert into the essay:`;

  return fullPrompt;
}

/**
 * Generate citation validation prompt
 * @param {Object} citation - Citation object to validate
 * @param {string} style - Citation style
 * @returns {string} - Prompt to validate citation completeness
 */
export function validateCitationPrompt(citation, style) {
  return `Validate this citation for ${style} style:

${JSON.stringify(citation, null, 2)}

Check:
- Are all required fields present?
- Is the format correct for ${style}?
- Are there any errors or inconsistencies?

Provide a JSON response:
{
  "valid": true/false,
  "missing": ["field1", "field2"],
  "errors": ["error1", "error2"],
  "suggestions": ["suggestion1", "suggestion2"]
}

Respond with ONLY the JSON object:`;
}

/**
 * Generate in-text citation suggestion prompt
 * @param {Object} params - Citation context
 * @param {string} params.sentence - Sentence needing citation
 * @param {string} params.sourceInfo - Available source information
 * @param {string} params.style - Citation style
 * @returns {string} - Prompt to suggest in-text citation
 */
export function suggestInTextPrompt({ sentence, sourceInfo, style = 'APA' }) {
  return `Suggest where and how to add an in-text citation to this sentence:

## Sentence:
${sentence}

## Source Information:
${sourceInfo}

## Citation Style:
${style}

Provide:
1. The sentence with the citation properly inserted
2. The specific in-text citation format used

Respond in JSON:
{
  "citedSentence": "sentence with (Author, Year) or [1] inserted",
  "inTextCitation": "(Author, Year)" or "[1]",
  "placement": "where the citation was added"
}

Respond with ONLY the JSON object:`;
}

/**
 * Estimate token count for citation prompts
 * @param {Object} params - Prompt parameters
 * @returns {number} - Estimated token count
 */
export function estimateCitationTokens(params) {
  const { text = '', context = '', citations = [] } = params;
  // Rough estimate: system message (~150) + text + context + citations data (~200)
  const CHARS_PER_TOKEN = 4;
  const citationsLength = JSON.stringify(citations).length;
  return Math.ceil((350 + text.length + context.length + citationsLength) / CHARS_PER_TOKEN);
}
