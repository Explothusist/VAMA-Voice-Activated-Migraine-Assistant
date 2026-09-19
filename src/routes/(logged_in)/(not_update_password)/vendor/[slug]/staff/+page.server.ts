
import { Facility, Staff, Vendor } from '$lib/db.server';
import sanitize from '$lib/sanitize.server';
import { fail } from '@sveltejs/kit';
import { createNewStaffAction, deleteExistingStaffAction, editExistingStaffAction } from '$lib/staff_utils.server';
import { pinStaffToVendor, unpinStaffFromVendor } from '$lib/location_utils.server';

export function load(  { cookies, url, params }) {
    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */
    
    let vendor = Vendor.getById(sanitize.toInt(params.slug)).toJSON();
    let staff = Staff.getByVendor(vendor.id).map((a) => a.toJSON());
    let all_facilities = Facility.getAll().map((a) => a.toJSON());
    let all_vendors = Vendor.getAll().map((a) => a.toJSON());

    return {
        staff: staff,
        all_facilities: all_facilities,
        all_vendors: all_vendors
    };
};

function send_refreshed_data(vendor_id: number) {
    let vendor = Vendor.getById(vendor_id).toJSON();
    let staff = Staff.getByVendor(vendor_id).map((a) => a.toJSON());
    return {
        vendor: vendor,
        staff: staff
    };
};

export const actions = {

    newStaff: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();
        const vendor_id = sanitize.toInt(data.get("vendor_id") as string);

        let result = await createNewStaffAction(cookies, data, url);

        if (result.success) {
            return send_refreshed_data(vendor_id);
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    editStaff: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();
        const vendor_id = sanitize.toInt(data.get("vendor_id") as string);

        let result = await editExistingStaffAction(cookies, data, url);

        if (result.success) {
            return send_refreshed_data(vendor_id);
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    deleteStaff: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();
        const vendor_id = sanitize.toInt(data.get("vendor_id") as string);

        let result = await deleteExistingStaffAction(cookies, data, url);

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

    pinStaff: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();
        const vendor_id = sanitize.toInt(data.get("vendor_id") as string);

        let result = await pinStaffToVendor(cookies, data, url);

        if (result.success) {
            return send_refreshed_data(vendor_id);
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    unpinStaff: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();
        const vendor_id = sanitize.toInt(data.get("vendor_id") as string);

        let result = await unpinStaffFromVendor(cookies, data, url);

        if (result.success) {
            return send_refreshed_data(vendor_id);
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

};
