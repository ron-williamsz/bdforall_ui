<script lang="ts">
	import { goto } from '$app/navigation';
	import { login } from '$lib/stores/auth.svelte';

	let email = $state('');
	let senha = $state('');
	let loading = $state(false);
	let error = $state('');
	let mostrarSenha = $state(false);

	async function handleLogin(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;
		try {
			await login(email, senha);
			goto('/dashboard');
		} catch (err: any) {
			error = err.message || 'Erro ao fazer login';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-900 p-4">
	<div class="w-full max-w-md">
		<div class="bg-white rounded-2xl shadow-2xl p-8">
			<div class="text-center mb-8">
				<div class="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
					<svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
					</svg>
				</div>
				<h1 class="text-2xl font-bold text-gray-800">BD FOR ALL</h1>
				<p class="text-gray-500 text-sm mt-1">Sistema de Gestão</p>
			</div>

			{#if error}
				<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
					{error}
				</div>
			{/if}

			<form onsubmit={handleLogin} class="space-y-5">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						required
						placeholder="seu@email.com"
						class="block w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
					/>
				</div>

				<div>
					<label for="senha" class="block text-sm font-medium text-gray-700 mb-1">Senha</label>
					<div class="relative">
						<input
							id="senha"
							type={mostrarSenha ? 'text' : 'password'}
							bind:value={senha}
							required
							placeholder="••••••••"
							class="block w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
						/>
						<button
							type="button"
							onclick={() => mostrarSenha = !mostrarSenha}
							class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
							tabindex="-1"
						>
							{#if mostrarSenha}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
								</svg>
							{:else}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
								</svg>
							{/if}
						</button>
					</div>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full py-2.5 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{#if loading}
						<span class="inline-flex items-center gap-2">
							<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
							</svg>
							Entrando...
						</span>
					{:else}
						Entrar
					{/if}
				</button>
			</form>
		</div>
	</div>
</div>
