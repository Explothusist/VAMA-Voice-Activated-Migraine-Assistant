import { redirect, type RequestEvent } from '@sveltejs/kit';
import { logoutUser } from '$lib/security_util.server';

export function load({ url, cookies }: RequestEvent) {
	const hack = url.pathname; // So it runs

	logoutUser(cookies);
	redirect(308, "/login");
}
