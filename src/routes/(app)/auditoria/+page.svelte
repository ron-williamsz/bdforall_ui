<script lang="ts">
	import { apiClient } from '$lib/api/client';
	import { DataTable, Pagination, Modal, Badge } from '$lib/components';

	let activeTab = $state('registros');
	// Registros
	let registros = $state<any[]>([]);
	let regTotal = $state(0);
	let regSkip = $state(0);
	let regLimit = $state(100);
	let regLoading = $state(false);
	let regTabela = $state('');
	let regAcao = $state('');
	let regDataInicio = $state('');
	let regDataFim = $state('');
	let showDetail = $state(false);
	let detailItem = $state<any>(null);
	// Estatísticas
	let estatsLoading = $state(false);
	let estats = $state<any>(null);
	let estDataInicio = $state('');
	let estDataFim = $state('');
	// Logs
	let logs = $state<any[]>([]);
	let logTotal = $state(0);
	let logSkip = $state(0);
	let logLimit = $state(100);
	let logLoading = $state(false);
	let logNivel = $state('');
	let logModulo = $state('');
	let showLogDetail = $state(false);
	let logDetailItem = $state<any>(null);
	// Sync
	let syncLogs = $state<any[]>([]);
	let syncTotal = $state(0);
	let syncSkip = $state(0);
	let syncLimit = $state(100);
	let syncLoading = $state(false);
	let syncTipo = $state('');
	let syncStatus = $state('');

	function formatDate(d: string) {
		if (!d) return '-';
		return new Date(d).toLocaleString('pt-BR');
	}

	async function loadRegistros() {
		regLoading = true;
		try {
			const params: Record<string, any> = { skip: regSkip, limit: regLimit };
			if (regTabela) params.tabela = regTabela;
			if (regAcao) params.acao = regAcao;
			if (regDataInicio) params.data_inicio = regDataInicio;
			if (regDataFim) params.data_fim = regDataFim;
			const res = await apiClient.get('/auditoria', params);
			registros = res.data || [];
			regTotal = res.total || 0;
		} finally { regLoading = false; }
	}

	async function loadEstatisticas() {
		estatsLoading = true;
		try {
			const params: Record<string, any> = {};
			if (estDataInicio) params.data_inicio = estDataInicio;
			if (estDataFim) params.data_fim = estDataFim;
			estats = await apiClient.get('/auditoria/estatisticas', params);
		} finally { estatsLoading = false; }
	}

	async function loadLogs() {
		logLoading = true;
		try {
			const params: Record<string, any> = { skip: logSkip, limit: logLimit };
			if (logNivel) params.nivel = logNivel;
			if (logModulo) params.modulo = logModulo;
			const res = await apiClient.get('/logs', params);
			logs = res.data || [];
			logTotal = res.total || 0;
		} finally { logLoading = false; }
	}

	async function loadSync() {
		syncLoading = true;
		try {
			const params: Record<string, any> = { skip: syncSkip, limit: syncLimit };
			if (syncTipo) params.tipo = syncTipo;
			if (syncStatus) params.status = syncStatus;
			const res = await apiClient.get('/sincronizacao/logs', params);
			syncLogs = res.data || [];
			syncTotal = res.total || 0;
		} finally { syncLoading = false; }
	}

	$effect(() => {
		if (activeTab === 'registros') loadRegistros();
		else if (activeTab === 'estatisticas') loadEstatisticas();
		else if (activeTab === 'logs') loadLogs();
		else if (activeTab === 'sync') loadSync();
	});

	function showRegistroDetail(item: any) {
		detailItem = item;
		showDetail = true;
	}

	function formatJSON(s: string) {
		try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return s || '-'; }
	}

	const acaoColors: Record<string, string> = {
		INSERT: 'success',
		UPDATE: 'info',
		DELETE: 'danger'
	};

	const nivelColors: Record<string, string> = {
		ERROR: 'danger',
		WARNING: 'warning',
		INFO: 'info',
		DEBUG: 'neutral'
	};
</script>

<div class="space-y-4">
	<h1 class="text-2xl font-bold text-gray-800">Auditoria & Logs</h1>

	<div class="border-b border-gray-200">
		<nav class="flex gap-4">
			{#each [['registros', 'Registros'], ['estatisticas', 'Estatísticas'], ['logs', 'Logs do Sistema'], ['sync', 'Sincronização']] as [id, label]}
				<button onclick={() => activeTab = id} class="px-3 py-2 text-sm font-medium border-b-2 {activeTab === id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}">{label}</button>
			{/each}
		</nav>
	</div>

	<!-- REGISTROS -->
	{#if activeTab === 'registros'}
		<div class="bg-white rounded-xl shadow-sm border p-4">
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<input type="text" placeholder="Tabela" bind:value={regTabela} oninput={() => { regSkip = 0; loadRegistros(); }} class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
				<select bind:value={regAcao} onchange={() => { regSkip = 0; loadRegistros(); }} class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
					<option value="">Todas as ações</option><option value="INSERT">INSERT</option><option value="UPDATE">UPDATE</option><option value="DELETE">DELETE</option>
				</select>
				<input type="date" bind:value={regDataInicio} onchange={() => { regSkip = 0; loadRegistros(); }} class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
				<input type="date" bind:value={regDataFim} onchange={() => { regSkip = 0; loadRegistros(); }} class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
			</div>
		</div>
		<div class="overflow-x-auto rounded-lg border border-gray-200">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50"><tr>
					<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuário</th>
					<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tabela</th>
					<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ação</th>
					<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Registro</th>
					<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data/Hora</th>
					<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Detalhes</th>
				</tr></thead>
				<tbody class="divide-y divide-gray-200">
					{#if regLoading}
						{#each Array(5) as _}<tr>{#each Array(6) as _c}<td class="px-4 py-3"><div class="h-4 bg-gray-200 rounded animate-pulse"></div></td>{/each}</tr>{/each}
					{:else if registros.length === 0}
						<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">Nenhum registro encontrado</td></tr>
					{:else}
						{#each registros as item, i}
							<tr class="{i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
								<td class="px-4 py-3 text-sm">{item.usuario_nome || '-'}</td>
								<td class="px-4 py-3 text-sm font-mono text-xs">{item.tabela}</td>
								<td class="px-4 py-3 text-sm"><Badge text={item.acao} variant={acaoColors[item.acao] || 'neutral'} /></td>
								<td class="px-4 py-3 text-sm">{item.registro_id || '-'}</td>
								<td class="px-4 py-3 text-sm text-gray-500">{formatDate(item.data_hora)}</td>
								<td class="px-4 py-3 text-sm"><button onclick={() => showRegistroDetail(item)} class="text-primary-600 hover:text-primary-800">Ver</button></td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
		<Pagination total={regTotal} skip={regSkip} limit={regLimit} onchange={(s) => { regSkip = s; loadRegistros(); }} />

	<!-- ESTATÍSTICAS -->
	{:else if activeTab === 'estatisticas'}
		<div class="bg-white rounded-xl shadow-sm border p-4">
			<div class="grid grid-cols-2 gap-3">
				<input type="date" bind:value={estDataInicio} onchange={loadEstatisticas} class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
				<input type="date" bind:value={estDataFim} onchange={loadEstatisticas} class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
			</div>
		</div>
		{#if estatsLoading}
			<div class="text-center py-8 text-gray-500">Carregando...</div>
		{:else if estats}
			<div class="bg-white rounded-xl shadow-sm border p-5 text-center">
				<p class="text-sm text-gray-500">Total Geral</p>
				<p class="text-3xl font-bold text-primary-600">{estats.total_geral}</p>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="bg-white rounded-xl shadow-sm border p-4">
					<h4 class="font-semibold text-sm text-gray-700 mb-3">Por Ação</h4>
					{#each estats.por_acao || [] as item}
						<div class="flex justify-between text-sm py-1 border-b"><span><Badge text={item.acao} variant={acaoColors[item.acao] || 'neutral'} /></span><span class="font-medium">{item.total}</span></div>
					{/each}
				</div>
				<div class="bg-white rounded-xl shadow-sm border p-4">
					<h4 class="font-semibold text-sm text-gray-700 mb-3">Por Tabela</h4>
					{#each estats.por_tabela || [] as item}
						<div class="flex justify-between text-sm py-1 border-b"><span class="font-mono text-xs">{item.tabela}</span><span class="font-medium">{item.total}</span></div>
					{/each}
				</div>
				<div class="bg-white rounded-xl shadow-sm border p-4">
					<h4 class="font-semibold text-sm text-gray-700 mb-3">Por Usuário</h4>
					{#each estats.por_usuario || [] as item}
						<div class="flex justify-between text-sm py-1 border-b"><span>{item.usuario}</span><span class="font-medium">{item.total}</span></div>
					{/each}
				</div>
			</div>
		{/if}

	<!-- LOGS DO SISTEMA -->
	{:else if activeTab === 'logs'}
		<div class="bg-white rounded-xl shadow-sm border p-4">
			<div class="grid grid-cols-2 gap-3">
				<select bind:value={logNivel} onchange={() => { logSkip = 0; loadLogs(); }} class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
					<option value="">Todos os níveis</option><option value="ERROR">ERROR</option><option value="WARNING">WARNING</option><option value="INFO">INFO</option><option value="DEBUG">DEBUG</option>
				</select>
				<input type="text" placeholder="Filtrar por módulo..." bind:value={logModulo} oninput={() => { logSkip = 0; loadLogs(); }} class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
			</div>
		</div>
		<div class="overflow-x-auto rounded-lg border border-gray-200">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50"><tr>
					<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nível</th>
					<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Módulo</th>
					<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mensagem</th>
					<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuário</th>
					<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data/Hora</th>
					<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase"></th>
				</tr></thead>
				<tbody class="divide-y divide-gray-200">
					{#if logLoading}
						{#each Array(5) as _}<tr>{#each Array(6) as _c}<td class="px-4 py-3"><div class="h-4 bg-gray-200 rounded animate-pulse"></div></td>{/each}</tr>{/each}
					{:else}
						{#each logs as item, i}
							<tr class="{i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
								<td class="px-4 py-3 text-sm"><Badge text={item.nivel} variant={nivelColors[item.nivel] || 'neutral'} /></td>
								<td class="px-4 py-3 text-sm font-mono text-xs">{item.modulo || '-'}</td>
								<td class="px-4 py-3 text-sm max-w-xs truncate">{item.mensagem}</td>
								<td class="px-4 py-3 text-sm">{item.usuario_nome || '-'}</td>
								<td class="px-4 py-3 text-sm text-gray-500">{formatDate(item.data_hora)}</td>
								<td class="px-4 py-3 text-sm"><button onclick={() => { logDetailItem = item; showLogDetail = true; }} class="text-primary-600 hover:text-primary-800">Ver</button></td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
		<Pagination total={logTotal} skip={logSkip} limit={logLimit} onchange={(s) => { logSkip = s; loadLogs(); }} />

	<!-- SINCRONIZAÇÃO -->
	{:else if activeTab === 'sync'}
		<div class="bg-white rounded-xl shadow-sm border p-4">
			<div class="grid grid-cols-2 gap-3">
				<select bind:value={syncTipo} onchange={() => { syncSkip = 0; loadSync(); }} class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
					<option value="">Todos os tipos</option><option value="full">Full</option><option value="condominio">Condomínio</option><option value="gerente">Gerente</option><option value="corpo_diretivo">Corpo Diretivo</option>
				</select>
				<select bind:value={syncStatus} onchange={() => { syncSkip = 0; loadSync(); }} class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
					<option value="">Todos os status</option><option value="sucesso">Sucesso</option><option value="erro">Erro</option><option value="parcial">Parcial</option>
				</select>
			</div>
		</div>
		<DataTable
			data={syncLogs}
			columns={[
				{ key: 'tipo', label: 'Tipo' },
				{ key: 'status', label: 'Status', render: (v: any) => `<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${v === 'sucesso' ? 'bg-green-100 text-green-800' : v === 'erro' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">${v}</span>` },
				{ key: 'total_processados', label: 'Processados' },
				{ key: 'total_sucessos', label: 'Sucessos' },
				{ key: 'total_erros', label: 'Erros' },
				{ key: 'duracao_segundos', label: 'Duração (s)' },
				{ key: 'executado_por', label: 'Executado Por' },
				{ key: 'data_inicio', label: 'Início', render: (v: any) => formatDate(v) },
			]}
			loading={syncLoading}
		/>
		<Pagination total={syncTotal} skip={syncSkip} limit={syncLimit} onchange={(s) => { syncSkip = s; loadSync(); }} />
	{/if}
</div>

<!-- Audit Detail Modal -->
<Modal open={showDetail} title="Detalhes do Registro" onclose={() => showDetail = false}>
	{#if detailItem}
		<div class="space-y-3">
			<div class="text-sm"><span class="text-gray-500">Usuário:</span> <span class="font-medium">{detailItem.usuario_nome} ({detailItem.usuario_email})</span></div>
			<div class="text-sm"><span class="text-gray-500">Tabela:</span> <span class="font-mono">{detailItem.tabela}</span></div>
			<div class="text-sm"><span class="text-gray-500">Ação:</span> <Badge text={detailItem.acao} variant={acaoColors[detailItem.acao] || 'neutral'} /></div>
			<div class="text-sm"><span class="text-gray-500">IP:</span> {detailItem.ip_origem || '-'}</div>
			{#if detailItem.dados_anteriores}
				<div><p class="text-xs font-semibold text-gray-500 uppercase mb-1">Dados Anteriores</p><pre class="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">{formatJSON(detailItem.dados_anteriores)}</pre></div>
			{/if}
			{#if detailItem.dados_novos}
				<div><p class="text-xs font-semibold text-gray-500 uppercase mb-1">Dados Novos</p><pre class="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">{formatJSON(detailItem.dados_novos)}</pre></div>
			{/if}
		</div>
	{/if}
</Modal>

<!-- Log Detail Modal -->
<Modal open={showLogDetail} title="Detalhes do Log" onclose={() => showLogDetail = false}>
	{#if logDetailItem}
		<div class="space-y-3">
			<div class="text-sm"><span class="text-gray-500">Nível:</span> <Badge text={logDetailItem.nivel} variant={nivelColors[logDetailItem.nivel] || 'neutral'} /></div>
			<div class="text-sm"><span class="text-gray-500">Módulo:</span> {logDetailItem.modulo || '-'}</div>
			<div class="text-sm"><span class="text-gray-500">Usuário:</span> {logDetailItem.usuario_nome || '-'}</div>
			<div><p class="text-xs font-semibold text-gray-500 uppercase mb-1">Mensagem</p><p class="text-sm bg-gray-50 p-3 rounded">{logDetailItem.mensagem}</p></div>
			{#if logDetailItem.stack_trace}
				<div><p class="text-xs font-semibold text-gray-500 uppercase mb-1">Stack Trace</p><pre class="bg-red-50 p-3 rounded text-xs overflow-auto max-h-60 text-red-700">{logDetailItem.stack_trace}</pre></div>
			{/if}
		</div>
	{/if}
</Modal>
