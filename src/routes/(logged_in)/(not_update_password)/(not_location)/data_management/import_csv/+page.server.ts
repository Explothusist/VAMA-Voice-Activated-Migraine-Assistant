import { validate_JWT_login_admin } from "$lib/security_util.server";
import { fail, redirect } from "@sveltejs/kit";
import { clearParsedCSVCache, getParsedCSVFromCache } from "$lib/csv_cache.server";
import { ActivityLog, dbRunAsTransaction, Get_All_Locations_Raw, Facility, Staff, Vendor, type FacilityImportMaps, type StaffImportMaps, type VendorImportMaps } from "$lib/db.server.js";
import { data_column_mapper, data_columns_indexer, is_valid_import_mode, is_valid_import_table } from "$lib/csv_utils";
import { ImportParsedCSV } from "$lib/csv_utils.server";
import sanitize from "$lib/sanitize.server";

export function load( { cookies, url, params } ) {
    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */
    
    const import_table = String(url.searchParams.get("table")) || "";
    const import_mode = String(url.searchParams.get("mode")) || "";
    const filename = String(url.searchParams.get("filename")) || "";
    const csv_id = Number(url.searchParams.get("csv_id")) || -1;

    const user = validate_JWT_login_admin(cookies, url.pathname + url.search);
    
    const csv_file = getParsedCSVFromCache(csv_id);
    const headers = csv_file?.[0] ?? [];

    return {
        headers: headers,
        import_table: import_table,
        import_mode: import_mode,
        filename: filename,
        csv_id: csv_id
    };
};


export const actions = {

    importCSV: async ({ cookies, request, url }) => {
        /* HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
        load functions will not run when changing pages unless something referenced in the function, such as url,
        changes. Maybe could be replaced with invalidateAll()? It must be url.pathname too, not just url. */
        const _ = url.pathname;

        // Decode metadata
        const data = await request.formData();
        const importTable = sanitize.toString(data.get("table") as string, 50);
        const importMode = sanitize.toString(data.get("mode") as string, 50);
        const csv_id = sanitize.toInt(data.get("csv_id") as string);
        if (!is_valid_import_table(importTable)) {
            // console.log("Improper Table Name: "+importTable);
            return fail(400, { message: "Invalid table specified" });
        }
        if (!is_valid_import_mode(importMode)) {
            // console.log("Improper Import Mode: "+importMode);
            return fail(400, { message: "Invalid import mode" });
        }


        const user = validate_JWT_login_admin(cookies, url.pathname + url.search);
        const modified_by = user.name.length > 0 ? user.name : user.username;

        const csv_file = getParsedCSVFromCache(csv_id); // [row][col]

        const csv_headers = csv_file?.[0] ?? [];
        const data_columns = data_column_mapper[data_columns_indexer.indexOf(importTable)];
        const csv_column_swap_ids = data_columns.map((col) => { // [row][col]
            if (!csv_file) return -1;
            const mapped_column = data.get(col) as string;
            return mapped_column ? csv_headers.indexOf(mapped_column) : -1;
        });

        if (csv_file) {
            ImportParsedCSV(importTable, importMode, csv_file, csv_column_swap_ids, modified_by);
        }
        
        ActivityLog.record(modified_by, 'Import', importTable, -1, "All", 'All');
        clearParsedCSVCache(csv_id);
        throw redirect(303, "/data_management");
    },

    cancelImport: async ({ cookies, request, url }) => {
        /* HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
        load functions will not run when changing pages unless something referenced in the function, such as url,
        changes. Maybe could be replaced with invalidateAll()? It must be url.pathname too, not just url. */
        const _ = url.pathname;
        const data = await request.formData();
        const csv_id = sanitize.toInt(data.get("csv_id") as string);

        clearParsedCSVCache(csv_id);

        throw redirect(303, "/data_management");
    }

};