<script lang="ts">
	import { goto } from '$app/navigation';
	import { isLoggedIn } from '$lib/stores/auth.svelte';
	import { browser } from '$app/environment';

	let redirected = $state(false);

	$effect(() => {
		if (!browser || redirected) return;
		redirected = true;
		if (isLoggedIn()) {
			goto('/dashboard', { replaceState: true });
		} else {
			goto('/login', { replaceState: true });
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-100">
	<p class="text-gray-500">Redirecionando...</p>
</div>
