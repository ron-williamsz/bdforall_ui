<script lang="ts">
	import { page } from '$app/state';
	import { apiClient } from '$lib/api/client';
	import { DataTable, Modal, Alert } from '$lib/components';

	let fornecedorId = $derived(page.params.id);
	let fornecedor = $state<any>(null);
	let contatos = $state<any[]>([]);
	let loading = $state(true);
	let showEdit = $state(false);
	let alert = $state({ message: '', type: 'info' as 'success' | 'error' | 'info' | 'warning' });
	let editForm = $state<any>({});
	let tipoContato = $state('');

	async function loadData() {
		loading = true;
		try {
			const [f, c] = await Promise.all([
				apiClient.get(`/fornecedores/${fornecedorId}`),
				apiClient.get(`/fornecedores/${fornecedorId}/contatos`).catch(() => ({ data: [] })),
			]);
			fornecedor = f;
			contatos = c.data || [];
			editForm = { ...f };
		} finally { loading = false; }
	}

	$effect(() => { if (fornecedorId) loadData(); });

	async function updateFornecedor(e: Event) {
		e.preventDefault();
		try {
			await apiClient.put(`/fornecedores/${fornecedorId}`, {
				razao_social: editForm.razao_social,
				nome_fantasia: editForm.nome_fantasia,
				cidade: editForm.cidade,
				uf: editForm.uf,
				email: editForm.email,
				telefone: editForm.telefone,
				observacoes: editForm.observacoes,
			});
			alert = { message: 'Fornecedor atualizado', type: 'success' };
			showEdit = false;
			loadData();
		} catch (err: any) { alert = { message: err.message, type: 'error' }; }
	}

	function stars(v: number) {
		const full = Math.round(v || 0);
		return Array(5).fill(0).map((_, i) => i < full ? '★' : '☆').join('');
	}

	let filteredContatos = $derived(
		tipoContato ? contatos.filter(c => c.tipo === tipoContato) : contatos
	);
</script>

<div class="space-y-4">
	<div class="flex items-center gap-3">
		<a href="/fornecedores" class="p-2 hover:bg-gray-200 rounded-lg">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
		</a>
		<h1 class="text-2xl font-bold text-gray-800">{fornecedor?.razao_social || 'Carregando...'}</h1>
	</div>

	{#if alert.message}<Alert message={alert.message} type={alert.type} onclose={() => alert.message = ''} />{/if}

	{#if !loading && fornecedor}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="bg-white rounded-xl shadow-sm border p-5 space-y-3">
				<div class="flex justify-between items-center">
					<h3 class="font-semibold text-gray-700">Dados do Fornecedor</h3>
					<button onclick={() => showEdit = true} class="text-primary-600 text-sm hover:text-primary-800">Editar</button>
				</div>
				{#each [['CNPJ', fornecedor.cnpj], ['Razão Social', fornecedor.razao_social], ['Nome Fantasia', fornecedor.nome_fantasia], ['Cidade/UF', `${fornecedor.cidade || '-'}/${fornecedor.uf || '-'}`], ['Email', fornecedor.email], ['Telefone', fornecedor.telefone], ['Categoria', fornecedor.categoria_nome], ['Subcategoria', fornecedor.sub_categoria_nome]] as [label, value]}
					<div class="flex justify-between text-sm"><span class="text-gray-500">{label}</span><span class="font-medium">{value || '-'}</span></div>
				{/each}
				<div class="flex justify-between text-sm"><span class="text-gray-500">Avaliação</span><span class="text-yellow-500 text-lg">{stars(fornecedor.avaliacao)}</span></div>
			</div>

			<div class="bg-white rounded-xl shadow-sm border p-5 space-y-3">
				<h3 class="font-semibold text-gray-700">Endereço</h3>
				{#each [['Endereço', fornecedor.endereco], ['Bairro', fornecedor.bairro], ['CEP', fornecedor.cep]] as [label, value]}
					<div class="flex justify-between text-sm"><span class="text-gray-500">{label}</span><span class="font-medium">{value || '-'}</span></div>
				{/each}
				{#if fornecedor.observacoes}
					<div class="mt-4"><p class="text-sm text-gray-500">Observações</p><p class="text-sm mt-1">{fornecedor.observacoes}</p></div>
				{/if}
			</div>
		</div>

		<!-- Contatos -->
		<div class="bg-white rounded-xl shadow-sm border">
			<div class="px-5 py-4 border-b flex items-center justify-between">
				<h3 class="font-semibold">Contatos ({contatos.length})</h3>
				<select bind:value={tipoContato} class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none">
					<option value="">Todos</option>
					<option value="email">Email</option>
					<option value="telefone">Telefone</option>
					<option value="celular">Celular</option>
					<option value="whatsapp">WhatsApp</option>
				</select>
			</div>
			<div class="p-4">
				<DataTable
					data={filteredContatos}
					columns={[
						{ key: 'tipo', label: 'Tipo' },
						{ key: 'valor', label: 'Valor' },
						{ key: 'descricao', label: 'Descrição' },
						{ key: 'principal', label: 'Principal', render: (v: any) => v ? '<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Sim</span>' : '-' },
					]}
					loading={false}
					emptyMessage="Nenhum contato encontrado"
				/>
			</div>
		</div>
	{/if}
</div>

<Modal open={showEdit} title="Editar Fornecedor" onclose={() => showEdit = false}>
	<form onsubmit={updateFornecedor} class="space-y-3">
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Razão Social</label><input type="text" bind:value={editForm.razao_social} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label><input type="text" bind:value={editForm.nome_fantasia} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		<div class="grid grid-cols-2 gap-2">
			<div><label class="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" bind:value={editForm.email} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
			<div><label class="block text-sm font-medium text-gray-700 mb-1">Telefone</label><input type="text" bind:value={editForm.telefone} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div>
		</div>
		<div><label class="block text-sm font-medium text-gray-700 mb-1">Observações</label><textarea bind:value={editForm.observacoes} rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"></textarea></div>
		<button type="submit" class="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Salvar</button>
	</form>
</Modal>
