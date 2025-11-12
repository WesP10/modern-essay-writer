// Export utility for essays

export interface ExportOptions {
	format: 'txt' | 'md' | 'html';
	title: string;
	content: string;
	includeMetadata?: boolean;
	metadata?: {
		author?: string;
		wordCount?: number;
		created?: string;
		modified?: string;
	};
}

export class ExportService {
	// Convert HTML content to Markdown
	static htmlToMarkdown(html: string): string {
		let markdown = html;

		// Headers
		markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
		markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
		markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');

		// Bold and italic
		markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
		markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
		markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
		markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

		// Strike through
		markdown = markdown.replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~');
		markdown = markdown.replace(/<strike[^>]*>(.*?)<\/strike>/gi, '~~$1~~');

		// Lists
		markdown = markdown.replace(/<ul[^>]*>/gi, '\n');
		markdown = markdown.replace(/<\/ul>/gi, '\n');
		markdown = markdown.replace(/<ol[^>]*>/gi, '\n');
		markdown = markdown.replace(/<\/ol>/gi, '\n');
		markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

		// Paragraphs
		markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

		// Line breaks
		markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

		// Remove remaining HTML tags
		markdown = markdown.replace(/<[^>]+>/g, '');

		// Decode HTML entities
		markdown = markdown.replace(/&nbsp;/g, ' ');
		markdown = markdown.replace(/&amp;/g, '&');
		markdown = markdown.replace(/&lt;/g, '<');
		markdown = markdown.replace(/&gt;/g, '>');
		markdown = markdown.replace(/&quot;/g, '"');

		// Clean up extra whitespace
		markdown = markdown.replace(/\n{3,}/g, '\n\n');
		markdown = markdown.trim();

		return markdown;
	}

	// Extract plain text from HTML
	static htmlToPlainText(html: string): string {
		// Create a temporary div to parse HTML
		if (typeof document !== 'undefined') {
			const temp = document.createElement('div');
			temp.innerHTML = html;
			return temp.textContent || temp.innerText || '';
		}

		// Fallback for server-side or when document is not available
		let text = html;
		text = text.replace(/<br\s*\/?>/gi, '\n');
		text = text.replace(/<\/p>/gi, '\n\n');
		text = text.replace(/<\/h[1-6]>/gi, '\n\n');
		text = text.replace(/<li[^>]*>/gi, '\n• ');
		text = text.replace(/<[^>]+>/g, '');
		text = text.replace(/&nbsp;/g, ' ');
		text = text.replace(/&amp;/g, '&');
		text = text.replace(/&lt;/g, '<');
		text = text.replace(/&gt;/g, '>');
		text = text.replace(/&quot;/g, '"');
		text = text.replace(/\n{3,}/g, '\n\n');
		return text.trim();
	}

	// Generate metadata header for exports
	static generateMetadata(options: ExportOptions): string {
		if (!options.includeMetadata || !options.metadata) {
			return '';
		}

		const lines: string[] = [];
		if (options.format === 'md') {
			lines.push('---');
			lines.push(`title: "${options.title}"`);
			if (options.metadata.author) lines.push(`author: "${options.metadata.author}"`);
			if (options.metadata.wordCount) lines.push(`word_count: ${options.metadata.wordCount}`);
			if (options.metadata.created) lines.push(`created: "${options.metadata.created}"`);
			if (options.metadata.modified) lines.push(`modified: "${options.metadata.modified}"`);
			lines.push('---');
			lines.push('');
			return lines.join('\n');
		}

		return '';
	}

	// Export as specified format
	static export(options: ExportOptions): { content: string; filename: string; mimeType: string } {
		let content = '';
		let mimeType = '';
		let extension = '';

		switch (options.format) {
			case 'txt':
				content = this.htmlToPlainText(options.content);
				if (options.title) {
					content = `${options.title}\n${'='.repeat(options.title.length)}\n\n${content}`;
				}
				mimeType = 'text/plain';
				extension = 'txt';
				break;

			case 'md':
				content = this.htmlToMarkdown(options.content);
				const metadata = this.generateMetadata(options);
				if (metadata) {
					content = `${metadata}\n# ${options.title}\n\n${content}`;
				} else {
					content = `# ${options.title}\n\n${content}`;
				}
				mimeType = 'text/markdown';
				extension = 'md';
				break;

			case 'html':
				content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        h1, h2, h3 { margin-top: 1.5em; margin-bottom: 0.5em; }
        p { margin-bottom: 1em; }
        ul, ol { margin-bottom: 1em; padding-left: 2em; }
    </style>
</head>
<body>
    <h1>${options.title}</h1>
    ${options.content}
</body>
</html>`;
				mimeType = 'text/html';
				extension = 'html';
				break;
		}

		const filename = `${options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;

		return { content, filename, mimeType };
	}

	// Download file
	static downloadFile(content: string, filename: string, mimeType: string): void {
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	// Copy to clipboard
	static async copyToClipboard(content: string): Promise<boolean> {
		try {
			await navigator.clipboard.writeText(content);
			return true;
		} catch (err) {
			console.error('Failed to copy to clipboard:', err);
			return false;
		}
	}
}
