<script lang="ts">
	import { apiClient } from '$lib/api/client';
	import { DataTable } from '$lib/components';

	let activeTab = $state('gerente');
	let porGerente = $state<any>(null);
	let porIndice = $state<any>(null);
	let loading = $state(true);

	function fmt(v: any) { return `R$ ${(Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`; }

	async function loadData() {
		loading = true;
		try {
			const [g, i] = await Promise.all([
				apiClient.get('/taxas/relatorio/por-gerente'),
				apiClient.get('/taxas/relatorio/por-indice'),
			]);
			porGerente = g;
			porIndice = i;
		} finally {
			loading = false;
		}
	}

	$effect(() => { loadData(); });
</script>

<div class="space-y-4">
	<div class="flex items-center gap-3">
		<a href="/taxas" class="p-2 hover:bg-gray-200 rounded-lg">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
		</a>
		<h1 class="text-2xl font-bold text-gray-800">Relatórios de Taxas</h1>
	</div>

	<div class="border-b border-gray-200">
		<nav class="flex gap-4">
			<button onclick={() => activeTab = 'gerente'} class="px-3 py-2 text-sm font-medium border-b-2 {activeTab === 'gerente' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}">Por Gerente</button>
			<button onclick={() => activeTab = 'indice'} class="px-3 py-2 text-sm font-medium border-b-2 {activeTab === 'indice' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}">Por Índice</button>
		</nav>
	</div>

	{#if loading}
		<div class="text-center py-8 text-gray-500">Carregando...</div>
	{:else if activeTab === 'gerente' && porGerente}
		<!-- Resumo -->
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
			<div class="bg-white rounded-lg shadow-sm border p-4 text-center"><p class="text-xs text-gray-500">Condomínios</p><p class="text-xl font-bold">{porGerente.resumo?.total_condominios}</p></div>
			<div class="bg-white rounded-lg shadow-sm border p-4 text-center"><p class="text-xs text-gray-500">Taxa Adm</p><p class="text-xl font-bold">{fmt(porGerente.resumo?.total_taxa_adm)}</p></div>
			<div class="bg-white rounded-lg shadow-sm border p-4 text-center"><p class="text-xs text-gray-500">Taxa Oper.</p><p class="text-xl font-bold">{fmt(porGerente.resumo?.total_taxa_operacional)}</p></div>
			<div class="bg-white rounded-lg shadow-sm border p-4 text-center"><p class="text-xs text-gray-500">Total Geral</p><p class="text-xl font-bold text-primary-600">{fmt(porGerente.resumo?.total_geral)}</p></div>
		</div>
		<DataTable
			data={porGerente.por_gerente || []}
			columns={[
				{ key: 'gerente', label: 'Gerente' },
				{ key: 'total_condominios', label: 'Condomínios' },
				{ key: 'total_taxa_adm', label: 'Taxa Adm', render: (v: any) => fmt(v) },
				{ key: 'total_taxa_operacional', label: 'Taxa Oper.', render: (v: any) => fmt(v) },
				{ key: 'total_geral', label: 'Total', render: (v: any) => `<span class="font-bold">${fmt(v)}</span>` },
			]}
			loading={false}
		/>
	{:else if activeTab === 'indice' && porIndice}
		<DataTable
			data={porIndice.por_indice || []}
			columns={[
				{ key: 'indice', label: 'Índice' },
				{ key: 'total_condominios', label: 'Condomínios' },
				{ key: 'total_geral', label: 'Total Geral', render: (v: any) => fmt(v) },
				{ key: 'media_taxa', label: 'Média', render: (v: any) => fmt(v) },
			]}
			loading={false}
		/>
	{/if}
</div>
