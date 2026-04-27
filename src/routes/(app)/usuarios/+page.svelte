<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiClient } from '$lib/api/client';
	import { DataTable, Pagination, Modal, Alert } from '$lib/components';

	let data = $state<any[]>([]);
	let total = $state(0);
	let skip = $state(0);
	let limit = $state(50);
	let loading = $state(true);
	let filtroAtivo = $state('');
	let filtroPerfil = $state('');
	let busca = $state('');
	let buscaTimeout: ReturnType<typeof setTimeout>;
	let perfisDisponiveis = $state<any[]>([]);
	let showCreate = $state(false);
	let showStats = $state(false);
	let stats = $state<any>(null);
	let alert = $state({ message: '', type: 'info' as 'success' | 'error' | 'info' | 'warning' });

	let form = $state({ email: '', senha: '', nome_completo: '', telefone: '', cargo: '', departamento_id: '', perfil_id: '' });

	async function loadData() {
		loading = true;
		try {
			const params: Record<string, any> = { skip, limit };
			if (filtroAtivo !== '') params.ativo = filtroAtivo === 'true';
			if (filtroPerfil) params.perfil_id = Number(filtroPerfil);
			if (busca.trim()) params.busca = busca.trim();
			const res = await apiClient.get('/usuarios', params);
			data = res.usuarios || [];
			total = res.total || 0;
		} finally {
			loading = false;
		}
	}

	async function loadPerfis() {
		try {
			const res = await apiClient.get('/usuarios/roles/disponiveis');
			perfisDisponiveis = res.perfis || [];
		} catch {}
	}

	$effect(() => { loadData(); loadPerfis(); });

	async function createUser(e: Event) {
		e.preventDefault();
		try {
			const body: Record<string, any> = { email: form.email, senha: form.senha, nome_completo: form.nome_completo };
			if (form.telefone) body.telefone = form.telefone;
			if (form.cargo) body.cargo = form.cargo;
			if (form.departamento_id) body.departamento_id = Number(form.departamento_id);
			if (form.perfil_id) body.perfil_id = Number(form.perfil_id);
			await apiClient.post('/usuarios', body);
			alert = { message: 'Usuário criado com sucesso', type: 'success' };
			showCreate = false;
			form = { email: '', senha: '', nome_completo: '', telefone: '', cargo: '', departamento_id: '', perfil_id: '' };
			loadData();
		} catch (err: any) {
			alert = { message: err.message, type: 'error' };
		}
	}

	async function loadStats() {
		try {
			stats = await apiClient.get('/usuarios/estatisticas');
			showStats = true;
		} catch (err: any) {
			alert = { message: err.message, type: 'error' };
		}
	}

	const columns = [
		{ key: 'nome_completo', label: 'Nome' },
		{ key: 'email', label: 'Email' },
		{ key: 'cargo', label: 'Cargo' },
		{ key: 'departamento', label: 'Departamento' },
		{ key: 'perfil_principal', label: 'Perfil' },
		{ key: 'ativo', label: 'Status', render: (v: any) => `<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${v ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${v ? 'Ativo' : 'Inativo'}</span>` },
	];
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between flex-wrap gap-2">
		<h1 class="text-2xl font-bold text-gray-800">Usuários</h1>
		<div class="flex gap-2">
			<button onclick={loadStats} class="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">Estatísticas</button>
			<button onclick={() => showCreate = true} class="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">Novo Usuário</button>
		</div>
	</div>

	{#if alert.message}
		<Alert message={alert.message} type={alert.type} onclose={() => alert.message = ''} />
	{/if}

	<div class="bg-white rounded-xl shadow-sm border p-4">
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<div class="relative sm:col-span-3 lg:col-span-1">
				<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<input
					type="text"
					bind:value={busca}
					oninput={() => { clearTimeout(buscaTimeout); buscaTimeout = setTimeout(() => { skip = 0; loadData(); }, 400); }}
					placeholder="Buscar por nome, email ou cargo..."
					class="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
				/>
				{#if busca}
					<button onclick={() => { busca = ''; skip = 0; loadData(); }} class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
					</button>
				{/if}
			</div>
			<select bind:value={filtroAtivo} onchange={() => { skip = 0; loadData(); }} class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
				<option value="">Todos os status</option>
				<option value="true">Ativos</option>
				<option value="false">Inativos</option>
			</select>
			<select bind:value={filtroPerfil} onchange={() => { skip = 0; loadData(); }} class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
				<option value="">Todos os perfis</option>
				{#each perfisDisponiveis as p}<option value={p.id}>{p.nome}</option>{/each}
			</select>
		</div>
	</div>

	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div onclick={(e) => {
		const row = (e.target as HTMLElement).closest('tr');
		if (!row) return;
		const idx = row.rowIndex - 1;
		if (idx >= 0 && data[idx]) goto(`/usuarios/${data[idx].id}`);
	}}>
		<DataTable {data} {columns} {loading} />
	</div>
	<Pagination {total} {skip} {limit} onchange={(s) => { skip = s; loadData(); }} />
</div>

<!-- Create Modal -->
<Modal open={showCreate} title="Novo Usuário" onclose={() => showCreate = false}>
	<form onsubmit={createUser} class="space-y-3">
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label><input type="text" bind:value={form.nome_completo} required minlength="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" bind:value={form.email} required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Senha *</label><input type="password" bind:value={form.senha} required minlength="6" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div class="grid grid-cols-2 gap-2">
			<div><label class="block text-sm font-medium text-gray-700 mb-1">Telefone</label><input type="text" bind:value={form.telefone} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
			<div><label class="block text-sm font-medium text-gray-700 mb-1">Cargo</label><input type="text" bind:value={form.cargo} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		</div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
			<select bind:value={form.perfil_id} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
				<option value="">Sem perfil</option>
				{#each perfisDisponiveis as p}<option value={p.id}>{p.nome}</option>{/each}
			</select>
		</div>
		<button type="submit" class="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Criar Usuário</button>
	</form>
</Modal>

<!-- Stats Modal -->
<Modal open={showStats} title="Estatísticas de Usuários" onclose={() => showStats = false}>
	{#if stats}
		<div class="space-y-4">
			<div class="grid grid-cols-2 gap-3">
				{#each [['Total', stats.resumo_geral?.total_usuarios], ['Ativos', stats.resumo_geral?.usuarios_ativos], ['Inativos', stats.resumo_geral?.usuarios_inativos], ['Com API Key', stats.resumo_geral?.usuarios_com_api_key]] as [label, value]}
					<div class="border rounded-lg p-3 text-center"><p class="text-xs text-gray-500">{label}</p><p class="text-xl font-bold">{value}</p></div>
				{/each}
			</div>
			{#if stats.por_perfil}
				<h4 class="font-medium text-sm text-gray-700">Por Perfil</h4>
				{#each stats.por_perfil as p}
					<div class="flex justify-between text-sm border-b py-1"><span>{p.perfil}</span><span class="font-medium">{p.total} ({p.ativos} ativos)</span></div>
				{/each}
			{/if}
		</div>
	{/if}
</Modal>
