<script lang="ts">
	import { apiClient } from '$lib/api/client';

	let categorias = $state<any[]>([]);
	let loading = $state(true);
	let expanded = $state<Record<number, boolean>>({});
	let fornecedores = $state<Record<number, any[]>>({});
	let loadingFornecedores = $state<Record<number, boolean>>({});

	async function loadData() {
		loading = true;
		try {
			const res = await apiClient.get('/categorias-fornecedores', { incluir_hierarquia: true });
			categorias = res.data || [];
		} finally { loading = false; }
	}

	$effect(() => { loadData(); });

	async function toggleExpand(catId: number) {
		expanded = { ...expanded, [catId]: !expanded[catId] };
		if (expanded[catId] && !fornecedores[catId]) {
			loadingFornecedores = { ...loadingFornecedores, [catId]: true };
			try {
				const res = await apiClient.get(`/categorias-fornecedores/${catId}/fornecedores`);
				fornecedores = { ...fornecedores, [catId]: res.data || [] };
			} catch { fornecedores = { ...fornecedores, [catId]: [] }; }
			finally { loadingFornecedores = { ...loadingFornecedores, [catId]: false }; }
		}
	}
</script>

<div class="space-y-4">
	<div class="flex items-center gap-3">
		<a href="/fornecedores" class="p-2 hover:bg-gray-200 rounded-lg">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
		</a>
		<h1 class="text-2xl font-bold text-gray-800">Categorias de Fornecedores</h1>
	</div>

	{#if loading}
		<div class="text-center py-8 text-gray-500">Carregando...</div>
	{:else}
		<div class="space-y-2">
			{#each categorias as cat}
				<div class="bg-white rounded-xl shadow-sm border overflow-hidden">
					<button
						onclick={() => toggleExpand(cat.id)}
						class="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50"
					>
						<div class="flex items-center gap-3">
							<svg class="w-4 h-4 transition-transform {expanded[cat.id] ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
							<span class="font-semibold text-gray-800">{cat.nome}</span>
							{#if cat.descricao}<span class="text-sm text-gray-500 ml-2">{cat.descricao}</span>{/if}
						</div>
						<span class="text-sm text-gray-500">{cat.total_fornecedores || 0} fornecedores</span>
					</button>

					{#if expanded[cat.id]}
						<div class="border-t px-5 py-3 bg-gray-50">
							<!-- Subcategorias -->
							{#if cat.subcategorias?.length}
								<h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Subcategorias</h4>
								<div class="flex flex-wrap gap-2 mb-3">
									{#each cat.subcategorias as sub}
										<span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border text-sm">
											{sub.nome} <span class="ml-1 text-gray-400 text-xs">({sub.total_fornecedores || 0})</span>
										</span>
									{/each}
								</div>
							{/if}

							<!-- Fornecedores -->
							{#if loadingFornecedores[cat.id]}
								<p class="text-sm text-gray-500">Carregando fornecedores...</p>
							{:else if fornecedores[cat.id]?.length}
								<h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Fornecedores</h4>
								<div class="space-y-1">
									{#each fornecedores[cat.id] as f}
										<a href="/fornecedores/{f.id}" class="block px-3 py-2 rounded-lg hover:bg-white text-sm">
											<span class="font-medium">{f.razao_social}</span>
											<span class="text-gray-500 ml-2">{f.cidade || ''}/{f.uf || ''}</span>
										</a>
									{/each}
								</div>
							{:else if fornecedores[cat.id]}
								<p class="text-sm text-gray-500">Nenhum fornecedor nesta categoria</p>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
