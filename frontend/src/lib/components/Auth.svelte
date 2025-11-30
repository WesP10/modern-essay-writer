<script lang="ts">
	import { authActions, authError, user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { isFirebaseConfigured } from '$lib/firebaseClient';

	let email = '';
	let password = '';
	let confirmPassword = '';
	let isLogin = true;
	let loading = false;
	let successMessage = '';

	async function handleSubmit() {
		if (loading) return;

		// Validation
		if (!email || !password) {
			$authError = 'Please fill in all fields';
			return;
		}

		if (!isLogin && password !== confirmPassword) {
			$authError = 'Passwords do not match';
			return;
		}

		if (!isLogin && password.length < 6) {
			$authError = 'Password must be at least 6 characters';
			return;
		}

		loading = true;
		successMessage = '';

		try {
			if (isLogin) {
				const result = await authActions.signIn(email, password);
				if (result.success) {
					goto('/');
				}
			} else {
				const result = await authActions.signUp(email, password);
				if (result.success) {
					successMessage = 'Account created successfully!';
					setTimeout(() => goto('/'), 1500);
				}
			}
		} finally {
			loading = false;
		}
	}

	async function handleGoogleSignIn() {
		if (loading) return;
		
		loading = true;
		const result = await authActions.signInWithGoogle();
		if (result.success) {
			goto('/');
		}
		loading = false;
	}

	async function handlePasswordReset() {
		if (!email) {
			$authError = 'Please enter your email address';
			return;
		}

		loading = true;
		const result = await authActions.resetPassword(email);
		loading = false;

		if (result.success) {
			successMessage = 'Password reset email sent! Check your inbox.';
		}
	}

	function toggleMode() {
		isLogin = !isLogin;
		$authError = null;
		successMessage = '';
		confirmPassword = '';
	}

	async function handleSignOut() {
		await authActions.signOut();
	}
</script>

{#if !isFirebaseConfigured}
	<!-- Firebase not configured - show info message -->
	<div class="rounded-lg p-4" style="background-color: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3);">
		<div class="flex items-start">
			<span class="text-2xl mr-3">ℹ️</span>
			<div class="flex-1">
				<h3 class="font-semibold mb-1" style="color: var(--color-accent);">
					Local Mode
				</h3>
				<p class="text-sm mb-2" style="color: var(--color-textSecondary);">
					Cloud sync is not configured. Your essays are saved locally in your browser.
				</p>
				<p class="text-xs" style="color: var(--color-textTertiary);">
					To enable cloud sync, see <code class="px-1 rounded" style="background-color: var(--color-bgTertiary);">docs/FIREBASE_SETUP.md</code>
				</p>
			</div>
		</div>
	</div>
{:else if !$user}
	<!-- Sign In/Sign Up Form -->
	<div class="max-w-md mx-auto">
		<div class="text-center mb-8">
			<h2 class="text-3xl font-bold mb-2" style="color: var(--color-textPrimary);">
				{isLogin ? 'Welcome Back' : 'Create Account'}
			</h2>
			<p style="color: var(--color-textSecondary);">
				{isLogin ? 'Sign in to sync your essays' : 'Start your essay journey'}
			</p>
		</div>

		<div class="rounded-lg shadow-xl p-8" style="background-color: var(--color-bgSecondary);">
			<form on:submit|preventDefault={handleSubmit}>
				<!-- Email Input -->
				<div class="mb-4">
					<label for="email" class="block text-sm font-medium mb-2" style="color: var(--color-textPrimary);">
						Email
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						class="w-full px-4 py-2 rounded-lg border transition-colors"
						style="background-color: var(--color-bgTertiary); 
						       border-color: var(--color-border); 
						       color: var(--color-textPrimary);"
						placeholder="you@example.com"
						disabled={loading}
					/>
				</div>

				<!-- Password Input -->
				<div class="mb-4">
					<label for="password" class="block text-sm font-medium mb-2" style="color: var(--color-textPrimary);">
						Password
					</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						class="w-full px-4 py-2 rounded-lg border transition-colors"
						style="background-color: var(--color-bgTertiary); 
						       border-color: var(--color-border); 
						       color: var(--color-textPrimary);"
						placeholder="••••••••"
						disabled={loading}
					/>
				</div>

				<!-- Confirm Password (Sign Up only) -->
				{#if !isLogin}
					<div class="mb-4">
						<label for="confirmPassword" class="block text-sm font-medium mb-2" style="color: var(--color-textPrimary);">
							Confirm Password
						</label>
						<input
							id="confirmPassword"
							type="password"
							bind:value={confirmPassword}
							class="w-full px-4 py-2 rounded-lg border transition-colors"
							style="background-color: var(--color-bgTertiary); 
							       border-color: var(--color-border); 
							       color: var(--color-textPrimary);"
							placeholder="••••••••"
							disabled={loading}
						/>
					</div>
				{/if}

				<!-- Error Message -->
				{#if $authError}
					<div class="mb-4 p-3 rounded-lg" style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);">
						<p class="text-sm" style="color: var(--color-error);">
							{$authError}
						</p>
					</div>
				{/if}

				<!-- Success Message -->
				{#if successMessage}
					<div class="mb-4 p-3 rounded-lg" style="background-color: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3);">
						<p class="text-sm" style="color: var(--color-success);">
							{successMessage}
						</p>
					</div>
				{/if}

				<!-- Submit Button -->
				<button
					type="submit"
					class="w-full py-3 px-4 rounded-lg font-semibold text-white transition-opacity mb-4"
					style="background-color: var(--color-accent);"
					class:opacity-50={loading}
					disabled={loading}
				>
					{loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
				</button>

				<!-- Forgot Password (Login only) -->
				{#if isLogin}
					<button
						type="button"
						on:click={handlePasswordReset}
						class="text-sm w-full text-center mb-4 hover:underline"
						style="color: var(--color-accent);"
						disabled={loading}
					>
						Forgot password?
					</button>
				{/if}

				<!-- Divider -->
				<div class="relative mb-4">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t" style="border-color: var(--color-border);"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="px-2" style="background-color: var(--color-bgSecondary); color: var(--color-textSecondary);">
							Or continue with
						</span>
					</div>
				</div>

				<!-- Google Sign In -->
				<button
					type="button"
					on:click={handleGoogleSignIn}
					class="w-full py-3 px-4 rounded-lg font-semibold border transition-all hover:shadow-md"
					style="background-color: var(--color-bgTertiary); 
					       border-color: var(--color-border); 
					       color: var(--color-textPrimary);"
					disabled={loading}
				>
					<span class="flex items-center justify-center">
						<svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
							<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
							<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
							<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
							<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
						</svg>
						Continue with Google
					</span>
				</button>
			</form>

			<!-- Toggle Mode -->
			<div class="mt-6 text-center">
				<button
					type="button"
					on:click={toggleMode}
					class="text-sm hover:underline"
					style="color: var(--color-textSecondary);"
					disabled={loading}
				>
					{isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
				</button>
			</div>
		</div>

		<div class="text-center mt-6">
			<a href="/" class="text-sm hover:underline" style="color: var(--color-textTertiary);">
				← Continue without signing in (local storage only)
			</a>
		</div>
	</div>
{:else}
	<!-- Signed In -->
	<div class="flex items-center space-x-4">
		<span class="text-sm" style="color: var(--color-textSecondary);">
			{$user.email}
		</span>
		<button
			on:click={handleSignOut}
			class="text-sm hover:underline"
			style="color: var(--color-error);"
		>
			Sign Out
		</button>
	</div>
{/if}
