<script lang="ts">
	import { apiClient } from '$lib/api/client';
	import { DataTable, SearchBar } from '$lib/components';

	let codigo = $state('');
	let credenciais = $state<any[]>([]);
	let tipos = $state<any[]>([]);
	let loading = $state(false);
	let showPasswords = $state<Record<number, boolean>>({});
	let searched = $state(false);

	async function loadTipos() {
		try {
			const res = await apiClient.get('/credenciais/tipos');
			tipos = res.tipos || [];
		} catch {}
	}

	$effect(() => { loadTipos(); });

	async function searchCredenciais(val: string) {
		codigo = val;
		if (!val) { credenciais = []; searched = false; return; }
		loading = true;
		searched = true;
		try {
			const res = await apiClient.get(`/credenciais/${val}`);
			credenciais = res.credenciais || [];
		} catch {
			credenciais = [];
		} finally {
			loading = false;
		}
	}

	function togglePassword(id: number) {
		showPasswords = { ...showPasswords, [id]: !showPasswords[id] };
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between flex-wrap gap-2">
		<h1 class="text-2xl font-bold text-gray-800">Credenciais</h1>
		<a href="/credenciais/cobertura" class="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">Relatório de Cobertura</a>
	</div>

	<div class="bg-white rounded-xl shadow-sm border p-4">
		<SearchBar value={codigo} placeholder="Buscar por código do condomínio..." onsearch={searchCredenciais} />
	</div>

	{#if searched}
		<div class="overflow-x-auto rounded-lg border border-gray-200">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50"><tr>
					<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
					<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Login</th>
					<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Senha</th>
					<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Campo Extra</th>
					<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Observações</th>
				</tr></thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#if loading}
						{#each Array(3) as _}<tr>{#each Array(5) as _c}<td class="px-4 py-3"><div class="h-4 bg-gray-200 rounded animate-pulse"></div></td>{/each}</tr>{/each}
					{:else if credenciais.length === 0}
						<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">Nenhuma credencial encontrada para este código</td></tr>
					{:else}
						{#each credenciais as cred, i}
							<tr class="{i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
								<td class="px-4 py-3 text-sm font-medium">{cred.nome_credencial}</td>
								<td class="px-4 py-3 text-sm font-mono">{cred.login || '-'}</td>
								<td class="px-4 py-3 text-sm">
									<span class="font-mono">{showPasswords[cred.id] ? cred.senha : '••••••'}</span>
									<button onclick={() => togglePassword(cred.id)} class="ml-2 text-primary-600 hover:text-primary-800 text-xs">
										{showPasswords[cred.id] ? 'Ocultar' : 'Mostrar'}
									</button>
								</td>
								<td class="px-4 py-3 text-sm">{cred.campo_extra_nome ? `${cred.campo_extra_nome}: ${cred.campo_extra_valor}` : '-'}</td>
								<td class="px-4 py-3 text-sm">{cred.observacoes || '-'}</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	{/if}

	<!-- Tipos -->
	{#if tipos.length > 0}
		<div class="bg-white rounded-xl shadow-sm border">
			<div class="px-5 py-4 border-b"><h3 class="font-semibold">Tipos de Credenciais Disponíveis</h3></div>
			<div class="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
				{#each tipos as t}
					<div class="border rounded-lg p-3 text-center">
						<p class="font-medium text-sm">{t.nome_credencial}</p>
						<p class="text-xs text-gray-500">{t.total_condominios} condomínios</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
