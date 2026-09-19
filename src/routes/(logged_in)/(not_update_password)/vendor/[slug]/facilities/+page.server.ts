import { Facility, Staff, Vendor } from '$lib/db.server';
import { addVendorToFacility, removeVendorFromFacility } from '$lib/location_utils.server';
import sanitize from '$lib/sanitize.server';
import { fail } from '@sveltejs/kit';

export function load(  { cookies, url, params }) {
    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */
    
    // const vendor = Vendor.getById(sanitize.toInt(params.slug)).toJSON();
    // const locations = Facility.getByVendor(vendor.id).map((a) => a.toJSON());
    const all_facilities = Facility.getAll().map((a) => a.toJSON());
    const warden_names = all_facilities.map((a) => a.is_facility ? Staff.getById(a.warden_id).name : "");
    const all_vendors = Vendor.getAll().map((a) => a.toJSON());

    return {
        // locations: locations,
        all_facilities: all_facilities,
        warden_names: warden_names,
        all_vendors: all_vendors,
    };
};

function send_refreshed_data(vendor_id: number) {
    const vendor = Vendor.getById(sanitize.toInt(vendor_id)).toJSON();
    const all_facilities = Facility.getAll().map((a) => a.toJSON());
    const warden_names = all_facilities.map((a) => a.is_facility ? Staff.getById(a.warden_id).name : "");
    return {
        vendor: vendor,
        warden_names: warden_names,
        all_facilities: all_facilities,
    };
};

export const actions = {
    
    newFacility: async ({ cookies, request, url }) => {
        const hack = url.pathname;
        const data = await request.formData();
        const vendor_id = sanitize.toInt(data.get("page_vendor_id") as string);

        let result = await addVendorToFacility(cookies, data, url);
        
        if (result.success) {
            return send_refreshed_data(vendor_id);
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    deleteFacility: async ({ cookies, request, url }) => {
        const hack = url.pathname;
        const data = await request.formData();
        const vendor_id = sanitize.toInt(data.get("page_vendor_id") as string);

        let result = await removeVendorFromFacility(cookies, data, url);
        
        if (result.success) {
            return send_refreshed_data(vendor_id);
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },
        
    swapLocation: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();
        const newLocationId = sanitize.toInt(data.get("newLocationId") as string);

        const valid = Vendor.isValidId(newLocationId);
        if (valid) {
            return send_refreshed_data(newLocationId);
        }else {
            cookies.set("error-message", "Request Could Not Be Processed: Inputs Out of Valid Range. Field: Id", { path: "/" });
            return fail(400, { message: "Request Could Not Be Processed: Inputs Out of Valid Range. Field: Id" });
        }
    },
    
};