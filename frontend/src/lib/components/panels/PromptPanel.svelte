<script lang="ts">
	let promptInput = '';
	let essayType = 'argumentative';
	let isLoading = false;
	
	const essayTypes = [
		{ value: 'argumentative', label: 'Argumentative' },
		{ value: 'research', label: 'Research Paper' },
		{ value: 'analytical', label: 'Analytical' },
		{ value: 'creative', label: 'Creative Writing' },
		{ value: 'expository', label: 'Expository' }
	];
	
	function handleGenerate() {
		// Placeholder for Phase 4
		isLoading = true;
		setTimeout(() => {
			isLoading = false;
			alert('🚧 Coming Soon! This feature will be powered by local AI in Phase 4.');
		}, 500);
	}
</script>

<div class="flex flex-col h-full p-4 space-y-4 scrollbar-thin">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-semibold" style="color: var(--color-textPrimary);">
			AI Outline Generator
		</h3>
		<span class="text-xs px-2 py-1 rounded" style="background-color: rgba(251, 191, 36, 0.2); color: var(--color-warning);">
			Coming Soon
		</span>
	</div>
	
	<!-- Description -->
	<p class="text-sm" style="color: var(--color-textSecondary);">
		Generate structured outlines and thesis statements based on your topic.
	</p>
	
	<!-- Essay Type Selector -->
	<div>
		<label class="block text-sm font-medium mb-2" style="color: var(--color-textSecondary);">
			Essay Type
		</label>
		<select 
			bind:value={essayType}
			class="w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent"
			style="border: 1px solid var(--color-border); background-color: var(--color-bgTertiary); color: var(--color-textPrimary);"
			disabled
		>
			{#each essayTypes as type}
				<option value={type.value}>{type.label}</option>
			{/each}
		</select>
	</div>
	
	<!-- Prompt Input -->
	<div class="flex-1">
		<label class="block text-sm font-medium mb-2" style="color: var(--color-textSecondary);">
			Your Topic or Research Question
		</label>
		<textarea
			bind:value={promptInput}
			placeholder="Example: Discuss the impact of social media on political polarization..."
			class="w-full h-32 px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent resize-none"
			style="border: 1px solid var(--color-border); background-color: var(--color-bgTertiary); color: var(--color-textPrimary);"
			disabled
		/>
	</div>
	
	<!-- Generate Button -->
	<button
		on:click={handleGenerate}
		disabled
		class="w-full px-4 py-3 rounded-lg font-medium cursor-not-allowed opacity-50"
		style="background-color: var(--color-bgTertiary); color: var(--color-textTertiary);"
	>
		{#if isLoading}
			<span class="inline-flex items-center">
				<svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				Generating...
			</span>
		{:else}
			✨ Generate Outline
		{/if}
	</button>
	
	<!-- Skeleton Preview -->
	<div class="rounded-lg p-4" style="border: 1px solid var(--color-border); background-color: var(--color-bgTertiary);">
		<div class="space-y-3">
			<div class="h-4 rounded animate-pulse w-3/4" style="background-color: var(--color-border);"></div>
			<div class="h-3 rounded animate-pulse w-full" style="background-color: var(--color-border);"></div>
			<div class="h-3 rounded animate-pulse w-5/6" style="background-color: var(--color-border);"></div>
			<div class="h-3 rounded animate-pulse w-4/5" style="background-color: var(--color-border);"></div>
		</div>
		<p class="text-xs mt-4 text-center" style="color: var(--color-textTertiary);">
			AI-generated outline will appear here
		</p>
	</div>
</div>
