<script lang="ts">
	interface Column {
		key: string;
		label: string;
		render?: (value: any, row: any) => string;
	}

	let { data = [], columns = [], loading = false, emptyMessage = 'Nenhum registro encontrado.' }: {
		data: any[];
		columns: Column[];
		loading: boolean;
		emptyMessage?: string;
	} = $props();

	function escapeHtml(str: string): string {
		const div = document.createElement('div');
		div.textContent = str;
		return div.innerHTML;
	}

	function safeRender(col: Column, row: any): string {
		if (!col.render) return '';
		const result = col.render(row[col.key], row);
		return result;
	}
</script>

<div class="overflow-x-auto rounded-lg border border-gray-200">
	<table class="min-w-full divide-y divide-gray-200">
		<thead class="bg-gray-50">
			<tr>
				{#each columns as col}
					<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{col.label}</th>
				{/each}
			</tr>
		</thead>
		<tbody class="bg-white divide-y divide-gray-200">
			{#if loading}
				{#each Array(5) as _}
					<tr>
						{#each columns as _c}
							<td class="px-4 py-3">
								<div class="h-4 bg-gray-200 rounded animate-pulse"></div>
							</td>
						{/each}
					</tr>
				{/each}
			{:else if data.length === 0}
				<tr>
					<td colspan={columns.length} class="px-4 py-8 text-center text-gray-500">{emptyMessage}</td>
				</tr>
			{:else}
				{#each data as row, i}
					<tr class="{i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-primary-50 cursor-pointer transition-colors">
						{#each columns as col}
							<td class="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
								{#if col.render}
									{@html safeRender(col, row)}
								{:else}
									{row[col.key] ?? '-'}
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
