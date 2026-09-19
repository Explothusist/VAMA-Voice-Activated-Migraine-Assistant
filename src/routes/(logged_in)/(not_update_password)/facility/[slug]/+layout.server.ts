import { Facility } from '$lib/db.server';
import sanitize from '$lib/sanitize.server';

export function load({ url, params }) {
    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */

    const facility = Facility.getById(sanitize.toInt(params.slug)).toJSON();

    const all_locations = facility.active ? 
        Facility.getAll().map((a) => a.toJSON()) : 
        Facility.getAllInactive().map((a) => a.toJSON());

    return {
        facility: facility,
        all_locations: all_locations
    };
}