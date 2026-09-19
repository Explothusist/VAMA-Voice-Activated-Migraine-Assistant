import { Vendor } from '$lib/db.server';
import sanitize from '$lib/sanitize.server';

export function load({ url, params }) {
    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */

    let vendor = Vendor.getById(sanitize.toInt(params.slug)).toJSON();

    let all_vendors = vendor.active ? 
        Vendor.getAll().map((a) => a.toJSON()) : 
        Vendor.getAllInactive().map((a) => a.toJSON());

    return {
        vendor: vendor,
        all_vendors: all_vendors
    };
}