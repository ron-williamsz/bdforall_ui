<script lang="ts">
	let { text = '', variant = 'neutral' }: {
		text: string;
		variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
	} = $props();

	const colors: Record<string, string> = {
		success: 'bg-green-100 text-green-800',
		warning: 'bg-yellow-100 text-yellow-800',
		danger: 'bg-red-100 text-red-800',
		info: 'bg-blue-100 text-blue-800',
		neutral: 'bg-gray-100 text-gray-800'
	};
</script>

<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {colors[variant]}">
	{text}
</span>
