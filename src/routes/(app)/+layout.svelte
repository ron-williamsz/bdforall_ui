<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { isLoggedIn, getUser, logout } from '$lib/stores/auth.svelte';
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
	let sidebarOpen = $state(true);
	let mobileOpen = $state(false);

	let currentUser = $derived(getUser());

	$effect(() => {
		if (browser && !isLoggedIn()) {
			goto('/login', { replaceState: true });
		}
	});

	// Sincronizar token com o Chat Widget quando a página carrega (usuário já logado)
	$effect(() => {
		if (browser && isLoggedIn()) {
			const token = localStorage.getItem('bdforall_token');
			if (token) {
				// O widget pode não estar pronto ainda, tentar com retry
				const trySync = (attempts: number) => {
					if ((window as any).ChatWidget?.setAuthToken) {
						(window as any).ChatWidget.setAuthToken(token);
					} else if (attempts > 0) {
						setTimeout(() => trySync(attempts - 1), 500);
					}
				};
				trySync(10);
			}
		}
	});

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
		{ href: '/condominios', label: 'Condomínios', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
		{ href: '/gerentes', label: 'Gerentes', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
		{ href: '/carteiras', label: 'Carteiras', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
		{ href: '/taxas', label: 'Taxas', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
		{ href: '/credenciais', label: 'Credenciais', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
		{ href: '/usuarios', label: 'Usuários', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
		{ href: '/perfis', label: 'Perfis & Permissões', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
		{ href: '/blacklist', label: 'Blacklist', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
		{ href: '/departamentos', label: 'Departamentos', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z' },
		{ href: '/ramais', label: 'Ramais', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
		{ href: '/fornecedores', label: 'Fornecedores', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
		{ href: '/auditoria', label: 'Auditoria & Logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
		{ href: '/configuracoes/email', label: 'Config. E-mail', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
	];

	function isActive(href: string): boolean {
		const pathname = page.url.pathname;
		if (href === '/dashboard') return pathname === '/dashboard';
		return pathname.startsWith(href);
	}
</script>

<div class="min-h-screen bg-gray-100 flex">
	<!-- Mobile overlay -->
	{#if mobileOpen}
		<div class="fixed inset-0 bg-black/40 z-30 lg:hidden" role="presentation" onclick={() => mobileOpen = false}></div>
	{/if}

	<!-- Sidebar -->
	<aside class="fixed top-0 left-0 z-40 h-screen bg-slate-800 text-white transition-all duration-300 flex flex-col
		{sidebarOpen ? 'w-64' : 'w-16'}
		{mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0"
	>
		<!-- Logo -->
		<div class="flex items-center justify-between h-16 px-4 bg-slate-900">
			{#if sidebarOpen}
				<span class="text-lg font-bold tracking-tight">BD FOR ALL</span>
			{/if}
			<button onclick={() => sidebarOpen = !sidebarOpen} class="p-1.5 rounded-lg hover:bg-slate-700 hidden lg:block">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={sidebarOpen ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7' : 'M13 5l7 7-7 7M5 5l7 7-7 7'} />
				</svg>
			</button>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 overflow-y-auto py-4 px-2 space-y-1">
			{#each navItems as item}
				<a
					href={item.href}
					onclick={() => mobileOpen = false}
					class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
						{isActive(item.href) ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
					title={item.label}
				>
					<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
					</svg>
					{#if sidebarOpen}
						<span class="truncate">{item.label}</span>
					{/if}
				</a>
			{/each}
		</nav>
	</aside>

	<!-- Main content -->
	<div class="flex-1 flex flex-col transition-all duration-300 {sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}">
		<!-- Top bar -->
		<header class="sticky top-0 z-20 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
			<button onclick={() => mobileOpen = true} class="p-2 rounded-lg hover:bg-gray-100 lg:hidden">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>

			<div class="flex-1"></div>

			<div class="flex items-center gap-4">
				{#if currentUser}
					<div class="text-right hidden sm:block">
						<p class="text-sm font-medium text-gray-700">{currentUser.nome || currentUser.email}</p>
						<p class="text-xs text-gray-500">{currentUser.perfil_principal || ''}</p>
					</div>
					<div class="w-9 h-9 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold">
						{(currentUser.nome || currentUser.email || 'U').charAt(0).toUpperCase()}
					</div>
				{/if}
				<button onclick={logout} class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sair">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
					</svg>
				</button>
			</div>
		</header>

		<!-- Page content -->
		<main class="flex-1 p-4 lg:p-6">
			{@render children()}
		</main>
	</div>
</div>
