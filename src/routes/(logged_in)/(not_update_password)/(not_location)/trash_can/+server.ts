import { Announcement, ISP, Facility, Staff, User, Vendor } from "$lib/db.server";
import sanitize from "$lib/sanitize.server";
import { json } from "@sveltejs/kit";
import logger from "$lib/logger";
import { toReadableDateString } from "$lib/util.js";
import type { anyJSON, JSONAnnouncement, JSONFacility, JSONISP, JSONStaff, JSONUser, JSONVendor } from "$lib/db_utils.js";

function getAllDeletedByTable(table: string) {
    switch (table) {
        case "facility":
            return Facility.getAllInactive();
        case "vendors":
            return Vendor.getAllInactive();
        case "staff":
            return Staff.getAllInactive();
        case "users":
            return User.getAllInactive();
        case "announcements":
            return Announcement.getAllInactive();
        case "isp":
            return ISP.getAllInactive();
    }
    return [];
};
function getColumnsByTable(entry: anyJSON, table: string) {
    switch (table) {
        case "facility": {
            let cast_entry = entry as JSONFacility;
            return [cast_entry.name, cast_entry.address, cast_entry.phone, Staff.getById(cast_entry.warden_id).name, cast_entry.date_deleted_string].map((a) => (a ?? "").toLowerCase()); }
        case "vendors": {
            let cast_entry = entry as JSONVendor;
            return [cast_entry.name, cast_entry.address, cast_entry.phone, cast_entry.date_deleted_string].map((a) => (a ?? "").toLowerCase()); }
        case "staff": {
            let cast_entry = entry as JSONStaff;
            return [cast_entry.name, cast_entry.lasalle_id.toString(), cast_entry.location_abbreviation, cast_entry.position, cast_entry.phone, cast_entry.email, cast_entry.date_deleted_string].map((a) => (a ?? "").toLowerCase()); }
        case "users": {
            let cast_entry = entry as JSONUser;
            return [cast_entry.name, cast_entry.name, cast_entry.username, cast_entry.title, cast_entry.location, cast_entry.privileges, cast_entry.date_deleted_string].map((a) => (a ?? "").toLowerCase()); }
        case "announcements": {
            let cast_entry = entry as JSONAnnouncement;
            return [cast_entry.text, toReadableDateString(cast_entry.date), toReadableDateString(cast_entry.expiration), cast_entry.color, cast_entry.priority.toString(), cast_entry.date_deleted_string].map((a) => (a ?? "").toLowerCase()); }
        case "isp": {
            let cast_entry = entry as JSONISP;
            return [cast_entry.role, cast_entry.facility_name, cast_entry.vendor_name, cast_entry.port_circuit_id, cast_entry.account_number, cast_entry.support_phone, cast_entry.date_deleted_string].map((a) => (a ?? "").toLowerCase()); }
    }
    return [];
};
function getColumnSortByTable(entry: anyJSON, table: string) {
    switch (table) {
        case "facility": {
            let cast_entry = entry as JSONFacility;
            return [cast_entry.name, cast_entry.address, cast_entry.phone, Staff.getById(cast_entry.warden_id).name, cast_entry.date_deleted]; }
        case "vendors": {
            let cast_entry = entry as JSONVendor;
            return [cast_entry.name, cast_entry.address, cast_entry.phone, cast_entry.date_deleted]; }
        case "staff": {
            let cast_entry = entry as JSONStaff;
            return [cast_entry.name, cast_entry.lasalle_id, cast_entry.location_abbreviation, cast_entry.position, cast_entry.phone, cast_entry.email, cast_entry.date_deleted]; }
        case "users": {
            let cast_entry = entry as JSONUser;
            return [cast_entry.name, cast_entry.name, cast_entry.username, cast_entry.title, cast_entry.location, cast_entry.privileges, cast_entry.date_deleted]; }
        case "announcements": {
            let cast_entry = entry as JSONAnnouncement;
            return [cast_entry.text, cast_entry.date, cast_entry.expiration, cast_entry.color, cast_entry.priority, cast_entry.date_deleted]; }
        case "isp": {
            let cast_entry = entry as JSONISP;
            return [cast_entry.role, cast_entry.facility_name, cast_entry.vendor_name, cast_entry.port_circuit_id, cast_entry.account_number, cast_entry.support_phone, cast_entry.date_deleted]; }
    }
    return [];
};

function get_sort(a: string | number, b: string | number) {
    if (typeof a === "number" && typeof b === "number") {
        return a-b;
    }else if (typeof a === "string" && typeof b === "string") {
        return a.localeCompare(b);
    }
    return 0;
}

export const GET = async ({ url }) => {
    try {
        let count = sanitize.toInt(url.searchParams.get("count") ?? "50");
        let offset = sanitize.toInt(url.searchParams.get("offset") ?? "0");
        let search_term = sanitize.toString(url.searchParams.get("search_term") ?? "").toLowerCase();
        let sort_col = sanitize.toInt(url.searchParams.get("sort_col") ?? "0");
        let sort_reversed = sanitize.toInt(url.searchParams.get("sort_reversed") ?? "0") === 1;
        let table = sanitize.toString(url.searchParams.get("table") ?? "facility");
        if (count < 1) count = 1;
        if (count > 1000) count = 1000; // This can actually be problematic
        if (offset < 0) offset = 0;
        if (sort_col < 0) sort_col = 0;
        if (sort_col > 5) sort_col = 5;

        const entries = getAllDeletedByTable(table).map((a) => a.toJSON());
        const mapped = entries.map((a) => { return { 
            original: a,
            columns: getColumnsByTable(a, table),
            sortBy: getColumnSortByTable(a, table)
        }});
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
        const new_entries = filtered.slice(offset, count+offset).map((a) => a.original);

        return json({
            entries: new_entries,
            new_offset: offset + new_entries.length,
            has_more: new_entries.length === count,
            total_results: filtered.length
        });
    } catch (err: any) {
        logger.error('all_staff GET failed', { err: err && (err.message || String(err)), stack: err && err.stack });
        return json({ entries: [], new_offset: 0, has_more: false, total_results: 0, error: (err && err.message) || String(err) }, { status: 500 });
    }
};