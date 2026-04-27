<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiClient } from '$lib/api/client';

	let carteiras = $state<any[]>([]);
	let loading = $state(true);
	let filtroAtivo = $state(true);

	async function loadData() {
		loading = true;
		try {
			const res = await apiClient.get('/carteiras', { ativo: filtroAtivo });
			carteiras = res.carteiras || [];
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		filtroAtivo;
		loadData();
	});

	function fmt(v: number) { return `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`; }
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-800">Carteiras</h1>
		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" bind:checked={filtroAtivo} onchange={() => {}} class="rounded border-gray-300" />
			Apenas ativos
		</label>
	</div>

	{#if loading}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each Array(6) as _}
				<div class="bg-white rounded-xl shadow-sm border p-5 animate-pulse h-40"></div>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each carteiras as c}
				<button
					onclick={() => goto(`/carteiras/${c.gerente.id}`)}
					class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-left hover:shadow-md hover:border-primary-300 transition-all"
				>
					<div class="flex items-center gap-3 mb-3">
						<div class="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
							{c.gerente.nome?.charAt(0) || '?'}
						</div>
						<div>
							<p class="font-semibold text-gray-800">{c.gerente.nome}</p>
							<p class="text-xs text-gray-500">{c.gerente.email}</p>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-2 text-sm">
						<div><span class="text-gray-500">Condomínios:</span> <span class="font-medium">{c.estatisticas.total_condominios}</span></div>
						<div><span class="text-gray-500">Unidades:</span> <span class="font-medium">{c.estatisticas.total_unidades}</span></div>
						<div class="col-span-2"><span class="text-gray-500">Taxa Total:</span> <span class="font-bold text-primary-600">{fmt(c.estatisticas.taxa_total)}</span></div>
					</div>
				</button>
			{/each}
		</div>
		{#if carteiras.length === 0}
			<p class="text-center text-gray-500 py-8">Nenhuma carteira encontrada</p>
		{/if}
	{/if}
</div>
