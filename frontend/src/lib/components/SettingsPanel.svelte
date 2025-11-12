<script lang="ts">
	import { onMount } from 'svelte';
	import { COLOR_PALETTES, applyColorPalette, getCurrentPalette, type ColorPalette } from '$lib/utils/themes';
	
	export let onClose: () => void;
	
	// Settings state
	let selectedPalette: string = 'ocean-breeze';
	let panelsEnabled = {
		prompt: true,
		humanizer: true,
		detector: true,
		citations: true
	};
	let autoSaveInterval = 2;
	let spellCheck = true;
	
	onMount(() => {
		loadSettings();
	});
	
	function loadSettings() {
		const saved = localStorage.getItem('essayforge-settings');
		if (saved) {
			const settings = JSON.parse(saved);
			panelsEnabled = settings.panelsEnabled || panelsEnabled;
			autoSaveInterval = settings.autoSaveInterval || 2;
			spellCheck = settings.spellCheck ?? true;
		}
		
		// Load current palette
		const currentPalette = getCurrentPalette();
		selectedPalette = currentPalette.id;
	}
	
	function saveSettings() {
		const settings = {
			panelsEnabled,
			autoSaveInterval,
			spellCheck
		};
		localStorage.setItem('essayforge-settings', JSON.stringify(settings));
		
		// Apply selected palette
		const palette = COLOR_PALETTES.find(p => p.id === selectedPalette);
		if (palette) {
			applyColorPalette(palette);
		}
		
		alert('✅ Settings saved!');
	}
	
	function resetSettings() {
		if (confirm('Reset all settings to defaults?')) {
			localStorage.removeItem('essayforge-settings');
			localStorage.removeItem('essayforge-color-palette');
			loadSettings();
			// Reset to default palette
			const defaultPalette = COLOR_PALETTES[0];
			selectedPalette = defaultPalette.id;
			applyColorPalette(defaultPalette);
			alert('🔄 Settings reset to defaults');
		}
	}
	
	function previewPalette(palette: ColorPalette) {
		// Live preview without saving
		applyColorPalette(palette);
		selectedPalette = palette.id;
	}
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click={onClose}>
	<div 
		class="rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col scrollbar-thin"
		style="background-color: var(--color-bgSecondary);"
		on:click|stopPropagation
		role="dialog"
		aria-modal="true"
	>
		<!-- Header -->
		<div class="flex items-center justify-between p-6" style="border-bottom: 1px solid var(--color-border);">
			<h2 class="text-2xl font-bold" style="color: var(--color-textPrimary);">
				⚙️ Settings
			</h2>
			<button
				on:click={onClose}
				class="text-2xl leading-none hover:opacity-70 transition-opacity"
				style="color: var(--color-textTertiary);"
				aria-label="Close settings"
			>
				×
			</button>
		</div>
		
		<!-- Content -->
		<div class="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
			<!-- Color Palettes -->
			<section>
				<h3 class="text-lg font-semibold mb-2" style="color: var(--color-textPrimary);">
					🎨 Color Palette
				</h3>
				<p class="text-sm mb-4" style="color: var(--color-textSecondary);">
					Choose a color scheme for your entire writing experience
				</p>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					{#each COLOR_PALETTES as palette}
						<button
							class="text-left p-3 rounded-lg border-2 transition-all hover:shadow-md"
							class:ring-2={selectedPalette === palette.id}
							style="
								background-color: {palette.colors.bgSecondary};
								border-color: {selectedPalette === palette.id ? palette.colors.accent : palette.colors.border};
								{selectedPalette === palette.id ? `box-shadow: 0 0 0 3px ${palette.colors.accentLight};` : ''}
							"
							on:click={() => previewPalette(palette)}
						>
							<div class="flex items-start justify-between mb-2">
								<div class="flex-1">
									<h4 class="font-semibold text-base mb-1" style="color: {palette.colors.textPrimary};">
										{palette.name}
									</h4>
									<p class="text-xs" style="color: {palette.colors.textSecondary};">
										{palette.description}
									</p>
								</div>
								{#if selectedPalette === palette.id}
									<span class="ml-2 text-lg">✓</span>
								{/if}
							</div>
							
							<!-- Color Preview Swatches -->
							<div class="flex gap-1.5 mt-2">
								<div 
									class="w-10 h-10 rounded border"
									style="background-color: {palette.colors.bgPrimary}; border-color: {palette.colors.border};"
									title="Background"
								></div>
								<div 
									class="w-10 h-10 rounded border"
									style="background-color: {palette.colors.editorBg}; border-color: {palette.colors.border};"
									title="Editor Background"
								></div>
								<div 
									class="w-10 h-10 rounded border flex items-center justify-center"
									style="background-color: {palette.colors.accent}; border-color: {palette.colors.border};"
									title="Accent Color"
								>
									<span style="color: {palette.colors.bgSecondary}; font-weight: bold; font-size: 0.75rem;">Aa</span>
								</div>
								<div 
									class="w-10 h-10 rounded border flex items-center justify-center text-xs font-medium"
									style="background-color: {palette.colors.editorBg}; color: {palette.colors.textPrimary}; border-color: {palette.colors.border};"
									title="Text Color"
								>
									<span style="font-size: 0.65rem;">Text</span>
								</div>
							</div>
						</button>
					{/each}
				</div>
				
				<div class="mt-4 p-3 rounded-lg" style="background-color: var(--color-accentLight); border: 1px solid var(--color-border);">
					<p class="text-xs" style="color: var(--color-textSecondary);">
						💡 <strong>Tip:</strong> Click any palette to preview it immediately. Changes are applied throughout the entire app.
					</p>
				</div>
			</section>
			
			<!-- Editor -->
			<section>
				<h3 class="text-lg font-semibold mb-4" style="color: var(--color-textPrimary);">
					📝 Editor
				</h3>
				
				<!-- Auto-save -->
				<div class="mb-4">
					<label class="block text-sm font-medium mb-2" style="color: var(--color-textSecondary);">
						Auto-save interval: {autoSaveInterval} seconds
					</label>
					<input 
						type="range" 
						min="1" 
						max="10" 
						bind:value={autoSaveInterval}
						class="w-full accent-theme"
						style="accent-color: var(--color-accent);"
					/>
				</div>
				
				<!-- Spell Check -->
				<div class="flex items-center justify-between p-3 rounded-lg" style="background-color: var(--color-bgTertiary);">
					<label class="text-sm font-medium" style="color: var(--color-textSecondary);">
						Spell Check
					</label>
					<button
						on:click={() => spellCheck = !spellCheck}
						class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
						style="background-color: {spellCheck ? 'var(--color-accent)' : 'var(--color-border)'};"
					>
						<span
							class="inline-block h-4 w-4 transform rounded-full transition-transform"
							style="background-color: var(--color-bgSecondary); transform: translateX({spellCheck ? '1.5rem' : '0.25rem'});"
						/>
					</button>
				</div>
				
				<div class="mt-3 p-3 rounded-lg" style="background-color: var(--color-accentLight); border: 1px solid var(--color-border);">
					<p class="text-xs" style="color: var(--color-textSecondary);">
						💡 <strong>Tip:</strong> Font family, size, and line height can be adjusted in the toolbar above the editor.
					</p>
				</div>
			</section>
			
			<!-- Panels -->
			<section>
				<h3 class="text-lg font-semibold mb-4" style="color: var(--color-textPrimary);">
					🔌 AI Panels
				</h3>
				
				<div class="space-y-2">
					{#each [
						{ key: 'prompt', label: 'Prompt Generator', icon: '✨' },
						{ key: 'humanizer', label: 'Humanizer', icon: '🎭' },
						{ key: 'detector', label: 'AI Detector', icon: '🔍' },
						{ key: 'citations', label: 'Citations', icon: '📚' }
					] as panel}
						<div class="flex items-center justify-between p-3 rounded-lg" style="background-color: var(--color-bgTertiary);">
							<span class="text-sm" style="color: var(--color-textSecondary);">
								<span class="mr-2">{panel.icon}</span>
								{panel.label}
							</span>
							<button
								on:click={() => panelsEnabled[panel.key] = !panelsEnabled[panel.key]}
								class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
								style="background-color: {panelsEnabled[panel.key] ? 'var(--color-accent)' : 'var(--color-border)'};"
							>
								<span
									class="inline-block h-4 w-4 transform rounded-full transition-transform"
									style="background-color: var(--color-bgSecondary); transform: translateX({panelsEnabled[panel.key] ? '1.5rem' : '0.25rem'});"
								/>
							</button>
						</div>
					{/each}
				</div>
			</section>
		</div>
		
		<!-- Footer -->
		<div class="flex items-center justify-between p-6" style="border-top: 1px solid var(--color-border);">
			<button
				on:click={resetSettings}
				class="px-4 py-2 text-sm font-medium rounded-lg hover:opacity-80 transition-opacity"
				style="color: var(--color-textSecondary);"
			>
				Reset to Defaults
			</button>
			<div class="flex space-x-3">
				<button
					on:click={onClose}
					class="px-4 py-2 text-sm font-medium rounded-lg hover:opacity-80 transition-opacity"
					style="background-color: var(--color-bgTertiary); color: var(--color-textSecondary);"
				>
					Cancel
				</button>
				<button
					on:click={saveSettings}
					class="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
					style="background-color: var(--color-accent);"
				>
					Save Settings
				</button>
			</div>
		</div>
	</div>
</div>
