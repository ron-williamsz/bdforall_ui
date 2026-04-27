import { goto } from '$app/navigation';

const TOKEN_KEY = 'bdforall_token';

function getBaseUrl(): string {
	if (typeof window !== 'undefined' && (window as any).__API_URL__) {
		return (window as any).__API_URL__ + '/api';
	}
	return 'http://localhost:8000/api';
}

function isBrowser() {
	return typeof window !== 'undefined';
}

function getToken(): string | null {
	if (!isBrowser()) return null;
	return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
	if (!isBrowser()) return;
	localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
	if (!isBrowser()) return;
	localStorage.removeItem(TOKEN_KEY);
}

function buildQuery(params?: Record<string, any>): string {
	if (!params) return '';
	const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
	if (entries.length === 0) return '';
	return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

async function request<T = any>(method: string, path: string, options?: { body?: any; params?: Record<string, any> }): Promise<T> {
	const url = `${getBaseUrl()}${path}${buildQuery(options?.params)}`;
	const headers: Record<string, string> = {};

	const token = getToken();
	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	if (options?.body) {
		headers['Content-Type'] = 'application/json';
	}

	const res = await fetch(url, {
		method,
		headers,
		body: options?.body ? JSON.stringify(options.body) : undefined
	});

	if (res.status === 401) {
		clearToken();
		if (isBrowser()) {
			localStorage.removeItem('bdforall_user');
			await goto('/login');
		}
		throw new Error('Sessão expirada. Faça login novamente.');
	}

	if (!res.ok) {
		let detail = `Erro ${res.status}`;
		try {
			const err = await res.json();
			detail = err.detail || err.message || detail;
		} catch {}
		throw new Error(detail);
	}

	if (res.status === 204) return undefined as T;
	return res.json();
}

export const apiClient = {
	get: <T = any>(path: string, params?: Record<string, any>) =>
		request<T>('GET', path, { params }),

	post: <T = any>(path: string, body?: any) =>
		request<T>('POST', path, { body }),

	postWithParams: <T = any>(path: string, params?: Record<string, any>) =>
		request<T>('POST', path, { params }),

	put: <T = any>(path: string, body?: any) =>
		request<T>('PUT', path, { body }),

	patch: <T = any>(path: string, body?: any) =>
		request<T>('PATCH', path, { body }),

	delete: <T = any>(path: string) =>
		request<T>('DELETE', path)
};

export { getToken, setToken, clearToken, TOKEN_KEY };
