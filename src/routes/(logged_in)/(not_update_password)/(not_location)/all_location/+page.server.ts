
import { Announcement, Get_All_Locations_Raw, Staff } from '$lib/db.server';
import { fail, redirect } from '@sveltejs/kit';
import { addVendorToFacility, assignVendorToRoleAtFacility, createNewLocationAction } from '$lib/location_utils.server';
import sanitize from '$lib/sanitize.server';


export function load(  { cookies, url }) {
    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */

    const select_table = (url.searchParams.get("select") ?? "");
    const initial_search = (url.searchParams.get("search") ?? "");

    const locations = Get_All_Locations_Raw().map((x) => x.toJSON());
    const warden_names = locations.map((a) => a.is_facility ? Staff.getById(a.warden_id).name : "");
    const announcements = Announcement.getAll().map((x) => x.toJSON());

    return {
        locations: locations,
        announcements: announcements,
        select_table: select_table,
        initial_search: initial_search,
        warden_names: warden_names
    };
};

export const actions = {

    newLocation: async ({ cookies, request, url }) => {
        
        const hack = url.pathname;
        const data = await request.formData();

        const result = await createNewLocationAction(cookies, data, url);

        if (result.success) {
            throw redirect(303, result.link ?? "");
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },
        
    assignVendor: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();
        const facility_id = sanitize.toInt(data.get("page_facility_id") as string);

        let result = await assignVendorToRoleAtFacility(cookies, data, url);
        
        if (result.success) {
            // return {
                
            // };
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }

        result = await addVendorToFacility(cookies, data, url);

        if (result.success) {
            return {
                
            };
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

};
