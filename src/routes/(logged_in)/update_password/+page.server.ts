import { fail, redirect, type Actions, type RequestEvent } from '@sveltejs/kit';
import { kPasswordRegexHTML } from '$lib/util';
import { changeOwnPasswordUserAction } from '$lib/account_utils.server';


export function load(  { cookies, url }) {
	const hack = url.pathname;
	/*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
	load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
	It must be url.pathname too, not just url.  */

	return {
		password_regex: kPasswordRegexHTML
	};
};

export const actions: Actions = {

	changePassword: async ({ request, cookies, url }: RequestEvent) => {
			
		const hack = url.pathname;
		// Parse submitted data data
		const data = await request.formData();

		let result = await changeOwnPasswordUserAction(cookies, data, url);

        if (result.success) {
            return redirect(303, "/");
        }else {
			cookies.set("error-message", result.error_message, { path: "/"});
			return fail(result.code ?? 400, { message: result.error_message });
		}
	}
	
};
