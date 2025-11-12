<script lang="ts">
	export let title = 'Untitled Essay';
	export let titleInputElement: HTMLInputElement | undefined = undefined;
	export let saveStatus: 'saved' | 'saving' | 'unsaved' = 'saved';
	export let onExport: () => void;
	export let onToggleSidebar: () => void;
	export let onToggleSettings: () => void;
	export let sidebarOpen = false;

	const statusTexts = {
		saved: '✓ Saved',
		saving: '⏳ Saving...',
		unsaved: '● Unsaved changes'
	};

	const statusColors = {
		saved: '#10b981',
		saving: '#f59e0b',
		unsaved: '#ef4444'
	};
</script>

<nav class="px-4 py-2.5" style="background-color: var(--color-bgSecondary); border-bottom: 1px solid var(--color-border);">
	<div class="flex items-center justify-between">
		<!-- Left: Logo and Title -->
		<div class="flex items-center space-x-3">
			<a href="/" class="flex items-center space-x-2 hover:opacity-80 transition-opacity">
				<span class="text-2xl">✍️</span>
				<span class="text-lg font-semibold" style="color: var(--color-textPrimary);">EssayForge</span>
			</a>
			<div class="h-6 w-px" style="background-color: var(--color-border);"></div>
			<input
				bind:this={titleInputElement}
				type="text"
				bind:value={title}
				class="bg-transparent border-none focus:outline-none text-base font-normal px-2 py-1 rounded transition-colors"
				style="color: var(--color-textSecondary);"
				placeholder="Untitled document"
				title="Document title (Ctrl+R to rename)"
			/>
		</div>

		<!-- Right: Actions -->
		<div class="flex items-center space-x-2">
			<!-- Save Status -->
			<div class="flex items-center space-x-2 px-3 py-1.5 text-sm" style="color: {statusColors[saveStatus]};">
				<span>{statusTexts[saveStatus]}</span>
			</div>
			
			<div class="h-6 w-px" style="background-color: var(--color-border);"></div>
			
			<!-- AI Tools Toggle -->
			<button
				on:click={onToggleSidebar}
				class="nav-btn"
				class:active={sidebarOpen}
				title="Toggle AI Tools (Ctrl+Enter)"
			>
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
					<path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"/>
				</svg>
				<span class="text-sm font-medium">AI Tools</span>
			</button>
			
			<!-- Settings Button -->
			<button
				on:click={onToggleSettings}
				class="nav-btn"
				title="Settings (Ctrl+,)"
			>
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
				</svg>
			</button>
			
			<!-- Export Button -->
			<button
				on:click={onExport}
				class="export-btn"
				title="Export document (Ctrl+E)"
			>
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
				</svg>
				<span class="text-sm font-medium">Export</span>
			</button>
		</div>
	</div>
</nav>

<style>
	.nav-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		transition: opacity 0.2s;
		color: var(--color-textSecondary);
	}

	.nav-btn:hover {
		opacity: 0.8;
		background-color: var(--color-bgTertiary);
	}

	.nav-btn.active {
		background-color: var(--color-accentLight);
		color: var(--color-accent);
	}

	.export-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		transition: opacity 0.2s;
		font-weight: 500;
		color: white;
		background-color: var(--color-accent);
	}
	
	.export-btn:hover {
		background-color: var(--color-accentHover);
	}
</style>
