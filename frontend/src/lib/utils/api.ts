import { getAuthToken } from '$lib/firebaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get the authentication token from Firebase
 */
async function getFirebaseAuthToken(): Promise<string | null> {
	return getAuthToken();
}

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
	const token = await getFirebaseAuthToken();
	
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(options.headers as Record<string, string> || {})
	};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const response = await fetch(`${API_URL}${endpoint}`, {
		...options,
		headers
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({
			message: response.statusText
		}));
		throw new Error(error.message || 'API request failed');
	}

	return response.json();
}

// ============================================================================
// AI Services API
// ============================================================================

export interface AutocompleteSuggestion {
	text: string;
	confidence: number;
	type: 'word' | 'phrase';
	source: 'dictionary' | 'contextual' | 'pattern' | 'ngram' | 'llm' | 'multi-word-pattern';
	tier?: number;
	fullPhrase?: string;
}

export interface AutocompleteResponse {
	success: boolean;
	prefix: string;
	suggestions: AutocompleteSuggestion[];
	metadata: {
		latency: number;
		cached: boolean;
		tier: number;
		count: number;
	};
}

export interface AutocompleteRequest {
	prefix: string;
	context?: string;
	cursorPosition?: number;
	essayType?: 'argumentative' | 'research' | 'narrative' | 'expository';
	enableLLM?: boolean;
	maxSuggestions?: number;
	triggerType?: 'auto' | 'keystroke' | 'space' | 'idle';
}

/**
 * Get enhanced autocomplete suggestions with LLM support
 */
export async function getAutocompleteSuggestions(
	request: AutocompleteRequest
): Promise<AutocompleteResponse> {
	console.log('[API] Requesting autocomplete for:', request);
	try {
		const response = await apiRequest<AutocompleteResponse>('/api/ai/autocomplete', {
			method: 'POST',
			body: JSON.stringify({
				...request,
				enableLLM: request.enableLLM !== undefined ? request.enableLLM : true,
				maxSuggestions: request.maxSuggestions || 5
			})
		});
		console.log('[API] Autocomplete response:', response);
		return response;
	} catch (error) {
		console.error('[API] Autocomplete error:', error);
		throw error;
	}
}

/**
 * Record user's autocomplete selection for learning
 */
export async function recordAutocompleteSelection(
	suggestion: string,
	essayType?: string
): Promise<void> {
	try {
		await apiRequest('/api/ai/autocomplete/record-selection', {
			method: 'POST',
			body: JSON.stringify({ suggestion, essayType })
		});
	} catch (error) {
		console.error('[API] Failed to record selection:', error);
		// Don't throw - this is not critical
	}
}

export interface DetectRequest {
	text: string;
	essayHtml?: string;
	granularity?: 'standard' | 'detailed';
	model?: string;
}

export interface DetectResponse {
	success: boolean;
	confidence: number;
	reasoning: string;
	flaggedPatterns: string[];
	perplexity: 'low' | 'medium' | 'high';
	burstiness: 'low' | 'medium' | 'high';
	humanLikelihood: 'low' | 'medium' | 'high';
	isLikelyAI: boolean;
	sections?: Array<{
		section: string;
		confidence: number;
		issues: string[];
	}>;
	metadata: {
		model: string;
		textLength: number;
		latency: number;
		sectionCount?: number;
	};
	tokensRemaining: number;
}

/**
 * Detect AI-generated content
 */
export async function detectAiContent(request: DetectRequest): Promise<DetectResponse> {
	try {
		const response = await apiRequest<DetectResponse>('/api/ai/detect', {
			method: 'POST',
			body: JSON.stringify(request)
		});
		return response;
	} catch (error) {
		console.error('[API] Failed to detect AI:', error);
		throw error;
	}
}

export interface HumanizeRequest {
	text: string;
	essayHtml?: string;
	tone?: 'academic' | 'casual' | 'formal';
	preserveMeaning?: boolean;
	model?: string;
}

export interface HumanizeResponse {
	success: boolean;
	originalText: string;
	humanizedText: string;
	improvement: {
		naturalness: number;
		varietyScore: number;
		flowScore: number;
		overallImprovement: number;
		sentenceCountChange?: number;
		diversityImprovement?: number;
	};
	metadata: {
		model: string;
		tone: string;
		preserveMeaning: boolean;
		latency: number;
		originalLength: number;
		humanizedLength: number;
	};
	tokensRemaining: number;
}

/**
 * Humanize AI-generated text
 */
export async function humanizeText(request: HumanizeRequest): Promise<HumanizeResponse> {
	try {
		const response = await apiRequest<HumanizeResponse>('/api/ai/humanize', {
			method: 'POST',
			body: JSON.stringify(request)
		});
		return response;
	} catch (error) {
		console.error('[API] Failed to humanize text:', error);
		throw error;
	}
}

export interface GenerateRequest {
	prompt: string;
	essayHtml?: string;
	generationType?: 'content' | 'outline' | 'expand';
	tone?: 'formal' | 'casual' | 'academic' | 'persuasive' | 'neutral';
	length?: 'short' | 'medium' | 'long';
	essayType?: 'academic' | 'argumentative' | 'narrative' | 'expository' | 'persuasive' | 'descriptive' | 'analytical';
	temperature?: number;
	model?: string;
	// For outline generation
	topic?: string;
	sections?: number;
	// For expand generation
	section?: string;
	direction?: string;
}

export interface GenerateResponse {
	success: boolean;
	generatedText: string;
	metadata: {
		model: string;
		latency: number;
		essayType?: string;
		tone?: string;
		length?: string;
		temperature?: number;
		contextTokens?: number;
	};
	tokensRemaining: number;
}

/**
 * Generate text based on prompt
 */
export async function generateText(request: GenerateRequest): Promise<GenerateResponse> {
	try {
		const response = await apiRequest<GenerateResponse>('/api/ai/generate', {
			method: 'POST',
			body: JSON.stringify(request)
		});
		return response;
	} catch (error) {
		console.error('[API] Failed to generate text:', error);
		throw error;
	}
}

// ============================================================================
// Essay Management API
// ============================================================================

export interface Essay {
	id: string;
	user_id: string;
	title: string;
	content: string;
	word_count: number;
	char_count: number;
	created_at: string;
	updated_at: string;
}

export interface CreateEssayRequest {
	title: string;
	content?: string;
	word_count?: number;
	char_count?: number;
}

export interface UpdateEssayRequest {
	title?: string;
	content?: string;
	word_count?: number;
	char_count?: number;
}

/**
 * Get all essays for the authenticated user
 */
export async function getUserEssays(): Promise<Essay[]> {
	try {
		const response = await apiRequest<{ essays: Essay[] }>('/api/essays', {
			method: 'GET'
		});
		return response.essays;
	} catch (error) {
		console.error('[API] Failed to get user essays:', error);
		throw error;
	}
}

/**
 * Get a specific essay by ID
 */
export async function getEssay(essayId: string): Promise<Essay> {
	try {
		const response = await apiRequest<{ essay: Essay }>(`/api/essays/${essayId}`, {
			method: 'GET'
		});
		return response.essay;
	} catch (error) {
		console.error('[API] Failed to get essay:', error);
		throw error;
	}
}

/**
 * Create a new essay
 */
export async function createEssay(data: CreateEssayRequest): Promise<Essay> {
	try {
		const response = await apiRequest<{ essay: Essay }>('/api/essays', {
			method: 'POST',
			body: JSON.stringify(data)
		});
		return response.essay;
	} catch (error) {
		console.error('[API] Failed to create essay:', error);
		throw error;
	}
}

/**
 * Sync an essay (create or update based on existence)
 */
export async function syncEssay(essayId: string, data: CreateEssayRequest & { created_at?: string }): Promise<Essay> {
	try {
		const response = await apiRequest<{ essay: Essay }>(`/api/essays/${essayId}/sync`, {
			method: 'PUT',
			body: JSON.stringify(data)
		});
		return response.essay;
	} catch (error) {
		console.error('[API] Failed to sync essay:', error);
		throw error;
	}
}

/**
 * Update an existing essay
 */
export async function updateEssay(essayId: string, data: UpdateEssayRequest): Promise<Essay> {
	try {
		const response = await apiRequest<{ essay: Essay }>(`/api/essays/${essayId}`, {
			method: 'PUT',
			body: JSON.stringify(data)
		});
		return response.essay;
	} catch (error) {
		console.error('[API] Failed to update essay:', error);
		throw error;
	}
}

/**
 * Delete an essay
 */
export async function deleteEssay(essayId: string): Promise<void> {
	try {
		await apiRequest<{ success: boolean }>(`/api/essays/${essayId}`, {
			method: 'DELETE'
		});
	} catch (error) {
		console.error('[API] Failed to delete essay:', error);
		throw error;
	}
}

// ============================================================================
// AI Session Management
// ============================================================================

export interface SessionStatus {
	success: boolean;
	tokensRemaining: number;
	sessionActive: boolean;
	rateLimit?: {
		minute: number;
		hour: number;
	};
	canUseServices?: boolean;
}

/**
 * Initialize AI session on panel open
 */
export async function initSession(): Promise<SessionStatus> {
	try {
		const response = await apiRequest<SessionStatus>('/api/ai/session/init', {
			method: 'POST'
		});
		return response;
	} catch (error) {
		console.error('[API] Failed to initialize session:', error);
		throw error;
	}
}

/**
 * Get current session status (tokens, rate limits)
 */
export async function getSessionStatus(): Promise<SessionStatus> {
	try {
		const response = await apiRequest<SessionStatus>('/api/ai/session/status', {
			method: 'GET'
		});
		return response;
	} catch (error) {
		console.error('[API] Failed to get session status:', error);
		throw error;
	}
}

// ============================================================================
// Citation Service
// ============================================================================

export interface Citation {
	quotedText?: string;
	author?: string;
	source?: string;
	type?: 'direct quote' | 'paraphrase' | 'reference';
	context?: string;
	completeness?: 'complete' | 'partial' | 'missing';
}

export interface ExtractCitationsRequest {
	text: string;
	essayHtml?: string;
	model?: string;
}

export interface ExtractCitationsResponse {
	success: boolean;
	citations: Citation[];
	metadata: {
		model: string;
		citationsFound: number;
		latency: number;
	};
	tokensRemaining: number;
}

export interface FormatCitationsRequest {
	citations: Citation[];
	style?: 'APA' | 'MLA' | 'Chicago';
	model?: string;
}

export interface FormattedCitation {
	original: Citation;
	formatted: string;
	inText: string;
	missing: string[];
	complete: boolean;
}

export interface FormatCitationsResponse {
	success: boolean;
	formattedCitations: FormattedCitation[];
	style: string;
	metadata: {
		model: string;
		style: string;
		latency: number;
	};
	tokensRemaining: number;
}

export interface GenerateBibliographyRequest {
	citations: Citation[] | FormattedCitation[];
	style?: 'APA' | 'MLA' | 'Chicago';
	sortBy?: 'alphabetical' | 'appearance';
	model?: string;
}

export interface GenerateBibliographyResponse {
	success: boolean;
	bibliography: string;
	metadata: {
		model: string;
		style: string;
		sortBy: string;
		citationCount: number;
		latency: number;
	};
	tokensRemaining: number;
}

/**
 * Extract citations from essay text
 */
export async function extractCitations(request: ExtractCitationsRequest): Promise<ExtractCitationsResponse> {
	try {
		const response = await apiRequest<ExtractCitationsResponse>('/api/ai/citations/extract', {
			method: 'POST',
			body: JSON.stringify(request)
		});
		return response;
	} catch (error) {
		console.error('[API] Failed to extract citations:', error);
		throw error;
	}
}

/**
 * Format citations in specified style
 */
export async function formatCitations(request: FormatCitationsRequest): Promise<FormatCitationsResponse> {
	try {
		const response = await apiRequest<FormatCitationsResponse>('/api/ai/citations/format', {
			method: 'POST',
			body: JSON.stringify(request)
		});
		return response;
	} catch (error) {
		console.error('[API] Failed to format citations:', error);
		throw error;
	}
}

/**
 * Generate bibliography from citations
 */
export async function generateBibliography(request: GenerateBibliographyRequest): Promise<GenerateBibliographyResponse> {
	try {
		const response = await apiRequest<GenerateBibliographyResponse>('/api/ai/citations/generate', {
			method: 'POST',
			body: JSON.stringify(request)
		});
		return response;
	} catch (error) {
		console.error('[API] Failed to generate bibliography:', error);
		throw error;
	}
}

// ============================================================================
// AI Detection Service
// ============================================================================

/**
 * Detect AI-generated content (alias for detectAiContent with new interface)
 */
export async function detectAI(request: DetectRequest): Promise<DetectResponse> {
	return detectAiContent(request);
}
