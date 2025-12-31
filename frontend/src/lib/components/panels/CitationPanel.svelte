<script lang="ts">
  import type { Editor } from "@tiptap/core";
  import { createEventDispatcher } from "svelte";
  import { aiService } from "$lib/services/aiService";
  // Interface for Citation can be moved to ai types if needed, treating as any for now from response

  export let editor: Editor | null = null;
  export let sessionActive: boolean = false;
  export let canUseServices: boolean = false;

  const dispatch = createEventDispatcher();
  const TOKEN_COST = 5;

  let citationStyle: "APA" | "MLA" | "Chicago" = "APA";
  let isExtracting = false;
  let isFormatting = false;
  let isGenerating = false;
  let citations: any[] = [];
  let formattedCitations: any[] = [];
  let bibliography = "";
  let error = "";

  const formats: ("APA" | "MLA" | "Chicago")[] = ["APA", "MLA", "Chicago"];

  async function handleExtract() {
    if (!canUseServices || !editor) return;

    error = "";
    citations = [];
    formattedCitations = [];
    bibliography = "";
    isExtracting = true;

    try {
      const essayHtml = editor.getHTML();
      const text = editor.getText();

      const response = await aiService.extractCitations({
        text,
        essayHtml,
      });

      citations = response.citations;
      dispatch("tokensUpdated");
    } catch (err: any) {
      if (err.message?.includes("402")) {
        error =
          "Insufficient tokens. You need at least 5 tokens to extract citations.";
      } else if (err.message?.includes("429")) {
        error = "Rate limit exceeded. Please wait a moment and try again.";
      } else {
        error = err.message || "Failed to extract citations. Please try again.";
      }
      console.error("Extract error:", err);
    } finally {
      isExtracting = false;
    }
  }

  async function handleFormat() {
    if (!canUseServices || !editor || citations.length === 0) return;

    error = "";
    formattedCitations = [];
    isFormatting = true;

    try {
      const response = await aiService.formatCitations({
        citations,
        style: citationStyle,
      });

      formattedCitations = response.formattedCitations;
      dispatch("tokensUpdated");
    } catch (err: any) {
      if (err.message?.includes("402")) {
        error =
          "Insufficient tokens. You need at least 5 tokens to format citations.";
      } else if (err.message?.includes("429")) {
        error = "Rate limit exceeded. Please wait a moment and try again.";
      } else {
        error = err.message || "Failed to format citations. Please try again.";
      }
      console.error("Format error:", err);
    } finally {
      isFormatting = false;
    }
  }

  async function handleGenerateBibliography() {
    if (!canUseServices || !editor || citations.length === 0) return;

    error = "";
    bibliography = "";
    isGenerating = true;

    try {
      const response = await aiService.generateBibliography({
        citations,
        style: citationStyle,
      });

      bibliography = response.bibliography;
      dispatch("tokensUpdated");
    } catch (err: any) {
      if (err.message?.includes("402")) {
        error =
          "Insufficient tokens. You need at least 5 tokens to generate bibliography.";
      } else if (err.message?.includes("429")) {
        error = "Rate limit exceeded. Please wait a moment and try again.";
      } else {
        error = "Failed to generate bibliography. Please try again.";
      }
      console.error("Generate error:", err);
    } finally {
      isGenerating = false;
    }
  }

  function insertBibliography() {
    if (!editor || !bibliography) return;

    editor
      .chain()
      .focus()
      .insertContent("<h2>Bibliography</h2>" + bibliography)
      .run();
    bibliography = "";
  }
</script>

<div class="flex flex-col h-full p-4 space-y-4 scrollbar-thin">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold" style="color: var(--color-textPrimary);">
      Citation Manager
    </h3>
    {#if !canUseServices}
      <span
        class="text-xs px-2 py-1 rounded"
        style="background-color: rgba(239, 68, 68, 0.2); color: var(--color-error);"
      >
        Sign In Required
      </span>
    {/if}
  </div>

  <!-- Description -->
  <p class="text-sm" style="color: var(--color-textSecondary);">
    Extract citations from your essay and generate properly formatted
    bibliographies.
  </p>

  {#if !canUseServices}
    <div
      class="p-3 rounded-lg"
      style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);"
    >
      <p class="text-sm" style="color: var(--color-error);">
        Please sign in to use AI features.
      </p>
    </div>
  {/if}

  <!-- Citation Format Selector -->
  <div>
    <label
      class="block text-sm font-medium mb-2"
      style="color: var(--color-textSecondary);"
    >
      Citation Style
    </label>
    <div class="flex space-x-2">
      {#each formats as format}
        <button
          class="px-3 py-2 border rounded-lg text-sm font-medium transition-colors"
          class:selected={citationStyle === format}
          on:click={() => (citationStyle = format)}
          disabled={!canUseServices}
        >
          {format}
        </button>
      {/each}
    </div>
  </div>

  <!-- Error Display -->
  {#if error}
    <div
      class="p-3 rounded-lg"
      style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);"
    >
      <p class="text-sm" style="color: var(--color-error);">
        {error}
      </p>
    </div>
  {/if}

  <!-- Action Buttons -->
  <div class="space-y-2">
    <button
      on:click={handleExtract}
      disabled={!canUseServices || isExtracting}
      class="w-full px-4 py-3 rounded-lg font-medium transition-colors"
      class:opacity-50={!canUseServices || isExtracting}
      class:cursor-not-allowed={!canUseServices || isExtracting}
      style={canUseServices && !isExtracting
        ? "background-color: var(--color-accent); color: white;"
        : "background-color: var(--color-bgTertiary); color: var(--color-textTertiary);"}
    >
      {#if isExtracting}
        <span class="inline-flex items-center">
          <svg
            class="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Extracting...
        </span>
      {:else}
        📚 Extract Citations ({TOKEN_COST} tokens)
      {/if}
    </button>

    <button
      on:click={handleFormat}
      disabled={!canUseServices || citations.length === 0 || isFormatting}
      class="w-full px-4 py-2 rounded-lg font-medium transition-colors"
      class:opacity-50={!canUseServices ||
        citations.length === 0 ||
        isFormatting}
      class:cursor-not-allowed={!canUseServices ||
        citations.length === 0 ||
        isFormatting}
      style={canUseServices && citations.length > 0 && !isFormatting
        ? "background-color: var(--color-accent); color: white;"
        : "background-color: var(--color-bgTertiary); color: var(--color-textTertiary);"}
    >
      {#if isFormatting}
        Formatting...
      {:else}
        🎨 Format Citations ({TOKEN_COST} tokens)
      {/if}
    </button>

    <button
      on:click={handleGenerateBibliography}
      disabled={!canUseServices || citations.length === 0 || isGenerating}
      class="w-full px-4 py-2 rounded-lg font-medium transition-colors"
      class:opacity-50={!canUseServices ||
        citations.length === 0 ||
        isGenerating}
      class:cursor-not-allowed={!canUseServices ||
        citations.length === 0 ||
        isGenerating}
      style={canUseServices && citations.length > 0 && !isGenerating
        ? "background-color: var(--color-success); color: white;"
        : "background-color: var(--color-bgTertiary); color: var(--color-textTertiary);"}
    >
      {#if isGenerating}
        Generating...
      {:else}
        📖 Generate Bibliography ({TOKEN_COST} tokens)
      {/if}
    </button>
  </div>

  <!-- Results Display -->
  <div class="flex-1 overflow-auto space-y-3">
    <!-- Extracted Citations -->
    {#if citations.length > 0}
      <div
        class="rounded-lg p-4"
        style="border: 1px solid var(--color-border); background-color: var(--color-bgTertiary);"
      >
        <h4
          class="text-sm font-semibold mb-2"
          style="color: var(--color-textPrimary);"
        >
          Found {citations.length} Citation{citations.length === 1 ? "" : "s"}
        </h4>
        <ul
          class="space-y-2 text-xs"
          style="color: var(--color-textSecondary);"
        >
          {#each citations as citation}
            <li>• {citation.author || citation.source || "Unknown source"}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <!-- Formatted Citations -->
    {#if formattedCitations.length > 0}
      <div
        class="rounded-lg p-4"
        style="border: 1px solid var(--color-accent); background-color: var(--color-bgTertiary);"
      >
        <h4
          class="text-sm font-semibold mb-2"
          style="color: var(--color-accent);"
        >
          Formatted Citations
        </h4>
        <div class="space-y-2">
          {#each formattedCitations as formatted}
            <div
              class="text-sm p-2 rounded"
              style="background-color: var(--color-bgSecondary); color: var(--color-textSecondary);"
            >
              {formatted.citation}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Bibliography -->
    {#if bibliography}
      <div
        class="rounded-lg p-4"
        style="border: 1px solid var(--color-success); background-color: var(--color-bgTertiary);"
      >
        <h4
          class="text-sm font-semibold mb-2"
          style="color: var(--color-success);"
        >
          Bibliography
        </h4>
        <div
          class="prose prose-sm text-sm"
          style="color: var(--color-textSecondary);"
        >
          {@html bibliography}
        </div>
        <button
          on:click={insertBibliography}
          class="w-full px-3 py-2 rounded-lg text-sm font-medium mt-3"
          style="background-color: var(--color-success); color: white;"
        >
          📝 Insert into Editor
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  button.selected {
    background-color: var(--color-accentLight);
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  button:not(.selected):not(:disabled) {
    background-color: var(--color-bgSecondary);
    border-color: var(--color-border);
    color: var(--color-textSecondary);
  }

  button:not(.selected):not(:disabled):hover {
    border-color: var(--color-borderHover);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
