<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let loading = false;
  export let disabled = false;

  const dispatch = createEventDispatcher();

  let tone = 'academic';
  let preserveMeaning = true;

  const tones = [
    { value: 'academic', label: 'Academic & Formal' },
    { value: 'casual', label: 'Conversational' },
    { value: 'professional', label: 'Professional' },
    { value: 'creative', label: 'Creative & Expressive' }
  ];

  function handleHumanize() {
    dispatch('humanize', { tone, preserveMeaning });
  }
</script>

<div class="space-y-4">
  <div class="space-y-3">
    <!-- Tone Selection -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Target Tone
      </label>
      <select
        bind:value={tone}
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
        {disabled}
      >
        {#each tones as t}
          <option value={t.value}>{t.label}</option>
        {/each}
      </select>
    </div>

    <!-- Options -->
    <div class="flex items-center">
      <input
        id="preserve-meaning"
        type="checkbox"
        bind:checked={preserveMeaning}
        class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        {disabled}
      />
      <label for="preserve-meaning" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
        Strictly preserve original meaning
      </label>
    </div>
  </div>

  <button
    on:click={handleHumanize}
    disabled={loading || disabled}
    class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
    {#if loading}
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Humanizing...
    {:else}
      ✨ Humanize Text
    {/if}
  </button>
</div>
