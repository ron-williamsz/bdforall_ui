<script lang="ts">
	import { apiClient } from '$lib/api/client';
	import { Pagination, Modal, Alert, Badge } from '$lib/components';

	let items = $state<any[]>([]);
	let total = $state(0);
	let skip = $state(0);
	let limit = $state(100);
	let loading = $state(true);
	let stats = $state<any>(null);
	let showAdd = $state(false);
	let alert = $state({ message: '', type: 'info' as 'success' | 'error' | 'info' | 'warning' });
	let form = $state({ codigo: '', motivo: '', observacoes: '' });

	async function loadData() {
		loading = true;
		try {
			const [list, st] = await Promise.all([
				apiClient.get('/blacklist', { skip, limit }),
				apiClient.get('/blacklist/estatisticas').catch(() => null),
			]);
			items = list.items || [];
			total = list.total || 0;
			stats = st;
		} finally { loading = false; }
	}

	$effect(() => { loadData(); });

	function formatDate(d: string) {
		if (!d) return '-';
		return new Date(d).toLocaleDateString('pt-BR');
	}

	async function addToBlacklist(e: Event) {
		e.preventDefault();
		try {
			await apiClient.post('/blacklist', form);
			alert = { message: 'Adicionado à blacklist', type: 'success' };
			showAdd = false;
			form = { codigo: '', motivo: '', observacoes: '' };
			loadData();
		} catch (err: any) { alert = { message: err.message, type: 'error' }; }
	}

	async function toggleStatus(codigo: string, ativo: boolean) {
		try {
			await apiClient.patch(`/blacklist/${codigo}/status`, { ativo: !ativo });
			alert = { message: 'Status atualizado', type: 'success' };
			loadData();
		} catch (err: any) { alert = { message: err.message, type: 'error' }; }
	}

	async function remove(codigo: string) {
		if (!confirm('Remover permanentemente da blacklist?')) return;
		try {
			await apiClient.delete(`/blacklist/${codigo}`);
			alert = { message: 'Removido da blacklist', type: 'success' };
			loadData();
		} catch (err: any) { alert = { message: err.message, type: 'error' }; }
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-800">Blacklist</h1>
		<button onclick={() => showAdd = true} class="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">Adicionar à Blacklist</button>
	</div>

	{#if alert.message}<Alert message={alert.message} type={alert.type} onclose={() => alert.message = ''} />{/if}

	<!-- Stats -->
	{#if stats}
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
			<div class="bg-white rounded-xl shadow-sm border p-5 text-center"><p class="text-sm text-gray-500">Total</p><p class="text-2xl font-bold mt-1">{stats.total}</p></div>
			<div class="bg-white rounded-xl shadow-sm border p-5 text-center"><p class="text-sm text-gray-500">Ativos</p><p class="text-2xl font-bold mt-1 text-red-600">{stats.ativos}</p></div>
			<div class="bg-white rounded-xl shadow-sm border p-5 text-center"><p class="text-sm text-gray-500">Inativos</p><p class="text-2xl font-bold mt-1 text-gray-600">{stats.inativos}</p></div>
			<div class="bg-white rounded-xl shadow-sm border p-5 text-center"><p class="text-sm text-gray-500">Taxa Bloqueio</p><p class="text-2xl font-bold mt-1">{stats.taxa_bloqueio_percentual?.toFixed(1)}%</p></div>
		</div>

		<!-- Mini chart -->
		{#if stats.adicoes_ultimos_7_dias?.length}
			<div class="bg-white rounded-xl shadow-sm border p-5">
				<h3 class="font-semibold text-gray-700 mb-3">Adições nos Últimos 7 Dias</h3>
				<div class="flex items-end gap-2 h-24">
					{#each stats.adicoes_ultimos_7_dias as day}
						{@const maxQty = Math.max(...stats.adicoes_ultimos_7_dias.map((d: any) => d.quantidade), 1)}
						<div class="flex-1 flex flex-col items-center gap-1">
							<div class="w-full bg-red-400 rounded-t" style="height: {(day.quantidade / maxQty) * 80}px; min-height: 4px;"></div>
							<span class="text-[10px] text-gray-500">{day.data?.slice(5)}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}

	<!-- Table -->
	<div class="overflow-x-auto rounded-lg border border-gray-200">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50"><tr>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Código</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Motivo</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Adicionado Por</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ações</th>
			</tr></thead>
			<tbody class="divide-y divide-gray-200">
				{#if loading}
					{#each Array(3) as _}<tr>{#each Array(6) as _c}<td class="px-4 py-3"><div class="h-4 bg-gray-200 rounded animate-pulse"></div></td>{/each}</tr>{/each}
				{:else if items.length === 0}
					<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">Blacklist vazia</td></tr>
				{:else}
					{#each items as item, i}
						<tr class="{i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
							<td class="px-4 py-3 text-sm font-mono">{item.codigo_ahreas}</td>
							<td class="px-4 py-3 text-sm">{item.motivo_blacklist}</td>
							<td class="px-4 py-3 text-sm">{formatDate(item.data_adicao)}</td>
							<td class="px-4 py-3 text-sm">{item.adicionado_por || '-'}</td>
							<td class="px-4 py-3 text-sm"><Badge text={item.ativo_blacklist ? 'Ativo' : 'Inativo'} variant={item.ativo_blacklist ? 'danger' : 'neutral'} /></td>
							<td class="px-4 py-3 text-sm whitespace-nowrap">
								<button onclick={() => toggleStatus(item.codigo_ahreas, item.ativo_blacklist)} class="text-yellow-600 hover:text-yellow-800 mr-2">{item.ativo_blacklist ? 'Desativar' : 'Ativar'}</button>
								<button onclick={() => remove(item.codigo_ahreas)} class="text-red-600 hover:text-red-800">Remover</button>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
	<Pagination {total} {skip} {limit} onchange={(s) => { skip = s; loadData(); }} />
</div>

<Modal open={showAdd} title="Adicionar à Blacklist" onclose={() => showAdd = false}>
	<form onsubmit={addToBlacklist} class="space-y-3">
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Código *</label><input type="text" bind:value={form.codigo} required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Motivo *</label><textarea bind:value={form.motivo} required rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"></textarea></div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Observações</label><textarea bind:value={form.observacoes} rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"></textarea></div>
		<button type="submit" class="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Adicionar</button>
	</form>
</Modal>
