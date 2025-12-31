<script lang="ts">
  import type { DetectionResult } from '$lib/types/ai';

  export let result: DetectionResult | null = null;
  export let loading = false;

  $: confidenceColor = result ? getConfidenceColor(result.confidence) : 'bg-gray-200';

  function getConfidenceColor(score: number): string {
    if (score < 30) return 'bg-green-500';
    if (score < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  }
</script>

<div class="space-y-4">
  {#if loading}
    <div class="animate-pulse space-y-3">
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div class="h-24 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
    </div>
  {:else if result}
    <!-- Score Indicator -->
    <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
        AI Likelihood
      </div>
      <div class="flex items-center justify-center space-x-2">
        <span class="text-3xl font-bold text-gray-900 dark:text-white">
          {result.confidence}%
        </span>
        <span class="text-sm font-medium px-2 py-1 rounded bg-gray-200 dark:bg-gray-700">
          {result.isLikelyAI ? 'Likely AI' : 'Likely Human'}
        </span>
      </div>
      
      <!-- Progress Bar -->
      <div class="mt-3 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          class="h-full {confidenceColor} transition-all duration-500 ease-out"
          style="width: {result.confidence}%"
        ></div>
      </div>
    </div>

    <!-- Details -->
    <div class="space-y-3">
      <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
        <div class="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wide mb-1">
          Analysis
        </div>
        <p class="text-sm text-gray-700 dark:text-gray-300">
          {result.reasoning}
        </p>
      </div>

      <!-- Flagged Patterns -->
      {#if result.flaggedPatterns.length > 0}
        <div>
          <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Flagged Patterns
          </div>
          <div class="flex flex-wrap gap-2">
            {#each result.flaggedPatterns as pattern}
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                {pattern}
              </span>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Metrics -->
      <div class="grid grid-cols-2 gap-2 text-xs text-gray-500">
        <div class="flex justify-between">
          <span>Perplexity:</span>
          <span class="font-medium text-gray-900 dark:text-gray-300">{result.perplexity || 'N/A'}</span>
        </div>
        <div class="flex justify-between">
          <span>Burstiness:</span>
          <span class="font-medium text-gray-900 dark:text-gray-300">{result.burstiness || 'N/A'}</span>
        </div>
      </div>
    </div>
  {:else}
    <div class="text-center py-8 text-gray-500">
      Run detection to see results
    </div>
  {/if}
</div>
