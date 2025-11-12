/**
 * Enhanced Autocomplete Frontend Integration
 * 
 * This TypeScript utility provides client-side integration
 * for the enhanced autocomplete service
 */

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

export interface AutocompleteOptions {
  prefix: string;
  context?: string;
  cursorPosition?: number;
  essayType?: 'argumentative' | 'research' | 'narrative' | 'expository';
  enableLLM?: boolean;
  maxSuggestions?: number;
}

/**
 * Enhanced Autocomplete API Client
 */
export class EnhancedAutocomplete {
  private baseUrl: string;
  private debounceTimer: number | null = null;
  private debounceMs: number = 150; // Wait 150ms before querying
  private cache: Map<string, AutocompleteResponse> = new Map();
  private maxCacheSize: number = 200;

  constructor(baseUrl: string = '/api/ai') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get autocomplete suggestions with debouncing
   */
  async getSuggestions(options: AutocompleteOptions): Promise<AutocompleteResponse> {
    const { prefix, context = '', essayType, enableLLM = true, maxSuggestions = 5 } = options;

    // Validate
    if (!prefix || prefix.length < 2) {
      return this.emptyResponse(prefix);
    }

    // Check cache first
    const cacheKey = this.getCacheKey(options);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const response = await fetch(`${this.baseUrl}/autocomplete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prefix,
          context,
          essayType,
          enableLLM,
          maxSuggestions
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: AutocompleteResponse = await response.json();
      
      // Cache the result
      this.cacheResult(cacheKey, data);
      
      return data;

    } catch (error) {
      console.error('Autocomplete error:', error);
      return this.emptyResponse(prefix);
    }
  }

  /**
   * Get suggestions with debouncing (for real-time typing)
   */
  async getSuggestionsDebounced(
    options: AutocompleteOptions,
    callback: (response: AutocompleteResponse) => void
  ): Promise<void> {
    // Clear existing timer
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    // Set new timer
    this.debounceTimer = window.setTimeout(async () => {
      const response = await this.getSuggestions(options);
      callback(response);
      this.debounceTimer = null;
    }, this.debounceMs);
  }

  /**
   * Record user's selection for learning
   */
  async recordSelection(suggestion: string, essayType?: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/autocomplete/record-selection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestion,
          essayType
        })
      });
    } catch (error) {
      console.error('Failed to record selection:', error);
    }
  }

  /**
   * Clear local cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get statistics (for debugging)
   */
  async getStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/autocomplete/stats`);
      const data = await response.json();
      return data.stats;
    } catch (error) {
      console.error('Failed to get stats:', error);
      return null;
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(options: AutocompleteOptions): string {
    const { prefix, context = '', essayType = 'general' } = options;
    const contextSnippet = context.slice(-50); // Last 50 chars
    return `${prefix.toLowerCase()}_${essayType}_${contextSnippet}`;
  }

  /**
   * Cache result with LRU eviction
   */
  private cacheResult(key: string, data: AutocompleteResponse): void {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, data);
  }

  /**
   * Return empty response
   */
  private emptyResponse(prefix: string): AutocompleteResponse {
    return {
      success: false,
      prefix,
      suggestions: [],
      metadata: {
        latency: 0,
        cached: false,
        tier: 0,
        count: 0
      }
    };
  }

  /**
   * Set debounce delay
   */
  setDebounceMs(ms: number): void {
    this.debounceMs = ms;
  }
}

/**
 * Example Usage in Svelte Component
 */
export const exampleUsage = `
<script lang="ts">
  import { EnhancedAutocomplete } from '$lib/utils/enhanced-autocomplete';
  import { onMount } from 'svelte';

  let autocomplete: EnhancedAutocomplete;
  let suggestions: AutocompleteSuggestion[] = [];
  let showDropdown = false;
  let selectedIndex = 0;
  let editorContent = '';
  let currentPrefix = '';

  onMount(() => {
    autocomplete = new EnhancedAutocomplete();
  });

  // Handle typing in editor
  async function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    editorContent = target.value;
    
    // Extract current word being typed
    const cursorPos = target.selectionStart;
    const beforeCursor = editorContent.slice(0, cursorPos);
    const words = beforeCursor.split(/\\s+/);
    currentPrefix = words[words.length - 1];

    // Get suggestions (debounced)
    if (currentPrefix.length >= 2) {
      autocomplete.getSuggestionsDebounced({
        prefix: currentPrefix,
        context: beforeCursor.slice(-200), // Last 200 chars
        essayType: 'argumentative',
        enableLLM: true,
        maxSuggestions: 5
      }, (response) => {
        suggestions = response.suggestions;
        showDropdown = suggestions.length > 0;
        selectedIndex = 0;
      });
    } else {
      showDropdown = false;
      suggestions = [];
    }
  }

  // Handle suggestion selection
  async function selectSuggestion(suggestion: AutocompleteSuggestion) {
    // Replace current prefix with selected suggestion
    const cursorPos = // ... get cursor position
    const before = editorContent.slice(0, cursorPos - currentPrefix.length);
    const after = editorContent.slice(cursorPos);
    editorContent = before + suggestion.text + after;
    
    // Record selection for learning
    await autocomplete.recordSelection(suggestion.text, 'argumentative');
    
    // Hide dropdown
    showDropdown = false;
    suggestions = [];
  }

  // Handle keyboard navigation
  function handleKeyDown(event: KeyboardEvent) {
    if (!showDropdown) return;

    switch(event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = (selectedIndex + 1) % suggestions.length;
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = (selectedIndex - 1 + suggestions.length) % suggestions.length;
        break;
      case 'Enter':
      case 'Tab':
        event.preventDefault();
        if (suggestions[selectedIndex]) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        showDropdown = false;
        break;
    }
  }
</script>

<div class="editor-container">
  <textarea
    bind:value={editorContent}
    on:input={handleInput}
    on:keydown={handleKeyDown}
    placeholder="Start writing..."
  />
  
  {#if showDropdown}
    <div class="autocomplete-dropdown">
      {#each suggestions as suggestion, i}
        <div 
          class="suggestion-item"
          class:selected={i === selectedIndex}
          on:click={() => selectSuggestion(suggestion)}
        >
          <span class="suggestion-text">{suggestion.text}</span>
          <span class="suggestion-meta">
            {suggestion.type === 'phrase' ? '📝' : ''}
            {suggestion.source === 'llm' ? '🤖' : ''}
            {Math.round(suggestion.confidence * 100)}%
          </span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .autocomplete-dropdown {
    position: absolute;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    z-index: 1000;
  }

  .suggestion-item {
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .suggestion-item:hover,
  .suggestion-item.selected {
    background: #f0f0f0;
  }

  .suggestion-meta {
    font-size: 0.85em;
    color: #666;
    margin-left: 12px;
  }
</style>
`;

// Export singleton instance
export const autocompleteClient = new EnhancedAutocomplete();
