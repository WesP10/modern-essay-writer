import { supabase } from '$lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get the authentication token from Supabase
 */
async function getAuthToken(): Promise<string | null> {
	if (!supabase) return null;
	
	const { data: { session } } = await supabase.auth.getSession();
	return session?.access_token || null;
}

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
	const token = await getAuthToken();
	
	const headers: HeadersInit = {
		'Content-Type': 'application/json',
		...options.headers
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

export interface DetectionResponse {
	isAiGenerated: boolean;
	confidence: number;
	metrics: {
		perplexity: number;
		burstiness: number;
		lexicalDiversity: number;
		repetition: number;
		syntaxComplexity: number;
	};
	explanation: string;
	latency: number;
}

/**
 * Detect if text is AI-generated
 */
export async function detectAiContent(text: string): Promise<DetectionResponse> {
	return apiRequest<DetectionResponse>('/api/ai/detect', {
		method: 'POST',
		body: JSON.stringify({ text })
	});
}

export interface HumanizeResponse {
	rewrittenText: string;
	changes: Array<{
		type: string;
		original: string;
		replacement: string;
	}>;
	improvement: number;
	latency: number;
}

/**
 * Humanize AI-generated text
 */
export async function humanizeText(
	text: string,
	intensity: 'light' | 'medium' | 'heavy' = 'medium'
): Promise<HumanizeResponse> {
	return apiRequest<HumanizeResponse>('/api/ai/humanize', {
		method: 'POST',
		body: JSON.stringify({ text, intensity })
	});
}

export interface GenerateResponse {
	generatedText: string;
	model: string;
	latency: number;
	tokensGenerated: number;
}

/**
 * Generate text based on prompt
 */
export async function generateText(
	prompt: string,
	options?: {
		length?: 'short' | 'medium' | 'long';
		essayType?: 'argumentative' | 'research' | 'narrative' | 'expository';
		temperature?: number;
	}
): Promise<GenerateResponse> {
	return apiRequest<GenerateResponse>('/api/ai/generate', {
		method: 'POST',
		body: JSON.stringify({ prompt, ...options })
	});
}
