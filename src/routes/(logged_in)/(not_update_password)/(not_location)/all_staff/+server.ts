import { Staff } from "$lib/db.server";
import sanitize from '$lib/sanitize.server';
import { json } from "@sveltejs/kit";
import { validate_JWT_login } from "$lib/security_util.server";

function get_sort(a: string | number, b: string | number) {
    if (typeof a === "number" && typeof b === "number") {
        return a-b;
    }else if (typeof a === "string" && typeof b === "string") {
        return a.localeCompare(b);
    }
    return 0;
}

function get_entries(facility_id: number, filter: string) {
    const entries = facility_id === -1 ? Staff.getAll() : Staff.getByFacility(facility_id);
    switch (filter) {
        case "facility":
            return entries.filter((a) => a.at_facility);
        case "vendor":
            return entries.filter((a) => !a.at_facility);
        case "all":
            return entries;
        default:
            return entries;
    }
};


export const GET = async ({ url, cookies }) => {
    // try {
    // let current_time = getTimeMS();
    // let last_time = current_time;
    // console.log("start", last_time, 0);
    
    let user = validate_JWT_login(cookies, url.pathname + url.search); // For authentication
    
    let filter = sanitize.toString(url.searchParams.get("filter") ?? "all");
    let count = sanitize.toInt(url.searchParams.get("count") ?? "50");
    let offset = sanitize.toInt(url.searchParams.get("offset") ?? "0");
    let search_term = sanitize.toString(url.searchParams.get("search_term") ?? "").toLowerCase();
    let sort_col = sanitize.toInt(url.searchParams.get("sort_col") ?? "0");
    let sort_reversed = sanitize.toInt(url.searchParams.get("sort_reversed") ?? "0") === 1;
    let facility_id = sanitize.toInt(url.searchParams.get("facility_id") ?? "-1");
    if (count < 1) count = 1;
    if (count > 1000) count = 1000; // This can actually be problematic
    if (offset < 0) offset = 0;
    if (sort_col < 0) sort_col = 0;
    if (sort_col > 5) sort_col = 5;

    // current_time = getTimeMS();
    // console.log("search_terms", current_time, current_time - last_time);
    // last_time = current_time;

    const entries = get_entries(facility_id, filter);

    if (!entries || entries.length === 0) { 
        return json({
            entries: [],
            new_offset: 0,
            has_more: false,
            total_results: 0
        });
    }

    // current_time = getTimeMS();
    // console.log("get all", current_time, current_time - last_time);
    // last_time = current_time;

    const mapped = entries.map((a) => { return { 
        original: a,
        columns: [a.name, a.lasalle_id.toString(), ...(facility_id === -1 ? [a.location_abbreviation] : []), a.position, a.phone, a.email].map((a) => (a ?? "").toLowerCase()),
        sortBy: [a.name, a.lasalle_id, ...(facility_id === -1 ? [a.location_abbreviation] : []), a.position, a.phone, a.email]
    }});

    // current_time = getTimeMS();
    // console.log("mapped", current_time, current_time - last_time);
    // last_time = current_time;

    const filtered = mapped.filter((a) => {
        for (const column of a.columns) {
            if (column.includes(search_term)) {
                return true;
            }
        }
        return false;
    }).sort((a, b) => {
        const result = get_sort(a.sortBy[sort_col], b.sortBy[sort_col]);
        return sort_reversed ? -result : result;
    });

    // current_time = getTimeMS();
    // console.log("filtered and sorted", current_time, current_time - last_time);
    // last_time = current_time;

    const new_entries = filtered.slice(offset, count+offset).map((a) => a.original);

    // current_time = getTimeMS();
    // console.log("sliced", current_time, current_time - last_time);
    // last_time = current_time;


    return json({
        entries: new_entries,
        new_offset: offset + new_entries.length,
        has_more: new_entries.length === count,
        total_results: filtered.length
    });
    // } catch (err: any) {
    //     logger.error('all_staff GET failed', { err: err && (err.message || String(err)), stack: err && err.stack });
    //     return json({ entries: [], new_offset: 0, has_more: false, total_results: 0, error: (err && err.message) || String(err) }, { status: 500 });
    // }
};