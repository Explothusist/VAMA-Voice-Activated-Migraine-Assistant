import { get_logged_in_user } from '$lib/security_util.server';
import { redirect } from '@sveltejs/kit';

export function load({ url, cookies }) {
    const update = url.pathname;

    const user = get_logged_in_user(cookies);

    if (user.must_change_password && url.password !== "/update_password") {
        cookies.set("redirect-path", url.pathname + url.search, { path: "/" });
        throw redirect(303, "/update_password");
    }

    return {
        
    }
}