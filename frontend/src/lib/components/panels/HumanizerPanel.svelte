<script lang="ts">
	let selectedText = '';
	let tone = 'academic';
	let isLoading = false;
	
	const tones = [
		{ value: 'academic', label: 'Academic', icon: '🎓' },
		{ value: 'casual', label: 'Casual', icon: '💬' },
		{ value: 'formal', label: 'Formal', icon: '👔' },
		{ value: 'creative', label: 'Creative', icon: '🎨' }
	];
	
	function handleRewrite() {
		isLoading = true;
		setTimeout(() => {
			isLoading = false;
			alert('🚧 Coming Soon! This feature will use local AI to rewrite your text in Phase 4.');
		}, 500);
	}
</script>

<div class="flex flex-col h-full p-4 space-y-4 scrollbar-thin">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-semibold" style="color: var(--color-textPrimary);">
			Text Humanizer
		</h3>
		<span class="text-xs px-2 py-1 rounded" style="background-color: rgba(251, 191, 36, 0.2); color: var(--color-warning);">
			Coming Soon
		</span>
	</div>
	
	<!-- Description -->
	<p class="text-sm" style="color: var(--color-textSecondary);">
		Transform AI-generated or robotic text into natural, human-like writing.
	</p>
	
	<!-- Selection Indicator -->
	<div class="p-3 rounded-lg" style="background-color: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3);">
		<div class="flex items-start space-x-2">
			<span class="text-lg">📝</span>
			<div class="flex-1">
				<p class="text-sm font-medium" style="color: var(--color-info);">
					Select text in the editor
				</p>
				<p class="text-xs mt-1" style="color: var(--color-textSecondary);">
					Highlight any paragraph or sentence to rewrite it
				</p>
			</div>
		</div>
	</div>
	
	<!-- Tone Selector -->
	<div>
		<label class="block text-sm font-medium mb-2" style="color: var(--color-textSecondary);">
			Writing Tone
		</label>
		<div class="grid grid-cols-2 gap-2">
			{#each tones as t}
				<button
					class="px-3 py-2 border rounded-lg text-sm font-medium transition-colors"
					class:selected={tone === t.value}
					on:click={() => tone = t.value}
					disabled
				>
					<span class="mr-1">{t.icon}</span>
					{t.label}
				</button>
			{/each}
		</div>
	</div>
	
	<!-- Rewrite Button -->
	<button
		on:click={handleRewrite}
		disabled
		class="w-full px-4 py-3 rounded-lg font-medium cursor-not-allowed opacity-50"
		style="background-color: var(--color-bgTertiary); color: var(--color-textTertiary);"
	>
		🎭 Rewrite Selection
	</button>
	
	<!-- Before/After Preview -->
	<div class="flex-1 space-y-3">
		<!-- Before -->
		<div class="rounded-lg overflow-hidden" style="border: 1px solid var(--color-border);">
			<div class="px-3 py-2" style="background-color: var(--color-bgTertiary); border-bottom: 1px solid var(--color-border);">
				<span class="text-xs font-medium" style="color: var(--color-textSecondary);">BEFORE</span>
			</div>
			<div class="p-3 h-24" style="background-color: var(--color-bgSecondary);">
				<div class="h-3 rounded animate-pulse w-full mb-2" style="background-color: var(--color-border);"></div>
				<div class="h-3 rounded animate-pulse w-5/6" style="background-color: var(--color-border);"></div>
			</div>
		</div>
		
		<!-- After -->
		<div class="rounded-lg overflow-hidden" style="border: 1px solid var(--color-accent);">
			<div class="px-3 py-2" style="background-color: var(--color-accentLight); border-bottom: 1px solid var(--color-accent);">
				<span class="text-xs font-medium" style="color: var(--color-accent);">AFTER</span>
			</div>
			<div class="p-3 h-24" style="background-color: var(--color-bgSecondary);">
				<div class="h-3 rounded animate-pulse w-full mb-2" style="background-color: var(--color-border);"></div>
				<div class="h-3 rounded animate-pulse w-4/5" style="background-color: var(--color-border);"></div>
			</div>
		</div>
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
