<script lang="ts">
	import { page } from '$app/state';
	import { apiClient } from '$lib/api/client';
	import { DataTable, Badge } from '$lib/components';

	let codigo = $derived(page.params.codigo);
	let condo = $state<any>(null);
	let conselheiros = $state<any[]>([]);
	let estatisticas = $state<any>(null);
	let credenciais = $state<any[]>([]);
	let corpoDir = $state<any>(null);
	let loading = $state(true);
	let activeTab = $state('info');

	const tabs = [
		{ id: 'info', label: 'Informações Gerais' },
		{ id: 'conselheiros', label: 'Conselheiros' },
		{ id: 'stats', label: 'Estatísticas' },
		{ id: 'credenciais', label: 'Credenciais' },
		{ id: 'diretivo', label: 'Corpo Diretivo' },
	];

	async function loadData() {
		loading = true;
		try {
			condo = await apiClient.get(`/condominios/${codigo}`);
			const [cons, est, cred, cd] = await Promise.all([
				apiClient.get(`/condominios/${codigo}/conselheiros`).catch(() => ({ conselheiros: [] })),
				apiClient.get(`/condominios/${codigo}/estatisticas`).catch(() => null),
				apiClient.get(`/credenciais/${codigo}`).catch(() => ({ credenciais: [] })),
				apiClient.get(`/condominios/${codigo}/corpo-diretivo`).catch(() => null),
			]);
			conselheiros = cons.conselheiros || [];
			estatisticas = est;
			credenciais = cred.credenciais || [];
			corpoDir = cd;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (codigo) loadData();
	});
</script>

<div class="space-y-4">
	<div class="flex items-center gap-3">
		<a href="/condominios" class="p-2 hover:bg-gray-200 rounded-lg">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
		</a>
		<h1 class="text-2xl font-bold text-gray-800">{condo?.nome || 'Carregando...'}</h1>
		{#if condo?.status}
			<Badge text={condo.status} variant={condo.status === 'ativo' ? 'success' : 'danger'} />
		{/if}
	</div>

	<!-- Tabs -->
	<div class="border-b border-gray-200">
		<nav class="flex gap-4">
			{#each tabs as tab}
				<button
					onclick={() => activeTab = tab.id}
					class="px-3 py-2 text-sm font-medium border-b-2 transition-colors
						{activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
				>
					{tab.label}
				</button>
			{/each}
		</nav>
	</div>

	{#if loading}
		<div class="bg-white rounded-xl p-8 text-center text-gray-500">Carregando...</div>
	{:else if activeTab === 'info' && condo}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="bg-white rounded-xl shadow-sm border p-5 space-y-3">
				<h3 class="font-semibold text-gray-700">Dados Gerais</h3>
				{#each [['Código', condo.codigo_ahreas], ['Nome', condo.nome], ['CNPJ', condo.cnpj], ['Status', condo.status], ['Total Unidades', condo.total_unidades], ['Área Total', condo.area_total]] as [label, value]}
					<div class="flex justify-between text-sm"><span class="text-gray-500">{label}</span><span class="font-medium">{value || '-'}</span></div>
				{/each}
			</div>
			<div class="bg-white rounded-xl shadow-sm border p-5 space-y-3">
				<h3 class="font-semibold text-gray-700">Endereço</h3>
				{#each [['Endereço', `${condo.endereco || ''} ${condo.numero || ''}`], ['Bairro', condo.bairro], ['Cidade/UF', `${condo.cidade || '-'}/${condo.uf || '-'}`], ['CEP', condo.cep]] as [label, value]}
					<div class="flex justify-between text-sm"><span class="text-gray-500">{label}</span><span class="font-medium">{value || '-'}</span></div>
				{/each}
			</div>
			<div class="bg-white rounded-xl shadow-sm border p-5 space-y-3">
				<h3 class="font-semibold text-gray-700">Contato</h3>
				{#each [['Email', condo.email], ['Telefone', condo.telefone], ['Gerente', condo.gerente_nome]] as [label, value]}
					<div class="flex justify-between text-sm"><span class="text-gray-500">{label}</span><span class="font-medium">{value || '-'}</span></div>
				{/each}
			</div>
			<div class="bg-white rounded-xl shadow-sm border p-5 space-y-3">
				<h3 class="font-semibold text-gray-700">Síndico</h3>
				{#each [['Nome', condo.nome_sindico], ['Email', condo.email_sindico], ['Telefone', condo.telefone_sindico]] as [label, value]}
					<div class="flex justify-between text-sm"><span class="text-gray-500">{label}</span><span class="font-medium">{value || '-'}</span></div>
				{/each}
			</div>
		</div>
	{:else if activeTab === 'conselheiros'}
		<DataTable
			data={conselheiros}
			columns={[
				{ key: 'cargo', label: 'Cargo' },
				{ key: 'nome', label: 'Nome' },
				{ key: 'cpf', label: 'CPF' },
				{ key: 'telefone', label: 'Telefone' },
				{ key: 'email', label: 'Email' },
				{ key: 'inicio_mandato', label: 'Início Mandato' },
				{ key: 'fim_mandato', label: 'Fim Mandato' },
			]}
			loading={false}
			emptyMessage="Nenhum conselheiro encontrado"
		/>
	{:else if activeTab === 'stats' && estatisticas}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{#each [['Unidades', estatisticas.total_unidades], ['Conselheiros', estatisticas.total_conselheiros], ['Credenciais', estatisticas.total_credenciais], ['Área Total', estatisticas.area_total]] as [label, value]}
				<div class="bg-white rounded-xl shadow-sm border p-5">
					<p class="text-sm text-gray-500">{label}</p>
					<p class="text-2xl font-bold mt-1">{value ?? 0}</p>
				</div>
			{/each}
		</div>
		{#if estatisticas.taxa_atual}
			<div class="bg-white rounded-xl shadow-sm border p-5 mt-4">
				<h3 class="font-semibold text-gray-700 mb-3">Taxa Atual</h3>
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
					<div><p class="text-xs text-gray-500">Taxa Adm</p><p class="font-bold">R$ {estatisticas.taxa_atual.taxa_adm?.toFixed(2)}</p></div>
					<div><p class="text-xs text-gray-500">Taxa Operacional</p><p class="font-bold">R$ {estatisticas.taxa_atual.taxa_operacional?.toFixed(2)}</p></div>
					<div><p class="text-xs text-gray-500">Taxa Total</p><p class="font-bold">R$ {estatisticas.taxa_atual.taxa_total?.toFixed(2)}</p></div>
					<div><p class="text-xs text-gray-500">Índice</p><p class="font-bold">{estatisticas.taxa_atual.indice || '-'}</p></div>
				</div>
			</div>
		{/if}
	{:else if activeTab === 'credenciais'}
		<DataTable
			data={credenciais}
			columns={[
				{ key: 'nome_credencial', label: 'Tipo' },
				{ key: 'login', label: 'Login' },
				{ key: 'senha', label: 'Senha' },
				{ key: 'campo_extra_nome', label: 'Campo Extra' },
				{ key: 'campo_extra_valor', label: 'Valor Extra' },
				{ key: 'observacoes', label: 'Observações' },
			]}
			loading={false}
			emptyMessage="Nenhuma credencial encontrada"
		/>
	{:else if activeTab === 'diretivo'}
		<DataTable
			data={corpoDir?.corpo_diretivo || []}
			columns={[
				{ key: 'cargo', label: 'Cargo' },
				{ key: 'nome', label: 'Nome' },
				{ key: 'cpf', label: 'CPF' },
				{ key: 'email', label: 'Email' },
				{ key: 'telefone', label: 'Telefone' },
			]}
			loading={false}
			emptyMessage="Nenhum membro do corpo diretivo encontrado"
		/>
	{/if}
</div>
