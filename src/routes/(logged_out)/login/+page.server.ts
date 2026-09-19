import { fail, redirect, type Actions, type RequestEvent } from '@sveltejs/kit';
import { authenticate, issueJWT } from '$lib/security_util.server';
import logger from '$lib/logger';
import eventLogger from '$lib/event_logger';
import { kEightHour_Unix } from '$lib/util';
import sanitize from '$lib/sanitize.server';




export function load({ url, cookies }: RequestEvent) {
	const hack = url.pathname; // So it runs

	return {};
}

export const actions: Actions = {

	authenticate: async ({ request, cookies, url }: RequestEvent) => {

		const hack = url.pathname;
		// Parse submitted form data
		const form = await request.formData();

		let result = await authenticate(form);

		if (!result.success || !result.user) {
			return fail(result.code ?? 400, { message: result.error_message });
		}
		
		// Set session cookie
		cookies.set('JWT', issueJWT(result.user.username), {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production' // set to true in production
			, maxAge: kEightHour_Unix
		}); // IF THIS IS LAUNCHED, SET SECURE TO TRUE NOW

		if (process.env.NODE_ENV !== 'production') {
			// console.log('Login successful. Redirecting to dashboard...');
			logger.info('Login successful', { username: result.user.username });
            try { eventLogger.logEvent('LOGIN_SUCCESS', { username: result.user.username }); } catch (e) { logger.warn('Failed to emit LOGIN_SUCCESS event', { err: String(e) }); }
		}
		// `throw redirect` is required for SvelteKit to actually redirect during actions

		if (result.user.must_change_password) {
			throw redirect(303, '/update_password');
		}
		const redirect_path = cookies.get("redirect-path");
		if (redirect_path) {
			cookies.delete("redirect-path", { path: '/' });
			if (redirect_path.startsWith("/")) {
				throw redirect(303, sanitize.safeURL(redirect_path));
			}
		}

		throw redirect(303, '/');
	}
	
};
