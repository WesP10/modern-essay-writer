<script lang="ts">
  import type { Editor } from "@tiptap/core";
  import { createEventDispatcher } from "svelte";
  import { aiService } from "$lib/services/aiService";

  export let editor: Editor | null = null;
  export let sessionActive: boolean = false;
  export let canUseServices: boolean = false;

  const dispatch = createEventDispatcher();
  const TOKEN_COST = 5;

  let selectedText = "";
  let tone: "formal" | "casual" | "academic" = "academic";
  let isLoading = false;
  let originalText = "";
  let humanizedText = "";
  let improvement: any = null;
  let error = "";

  const tones = [
    { value: "academic", label: "Academic", icon: "🎓" },
    { value: "casual", label: "Casual", icon: "💬" },
    { value: "formal", label: "Formal", icon: "👔" },
  ];

  $: {
    if (editor) {
      const { from, to } = editor.state.selection;
      selectedText = editor.state.doc.textBetween(from, to, " ");
    }
  }

  async function handleRewrite() {
    if (!canUseServices || !editor || !selectedText.trim()) return;

    error = "";
    humanizedText = "";
    originalText = selectedText;
    isLoading = true;

    try {
      const response = await aiService.humanize({
        text: selectedText,
        tone,
        preserveMeaning: true,
      });

      humanizedText = response.humanizedText;
      improvement = response.improvementMetrics;
      dispatch("tokensUpdated");
    } catch (err: any) {
      if (err.message?.includes("402")) {
        error =
          "Insufficient tokens. You need at least 5 tokens to humanize text.";
      } else if (err.message?.includes("429")) {
        error = "Rate limit exceeded. Please wait a moment and try again.";
      } else {
        error = err.message || "Failed to humanize text. Please try again.";
      }
      console.error("Humanize error:", err);
    } finally {
      isLoading = false;
    }
  }

  function replaceInEditor() {
    if (!editor || !humanizedText) return;

    const { from, to } = editor.state.selection;
    editor
      .chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent(humanizedText)
      .run();

    // Clear results
    humanizedText = "";
    originalText = "";
    improvement = null;
  }
</script>

<div class="flex flex-col h-full p-4 space-y-4 scrollbar-thin">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold" style="color: var(--color-textPrimary);">
      Text Humanizer
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
    Transform AI-generated or robotic text into natural, human-like writing.
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

  <!-- Selection Indicator -->
  <div
    class="p-3 rounded-lg"
    style="background-color: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3);"
  >
    <div class="flex items-start space-x-2">
      <span class="text-lg">📝</span>
      <div class="flex-1">
        <p class="text-sm font-medium" style="color: var(--color-info);">
          {selectedText.trim()
            ? `${selectedText.trim().split(" ").length} words selected`
            : "Select text in the editor"}
        </p>
        <p class="text-xs mt-1" style="color: var(--color-textSecondary);">
          Highlight any paragraph or sentence to rewrite it
        </p>
      </div>
    </div>
  </div>

  <!-- Tone Selector -->
  <div>
    <label
      class="block text-sm font-medium mb-2"
      style="color: var(--color-textSecondary);"
    >
      Writing Tone
    </label>
    <div class="grid grid-cols-3 gap-2">
      {#each tones as t}
        <button
          class="px-3 py-2 border rounded-lg text-sm font-medium transition-colors"
          class:selected={tone === t.value}
          on:click={() => (tone = t.value)}
          disabled={!canUseServices}
        >
          <span class="mr-1">{t.icon}</span>
          {t.label}
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

  <!-- Rewrite Button -->
  <button
    on:click={handleRewrite}
    disabled={!canUseServices || isLoading || !selectedText.trim()}
    class="w-full px-4 py-3 rounded-lg font-medium transition-colors"
    class:opacity-50={!canUseServices || isLoading || !selectedText.trim()}
    class:cursor-not-allowed={!canUseServices ||
      isLoading ||
      !selectedText.trim()}
    style={canUseServices && !isLoading && selectedText.trim()
      ? "background-color: var(--color-accent); color: white;"
      : "background-color: var(--color-bgTertiary); color: var(--color-textTertiary);"}
  >
    {#if isLoading}
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
        Rewriting...
      </span>
    {:else}
      🎭 Rewrite Selection ({TOKEN_COST} tokens)
    {/if}
  </button>

  <!-- Before/After Preview -->
  {#if humanizedText}
    <div class="flex-1 space-y-3 overflow-auto">
      <!-- Before -->
      <div
        class="rounded-lg overflow-hidden"
        style="border: 1px solid var(--color-border);"
      >
        <div
          class="px-3 py-2"
          style="background-color: var(--color-bgTertiary); border-bottom: 1px solid var(--color-border);"
        >
          <span
            class="text-xs font-medium"
            style="color: var(--color-textSecondary);">BEFORE</span
          >
        </div>
        <div
          class="p-3 text-sm"
          style="background-color: var(--color-bgSecondary); color: var(--color-textSecondary);"
        >
          {originalText}
        </div>
      </div>

      <!-- After -->
      <div
        class="rounded-lg overflow-hidden"
        style="border: 1px solid var(--color-accent);"
      >
        <div
          class="px-3 py-2"
          style="background-color: var(--color-accentLight); border-bottom: 1px solid var(--color-accent);"
        >
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-medium"
              style="color: var(--color-accent);">AFTER</span
            >
            {#if improvement}
              <span class="text-xs" style="color: var(--color-accent);">
                ✨ Naturalness: {Math.round(improvement.naturalness || 0)}%
              </span>
            {/if}
          </div>
        </div>
        <div
          class="p-3 text-sm"
          style="background-color: var(--color-bgSecondary); color: var(--color-textPrimary);"
        >
          {humanizedText}
        </div>
      </div>

      <button
        on:click={replaceInEditor}
        class="w-full px-3 py-2 rounded-lg text-sm font-medium"
        style="background-color: var(--color-success); color: white;"
      >
        ✅ Replace Text in Editor
      </button>
    </div>
  {:else if !isLoading}
    <div
      class="rounded-lg p-4"
      style="border: 1px solid var(--color-border); background-color: var(--color-bgTertiary);"
    >
      <p class="text-xs text-center" style="color: var(--color-textTertiary);">
        Humanized text will appear here
      </p>
    </div>
  {/if}
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
