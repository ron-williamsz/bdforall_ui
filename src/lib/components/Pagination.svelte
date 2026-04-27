<script lang="ts">
	let { total = 0, skip = 0, limit = 100, onchange }: {
		total: number;
		skip: number;
		limit: number;
		onchange: (skip: number) => void;
	} = $props();

	let totalPages = $derived(Math.ceil(total / limit));
	let currentPage = $derived(Math.floor(skip / limit) + 1);
	let from = $derived(total === 0 ? 0 : skip + 1);
	let to = $derived(Math.min(skip + limit, total));

	function goTo(page: number) {
		if (page < 1 || page > totalPages) return;
		onchange((page - 1) * limit);
	}

	let pages = $derived.by(() => {
		const p: number[] = [];
		const start = Math.max(1, currentPage - 2);
		const end = Math.min(totalPages, currentPage + 2);
		for (let i = start; i <= end; i++) p.push(i);
		return p;
	});
</script>

{#if total > 0}
	<div class="flex items-center justify-between px-2 py-3">
		<p class="text-sm text-gray-600">
			Mostrando <span class="font-medium">{from}</span>-<span class="font-medium">{to}</span> de <span class="font-medium">{total}</span>
		</p>
		<div class="flex items-center gap-1">
			<button
				onclick={() => goTo(currentPage - 1)}
				disabled={currentPage <= 1}
				class="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
			>
				Anterior
			</button>
			{#each pages as p}
				<button
					onclick={() => goTo(p)}
					class="px-3 py-1.5 text-sm rounded-md border {p === currentPage ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
				>
					{p}
				</button>
			{/each}
			<button
				onclick={() => goTo(currentPage + 1)}
				disabled={currentPage >= totalPages}
				class="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
			>
				Próximo
			</button>
		</div>
	</div>
{/if}
