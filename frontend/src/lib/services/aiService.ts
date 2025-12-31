import { getAuthToken } from '$lib/firebaseClient';
import type {
  AutocompleteParams,
  AutocompleteResponse,
  DetectionParams,
  DetectionResult,
  HumanizeParams,
  HumanizeResult,
  GenerateParams,
  GenerateResult,
  AIResponse
} from '../types/ai';

// Use the same API_URL base as the existing api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class AIService {
  private async request<T>(endpoint: string, method: string, body?: any): Promise<T> {
    try {
      // Get Firebase authentication token
      const token = await getAuthToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add Authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `API Error: ${response.statusText}`);
      }

      const data: AIResponse<T> = await response.json();

      // Some endpoints might return data directly or wrapped in success/data
      // Based on backend tests, they return { success: true, ...data }
      // So we merge the top level properties into the result type or extract specific fields
      // Let's assume the backend usage pattern:
      // Autocomplete returns { suggestions: [], ... }
      // Detect returns { success: true, confidence: 90, ... }

      return data as unknown as T;
    } catch (error) {
      console.error(`AI Service Error (${endpoint}):`, error);
      throw error;
    }
  }

  async getSuggestions(params: AutocompleteParams): Promise<AutocompleteResponse> {
    return this.request<AutocompleteResponse>('/api/ai/autocomplete', 'POST', params);
  }

  async detect(params: DetectionParams): Promise<DetectionResult> {
    return this.request<DetectionResult>('/api/ai/detect', 'POST', params);
  }

  async humanize(params: HumanizeParams): Promise<HumanizeResult> {
    return this.request<HumanizeResult>('/api/ai/humanize', 'POST', params);
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    return this.request<GenerateResult>('/api/ai/generate', 'POST', params);
  }

  async extractCitations(params: { text: string; essayHtml?: string }): Promise<{ citations: any[] }> {
    return this.request<{ citations: any[] }>('/api/ai/citations/extract', 'POST', params);
  }

  async formatCitations(params: { citations: any[]; style: string }): Promise<{ formattedCitations: any[] }> {
    return this.request<{ formattedCitations: any[] }>('/api/ai/citations/format', 'POST', params);
  }

  async generateBibliography(params: { citations: any[]; style: string }): Promise<{ bibliography: string }> {
    return this.request<{ bibliography: string }>('/api/ai/citations/bibliography', 'POST', params);
  }
}

export const aiService = new AIService();
