<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiClient } from '$lib/api/client';
	import { DataTable, Modal, Alert } from '$lib/components';

	let perfis = $state<any[]>([]);
	let loading = $state(true);
	let showCreate = $state(false);
	let alert = $state({ message: '', type: 'info' as 'success' | 'error' | 'info' | 'warning' });
	let form = $state({ nome: '', descricao: '', is_admin: false });

	async function loadData() {
		loading = true;
		try {
			const res = await apiClient.get('/perfis');
			perfis = res.perfis || [];
		} finally { loading = false; }
	}

	$effect(() => { loadData(); });

	async function createPerfil(e: Event) {
		e.preventDefault();
		try {
			await apiClient.post('/perfis', form);
			alert = { message: 'Perfil criado com sucesso', type: 'success' };
			showCreate = false;
			form = { nome: '', descricao: '', is_admin: false };
			loadData();
		} catch (err: any) { alert = { message: err.message, type: 'error' }; }
	}

	const columns = [
		{ key: 'nome', label: 'Nome' },
		{ key: 'descricao', label: 'Descrição' },
		{ key: 'is_admin', label: 'Admin', render: (v: any) => v ? '<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Admin</span>' : '-' },
		{ key: 'total_usuarios', label: 'Usuários' },
		{ key: 'ativo', label: 'Ativo', render: (v: any) => `<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${v ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${v ? 'Sim' : 'Não'}</span>` },
	];
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-800">Perfis & Permissões</h1>
		<button onclick={() => showCreate = true} class="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">Novo Perfil</button>
	</div>

	{#if alert.message}<Alert message={alert.message} type={alert.type} onclose={() => alert.message = ''} />{/if}

	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div onclick={(e) => {
		const row = (e.target as HTMLElement).closest('tr');
		if (!row) return;
		const idx = row.rowIndex - 1;
		if (idx >= 0 && perfis[idx]) goto(`/perfis/${perfis[idx].id}`);
	}}>
		<DataTable data={perfis} {columns} {loading} />
	</div>
</div>

<Modal open={showCreate} title="Novo Perfil" onclose={() => showCreate = false}>
	<form onsubmit={createPerfil} class="space-y-3">
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Nome *</label><input type="text" bind:value={form.nome} required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label><textarea bind:value={form.descricao} rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"></textarea></div>
		<label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={form.is_admin} class="rounded border-gray-300" /> Perfil administrador</label>
		<button type="submit" class="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Criar</button>
	</form>
</Modal>
