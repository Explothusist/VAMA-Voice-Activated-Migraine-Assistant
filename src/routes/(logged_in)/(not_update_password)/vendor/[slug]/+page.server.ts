import { fail, redirect } from '@sveltejs/kit';
import { Staff, Vendor } from '$lib/db.server';
import sanitize from '$lib/sanitize.server';
import { deleteVendorAction, unpinStaffFromVendor } from '$lib/location_utils.server';
import path from 'path';
import fs from 'fs';
// Removed local Database creation

export function load(  { cookies, url, params }) {
    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */
    
    const vendor = Vendor.getById(sanitize.toInt(params.slug)).toJSON();
    // const staff_members = Staff.getByVendor(vendor.id).map((a) => a.toJSON());
    const staff_members = vendor.pinned_staff.map((a) => Staff.getById(a).toJSON()).filter((a) => !a.at_facility && a.place_id === vendor.id);

    const filepath = path.join(process.cwd(), 'uploads', 'vendor_logo', `vendor_${vendor.id}.png`);
    const exists = fs.existsSync(filepath);
    const last_modified = exists ? fs.statSync(filepath).mtimeMs : 0;
    const vendor_logo = { exists: exists, last_modified: last_modified };

    return {
        staff_members: staff_members,
        vendor_logo: vendor_logo
    };
};

function send_refreshed_data(vendor_id: number) {
    const vendor = Vendor.getById(vendor_id).toJSON();
    // const staff_members = Staff.getByVendor(vendor.id).map((a) => a.toJSON());
    const staff_members = vendor.pinned_staff.map((a) => Staff.getById(a).toJSON()).filter((a) => !a.at_facility && a.place_id === vendor.id);

    const filepath = path.join(process.cwd(), 'uploads', 'vendor_logo', `vendor_${vendor.id}.png`);
    const exists = fs.existsSync(filepath);
    const last_modified = exists ? fs.statSync(filepath).mtimeMs : 0;
    const vendor_logo = { exists: exists, last_modified: last_modified };

    return {
        vendor: vendor,
        staff_members: staff_members,
        vendor_logo: vendor_logo
    };
};

export const actions = {

    deleteVendor: async ({ cookies, request, url }) => {

		const hack = url.pathname;
        const data = await request.formData();
                
        const result = await deleteVendorAction(cookies, data, url);
        
        if (result.success) {
            redirect(303, "/all_location?select=vendors");
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
