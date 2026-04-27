<script lang="ts">
	import { apiClient } from '$lib/api/client';
	import { Pagination, SearchBar, Modal, Alert, Badge } from '$lib/components';

	let data = $state<any[]>([]);
	let total = $state(0);
	let skip = $state(0);
	let limit = $state(100);
	let loading = $state(true);
	let busca = $state('');
	let deptFilter = $state('');
	let ativoFilter = $state('');
	let departamentos = $state<any[]>([]);
	let showCreate = $state(false);
	let showEdit = $state(false);
	let editItem = $state<any>(null);
	let alert = $state({ message: '', type: 'info' as 'success' | 'error' | 'info' | 'warning' });

	let form = $state({ departamento_id: '', ramal: '', nome_contato: '', descricao: '', principal: false, call_group: '', fila: '', status: '' });

	async function loadData() {
		loading = true;
		try {
			const params: Record<string, any> = { skip, limit };
			if (busca) params.busca = busca;
			if (deptFilter) params.departamento_id = Number(deptFilter);
			if (ativoFilter !== '') params.ativo = ativoFilter === 'true';
			const res = await apiClient.get('/ramais', params);
			data = res.data || [];
			total = res.total || 0;
		} finally { loading = false; }
	}

	async function loadDepts() {
		try {
			const res = await apiClient.get('/departamentos', { limit: 500 });
			departamentos = res.data || [];
		} catch {}
	}

	$effect(() => { loadData(); loadDepts(); });

	async function createRamal(e: Event) {
		e.preventDefault();
		try {
			await apiClient.post('/ramais', {
				...form,
				departamento_id: Number(form.departamento_id),
				principal: form.principal,
			});
			alert = { message: 'Ramal criado', type: 'success' };
			showCreate = false;
			form = { departamento_id: '', ramal: '', nome_contato: '', descricao: '', principal: false, call_group: '', fila: '', status: '' };
			loadData();
		} catch (err: any) { alert = { message: err.message, type: 'error' }; }
	}

	function openEdit(item: any) {
		editItem = { ...item };
		showEdit = true;
	}

	async function updateRamal(e: Event) {
		e.preventDefault();
		try {
			await apiClient.put(`/ramais/${editItem.id}`, {
				ramal: editItem.ramal,
				nome_contato: editItem.nome_contato,
				descricao: editItem.descricao,
				call_group: editItem.call_group,
				fila: editItem.fila,
				status: editItem.status,
			});
			alert = { message: 'Ramal atualizado', type: 'success' };
			showEdit = false;
			loadData();
		} catch (err: any) { alert = { message: err.message, type: 'error' }; }
	}

	async function deleteRamal(id: number) {
		if (!confirm('Excluir este ramal?')) return;
		try {
			await apiClient.delete(`/ramais/${id}`);
			alert = { message: 'Ramal excluído', type: 'success' };
			loadData();
		} catch (err: any) { alert = { message: err.message, type: 'error' }; }
	}

	async function toggleRamal(id: number) {
		try {
			await apiClient.patch(`/ramais/${id}/toggle-status`);
			alert = { message: 'Status alterado', type: 'success' };
			loadData();
		} catch (err: any) { alert = { message: err.message, type: 'error' }; }
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-800">Ramais</h1>
		<button onclick={() => showCreate = true} class="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">Novo Ramal</button>
	</div>

	{#if alert.message}<Alert message={alert.message} type={alert.type} onclose={() => alert.message = ''} />{/if}

	<div class="bg-white rounded-xl shadow-sm border p-4">
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<SearchBar value={busca} placeholder="Buscar ramal, contato..." onsearch={(v) => { busca = v; skip = 0; loadData(); }} />
			<select bind:value={deptFilter} onchange={() => { skip = 0; loadData(); }} class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
				<option value="">Todos os departamentos</option>
				{#each departamentos as d}<option value={d.id}>{d.nome}</option>{/each}
			</select>
			<select bind:value={ativoFilter} onchange={() => { skip = 0; loadData(); }} class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
				<option value="">Todos</option><option value="true">Ativos</option><option value="false">Inativos</option>
			</select>
		</div>
	</div>

	<div class="overflow-x-auto rounded-lg border border-gray-200">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50"><tr>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ramal</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contato</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Departamento</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Call Group</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fila</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ativo</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ações</th>
			</tr></thead>
			<tbody class="divide-y divide-gray-200">
				{#if loading}
					{#each Array(5) as _}<tr>{#each Array(7) as _c}<td class="px-4 py-3"><div class="h-4 bg-gray-200 rounded animate-pulse"></div></td>{/each}</tr>{/each}
				{:else if data.length === 0}
					<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">Nenhum ramal encontrado</td></tr>
				{:else}
					{#each data as item, i}
						<tr class="{i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
							<td class="px-4 py-3 text-sm font-mono font-medium">{item.ramal}</td>
							<td class="px-4 py-3 text-sm">{item.nome_contato || '-'}</td>
							<td class="px-4 py-3 text-sm">{item.departamento_nome || '-'}</td>
							<td class="px-4 py-3 text-sm">{item.call_group || '-'}</td>
							<td class="px-4 py-3 text-sm">{item.fila || '-'}</td>
							<td class="px-4 py-3 text-sm"><Badge text={item.ativo ? 'Sim' : 'Não'} variant={item.ativo ? 'success' : 'danger'} /></td>
							<td class="px-4 py-3 text-sm whitespace-nowrap">
								<button onclick={() => openEdit(item)} class="text-primary-600 hover:text-primary-800 mr-1">Editar</button>
								<button onclick={() => toggleRamal(item.id)} class="text-yellow-600 hover:text-yellow-800 mr-1">{item.ativo ? 'Desativar' : 'Ativar'}</button>
								<button onclick={() => deleteRamal(item.id)} class="text-red-600 hover:text-red-800">Excluir</button>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
	<Pagination {total} {skip} {limit} onchange={(s) => { skip = s; loadData(); }} />
</div>

<Modal open={showCreate} title="Novo Ramal" onclose={() => showCreate = false}>
	<form onsubmit={createRamal} class="space-y-3">
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Departamento *</label>
			<select bind:value={form.departamento_id} required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
				<option value="">Selecione</option>
				{#each departamentos as d}<option value={d.id}>{d.nome}</option>{/each}
			</select>
		</div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Ramal *</label><input type="text" bind:value={form.ramal} required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Contato</label><input type="text" bind:value={form.nome_contato} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label><input type="text" bind:value={form.descricao} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div class="grid grid-cols-2 gap-2">
			<div><label class="block text-sm font-medium text-gray-700 mb-1">Call Group</label><input type="text" bind:value={form.call_group} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
			<div><label class="block text-sm font-medium text-gray-700 mb-1">Fila</label><input type="text" bind:value={form.fila} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		</div>
		<button type="submit" class="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Criar Ramal</button>
	</form>
</Modal>

<Modal open={showEdit} title="Editar Ramal" onclose={() => showEdit = false}>
	{#if editItem}
		<form onsubmit={updateRamal} class="space-y-3">
			<div><label class="block text-sm font-medium text-gray-700 mb-1">Ramal</label><input type="text" bind:value={editItem.ramal} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
			<div><label class="block text-sm font-medium text-gray-700 mb-1">Contato</label><input type="text" bind:value={editItem.nome_contato} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
			<div><label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label><input type="text" bind:value={editItem.descricao} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
			<div class="grid grid-cols-2 gap-2">
				<div><label class="block text-sm font-medium text-gray-700 mb-1">Call Group</label><input type="text" bind:value={editItem.call_group} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
				<div><label class="block text-sm font-medium text-gray-700 mb-1">Fila</label><input type="text" bind:value={editItem.fila} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
			</div>
			<button type="submit" class="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Salvar</button>
		</form>
	{/if}
</Modal>
