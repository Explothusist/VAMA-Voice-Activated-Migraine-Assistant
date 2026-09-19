import { Facility, Vendor } from '$lib/db.server';
import { addVendorToFacility, assignVendorToRoleAtFacility, removeVendorFromFacility } from '$lib/location_utils.server';
import sanitize from '$lib/sanitize.server';
import { fail } from '@sveltejs/kit';


export function load(  { cookies, url, params }) {
    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */
    
    // const facility = Facility.getById(sanitize.toInt(params.slug)).toJSON();
    // const vendors = Vendor.getByIds(facility.vendors).map((a) => a.toJSON());
    const all_vendors = Vendor.getAll().map((a) => a.toJSON());

    return {
        // vendors: vendors,
        all_vendors: all_vendors
    };
};

function send_refreshed_data(facility_id: number) {
    const facility = Facility.getById(sanitize.toInt(facility_id)).toJSON();
    // const vendors = Vendor.getByIds(facility.vendors).map((a) => a.toJSON());
    return {
        facility: facility,
        // vendors: vendors
    };
};

export const actions = {
    
    newVendor: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();
        const facility_id = sanitize.toInt(data.get("page_facility_id") as string);

        let result = await addVendorToFacility(cookies, data, url);
        
        if (result.success) {
            return send_refreshed_data(facility_id);
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
            // return send_refreshed_data(facility_id);
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }

        result = await addVendorToFacility(cookies, data, url);

        if (result.success) {
            return send_refreshed_data(facility_id);
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    deleteVendor: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();
        const facility_id = sanitize.toInt(data.get("page_facility_id") as string);

        let result = await removeVendorFromFacility(cookies, data, url);
        
        if (result.success) {
            return send_refreshed_data(facility_id);
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    swapLocation: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();
        const newLocationId = sanitize.toInt(data.get("newLocationId") as string);

        const valid = Facility.isValidId(newLocationId);
        if (valid) {
            return send_refreshed_data(newLocationId);
        }else {
            cookies.set("error-message", "Request Could Not Be Processed: Inputs Out of Valid Range. Field: Id", { path: "/" });
            return fail(400, { message: "Request Could Not Be Processed: Inputs Out of Valid Range. Field: Id" });
        }
    },

};