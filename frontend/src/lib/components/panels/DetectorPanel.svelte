<script lang="ts">
  import type { Editor } from "@tiptap/core";
  import { createEventDispatcher } from "svelte";
  import { aiService } from "$lib/services/aiService";
  import DetectorResults from "$lib/components/ai/DetectorResults.svelte";
  import type { DetectionResult } from "$lib/types/ai";

  export let editor: Editor | null = null;
  export let sessionActive: boolean = false;
  export let canUseServices: boolean = false;

  const dispatch = createEventDispatcher();
  const TOKEN_COST = 3;

  let isScanning = false;
  let result: DetectionResult | null = null;
  let error = "";

  async function handleScan() {
    if (!canUseServices || !editor) return;

    error = "";
    result = null;
    isScanning = true;

    try {
      const essayHtml = editor.getHTML();
      const text = editor.getText();

      result = await aiService.detect({
        text,
        essayHtml,
      });

      dispatch("tokensUpdated");
    } catch (err: any) {
      if (err.message?.includes("402")) {
        error =
          "Insufficient tokens. You need at least 3 tokens to scan for AI.";
      } else if (err.message?.includes("429")) {
        error = "Rate limit exceeded. Please wait a moment and try again.";
      } else {
        error = err.message || "Failed to scan essay. Please try again.";
      }
      console.error("Detect error:", err);
    } finally {
      isScanning = false;
    }
  }
</script>

<div class="flex flex-col h-full p-4 space-y-4 scrollbar-thin">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold" style="color: var(--color-textPrimary);">
      AI Detector
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
    Analyze your essay for AI-generated content patterns and get suggestions for
    improvement.
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

  <!-- Scan Button -->
  <button
    on:click={handleScan}
    disabled={!canUseServices || isScanning}
    class="w-full px-4 py-3 rounded-lg font-medium transition-colors"
    class:opacity-50={!canUseServices || isScanning}
    class:cursor-not-allowed={!canUseServices || isScanning}
    style={canUseServices && !isScanning
      ? "background-color: var(--color-accent); color: white;"
      : "background-color: var(--color-bgTertiary); color: var(--color-textTertiary);"}
  >
    {#if isScanning}
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
        Scanning...
      </span>
    {:else}
      🔍 Scan Essay ({TOKEN_COST} tokens)
    {/if}
  </button>

  <!-- Results Display -->
  <DetectorResults {result} loading={isScanning} />

  <!-- Info Box -->
  <div
    class="p-3 rounded-lg mt-4"
    style="background-color: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3);"
  >
    <div class="flex items-start space-x-2">
      <span class="text-sm">💡</span>
      <p class="text-xs" style="color: var(--color-info);">
        This tool helps identify patterns that may indicate AI-generated
        content. It's designed to help improve your writing, not as a definitive
        test.
      </p>
    </div>
  </div>
</div>
