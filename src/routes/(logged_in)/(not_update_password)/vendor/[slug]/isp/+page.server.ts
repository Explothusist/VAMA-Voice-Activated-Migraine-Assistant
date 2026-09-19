import { Facility, ISP, Vendor } from '$lib/db.server';
import sanitize from '$lib/sanitize.server';
import { fail } from '@sveltejs/kit';
import { createNewISPAction, deleteExistingISPAction, editExistingISPAction } from '$lib/isp_utils.server';
import { addVendorToFacility, removeVendorFromFacility } from '$lib/location_utils.server';


export function load(  { cookies, url, params }) {
    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */
    
    const vendor = Vendor.getById(sanitize.toInt(params.slug)).toJSON();
    const vendor_isps = ISP.getByVendorId(vendor.id).map((a) => a.toJSON());
    const all_facilities = Facility.getAll().map((a) => a.toJSON());
    const all_vendors = Vendor.getAll().map((a) => a.toJSON());

    return {
        vendor_isps: vendor_isps,
        all_facilities: all_facilities,
        all_vendors: all_vendors
    };
};

function send_refreshed_data(vendor_id: number) {
    const vendor = Vendor.getById(vendor_id).toJSON();
    const vendor_isps = ISP.getByVendorId(vendor.id).map((a) => a.toJSON());
    return {
        vendor: vendor,
        vendor_isps: vendor_isps
    };
};

export const actions = {
    
    newISP: async ({ cookies, request, url }) => {
        const hack = url.pathname;
        const data = await request.formData();
        const page_vendor_id = sanitize.toInt(data.get("page_vendor_id") as string);

        const result = await createNewISPAction(cookies, data, url);

        if (result.success) {
            return send_refreshed_data(page_vendor_id);
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    editISP: async ({ cookies, request, url }) => {
        const hack = url.pathname;
        const data = await request.formData();
        const page_vendor_id = sanitize.toInt(data.get("page_vendor_id") as string);

        const result = await editExistingISPAction(cookies, data, url);
        
        if (result.success) {
            return send_refreshed_data(page_vendor_id);
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    deleteISP: async ({ cookies, request, url }) => {
        const hack = url.pathname;
        const data = await request.formData();
        const page_vendor_id = sanitize.toInt(data.get("page_vendor_id") as string);

        const result = await deleteExistingISPAction(cookies, data, url);
        
        if (result.success) {
            return send_refreshed_data(page_vendor_id);
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