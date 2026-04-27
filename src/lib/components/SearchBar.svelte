<script lang="ts">
	let { value = '', placeholder = 'Buscar...', onsearch }: {
		value: string;
		placeholder?: string;
		onsearch: (value: string) => void;
	} = $props();

	let timeout: ReturnType<typeof setTimeout>;
	let input = $state(value);

	$effect(() => {
		input = value;
	});

	$effect(() => {
		return () => clearTimeout(timeout);
	});

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		input = target.value;
		clearTimeout(timeout);
		timeout = setTimeout(() => onsearch(input), 300);
	}

	function handleClear() {
		input = '';
		onsearch('');
	}
</script>

<div class="relative">
	<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
		<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
		</svg>
	</div>
	<input
		type="text"
		value={input}
		oninput={handleInput}
		{placeholder}
		class="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
	/>
	{#if input}
		<button onclick={handleClear} class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
			&times;
		</button>
	{/if}
</div>
