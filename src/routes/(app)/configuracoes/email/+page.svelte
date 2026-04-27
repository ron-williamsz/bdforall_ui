<script lang="ts">
	import { apiClient } from '$lib/api/client';
	import { Modal, Badge, Pagination } from '$lib/components';

	// ── Tabs ──────────────────────────────────────────────────────────────────
	let activeTab = $state('config');

	// ── Config state ──────────────────────────────────────────────────────────
	let configLoading = $state(true);
	let configSaving = $state(false);
	let configAlert = $state<{ type: 'success' | 'error'; msg: string } | null>(null);

	let configurada = $state(false);
	let senhaConfigurada = $state(false);

	let form = $state({
		provider: 'sendgrid',
		smtp_host: 'smtp.sendgrid.net',
		smtp_port: 587,
		smtp_user: 'apikey',
		smtp_password: '',
		smtp_sender_email: '',
		smtp_from_name: 'BD FOR ALL',
		smtp_use_tls: true,
		ativo: true
	});

	// Test email
	let testDestinatario = $state('');
	let testLoading = $state(false);
	let testAlert = $state<{ type: 'success' | 'error'; msg: string } | null>(null);

	// ── Logs state ────────────────────────────────────────────────────────────
	let logs = $state<any[]>([]);
	let logsTotal = $state(0);
	let logsPage = $state(1);
	let logsPageSize = $state(50);
	let logsLoading = $state(false);
	let logsStatus = $state('');
	let logsTipo = $state('');
	let logsSearch = $state('');
	let logsDataInicio = $state('');
	let logsDataFim = $state('');
	let expandedLogId = $state<number | null>(null);
	let resendingId = $state<number | null>(null);
	let resendAlert = $state<{ type: 'success' | 'error'; msg: string } | null>(null);
	let confirmResend = $state<any | null>(null);

	// ── Derived ───────────────────────────────────────────────────────────────
	let logsSkip = $derived((logsPage - 1) * logsPageSize);
	let canTest = $derived(configurada && senhaConfigurada);

	// ── Helpers ───────────────────────────────────────────────────────────────
	function formatDate(d: string) {
		if (!d) return '-';
		return new Date(d).toLocaleString('pt-BR');
	}

	function parseDestinatarios(raw: any): string[] {
		if (!raw) return [];
		if (Array.isArray(raw)) return raw;
		try { return JSON.parse(raw); } catch { return [raw]; }
	}

	type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
	const statusVariant: Record<string, BadgeVariant> = {
		enviado: 'success',
		falhou: 'danger',
		pendente: 'warning'
	};

	const statusLabel: Record<string, string> = {
		enviado: 'Enviado',
		falhou: 'Falhou',
		pendente: 'Pendente'
	};

	// ── Provider presets ──────────────────────────────────────────────────────
	function applyProviderPreset(provider: string) {
		if (provider === 'sendgrid') {
			form.smtp_host = 'smtp.sendgrid.net';
			form.smtp_port = 587;
			form.smtp_user = 'apikey';
			form.smtp_use_tls = true;
		} else if (provider === 'gmail') {
			form.smtp_host = 'smtp.gmail.com';
			form.smtp_port = 587;
			form.smtp_use_tls = true;
		}
	}

	// ── API calls ─────────────────────────────────────────────────────────────
	async function loadConfig() {
		configLoading = true;
		configAlert = null;
		try {
			const res = await apiClient.get('/email/config');
			configurada = res.configurada ?? false;
			senhaConfigurada = res.senha_configurada ?? false;
			if (res.configurada) {
				form.provider = res.provider ?? 'sendgrid';
				form.smtp_host = res.smtp_host ?? '';
				form.smtp_port = res.smtp_port ?? 587;
				form.smtp_user = res.smtp_user ?? '';
				form.smtp_sender_email = res.smtp_sender_email ?? '';
				form.smtp_from_name = res.smtp_from_name ?? '';
				form.smtp_use_tls = res.smtp_use_tls ?? true;
				form.ativo = res.ativo ?? true;
				form.smtp_password = '';
			}
		} catch (e: any) {
			configAlert = { type: 'error', msg: e.message };
		} finally {
			configLoading = false;
		}
	}

	async function saveConfig() {
		configSaving = true;
		configAlert = null;
		try {
			const body: Record<string, any> = {
				provider: form.provider,
				smtp_host: form.smtp_host,
				smtp_port: Number(form.smtp_port),
				smtp_user: form.smtp_user,
				smtp_sender_email: form.smtp_sender_email,
				smtp_from_name: form.smtp_from_name,
				smtp_use_tls: form.smtp_use_tls,
				ativo: form.ativo
			};
			if (form.smtp_password.trim()) {
				body.smtp_password = form.smtp_password.trim();
			}
			await apiClient.put('/email/config', body);
			configAlert = { type: 'success', msg: 'Configuração salva com sucesso.' };
			await loadConfig();
		} catch (e: any) {
			configAlert = { type: 'error', msg: e.message };
		} finally {
			configSaving = false;
		}
	}

	async function testarEnvio() {
		if (!testDestinatario.trim()) return;
		testLoading = true;
		testAlert = null;
		try {
			const res = await apiClient.post('/email/config/testar', { destinatario: testDestinatario.trim() });
			if (res.ok) {
				testAlert = { type: 'success', msg: `E-mail de teste enviado para ${res.destinatario}.` };
			} else {
				testAlert = { type: 'error', msg: res.mensagem || 'Falha ao enviar. Consulte os logs.' };
			}
		} catch (e: any) {
			testAlert = { type: 'error', msg: e.message };
		} finally {
			testLoading = false;
		}
	}

	async function loadLogs() {
		logsLoading = true;
		resendAlert = null;
		try {
			const params: Record<string, any> = { page: logsPage, pageSize: logsPageSize };
			if (logsStatus) params.status = logsStatus;
			if (logsTipo) params.tipo = logsTipo;
			if (logsSearch) params.search = logsSearch;
			if (logsDataInicio) params.dataInicio = logsDataInicio;
			if (logsDataFim) params.dataFim = logsDataFim;
			const res = await apiClient.get('/email/logs', params);
			logs = res.logs ?? [];
			logsTotal = res.total ?? 0;
		} finally {
			logsLoading = false;
		}
	}

	async function reenviar(log: any) {
		resendingId = log.id;
		resendAlert = null;
		confirmResend = null;
		try {
			const res = await apiClient.post(`/email/logs/${log.id}/reenviar`);
			resendAlert = { type: 'success', msg: `Reenvio realizado. Novo log criado.${res.aviso ? ' Aviso: ' + res.aviso : ''}` };
			await loadLogs();
		} catch (e: any) {
			resendAlert = { type: 'error', msg: e.message };
		} finally {
			resendingId = null;
		}
	}

	// ── Effects ───────────────────────────────────────────────────────────────
	$effect(() => {
		if (activeTab === 'config') loadConfig();
		else if (activeTab === 'logs') loadLogs();
	});
</script>

<div class="space-y-4">
	<h1 class="text-2xl font-bold text-gray-800">Configurações de E-mail</h1>

	<!-- Tabs -->
	<div class="border-b border-gray-200">
		<nav class="flex gap-4">
			{#each [['config', 'Configuração SendGrid'], ['logs', 'Logs de Envio']] as [id, label]}
				<button
					onclick={() => activeTab = id}
					class="px-3 py-2 text-sm font-medium border-b-2 {activeTab === id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
				>{label}</button>
			{/each}
		</nav>
	</div>

	<!-- ── CONFIG TAB ─────────────────────────────────────────────────────── -->
	{#if activeTab === 'config'}
		{#if configLoading}
			<div class="flex items-center justify-center py-16 text-gray-400">
				<svg class="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
				</svg>
				Carregando configuração...
			</div>
		{:else}
			<!-- Status banner -->
			<div class="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-3">
				{#if configurada}
					<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
						Configurado
					</span>
				{:else}
					<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
						Não configurado
					</span>
				{/if}

				{#if configurada}
					{#if senhaConfigurada}
						<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
							Senha/API key configurada
						</span>
					{:else}
						<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
							Senha/API key pendente
						</span>
					{/if}
				{/if}
			</div>

			<!-- Alert -->
			{#if configAlert}
				<div class="rounded-lg px-4 py-3 text-sm font-medium {configAlert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}">
					{configAlert.msg}
				</div>
			{/if}

			<!-- Form -->
			<div class="bg-white rounded-xl shadow-sm border p-6 space-y-5">
				<h2 class="text-base font-semibold text-gray-700">Parâmetros SMTP</h2>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<!-- Provider -->
					<div class="sm:col-span-2">
						<label class="block text-sm font-medium text-gray-700 mb-1">Provedor</label>
						<select
							bind:value={form.provider}
							onchange={() => applyProviderPreset(form.provider)}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
						>
							<option value="sendgrid">SendGrid</option>
							<option value="gmail">Gmail</option>
							<option value="custom">Personalizado</option>
						</select>
						{#if form.provider === 'sendgrid'}
							<p class="mt-1 text-xs text-primary-600">Host, porta e usuário preenchidos automaticamente. Informe apenas a API key e o e-mail remetente.</p>
						{/if}
					</div>

					<!-- SMTP Host -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Host SMTP</label>
						<input
							type="text"
							bind:value={form.smtp_host}
							placeholder="smtp.sendgrid.net"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
						/>
					</div>

					<!-- SMTP Port -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Porta</label>
						<input
							type="number"
							bind:value={form.smtp_port}
							min="1" max="65535"
							placeholder="587"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
						/>
					</div>

					<!-- SMTP User -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Usuário SMTP</label>
						<input
							type="text"
							bind:value={form.smtp_user}
							placeholder="apikey"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
						/>
						{#if form.provider === 'sendgrid'}
							<p class="mt-1 text-xs text-gray-500">Para SendGrid, o usuário é literalmente <code class="bg-gray-100 px-1 rounded">apikey</code>.</p>
						{/if}
					</div>

					<!-- SMTP Password / API Key -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							{form.provider === 'sendgrid' ? 'API Key SendGrid' : 'Senha SMTP'}
						</label>
						<input
							type="password"
							bind:value={form.smtp_password}
							placeholder={senhaConfigurada ? '•••• deixe em branco para manter' : form.provider === 'sendgrid' ? 'SG.xxxxxxxxxxxx' : 'Senha SMTP'}
							autocomplete="new-password"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
						/>
					</div>

					<!-- Sender Email -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">E-mail Remetente (From)</label>
						<input
							type="email"
							bind:value={form.smtp_sender_email}
							placeholder="no-reply@seudominio.com.br"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
						/>
						{#if form.provider === 'sendgrid'}
							<p class="mt-1 text-xs text-gray-500">Deve ser um <strong>Sender Identity verificado</strong> no painel SendGrid.</p>
						{/if}
					</div>

					<!-- From Name -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Nome de Exibição</label>
						<input
							type="text"
							bind:value={form.smtp_from_name}
							placeholder="BD FOR ALL"
							maxlength="100"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
						/>
					</div>

					<!-- TLS + Ativo -->
					<div class="sm:col-span-2 flex flex-wrap gap-6">
						<label class="flex items-center gap-2 cursor-pointer select-none">
							<input type="checkbox" bind:checked={form.smtp_use_tls} class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
							<span class="text-sm text-gray-700">Usar TLS (STARTTLS)</span>
						</label>
						<label class="flex items-center gap-2 cursor-pointer select-none">
							<input type="checkbox" bind:checked={form.ativo} class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
							<span class="text-sm text-gray-700">Envio de e-mails ativo</span>
						</label>
					</div>
				</div>

				<div class="flex justify-end pt-2 border-t border-gray-100">
					<button
						onclick={saveConfig}
						disabled={configSaving}
						class="inline-flex items-center gap-2 px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if configSaving}
							<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
							Salvando...
						{:else}
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
							Salvar Configuração
						{/if}
					</button>
				</div>
			</div>

			<!-- Test email -->
			<div class="bg-white rounded-xl shadow-sm border p-6 space-y-4">
				<h2 class="text-base font-semibold text-gray-700">Testar Envio</h2>

				{#if !canTest}
					<p class="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
						Salve uma configuração completa (com senha/API key) antes de testar.
					</p>
				{/if}

				{#if testAlert}
					<div class="rounded-lg px-4 py-3 text-sm font-medium {testAlert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}">
						{testAlert.msg}
					</div>
				{/if}

				<div class="flex gap-3">
					<input
						type="email"
						bind:value={testDestinatario}
						placeholder="destinatario@exemplo.com"
						disabled={!canTest}
						class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400"
					/>
					<button
						onclick={testarEnvio}
						disabled={!canTest || testLoading || !testDestinatario.trim()}
						class="inline-flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
					>
						{#if testLoading}
							<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
							Enviando...
						{:else}
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
							Testar Envio
						{/if}
					</button>
				</div>
			</div>
		{/if}

	<!-- ── LOGS TAB ────────────────────────────────────────────────────────── -->
	{:else if activeTab === 'logs'}

		<!-- Filters -->
		<div class="bg-white rounded-xl shadow-sm border p-4">
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
				<select
					bind:value={logsStatus}
					onchange={() => { logsPage = 1; loadLogs(); }}
					class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
				>
					<option value="">Todos os status</option>
					<option value="enviado">Enviado</option>
					<option value="falhou">Falhou</option>
					<option value="pendente">Pendente</option>
				</select>

				<input
					type="text"
					placeholder="Tipo (ex: ata_aprovada)"
					bind:value={logsTipo}
					oninput={() => { logsPage = 1; loadLogs(); }}
					class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
				/>

				<input
					type="text"
					placeholder="Busca (assunto, destinatário)"
					bind:value={logsSearch}
					oninput={() => { logsPage = 1; loadLogs(); }}
					class="col-span-2 sm:col-span-1 lg:col-span-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
				/>

				<input
					type="date"
					bind:value={logsDataInicio}
					onchange={() => { logsPage = 1; loadLogs(); }}
					class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
				/>

				<input
					type="date"
					bind:value={logsDataFim}
					onchange={() => { logsPage = 1; loadLogs(); }}
					class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
				/>
			</div>

			<div class="flex justify-end mt-3 gap-2">
				<button
					onclick={() => { logsStatus = ''; logsTipo = ''; logsSearch = ''; logsDataInicio = ''; logsDataFim = ''; logsPage = 1; loadLogs(); }}
					class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
				>Limpar</button>
				<button
					onclick={() => { logsPage = 1; loadLogs(); }}
					class="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
				>Aplicar</button>
			</div>
		</div>

		<!-- Resend alert -->
		{#if resendAlert}
			<div class="rounded-lg px-4 py-3 text-sm font-medium {resendAlert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}">
				{resendAlert.msg}
			</div>
		{/if}

		<!-- Table -->
		<div class="overflow-x-auto rounded-lg border border-gray-200">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
						<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
						<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
						<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Assunto</th>
						<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Destinatários</th>
						<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tentativas</th>
						<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ações</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#if logsLoading}
						{#each Array(8) as _}
							<tr>
								{#each Array(7) as _c}
									<td class="px-4 py-3"><div class="h-4 bg-gray-200 rounded animate-pulse"></div></td>
								{/each}
							</tr>
						{/each}
					{:else if logs.length === 0}
						<tr>
							<td colspan="7" class="px-4 py-10 text-center text-gray-500">Nenhum log encontrado para os filtros aplicados.</td>
						</tr>
					{:else}
						{#each logs as log, i}
							{@const dests = parseDestinatarios(log.destinatarios)}
							{@const expanded = expandedLogId === log.id}
							<tr
								class="cursor-pointer {i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-primary-50 transition-colors"
								onclick={() => expandedLogId = expanded ? null : log.id}
							>
								<td class="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
								<td class="px-4 py-3 text-sm">
									<Badge text={statusLabel[log.status] ?? log.status} variant={statusVariant[log.status] ?? 'neutral'} />
								</td>
								<td class="px-4 py-3 text-sm font-mono text-xs text-gray-600">{log.tipo || '-'}</td>
								<td class="px-4 py-3 text-sm max-w-xs truncate">{log.assunto}</td>
								<td class="px-4 py-3 text-sm">
									<span class="text-gray-700">{dests.length} endereço{dests.length !== 1 ? 's' : ''}</span>
									{#if dests.length > 0}
										<span class="ml-1 text-gray-400 text-xs truncate max-w-32 inline-block align-bottom">{dests[0]}</span>
									{/if}
								</td>
								<td class="px-4 py-3 text-sm text-center">{log.tentativas ?? 1}</td>
								<td class="px-4 py-3 text-sm" onclick={(e) => e.stopPropagation()}>
									{#if log.status !== 'pendente'}
										<button
											onclick={() => confirmResend = log}
											disabled={resendingId === log.id}
											class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-primary-50 text-primary-700 hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed border border-primary-200"
										>
											{#if resendingId === log.id}
												<svg class="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
											{:else}
												<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
											{/if}
											Reenviar
										</button>
									{/if}
								</td>
							</tr>

							<!-- Expanded detail row -->
							{#if expanded}
								<tr class="bg-blue-50 border-t border-blue-100">
									<td colspan="7" class="px-6 py-4">
										<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
											<div class="space-y-2">
												<div><span class="text-gray-500 font-medium">ID:</span> <span class="font-mono">{log.id}</span></div>
												<div><span class="text-gray-500 font-medium">Tentativas:</span> {log.tentativas ?? 1}</div>
												{#if log.sent_at}
													<div><span class="text-gray-500 font-medium">Enviado em:</span> {formatDate(log.sent_at)}</div>
												{/if}
												{#if log.provider_message_id}
													<div><span class="text-gray-500 font-medium">Message-ID:</span> <span class="font-mono text-xs break-all">{log.provider_message_id}</span></div>
												{/if}
												{#if log.original_log_id}
													<div><span class="text-gray-500 font-medium">Reenvio do log:</span> #{log.original_log_id}</div>
												{/if}
												{#if log.tem_anexo}
													<div class="text-amber-700">Com anexo</div>
												{/if}
											</div>
											<div>
												<p class="text-gray-500 font-medium mb-1">Destinatários completos:</p>
												<ul class="space-y-0.5">
													{#each dests as d}
														<li class="text-xs font-mono text-gray-700">{d}</li>
													{/each}
												</ul>
											</div>
										</div>

										{#if log.erro}
											<div class="mt-3">
												<p class="text-xs font-semibold text-red-600 uppercase mb-1">Erro</p>
												<pre class="bg-red-50 border border-red-200 p-3 rounded text-xs overflow-auto max-h-48 text-red-800 whitespace-pre-wrap">{log.erro}</pre>
											</div>
										{/if}
									</td>
								</tr>
							{/if}
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<Pagination
			total={logsTotal}
			skip={logsSkip}
			limit={logsPageSize}
			onchange={(s) => { logsPage = Math.floor(s / logsPageSize) + 1; loadLogs(); }}
		/>
	{/if}
</div>

<!-- Confirm resend modal -->
<Modal open={!!confirmResend} title="Confirmar Reenvio" onclose={() => confirmResend = null}>
	{#if confirmResend}
		<div class="space-y-4">
			<p class="text-sm text-gray-700">
				Deseja reenviar o e-mail <strong>"{confirmResend.assunto}"</strong> para os destinatários originais?
			</p>
			<p class="text-xs text-gray-500">Um novo log será criado. O log original permanece inalterado.</p>
			<div class="flex justify-end gap-3">
				<button onclick={() => confirmResend = null} class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
				<button
					onclick={() => reenviar(confirmResend)}
					class="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
				>Confirmar Reenvio</button>
			</div>
		</div>
	{/if}
</Modal>
