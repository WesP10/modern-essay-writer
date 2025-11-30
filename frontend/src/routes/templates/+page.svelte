<script lang="ts">
	import { goto } from '$app/navigation';
	import { EssayStorage, type EssayData } from '$lib/utils/storage';

	interface Template {
		id: string;
		name: string;
		description: string;
		icon: string;
		structure: string;
	}

	const templates: Template[] = [
		{
			id: 'argumentative',
			name: 'Argumentative Essay',
			description: 'Present and defend a specific position on a topic',
			icon: '⚖️',
			structure: `# Essay Title

## Introduction
[Hook and thesis statement]

## Body Paragraph 1
[First main argument]

## Body Paragraph 2
[Second main argument]

## Counterargument
[Address opposing views]

## Conclusion
[Restate thesis and summarize]`
		},
		{
			id: 'research',
			name: 'Research Paper',
			description: 'In-depth analysis of a topic with citations',
			icon: '🔬',
			structure: `# Research Paper Title

## Abstract
[Brief summary of research]

## Introduction
[Background and research question]

## Literature Review
[Review of existing research]

## Methodology
[Research methods used]

## Results
[Findings]

## Discussion
[Analysis of results]

## Conclusion
[Summary and implications]

## References
[Citations]`
		},
		{
			id: 'creative',
			name: 'Creative Writing',
			description: 'Narrative or descriptive writing piece',
			icon: '🎨',
			structure: `# Story Title

## Opening
[Set the scene]

## Rising Action
[Build the story]

## Climax
[Peak of the story]

## Resolution
[Conclude the narrative]`
		},
		{
			id: 'analytical',
			name: 'Analytical Essay',
			description: 'Analyze and interpret a text or concept',
			icon: '🔍',
			structure: `# Analytical Essay Title

## Introduction
[Introduce the text/concept and thesis]

## Analysis Point 1
[First analytical observation]

## Analysis Point 2
[Second analytical observation]

## Analysis Point 3
[Third analytical observation]

## Conclusion
[Synthesize analysis]`
		},
		{
			id: 'blank',
			name: 'Blank Document',
			description: 'Start from scratch with no template',
			icon: '📄',
			structure: ''
		}
	];

	async function selectTemplate(template: Template) {
		const essayId = Date.now().toString();
		// Store template structure using the new storage system
		const essayData: EssayData = {
			id: essayId,
			title: template.name,
			content: template.structure,
			created: new Date().toISOString(),
			modified: new Date().toISOString()
		};
		await EssayStorage.saveEssay(essayData);
		goto(`/editor/${essayId}`);
	}
</script>

<svelte:head>
	<title>Templates - EssayForge</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-auto scrollbar-overlay">
	<!-- Navbar -->
	<nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
		<div class="container mx-auto px-4 py-4">
			<div class="flex items-center justify-between">
				<a href="/" class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
					✍️ EssayForge
				</a>
				<a
					href="/"
					class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
				>
					← Back to Home
				</a>
			</div>
		</div>
	</nav>

	<!-- Templates Grid -->
	<div class="container mx-auto px-4 py-12">
		<div class="mb-8">
			<h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
				Choose a Template
			</h1>
			<p class="text-gray-600 dark:text-gray-300">
				Select a template to get started with a pre-structured outline
			</p>
		</div>

		<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each templates as template}
				<button
					on:click={() => selectTemplate(template)}
					class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow duration-200 text-left border-2 border-transparent hover:border-indigo-500"
				>
					<div class="text-5xl mb-4">{template.icon}</div>
					<h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
						{template.name}
					</h3>
					<p class="text-gray-600 dark:text-gray-300 text-sm">
						{template.description}
					</p>
				</button>
			{/each}
		</div>
	</div>
</div>
