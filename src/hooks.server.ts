import { env } from '$env/dynamic/public';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			return html.replace(
				'%bdforall.apiurl%',
				env.PUBLIC_API_URL || 'http://localhost:8000'
			);
		}
	});
	return response;
};
