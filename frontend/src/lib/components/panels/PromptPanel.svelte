<script lang="ts">
  import type { Editor } from "@tiptap/core";
  import { createEventDispatcher } from "svelte";
  import { aiService } from "$lib/services/aiService";

  export let editor: Editor | null = null;
  export let sessionActive: boolean = false;
  export let canUseServices: boolean = false;

  const dispatch = createEventDispatcher();
  const TOKEN_COST = 10;

  let promptInput = "";
  let essayType:
    | "academic"
    | "argumentative"
    | "narrative"
    | "expository"
    | "persuasive" = "argumentative";
  let tone: "formal" | "casual" | "academic" | "persuasive" = "academic";
  let length: "short" | "medium" | "long" = "medium";
  let isLoading = false;
  let generatedText = "";
  let error = "";

  const essayTypes = [
    { value: "argumentative", label: "Argumentative" },
    { value: "academic", label: "Research Paper" },
    { value: "analytical", label: "Analytical" },
    { value: "narrative", label: "Creative Writing" },
    { value: "expository", label: "Expository" },
  ];

  async function handleGenerate() {
    if (!canUseServices || !editor) return;

    error = "";
    generatedText = "";
    isLoading = true;

    try {
      const essayHtml = editor.getHTML();

      const response = await aiService.generate({
        prompt: promptInput,
        essayHtml,
        generationType: "outline",
        tone,
        length,
        essayType,
        temperature: 0.7,
      });

      generatedText = response.content;
      dispatch("tokensUpdated");
    } catch (err: any) {
      if (err.message?.includes("402")) {
        error =
          "Insufficient tokens. You need at least 10 tokens to generate an outline.";
      } else if (err.message?.includes("429")) {
        error = "Rate limit exceeded. Please wait a moment and try again.";
      } else {
        error = err.message || "Failed to generate outline. Please try again.";
      }
      console.error("Generate error:", err);
    } finally {
      isLoading = false;
    }
  }

  function insertIntoEditor() {
    if (!editor || !generatedText) return;

    editor.chain().focus().insertContent(generatedText).run();
    generatedText = "";
    promptInput = "";
  }
</script>

<div class="flex flex-col h-full p-4 space-y-4 scrollbar-thin">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold" style="color: var(--color-textPrimary);">
      AI Outline Generator
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
    Generate structured outlines and thesis statements based on your topic.
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

  <!-- Essay Type & Tone Selectors -->
  <div class="grid grid-cols-2 gap-3">
    <div>
      <label
        class="block text-sm font-medium mb-2"
        style="color: var(--color-textSecondary);"
      >
        Essay Type
      </label>
      <select
        bind:value={essayType}
        class="w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent"
        style="border: 1px solid var(--color-border); background-color: var(--color-bgTertiary); color: var(--color-textPrimary);"
        disabled={!canUseServices}
      >
        {#each essayTypes as type}
          <option value={type.value}>{type.label}</option>
        {/each}
      </select>
    </div>
    <div>
      <label
        class="block text-sm font-medium mb-2"
        style="color: var(--color-textSecondary);"
      >
        Tone
      </label>
      <select
        bind:value={tone}
        class="w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent"
        style="border: 1px solid var(--color-border); background-color: var(--color-bgTertiary); color: var(--color-textPrimary);"
        disabled={!canUseServices}
      >
        <option value="academic">Academic</option>
        <option value="formal">Formal</option>
        <option value="persuasive">Persuasive</option>
        <option value="casual">Casual</option>
      </select>
    </div>
  </div>

  <!-- Length Selector -->
  <div>
    <label
      class="block text-sm font-medium mb-2"
      style="color: var(--color-textSecondary);"
    >
      Length
    </label>
    <div class="flex space-x-2">
      {#each ["short", "medium", "long"] as len}
        <button
          class="flex-1 px-3 py-2 border rounded-lg text-sm font-medium transition-colors"
          class:selected={length === len}
          style={length === len
            ? "background-color: var(--color-accent); color: white; border-color: var(--color-accent);"
            : "border-color: var(--color-border); color: var(--color-textSecondary);"}
          on:click={() => (length = len as "short" | "medium" | "long")}
          disabled={!canUseServices}
        >
          {len.charAt(0).toUpperCase() + len.slice(1)}
        </button>
      {/each}
    </div>
  </div>

  <!-- Prompt Input -->
  <div class="flex-1">
    <label
      class="block text-sm font-medium mb-2"
      style="color: var(--color-textSecondary);"
    >
      Your Topic or Research Question
    </label>
    <textarea
      bind:value={promptInput}
      placeholder="Example: Discuss the impact of social media on political polarization..."
      class="w-full h-32 px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent resize-none"
      style="border: 1px solid var(--color-border); background-color: var(--color-bgTertiary); color: var(--color-textPrimary);"
      disabled={!canUseServices}
    ></textarea>
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

  <!-- Generate Button -->
  <button
    on:click={handleGenerate}
    disabled={!canUseServices || isLoading || !promptInput.trim()}
    class="w-full px-4 py-3 rounded-lg font-medium transition-colors"
    class:opacity-50={!canUseServices || isLoading || !promptInput.trim()}
    class:cursor-not-allowed={!canUseServices ||
      isLoading ||
      !promptInput.trim()}
    style={canUseServices && !isLoading && promptInput.trim()
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
        Generating...
      </span>
    {:else}
      ✨ Generate Outline ({TOKEN_COST} tokens)
    {/if}
  </button>

  <!-- Result Preview -->
  {#if generatedText}
    <div
      class="rounded-lg p-4 space-y-3"
      style="border: 1px solid var(--color-border); background-color: var(--color-bgTertiary);"
    >
      <div class="flex items-center justify-between">
        <h4
          class="text-sm font-semibold"
          style="color: var(--color-textPrimary);"
        >
          Generated Outline
        </h4>
      </div>
      <div
        class="prose prose-sm max-w-none"
        style="color: var(--color-textSecondary);"
      >
        {@html generatedText.replace(/\n/g, "<br>")}
      </div>
      <button
        on:click={insertIntoEditor}
        class="w-full px-3 py-2 rounded-lg text-sm font-medium"
        style="background-color: var(--color-success); color: white;"
      >
        📝 Insert into Editor
      </button>
    </div>
  {:else if !isLoading}
    <div
      class="rounded-lg p-4"
      style="border: 1px solid var(--color-border); background-color: var(--color-bgTertiary);"
    >
      <p class="text-xs text-center" style="color: var(--color-textTertiary);">
        AI-generated outline will appear here
      </p>
    </div>
  {/if}
</div>
