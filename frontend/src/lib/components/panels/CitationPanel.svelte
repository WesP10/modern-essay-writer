<script lang="ts">
	let searchQuery = '';
	let citationFormat = 'APA';
	let isSearching = false;
	
	const formats = ['APA', 'MLA', 'Chicago', 'Harvard'];
	
	function handleSearch() {
		isSearching = true;
		setTimeout(() => {
			isSearching = false;
			alert('🚧 Coming Soon! Citation search will be available in Phase 4.');
		}, 500);
	}
</script>

<div class="flex flex-col h-full p-4 space-y-4 scrollbar-thin">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-semibold" style="color: var(--color-textPrimary);">
			Citation Manager
		</h3>
		<span class="text-xs px-2 py-1 rounded" style="background-color: rgba(251, 191, 36, 0.2); color: var(--color-warning);">
			Coming Soon
		</span>
	</div>
	
	<!-- Description -->
	<p class="text-sm" style="color: var(--color-textSecondary);">
		Search for academic sources and automatically generate formatted citations.
	</p>
	
	<!-- Citation Format Selector -->
	<div>
		<label class="block text-sm font-medium mb-2" style="color: var(--color-textSecondary);">
			Citation Format
		</label>
		<div class="flex space-x-2">
			{#each formats as format}
				<button
					class="px-3 py-2 border rounded-lg text-sm font-medium transition-colors"
					class:selected={citationFormat === format}
					on:click={() => citationFormat = format}
					disabled
				>
					{format}
				</button>
			{/each}
		</div>
	</div>
	
	<!-- Search Input -->
	<div>
		<label class="block text-sm font-medium mb-2" style="color: var(--color-textSecondary);">
			Search Sources
		</label>
		<div class="flex space-x-2">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Title, author, DOI, or keyword..."
				class="flex-1 px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent"
				style="border: 1px solid var(--color-border); background-color: var(--color-bgTertiary); color: var(--color-textPrimary);"
				disabled
			/>
			<button
				on:click={handleSearch}
				disabled
				class="px-4 py-2 rounded-lg font-medium cursor-not-allowed"
				style="background-color: var(--color-bgTertiary); color: var(--color-textTertiary);"
			>
				🔍
			</button>
		</div>
	</div>
	
	<!-- Results List -->
	<div class="flex-1 overflow-auto">
		<div class="text-sm font-medium mb-2" style="color: var(--color-textPrimary);">
			Search Results
		</div>
		
		<div class="space-y-3">
			{#each [1, 2, 3] as item}
				<div class="rounded-lg p-3" style="border: 1px solid var(--color-border); background-color: var(--color-bgSecondary);">
					<!-- Title -->
					<div class="h-4 rounded animate-pulse w-full mb-2" style="background-color: var(--color-border);"></div>
					
					<!-- Authors -->
					<div class="h-3 rounded animate-pulse w-2/3 mb-2" style="background-color: var(--color-border);"></div>
					
					<!-- Citation -->
					<div class="mt-3 p-2 rounded" style="background-color: var(--color-bgTertiary);">
						<div class="h-2 rounded animate-pulse w-full mb-1" style="background-color: var(--color-border);"></div>
						<div class="h-2 rounded animate-pulse w-5/6" style="background-color: var(--color-border);"></div>
					</div>
					
					<!-- Actions -->
					<div class="flex space-x-2 mt-2">
						<button
							disabled
							class="text-xs px-2 py-1 rounded cursor-not-allowed"
							style="background-color: var(--color-bgTertiary); color: var(--color-textTertiary);"
						>
							Copy
						</button>
						<button
							disabled
							class="text-xs px-2 py-1 rounded cursor-not-allowed"
							style="background-color: var(--color-bgTertiary); color: var(--color-textTertiary);"
						>
							Insert
						</button>
					</div>
				</div>
			{/each}
		</div>
		
		<p class="text-xs mt-4 text-center" style="color: var(--color-textTertiary);">
			Search results will appear here
		</p>
	</div>
	
	<!-- Supported Sources -->
	<div class="p-3 rounded-lg" style="background-color: var(--color-bgTertiary); border: 1px solid var(--color-border);">
		<div class="text-xs font-medium mb-2" style="color: var(--color-textPrimary);">
			Supported Sources
		</div>
		<div class="flex flex-wrap gap-2">
			{#each ['CrossRef', 'Google Scholar', 'PubMed', 'arXiv'] as source}
				<span class="text-xs px-2 py-1 rounded" style="background-color: var(--color-bgSecondary); border: 1px solid var(--color-border); color: var(--color-textSecondary);">
					{source}
				</span>
			{/each}
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
