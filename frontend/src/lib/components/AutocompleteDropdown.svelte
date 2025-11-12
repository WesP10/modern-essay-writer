<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { AutocompleteSuggestion } from '$lib/utils/api';

	export let suggestions: AutocompleteSuggestion[] = [];
	export let selectedIndex = 0;
	export let position: { top: number; left: number } = { top: 0, left: 0 };

	const dispatch = createEventDispatcher<{
		select: AutocompleteSuggestion;
		close: void;
	}>();

	function handleSelect(suggestion: AutocompleteSuggestion) {
		dispatch('select', suggestion);
	}

	function handleMouseEnter(index: number) {
		selectedIndex = index;
	}

	// Expose selectedIndex for parent component
	export { selectedIndex };
</script>

{#if suggestions.length > 0}
	<div
		class="autocomplete-dropdown"
		style="top: {position.top}px; left: {position.left}px;"
	>
		{#each suggestions as suggestion, index}
			<button
				class="suggestion-item"
				class:selected={index === selectedIndex}
				on:click={() => handleSelect(suggestion)}
				on:mouseenter={() => handleMouseEnter(index)}
			>
				<span class="suggestion-text">
					{suggestion.text}
					{#if suggestion.source === 'llm'}
						<span class="llm-badge" title="AI-powered suggestion">🤖</span>
					{/if}
					{#if suggestion.type === 'phrase'}
						<span class="phrase-badge" title="Multi-word phrase">📝</span>
					{/if}
				</span>
				<span class="suggestion-meta">
					{#if suggestion.tier}
						<span class="suggestion-tier" title="Tier {suggestion.tier}">T{suggestion.tier}</span>
					{/if}
					<span class="suggestion-type">{suggestion.type}</span>
					<span class="suggestion-confidence">{Math.round(suggestion.confidence * 100)}%</span>
				</span>
			</button>
		{/each}
		<div class="suggestion-footer">
			<kbd>↑↓</kbd> Navigate
			<kbd>↵</kbd> Select
			<kbd>Esc</kbd> Close
		</div>
	</div>
{/if}

<style>
	.autocomplete-dropdown {
		position: fixed;
		z-index: 1000;
		min-width: 250px;
		max-width: 400px;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.05);
		overflow: hidden;
		animation: slideUp 0.15s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.suggestion-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 10px 14px;
		border: none;
		background: transparent;
		cursor: pointer;
		transition: background-color 0.1s ease;
		text-align: left;
		font-size: 14px;
		border-bottom: 1px solid #f7fafc;
	}

	.suggestion-item:last-of-type {
		border-bottom: none;
	}

	.suggestion-item:hover,
	.suggestion-item.selected {
		background-color: #edf2f7;
	}

	.suggestion-text {
		font-weight: 500;
		color: #2d3748;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.llm-badge,
	.phrase-badge {
		font-size: 12px;
		opacity: 0.8;
	}

	.suggestion-meta {
		display: flex;
		gap: 8px;
		align-items: center;
		font-size: 11px;
	}

	.suggestion-tier {
		padding: 2px 5px;
		background: #667eea;
		color: white;
		border-radius: 3px;
		font-weight: 700;
		font-size: 9px;
		letter-spacing: 0.5px;
	}

	.suggestion-type {
		padding: 2px 6px;
		background: #e2e8f0;
		border-radius: 4px;
		color: #4a5568;
		text-transform: uppercase;
		font-weight: 600;
		letter-spacing: 0.5px;
	}

	.suggestion-confidence {
		color: #718096;
		font-weight: 500;
	}

	.suggestion-footer {
		padding: 8px 14px;
		background: #f7fafc;
		border-top: 1px solid #e2e8f0;
		font-size: 11px;
		color: #718096;
		display: flex;
		gap: 12px;
		align-items: center;
	}

	kbd {
		padding: 2px 6px;
		background: white;
		border: 1px solid #cbd5e0;
		border-radius: 3px;
		font-family: monospace;
		font-size: 10px;
		font-weight: 600;
		color: #4a5568;
	}

	/* Dark mode support */
	:global(.dark) .autocomplete-dropdown {
		background: #2d3748;
		border-color: #4a5568;
	}

	:global(.dark) .suggestion-item {
		border-bottom-color: #4a5568;
	}

	:global(.dark) .suggestion-item:hover,
	:global(.dark) .suggestion-item.selected {
		background-color: #374151;
	}

	:global(.dark) .suggestion-text {
		color: #e2e8f0;
	}

	:global(.dark) .suggestion-type {
		background: #4a5568;
		color: #cbd5e0;
	}

	:global(.dark) .suggestion-confidence {
		color: #a0aec0;
	}

	:global(.dark) .suggestion-footer {
		background: #1a202c;
		border-top-color: #4a5568;
		color: #a0aec0;
	}

	:global(.dark) kbd {
		background: #374151;
		border-color: #4a5568;
		color: #cbd5e0;
	}
</style>
