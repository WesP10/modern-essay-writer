export interface AIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AutocompleteParams {
  prefix: string;
  context: string;
  essayType: string;
  cursorPosition?: number;
}

export interface AutocompleteSuggestion {
  text: string;
  confidence: number;
  type: 'word' | 'phrase' | 'sentence';
  source: 'dictionary' | 'contextual' | 'pattern';
}

export interface AutocompleteResponse {
  suggestions: AutocompleteSuggestion[];
  latency: number;
  cached: boolean;
  metadata?: Record<string, any>;
}

export interface DetectionParams {
  text: string;
  essayHtml?: string;
  model?: string;
}

export interface DetectionResult {
  confidence: number;
  reasoning: string;
  flaggedPatterns: string[];
  vocabularyScore?: number;
  isLikelyAI: boolean;
  perplexity?: string;
  burstiness?: string;
  humanLikelihood?: string;
}

export interface HumanizeParams {
  text: string;
  tone?: string;
  preserveMeaning?: boolean;
  model?: string;
}

export interface HumanizeResult {
  humanizedText: string;
  originalText: string;
  changes: string[];
  improvementMetrics: {
    naturalness: number;
    diversityImprovement: number;
  };
}

export interface GenerateParams {
  prompt: string;
  essayType?: string;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  temperature?: number;
  essayHtml?: string;
  model?: string;
  generationType?: 'text' | 'outline' | 'pro' | 'citation';
}

export interface GenerateResult {
  content: string;
  metadata: {
    model: string;
    latency: number;
    usage?: any;
  };
}
