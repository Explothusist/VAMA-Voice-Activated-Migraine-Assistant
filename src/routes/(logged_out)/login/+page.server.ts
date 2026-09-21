import { fail, redirect, type Actions, type RequestEvent } from '@sveltejs/kit';

export function load({ url, cookies }: RequestEvent) {
	const hack = url.pathname; // So it runs
	
    const help = (Number(url.searchParams.get("help") ?? "0") === 1);

	return {
		help: help
	};
}

export const actions: Actions = {

	authenticate: async ({ request, cookies, url }: RequestEvent) => {

		throw redirect(303, '/');
	}
	
};