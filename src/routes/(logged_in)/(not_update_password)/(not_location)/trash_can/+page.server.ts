import { Staff, Facility, Vendor, User, Announcement, ISP } from '$lib/db.server.js';
import sanitize from '$lib/sanitize.server';
import { validate_JWT_login_admin } from '$lib/security_util.server';
import { fail } from '@sveltejs/kit';


export function load(  { cookies, url, params }) {
    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */

    const user = validate_JWT_login_admin(cookies, url.pathname + url.search);
    
    const select_table = (url.searchParams.get("select") ?? "facility");
    const initial_search = (url.searchParams.get("search") ?? "");

    return {
        select_table: select_table,
        initial_search: initial_search
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

    restoreDeleted: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();
        const object_name = sanitize.toString(data.get("object_name") as string, 100);
        const deleted_table = sanitize.toString(data.get("deleted_table") as string, 20);
        const deleted_id = sanitize.toInt(data.get("deleted_id") as string);
        
        const user = validate_JWT_login_admin(cookies, url.pathname + url.search);
        const modified_by = user.name.length > 0 ? user.name : user.username;

        let valid = false;
        switch (deleted_table) {
            case "facility":
                const facility = Facility.getById(deleted_id, true);
                if (facility.id === -1) break;
                facility.databaseEntrySetActive(modified_by, true);
                valid = true;
                break;
            case "vendors":
                const vendor = Vendor.getById(deleted_id, true);
                if (vendor.id === -1) break;
                vendor.databaseEntrySetActive(modified_by, true);
                valid = true;
                break;
            case "staff":
                const staff = Staff.getById(deleted_id, true);
                if (staff.id === -1) break;
                staff.databaseEntrySetActive(modified_by, true);
                valid = true;
                break;
            case "users":
                const user = User.getById(deleted_id, true);
                if (user.id === -1) break;
                user.databaseEntrySetActive(modified_by, true);
                valid = true;
                break;
            case "announcements":
                const annoucement = Announcement.getById(deleted_id, true);
                if (annoucement.id === -1) break;
                annoucement.databaseEntrySetActive(modified_by, true);
                valid = true;
                break;
            case "isp":
                const isp = ISP.getById(deleted_id, true);
                if (isp.id === -1) break;
                isp.databaseEntrySetActive(modified_by, true);
                valid = true;
                break;
            default:
                valid = false;
                break;
        }
        if (valid) {
            // ActivityLog.record(modified_by, 'Restore', deleted_table, deleted_id, object_name, 'Active');
            
            return send_refreshed_data();
        }else {
            cookies.set("error-message", "Request Could Not Be Processed: Inputs Out of Valid Range. Field: Table/Id Combination", { path: "/"});
            return fail(400, { message: "Request Could Not Be Processed: Inputs Out of Valid Range. Field: Table/Id Combination" });
        }
    },

};