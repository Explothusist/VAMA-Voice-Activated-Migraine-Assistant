import { fail, redirect } from '@sveltejs/kit';
import { Vendor } from '$lib/db.server';
import sanitize from '$lib/sanitize.server';
import { validate_JWT_login_admin } from '$lib/security_util.server';
import { addVendorLogoAction, editExistingVendorAction, removeVendorLogoAction } from '$lib/location_utils.server.js';
import path from 'path';
import fs from 'fs';

export function load(  { cookies, url, params }) {
    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */
    
    const user = validate_JWT_login_admin(cookies, url.pathname + url.search); // Must be kept to provide authentication
    
    let vendor = Vendor.getById(sanitize.toInt(params.slug)).toJSON();
    
    let filepath = path.join(process.cwd(), 'uploads', 'vendor_logo', `vendor_${vendor.id}.png`);
    let exists = fs.existsSync(filepath);
    let last_modified = exists ? fs.statSync(filepath).mtimeMs : 0;
    let vendor_logo = { exists: exists, last_modified: last_modified };
    
    return {
        vendor_logo: vendor_logo
    };
};

function send_refreshed_data(vendor_id: number) {
    let vendor = Vendor.getById(vendor_id).toJSON();
    
    let filepath = path.join(process.cwd(), 'uploads', 'vendor_logo', `vendor_${vendor.id}.png`);
    let exists = fs.existsSync(filepath);
    let last_modified = exists ? fs.statSync(filepath).mtimeMs : 0;
    let vendor_logo = { exists: exists, last_modified: last_modified };

    return {
        vendor: vendor,
        vendor_logo: vendor_logo
    };
};

export const actions = {

    saveVendor: async ({ cookies, request, url }) => {

		const hack = url.pathname;
        const data = await request.formData();

        const result = await editExistingVendorAction(cookies, data, url);

        if (result.success) {
            redirect(303, result.link ?? "");
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    addLogo: async ({ cookies, request, url }) => {

		const hack = url.pathname;
        const data = await request.formData();

        const result = await addVendorLogoAction(cookies, data, url);

        if (result.success) {
            redirect(303, result.link ?? "");
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    removeLogo: async ({ cookies, request, url }) => {

		const hack = url.pathname;
        const data = await request.formData();

        const result = await removeVendorLogoAction(cookies, data, url);

        if (result.success) {
            redirect(303, result.link ?? "");
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
