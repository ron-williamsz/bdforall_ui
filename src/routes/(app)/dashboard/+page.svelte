<script lang="ts">
	import { apiClient } from '$lib/api/client';
	import { Badge } from '$lib/components';

	let health = $state<any>(null);
	let stats = $state({ condominios: 0, gerentes: 0, usuarios: 0 });
	let recentLogs = $state<any[]>([]);
	let loading = $state(true);

	async function loadData() {
		loading = true;
		try {
			const [h, c, g, u, logs] = await Promise.all([
				apiClient.get('/health').catch(() => ({ status: 'offline', database: 'unknown' })),
				apiClient.get('/condominios', { limit: 1 }).catch(() => ({ total: 0 })),
				apiClient.get('/gerentes').catch(() => ({ total: 0 })),
				apiClient.get('/usuarios', { limit: 1 }).catch(() => ({ total: 0 })),
				apiClient.get('/auditoria', { limit: 5 }).catch(() => ({ data: [] }))
			]);
			health = h;
			stats = { condominios: c.total || 0, gerentes: g.total || 0, usuarios: u.total || 0 };
			recentLogs = logs.data || [];
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadData();
		const interval = setInterval(async () => {
			health = await apiClient.get('/health').catch(() => ({ status: 'offline', database: 'unknown' }));
		}, 30000);
		return () => clearInterval(interval);
	});

	function formatDate(d: string) {
		if (!d) return '-';
		return new Date(d).toLocaleString('pt-BR');
	}
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-500">Status da API</p>
					<p class="text-xl font-bold mt-1">{health?.status || '...'}</p>
				</div>
				<div class="w-10 h-10 rounded-lg flex items-center justify-center {health?.status === 'healthy' ? 'bg-green-100' : 'bg-red-100'}">
					<div class="w-3 h-3 rounded-full {health?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}"></div>
				</div>
			</div>
			<p class="text-xs text-gray-400 mt-2">DB: {health?.database || '...'}</p>
		</div>

		<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-500">Condomínios</p>
					<p class="text-2xl font-bold mt-1">{loading ? '...' : stats.condominios}</p>
				</div>
				<div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-500">Gerentes</p>
					<p class="text-2xl font-bold mt-1">{loading ? '...' : stats.gerentes}</p>
				</div>
				<div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-500">Usuários</p>
					<p class="text-2xl font-bold mt-1">{loading ? '...' : stats.usuarios}</p>
				</div>
				<div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
				</div>
			</div>
		</div>
	</div>

	<!-- Recent Activity -->
	<div class="bg-white rounded-xl shadow-sm border border-gray-200">
		<div class="px-6 py-4 border-b border-gray-200">
			<h2 class="text-lg font-semibold text-gray-800">Atividade Recente</h2>
		</div>
		<div class="divide-y divide-gray-100">
			{#if recentLogs.length === 0}
				<p class="px-6 py-8 text-center text-gray-500">Nenhuma atividade recente</p>
			{:else}
				{#each recentLogs as log}
					<div class="px-6 py-3 flex items-center justify-between">
						<div class="flex items-center gap-3">
							<Badge text={log.acao} variant={log.acao === 'INSERT' ? 'success' : log.acao === 'UPDATE' ? 'info' : 'danger'} />
							<div>
								<p class="text-sm text-gray-700"><span class="font-medium">{log.usuario_nome || 'Sistema'}</span> em <span class="font-mono text-xs">{log.tabela}</span></p>
							</div>
						</div>
						<span class="text-xs text-gray-400">{formatDate(log.data_hora)}</span>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
