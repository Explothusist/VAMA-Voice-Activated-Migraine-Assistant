import { Announcement } from '$lib/db.server';
import { fail } from '@sveltejs/kit';
import { validate_JWT_login_admin } from '$lib/security_util.server';
import { createNewAnnouncementAction, deleteExistingAnnouncementAction, editExistingAnnouncementAction, toggleExistingAnnouncementAction } from '$lib/announcement_utils.server';


export function load(  { cookies, url, params }) {
    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */
    
    const user = validate_JWT_login_admin(cookies, url.pathname + url.search); // Must be kept to provide authentication
    
    const initial_search = (url.searchParams.get("search") ?? "");
    
    let announcements = Announcement.getAll().map((a) => a.toJSON());

    return {
        announcements: announcements,
        initial_search: initial_search
    };
};

function send_refreshed_data() {
    let announcements = Announcement.getAll().map((a) => a.toJSON());
    return {
        announcements: announcements
    };
};

export const actions = {

    newAnnouncement: async ({ cookies, request, url }) => {
        
        const hack = url.pathname;
        const data = await request.formData();

        const result = await createNewAnnouncementAction(cookies, data, url);

        if (result.success) {
            return send_refreshed_data();
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    editAnnouncement: async ({ cookies, request, url }) => {
        
        const hack = url.pathname;
        const data = await request.formData();

        const result = await editExistingAnnouncementAction(cookies, data, url);

        if (result.success) {
            return send_refreshed_data();
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    deleteAnnouncement: async ({ cookies, request, url }) => {
        
        const hack = url.pathname;
        const data = await request.formData();

        const result = await deleteExistingAnnouncementAction(cookies, data, url);

        if (result.success) {
            return send_refreshed_data();
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    toggleAnnouncement: async ({ cookies, request, url }) => {
        
        const hack = url.pathname;
        const data = await request.formData();

        const result = await toggleExistingAnnouncementAction(cookies, data, url);

        if (result.success) {
            return send_refreshed_data();
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    }

};