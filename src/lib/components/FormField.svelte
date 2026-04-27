<script lang="ts">
	let { label, name, type = 'text', value = '', required = false, error = '', placeholder = '', oninput }: {
		label: string;
		name: string;
		type?: string;
		value: string | number;
		required?: boolean;
		error?: string;
		placeholder?: string;
		oninput: (e: Event) => void;
	} = $props();
</script>

<div class="space-y-1">
	<label for={name} class="block text-sm font-medium text-gray-700">
		{label} {#if required}<span class="text-red-500">*</span>{/if}
	</label>
	{#if type === 'textarea'}
		<textarea
			id={name}
			{name}
			{value}
			{required}
			{placeholder}
			oninput={oninput}
			rows="3"
			class="block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none {error ? 'border-red-400' : 'border-gray-300'}"
		></textarea>
	{:else}
		<input
			id={name}
			{name}
			{type}
			{value}
			{required}
			{placeholder}
			oninput={oninput}
			class="block w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none {error ? 'border-red-400' : 'border-gray-300'}"
		/>
	{/if}
	{#if error}
		<p class="text-xs text-red-500">{error}</p>
	{/if}
</div>
