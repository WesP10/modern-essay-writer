<script lang="ts">
	import { onMount } from 'svelte';
	import { isAuthenticated } from '$lib/stores/auth';
	import { initSession, getSessionStatus, type SessionStatus } from '$lib/utils/api';
	import PanelTabs from './PanelTabs.svelte';
	import PromptPanel from './PromptPanel.svelte';
	import HumanizerPanel from './HumanizerPanel.svelte';
	import DetectorPanel from './DetectorPanel.svelte';
	import CitationPanel from './CitationPanel.svelte';
	import type { Editor } from '@tiptap/core';
	
	export let onClose: () => void;
	export let editor: Editor | null = null;
	
	let activeTab: 'prompt' | 'humanizer' | 'detector' | 'citations' = 'prompt';
	let sessionStatus: SessionStatus | null = null;
	let loading = true;
	let error: string | null = null;
	let pollInterval: ReturnType<typeof setInterval> | null = null;
	
	// Initialize session on mount
	onMount(() => {
		initializeSession();
		
		// Poll session status every 60 seconds when panel is active
		pollInterval = setInterval(() => {
			if ($isAuthenticated) {
				refreshSessionStatus();
			}
		}, 60000);
		
		return () => {
			if (pollInterval) {
				clearInterval(pollInterval);
			}
		};
	});
	
	async function initializeSession() {
		if (!$isAuthenticated) {
			loading = false;
			return;
		}
		
		try {
			loading = true;
			error = null;
			sessionStatus = await initSession();
		} catch (err) {
			console.error('Failed to initialize session:', err);
			error = 'Failed to initialize AI session';
		} finally {
			loading = false;
		}
	}
	
	async function refreshSessionStatus() {
		if (!$isAuthenticated) return;
		
		try {
			sessionStatus = await getSessionStatus();
		} catch (err) {
			console.error('Failed to refresh session status:', err);
		}
	}
	
	function handleTabChange(tab: typeof activeTab) {
		activeTab = tab;
	}
	
	$: sessionActive = sessionStatus?.sessionActive ?? false;
	$: tokensRemaining = sessionStatus?.tokensRemaining ?? 0;
	$: canUseServices = sessionStatus?.canUseServices ?? false;
	$: rateLimitMinute = sessionStatus?.rateLimit?.minute ?? 0;
	$: rateLimitHour = sessionStatus?.rateLimit?.hour ?? 0;
</script>

<div class="flex flex-col h-full">
	<!-- Header with close button and token display -->
	<div class="flex items-center justify-between px-4 py-2" style="border-bottom: 1px solid var(--color-border); background-color: var(--color-bgSecondary);">
		<div class="flex flex-col">
			<h2 class="text-sm font-semibold" style="color: var(--color-textSecondary);">
				AI Tools
			</h2>
			{#if $isAuthenticated && sessionStatus}
				<div class="text-xs mt-1" style="color: var(--color-textTertiary);">
					<span class:text-red-500={tokensRemaining < 100} class:text-yellow-500={tokensRemaining >= 100 && tokensRemaining < 300}>
						Tokens: {tokensRemaining}/1000
					</span>
					{#if rateLimitMinute > 0 || rateLimitHour > 0}
						<span class="ml-2">• {rateLimitMinute}/10 per min</span>
					{/if}
				</div>
			{/if}
		</div>
		<button
			on:click={onClose}
			class="text-xl hover:opacity-70 transition-opacity"
			style="color: var(--color-textTertiary);"
			title="Close sidebar"
		>
			×
		</button>
	</div>
	
	<!-- Loading/Error/Auth states -->
	{#if loading}
		<div class="flex items-center justify-center p-8">
			<div class="text-sm" style="color: var(--color-textTertiary);">
				Initializing AI session...
			</div>
		</div>
	{:else if !$isAuthenticated}
		<div class="flex flex-col items-center justify-center p-8 text-center">
			<div class="text-sm mb-4" style="color: var(--color-textSecondary);">
				Sign in to access AI features
			</div>
			<a
				href="/auth"
				class="px-4 py-2 rounded text-sm font-medium"
				style="background-color: var(--color-accent); color: white;"
			>
				Sign In
			</a>
		</div>
	{:else if error}
		<div class="flex flex-col items-center justify-center p-8 text-center">
			<div class="text-sm text-red-500 mb-4">
				{error}
			</div>
			<button
				on:click={initializeSession}
				class="px-4 py-2 rounded text-sm font-medium"
				style="background-color: var(--color-accent); color: white;"
			>
				Retry
			</button>
		</div>
	{:else}
		<!-- Tabs and content -->
		<PanelTabs {activeTab} onTabChange={handleTabChange}>
			{#if activeTab === 'prompt'}
				<PromptPanel {editor} {sessionActive} {canUseServices} on:tokensUpdated={refreshSessionStatus} />
			{:else if activeTab === 'humanizer'}
				<HumanizerPanel {editor} {sessionActive} {canUseServices} on:tokensUpdated={refreshSessionStatus} />
			{:else if activeTab === 'detector'}
				<DetectorPanel {editor} {sessionActive} {canUseServices} on:tokensUpdated={refreshSessionStatus} />
			{:else if activeTab === 'citations'}
				<CitationPanel {editor} {sessionActive} {canUseServices} on:tokensUpdated={refreshSessionStatus} />
			{/if}
		</PanelTabs>
	{/if}
</div>
