<script lang="ts">
	let isScanning = false;
	let score = 0;
	let flaggedSections: any[] = [];
	
	function handleScan() {
		isScanning = true;
		setTimeout(() => {
			isScanning = false;
			alert('🚧 Coming Soon! AI detection will be available in Phase 4.');
		}, 500);
	}
</script>

<div class="flex flex-col h-full p-4 space-y-4 scrollbar-thin">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-semibold" style="color: var(--color-textPrimary);">
			AI Detector
		</h3>
		<span class="text-xs px-2 py-1 rounded" style="background-color: rgba(251, 191, 36, 0.2); color: var(--color-warning);">
			Coming Soon
		</span>
	</div>
	
	<!-- Description -->
	<p class="text-sm" style="color: var(--color-textSecondary);">
		Analyze your essay for AI-generated content patterns and get suggestions for improvement.
	</p>
	
	<!-- Scan Button -->
	<button
		on:click={handleScan}
		disabled
		class="w-full px-4 py-3 rounded-lg font-medium cursor-not-allowed opacity-50"
		style="background-color: var(--color-bgTertiary); color: var(--color-textTertiary);"
	>
		{#if isScanning}
			<span class="inline-flex items-center">
				<svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				Scanning...
			</span>
		{:else}
			🔍 Scan Essay
		{/if}
	</button>
	
	<!-- Score Gauge -->
	<div class="rounded-lg p-6" style="border: 1px solid var(--color-border); background-color: var(--color-bgSecondary);">
		<div class="text-center mb-4">
			<div class="text-sm font-medium mb-2" style="color: var(--color-textSecondary);">
				AI Detection Score
			</div>
			<div class="relative inline-flex items-center justify-center w-32 h-32">
				<!-- Circular gauge background -->
				<svg class="transform -rotate-90 w-32 h-32">
					<circle
						cx="64"
						cy="64"
						r="56"
						stroke="currentColor"
						stroke-width="8"
						fill="none"
						style="color: var(--color-border);"
					/>
					<circle
						cx="64"
						cy="64"
						r="56"
						stroke="currentColor"
						stroke-width="8"
						fill="none"
						style="color: var(--color-borderHover);"
						stroke-dasharray="351.858"
						stroke-dashoffset="351.858"
					/>
				</svg>
				<div class="absolute text-center">
					<div class="text-3xl font-bold" style="color: var(--color-textTertiary);">
						{score}%
					</div>
				</div>
			</div>
		</div>
		
		<div class="text-xs text-center" style="color: var(--color-textTertiary);">
			0% = Human-written<br/>
			100% = AI-generated
		</div>
	</div>
	
	<!-- Flagged Sections -->
	<div class="flex-1 overflow-auto">
		<div class="text-sm font-medium mb-2" style="color: var(--color-textPrimary);">
			Flagged Sections
		</div>
		
		<div class="space-y-2">
			{#each [1, 2, 3] as item}
				<div class="rounded-lg p-3" style="border: 1px solid var(--color-border); background-color: var(--color-bgTertiary);">
					<div class="h-3 rounded animate-pulse w-full mb-2" style="background-color: var(--color-border);"></div>
					<div class="h-2 rounded animate-pulse w-3/4" style="background-color: var(--color-border);"></div>
				</div>
			{/each}
		</div>
		
		<p class="text-xs mt-4 text-center" style="color: var(--color-textTertiary);">
			Detected sections will appear here
		</p>
	</div>
	
	<!-- Info Box -->
	<div class="p-3 rounded-lg" style="background-color: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3);">
		<div class="flex items-start space-x-2">
			<span class="text-sm">💡</span>
			<p class="text-xs" style="color: var(--color-info);">
				This tool helps identify patterns that may indicate AI-generated content. It's designed to help improve your writing, not as a definitive test.
			</p>
		</div>
	</div>
</div>
