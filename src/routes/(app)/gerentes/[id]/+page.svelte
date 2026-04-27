<script lang="ts">
	import { page } from '$app/state';
	import { apiClient } from '$lib/api/client';
	import { DataTable } from '$lib/components';

	let id = $derived(page.params.id);
	let gerente = $state<any>(null);
	let condominios = $state<any[]>([]);
	let estatisticasTaxas = $state<any>(null);
	let loading = $state(true);

	async function loadData() {
		loading = true;
		try {
			const res = await apiClient.get(`/gerentes/${id}`);
			gerente = res.gerente;
			condominios = res.condominios || [];
			estatisticasTaxas = res.estatisticas_taxas;
		} finally {
			loading = false;
		}
	}

	$effect(() => { if (id) loadData(); });
</script>

<div class="space-y-4">
	<div class="flex items-center gap-3">
		<a href="/gerentes" class="p-2 hover:bg-gray-200 rounded-lg">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
		</a>
		<h1 class="text-2xl font-bold text-gray-800">{gerente?.nome || 'Carregando...'}</h1>
	</div>

	{#if !loading && gerente}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="bg-white rounded-xl shadow-sm border p-5 space-y-3">
				<h3 class="font-semibold text-gray-700">Dados do Gerente</h3>
				{#each [['Nome', gerente.nome], ['Email', gerente.email], ['Telefone', gerente.telefone], ['Ativo', gerente.ativo ? 'Sim' : 'Não']] as [label, value]}
					<div class="flex justify-between text-sm"><span class="text-gray-500">{label}</span><span class="font-medium">{value || '-'}</span></div>
				{/each}
			</div>
			{#if estatisticasTaxas}
				<div class="bg-white rounded-xl shadow-sm border p-5 space-y-3">
					<h3 class="font-semibold text-gray-700">Estatísticas de Taxas</h3>
					{#each [['Condomínios c/ Taxa', estatisticasTaxas.total_condominios_com_taxa], ['Total Taxa Adm', `R$ ${estatisticasTaxas.total_taxa_adm?.toFixed(2)}`], ['Total Taxa Oper.', `R$ ${estatisticasTaxas.total_taxa_operacional?.toFixed(2)}`], ['Total Geral', `R$ ${estatisticasTaxas.total_geral?.toFixed(2)}`]] as [label, value]}
						<div class="flex justify-between text-sm"><span class="text-gray-500">{label}</span><span class="font-medium">{value}</span></div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="bg-white rounded-xl shadow-sm border">
			<div class="px-5 py-4 border-b"><h3 class="font-semibold text-gray-700">Condomínios ({condominios.length})</h3></div>
			<div class="p-4">
				<DataTable
					data={condominios}
					columns={[
						{ key: 'codigo_ahreas', label: 'Código' },
						{ key: 'nome', label: 'Nome' },
						{ key: 'total_unidades', label: 'Unidades' },
						{ key: 'status', label: 'Status' },
					]}
					loading={false}
				/>
			</div>
		</div>
	{/if}
</div>
