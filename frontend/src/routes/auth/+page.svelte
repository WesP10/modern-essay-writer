<script lang="ts">
	import Auth from '$lib/components/Auth.svelte';
</script>

<svelte:head>
	<title>Sign In - EssayForge</title>
</svelte:head>

<div class="min-h-screen" style="background: linear-gradient(to bottom right, var(--color-bgPrimary), var(--color-bgTertiary));">
	<div class="container mx-auto px-4 py-16">
		<Auth />
	</div>
</div>
