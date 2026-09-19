import { validate_JWT_login_admin } from '$lib/security_util.server';


export async function load( { cookies, url, fetch }) {
    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */
    

    const user = validate_JWT_login_admin(cookies, url.pathname + url.search); // Must be kept to provide authentication

    const initial_filter: string = (url.searchParams.get("filter") ?? "activity");
    const initial_search: string = (url.searchParams.get("search") ?? "");
    const initial_sort_col: number = (Number(url.searchParams.get("sort_col") ?? "4"));
    const initial_sort_reversed: boolean = (Number(url.searchParams.get("sort_reversed") ?? "1")) === 1;

    const initial_request = await fetch(`/activity_log?count=50&offset=${0}&filter=${initial_filter}&search_term=${encodeURIComponent(initial_search)}&sort_col=${initial_sort_col}&sort_reversed=${initial_sort_reversed ? 1 : 0}`);
    const initial_response = await initial_request.json();
    const initial_data = initial_response.entries;
    const initial_offset = initial_response.new_offset;
    const initial_has_more = initial_response.has_more;
    const initial_total_results = initial_response.total_results;

    return {
        initial_filter: initial_filter,
        initial_search: initial_search,
        initial_sort_col: initial_sort_col,
        initial_sort_reversed: initial_sort_reversed,
        initial_data: initial_data,
        initial_offset: initial_offset,
        initial_has_more: initial_has_more,
        initial_total_results: initial_total_results
    };
};

export const actions = {

};
