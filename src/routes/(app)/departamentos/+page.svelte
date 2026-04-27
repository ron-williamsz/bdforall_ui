<script lang="ts">
	import { apiClient } from '$lib/api/client';
	import { DataTable, Pagination, Badge } from '$lib/components';

	let data = $state<any[]>([]);
	let total = $state(0);
	let skip = $state(0);
	let limit = $state(100);
	let loading = $state(true);
	let selected = $state<any>(null);
	let ramais = $state<any[]>([]);
	let loadingRamais = $state(false);

	async function loadData() {
		loading = true;
		try {
			const res = await apiClient.get('/departamentos', { skip, limit });
			data = res.data || [];
			total = res.total || 0;
		} finally { loading = false; }
	}

	$effect(() => { loadData(); });

	async function selectDept(dept: any) {
		selected = dept;
		loadingRamais = true;
		try {
			const res = await apiClient.get(`/departamentos/${dept.id}/ramais`);
			ramais = res.data || [];
		} catch { ramais = []; }
		finally { loadingRamais = false; }
	}
</script>

<div class="space-y-4">
	<h1 class="text-2xl font-bold text-gray-800">Departamentos</h1>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<div>
			<div class="overflow-x-auto rounded-lg border border-gray-200">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50"><tr>
						<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nome</th>
						<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Descrição</th>
						<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ativo</th>
					</tr></thead>
					<tbody class="divide-y divide-gray-200">
						{#if loading}
							{#each Array(3) as _}<tr>{#each Array(3) as _c}<td class="px-4 py-3"><div class="h-4 bg-gray-200 rounded animate-pulse"></div></td>{/each}</tr>{/each}
						{:else}
							{#each data as dept, i}
								<tr
									class="{selected?.id === dept.id ? 'bg-primary-50 border-l-4 border-primary-500' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-primary-50 cursor-pointer"
									onclick={() => selectDept(dept)}
								>
									<td class="px-4 py-3 text-sm font-medium">{dept.nome}</td>
									<td class="px-4 py-3 text-sm text-gray-600">{dept.descricao || '-'}</td>
									<td class="px-4 py-3 text-sm"><Badge text={dept.ativo ? 'Sim' : 'Não'} variant={dept.ativo ? 'success' : 'danger'} /></td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
			<Pagination {total} {skip} {limit} onchange={(s) => { skip = s; loadData(); }} />
		</div>

		<div>
			{#if selected}
				<div class="bg-white rounded-xl shadow-sm border">
					<div class="px-5 py-4 border-b">
						<h3 class="font-semibold">Ramais - {selected.nome}</h3>
					</div>
					<div class="p-4">
						{#if loadingRamais}
							<p class="text-gray-500 text-center py-4">Carregando...</p>
						{:else if ramais.length === 0}
							<p class="text-gray-500 text-center py-4">Nenhum ramal</p>
						{:else}
							<DataTable
								data={ramais}
								columns={[
									{ key: 'ramal', label: 'Ramal' },
									{ key: 'nome_contato', label: 'Contato' },
									{ key: 'descricao', label: 'Descrição' },
								]}
								loading={false}
							/>
						{/if}
					</div>
				</div>
			{:else}
				<div class="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-8 text-center text-gray-400">
					Selecione um departamento para ver os ramais
				</div>
			{/if}
		</div>
	</div>
</div>
