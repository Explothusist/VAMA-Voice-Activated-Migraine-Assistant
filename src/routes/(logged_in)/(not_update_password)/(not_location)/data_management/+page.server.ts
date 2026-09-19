import { ActivityLog, Facility, Staff, User, Vendor, DB_BACKUP_DIR, type StaffExportMaps, db, type FacilityExportMaps } from "$lib/db.server";
import sanitize from '$lib/sanitize.server';
import { validate_JWT_login_admin } from "$lib/security_util.server";
import { existsSync, readdirSync } from 'fs';
import { fail, redirect } from "@sveltejs/kit";
import { getDateForFilename, read_csv } from "$lib/util";
import { storeParsedCSVInCache } from "$lib/csv_cache.server";
import { invalidateAllCaches } from "$lib/db_cache.server";
import { createBackup, restoreBackup } from "$lib/db_utils.server";
import { is_valid_export_table, is_valid_import_mode, is_valid_import_table } from "$lib/csv_utils";
// shared db already has default configuration


export function load( { cookies, url, params } ) {
    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */

    const user = validate_JWT_login_admin(cookies, url.pathname + url.search);
    
    const backupDir = DB_BACKUP_DIR;
    let weekly_backups = [] as string[];
    if (existsSync(backupDir)) weekly_backups = readdirSync(backupDir);

    return {
        weekly_backups: weekly_backups
    };
};

function reload_data() {
    const backupDir = DB_BACKUP_DIR;
    let weekly_backups = [] as string[];
    if (existsSync(backupDir)) weekly_backups = readdirSync(backupDir);

    return {
        weekly_backups: weekly_backups
    };
};


export const actions = {

    loadCSVFile: async ({ cookies, request, url }) => {
        /* HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
        load functions will not run when changing pages unless something referenced in the function, such as url,
        changes. Maybe could be replaced with invalidateAll()? It must be url.pathname too, not just url. */
        const _ = url.pathname;

        const user = validate_JWT_login_admin(cookies, url.pathname + url.search);

        const data = await request.formData();
        const importTable = sanitize.toString(data.get("table") as string || "", 20);
        const importMode = sanitize.toString(data.get("mode") as string || "", 20);
        if (!is_valid_import_table(importTable)) {
            // console.log("Improper Table Name: "+importTable);
            return fail(400, { message: "Invalid table specified" });
        }
        if (!is_valid_import_mode(importMode)) {
            // console.log("Improper Import Mode: "+importMode);
            return fail(400, { message: "Invalid import mode" });
        }
        if (importMode === "ukg_special" && importTable !== "staff") {
            return fail(400, { message: "UKG Staff Mode if only for imports to table Staff" });
        }

        const csv_file = data.get("csv_file") as File;
        if (!csv_file || !(csv_file instanceof File)) {
            // console.log("File could not be loaded");
            return fail(400, { message: "File could not be loaded" });
        }
        if (csv_file.size === 0) {
            // console.log("Please attach a file");
            return fail(400, { message: "Please attach a file" });
        }
        const filename = csv_file.name;
        const contents = await csv_file.text();
        const parsed_csv = read_csv(contents);
        const csv_id = storeParsedCSVInCache(parsed_csv);

        // console.log("Finishing Import");

        redirect(303, "/data_management/import_csv?mode="+importMode+"&&table="+importTable+"&&filename="+filename+"&&csv_id="+csv_id);
    },

    exportData: async ({ cookies, request, url }) => {
        /* HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
        load functions will not run when changing pages unless something referenced in the function, such as url,
        changes. Maybe could be replaced with invalidateAll()? It must be url.pathname too, not just url. */
        const _ = url.pathname;

        const user = validate_JWT_login_admin(cookies, url.pathname + url.search);

        const data = await request.formData();
        const table_to_export = sanitize.toString(data.get("table_to_download") as string || "", 20);
        const include_deleted = sanitize.toString(data.get("include_deleted") as string || "", 20) === "True";
        
        let csv_file = "";
        let filename = "";
        if (is_valid_export_table(table_to_export)) {
            // let table_entries: (Facility | Vendor | Staff | User | ActivityLog)[] = [];
            switch(table_to_export) {
                case "facility": {
                    const all_vendors = Vendor.getAll(include_deleted);
                    const all_staff = Staff.getAll(include_deleted);
                    const map_VendorsById = new Map(all_vendors.map((a) => [a.id, a]));
                    const map_StaffById = new Map(all_staff.map((a) => [a.id, a]));
                    const facility_maps: FacilityExportMaps = {
                        vendorsById: map_VendorsById,
                        staffById: map_StaffById
                    };
                    csv_file += Facility.getCSVHeaders();
                    let table_entries = Facility.getAll(include_deleted);
                    for (const row of table_entries) {
                        csv_file += row.toCSV(facility_maps);
                    }
                    // table_entries.forEach((a: Facility) => csv_file += a.toCSV(map_VendorsById));
                    filename = "LaSalle_Facilities";
                    break; }
                case "vendors": {
                    const all_facilities = Facility.getAll(include_deleted);
                    const map_FacilitiesByVendorId = new Map<number, Facility[]>();
                    for (const facility of all_facilities) {
                        for (const vendor_id of facility.vendors) {
                            let list = map_FacilitiesByVendorId.get(vendor_id);
                            if (!list) {list = []; map_FacilitiesByVendorId.set(vendor_id, list)}
                            list.push(facility);
                        }
                    }
                    csv_file += Vendor.getCSVHeaders();
                    let table_entries = Vendor.getAll(include_deleted);
                    for (const row of table_entries) {
                        csv_file += row.toCSV(map_FacilitiesByVendorId);
                    }
                    // table_entries.forEach((a: Vendor) => csv_file += a.toCSV(map_FacilitiesByVendorId));
                    filename = "LaSalle_Vendors";
                    break; }
                case "staff": {
                    const staff_all_facilities = Facility.getAll();
                    const staff_all_vendors = Vendor.getAll();
                    const map_FacilityInfoById = new Map(staff_all_facilities.map((a) => [a.id, { name: a.name, abbreviation: a.abbreviation }]));
                    const map_VendorInfoById = new Map(staff_all_vendors.map((a) => [a.id, { name: a.name, abbreviation: a.abbreviation }]));
                    const staff_maps: StaffExportMaps = {
                        facilityInfoById: map_FacilityInfoById,
                        vendorInfoById: map_VendorInfoById
                    };
                    csv_file += Staff.getCSVHeaders();
                    let table_entries = Staff.getAll(include_deleted);
                    for (const row of table_entries) {
                        csv_file += row.toCSV(staff_maps);
                    }
                    // table_entries.forEach((a: Staff) => csv_file += a.toCSV(staff_maps));
                    filename = "LaSalle_Staff";
                    break; }
                case "users": {
                    csv_file += User.getCSVHeaders();
                    let table_entries = User.getAll(include_deleted);
                    for (const row of table_entries) {
                        csv_file += row.toCSV();
                    }
                    // table_entries.forEach((a: User) => csv_file += a.toCSV());
                    filename = "LaSalle_Accounts";
                    break; }
                case "activity_log": {
                    csv_file += ActivityLog.getCSVHeaders();
                    let table_entries = ActivityLog.getAll();
                    for (const row of table_entries) {
                        csv_file += row.toCSV();
                    }
                    // table_entries.forEach((a: ActivityLog) => csv_file += a.toCSV());
                    filename = "LaSalle_Activity_Log";
                    break; }
                default:
                    // console.log("Improper Table Name: "+table_to_export);
            }

            filename += "_"+getDateForFilename(); // _YYYY_MM_DD
            
            const modified_by = user.name.length > 0 ? user.name : user.username;
            ActivityLog.record(modified_by, 'Export', table_to_export, -1, "All", 'None');
        }

        return {
            is_exporting: true,
            table_to_export: table_to_export,
            include_deleted: include_deleted,
            csv_file: csv_file,
            filename: filename,
        };
    },

    createBackup: async ({ cookies, request, url }) => {
        /* HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
        load functions will not run when changing pages unless something referenced in the function, such as url,
        changes. Maybe could be replaced with invalidateAll()? It must be url.pathname too, not just url. */
        const _ = url.pathname;

        const user = validate_JWT_login_admin(cookies, url.pathname + url.search);
        const username = user.name.length !== 0 ? user.name : user.username;

        const filename = getDateForFilename()+"_Backup_Manual";
        await createBackup(filename);
        ActivityLog.record(username, "Create Backup", "all", -1, filename, "N/A");

        return reload_data();
    },

    restoreBackup: async ({ cookies, request, url }) => {
        /* HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
        load functions will not run when changing pages unless something referenced in the function, such as url,
        changes. Maybe could be replaced with invalidateAll()? It must be url.pathname too, not just url. */
        const _ = url.pathname;

        const data = await request.formData();
        const filename = sanitize.toString(data.get("filename") as string || "", 50);
        if (!filename || !filename.endsWith(".db")) {
            cookies.set("error-message", "Request Could Not Be Processed: Inputs Out of Valid Range. Field: Filename", { path: "/" });
            return fail(400, { message: "Request Could Not Be Processed: Inputs Out of Valid Range. Field: Filename" });
        }

        const user = validate_JWT_login_admin(cookies, url.pathname + url.search);
        const username = user.name.length !== 0 ? user.name : user.username;

        await restoreBackup(filename);
        ActivityLog.record(username, "Restore Backup", "all", -1, filename.replaceAll(".db", ""), "N/A");
        invalidateAllCaches();

        return reload_data();
    },

    invalidateCaches: async ({ cookies, request, url }) => {
        /* HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
        load functions will not run when changing pages unless something referenced in the function, such as url,
        changes. Maybe could be replaced with invalidateAll()? It must be url.pathname too, not just url. */
        const _ = url.pathname;

        const user = validate_JWT_login_admin(cookies, url.pathname + url.search);

        invalidateAllCaches();

        return reload_data();
    },

};