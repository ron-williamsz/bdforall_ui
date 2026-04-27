<script lang="ts">
	import { apiClient } from '$lib/api/client';
	import { DataTable } from '$lib/components';

	let data = $state<any>(null);
	let loading = $state(true);

	async function loadData() {
		loading = true;
		try {
			data = await apiClient.get('/credenciais/relatorio/cobertura');
		} finally {
			loading = false;
		}
	}

	$effect(() => { loadData(); });
</script>

<div class="space-y-4">
	<div class="flex items-center gap-3">
		<a href="/credenciais" class="p-2 hover:bg-gray-200 rounded-lg">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
		</a>
		<h1 class="text-2xl font-bold text-gray-800">Relatório de Cobertura de Credenciais</h1>
	</div>

	{#if loading}
		<div class="text-center py-8 text-gray-500">Carregando...</div>
	{:else if data}
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
			<div class="bg-white rounded-xl shadow-sm border p-5 text-center"><p class="text-sm text-gray-500">Total Condomínios</p><p class="text-2xl font-bold mt-1">{data.resumo.total_condominios}</p></div>
			<div class="bg-white rounded-xl shadow-sm border p-5 text-center"><p class="text-sm text-gray-500">Com Credenciais</p><p class="text-2xl font-bold mt-1 text-green-600">{data.resumo.com_credenciais}</p></div>
			<div class="bg-white rounded-xl shadow-sm border p-5 text-center"><p class="text-sm text-gray-500">Sem Credenciais</p><p class="text-2xl font-bold mt-1 text-red-600">{data.resumo.sem_credenciais}</p></div>
			<div class="bg-white rounded-xl shadow-sm border p-5 text-center"><p class="text-sm text-gray-500">Cobertura</p><p class="text-2xl font-bold mt-1 text-primary-600">{data.resumo.percentual_cobertura?.toFixed(1)}%</p></div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<div class="bg-white rounded-xl shadow-sm border">
				<div class="px-5 py-4 border-b"><h3 class="font-semibold">Top Condomínios</h3></div>
				<div class="p-4">
					<DataTable
						data={data.top_condominios || []}
						columns={[
							{ key: 'nome', label: 'Condomínio' },
							{ key: 'gerente_nome', label: 'Gerente' },
							{ key: 'total_credenciais', label: 'Credenciais' },
						]}
						loading={false}
					/>
				</div>
			</div>
			<div class="bg-white rounded-xl shadow-sm border">
				<div class="px-5 py-4 border-b"><h3 class="font-semibold">Credenciais Mais Comuns</h3></div>
				<div class="p-4">
					<DataTable
						data={data.credenciais_mais_comuns || []}
						columns={[
							{ key: 'nome_credencial', label: 'Tipo' },
							{ key: 'total_condominios', label: 'Condomínios' },
							{ key: 'percentual', label: '%', render: (v: any) => `${v?.toFixed(1)}%` },
						]}
						loading={false}
					/>
				</div>
			</div>
		</div>
	{/if}
</div>
