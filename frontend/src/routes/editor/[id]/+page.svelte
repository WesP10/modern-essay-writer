<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import Editor from '$lib/components/Editor.svelte';
	import WordCount from '$lib/components/WordCount.svelte';
	import ExportModal from '$lib/components/ExportModal.svelte';
	import ResizablePanels from '$lib/components/panels/ResizablePanels.svelte';
	import SidebarContainer from '$lib/components/panels/SidebarContainer.svelte';
	import SettingsPanel from '$lib/components/SettingsPanel.svelte';
	import { EssayStorage, type EssayData } from '$lib/utils/storage';

	let essayId = '';
	let title = 'Untitled Essay';
	let content = '';
	let saveStatus: 'saved' | 'saving' | 'unsaved' = 'saved';
	let wordCount = 0;
	let charCount = 0;
	let editor: any;
	let autoSaveTimer: NodeJS.Timeout;
	let showExportModal = false;
	let showSidebar = false;
	let showSettings = false;
	let createdDate = '';
	let modifiedDate = '';
	let titleInputElement: HTMLInputElement;

	$: essayId = $page.params.id || '';

	onMount(() => {
		// Load essay from localStorage
		loadEssay();
		
		// Add keyboard shortcuts
		const handleKeydown = (e: KeyboardEvent) => {
			const ctrl = e.ctrlKey || e.metaKey;
			
			// Escape - Close modals
			if (e.key === 'Escape') {
				if (showExportModal) {
					showExportModal = false;
				} else if (showSettings) {
					showSettings = false;
				}
			}
			// Ctrl+S - Save
			else if (ctrl && e.key === 's') {
				e.preventDefault();
				saveEssay();
			}
			// Ctrl+R - Focus title/rename
			else if (ctrl && e.key === 'r') {
				e.preventDefault();
				titleInputElement?.focus();
				titleInputElement?.select();
			}
			// Ctrl+Enter - Toggle AI sidebar
			else if (ctrl && e.key === 'Enter') {
				e.preventDefault();
				toggleSidebar();
			}
			// Ctrl+E - Export
			else if (ctrl && e.key === 'e') {
				e.preventDefault();
				handleExport();
			}
			// Ctrl+, - Settings
			else if (ctrl && e.key === ',') {
				e.preventDefault();
				toggleSettings();
			}
		};
		
		window.addEventListener('keydown', handleKeydown);
		
		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});

	function loadEssay() {
		const essay = EssayStorage.getEssay(essayId);
		if (essay) {
			title = essay.title || 'Untitled Essay';
			content = essay.content || '';
			wordCount = essay.wordCount || 0;
			charCount = essay.charCount || 0;
			createdDate = essay.created;
			modifiedDate = essay.modified;
		}
	}

	function saveEssay() {
		saveStatus = 'saving';

		const existingEssay = EssayStorage.getEssay(essayId);
		const essayData: EssayData = {
			id: essayId,
			title,
			content,
			created: existingEssay?.created || new Date().toISOString(),
			modified: new Date().toISOString(),
			wordCount,
			charCount
		};

		EssayStorage.saveEssay(essayData);
		modifiedDate = essayData.modified;

		setTimeout(() => {
			saveStatus = 'saved';
		}, 500);
	}

	function handleContentUpdate(newContent: string) {
		content = newContent;
		saveStatus = 'unsaved';

		// Debounced auto-save
		clearTimeout(autoSaveTimer);
		autoSaveTimer = setTimeout(() => {
			saveEssay();
		}, 2000);
	}

	function handleWordCountChange(words: number, chars: number) {
		wordCount = words;
		charCount = chars;
	}

	function handleExport() {
		// Save before exporting
		saveEssay();
		showExportModal = true;
	}
	
	function toggleSidebar() {
		showSidebar = !showSidebar;
	}
	
	function toggleSettings() {
		showSettings = !showSettings;
	}
</script>

<svelte:head>
	<title>{title} - EssayForge</title>
</svelte:head>

<div class="h-screen flex flex-col" style="background-color: var(--color-bgSecondary);">
	<!-- Navbar -->
	<Navbar 
		bind:title 
		bind:titleInputElement
		{saveStatus} 
		onExport={handleExport}
		onToggleSidebar={toggleSidebar}
		onToggleSettings={toggleSettings}
		sidebarOpen={showSidebar}
	/>

	<!-- Toolbar -->
	<Toolbar bind:editor />

	<!-- Main Content Area with Resizable Panels -->
	<div class="flex-1 overflow-hidden">
		<ResizablePanels showSidebar={showSidebar}>
			<svelte:fragment slot="main">
				<div class="h-full overflow-auto">
					<div class="max-w-4xl mx-auto">
						<Editor
							bind:editor
							{content}
							onUpdate={handleContentUpdate}
							onWordCountChange={handleWordCountChange}
						/>
					</div>
				</div>
			</svelte:fragment>
			
			<svelte:fragment slot="sidebar">
				<SidebarContainer onClose={toggleSidebar} />
			</svelte:fragment>
		</ResizablePanels>
	</div>

	<!-- Word Count Widget -->
	<WordCount words={wordCount} characters={charCount} />

	<!-- Export Modal -->
	<ExportModal
		bind:isOpen={showExportModal}
		{title}
		{content}
		{wordCount}
		created={createdDate}
		modified={modifiedDate}
	/>
	
	<!-- Settings Modal -->
	{#if showSettings}
		<SettingsPanel onClose={toggleSettings} />
	{/if}
</div>
