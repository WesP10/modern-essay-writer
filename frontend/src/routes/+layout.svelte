<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { initializeTheme } from '$lib/utils/themes';
	
	onMount(() => {
		// Initialize color palette theme on app load
		initializeTheme();
	});
</script>

<slot />
