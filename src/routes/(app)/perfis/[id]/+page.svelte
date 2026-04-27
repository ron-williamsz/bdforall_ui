<script lang="ts">
	import { page } from '$app/state';
	import { apiClient } from '$lib/api/client';
	import { DataTable, Modal, Alert, Badge } from '$lib/components';

	let perfilId = $derived(page.params.id);
	let perfil = $state<any>(null);
	let modulos = $state<any[]>([]);
	let permissoes = $state<any[]>([]);
	let loading = $state(true);
	let showEdit = $state(false);
	let saving = $state(false);
	let alert = $state({ message: '', type: 'info' as 'success' | 'error' | 'info' | 'warning' });
	let editForm = $state({ nome: '', descricao: '', is_admin: false, ativo: true });

	async function loadData() {
		loading = true;
		try {
			const [p, m] = await Promise.all([
				apiClient.get(`/perfis/${perfilId}`),
				apiClient.get('/modulos'),
			]);
			perfil = p;
			modulos = m.modulos || [];
			// Initialize permissions grid
			permissoes = modulos.map(mod => {
				const existing = (p.permissoes || []).find((pm: any) => pm.modulo_id === mod.id);
				return {
					modulo_id: mod.id,
					modulo_nome: mod.nome,
					modulo_codigo: mod.codigo,
					pode_criar: existing?.pode_criar || false,
					pode_ler: existing?.pode_ler || false,
					pode_atualizar: existing?.pode_atualizar || false,
					pode_deletar: existing?.pode_deletar || false,
					pode_exportar: existing?.pode_exportar || false,
					pode_importar: existing?.pode_importar || false,
				};
			});
			editForm = { nome: p.nome, descricao: p.descricao || '', is_admin: p.is_admin, ativo: p.ativo };
		} finally { loading = false; }
	}

	$effect(() => { if (perfilId) loadData(); });

	async function updatePerfil(e: Event) {
		e.preventDefault();
		try {
			await apiClient.put(`/perfis/${perfilId}`, editForm);
			alert = { message: 'Perfil atualizado', type: 'success' };
			showEdit = false;
			loadData();
		} catch (err: any) { alert = { message: err.message, type: 'error' }; }
	}

	async function savePermissoes() {
		saving = true;
		try {
			const payload = permissoes.map(p => ({
				modulo_id: p.modulo_id,
				pode_criar: p.pode_criar,
				pode_ler: p.pode_ler,
				pode_atualizar: p.pode_atualizar,
				pode_deletar: p.pode_deletar,
				pode_exportar: p.pode_exportar,
				pode_importar: p.pode_importar,
			}));
			await apiClient.put(`/perfis/${perfilId}/permissoes`, payload);
			alert = { message: 'Permissões salvas com sucesso', type: 'success' };
		} catch (err: any) { alert = { message: err.message, type: 'error' }; }
		finally { saving = false; }
	}
</script>

<div class="space-y-4">
	<div class="flex items-center gap-3">
		<a href="/perfis" class="p-2 hover:bg-gray-200 rounded-lg">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
		</a>
		<h1 class="text-2xl font-bold text-gray-800">{perfil?.nome || 'Carregando...'}</h1>
		{#if perfil?.is_admin}<Badge text="Admin" variant="warning" />{/if}
	</div>

	{#if alert.message}<Alert message={alert.message} type={alert.type} onclose={() => alert.message = ''} />{/if}

	{#if !loading && perfil}
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div class="bg-white rounded-xl shadow-sm border p-5 space-y-3">
				<h3 class="font-semibold text-gray-700">Detalhes</h3>
				{#each [['Nome', perfil.nome], ['Descrição', perfil.descricao], ['Admin', perfil.is_admin ? 'Sim' : 'Não'], ['Ativo', perfil.ativo ? 'Sim' : 'Não'], ['Usuários', perfil.total_usuarios]] as [label, value]}
					<div class="flex justify-between text-sm"><span class="text-gray-500">{label}</span><span class="font-medium">{value || '-'}</span></div>
				{/each}
				<button onclick={() => showEdit = true} class="w-full mt-2 py-2 px-4 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">Editar</button>
			</div>

			<!-- Permissões -->
			<div class="md:col-span-2 bg-white rounded-xl shadow-sm border">
				<div class="px-5 py-4 border-b flex justify-between items-center">
					<h3 class="font-semibold">Permissões por Módulo</h3>
					<button onclick={savePermissoes} disabled={saving} class="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
						{saving ? 'Salvando...' : 'Salvar Permissões'}
					</button>
				</div>
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50"><tr>
							<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Módulo</th>
							<th class="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Criar</th>
							<th class="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Ler</th>
							<th class="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Atualizar</th>
							<th class="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Deletar</th>
							<th class="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Exportar</th>
							<th class="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Importar</th>
						</tr></thead>
						<tbody class="divide-y divide-gray-100">
							{#each permissoes as perm, i}
								<tr class="{i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
									<td class="px-4 py-3 text-sm font-medium">{perm.modulo_nome}</td>
									<td class="px-3 py-3 text-center"><input type="checkbox" bind:checked={perm.pode_criar} class="rounded border-gray-300" /></td>
									<td class="px-3 py-3 text-center"><input type="checkbox" bind:checked={perm.pode_ler} class="rounded border-gray-300" /></td>
									<td class="px-3 py-3 text-center"><input type="checkbox" bind:checked={perm.pode_atualizar} class="rounded border-gray-300" /></td>
									<td class="px-3 py-3 text-center"><input type="checkbox" bind:checked={perm.pode_deletar} class="rounded border-gray-300" /></td>
									<td class="px-3 py-3 text-center"><input type="checkbox" bind:checked={perm.pode_exportar} class="rounded border-gray-300" /></td>
									<td class="px-3 py-3 text-center"><input type="checkbox" bind:checked={perm.pode_importar} class="rounded border-gray-300" /></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<!-- Usuarios vinculados -->
		{#if perfil.usuarios?.length}
			<div class="bg-white rounded-xl shadow-sm border">
				<div class="px-5 py-4 border-b"><h3 class="font-semibold">Usuários com este Perfil</h3></div>
				<div class="p-4">
					<DataTable
						data={perfil.usuarios}
						columns={[
							{ key: 'nome_completo', label: 'Nome' },
							{ key: 'email', label: 'Email' },
							{ key: 'departamento', label: 'Departamento' },
						]}
						loading={false}
					/>
				</div>
			</div>
		{/if}
	{/if}
</div>

<Modal open={showEdit} title="Editar Perfil" onclose={() => showEdit = false}>
	<form onsubmit={updatePerfil} class="space-y-3">
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Nome</label><input type="text" bind:value={editForm.nome} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label><textarea bind:value={editForm.descricao} rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"></textarea></div>
		<label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={editForm.is_admin} class="rounded border-gray-300" /> Admin</label>
		<label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={editForm.ativo} class="rounded border-gray-300" /> Ativo</label>
		<button type="submit" class="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Salvar</button>
	</form>
</Modal>
