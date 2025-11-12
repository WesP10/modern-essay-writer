<script lang="ts">
	export let activeTab: 'prompt' | 'humanizer' | 'detector' | 'citations' = 'prompt';
	export let onTabChange: (tab: typeof activeTab) => void;
	
	const tabs = [
		{ id: 'prompt' as const, label: 'Prompt', icon: '✨', description: 'AI Outline Generator' },
		{ id: 'humanizer' as const, label: 'Humanizer', icon: '🎭', description: 'Rewrite Text' },
		{ id: 'detector' as const, label: 'Detector', icon: '🔍', description: 'AI Detection' },
		{ id: 'citations' as const, label: 'Citations', icon: '📚', description: 'Reference Tools' }
	];
</script>

<div class="flex flex-col h-full">
	<!-- Tab Bar -->
	<div class="flex overflow-x-auto scrollbar-thin" style="border-bottom: 1px solid var(--color-border); background-color: var(--color-bgTertiary);">
		{#each tabs as tab}
			<button
				class="flex-shrink-0 px-4 py-3 text-sm font-medium transition-all relative tab-button"
				class:active={activeTab === tab.id}
				on:click={() => onTabChange(tab.id)}
				title={tab.description}
			>
				<div class="flex items-center justify-center space-x-2">
					<span class="text-lg">{tab.icon}</span>
					<span class="whitespace-nowrap">{tab.label}</span>
				</div>
				{#if activeTab === tab.id}
					<div class="absolute bottom-0 left-0 right-0 h-0.5" style="background-color: var(--color-accent);" />
				{/if}
			</button>
		{/each}
	</div>
	
	<!-- Tab Content -->
	<div class="flex-1 overflow-auto scrollbar-thin">
		<slot />
	</div>
</div>

<style>
	.tab-button {
		color: var(--color-textSecondary);
	}
	
	.tab-button:hover {
		color: var(--color-textPrimary);
		background-color: var(--color-bgSecondary);
	}
	
	.tab-button.active {
		color: var(--color-accent);
		background-color: var(--color-bgSecondary);
	}
</style>
