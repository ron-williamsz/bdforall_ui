<script lang="ts">
	let { message = '', type = 'info', onclose }: {
		message: string;
		type: 'success' | 'error' | 'warning' | 'info';
		onclose?: () => void;
	} = $props();

	const styles: Record<string, string> = {
		success: 'bg-green-50 border-green-400 text-green-800',
		error: 'bg-red-50 border-red-400 text-red-800',
		warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
		info: 'bg-blue-50 border-blue-400 text-blue-800'
	};
</script>

{#if message}
	<div class="flex items-center justify-between p-4 rounded-lg border {styles[type]}">
		<span class="text-sm">{message}</span>
		{#if onclose}
			<button onclick={onclose} class="ml-4 text-lg leading-none opacity-60 hover:opacity-100">&times;</button>
		{/if}
	</div>
{/if}
