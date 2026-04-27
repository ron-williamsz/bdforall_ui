<script lang="ts">
	import { apiClient } from '$lib/api/client';
	import { DataTable, Pagination, Modal, Alert } from '$lib/components';

	let data = $state<any[]>([]);
	let total = $state(0);
	let skip = $state(0);
	let limit = $state(100);
	let loading = $state(true);
	let gerente = $state('');
	let indice = $state('');
	let tipo = $state('');
	let showCreate = $state(false);
	let showEdit = $state(false);
	let editItem = $state<any>(null);
	let alert = $state({ message: '', type: 'info' as 'success' | 'error' | 'info' | 'warning' });

	let form = $state({
		codigo_ahreas: '', indice: '', taxa_adm: 0, taxa_operacional: 0, taxa_total: 0,
		reajuste: '', periodo_referencia: '', gerente: '', cnpj: '', tipo: 'gerenciado',
		nome_externo: '', status: 'ativo', ativo: true
	});

	function fmt(v: any) { return v != null ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'; }

	const columns = [
		{ key: 'codigo_ahreas', label: 'Código' },
		{ key: 'nome_condominio', label: 'Condomínio' },
		{ key: 'indice', label: 'Índice' },
		{ key: 'taxa_adm', label: 'Taxa Adm', render: (v: any) => fmt(v) },
		{ key: 'taxa_operacional', label: 'Taxa Oper.', render: (v: any) => fmt(v) },
		{ key: 'taxa_total', label: 'Taxa Total', render: (v: any) => `<span class="font-bold">${fmt(v)}</span>` },
		{ key: 'gerente', label: 'Gerente' },
		{ key: 'status', label: 'Status', render: (v: any) => `<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${v === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${v || '-'}</span>` },
	];

	async function loadData() {
		loading = true;
		try {
			const params: Record<string, any> = { skip, limit };
			if (gerente) params.gerente = gerente;
			if (indice) params.indice = indice;
			if (tipo) params.tipo = tipo;
			const res = await apiClient.get('/taxas', params);
			data = res.data || [];
			total = res.total || 0;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		gerente; indice; tipo; skip; limit;
		loadData();
	});

	async function createTaxa(e: Event) {
		e.preventDefault();
		try {
			await apiClient.post('/taxas', {
				...form,
				codigo_ahreas: Number(form.codigo_ahreas),
				taxa_adm: Number(form.taxa_adm),
				taxa_operacional: Number(form.taxa_operacional),
				taxa_total: Number(form.taxa_total),
			});
			alert = { message: 'Taxa criada com sucesso', type: 'success' };
			showCreate = false;
			loadData();
		} catch (err: any) {
			alert = { message: err.message, type: 'error' };
		}
	}

	function openEdit(item: any) {
		editItem = { ...item };
		showEdit = true;
	}

	async function updateTaxa(e: Event) {
		e.preventDefault();
		try {
			await apiClient.put(`/taxas/${editItem.id}`, {
				indice: editItem.indice,
				taxa_adm: Number(editItem.taxa_adm),
				taxa_operacional: Number(editItem.taxa_operacional),
				taxa_total: Number(editItem.taxa_total),
				reajuste: editItem.reajuste,
				periodo_referencia: editItem.periodo_referencia,
				status: editItem.status,
			});
			alert = { message: 'Taxa atualizada', type: 'success' };
			showEdit = false;
			loadData();
		} catch (err: any) {
			alert = { message: err.message, type: 'error' };
		}
	}

	async function deleteTaxa(id: number) {
		if (!confirm('Deseja desativar esta taxa?')) return;
		try {
			await apiClient.delete(`/taxas/${id}`);
			alert = { message: 'Taxa desativada', type: 'success' };
			loadData();
		} catch (err: any) {
			alert = { message: err.message, type: 'error' };
		}
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between flex-wrap gap-2">
		<h1 class="text-2xl font-bold text-gray-800">Taxas</h1>
		<div class="flex gap-2">
			<a href="/taxas/relatorios" class="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">Relatórios</a>
			<button onclick={() => showCreate = true} class="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">Nova Taxa</button>
		</div>
	</div>

	{#if alert.message}
		<Alert message={alert.message} type={alert.type} onclose={() => alert.message = ''} />
	{/if}

	<!-- Filters -->
	<div class="bg-white rounded-xl shadow-sm border p-4">
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<input type="text" placeholder="Filtrar por gerente..." bind:value={gerente} oninput={() => { skip = 0; }} class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
			<input type="text" placeholder="Filtrar por índice..." bind:value={indice} oninput={() => { skip = 0; }} class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
			<input type="text" placeholder="Filtrar por tipo..." bind:value={tipo} oninput={() => { skip = 0; }} class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
		</div>
	</div>

	<!-- Table with action buttons -->
	<div class="overflow-x-auto rounded-lg border border-gray-200">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50"><tr>
				{#each columns as col}<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{col.label}</th>{/each}
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ações</th>
			</tr></thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#if loading}
					{#each Array(5) as _}<tr>{#each columns as _c}<td class="px-4 py-3"><div class="h-4 bg-gray-200 rounded animate-pulse"></div></td>{/each}<td class="px-4 py-3"></td></tr>{/each}
				{:else if data.length === 0}
					<tr><td colspan={columns.length + 1} class="px-4 py-8 text-center text-gray-500">Nenhuma taxa encontrada</td></tr>
				{:else}
					{#each data as row, i}
						<tr class="{i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-primary-50">
							{#each columns as col}
								<td class="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
									{#if col.render}{@html col.render(row[col.key], row)}{:else}{row[col.key] ?? '-'}{/if}
								</td>
							{/each}
							<td class="px-4 py-3 text-sm whitespace-nowrap">
								<button onclick={() => openEdit(row)} class="text-primary-600 hover:text-primary-800 mr-2">Editar</button>
								<button onclick={() => deleteTaxa(row.id)} class="text-red-600 hover:text-red-800">Excluir</button>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
	<Pagination {total} {skip} {limit} onchange={(s) => { skip = s; }} />
</div>

<!-- Create Modal -->
<Modal open={showCreate} title="Nova Taxa" onclose={() => showCreate = false}>
	<form onsubmit={createTaxa} class="space-y-3">
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Código Ahreas *</label><input type="number" bind:value={form.codigo_ahreas} required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Índice *</label><input type="text" bind:value={form.indice} required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div class="grid grid-cols-3 gap-2">
			<div><label class="block text-sm font-medium text-gray-700 mb-1">Taxa Adm</label><input type="number" step="0.01" bind:value={form.taxa_adm} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
			<div><label class="block text-sm font-medium text-gray-700 mb-1">Taxa Oper.</label><input type="number" step="0.01" bind:value={form.taxa_operacional} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
			<div><label class="block text-sm font-medium text-gray-700 mb-1">Taxa Total</label><input type="number" step="0.01" bind:value={form.taxa_total} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		</div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Reajuste *</label><input type="date" bind:value={form.reajuste} required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Período Referência</label><input type="text" bind:value={form.periodo_referencia} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<button type="submit" class="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Criar Taxa</button>
	</form>
</Modal>

<!-- Edit Modal -->
<Modal open={showEdit} title="Editar Taxa" onclose={() => showEdit = false}>
	{#if editItem}
		<form onsubmit={updateTaxa} class="space-y-3">
			<div><label class="block text-sm font-medium text-gray-700 mb-1">Índice</label><input type="text" bind:value={editItem.indice} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
			<div class="grid grid-cols-3 gap-2">
				<div><label class="block text-sm font-medium text-gray-700 mb-1">Taxa Adm</label><input type="number" step="0.01" bind:value={editItem.taxa_adm} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
				<div><label class="block text-sm font-medium text-gray-700 mb-1">Taxa Oper.</label><input type="number" step="0.01" bind:value={editItem.taxa_operacional} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
				<div><label class="block text-sm font-medium text-gray-700 mb-1">Taxa Total</label><input type="number" step="0.01" bind:value={editItem.taxa_total} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
			</div>
			<div><label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
				<select bind:value={editItem.status} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
					<option value="ativo">Ativo</option><option value="inativo">Inativo</option>
				</select>
			</div>
			<button type="submit" class="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Salvar</button>
		</form>
	{/if}
</Modal>
