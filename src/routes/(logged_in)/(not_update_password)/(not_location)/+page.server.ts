import { Announcement, Facility } from '$lib/db.server';


export const ssr = false;

export function load(  { cookies, url, params }) {
    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */
    
    let announcements = Announcement.getAll().map((x) => x.toJSON());
    let facilities = Facility.getAll().map((x) => x.toJSON());
    
    return {
        facilities: facilities,
        announcements: announcements
    };
};

export const actions = {
    
};