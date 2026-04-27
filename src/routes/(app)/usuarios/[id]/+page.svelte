<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { apiClient } from '$lib/api/client';
	import { DataTable, Modal, Alert, Badge, ApiKeyCard } from '$lib/components';

	let userId = $derived(page.params.id);
	let usuario = $state<any>(null);
	let perfis = $state<any[]>([]);
	let carteiras = $state<any[]>([]);
	let loading = $state(true);
	let showEdit = $state(false);
	let showSenha = $state(false);
	let showVincularPerfil = $state(false);
	let perfisDisponiveis = $state<any[]>([]);
	let novaSenha = $state('');
	let novoPerfilId = $state('');
	let alert = $state({ message: '', type: 'info' as 'success' | 'error' | 'info' | 'warning' });
	let editForm = $state({ email: '', nome_completo: '', telefone: '', cargo: '' });

	async function loadData() {
		loading = true;
		try {
			const [u, p, c] = await Promise.all([
				apiClient.get(`/usuarios/${userId}`),
				apiClient.get(`/usuarios/${userId}/perfis`).catch(() => ({ perfis: [] })),
				apiClient.get(`/carteiras/usuario/${userId}`).catch(() => ({ carteiras: [] })),
			]);
			usuario = u;
			perfis = p.perfis || [];
			carteiras = c.carteiras || [];
			editForm = { email: u.email, nome_completo: u.nome_completo, telefone: u.telefone || '', cargo: u.cargo || '' };
		} finally {
			loading = false;
		}
	}

	$effect(() => { if (userId) loadData(); });

	async function updateUser(e: Event) {
		e.preventDefault();
		try {
			await apiClient.put(`/usuarios/${userId}`, editForm);
			alert = { message: 'Usuário atualizado', type: 'success' };
			showEdit = false;
			loadData();
		} catch (err: any) { alert = { message: err.message, type: 'error' }; }
	}

	async function changeSenha(e: Event) {
		e.preventDefault();
		try {
			await apiClient.patch(`/usuarios/${userId}/senha`, { nova_senha: novaSenha });
			alert = { message: 'Senha alterada com sucesso', type: 'success' };
			showSenha = false;
			novaSenha = '';
		} catch (err: any) { alert = { message: err.message, type: 'error' }; }
	}

	async function toggleStatus() {
		try {
			await apiClient.patch(`/usuarios/${userId}/toggle-status`);
			alert = { message: 'Status alterado', type: 'success' };
			loadData();
		} catch (err: any) { alert = { message: err.message, type: 'error' }; }
	}

	async function deleteUser() {
		if (!confirm('Excluir este usuário permanentemente?')) return;
		try {
			await apiClient.delete(`/usuarios/${userId}`);
			goto('/usuarios');
		} catch (err: any) { alert = { message: err.message, type: 'error' }; }
	}

	async function openVincularPerfil() {
		try {
			const res = await apiClient.get('/usuarios/roles/disponiveis');
			perfisDisponiveis = res.perfis || [];
			showVincularPerfil = true;
		} catch (err: any) { alert = { message: err.message, type: 'error' }; }
	}

	async function vincularPerfil(e: Event) {
		e.preventDefault();
		try {
			await apiClient.post(`/usuarios/${userId}/perfis`, { perfil_id: Number(novoPerfilId) });
			alert = { message: 'Perfil vinculado', type: 'success' };
			showVincularPerfil = false;
			novoPerfilId = '';
			loadData();
		} catch (err: any) { alert = { message: err.message, type: 'error' }; }
	}

	async function desvincularPerfil(perfilId: number) {
		if (!confirm('Desvincular este perfil?')) return;
		try {
			await apiClient.delete(`/usuarios/${userId}/perfis/${perfilId}`);
			alert = { message: 'Perfil desvinculado', type: 'success' };
			loadData();
		} catch (err: any) { alert = { message: err.message, type: 'error' }; }
	}
</script>

<div class="space-y-4">
	<div class="flex items-center gap-3">
		<a href="/usuarios" class="p-2 hover:bg-gray-200 rounded-lg">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
		</a>
		<h1 class="text-2xl font-bold text-gray-800">{usuario?.nome_completo || 'Carregando...'}</h1>
		{#if usuario}<Badge text={usuario.ativo ? 'Ativo' : 'Inativo'} variant={usuario.ativo ? 'success' : 'danger'} />{/if}
	</div>

	{#if alert.message}<Alert message={alert.message} type={alert.type} onclose={() => alert.message = ''} />{/if}

	{#if !loading && usuario}
		<!-- Info + Actions -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="bg-white rounded-xl shadow-sm border p-5 space-y-3">
				<h3 class="font-semibold text-gray-700">Dados do Usuário</h3>
				{#each [['Email', usuario.email], ['Nome', usuario.nome_completo], ['Telefone', usuario.telefone], ['Cargo', usuario.cargo], ['Departamento', usuario.departamento?.nome], ['Perfil Principal', usuario.perfil_principal], ['Admin', usuario.is_admin ? 'Sim' : 'Não']] as [label, value]}
					<div class="flex justify-between text-sm"><span class="text-gray-500">{label}</span><span class="font-medium break-all">{value || '-'}</span></div>
				{/each}
			</div>
			<div class="space-y-3">
				<div class="bg-white rounded-xl shadow-sm border p-5 space-y-2">
					<h3 class="font-semibold text-gray-700 mb-3">Ações</h3>
					<button onclick={() => showEdit = true} class="w-full py-2 px-4 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">Editar Dados</button>
					<button onclick={() => showSenha = true} class="w-full py-2 px-4 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Alterar Senha</button>
					<button onclick={toggleStatus} class="w-full py-2 px-4 text-sm border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50">{usuario.ativo ? 'Desativar' : 'Ativar'}</button>
					<button onclick={deleteUser} class="w-full py-2 px-4 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Excluir Permanentemente</button>
				</div>
				<ApiKeyCard usuarioId={Number(userId)} usuarioEmail={usuario.email} />
			</div>
		</div>

		<!-- Perfis -->
		<div class="bg-white rounded-xl shadow-sm border">
			<div class="px-5 py-4 border-b flex justify-between items-center">
				<h3 class="font-semibold">Perfis ({perfis.length})</h3>
				<button onclick={openVincularPerfil} class="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">Vincular Perfil</button>
			</div>
			<div class="p-4">
				{#if perfis.length === 0}
					<p class="text-gray-500 text-center py-4">Nenhum perfil vinculado</p>
				{:else}
					<div class="space-y-2">
						{#each perfis as p}
							<div class="flex items-center justify-between border rounded-lg p-3">
								<div>
									<span class="font-medium text-sm">{p.nome}</span>
									{#if p.is_admin}<Badge text="Admin" variant="warning" />{/if}
									<p class="text-xs text-gray-500">{p.descricao || ''}</p>
								</div>
								<button onclick={() => desvincularPerfil(p.id)} class="text-red-600 text-xs hover:text-red-800">Remover</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Carteiras -->
		{#if carteiras.length > 0}
			<div class="bg-white rounded-xl shadow-sm border">
				<div class="px-5 py-4 border-b"><h3 class="font-semibold">Carteiras Vinculadas</h3></div>
				<div class="p-4">
					<DataTable
						data={carteiras}
						columns={[
							{ key: 'gerente_nome', label: 'Gerente' },
							{ key: 'tipo_vinculo', label: 'Tipo' },
							{ key: 'total_condominios', label: 'Condomínios' },
							{ key: 'total_unidades', label: 'Unidades' },
						]}
						loading={false}
					/>
				</div>
			</div>
		{/if}
	{/if}
</div>

<Modal open={showEdit} title="Editar Usuário" onclose={() => showEdit = false}>
	<form onsubmit={updateUser} class="space-y-3">
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Nome</label><input type="text" bind:value={editForm.nome_completo} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" bind:value={editForm.email} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Telefone</label><input type="text" bind:value={editForm.telefone} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Cargo</label><input type="text" bind:value={editForm.cargo} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<button type="submit" class="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Salvar</button>
	</form>
</Modal>

<Modal open={showSenha} title="Alterar Senha" onclose={() => showSenha = false}>
	<form onsubmit={changeSenha} class="space-y-3">
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label><input type="password" bind:value={novaSenha} required minlength="6" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<button type="submit" class="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Alterar Senha</button>
	</form>
</Modal>

<Modal open={showVincularPerfil} title="Vincular Perfil" onclose={() => showVincularPerfil = false}>
	<form onsubmit={vincularPerfil} class="space-y-3">
		<select bind:value={novoPerfilId} required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
			<option value="">Selecione um perfil</option>
			{#each perfisDisponiveis as p}<option value={p.id}>{p.nome}{p.is_admin ? ' (Admin)' : ''}</option>{/each}
		</select>
		<button type="submit" class="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Vincular</button>
	</form>
</Modal>
