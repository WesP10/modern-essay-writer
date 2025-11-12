<script lang="ts">
	export let words = 0;
	export let characters = 0;
</script>

<div class="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700">
	<div class="flex items-center space-x-4 text-sm">
		<div class="flex items-center space-x-2">
			<span class="text-gray-600 dark:text-gray-400">Words:</span>
			<span class="font-semibold text-gray-900 dark:text-white">{words}</span>
		</div>
		<div class="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
		<div class="flex items-center space-x-2">
			<span class="text-gray-600 dark:text-gray-400">Characters:</span>
			<span class="font-semibold text-gray-900 dark:text-white">{characters}</span>
		</div>
	</div>
</div>
