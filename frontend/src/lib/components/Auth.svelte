<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase, isSupabaseConfigured } from '$lib/supabaseClient';
	import { Auth } from '@supabase/auth-ui-svelte';
	import { ThemeSupa } from '@supabase/auth-ui-shared';
	import type { Session } from '@supabase/supabase-js';

	export let session: Session | null = null;

	onMount(() => {
		if (!isSupabaseConfigured || !supabase) {
			console.log('Supabase not configured - running in local-only mode');
			return;
		}

		supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
			session = currentSession;
		});

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, newSession) => {
			session = newSession;
		});

		return () => subscription.unsubscribe();
	});

	async function signOut() {
		if (supabase) {
			await supabase.auth.signOut();
		}
	}
</script>

{#if !isSupabaseConfigured}
	<!-- Supabase not configured - show info message -->
	<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
		<div class="flex items-start">
			<span class="text-2xl mr-3">ℹ️</span>
			<div class="flex-1">
				<h3 class="font-semibold text-blue-800 dark:text-blue-200 mb-1">
					Local Mode
				</h3>
				<p class="text-sm text-blue-700 dark:text-blue-300 mb-2">
					Cloud sync is not configured. Your essays are saved locally in your browser.
				</p>
				<p class="text-xs text-blue-600 dark:text-blue-400">
					To enable cloud sync, see <code class="bg-blue-100 dark:bg-blue-900 px-1 rounded">docs/SUPABASE_SETUP.md</code>
				</p>
			</div>
		</div>
	</div>
{:else if !session}
	<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
		<div class="w-full max-w-md">
			<div class="text-center mb-8">
				<h1 class="text-5xl font-bold text-gray-900 dark:text-white mb-2">
					✍️ EssayForge
				</h1>
				<p class="text-gray-600 dark:text-gray-300">
					Sign in to sync your essays to the cloud
				</p>
			</div>

			<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
				<Auth
					supabaseClient={supabase}
					appearance={{ theme: ThemeSupa }}
					providers={['google', 'github']}
					redirectTo={typeof window !== 'undefined' ? window.location.origin : ''}
					theme="auto"
				/>
			</div>

			<div class="text-center mt-6">
				<a href="/" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
					← Continue without signing in (local storage only)
				</a>
			</div>
		</div>
	</div>
{:else}
	<div class="flex items-center space-x-4">
		<span class="text-sm text-gray-600 dark:text-gray-300">
			{session.user.email}
		</span>
		<button
			on:click={signOut}
			class="text-sm text-red-600 dark:text-red-400 hover:underline"
		>
			Sign Out
		</button>
	</div>
{/if}
