<script lang="ts">
	import '../app.css';
	import { loadAuth } from '$lib/stores/auth.svelte';
	import type { Snippet } from 'svelte';
	import { browser } from '$app/environment';

	let { children }: { children: Snippet } = $props();

	if (browser) {
		loadAuth();
	}
</script>

{@render children()}
