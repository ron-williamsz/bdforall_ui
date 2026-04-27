<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiClient } from '$lib/api/client';
	import { DataTable } from '$lib/components';

	let gerentes = $state<any[]>([]);
	let loading = $state(true);

	async function loadData() {
		loading = true;
		try {
			const res = await apiClient.get('/gerentes');
			gerentes = res.gerentes || [];
		} finally {
			loading = false;
		}
	}

	$effect(() => { loadData(); });
</script>

<div class="space-y-4">
	<h1 class="text-2xl font-bold text-gray-800">Gerentes</h1>

	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div onclick={(e) => {
		const row = (e.target as HTMLElement).closest('tr');
		if (!row) return;
		const idx = row.rowIndex - 1;
		if (idx >= 0 && gerentes[idx]) goto(`/gerentes/${gerentes[idx].id}`);
	}}>
		<DataTable
			data={gerentes}
			columns={[
				{ key: 'nome', label: 'Nome' },
				{ key: 'email', label: 'Email' },
				{ key: 'telefone', label: 'Telefone' },
				{ key: 'total_condominios', label: 'Condomínios' },
				{ key: 'total_unidades', label: 'Unidades' },
				{ key: 'total_conselheiros', label: 'Conselheiros' },
			]}
			{loading}
		/>
	</div>
</div>
