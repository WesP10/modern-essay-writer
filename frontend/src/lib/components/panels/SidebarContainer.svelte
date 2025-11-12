<script lang="ts">
	import PanelTabs from './PanelTabs.svelte';
	import PromptPanel from './PromptPanel.svelte';
	import HumanizerPanel from './HumanizerPanel.svelte';
	import DetectorPanel from './DetectorPanel.svelte';
	import CitationPanel from './CitationPanel.svelte';
	
	export let onClose: () => void;
	
	let activeTab: 'prompt' | 'humanizer' | 'detector' | 'citations' = 'prompt';
	
	function handleTabChange(tab: typeof activeTab) {
		activeTab = tab;
	}
</script>

<div class="flex flex-col h-full">
	<!-- Header with close button -->
	<div class="flex items-center justify-between px-4 py-2" style="border-bottom: 1px solid var(--color-border); background-color: var(--color-bgSecondary);">
		<h2 class="text-sm font-semibold" style="color: var(--color-textSecondary);">
			AI Tools
		</h2>
		<button
			on:click={onClose}
			class="text-xl hover:opacity-70 transition-opacity"
			style="color: var(--color-textTertiary);"
			title="Close sidebar"
		>
			×
		</button>
	</div>
	
	<!-- Tabs and content -->
	<PanelTabs {activeTab} onTabChange={handleTabChange}>
		{#if activeTab === 'prompt'}
			<PromptPanel />
		{:else if activeTab === 'humanizer'}
			<HumanizerPanel />
		{:else if activeTab === 'detector'}
			<DetectorPanel />
		{:else if activeTab === 'citations'}
			<CitationPanel />
		{/if}
	</PanelTabs>
</div>
