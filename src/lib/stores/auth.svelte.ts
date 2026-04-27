import { goto } from '$app/navigation';
import { apiClient, setToken, clearToken, TOKEN_KEY } from '$lib/api/client';

const USER_KEY = 'bdforall_user';
const REFRESH_KEY = 'bdforall_refresh_token';

let token = $state<string | null>(null);
let user = $state<any>(null);
let isAuthenticated = $state(false);

export function loadAuth() {
	if (typeof window === 'undefined') return;
	const storedToken = localStorage.getItem(TOKEN_KEY);
	const storedUser = localStorage.getItem(USER_KEY);
	if (storedToken && storedUser) {
		token = storedToken;
		try {
			user = JSON.parse(storedUser);
		} catch {
			user = null;
			localStorage.removeItem(USER_KEY);
			return;
		}
		isAuthenticated = true;
	}
}

export async function login(email: string, senha: string) {
	const res = await apiClient.post('/auth/login', { email, senha });
	token = res.access_token;
	user = res.user;
	isAuthenticated = true;
	setToken(res.access_token);
	localStorage.setItem(USER_KEY, JSON.stringify(res.user));
	if (res.refresh_token) {
		localStorage.setItem(REFRESH_KEY, res.refresh_token);
	}
	syncChatWidgetToken(res.access_token);
	return res;
}

export async function logout() {
	const refreshToken = typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null;
	token = null;
	user = null;
	isAuthenticated = false;
	clearToken();
	if (typeof window !== 'undefined') {
		localStorage.removeItem(USER_KEY);
		localStorage.removeItem(REFRESH_KEY);
		syncChatWidgetToken(null);
	}
	if (refreshToken) {
		try { await apiClient.post('/auth/logout', { refresh_token: refreshToken }); } catch {}
	}
	goto('/login');
}

/**
 * Sincroniza o token JWT com o Chat Widget embeddable.
 * O widget expõe window.ChatWidget.setAuthToken() para atualizar a autenticação
 * e recarregar os contextos permitidos do usuário.
 */
function syncChatWidgetToken(authToken: string | null) {
	if (typeof window !== 'undefined' && (window as any).ChatWidget?.setAuthToken) {
		(window as any).ChatWidget.setAuthToken(authToken || '');
	}
}

export function getToken() {
	return token;
}

export function getUser() {
	return user;
}

export function isLoggedIn() {
	return isAuthenticated;
}
