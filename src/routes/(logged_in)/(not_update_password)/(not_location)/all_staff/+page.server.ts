import { Facility, Vendor } from '$lib/db.server';
import { fail } from '@sveltejs/kit';
import { createNewStaffAction, deleteExistingStaffAction, editExistingStaffAction } from '$lib/staff_utils.server';
import { assignStaffToPositionAtFacility } from '$lib/location_utils.server.js';


export async function load(  { cookies, url, params, fetch }) {
    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */

    const initial_filter: string = (url.searchParams.get("filter") ?? "all");
    const initial_search: string = (url.searchParams.get("search") ?? "");
    const initial_sort_col: number = (Number(url.searchParams.get("sort_col")) ?? 0);
    const initial_sort_reversed: boolean = (Number(url.searchParams.get("sort_reversed")) ?? 0) === 1;

    const initial_request = await fetch(`/all_staff?count=50&offset=${0}&filter=${initial_filter}&search_term=${encodeURIComponent(initial_search)}&sort_col=${initial_sort_col}&sort_reversed=${initial_sort_reversed ? 1 : 0}`);
    const initial_response = await initial_request.json();
    const initial_data = initial_response.entries;
    const initial_offset = initial_response.new_offset;
    const initial_has_more = initial_response.has_more;
    const initial_total_results = initial_response.total_results;
    
    const all_facilities = Facility.getAll().map((a) => a.toJSON());
    const all_vendors = Vendor.getAll().map((a) => a.toJSON());

    return {
        all_facilities: all_facilities,
        all_vendors: all_vendors,
        initial_filter: initial_filter,
        initial_search: initial_search,
        initial_sort_col: initial_sort_col,
        initial_sort_reversed: initial_sort_reversed,
        initial_data: initial_data,
        initial_offset: initial_offset,
        initial_has_more: initial_has_more,
        initial_total_results: initial_total_results
    };
};

let reload_token_counter = 0;
function send_refreshed_data() {
    reload_token_counter = (reload_token_counter + 1) % 2**32;
    const reload_token = reload_token_counter;
    return {
        reload_token: reload_token
    };
};

export const actions = {

    newStaff: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();

        const result = await createNewStaffAction(cookies, data, url);

        if (result.success) {
            return send_refreshed_data();
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    editStaff: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();

        const result = await editExistingStaffAction(cookies, data, url);

        if (result.success) {
            return send_refreshed_data();
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    assignStaff: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();

        const result = await assignStaffToPositionAtFacility(cookies, data, url);

        if (result.success) {
            return send_refreshed_data();
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    deleteStaff: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();

        const result = await deleteExistingStaffAction(cookies, data, url);

        if (result.success) {
            return send_refreshed_data();
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

};