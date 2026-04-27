<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiClient } from '$lib/api/client';
	import { Pagination, SearchBar, Modal, Alert, Badge } from '$lib/components';

	let data = $state<any[]>([]);
	let total = $state(0);
	let skip = $state(0);
	let limit = $state(100);
	let loading = $state(true);
	let busca = $state('');
	let categoriaFilter = $state('');
	let ufFilter = $state('');
	let categorias = $state<any[]>([]);
	let showCreate = $state(false);
	let alert = $state({ message: '', type: 'info' as 'success' | 'error' | 'info' | 'warning' });

	let form = $state({
		cnpj: '', razao_social: '', nome_fantasia: '', endereco: '', cep: '', bairro: '',
		cidade: '', uf: '', email: '', telefone: '', categoria_id: '', sub_categoria_id: '',
		avaliacao: 0, observacoes: ''
	});

	const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

	async function loadData() {
		loading = true;
		try {
			const params: Record<string, any> = { skip, limit };
			if (busca) params.busca = busca;
			if (categoriaFilter) params.categoria_id = Number(categoriaFilter);
			if (ufFilter) params.uf = ufFilter;
			const res = await apiClient.get('/fornecedores', params);
			data = res.data || [];
			total = res.total || 0;
		} finally { loading = false; }
	}

	async function loadCategorias() {
		try {
			const res = await apiClient.get('/categorias-fornecedores');
			categorias = res.data || [];
		} catch {}
	}

	$effect(() => { loadData(); loadCategorias(); });

	function stars(v: number) {
		const full = Math.round(v || 0);
		return Array(5).fill(0).map((_, i) => i < full ? '★' : '☆').join('');
	}

	async function createFornecedor(e: Event) {
		e.preventDefault();
		try {
			const body: Record<string, any> = { cnpj: form.cnpj, razao_social: form.razao_social };
			if (form.nome_fantasia) body.nome_fantasia = form.nome_fantasia;
			if (form.endereco) body.endereco = form.endereco;
			if (form.cep) body.cep = form.cep;
			if (form.bairro) body.bairro = form.bairro;
			if (form.cidade) body.cidade = form.cidade;
			if (form.uf) body.uf = form.uf;
			if (form.email) body.email = form.email;
			if (form.telefone) body.telefone = form.telefone;
			if (form.categoria_id) body.categoria_id = Number(form.categoria_id);
			if (form.sub_categoria_id) body.sub_categoria_id = Number(form.sub_categoria_id);
			if (form.avaliacao) body.avaliacao = Number(form.avaliacao);
			if (form.observacoes) body.observacoes = form.observacoes;
			await apiClient.post('/fornecedores', body);
			alert = { message: 'Fornecedor criado com sucesso', type: 'success' };
			showCreate = false;
			loadData();
		} catch (err: any) { alert = { message: err.message, type: 'error' }; }
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between flex-wrap gap-2">
		<h1 class="text-2xl font-bold text-gray-800">Fornecedores</h1>
		<div class="flex gap-2">
			<a href="/fornecedores/categorias" class="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">Categorias</a>
			<button onclick={() => showCreate = true} class="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">Novo Fornecedor</button>
		</div>
	</div>

	{#if alert.message}<Alert message={alert.message} type={alert.type} onclose={() => alert.message = ''} />{/if}

	<div class="bg-white rounded-xl shadow-sm border p-4">
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<SearchBar value={busca} placeholder="Buscar por razão social, CNPJ..." onsearch={(v) => { busca = v; skip = 0; loadData(); }} />
			<select bind:value={categoriaFilter} onchange={() => { skip = 0; loadData(); }} class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
				<option value="">Todas as categorias</option>
				{#each categorias as c}<option value={c.id}>{c.nome}</option>{/each}
			</select>
			<select bind:value={ufFilter} onchange={() => { skip = 0; loadData(); }} class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
				<option value="">Todos os estados</option>
				{#each UFS as uf}<option value={uf}>{uf}</option>{/each}
			</select>
		</div>
	</div>

	<div class="overflow-x-auto rounded-lg border border-gray-200">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50"><tr>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Razão Social</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nome Fantasia</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">CNPJ</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cidade/UF</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Categoria</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Avaliação</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ativo</th>
			</tr></thead>
			<tbody class="divide-y divide-gray-200">
				{#if loading}
					{#each Array(5) as _}<tr>{#each Array(7) as _c}<td class="px-4 py-3"><div class="h-4 bg-gray-200 rounded animate-pulse"></div></td>{/each}</tr>{/each}
				{:else if data.length === 0}
					<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">Nenhum fornecedor encontrado</td></tr>
				{:else}
					{#each data as item, i}
						<tr class="{i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-primary-50 cursor-pointer" onclick={() => goto(`/fornecedores/${item.id}`)}>
							<td class="px-4 py-3 text-sm font-medium">{item.razao_social}</td>
							<td class="px-4 py-3 text-sm">{item.nome_fantasia || '-'}</td>
							<td class="px-4 py-3 text-sm font-mono">{item.cnpj}</td>
							<td class="px-4 py-3 text-sm">{item.cidade || '-'}/{item.uf || '-'}</td>
							<td class="px-4 py-3 text-sm">{item.categoria_nome || '-'}</td>
							<td class="px-4 py-3 text-sm text-yellow-500">{stars(item.avaliacao)}</td>
							<td class="px-4 py-3 text-sm"><Badge text={item.ativo ? 'Sim' : 'Não'} variant={item.ativo ? 'success' : 'danger'} /></td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
	<Pagination {total} {skip} {limit} onchange={(s) => { skip = s; loadData(); }} />
</div>

<Modal open={showCreate} title="Novo Fornecedor" onclose={() => showCreate = false}>
	<form onsubmit={createFornecedor} class="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
		<div><label class="block text-sm font-medium text-gray-700 mb-1">CNPJ *</label><input type="text" bind:value={form.cnpj} required maxlength="18" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Razão Social *</label><input type="text" bind:value={form.razao_social} required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label><input type="text" bind:value={form.nome_fantasia} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div class="grid grid-cols-2 gap-2">
			<div><label class="block text-sm font-medium text-gray-700 mb-1">Cidade</label><input type="text" bind:value={form.cidade} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
			<div><label class="block text-sm font-medium text-gray-700 mb-1">UF</label>
				<select bind:value={form.uf} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
					<option value="">-</option>{#each UFS as uf}<option value={uf}>{uf}</option>{/each}
				</select>
			</div>
		</div>
		<div class="grid grid-cols-2 gap-2">
			<div><label class="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" bind:value={form.email} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
			<div><label class="block text-sm font-medium text-gray-700 mb-1">Telefone</label><input type="text" bind:value={form.telefone} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		</div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
			<select bind:value={form.categoria_id} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
				<option value="">Nenhuma</option>
				{#each categorias as c}<option value={c.id}>{c.nome}</option>{/each}
			</select>
		</div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Avaliação (0-5)</label><input type="number" min="0" max="5" step="0.5" bind:value={form.avaliacao} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Observações</label><textarea bind:value={form.observacoes} rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"></textarea></div>
		<button type="submit" class="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Criar Fornecedor</button>
	</form>
</Modal>
