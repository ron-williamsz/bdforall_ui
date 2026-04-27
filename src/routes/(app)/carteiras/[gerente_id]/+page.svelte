<script lang="ts">
	import { page } from '$app/state';
	import { apiClient } from '$lib/api/client';
	import { DataTable, Modal, Alert, Badge } from '$lib/components';

	let gerenteId = $derived(page.params.gerente_id);
	let carteira = $state<any>(null);
	let usuarios = $state<any[]>([]);
	let resumo = $state<any>(null);
	let loading = $state(true);
	let showVincular = $state(false);
	let alert = $state({ message: '', type: 'info' as 'success' | 'error' | 'info' | 'warning' });

	let novoUsuario = $state({ usuario_id: '', tipo_vinculo: 'assistente', principal: false, observacao: '' });

	async function loadData() {
		loading = true;
		try {
			const [c, u, r] = await Promise.all([
				apiClient.get(`/carteiras/${gerenteId}`),
				apiClient.get(`/carteiras/${gerenteId}/usuarios`).catch(() => ({ usuarios: [] })),
				apiClient.get(`/carteiras/${gerenteId}/resumo`).catch(() => null),
			]);
			carteira = c;
			usuarios = u.usuarios || [];
			resumo = r;
		} finally {
			loading = false;
		}
	}

	$effect(() => { if (gerenteId) loadData(); });

	function fmt(v: number) { return `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`; }

	async function vincularUsuario() {
		try {
			await apiClient.post(`/carteiras/${gerenteId}/usuarios`, {
				usuario_id: Number(novoUsuario.usuario_id),
				tipo_vinculo: novoUsuario.tipo_vinculo,
				principal: novoUsuario.principal,
				observacao: novoUsuario.observacao || undefined,
			});
			alert = { message: 'Usuário vinculado com sucesso', type: 'success' };
			showVincular = false;
			novoUsuario = { usuario_id: '', tipo_vinculo: 'assistente', principal: false, observacao: '' };
			loadData();
		} catch (err: any) {
			alert = { message: err.message, type: 'error' };
		}
	}

	async function desvincular(usuarioId: number) {
		if (!confirm('Deseja desvincular este usuário?')) return;
		try {
			await apiClient.delete(`/carteiras/${gerenteId}/usuarios/${usuarioId}`);
			alert = { message: 'Usuário desvinculado', type: 'success' };
			loadData();
		} catch (err: any) {
			alert = { message: err.message, type: 'error' };
		}
	}
</script>

<div class="space-y-4">
	<div class="flex items-center gap-3">
		<a href="/carteiras" class="p-2 hover:bg-gray-200 rounded-lg">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
		</a>
		<h1 class="text-2xl font-bold text-gray-800">Carteira: {carteira?.gerente?.nome || '...'}</h1>
	</div>

	{#if alert.message}
		<Alert message={alert.message} type={alert.type} onclose={() => alert.message = ''} />
	{/if}

	{#if !loading && carteira}
		<!-- Resumo -->
		{#if resumo?.resumo}
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
				{#each [['Condomínios', resumo.resumo.total_condominios], ['Ativos', resumo.resumo.condominios_ativos], ['Unidades', resumo.resumo.total_unidades], ['Conselheiros', resumo.resumo.total_conselheiros], ['Credenciais', resumo.resumo.total_credenciais], ['Taxa Total', fmt(resumo.resumo.financeiro?.total_taxa_total)]] as [label, value]}
					<div class="bg-white rounded-lg shadow-sm border p-3 text-center">
						<p class="text-xs text-gray-500">{label}</p>
						<p class="text-lg font-bold mt-1">{value}</p>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Condominios -->
		<div class="bg-white rounded-xl shadow-sm border">
			<div class="px-5 py-4 border-b"><h3 class="font-semibold">Condomínios da Carteira</h3></div>
			<div class="p-4">
				<DataTable
					data={carteira.carteira?.condominios || []}
					columns={[
						{ key: 'codigo_ahreas', label: 'Código' },
						{ key: 'nome', label: 'Nome' },
						{ key: 'cnpj', label: 'CNPJ' },
						{ key: 'total_unidades', label: 'Unidades' },
					]}
					loading={false}
				/>
			</div>
		</div>

		<!-- Usuarios -->
		<div class="bg-white rounded-xl shadow-sm border">
			<div class="px-5 py-4 border-b flex items-center justify-between">
				<h3 class="font-semibold">Usuários Vinculados</h3>
				<button onclick={() => showVincular = true} class="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">Vincular Usuário</button>
			</div>
			<div class="p-4">
				{#if usuarios.length === 0}
					<p class="text-gray-500 text-center py-4">Nenhum usuário vinculado</p>
				{:else}
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50"><tr>
								<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nome</th>
								<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
								<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
								<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Principal</th>
								<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ações</th>
							</tr></thead>
							<tbody class="divide-y divide-gray-100">
								{#each usuarios as u}
									<tr class="hover:bg-gray-50">
										<td class="px-4 py-3 text-sm">{u.nome_completo}</td>
										<td class="px-4 py-3 text-sm">{u.email}</td>
										<td class="px-4 py-3 text-sm"><Badge text={u.tipo_vinculo} variant="info" /></td>
										<td class="px-4 py-3 text-sm">{#if u.principal}<Badge text="Principal" variant="success" />{/if}</td>
										<td class="px-4 py-3 text-sm">
											<button onclick={() => desvincular(u.usuario_id)} class="text-red-600 hover:text-red-800 text-xs">Desvincular</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<Modal open={showVincular} title="Vincular Usuário" onclose={() => showVincular = false}>
	<form onsubmit={(e) => { e.preventDefault(); vincularUsuario(); }} class="space-y-4">
		<div>
			<label for="uid" class="block text-sm font-medium text-gray-700 mb-1">ID do Usuário *</label>
			<input id="uid" type="number" bind:value={novoUsuario.usuario_id} required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
		</div>
		<div>
			<label for="tipo" class="block text-sm font-medium text-gray-700 mb-1">Tipo de Vínculo</label>
			<select id="tipo" bind:value={novoUsuario.tipo_vinculo} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
				<option value="gerente">Gerente</option>
				<option value="assistente">Assistente</option>
				<option value="supervisor">Supervisor</option>
				<option value="consultor">Consultor</option>
				<option value="estagiario">Estagiário</option>
			</select>
		</div>
		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" bind:checked={novoUsuario.principal} class="rounded border-gray-300" /> Principal
		</label>
		<div>
			<label for="obs" class="block text-sm font-medium text-gray-700 mb-1">Observação</label>
			<textarea id="obs" bind:value={novoUsuario.observacao} rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"></textarea>
		</div>
		<button type="submit" class="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Vincular</button>
	</form>
</Modal>
