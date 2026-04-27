<script lang="ts">
	import type { Snippet } from 'svelte';

	let { open = false, title = '', onclose, children }: {
		open: boolean;
		title: string;
		onclose: () => void;
		children: Snippet;
	} = $props();

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={handleBackdrop}
		role="dialog"
		aria-modal="true"
		aria-label={title}
	>
		<div class="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
				<h2 class="text-lg font-semibold text-gray-800">{title}</h2>
				<button onclick={onclose} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
			</div>
			<div class="px-6 py-4">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
