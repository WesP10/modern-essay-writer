<script lang="ts">
	import { onMount } from 'svelte';
	
	export let showSidebar = false;
	
	let containerWidth = 0;
	let sidebarWidth = 400; // Default 400px
	let isDragging = false;
	let minSidebarWidth = 300;
	let maxSidebarWidth = 800;
	
	$: mainWidth = showSidebar ? containerWidth - sidebarWidth : containerWidth;
	
	function handleMouseDown(e: MouseEvent) {
		isDragging = true;
		e.preventDefault();
	}
	
	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		
		const newWidth = containerWidth - e.clientX;
		if (newWidth >= minSidebarWidth && newWidth <= maxSidebarWidth) {
			sidebarWidth = newWidth;
		}
	}
	
	function handleMouseUp() {
		isDragging = false;
	}
	
	onMount(() => {
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
		
		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	});
</script>

<div 
	class="flex h-full w-full overflow-hidden"
	bind:clientWidth={containerWidth}
	class:dragging={isDragging}
>
	<!-- Main Editor Panel -->
	<div 
		class="flex-shrink-0 h-full overflow-auto scrollbar-overlay"
		class:transition-width={!isDragging}
		style="width: {mainWidth}px"
	>
		<slot name="main" />
	</div>
	
	{#if showSidebar}
		<!-- Resize Handle -->
		<div
			class="w-1 cursor-col-resize transition-colors flex-shrink-0 relative group"
			style="background-color: var(--color-border);"
			on:mousedown={handleMouseDown}
			role="separator"
			aria-orientation="vertical"
		>
			<div class="absolute inset-y-0 -left-1 -right-1" style="background-color: var(--color-accentLight); opacity: 0;" />
		</div>
		
		<!-- Sidebar Panel -->
		<div 
			class="flex-shrink-0 h-full overflow-hidden flex flex-col scrollbar-thin"
			class:transition-width={!isDragging}
			style="width: {sidebarWidth}px; background-color: var(--color-bgSecondary); border-left: 1px solid var(--color-border);"
		>
			<slot name="sidebar" />
		</div>
	{/if}
</div>

<style>
	.dragging {
		user-select: none;
		cursor: col-resize;
	}
	
	.transition-width {
		transition: width 200ms ease-out;
	}
	
	.group:hover {
		background-color: var(--color-accent) !important;
	}
	
	.group:hover .absolute {
		opacity: 0.2 !important;
	}
</style>
