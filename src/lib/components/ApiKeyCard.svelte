<script lang="ts">
	import { apiClient } from '$lib/api/client';
	import { getUser } from '$lib/stores/auth.svelte';
	import Modal from './Modal.svelte';
	import Badge from './Badge.svelte';
	import Alert from './Alert.svelte';

	let { usuarioId, usuarioEmail }: { usuarioId: number; usuarioEmail: string } = $props();

	let status = $state<any>(null);
	let loading = $state(true);
	let showConfirm = $state(false);
	let showGenerated = $state(false);
	let newKey = $state('');
	let alert = $state({ message: '', type: 'info' as 'success' | 'error' | 'info' | 'warning' });

	const currentUser = $derived(getUser());
	const canManage = $derived(
		currentUser?.is_admin || currentUser?.id === usuarioId
	);
	const isSelf = $derived(currentUser?.id === usuarioId);

	async function loadStatus() {
		loading = true;
		try {
			const path = isSelf
				? '/auth/api-key/status'
				: `/auth/api-key/status?usuario_id=${usuarioId}`;
			status = await apiClient.get(path);
		} catch (e: any) {
			alert = { message: e.message, type: 'error' };
		} finally {
			loading = false;
		}
	}

	async function gerarKey() {
		try {
			const params = isSelf ? undefined : { usuario_id: usuarioId };
			const res = await apiClient.postWithParams('/auth/api-key/gerar', params);
			newKey = res.api_key;
			showConfirm = false;
			showGenerated = true;
			await loadStatus();
		} catch (e: any) {
			alert = { message: e.message, type: 'error' };
			showConfirm = false;
		}
	}

	async function revogarKey() {
		if (!confirm('Revogar a API Key? Isso desligará qualquer integração que a use.')) return;
		try {
			const path = isSelf
				? '/auth/api-key/revogar'
				: `/auth/api-key/revogar?usuario_id=${usuarioId}`;
			await apiClient.delete(path);
			alert = { message: 'API Key revogada', type: 'success' };
			await loadStatus();
		} catch (e: any) {
			alert = { message: e.message, type: 'error' };
		}
	}

	async function copiarKey() {
		try {
			await navigator.clipboard.writeText(newKey);
			alert = { message: 'Copiada para a área de transferência', type: 'success' };
		} catch {
			alert = { message: 'Falha ao copiar. Selecione e copie manualmente.', type: 'warning' };
		}
	}

	function fecharModalGerada() {
		showGenerated = false;
		newKey = '';
	}

	function humanTime(iso: string | null): string {
		if (!iso) return 'nunca';
		const date = new Date(iso.replace(' ', 'T'));
		const diff = Date.now() - date.getTime();
		const days = Math.floor(diff / 86400000);
		if (days === 0) return 'hoje';
		if (days === 1) return 'ontem';
		if (days < 30) return `há ${days} dias`;
		return date.toLocaleDateString('pt-BR');
	}

	$effect(() => {
		if (usuarioId && canManage) loadStatus();
	});
</script>

{#if canManage}
	<div class="bg-white rounded-xl shadow-sm border p-5 space-y-3">
		<div class="flex items-center justify-between">
			<h3 class="font-semibold text-gray-700">Integração / API Key</h3>
			{#if !loading && status}
				<Badge
					text={status.api_key_ativa ? 'Ativa' : 'Inativa'}
					variant={status.api_key_ativa ? 'success' : 'neutral'}
				/>
			{/if}
		</div>

		{#if alert.message}
			<Alert
				message={alert.message}
				type={alert.type}
				onclose={() => (alert = { message: '', type: 'info' })}
			/>
		{/if}

		{#if loading}
			<p class="text-sm text-gray-500">Carregando...</p>
		{:else if status?.api_key_ativa}
			<div class="text-sm text-gray-600 space-y-1">
				<div class="flex justify-between">
					<span class="text-gray-500">Criada</span>
					<span class="font-medium">{humanTime(status.created_at)}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-500">Último uso</span>
					<span class="font-medium">{humanTime(status.last_used_at)}</span>
				</div>
			</div>
			<p class="text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
				⚠ A chave original não pode ser recuperada. Se perdeu, gere uma nova (invalida a atual).
			</p>
			<div class="flex gap-2">
				<button
					onclick={() => (showConfirm = true)}
					class="flex-1 py-2 px-4 text-sm border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50"
				>
					Gerar Nova
				</button>
				<button
					onclick={revogarKey}
					class="flex-1 py-2 px-4 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
				>
					Revogar
				</button>
			</div>
		{:else}
			<p class="text-sm text-gray-600">
				{#if isSelf}
					Você não possui API Key. Use uma API Key para permitir que sistemas externos acessem a API
					em seu nome.
				{:else}
					Este usuário não possui API Key. Use uma API Key para permitir que sistemas externos
					acessem a API em nome deste usuário.
				{/if}
			</p>
			<button
				onclick={() => (showConfirm = true)}
				class="w-full py-2 px-4 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
			>
				Gerar API Key
			</button>
		{/if}
	</div>

	<!-- Modal de confirmação -->
	<Modal open={showConfirm} title="Gerar API Key" onclose={() => (showConfirm = false)}>
		<div class="space-y-3">
			{#if status?.api_key_ativa}
				<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
					⚠ Este usuário já possui uma API Key. Gerar uma nova <strong>invalidará a atual</strong> e
					qualquer integração que a use deixará de funcionar.
				</div>
			{/if}
			<p class="text-sm text-gray-700">
				A nova chave será exibida <strong>apenas uma vez</strong>. Certifique-se de ter onde guardá-la
				(ex: gerenciador de senhas) antes de continuar.
			</p>
			<div class="flex gap-2">
				<button
					onclick={() => (showConfirm = false)}
					class="flex-1 py-2 px-4 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
				>
					Cancelar
				</button>
				<button
					onclick={gerarKey}
					class="flex-1 py-2 px-4 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
				>
					Gerar
				</button>
			</div>
		</div>
	</Modal>

	<!-- Modal com a chave (exibição única) -->
	<Modal open={showGenerated} title="Nova API Key Gerada" onclose={fecharModalGerada}>
		<div class="space-y-3">
			<div class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
				⚠ <strong>ATENÇÃO:</strong> esta chave será exibida apenas uma vez. Copie agora. Se fechar sem
				copiar, precisará gerar outra.
			</div>
			<div class="bg-gray-50 border border-gray-300 rounded-lg p-3 font-mono text-xs break-all select-all">
				{newKey}
			</div>
			<button
				onclick={copiarKey}
				class="w-full py-2 px-4 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
			>
				📋 Copiar para área de transferência
			</button>
			<details class="text-xs text-gray-600">
				<summary class="cursor-pointer font-medium select-none">Como usar</summary>
				<pre class="mt-2 bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-[11px]">{`curl -H "X-API-Key: ${newKey}" \\
  https://api.bdforall.grupozangari.com.br/api/condominios`}</pre>
			</details>
			<button
				onclick={fecharModalGerada}
				class="w-full py-2 px-4 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
			>
				✓ Já copiei, fechar
			</button>
		</div>
	</Modal>
{/if}
