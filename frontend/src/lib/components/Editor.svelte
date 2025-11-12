<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import TextAlign from '@tiptap/extension-text-align';
	import TextStyle from '@tiptap/extension-text-style';
	import Color from '@tiptap/extension-color';
	import Highlight from '@tiptap/extension-highlight';
	import Underline from '@tiptap/extension-underline';
	import Link from '@tiptap/extension-link';
	import Image from '@tiptap/extension-image';
	import TaskList from '@tiptap/extension-task-list';
	import TaskItem from '@tiptap/extension-task-item';
	import BulletList from '@tiptap/extension-bullet-list';
	import OrderedList from '@tiptap/extension-ordered-list';
	import ListItem from '@tiptap/extension-list-item';
	import CodeBlock from '@tiptap/extension-code-block';
	import HorizontalRule from '@tiptap/extension-horizontal-rule';
	import AutocompleteDropdown from './AutocompleteDropdown.svelte';
	import { getAutocompleteSuggestions, recordAutocompleteSelection, type AutocompleteSuggestion } from '$lib/utils/api';

	export let content = '';
	export let onUpdate: (content: string) => void = () => {};
	export let onWordCountChange: (words: number, chars: number) => void = () => {};
	export let essayType: 'argumentative' | 'research' | 'narrative' | 'expository' | undefined = undefined;
	export let enableLLM = true; // Enable LLM-powered suggestions by default

	let element: HTMLDivElement;
	let editor: Editor | null = null;
	let isUpdating = false;

	// Autocomplete state
	let showAutocomplete = false;
	let autocompleteSuggestions: AutocompleteSuggestion[] = [];
	let autocompletePosition = { top: 0, left: 0 };
	let selectedSuggestionIndex = 0;
	let currentPrefix = '';
	let autocompleteTimeout: ReturnType<typeof setTimeout> | null = null;
	let idleTimeout: ReturnType<typeof setTimeout> | null = null;
	const IDLE_TIMEOUT_MS = 300; // 0.3 seconds of idle before triggering LLM

	onMount(() => {
		editor = new Editor({
			element: element,
			extensions: [
				// Use StarterKit but disable built-in list extensions
				StarterKit.configure({
					bulletList: false,
					orderedList: false,
					listItem: false,
					codeBlock: false, // We'll add it separately for better control
					horizontalRule: false, // We'll add it separately
				}),
				// Add custom list extensions with proper nesting support
				BulletList.configure({
					HTMLAttributes: {
						class: 'list-disc ml-6'
					},
					keepMarks: true,
					keepAttributes: false,
				}),
				OrderedList.configure({
					HTMLAttributes: {
						class: 'list-decimal ml-6'
					},
					keepMarks: true,
					keepAttributes: false,
				}),
				ListItem.configure({
					HTMLAttributes: {
						class: 'ml-0'
					}
				}),
				// Add code block extension
				CodeBlock.configure({
					HTMLAttributes: {
						class: 'code-block'
					}
				}),
				// Add horizontal rule extension
				HorizontalRule,
				TextAlign.configure({
					types: ['heading', 'paragraph']
				}),
				TextStyle,
				Color,
				Highlight.configure({
					multicolor: true
				}),
				Underline,
				Link.configure({
					openOnClick: false, // We'll handle clicks manually for better control
					autolink: true,
					linkOnPaste: true,
					HTMLAttributes: {
						class: 'text-indigo-600 dark:text-indigo-400 underline cursor-pointer hover:text-indigo-800 dark:hover:text-indigo-300',
						target: '_blank',
						rel: 'noopener noreferrer'
					}
				}).extend({
					inclusive: false,
					addProseMirrorPlugins() {
						return [
							...(this.parent?.() || []),
						];
					},
				}),
				Image.configure({
					HTMLAttributes: {
						class: 'max-w-full h-auto rounded-lg'
					}
				}),
				TaskList,
				TaskItem.configure({
					nested: true,
					HTMLAttributes: {
						class: 'flex items-start'
					}
				})
			],
			content: content,
			onTransaction: () => {
				// Force re-render to update toolbar button states
				editor = editor;
			},
			onUpdate: ({ editor }) => {
				const html = editor.getHTML();
				const text = editor.getText();
				const words = text.trim() ? text.trim().split(/\s+/).length : 0;
				const chars = text.length;

				isUpdating = true;
				onUpdate(html);
				onWordCountChange(words, chars);
				isUpdating = false;

				// Trigger autocomplete
				handleAutocomplete();
			},
			editorProps: {
				attributes: {
					class: 'prose prose-lg max-w-none focus:outline-none',
					style: 'color: var(--color-editorText); background-color: var(--color-editorBg);'
				},
				handleClick: (view, pos, event) => {
					// Check if clicking on a link
					const target = event.target as HTMLElement;
					const link = target.tagName === 'A' ? target : target.closest('a');
					
					if (link) {
						const href = link.getAttribute('href');
						
						// Open link in new tab
						if (href) {
							window.open(href, '_blank', 'noopener,noreferrer');
							event.preventDefault();
							return true; // Prevent editor from handling this click
						}
					}
					
					return false;
				},
				handleKeyDown: (view, event) => {
					// Handle autocomplete navigation
					if (showAutocomplete) {
						if (event.key === 'ArrowDown') {
							event.preventDefault();
							selectedSuggestionIndex = Math.min(
								selectedSuggestionIndex + 1,
								autocompleteSuggestions.length - 1
							);
							return true;
						}
						if (event.key === 'ArrowUp') {
							event.preventDefault();
							selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0);
							return true;
						}
						if (event.key === 'Enter' || event.key === 'Tab') {
							event.preventDefault();
							acceptSuggestion(autocompleteSuggestions[selectedSuggestionIndex]);
							return true;
						}
						if (event.key === 'Escape') {
							event.preventDefault();
							closeAutocomplete();
							return true;
						}
					}
					return false;
				}
			}
		});

		// Add click listener to close autocomplete when clicking outside
		document.addEventListener('click', handleClickOutside);
	});

	// Watch for content changes from parent and update editor
	$: if (editor && !isUpdating && content !== editor.getHTML()) {
		const { from, to } = editor.state.selection;
		editor.commands.setContent(content, false);
		// Restore cursor position
		editor.commands.setTextSelection({ from: Math.min(from, editor.state.doc.content.size), to: Math.min(to, editor.state.doc.content.size) });
	}

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
		if (autocompleteTimeout) {
			clearTimeout(autocompleteTimeout);
		}
		if (idleTimeout) {
			clearTimeout(idleTimeout);
		}
		document.removeEventListener('click', handleClickOutside);
	});

	// Autocomplete functions
	async function handleAutocomplete() {
		if (!editor) return;

		// Clear existing timeouts
		if (autocompleteTimeout) {
			clearTimeout(autocompleteTimeout);
		}
		if (idleTimeout) {
			clearTimeout(idleTimeout);
		}

		// Debounce autocomplete requests
		autocompleteTimeout = setTimeout(async () => {
			const { from } = editor!.state.selection;
			const text = editor!.state.doc.textBetween(0, from, ' ');
			
			// Get the word being typed
			const words = text.split(/\s+/);
			const currentWord = words[words.length - 1];

			console.log('[Autocomplete] Current word:', currentWord, 'Length:', currentWord.length);

			// Only show autocomplete if word is at least 2 characters
			if (currentWord.length < 2 || /[^a-zA-Z]/.test(currentWord)) {
				console.log('[Autocomplete] Word too short or invalid characters');
				closeAutocomplete();
				// Start idle timer for LLM suggestions
				startIdleTimer();
				return;
			}

			currentPrefix = currentWord;

			try {
				// Get cursor position for dropdown placement
				const coords = editor!.view.coordsAtPos(from);
				autocompletePosition = {
					top: coords.bottom + window.scrollY + 5,
					left: coords.left + window.scrollX
				};

				console.log('[Autocomplete] Fetching suggestions for:', currentWord);

				// Get suggestions from enhanced API with LLM support
				const response = await getAutocompleteSuggestions({
					prefix: currentWord,
					context: text,
					cursorPosition: from,
					essayType,
					enableLLM: enableLLM,
					maxSuggestions: 5
				});

				console.log('[Autocomplete] Response:', response);

				if (response.suggestions && response.suggestions.length > 0) {
					autocompleteSuggestions = response.suggestions;
					selectedSuggestionIndex = 0;
					showAutocomplete = true;
					console.log('[Autocomplete] Showing', response.suggestions.length, 'suggestions (Tier', response.metadata?.tier || 'unknown', ')');
				} else {
					console.log('[Autocomplete] No suggestions found');
					closeAutocomplete();
					// Start idle timer since we have no suggestions
					startIdleTimer();
				}
			} catch (error) {
				console.error('[Autocomplete] Error:', error);
				closeAutocomplete();
				startIdleTimer();
			}
		}, 300); // 300ms debounce
	}

	// New function: Start idle timer for LLM suggestions
	function startIdleTimer() {
		if (!enableLLM || !editor) return;

		// Clear existing idle timer
		if (idleTimeout) {
			clearTimeout(idleTimeout);
		}

		// Set new idle timer
		idleTimeout = setTimeout(async () => {
			const { from } = editor!.state.selection;
			const text = editor!.state.doc.textBetween(0, from, ' ');

			// Don't trigger if no context
			if (text.trim().length < 50) {
				console.log('[Idle LLM] Not enough context');
				return;
			}

			console.log('[Idle LLM] User idle, fetching LLM suggestions...');

			try {
				// Get cursor position for dropdown placement
				const coords = editor!.view.coordsAtPos(from);
				autocompletePosition = {
					top: coords.bottom + window.scrollY + 5,
					left: coords.left + window.scrollX
				};

				// Get LLM suggestions with 'idle' trigger type
				const response = await getAutocompleteSuggestions({
					prefix: '',
					context: text,
					cursorPosition: from,
					essayType,
					enableLLM: true,
					maxSuggestions: 3,
					triggerType: 'idle' // Special trigger for idle detection
				});

				console.log('[Idle LLM] Response:', response);

				if (response.suggestions && response.suggestions.length > 0) {
					autocompleteSuggestions = response.suggestions;
					selectedSuggestionIndex = 0;
					showAutocomplete = true;
					currentPrefix = '';
					console.log('[Idle LLM] Showing', response.suggestions.length, 'LLM suggestions');
				}
			} catch (error) {
				console.error('[Idle LLM] Error:', error);
			}
		}, IDLE_TIMEOUT_MS);
	}

	function acceptSuggestion(suggestion: AutocompleteSuggestion) {
		if (!editor) return;

		const { from } = editor.state.selection;
		const text = editor.state.doc.textBetween(0, from, ' ');
		const words = text.split(/\s+/);
		const currentWord = words[words.length - 1];

		// Calculate the position to replace
		const replaceFrom = from - currentWord.length;
		const replaceTo = from;

		// Replace the current word with the suggestion
		editor
			.chain()
			.focus()
			.deleteRange({ from: replaceFrom, to: replaceTo })
			.insertContent(suggestion.text + ' ')
			.run();

		// Record selection for learning (async, don't wait)
		recordAutocompleteSelection(suggestion.text, essayType).catch(err => 
			console.warn('[Autocomplete] Failed to record selection:', err)
		);

		closeAutocomplete();
	}

	function closeAutocomplete() {
		showAutocomplete = false;
		autocompleteSuggestions = [];
		selectedSuggestionIndex = 0;
		currentPrefix = '';
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (showAutocomplete && !target.closest('.autocomplete-dropdown')) {
			closeAutocomplete();
		}
	}

	// Export the editor instance for toolbar
	export { editor };
</script>

<div class="editor-container">
	<div bind:this={element} class="min-h-screen"></div>
	
	{#if showAutocomplete}
		<AutocompleteDropdown
			suggestions={autocompleteSuggestions}
			position={autocompletePosition}
			bind:selectedIndex={selectedSuggestionIndex}
			on:select={(e) => acceptSuggestion(e.detail)}
			on:close={closeAutocomplete}
		/>
	{/if}
</div>

<style>
	.editor-container {
		position: relative;
		width: 100%;
		height: 100%;
	}

	/* List styles - proper nesting and indentation */
	:global(.ProseMirror ul),
	:global(.ProseMirror ol) {
		padding-left: 1.5rem;
		margin: 0.5rem 0;
	}

	:global(.ProseMirror ul ul),
	:global(.ProseMirror ol ul),
	:global(.ProseMirror ul ol),
	:global(.ProseMirror ol ol) {
		margin: 0.25rem 0;
	}

	:global(.ProseMirror li) {
		margin: 0.25rem 0;
	}

	:global(.ProseMirror li p) {
		margin: 0;
	}

	/* Bullet list styles */
	:global(.ProseMirror ul:not([data-type="taskList"])) {
		list-style-type: disc;
	}

	:global(.ProseMirror ul:not([data-type="taskList"]) ul) {
		list-style-type: circle;
	}

	:global(.ProseMirror ul:not([data-type="taskList"]) ul ul) {
		list-style-type: square;
	}

	/* Ordered list styles */
	:global(.ProseMirror ol) {
		list-style-type: decimal;
	}

	:global(.ProseMirror ol ol) {
		list-style-type: lower-alpha;
	}

	:global(.ProseMirror ol ol ol) {
		list-style-type: lower-roman;
	}

	/* Task list styles - make checkboxes inline with text and remove bullets */
	:global(.ProseMirror ul[data-type="taskList"]) {
		list-style: none;
		padding-left: 0;
		margin-left: 0;
	}

	:global(.ProseMirror ul[data-type="taskList"] li) {
		display: flex;
		align-items: flex-start;
		margin-bottom: 0.5rem;
		list-style: none;
		padding-left: 0;
	}

	:global(.ProseMirror ul[data-type="taskList"] li > label) {
		display: flex;
		align-items: flex-start;
		flex: 0 0 auto;
		cursor: pointer;
		margin: 0;
		padding: 0;
		min-width: fit-content;
	}

	:global(.ProseMirror ul[data-type="taskList"] li > label > input[type="checkbox"]) {
		margin: 0.25rem 0.5rem 0 0;
		cursor: pointer;
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
		flex-grow: 0;
	}

	:global(.ProseMirror ul[data-type="taskList"] li > label > span) {
		display: none;
	}

	:global(.ProseMirror ul[data-type="taskList"] li > div) {
		flex: 1;
		min-width: 0;
		word-wrap: break-word;
	}

	:global(.ProseMirror ul[data-type="taskList"] li > div > p) {
		margin: 0;
		padding: 0;
	}

	/* Remove any bullets or markers from task lists */
	:global(.ProseMirror ul[data-type="taskList"] li::before),
	:global(.ProseMirror ul[data-type="taskList"] li::marker) {
		display: none !important;
		content: none !important;
	}

	/* Nested task lists */
	:global(.ProseMirror ul[data-type="taskList"] ul[data-type="taskList"]) {
		margin-top: 0.5rem;
		padding-left: 1.5rem;
		margin-left: 0;
	}

	/* Code block styles */
	:global(.ProseMirror pre) {
		background-color: #f5f5f5;
		color: #333;
		font-family: 'Courier New', Courier, monospace;
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin: 1rem 0;
		border: 1px solid #ddd;
	}

	:global(.dark .ProseMirror pre) {
		background-color: #1e1e1e;
		color: #d4d4d4;
		border-color: #404040;
	}

	:global(.ProseMirror code) {
		background-color: transparent;
		color: inherit;
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.9em;
	}

	/* Horizontal rule styles */
	:global(.ProseMirror hr) {
		border: none;
		border-top: 2px solid #e5e7eb;
		margin: 2rem 0;
		cursor: pointer;
	}

	:global(.dark .ProseMirror hr) {
		border-top-color: #374151;
	}

	:global(.ProseMirror hr:hover) {
		border-top-color: #9ca3af;
	}

	:global(.dark .ProseMirror hr:hover) {
		border-top-color: #6b7280;
	}
</style>
