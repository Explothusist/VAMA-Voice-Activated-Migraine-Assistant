
import { ISP, Facility, Vendor } from '$lib/db.server';
import { fail } from '@sveltejs/kit';
import { validate_JWT_login } from '$lib/security_util.server';
import { createNewISPAction, deleteExistingISPAction, editExistingISPAction } from '$lib/isp_utils.server.js';


export function load(  { cookies, url }) {
    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */

    const user = validate_JWT_login(cookies, url.pathname + url.search); // Must be kept to provide authentication

    const initial_search = (url.searchParams.get("search") ?? "");

    let isps = ISP.getAll().map((a) => a.toJSON());
    const all_facilities = Facility.getAll().map((a) => a.toJSON());
    const all_vendors = Vendor.getAll().map((a) => a.toJSON());

    return {
        isps: isps,
        all_facilities: all_facilities,
        all_vendors: all_vendors,
        initial_search: initial_search,
    };
};

function send_refreshed_data() {
    const isps = ISP.getAll().map((a) => a.toJSON());
    return {
        isps: isps
    };
};

export const actions = {

    newISP: async ({ cookies, request, url }) => {
        const hack = url.pathname;
        const data = await request.formData();

        const result = await createNewISPAction(cookies, data, url);

        if (result.success) {
            return send_refreshed_data();
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    editISP: async ({ cookies, request, url }) => {
        const hack = url.pathname;
        const data = await request.formData();

        const result = await editExistingISPAction(cookies, data, url);

        if (result.success) {
            return send_refreshed_data();
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    deleteISP: async ({ cookies, request, url }) => {
        const hack = url.pathname;
        const data = await request.formData();

        const result = await deleteExistingISPAction(cookies, data, url);
        
        if (result.success) {
            return send_refreshed_data();
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

};
