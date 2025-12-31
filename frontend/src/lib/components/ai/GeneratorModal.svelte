<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { aiService } from '$lib/services/aiService';
  import type { GenerateParams } from '$lib/types/ai';

  export let isOpen = false;
  export let essayType = 'academic'; // Default but can be overridden

  const dispatch = createEventDispatcher();

  let prompt = '';
  let length: 'short' | 'medium' | 'long' = 'medium';
  let tone = 'academic';
  let generatedContent = '';
  let loading = false;
  let error = '';

  const lengths = [
    { value: 'short', label: 'Short (~200 words)' },
    { value: 'medium', label: 'Medium (~400 words)' },
    { value: 'long', label: 'Long (~700 words)' }
  ];

  function close() {
    isOpen = false;
    prompt = '';
    generatedContent = '';
    error = '';
  }

  async function handleGenerate() {
    if (!prompt) return;

    loading = true;
    error = '';
    generatedContent = '';

    try {
      const params: GenerateParams = {
        prompt,
        essayType,
        tone,
        length
      };

      const result = await aiService.generate(params);
      generatedContent = result.content;
    } catch (e: any) {
      error = e.message || 'Generation failed';
    } finally {
      loading = false;
    }
  }

  function handleInsert() {
    dispatch('insert', generatedContent);
    close();
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    on:click={close}
    on:keydown={(e) => e.key === 'Escape' && close()}
    role="button"
    tabindex="0"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]"
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <span class="mr-2">🤖</span> AI Writer
        </h2>
        <button on:click={close} class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
          ✕
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 overflow-y-auto flex-1 space-y-6">
        {#if !generatedContent}
          <!-- Input Form -->
          <div class="space-y-4">
            <div>
              <label for="prompt" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                What should I write about?
              </label>
              <textarea
                id="prompt"
                bind:value={prompt}
                rows="3"
                class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-3"
                placeholder="E.g., Explain the impact of artificial intelligence on modern education..."
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Length</label>
                <select
                  bind:value={length}
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                >
                  {#each lengths as l}
                    <option value={l.value}>{l.label}</option>
                  {/each}
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tone</label>
                <select
                  bind:value={tone}
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                >
                  <option value="academic">Academic & Formal</option>
                  <option value="casual">Conversational</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
            </div>

            {#if error}
              <div class="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            {/if}
          </div>
        {:else}
          <!-- Preview -->
          <div class="space-y-4">
            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div class="text-xs font-semibold text-gray-500 mb-2 uppercase">Preview</div>
              <div class="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                {generatedContent}
              </div>
            </div>
            <div class="flex justify-end text-sm text-gray-500">
              <button class="hover:text-indigo-600" on:click={() => generatedContent = ''}>
                ← Discard and try again
              </button>
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex justify-end space-x-3">
        {#if !generatedContent}
          <button
            on:click={close}
            class="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-600"
          >
            Cancel
          </button>
          <button
            on:click={handleGenerate}
            disabled={!prompt || loading}
            class="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
          >
            {#if loading}
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generate
            {:else}
              Generate Content
            {/if}
          </button>
        {:else}
          <button
            on:click={handleInsert}
            class="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
             Insert into Essay
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
