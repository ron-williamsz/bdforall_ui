<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiClient } from '$lib/api/client';
	import { DataTable, Pagination, SearchBar, Badge } from '$lib/components';

	let data = $state<any[]>([]);
	let total = $state(0);
	let skip = $state(0);
	let limit = $state(100);
	let loading = $state(true);
	let busca = $state('');
	let gerente = $state('');
	let status = $state('');

	const columns = [
		{ key: 'codigo_ahreas', label: 'Código' },
		{ key: 'nome', label: 'Nome' },
		{ key: 'cnpj', label: 'CNPJ' },
		{ key: 'cidade', label: 'Cidade', render: (_v: any, r: any) => `${r.cidade || '-'}/${r.uf || '-'}` },
		{ key: 'gerente_nome', label: 'Gerente' },
		{ key: 'total_unidades', label: 'Unidades' },
		{ key: 'status', label: 'Status', render: (v: any) => `<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${v === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${v || '-'}</span>` },
	];

	async function loadData() {
		loading = true;
		try {
			const params: Record<string, any> = { skip, limit };
			if (busca) params.busca = busca;
			if (gerente) params.gerente = gerente;
			if (status) params.status = status;
			const res = await apiClient.get('/condominios', params);
			data = res.data || [];
			total = res.total || 0;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		busca; gerente; status; skip; limit;
		loadData();
	});

	function handleSearch(v: string) {
		busca = v;
		skip = 0;
	}

	function handlePageChange(s: number) {
		skip = s;
	}

	function handleRowClick(row: any) {
		goto(`/condominios/${row.codigo_ahreas}`);
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-800">Condomínios</h1>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<SearchBar value={busca} placeholder="Buscar por nome, código ou CNPJ..." onsearch={handleSearch} />
			<input
				type="text"
				placeholder="Filtrar por gerente..."
				bind:value={gerente}
				oninput={() => { skip = 0; }}
				class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
			/>
			<select
				bind:value={status}
				onchange={() => { skip = 0; }}
				class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
			>
				<option value="">Todos os status</option>
				<option value="ativo">Ativo</option>
				<option value="inativo">Inativo</option>
			</select>
		</div>
	</div>

	<!-- Table -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div onclick={(e) => {
		const row = (e.target as HTMLElement).closest('tr');
		if (!row) return;
		const idx = row.rowIndex - 1;
		if (idx >= 0 && data[idx]) handleRowClick(data[idx]);
	}}>
		<DataTable {data} {columns} {loading} />
	</div>
	<Pagination {total} {skip} {limit} onchange={handlePageChange} />
</div>
