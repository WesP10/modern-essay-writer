<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { EssayStorage, type EssayData } from '$lib/utils/storage';
	import { user, authActions, isAuthenticated } from '$lib/stores/auth';
	import { isFirebaseConfigured } from '$lib/firebaseClient';

	let essays: EssayData[] = [];
	let storageInfo = { used: 0, total: 0, percentage: 0 };

	onMount(() => {
		loadEssays();
		storageInfo = EssayStorage.getStorageInfo();
	});

	async function loadEssays() {
		essays = await EssayStorage.getAllEssays();
	}

	function createNewEssay() {
		const essayId = Date.now().toString();
		goto(`/editor/${essayId}`);
	}

	function openEssay(id: string) {
		goto(`/editor/${id}`);
	}

	async function deleteEssay(id: string, event: Event) {
		event.stopPropagation();
		if (confirm('Are you sure you want to delete this essay?')) {
			await EssayStorage.deleteEssay(id);
			loadEssays();
			storageInfo = EssayStorage.getStorageInfo();
		}
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
		if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
		if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
		
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / 1048576).toFixed(1) + ' MB';
	}
</script>

<svelte:head>
	<title>EssayForge - Modern Essay Writer</title>
</svelte:head>

<div class="min-h-screen overflow-auto scrollbar-overlay" style="background: linear-gradient(to bottom right, var(--color-bgPrimary), var(--color-bgTertiary));">
	<div class="container mx-auto px-4 py-16">
		<!-- Header with Auth -->
		<div class="flex items-center justify-between mb-8">
			<div class="text-center flex-1">
				<h1 class="text-6xl font-bold mb-4" style="color: var(--color-textPrimary);">
					✍️ EssayForge
				</h1>
				<p class="text-xl" style="color: var(--color-textSecondary);">
					Your modern essay writing companion
				</p>
			</div>
			
			<!-- Auth Status -->
			{#if isFirebaseConfigured}
				<div class="absolute top-4 right-4">
					{#if $isAuthenticated && $user}
						<div class="flex items-center space-x-4 px-4 py-2 rounded-lg" style="background-color: var(--color-bgSecondary);">
							<span class="text-sm" style="color: var(--color-textSecondary);">
								{$user.email}
							</span>
							<button
								on:click={() => authActions.signOut()}
								class="text-sm hover:underline"
								style="color: var(--color-error);"
							>
								Sign Out
							</button>
						</div>
					{:else}
						<a
							href="/auth"
							class="px-4 py-2 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
							style="background-color: var(--color-accent);"
						>
							Sign In
						</a>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Main Actions -->
		<div class="max-w-6xl mx-auto">
			<div class="rounded-lg shadow-xl p-8 mb-8" style="background-color: var(--color-bgSecondary);">
				<h2 class="text-2xl font-semibold mb-6" style="color: var(--color-textPrimary);">
					Get Started
				</h2>
				<div class="grid md:grid-cols-2 gap-6">
					<!-- New Essay Button -->
					<button
						on:click={createNewEssay}
						class="font-semibold py-6 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:opacity-90 text-white"
						style="background-color: var(--color-accent);"
					>
						<div class="text-4xl mb-2">📝</div>
						<div class="text-lg">Start New Essay</div>
					</button>

					<!-- Templates Button -->
					<a
						href="/templates"
						class="font-semibold py-6 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:opacity-90 text-center text-white"
						style="background-color: var(--color-accentHover); display: block;"
					>
						<div class="text-4xl mb-2">📋</div>
						<div class="text-lg">Browse Templates</div>
					</a>
				</div>
			</div>

			<!-- Recent Essays -->
			{#if essays.length > 0}
				<div class="rounded-lg shadow-xl p-8 mb-8" style="background-color: var(--color-bgSecondary);">
					<div class="flex items-center justify-between mb-6">
						<h2 class="text-2xl font-semibold" style="color: var(--color-textPrimary);">
							Recent Essays
						</h2>
						<span class="text-sm" style="color: var(--color-textTertiary);">
							{essays.length} essay{essays.length !== 1 ? 's' : ''}
						</span>
					</div>

					<div class="space-y-3">
						{#each essays as essay}
							<div
								class="w-full rounded-lg p-4 transition-all duration-150 group relative hover:shadow-md"
								style="background-color: var(--color-bgTertiary);"
							>
								<div class="flex items-start justify-between">
									<button
										on:click={() => openEssay(essay.id)}
										class="flex-1 min-w-0 text-left"
									>
										<h3 class="font-semibold text-lg truncate transition-colors" style="color: var(--color-textPrimary);">
											{essay.title || 'Untitled Essay'}
										</h3>
										<div class="flex items-center space-x-4 mt-2 text-sm" style="color: var(--color-textSecondary);">
											<span>📝 {essay.wordCount || 0} words</span>
											<span>•</span>
											<span>🕒 {formatDate(essay.modified)}</span>
										</div>
									</button>
									<button
										on:click={(e) => deleteEssay(essay.id, e)}
										class="ml-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:scale-110"
										style="color: var(--color-error);"
										title="Delete essay"
									>
										🗑️
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Storage Info -->
			{#if storageInfo.percentage > 50}
				<div class="rounded-lg p-4 mb-8" style="background-color: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3);">
					<div class="flex items-start">
						<span class="text-2xl mr-3">⚠️</span>
						<div class="flex-1">
							<h3 class="font-semibold mb-1" style="color: var(--color-warning);">
								Storage Warning
							</h3>
							<p class="text-sm mb-2" style="color: var(--color-textSecondary);">
								You're using {formatBytes(storageInfo.used)} of ~{formatBytes(storageInfo.total)} 
								({storageInfo.percentage.toFixed(1)}%) of browser storage.
							</p>
							<p class="text-xs" style="color: var(--color-textTertiary);">
								Consider deleting old essays or exporting them to free up space.
							</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Features -->
			<div class="grid md:grid-cols-3 gap-6">
				<div class="rounded-lg p-6 shadow-md" style="background-color: var(--color-bgSecondary);">
					<div class="text-3xl mb-3">✨</div>
					<h3 class="font-semibold text-lg mb-2" style="color: var(--color-textPrimary);">
						Rich Text Editor
					</h3>
					<p class="text-sm" style="color: var(--color-textSecondary);">
						Powerful formatting tools at your fingertips
					</p>
				</div>

				<div class="rounded-lg p-6 shadow-md" style="background-color: var(--color-bgSecondary);">
					<div class="text-3xl mb-3">💾</div>
					<h3 class="font-semibold text-lg mb-2" style="color: var(--color-textPrimary);">
						Auto-Save & History
					</h3>
					<p class="text-sm" style="color: var(--color-textSecondary);">
						Never lose your work with automatic saving and version history
					</p>
				</div>

				<div class="rounded-lg p-6 shadow-md" style="background-color: var(--color-bgSecondary);">
					<div class="text-3xl mb-3">📤</div>
					<h3 class="font-semibold text-lg mb-2" style="color: var(--color-textPrimary);">
						Export Options
					</h3>
					<p class="text-sm" style="color: var(--color-textSecondary);">
						Download in multiple formats (.txt, .md, .docx)
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
