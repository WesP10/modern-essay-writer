<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Editor } from '@tiptap/core';

	export let editor: Editor | null;

	$: canUndo = editor?.can().undo() ?? false;
	$: canRedo = editor?.can().redo() ?? false;
	$: isActive = (name: string, attrs?: any) => editor?.isActive(name, attrs) ?? false;

	let fontSize = '16';
	let fontFamily = 'Inter';
	let lineHeight = '1.5';
	let textColor = '#000000';
	let bgColor = '#ffffff';
	let showTextColorPicker = false;
	let showBgColorPicker = false;
	let textColorIndex = 0;
	let bgColorIndex = 0;
	let zoom = '100';
	let showLinkDialog = false;
	let linkUrl = '';
	let linkText = '';
	let showImageDialog = false;
	let imageUrl = '';
	let imageFile: File | null = null;
	let showHeadingDropdown = false;

	const fontSizes = ['10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '32', '36'];
	const fontFamilies = [
		{ value: 'Inter', label: 'Inter' },
		{ value: 'Arial', label: 'Arial' },
		{ value: 'Georgia', label: 'Georgia' },
		{ value: 'Times New Roman', label: 'Times New Roman' },
		{ value: 'Courier New', label: 'Courier New' },
		{ value: 'Verdana', label: 'Verdana' }
	];
	const lineHeights = ['1.0', '1.15', '1.5', '2.0', '2.5', '3.0'];
	const zoomLevels = ['50', '75', '90', '100', '125', '150', '200'];

	const predefinedColors = [
		'#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
		'#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
		'#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc'
	];

	// Close all dropdowns
	function closeAllDropdowns() {
		showTextColorPicker = false;
		showBgColorPicker = false;
		showLinkDialog = false;
		showImageDialog = false;
		showHeadingDropdown = false;
	}

	function applyZoom() {
		if (editor) {
			const element = editor.view.dom.parentElement;
			if (element) {
				element.style.zoom = zoom + '%';
			}
		}
	}

	function openLinkDialog() {
		if (editor) {
			const { from, to } = editor.state.selection;
			const selectedText = editor.state.doc.textBetween(from, to, ' ');
			
			// Get existing link if cursor is on a link
			const attrs = editor.getAttributes('link');
			linkUrl = attrs.href || '';
			linkText = selectedText || '';
			
			showLinkDialog = true;
		}
	}

	function insertLink() {
		if (editor && linkUrl) {
			const { from, to } = editor.state.selection;
			const selectedText = editor.state.doc.textBetween(from, to, ' ');
			
			if (selectedText || linkText) {
				// If there's selected text or provided text, create link
				if (selectedText) {
					// Update existing selection with link
					editor
						.chain()
						.focus()
						.extendMarkRange('link')
						.setLink({ href: linkUrl })
						.run();
				} else if (linkText) {
					// Insert new text with link
					editor
						.chain()
						.focus()
						.insertContent(`<a href="${linkUrl}">${linkText}</a>`)
						.run();
				}
			} else {
				// No text selected, insert URL as link text
				editor
					.chain()
					.focus()
					.insertContent(`<a href="${linkUrl}">${linkUrl}</a>`)
					.run();
			}
			
			// Reset and close
			linkUrl = '';
			linkText = '';
			showLinkDialog = false;
		}
	}

	function removeLink() {
		if (editor) {
			editor.chain().focus().unsetLink().run();
			linkUrl = '';
			linkText = '';
			showLinkDialog = false;
		}
	}

	function insertImage() {
		showImageDialog = true;
	}

	function confirmInsertImage() {
		if (editor) {
			if (imageFile) {
				// Create a temporary URL for the uploaded file
				const reader = new FileReader();
				reader.onload = (e) => {
					const result = e.target?.result;
					if (result && typeof result === 'string') {
						editor?.chain().focus().setImage({ src: result }).run();
					}
				};
				reader.readAsDataURL(imageFile);
			} else if (imageUrl) {
				// Use the provided URL
				editor.chain().focus().setImage({ src: imageUrl }).run();
			}
			
			// Reset and close
			imageUrl = '';
			imageFile = null;
			showImageDialog = false;
		}
	}

	function handleImageFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file && file.type.startsWith('image/')) {
			imageFile = file;
			imageUrl = ''; // Clear URL if file is selected
		}
	}

	function toggleCheckbox() {
		if (editor) {
			editor.chain().focus().toggleTaskList().run();
		}
	}

	function increaseIndent() {
		if (!editor) return;
		
		// Check what type of content is active and handle accordingly
		if (editor.isActive('listItem')) {
			// For bullet and ordered lists
			editor.chain().focus().sinkListItem('listItem').run();
		} else if (editor.isActive('taskItem')) {
			// For task lists/checkboxes
			editor.chain().focus().sinkListItem('taskItem').run();
		} else {
			// For regular text, insert a tab character
			editor.chain().focus().insertContent('\t').run();
		}
	}

	function decreaseIndent() {
		if (!editor) return;
		
		// Check what type of content is active and handle accordingly
		if (editor.isActive('listItem')) {
			// For bullet and ordered lists
			editor.chain().focus().liftListItem('listItem').run();
		} else if (editor.isActive('taskItem')) {
			// For task lists/checkboxes
			editor.chain().focus().liftListItem('taskItem').run();
		} else {
			// For regular text, try to remove leading tab or spaces
			const { from, to } = editor.state.selection;
			const lineStart = editor.state.doc.resolve(from).start();
			const lineText = editor.state.doc.textBetween(lineStart, to);
			
			// Remove one tab or 4 spaces from the start of the line
			if (lineText.startsWith('\t')) {
				editor.chain().focus().deleteRange({ from: lineStart, to: lineStart + 1 }).run();
			} else if (lineText.startsWith('    ')) {
				editor.chain().focus().deleteRange({ from: lineStart, to: lineStart + 4 }).run();
			}
		}
	}

	function printDocument() {
		if (editor) {
			const content = editor.getHTML();
			const printWindow = window.open('', '_blank');
			if (printWindow) {
				const htmlContent = '<!DOCTYPE html><html><head><title>Print Document</title><style>body{font-family:' + fontFamily + ',-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;font-size:' + fontSize + 'px;line-height:' + lineHeight + ';max-width:8.5in;margin:0.5in auto;padding:0}@media print{body{margin:0.5in}}h1,h2,h3,h4,h5,h6{margin-top:1em;margin-bottom:0.5em}p{margin:0.5em 0}ul,ol{margin:0.5em 0;padding-left:2em}img{max-width:100%;height:auto}a{color:#0066cc;text-decoration:underline}code{background-color:#f5f5f5;padding:0.2em 0.4em;border-radius:3px;font-family:monospace}pre{background-color:#f5f5f5;padding:1em;border-radius:5px;overflow-x:auto}blockquote{border-left:3px solid #ccc;margin-left:0;padding-left:1em;color:#666}table{border-collapse:collapse;width:100%;margin:1em 0}th,td{border:1px solid #ddd;padding:0.5em;text-align:left}th{background-color:#f5f5f5}</style></head><body>' + content + '</body></html>';
				printWindow.document.write(htmlContent);
				printWindow.document.close();
				printWindow.onload = () => {
					printWindow.focus();
					printWindow.print();
					printWindow.onafterprint = () => {
						printWindow.close();
					};
				};
			}
		}
	}

	function applyFontSize() {
		if (editor) {
			const element = editor.view.dom;
			element.style.fontSize = fontSize + 'px';
		}
	}

	function applyFontFamily() {
		if (editor) {
			const element = editor.view.dom;
			element.style.fontFamily = fontFamily;
		}
	}

	function applyLineHeight() {
		if (editor) {
			const element = editor.view.dom;
			element.style.lineHeight = lineHeight;
		}
	}

	function increaseFontSize() {
		const currentIndex = fontSizes.indexOf(fontSize);
		if (currentIndex < fontSizes.length - 1) {
			fontSize = fontSizes[currentIndex + 1];
			applyFontSize();
		}
	}

	function decreaseFontSize() {
		const currentIndex = fontSizes.indexOf(fontSize);
		if (currentIndex > 0) {
			fontSize = fontSizes[currentIndex - 1];
			applyFontSize();
		}
	}

	function increaseLineHeight() {
		const currentIndex = lineHeights.indexOf(lineHeight);
		if (currentIndex < lineHeights.length - 1) {
			lineHeight = lineHeights[currentIndex + 1];
			applyLineHeight();
		}
	}

	function decreaseLineHeight() {
		const currentIndex = lineHeights.indexOf(lineHeight);
		if (currentIndex > 0) {
			lineHeight = lineHeights[currentIndex - 1];
			applyLineHeight();
		}
	}

	function applyTextColor(color: string) {
		if (editor) {
			editor.chain().focus().setColor(color).run();
		}
	}

	function applyBgColor(color: string) {
		if (editor) {
			editor.chain().focus().setHighlight({ color }).run();
		}
	}

	// Handle keyboard shortcuts
	function handleKeydown(e: KeyboardEvent) {
		const ctrl = e.ctrlKey || e.metaKey;
		const shift = e.shiftKey;

		// Handle color picker interactions first (before checking editor)
		// Close dropdowns on Escape
		if (e.key === 'Escape') {
			if (showTextColorPicker || showBgColorPicker) {
				e.preventDefault();
				e.stopPropagation();
				closeAllDropdowns();
				return;
			}
		}

		// Enter key - Confirm color selection and close picker
		if (showTextColorPicker && e.key === 'Enter') {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			showTextColorPicker = false;
			return;
		}
		
		if (showBgColorPicker && e.key === 'Enter') {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			showBgColorPicker = false;
			return;
		}

		// Arrow key navigation for color pickers
		if (showTextColorPicker && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			const cols = 10;
			let newIndex = textColorIndex;
			
			if (e.key === 'ArrowLeft') newIndex = Math.max(0, textColorIndex - 1);
			else if (e.key === 'ArrowRight') newIndex = Math.min(predefinedColors.length - 1, textColorIndex + 1);
			else if (e.key === 'ArrowUp') newIndex = Math.max(0, textColorIndex - cols);
			else if (e.key === 'ArrowDown') newIndex = Math.min(predefinedColors.length - 1, textColorIndex + cols);
			
			textColorIndex = newIndex;
			textColor = predefinedColors[newIndex];
			applyTextColor(textColor);
			return;
		}
		
		if (showBgColorPicker && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			const cols = 10;
			let newIndex = bgColorIndex;
			
			if (e.key === 'ArrowLeft') newIndex = Math.max(0, bgColorIndex - 1);
			else if (e.key === 'ArrowRight') newIndex = Math.min(predefinedColors.length - 1, bgColorIndex + 1);
			else if (e.key === 'ArrowUp') newIndex = Math.max(0, bgColorIndex - cols);
			else if (e.key === 'ArrowDown') newIndex = Math.min(predefinedColors.length - 1, bgColorIndex + cols);
			
			bgColorIndex = newIndex;
			bgColor = predefinedColors[newIndex];
			applyBgColor(bgColor);
			return;
		}

		// Editor shortcuts only if color pickers are closed
		if (!editor) return;

		// Ctrl+B - Bold
		if (ctrl && !shift && e.key === 'b') {
			e.preventDefault();
			editor.chain().focus().toggleBold().run();
		}
		// Ctrl+I - Italic
		else if (ctrl && !shift && e.key === 'i') {
			e.preventDefault();
			editor.chain().focus().toggleItalic().run();
		}
		// Ctrl+U - Underline
		else if (ctrl && !shift && e.key === 'u') {
			e.preventDefault();
			editor.chain().focus().toggleUnderline().run();
		}
		// Ctrl+L - Strikethrough
		else if (ctrl && !shift && e.key === 'l') {
			e.preventDefault();
			editor.chain().focus().toggleStrike().run();
		}
		// Ctrl+K - Insert link
		else if (ctrl && !shift && e.key === 'k') {
			e.preventDefault();
			openLinkDialog();
		}
		// Ctrl+Shift+I - Insert image
		else if (ctrl && shift && e.key === 'I') {
			e.preventDefault();
			insertImage();
		}
		// Ctrl+Shift+X - Toggle checkbox/task list
		else if (ctrl && shift && e.key === 'X') {
			e.preventDefault();
			toggleCheckbox();
		}
		// Ctrl+] - Increase indent
		else if (ctrl && e.key === ']') {
			e.preventDefault();
			increaseIndent();
		}
		// Ctrl+[ - Decrease indent
		else if (ctrl && e.key === '[') {
			e.preventDefault();
			decreaseIndent();
		}
		// Ctrl+P - Print
		else if (ctrl && !shift && e.key === 'p') {
			e.preventDefault();
			printDocument();
		}
		// Ctrl+Shift+C - Toggle text color picker
		else if (ctrl && shift && e.key === 'C') {
			e.preventDefault();
			closeAllDropdowns();
			showTextColorPicker = !showTextColorPicker;
		}
		// Ctrl+Shift+H - Toggle highlight color picker
		else if (ctrl && shift && e.key === 'H') {
			e.preventDefault();
			closeAllDropdowns();
			showBgColorPicker = !showBgColorPicker;
		}
		// Ctrl+Shift+K - Toggle code block
		else if (ctrl && shift && e.key === 'K') {
			e.preventDefault();
			editor.chain().focus().toggleCodeBlock().run();
		}
		// Ctrl+Shift+- - Insert horizontal rule
		else if (ctrl && shift && e.key === '_') {
			e.preventDefault();
			editor.chain().focus().setHorizontalRule().run();
		}
		// Ctrl+Shift+> - Increase font size
		else if (ctrl && shift && e.key === '>') {
			e.preventDefault();
			increaseFontSize();
		}
		// Ctrl+Shift+< - Decrease font size
		else if (ctrl && shift && e.key === '<') {
			e.preventDefault();
			decreaseFontSize();
		}
		// Ctrl+{ - Decrease line height
		else if (ctrl && e.key === '{') {
			e.preventDefault();
			decreaseLineHeight();
		}
		// Ctrl+} - Increase line height
		else if (ctrl && e.key === '}') {
			e.preventDefault();
			increaseLineHeight();
		}
		// Ctrl+Shift+L - Align left
		else if (ctrl && shift && e.key === 'L') {
			e.preventDefault();
			editor.chain().focus().setTextAlign('left').run();
		}
		// Ctrl+Shift+E - Align center
		else if (ctrl && shift && e.key === 'E') {
			e.preventDefault();
			editor.chain().focus().setTextAlign('center').run();
		}
		// Ctrl+Shift+R - Align right
		else if (ctrl && shift && e.key === 'R') {
			e.preventDefault();
			editor.chain().focus().setTextAlign('right').run();
		}
		// Ctrl+Shift+7 - Ordered list
		else if (ctrl && shift && e.key === '7') {
			e.preventDefault();
			editor.chain().focus().toggleOrderedList().run();
		}
		// Ctrl+Shift+8 - Bullet list
		else if (ctrl && shift && e.key === '8') {
			e.preventDefault();
			editor.chain().focus().toggleBulletList().run();
		}
		// Ctrl+Alt+1 - Heading 1
		else if (ctrl && e.altKey && e.key === '1') {
			e.preventDefault();
			editor.chain().focus().toggleHeading({ level: 1 }).run();
		}
		// Ctrl+Alt+2 - Heading 2
		else if (ctrl && e.altKey && e.key === '2') {
			e.preventDefault();
			editor.chain().focus().toggleHeading({ level: 2 }).run();
		}
		// Ctrl+Alt+3 - Heading 3
		else if (ctrl && e.altKey && e.key === '3') {
			e.preventDefault();
			editor.chain().focus().toggleHeading({ level: 3 }).run();
		}
		// Ctrl+Alt+4 - Heading 4
		else if (ctrl && e.altKey && e.key === '4') {
			e.preventDefault();
			editor.chain().focus().toggleHeading({ level: 4 }).run();
		}
		// Ctrl+Alt+5 - Heading 5
		else if (ctrl && e.altKey && e.key === '5') {
			e.preventDefault();
			editor.chain().focus().toggleHeading({ level: 5 }).run();
		}
		// Ctrl+Alt+6 - Heading 6
		else if (ctrl && e.altKey && e.key === '6') {
			e.preventDefault();
			editor.chain().focus().toggleHeading({ level: 6 }).run();
		}
	}

	// Apply initial styles
	$: if (editor) {
		applyFontSize();
		applyFontFamily();
		applyLineHeight();
		applyZoom();
	}

	// Handle clicks outside to close dropdowns
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.relative')) {
			closeAllDropdowns();
		}
	}

	onMount(() => {
		// Only add event listeners in the browser
		if (typeof window !== 'undefined') {
			// Use capture phase to intercept before editor processes the event
			window.addEventListener('keydown', handleKeydown, true);
			document.addEventListener('click', handleClickOutside);
		}
	});

	onDestroy(() => {
		// Only remove event listeners if in the browser
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeydown, true);
			document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<!-- Google Sheets Style Toolbar -->
<div class="px-3 py-1.5" style="background-color: var(--color-bgSecondary); border-bottom: 1px solid var(--color-border);">
	<div class="flex items-center space-x-2">
		<!-- Undo/Redo Group -->
		<div class="flex items-center space-x-0.5">
			<button
				on:click={() => editor?.chain().focus().undo().run()}
				disabled={!canUndo || !editor}
				class="toolbar-btn"
				title="Undo (Ctrl+Z)"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
				</svg>
			</button>
			<button
				on:click={() => editor?.chain().focus().redo().run()}
				disabled={!canRedo || !editor}
				class="toolbar-btn"
				title="Redo (Ctrl+Y)"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/>
				</svg>
			</button>
		</div>

		<div class="toolbar-divider"></div>

		<!-- Zoom Dropdown -->
		<select
			bind:value={zoom}
			on:change={applyZoom}
			on:focus={closeAllDropdowns}
			class="toolbar-select-small"
			disabled={!editor}
			title="Zoom level"
		>
			{#each zoomLevels as level}
				<option value={level}>{level}%</option>
			{/each}
		</select>

		<div class="toolbar-divider"></div>

		<!-- Font Family Dropdown -->
		<select
			bind:value={fontFamily}
			on:change={applyFontFamily}
			on:focus={closeAllDropdowns}
			class="toolbar-select"
			disabled={!editor}
			title="Font family"
		>
			{#each fontFamilies as font}
				<option value={font.value}>{font.label}</option>
			{/each}
		</select>

		<!-- Font Size Dropdown -->
		<select
			bind:value={fontSize}
			on:change={applyFontSize}
			on:focus={closeAllDropdowns}
			class="toolbar-select-small"
			disabled={!editor}
			title="Font size (Ctrl+Shift+> / Ctrl+Shift+<)"
		>
			{#each fontSizes as size}
				<option value={size}>{size}</option>
			{/each}
		</select>

		<div class="toolbar-divider"></div>

		<!-- Text Formatting Group -->
		<div class="flex items-center space-x-0.5">
			<button
				on:click={() => editor?.chain().focus().toggleBold().run()}
				disabled={!editor}
				class="toolbar-btn font-bold"
				class:active={isActive('bold')}
				title="Bold (Ctrl+B)"
			>
				B
			</button>
			<button
				on:click={() => editor?.chain().focus().toggleItalic().run()}
				disabled={!editor}
				class="toolbar-btn italic"
				class:active={isActive('italic')}
				title="Italic (Ctrl+I)"
			>
				I
			</button>
			<button
				on:click={() => editor?.chain().focus().toggleUnderline().run()}
				disabled={!editor}
				class="toolbar-btn underline"
				class:active={isActive('underline')}
				title="Underline (Ctrl+U)"
			>
				U
			</button>
			<button
				on:click={() => editor?.chain().focus().toggleStrike().run()}
				disabled={!editor}
				class="toolbar-btn line-through"
				class:active={isActive('strike')}
				title="Strikethrough (Ctrl+L)"
			>
				S
			</button>
		</div>

		<div class="toolbar-divider"></div>

		<!-- Text Color Picker -->
		<div class="relative">
			<button
				on:click={() => {
					closeAllDropdowns();
					showTextColorPicker = !showTextColorPicker;
				}}
				disabled={!editor}
				class="toolbar-btn flex items-center space-x-1"
				title="Text color (Ctrl+Shift+C) - Arrow keys to navigate, Enter to confirm"
			>
				<span class="font-bold">A</span>
				<div class="w-4 h-0.5" style="background-color: {textColor}"></div>
				<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
					<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
				</svg>
			</button>
			
			{#if showTextColorPicker}
				<div class="color-picker-dropdown scrollbar-thin">
					<div class="px-2 pt-2 pb-1">
						<button
							on:click={() => {
								editor?.chain().focus().unsetColor().run();
								showTextColorPicker = false;
							}}
							class="w-full px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
						>
							None (Remove Color)
						</button>
					</div>
					<div class="grid grid-cols-10 gap-1 p-2">
						{#each predefinedColors as color, i}
							<button
								class="w-6 h-6 rounded border hover:scale-110 transition-transform"
								class:border-gray-300={i !== textColorIndex}
								class:border-indigo-600={i === textColorIndex}
								class:ring-2={i === textColorIndex}
								class:ring-indigo-400={i === textColorIndex}
								style="background-color: {color}"
								on:click={() => {
									textColor = color;
									textColorIndex = i;
									applyTextColor(color);
									showTextColorPicker = false;
								}}
								title={color}
							></button>
						{/each}
					</div>
					<div class="px-2 pb-2">
						<input
							type="color"
							bind:value={textColor}
							on:input={() => applyTextColor(textColor)}
							class="w-full h-8 rounded cursor-pointer"
						/>
					</div>
				</div>
			{/if}
		</div>

		<!-- Background Color Picker -->
		<div class="relative">
			<button
				on:click={() => {
					closeAllDropdowns();
					showBgColorPicker = !showBgColorPicker;
				}}
				disabled={!editor}
				class="toolbar-btn flex items-center space-x-1"
				title="Background color (Ctrl+Shift+H) - Arrow keys to navigate, Enter to confirm"
			>
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
					<path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"/>
				</svg>
				<div class="w-4 h-0.5" style="background-color: {bgColor}"></div>
				<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
					<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
				</svg>
			</button>
			
			{#if showBgColorPicker}
				<div class="color-picker-dropdown scrollbar-thin">
					<div class="px-2 pt-2 pb-1">
						<button
							on:click={() => {
								editor?.chain().focus().unsetHighlight().run();
								showBgColorPicker = false;
							}}
							class="w-full px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
						>
							None (Remove Highlight)
						</button>
					</div>
					<div class="grid grid-cols-10 gap-1 p-2">
						{#each predefinedColors as color, i}
							<button
								class="w-6 h-6 rounded border hover:scale-110 transition-transform"
								class:border-gray-300={i !== bgColorIndex}
								class:border-indigo-600={i === bgColorIndex}
								class:ring-2={i === bgColorIndex}
								class:ring-indigo-400={i === bgColorIndex}
								style="background-color: {color}"
								on:click={() => {
									bgColor = color;
									bgColorIndex = i;
									applyBgColor(color);
									showBgColorPicker = false;
								}}
								title={color}
							></button>
						{/each}
					</div>
					<div class="px-2 pb-2">
						<input
							type="color"
							bind:value={bgColor}
							on:input={() => applyBgColor(bgColor)}
							class="w-full h-8 rounded cursor-pointer"
						/>
					</div>
				</div>
			{/if}
		</div>

		<div class="toolbar-divider"></div>

		<!-- Alignment Buttons -->
		<div class="flex items-center space-x-0.5">
			<button
				on:click={() => editor?.chain().focus().setTextAlign('left').run()}
				disabled={!editor}
				class="toolbar-btn"
				class:active={isActive('textAlign', { textAlign: 'left' })}
				title="Align left (Ctrl+Shift+L)"
			>
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
					<path d="M3 4h14a1 1 0 110 2H3a1 1 0 110-2zm0 4h10a1 1 0 110 2H3a1 1 0 110-2zm0 4h14a1 1 0 110 2H3a1 1 0 110-2zm0 4h10a1 1 0 110 2H3a1 1 0 110-2z"/>
				</svg>
			</button>
			<button
				on:click={() => editor?.chain().focus().setTextAlign('center').run()}
				disabled={!editor}
				class="toolbar-btn"
				class:active={isActive('textAlign', { textAlign: 'center' })}
				title="Align center (Ctrl+Shift+E)"
			>
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
					<path d="M3 4h14a1 1 0 110 2H3a1 1 0 110-2zm3 4h8a1 1 0 110 2H6a1 1 0 110-2zm-3 4h14a1 1 0 110 2H3a1 1 0 110-2zm3 4h8a1 1 0 110 2H6a1 1 0 110-2z"/>
				</svg>
			</button>
			<button
				on:click={() => editor?.chain().focus().setTextAlign('right').run()}
				disabled={!editor}
				class="toolbar-btn"
				class:active={isActive('textAlign', { textAlign: 'right' })}
				title="Align right (Ctrl+Shift+R)"
			>
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
					<path d="M3 4h14a1 1 0 110 2H3a1 1 0 110-2zm4 4h10a1 1 0 110 2H7a1 1 0 110-2zm-4 4h14a1 1 0 110 2H3a1 1 0 110-2zm4 4h10a1 1 0 110 2H7a1 1 0 110-2z"/>
				</svg>
			</button>
		</div>

		<div class="toolbar-divider"></div>

		<!-- Line Height Dropdown -->
		<select
			bind:value={lineHeight}
			on:change={applyLineHeight}
			on:focus={closeAllDropdowns}
			class="toolbar-select-small"
			disabled={!editor}
			title="Line height (Ctrl+&#123; / Ctrl+&#125;)"
		>
			{#each lineHeights as height}
				<option value={height}>{height}</option>
			{/each}
		</select>

		<div class="toolbar-divider"></div>

		<!-- Heading Dropdown -->
		<div class="relative">
			<button
				on:click={() => {
					closeAllDropdowns();
					showHeadingDropdown = !showHeadingDropdown;
				}}
				disabled={!editor}
				class="toolbar-btn flex items-center space-x-1"
				class:active={isActive('heading')}
				title="Headings (Ctrl+Alt+1-6)"
			>
				<span class="text-xs font-semibold">
					{#if isActive('heading', { level: 1 })}
						H1
					{:else if isActive('heading', { level: 2 })}
						H2
					{:else if isActive('heading', { level: 3 })}
						H3
					{:else if isActive('heading', { level: 4 })}
						H4
					{:else if isActive('heading', { level: 5 })}
						H5
					{:else if isActive('heading', { level: 6 })}
						H6
					{:else}
						H
					{/if}
				</span>
				<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
					<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
				</svg>
			</button>
			
			{#if showHeadingDropdown}
				<div class="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 min-w-[140px]">
					<button
						on:click={() => {
							editor?.chain().focus().toggleHeading({ level: 1 }).run();
							showHeadingDropdown = false;
						}}
						class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-semibold"
						class:bg-indigo-50={isActive('heading', { level: 1 })}
						class:dark:bg-indigo-900={isActive('heading', { level: 1 })}
						class:text-indigo-600={isActive('heading', { level: 1 })}
						class:dark:text-indigo-400={isActive('heading', { level: 1 })}
					>
						<span class="text-2xl">H1</span> Heading 1
					</button>
					<button
						on:click={() => {
							editor?.chain().focus().toggleHeading({ level: 2 }).run();
							showHeadingDropdown = false;
						}}
						class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-semibold"
						class:bg-indigo-50={isActive('heading', { level: 2 })}
						class:dark:bg-indigo-900={isActive('heading', { level: 2 })}
						class:text-indigo-600={isActive('heading', { level: 2 })}
						class:dark:text-indigo-400={isActive('heading', { level: 2 })}
					>
						<span class="text-xl">H2</span> Heading 2
					</button>
					<button
						on:click={() => {
							editor?.chain().focus().toggleHeading({ level: 3 }).run();
							showHeadingDropdown = false;
						}}
						class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-semibold"
						class:bg-indigo-50={isActive('heading', { level: 3 })}
						class:dark:bg-indigo-900={isActive('heading', { level: 3 })}
						class:text-indigo-600={isActive('heading', { level: 3 })}
						class:dark:text-indigo-400={isActive('heading', { level: 3 })}
					>
						<span class="text-lg">H3</span> Heading 3
					</button>
					<button
						on:click={() => {
							editor?.chain().focus().toggleHeading({ level: 4 }).run();
							showHeadingDropdown = false;
						}}
						class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-semibold"
						class:bg-indigo-50={isActive('heading', { level: 4 })}
						class:dark:bg-indigo-900={isActive('heading', { level: 4 })}
						class:text-indigo-600={isActive('heading', { level: 4 })}
						class:dark:text-indigo-400={isActive('heading', { level: 4 })}
					>
						<span class="text-base">H4</span> Heading 4
					</button>
					<button
						on:click={() => {
							editor?.chain().focus().toggleHeading({ level: 5 }).run();
							showHeadingDropdown = false;
						}}
						class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-semibold"
						class:bg-indigo-50={isActive('heading', { level: 5 })}
						class:dark:bg-indigo-900={isActive('heading', { level: 5 })}
						class:text-indigo-600={isActive('heading', { level: 5 })}
						class:dark:text-indigo-400={isActive('heading', { level: 5 })}
					>
						<span class="text-sm">H5</span> Heading 5
					</button>
					<button
						on:click={() => {
							editor?.chain().focus().toggleHeading({ level: 6 }).run();
							showHeadingDropdown = false;
						}}
						class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-semibold rounded-b-lg"
						class:bg-indigo-50={isActive('heading', { level: 6 })}
						class:dark:bg-indigo-900={isActive('heading', { level: 6 })}
						class:text-indigo-600={isActive('heading', { level: 6 })}
						class:dark:text-indigo-400={isActive('heading', { level: 6 })}
					>
						<span class="text-xs">H6</span> Heading 6
					</button>
					<div class="border-t border-gray-200 dark:border-gray-700"></div>
					<button
						on:click={() => {
							editor?.chain().focus().setParagraph().run();
							showHeadingDropdown = false;
						}}
						class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm rounded-b-lg"
						class:bg-indigo-50={!isActive('heading')}
						class:dark:bg-indigo-900={!isActive('heading')}
						class:text-indigo-600={!isActive('heading')}
						class:dark:text-indigo-400={!isActive('heading')}
					>
						Normal text
					</button>
				</div>
			{/if}
		</div>

		<div class="toolbar-divider"></div>

		<!-- List Buttons (Bullet, Numbered, Checkbox) -->
		<div class="flex items-center space-x-0.5">
			<button
				on:click={() => editor?.chain().focus().toggleBulletList().run()}
				disabled={!editor}
				class="toolbar-btn"
				class:active={isActive('bulletList')}
				title="Bullet list (Ctrl+Shift+8)"
			>
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
					<path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
				</svg>
			</button>
			<button
				on:click={() => editor?.chain().focus().toggleOrderedList().run()}
				disabled={!editor}
				class="toolbar-btn"
				class:active={isActive('orderedList')}
				title="Numbered list (Ctrl+Shift+7)"
			>
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
					<path d="M3 4h1v1H3V4zm2 0h12a1 1 0 110 2H5V4zM3 8h1v1H3V8zm2 0h12a1 1 0 110 2H5V8zM3 12h1v1H3v-1zm2 0h12a1 1 0 110 2H5v-2zM3 16h1v1H3v-1zm2 0h12a1 1 0 110 2H5v-2z"/>
				</svg>
			</button>
			<button
				on:click={toggleCheckbox}
				disabled={!editor}
				class="toolbar-btn"
				class:active={isActive('taskList')}
				title="Checkbox list (Ctrl+Shift+X)"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
				</svg>
			</button>
		</div>

		<div class="toolbar-divider"></div>

		<!-- Indent Buttons -->
		<div class="flex items-center space-x-0.5">
			<button
				on:click={decreaseIndent}
				disabled={!editor}
				class="toolbar-btn"
				title="Decrease indent (Ctrl+[)"
			>
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
					<path d="M3 4h14a1 1 0 110 2H3a1 1 0 110-2zm4 4h10a1 1 0 110 2H7a1 1 0 110-2zm0 4h10a1 1 0 110 2H7a1 1 0 110-2zm0 4h10a1 1 0 110 2H7a1 1 0 110-2zM3 8l3 2-3 2V8z"/>
				</svg>
			</button>
			<button
				on:click={increaseIndent}
				disabled={!editor}
				class="toolbar-btn"
				title="Increase indent (Ctrl+])"
			>
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
					<path d="M3 4h14a1 1 0 110 2H3a1 1 0 110-2zm4 4h10a1 1 0 110 2H7a1 1 0 110-2zm0 4h10a1 1 0 110 2H7a1 1 0 110-2zm0 4h10a1 1 0 110 2H7a1 1 0 110-2zM3 12l3-2v4l-3-2z"/>
				</svg>
			</button>
		</div>

		<div class="toolbar-divider"></div>

		<!-- Insert Buttons (Link, Image) -->
		<div class="flex items-center space-x-0.5">
			<button
				on:click={openLinkDialog}
				disabled={!editor}
				class="toolbar-btn"
				class:active={isActive('link')}
				title="Insert link (Ctrl+K)"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
				</svg>
			</button>
			<button
				on:click={insertImage}
				disabled={!editor}
				class="toolbar-btn"
				title="Insert image (Ctrl+Shift+I)"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
				</svg>
			</button>
			<button
				on:click={() => editor?.chain().focus().toggleCodeBlock().run()}
				disabled={!editor}
				class="toolbar-btn"
				class:active={isActive('codeBlock')}
				title="Code block (Ctrl+Shift+K)"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
				</svg>
			</button>
			<button
				on:click={() => editor?.chain().focus().setHorizontalRule().run()}
				disabled={!editor}
				class="toolbar-btn"
				title="Horizontal line (Ctrl+Shift+_)"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
				</svg>
			</button>
		</div>

		<div class="toolbar-divider"></div>

		<!-- Print Button -->
		<button
			on:click={printDocument}
			disabled={!editor}
			class="toolbar-btn"
			title="Print document (Ctrl+P)"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
			</svg>
		</button>
	</div>

	<!-- Link Dialog -->
	{#if showLinkDialog}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click={closeAllDropdowns}>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96" on:click|stopPropagation>
				<h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Insert Link</h3>
				
				<div class="space-y-4">
					<div>
						<label for="link-text" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Text
						</label>
						<input
							id="link-text"
							type="text"
							bind:value={linkText}
							placeholder="Link text (optional)"
							class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
						/>
					</div>
					
					<div>
						<label for="link-url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							URL
						</label>
						<input
							id="link-url"
							type="url"
							bind:value={linkUrl}
							placeholder="https://example.com"
							class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
							on:keydown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									insertLink();
								}
							}}
						/>
					</div>
				</div>

				<div class="flex justify-between mt-6">
					<button
						on:click={removeLink}
						class="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
					>
						Remove Link
					</button>
					<div class="flex space-x-2">
						<button
							on:click={closeAllDropdowns}
							class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
						>
							Cancel
						</button>
						<button
							on:click={insertLink}
							class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
						>
							Insert
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Image Dialog -->
	{#if showImageDialog}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click={closeAllDropdowns}>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96" on:click|stopPropagation>
				<h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Insert Image</h3>
				
				<div class="space-y-4">
					<div>
						<label for="image-file" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Upload from Computer
						</label>
						<input
							id="image-file"
							type="file"
							accept="image/*"
							on:change={handleImageFileSelect}
							class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-300"
						/>
						{#if imageFile}
							<p class="mt-2 text-sm text-green-600 dark:text-green-400">Selected: {imageFile.name}</p>
						{/if}
					</div>
					
					<div class="relative flex items-center">
						<div class="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
						<span class="flex-shrink mx-4 text-sm text-gray-500 dark:text-gray-400">OR</span>
						<div class="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
					</div>
					
					<div>
						<label for="image-url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Image URL
						</label>
						<input
							id="image-url"
							type="url"
							bind:value={imageUrl}
							placeholder="https://example.com/image.jpg"
							class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
							on:input={() => {
								if (imageUrl) imageFile = null;
							}}
							on:keydown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									confirmInsertImage();
								}
							}}
						/>
					</div>

					{#if imageUrl || imageFile}
						<div class="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
							<p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
							<div class="flex justify-center">
								<img 
									src={imageFile ? URL.createObjectURL(imageFile) : imageUrl} 
									alt="Preview" 
									class="max-h-40 rounded border border-gray-300 dark:border-gray-600"
									on:error={() => {}}
								/>
							</div>
						</div>
					{/if}
				</div>

				<div class="flex justify-end mt-6 space-x-2">
					<button
						on:click={closeAllDropdowns}
						class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
					>
						Cancel
					</button>
					<button
						on:click={confirmInsertImage}
						disabled={!imageUrl && !imageFile}
						class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
					>
						Insert
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.toolbar-btn {
		padding: 0.375rem 0.625rem;
		font-size: 0.875rem;
		border-radius: 0.375rem;
		transition: all 0.2s;
		opacity: 1;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 32px;
		height: 32px;
		color: var(--color-textSecondary);
	}
	
	.toolbar-btn:hover:not(:disabled) {
		background-color: var(--color-bgTertiary);
	}
	
	.toolbar-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.toolbar-btn.active {
		background-color: var(--color-accentLight);
		color: var(--color-accent);
	}

	.toolbar-btn svg {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
	}

	.toolbar-divider {
		width: 1px;
		height: 1.5rem;
		margin: 0 0.5rem;
		background-color: var(--color-border);
		flex-shrink: 0;
		opacity: 0.5;
	}

	.toolbar-select {
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
		border-radius: 0.375rem;
		transition: all 0.2s;
		cursor: pointer;
		min-width: 140px;
		background-color: var(--color-bgSecondary);
		color: var(--color-textSecondary);
		border: 1px solid var(--color-border);
	}
	
	.toolbar-select:hover:not(:disabled) {
		background-color: var(--color-bgTertiary);
	}
	
	.toolbar-select:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.toolbar-select-small {
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
		border-radius: 0.375rem;
		transition: all 0.2s;
		cursor: pointer;
		min-width: 60px;
		background-color: var(--color-bgSecondary);
		color: var(--color-textSecondary);
		border: 1px solid var(--color-border);
	}
	
	.toolbar-select-small:hover:not(:disabled) {
		background-color: var(--color-bgTertiary);
	}
	
	.toolbar-select-small:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.color-picker-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		margin-top: 0.25rem;
		border-radius: 0.5rem;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
		z-index: 50;
		min-width: 280px;
		background-color: var(--color-bgSecondary);
		border: 1px solid var(--color-border);
	}
</style>
