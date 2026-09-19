
import { User } from '$lib/db.server';
import { fail } from '@sveltejs/kit';
import { validate_JWT_login_admin } from '$lib/security_util.server';
import { createNewAccountAction, editExistingAccountAction, deleteExistingAccountAction, changePassExistingAccountAction, unlockExistingAccountAction, getProfilePictureDetails } from '$lib/account_utils.server';
import type { JSONUser } from '$lib/db_utils.js';
import type { ExistingProfilePicture } from '$lib/account_utils';


export function load(  { cookies, url }) {
    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */

    const user = validate_JWT_login_admin(cookies, url.pathname + url.search); // Must be kept to provide authentication

    const initial_search = (url.searchParams.get("search") ?? "");

    const accounts: JSONUser[] = User.getAll().map((a) => a.toJSON());
    const profile_pictures: ExistingProfilePicture[] = accounts.map((a) => getProfilePictureDetails(a));

    return {
        accounts: accounts,
        profile_pictures: profile_pictures,
        initial_search: initial_search,
    };
};

function send_refreshed_data() {
    const accounts: JSONUser[] = User.getAll().map((a) => a.toJSON());
    const profile_pictures: ExistingProfilePicture[] = accounts.map((a) => getProfilePictureDetails(a));

    return {
        accounts: accounts,
        profile_pictures: profile_pictures,
    };
};

export const actions = {

    newAccount: async ({ cookies, request, url }) => {
    
        const hack = url.pathname;
        const data = await request.formData();

        const result = await createNewAccountAction(cookies, data, url);

        if (result.success) {
            return send_refreshed_data();
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    editAccount: async ({ cookies, request, url }) => {
    
        const hack = url.pathname;
        const data = await request.formData();

        const result = await editExistingAccountAction(cookies, data, url);

        if (result.success) {
            return send_refreshed_data();
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    deleteAccount: async ({ cookies, request, url }) => {
    
        const hack = url.pathname;
        const data = await request.formData();

        const result = await deleteExistingAccountAction(cookies, data, url);

        if (result.success) {
            return send_refreshed_data();
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    changePassAccount: async ({ cookies, request, url }) => {
    
        const hack = url.pathname;
        const data = await request.formData();

        const result = await changePassExistingAccountAction(cookies, data, url);

        if (result.success) {
            return send_refreshed_data();
        }else {
            if (result.error_message === "Reused Password") {
                cookies.set("error-message", "Cannot Re-use and Old Password", { path: "/"});
                // console.log("Cannot Re-use and Old Password");
                return fail(400, { message: "Cannot Re-use and Old Password" });
            }else {
                cookies.set("error-message", result.error_message, { path: "/"});
                return fail(400, { message: result.error_message });
            }
        }
    },

    unlockAccount: async ({ cookies, request, url }) => {
    
        const hack = url.pathname;
        const data = await request.formData();

        const result = await unlockExistingAccountAction(cookies, data, url);

        if (result.success) {
            return send_refreshed_data();
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

};
