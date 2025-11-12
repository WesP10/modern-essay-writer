<script lang="ts">
	import { ExportService, type ExportOptions } from '$lib/utils/export';

	export let isOpen = false;
	export let title = 'Untitled Essay';
	export let content = '';
	export let wordCount = 0;
	export let created = '';
	export let modified = '';

	let selectedFormat: 'txt' | 'md' | 'html' = 'txt';
	let includeMetadata = false;
	let copied = false;

	function close() {
		isOpen = false;
		copied = false;
	}

	function handleExport() {
		const options: ExportOptions = {
			format: selectedFormat,
			title,
			content,
			includeMetadata,
			metadata: {
				wordCount,
				created,
				modified
			}
		};

		const { content: exportContent, filename, mimeType } = ExportService.export(options);
		ExportService.downloadFile(exportContent, filename, mimeType);
		close();
	}

	async function handleCopy() {
		const options: ExportOptions = {
			format: selectedFormat,
			title,
			content,
			includeMetadata,
			metadata: {
				wordCount,
				created,
				modified
			}
		};

		const { content: exportContent } = ExportService.export(options);
		const success = await ExportService.copyToClipboard(exportContent);
		
		if (success) {
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		}
	}
</script>

{#if isOpen}
	<!-- Modal Overlay -->
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
		on:click={close}
		on:keydown={(e) => e.key === 'Escape' && close()}
		role="button"
		tabindex="0"
	>
		<!-- Modal Content -->
		<div
			class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-2xl font-bold text-gray-900 dark:text-white">
					📤 Export Essay
				</h2>
				<button
					on:click={close}
					class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
				>
					✕
				</button>
			</div>

			<!-- Format Selection -->
			<div class="mb-6">
				<div class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
					Export Format
				</div>
				<div class="space-y-2">
					<label class="flex items-center space-x-3 cursor-pointer">
						<input
							type="radio"
							bind:group={selectedFormat}
							value="txt"
							class="w-4 h-4 text-indigo-600"
						/>
						<div>
							<div class="font-medium text-gray-900 dark:text-white">Plain Text (.txt)</div>
							<div class="text-sm text-gray-500 dark:text-gray-400">
								Simple text format without formatting
							</div>
						</div>
					</label>

					<label class="flex items-center space-x-3 cursor-pointer">
						<input
							type="radio"
							bind:group={selectedFormat}
							value="md"
							class="w-4 h-4 text-indigo-600"
						/>
						<div>
							<div class="font-medium text-gray-900 dark:text-white">Markdown (.md)</div>
							<div class="text-sm text-gray-500 dark:text-gray-400">
								Formatted text with Markdown syntax
							</div>
						</div>
					</label>

					<label class="flex items-center space-x-3 cursor-pointer">
						<input
							type="radio"
							bind:group={selectedFormat}
							value="html"
							class="w-4 h-4 text-indigo-600"
						/>
						<div>
							<div class="font-medium text-gray-900 dark:text-white">HTML (.html)</div>
							<div class="text-sm text-gray-500 dark:text-gray-400">
								Complete webpage with formatting
							</div>
						</div>
					</label>
				</div>
			</div>

			<!-- Metadata Option -->
			{#if selectedFormat === 'md'}
				<div class="mb-6">
					<label class="flex items-center space-x-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={includeMetadata}
							class="w-4 h-4 text-indigo-600 rounded"
						/>
						<span class="text-sm font-medium text-gray-700 dark:text-gray-300">
							Include metadata (YAML frontmatter)
						</span>
					</label>
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex space-x-3">
				<button
					on:click={handleExport}
					class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
				>
					📥 Download
				</button>
				<button
					on:click={handleCopy}
					class="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
				>
					{copied ? '✓ Copied!' : '📋 Copy'}
				</button>
			</div>
		</div>
	</div>
{/if}
