import Database from 'better-sqlite3';
// NOTE: All inputs into SQL queries in this module must be sanitized prior to usage.
// Use `src/lib/sanitize.ts` helpers to enforce typed conversions and limits.
// Always prefer parameterized queries (use ? placeholders) instead of string interpolation.
import { randomBytes, type BinaryLike } from 'crypto';
import { quoted_csv_sanitize, inDateRange, pretifyTableName, getTimeSinceMS, getTimeMS, toStandardDateString, clamp_string_to_length, kUKGTitlesToPosition, toReadableFullDateString } from './util';
import { kActivityLogRetentionLength, kFailedAttemptsLockoutTimeMS, kFailedAttemptsUntilLockout, kImportActivityLogRetentionLength } from "./security_util.server";
import sanitize, { parsePhoneToStandard } from "./sanitize.server";
import { decryptFieldValueMaybe, encryptFieldValue } from '$lib/field_crypto.server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import logger from './logger';
import eventLogger from './event_logger';
import { execSync } from 'child_process';
import { getCache_AllActiveAnnouncements, getCache_AllActiveFacilities, getCache_AllActiveISP, getCache_AllActiveStaff, getCache_AllActiveUsers, getCache_AllActiveVendors, getCache_AllActivityLogs, getCache_AllAnnouncements, getCache_AllFacilities, getCache_AllImportActivityLogs, getCache_AllISP, getCache_AllStaff, getCache_AllUsers, getCache_AllVendors, getCache_AnnouncementById, getCache_FacilityById, getCache_ISPByFacility, getCache_ISPById, getCache_ISPByVendor, getCache_StaffById, getCache_StaffByLocation, getCache_UserById, getCache_UserByUsername, getCache_VendorById, updateCache_AddEntry_ActivityLog, updateCache_AddEntry_Announcement, updateCache_AddEntry_Facility, updateCache_AddEntry_ImportActivityLog, updateCache_AddEntry_ISP, updateCache_AddEntry_Staff, updateCache_AddEntry_User, updateCache_AddEntry_Vendor, updateCache_SetActive_Announcement, updateCache_SetActive_Facility, updateCache_SetActive_ISP, updateCache_SetActive_Staff, updateCache_SetActive_User, updateCache_SetActive_Vendor, updateCache_SetPinnedStaff_Vendor, updateCache_SetVendors_Facility, updateCache_UpdateEntry_Announcement, updateCache_UpdateEntry_Facility, updateCache_UpdateEntry_ISP, updateCache_UpdateEntry_Staff, updateCache_UpdateEntry_User, updateCache_UpdateEntry_Vendor } from './db_cache.server';
import type { JSONActivityLog, JSONAnnouncement, JSONISP, JSONFacility, JSONStaff, JSONUser, JSONVendor, JSONImportActivityLog } from './db_utils';

function getRuntimeUserInfo() {
    try {
        const info = os.userInfo();
        return { username: info.username, uid: info.uid, gid: info.gid };
    } catch (err) {
        // fallback to environment variables
        return { username: process.env.USER || process.env.LOGNAME || 'n/a', uid: process.env.UID || 'n/a', gid: process.env.GID || 'n/a' };
    }
}

// DB path selection logic:
// - If DATABASE_PATH env var is set, use it (recommended for production)
// - Otherwise if NODE_ENV !== 'production', use a local project db (for dev convenience)
// - Otherwise fallback to system-wide default path.
const defaultDevPath = path.join(process.cwd(), 'db', 'main.db');
const defaultProdPath = '/var/lib/lasallelocationdb/main.db';
// DB selection order:
// 1) `DATABASE_PATH` env var (explicit)
// 2) If unset, prefer defaultProdPath if it exists and is readable by the process (useful when moving DB to /var/lib)
// 3) If NODE_ENV !== 'production', fall back to default dev path (./db/main.db)
// 4) Otherwise default to defaultProdPath
let dbPath = null;
// Capture raw unset vs set env var for diagnostics
const envRawDatabasePath = process.env.DATABASE_PATH || null;
const envDatabasePath = envRawDatabasePath && envRawDatabasePath.trim().length > 0 ? envRawDatabasePath.trim() : null;

if (envDatabasePath) {
    // If DATABASE_PATH is explicitly set, ensure the directory exists and is writable/executable by the Node process.
    const envDBDir = path.dirname(envDatabasePath);
    try {
        if (!fs.existsSync(envDBDir)) {
            throw new Error(`env DATABASE_PATH directory does not exist: ${envDBDir}`);
        }
        fs.accessSync(envDBDir, fs.constants.W_OK | fs.constants.X_OK);
        dbPath = envDatabasePath;
        // Directory validated; accept env path. No additional debug logs.
    } catch (e) {
        // console.error('db.server: Invalid DATABASE_PATH provided; directory does not exist or is not writable/executable by the process:', envDatabasePath, 'error:', String(e));
        logger.error('Invalid DATABASE_PATH provided; directory does not exist or is not writable/executable', { path: envDatabasePath, error: String(e) });
        throw new Error(`Invalid DATABASE_PATH ${envDatabasePath}; directory ${envDBDir} must exist and be writable/executable by the Node process.`);
    }
} else if (fs.existsSync(defaultProdPath)) {
    // Prefer the prod path if the file already exists there
    try {
        fs.accessSync(defaultProdPath, fs.constants.R_OK);
        dbPath = defaultProdPath;
    } catch (accessErr) {
        // not readable; will fall back to dev or prod default below
            try {
            const fileStats = fs.statSync(defaultProdPath);
            // console.warn('db.server: defaultProdPath exists but is not readable by this process. defaultProdPath stats:', {mode: fileStats.mode.toString(8), uid: fileStats.uid, gid: fileStats.gid});
            logger.warn('defaultProdPath exists but is not readable by process', { path: defaultProdPath, stats: { mode: fileStats.mode.toString(8), uid: fileStats.uid, gid: fileStats.gid } });
        } catch (ferr) {
            // ignore
        }
    }
}
if (!dbPath) {
    dbPath = (process.env.NODE_ENV !== 'production') ? defaultDevPath : defaultProdPath;
}

// Exported paths for use by backups, scripts, and other modules
export let DB_PATH = dbPath;
export const DB_DIR = path.dirname(dbPath);
export const DB_BACKUP_DIR = path.join(DB_DIR, 'backups');

// Ensure DB directory exists. If it doesn't and we can create it, do so.
if (!fs.existsSync(DB_DIR)) {
    try {
        fs.mkdirSync(DB_DIR, { recursive: true });
        if (process.env.NODE_ENV !== 'production') {
            // console.log('db.server: Created DB directory at', DB_DIR);
            logger.info('Created DB directory', { dir: DB_DIR });
        }
    } catch (err) {
        // console.error('db.server: Could not create DB_DIR', DB_DIR, err);
        logger.error('Could not create DB_DIR', { dir: DB_DIR, err: String(err) });
        // If we can't create the requested directory but are in development, fall back to local project DB
        if (process.env.NODE_ENV !== 'production') {
            // console.warn('db.server: Falling back to development DB at', defaultDevPath);
            logger.warn('Falling back to development DB', { fallback: defaultDevPath });
            dbPath = defaultDevPath;
            DB_PATH = dbPath;
            // ensure the fallback's dir exists
            const defaultDevDir = path.dirname(defaultDevPath);
            if (!fs.existsSync(defaultDevDir)) {
                try { fs.mkdirSync(defaultDevDir, { recursive: true }); }
                catch (e) { console.error('db.server: Could not create fallback DB dir', defaultDevDir, e); throw err; }
            }
        } else {
            throw new Error(`Cannot open database because the directory ${DB_DIR} does not exist and could not be created. Either create it, change its permissions, or set DATABASE_PATH to a writable location.`);
        }
    }
}

// Ensure backup directory exists (non-blocking - creation fails will be logged in the backup functions)
if (!fs.existsSync(DB_BACKUP_DIR)) {
    try {
        fs.mkdirSync(DB_BACKUP_DIR, { recursive: true });
        if (process.env.NODE_ENV !== 'production') {
            // console.log('db.server: Created DB backup directory at', DB_BACKUP_DIR);
            logger.info('Created DB backup directory', { dir: DB_BACKUP_DIR });
        }
    } catch (err) {
        // Don't throw here - backup folder is optional; backups will create it when required.
        // console.warn('db.server: Could not create DB_BACKUP_DIR', DB_BACKUP_DIR, err);
        logger.warn('Could not create DB_BACKUP_DIR', { dir: DB_BACKUP_DIR, err: String(err) });
    }
}
// Always log DB path and basic runtime user info. This helps diagnose permission problems.
const runtimeUser = getRuntimeUserInfo();
// console.log('db.server: startup check | DB_PATH:', dbPath, '| DB_DIR:', DB_DIR, '| cwd:', process.cwd(), '| runtime user:', runtimeUser, '| NODE_ENV:', process.env.NODE_ENV || 'unset');
logger.info('db.server startup check', { DB_PATH: dbPath, DB_DIR, cwd: process.cwd(), runtimeUser, NODE_ENV: process.env.NODE_ENV || 'unset' });
// (No noisy warning here to avoid extra log spam.)
if (envRawDatabasePath && envDatabasePath !== dbPath) {
    // silently accept fallback when environment can't be used; strict validations will still apply
}
let db: Database.Database;

// Quick disk-space check to detect full filesystem or read-only mounts causing SQLITE I/O errors
const checkDiskSpace = (dir: string) => {
    try {
        const out = execSync(`df -Pk ${dir}`, { encoding: 'utf8' });
        const lines = out.trim().split('\n');
        if (lines.length >= 2) {
            const parts = lines[1].trim().split(/\s+/);
            const availKb = parseInt(parts[3], 10);
            if (!isNaN(availKb) && availKb < 1024) {
                logger.error('Low disk space on DB filesystem', { dir, avail_kb: availKb });
                try { eventLogger.logEvent('DB_DISK_SPACE_LOW', { dir, avail_kb: availKb }); } catch (e) { logger.warn('Failed to emit DB_DISK_SPACE_LOW event', { err: String(e) }); }
                throw new Error(`Insufficient disk space (${availKb} KB) for database operations at ${dir}`);
            }
        }
    } catch (e) {
        // Don't fail startup just because df couldn't run; warn and continue. Many environments restrict child_process.
        logger.warn('checkDiskSpace: could not determine free space', { dir, err: String(e) });
    }
};

try {
    // Opening DB. (Minimal info logged; skip noisy debug details)
    try {
        const selStats = fs.statSync(dbPath);
        // silent path stat (no debug logging)
    } catch (_) {
        // No-op; avoid excessive detail in logs.
    }
    checkDiskSpace(DB_DIR);
    checkDiskSpace(DB_DIR);
    // Verify the directory exists and is writable by the running process/user before opening
    try {
        fs.accessSync(DB_DIR, fs.constants.W_OK | fs.constants.X_OK);
    } catch (accessErr: any) {
        // console.warn('db.server: DB_DIR not writable or lacks execute permission (needed to access files):', DB_DIR, 'accessErr:', accessErr && accessErr.message);
        logger.warn('DB_DIR not writable or lacks execute permission', { dir: DB_DIR, error: accessErr && accessErr.message });
    }

    db = new Database(dbPath, {});
    try {
        // Ensure WAL journal mode for better concurrency (may error if disk I/O problems exist)
        try {
            db.pragma("journal_mode = WAL");
        } catch (pragmaErr: any) {
            logger.error('Failed to set DB pragma (possible disk I/O issue)', { dbPath, err: pragmaErr && pragmaErr.message });
            try { eventLogger.logEvent('DB_IO_ERROR', { dbPath, err: pragmaErr && (pragmaErr.message || String(pragmaErr)) }); } catch (e) { logger.warn('Failed to emit DB_IO_ERROR event', { err: String(e) }); }
            throw new Error(`Failed to initialize database journal mode. Underlying error: ${pragmaErr && pragmaErr.message}`);
        }
    } catch (err: any) {
        logger.error('Failed to open DB', { dbPath, dirExists: fs.existsSync(DB_DIR), dirPerms: (() => {
                try { return fs.statSync(DB_DIR).mode.toString(8); } catch { return 'n/a'; }
            })(), error: err && err.message });
        try { eventLogger.logEvent('DB_OPEN_FAILED', { dbPath, err: err && (err.message || String(err)) }); } catch (e) { logger.warn('Failed to emit DB_OPEN_FAILED event', { err: String(e) }); }
        // Enrich thrown error with more actionable guidance
        throw new Error(`Cannot open database ${dbPath}. Ensure the directory exists, is writable, and there is free space on the filesystem. Underlying error: ${err && err.message}`);
    }
} catch (err: any) {
    logger.error('Failed to open DB (outer)', { dbPath, dirExists: fs.existsSync(DB_DIR), dirPerms: (() => {
        try { return fs.statSync(DB_DIR).mode.toString(8); } catch { return 'n/a'; }
    })(), error: err && err.message });
    try { eventLogger.logEvent('DB_OPEN_FAILED', { dbPath, err: err && (err.message || String(err)) }); } catch (e) { logger.warn('Failed to emit DB_OPEN_FAILED event', { err: String(e) }); }
    throw new Error(`Cannot open database ${dbPath}. Ensure the directory exists, is writable, and there is free space on the filesystem. Underlying error: ${err && err.message}`);
}

export { db };
    

// Provide a small health-check function to allow startup verification and runtime checks.
export type DBHealth = {
    ok: boolean;
    path: string;
    exists: boolean;
    readable: boolean;
    writable: boolean;
    dbOpen: boolean;
    testRead: boolean;
    testWrite: boolean;
    error?: string;
}

export function getDBHealth(): DBHealth {
    const health: DBHealth = {
        ok: false,
        path: DB_PATH,
        exists: false,
        readable: false,
        writable: false,
        dbOpen: false,
        testRead: false,
        testWrite: false
    };
    try {
        health.exists = fs.existsSync(DB_PATH);
        try { fs.accessSync(DB_PATH, fs.constants.R_OK); health.readable = true; } catch {}
        try { fs.accessSync(DB_PATH, fs.constants.W_OK); health.writable = true; } catch {}

        // Attempt to run a simple read
        try {
            const data = db.prepare<[], { v: 1 }>('SELECT 1 as v').get();
            health.dbOpen = true;
            health.testRead = (!!data && data.v === 1);
        } catch (err: any) {
            health.dbOpen = false;
            health.testRead = false;
            health.error = (err && err.message) || String(err);
        }

        // Attempt to perform a transient write using a temporary object and rollback to avoid persistent changes
        if (health.dbOpen) {
            try {
                db.exec("SAVEPOINT health_check; CREATE TEMP TABLE IF NOT EXISTS temp_health_check (v INTEGER); INSERT INTO temp_health_check (v) VALUES (1); ROLLBACK TO health_check; RELEASE health_check;");
                health.testWrite = true;
            } catch (err: any) {
                health.testWrite = false;
                health.error = health.error ? health.error + ' ; ' + err.message : err.message;
            }
        }

        health.ok = health.dbOpen && health.testRead;
        return health;
    } catch (err: any) {
        health.error = (err && err.message) || String(err);
        health.ok = false;
        return health;
    }
}

// Run startup verification and log concise messages so operators can detect DB issues quickly.
const health = getDBHealth();
if (!health.ok) {
    console.warn('db.server: Database health check failed:', health);
    try { eventLogger.logEvent('DB_HEALTH_FAIL', health); } catch (e) { logger.warn('Failed to emit DB_HEALTH_FAIL event', { err: String(e) }); }
    if (process.env.NODE_ENV === 'production') {
        // Quietly fail -- throwing here would crash systemd-based services if undesired. We warn instead.
    }
} else if (process.env.NODE_ENV !== 'production') {
    // console.log('db.server: Database check OK @', DB_PATH);
    logger.info('Database check OK', { DB_PATH });
    try { eventLogger.logEvent('DB_HEALTH_OK', { DB_PATH, testRead: health.testRead, testWrite: health.testWrite }); } catch (e) { logger.warn('Failed to emit DB_HEALTH_OK event', { err: String(e) }); }
}

function hasValue(element: string) {
    return element !== "__N/A__" && element !== "";
};
// value ? parser(value) : fallback
function withFallback<Type>(value: string, fallback: Type, parser?: (value: string) => Type) {
    if (value === "__N/A__") return fallback;
    return parser ? parser(value) : value as Type;
};
function handleImport<Type extends Facility | Vendor | Staff>(object: Type, original: Type, has_duplicate: boolean, mode: string, user: string) {
    switch (mode) {
        case "add":
            object.importInsertNewDatabaseEntry(user);
            break;
        case "ukg_special":
        case "add_update":
            if (has_duplicate) {
                object.importUpdateOldDatabaseEntry(user, original); // object and original should always be the same type
            }else {
                object.importInsertNewDatabaseEntry(user);
            }
            break;
        case "update":
            if (has_duplicate) {
                object.importUpdateOldDatabaseEntry(user, original); // object and original should always be the same type
            }
            break;
        default:
            break;
    }
};
export function dbRunAsTransaction<Type>(to_run: () => Type): Type {
    return db.transaction(to_run)();
};
function getByTableAndId(table: string, id: number) {
    switch (table) {
        case "facility":
            return Facility.getById(id);
        case "vendors":
            return Vendor.getById(id);
        case "staff":
            return Staff.getById(id);
        case "users":
            return User.getById(id);
        case "announcements":
            return Announcement.getById(id);
        case "isp":
            return ISP.getById(id);
    }
};


export interface FacilityImportMaps {
    facilitiesById: Map<number, Facility>;
    facilitiesByAbbreviation: Map<string, Facility>;
    facilitiesByName: Map<string, Facility>;
    vendorIdsByName: Map<string, number>;
}
export interface FacilityExportMaps {
    vendorsById: Map<number, Vendor>;
    staffById: Map<number, Staff>;
}
interface FacilityCSVRow {
    id: number,
    state: string,
    name: string,
    abbreviation: string,
    phone: string,
    fax: string,
    population: string,
    google_map_link: string,
    address: string,
    domain: string,
    jms_id: number,
    ehr_id: number,
    admin_phones_id: number,
    inmate_phones_id: number,
    cable_tv_id: number,
    mps_id: number,
    inmate_type: string,
    regional_warden_id: number,
    warden_id: number,
    assistant_warden_id: number,
    business_manager_id: number,
    hr_manager_id: number,
    chief_of_security_id: number,
    maintenance_supervisor_id: number,
    health_services_admin_id: number,
    director_of_nursing_id: number,
    hotel_1: string,
    hotel_1_link: string,
    hotel_2: string,
    hotel_2_link: string,
    hotel_3: string,
    hotel_3_link: string,
    hotel_4: string,
    hotel_4_link: string,
    notes: string,
    map_x: number,
    map_y: number,
    vendors: string,
    latitude: number,
    longitude: number,
    ukg_codes: string,
    active: boolean,
    date_deleted: number,
    date_deleted_string: string,
    map_layer_order: string,
}
export interface FacilityDataObject {
    id: number,
    state: string,
    name: string,
    abbreviation: string,
    phone: string,
    fax: string,
    population: string,
    google_map_link: string,
    address: string,
    domain: string,
    jms_id: number,
    ehr_id: number,
    admin_phones_id: number,
    inmate_phones_id: number,
    cable_tv_id: number,
    mps_id: number,
    inmate_type: string,
    regional_warden_id: number,
    warden_id: number,
    assistant_warden_id: number,
    business_manager_id: number,
    hr_manager_id: number,
    chief_of_security_id: number,
    maintenance_supervisor_id: number,
    health_services_admin_id: number,
    director_of_nursing_id: number,
    hotel_1: string,
    hotel_1_link: string,
    hotel_2: string,
    hotel_2_link: string,
    hotel_3: string,
    hotel_3_link: string,
    hotel_4: string,
    hotel_4_link: string,
    notes: string,
    map_x: number,
    map_y: number,
    vendors: number[],
    latitude: number,
    longitude: number,
    ukg_codes: string[],
    active: boolean,
    date_deleted: number,
    date_deleted_string: string,
    map_layer_order: string,
}
export class Facility {
    id: number;
    state: string;
    name: string;
    abbreviation: string;
    phone: string;
    fax: string;
    population: string;
    google_map_link: string;
    address: string;
    domain: string;
    jms_id: number;
    ehr_id: number;
    admin_phones_id: number;
    inmate_phones_id: number;
    cable_tv_id: number;
    mps_id: number;
    inmate_type: string;
    regional_warden_id: number;
    warden_id: number;
    assistant_warden_id: number;
    business_manager_id: number;
    hr_manager_id: number;
    chief_of_security_id: number;
    maintenance_supervisor_id: number;
    health_services_admin_id: number;
    director_of_nursing_id: number;
    hotel_1: string;
    hotel_1_link: string;
    hotel_2: string;
    hotel_2_link: string;
    hotel_3: string;
    hotel_3_link: string;
    hotel_4: string;
    hotel_4_link: string;
    notes: string;
    map_x: number;
    map_y: number;
    vendors: number[];
    latitude: number;
    longitude: number;
    is_facility: true;
    active: boolean;
    ukg_codes: string[];
    date_deleted: number;
    date_deleted_string: string;
    map_layer_order: string;

    website?: string; // for (Facility | Vendor)

    constructor(data: FacilityDataObject) {
        this.id = data.id;
        this.state = data.state;
        this.name = data.name;
        this.abbreviation = data.abbreviation;
        this.phone = data.phone;
        this.fax = data.fax;
        this.population = data.population;
        this.google_map_link = data.google_map_link;
        this.address = data.address;
        this.domain = data.domain;
        this.jms_id = data.jms_id;
        this.ehr_id = data.ehr_id;
        this.admin_phones_id = data.admin_phones_id;
        this.inmate_phones_id = data.inmate_phones_id;
        this.cable_tv_id = data.cable_tv_id;
        this.mps_id = data.mps_id;
        this.inmate_type = data.inmate_type;
        this.regional_warden_id = data.regional_warden_id;
        this.warden_id = data.warden_id;
        this.assistant_warden_id = data.assistant_warden_id;
        this.business_manager_id = data.business_manager_id;
        this.hr_manager_id = data.hr_manager_id;
        this.chief_of_security_id = data.chief_of_security_id;
        this.maintenance_supervisor_id = data.maintenance_supervisor_id;
        this.health_services_admin_id = data.health_services_admin_id;
        this.director_of_nursing_id = data.director_of_nursing_id;
        this.hotel_1 = data.hotel_1;
        this.hotel_1_link = data.hotel_1_link;
        this.hotel_2 = data.hotel_2;
        this.hotel_2_link = data.hotel_2_link;
        this.hotel_3 = data.hotel_3;
        this.hotel_3_link = data.hotel_3_link;
        this.hotel_4 = data.hotel_4;
        this.hotel_4_link = data.hotel_4_link;
        this.notes = data.notes;
        this.map_x = data.map_x;
        this.map_y = data.map_y;
        this.vendors = data.vendors;
        this.latitude = data.latitude;
        this.longitude = data.longitude;
        this.is_facility = true;
        this.ukg_codes = data.ukg_codes;
        this.active = data.active;
        this.date_deleted = data.date_deleted;
        this.date_deleted_string = data.date_deleted_string;
        this.map_layer_order = data.map_layer_order;
    }
    static readonly CSV_Columns = Object.freeze({
        Active: 0,
        Name: 1,
        Abbreviation: 2,
        UKG_Codes: 3,
        State: 4,
        Address: 5,
        Phone: 6,
        Fax: 7,
        Regional_Warden: 8,
        Warden: 9,
        Assistant_Warden: 10,
        Business_Manager: 11,
        HR_Manager: 12,
        Chief_Of_Security: 13,
        Maintenance_Supervisor: 14,
        Health_Services_Admin: 15,
        Director_Of_Nursing: 16,
        Domain: 17,
        JMS: 18,
        EHR: 19,
        Admin_Phone: 20,
        Inmate_Phone: 21,
        Cable_TV: 22,
        MPS: 23,
        Population: 24,
        Inmate_Type: 25,
        Notes: 26,
        Vendors: 27,
        Hotel1: 28,
        Hotel1Link: 29,
        Hotel2: 30,
        Hotel2Link: 31,
        Hotel3: 32,
        Hotel3Link: 33,
        Hotel4: 34,
        Hotel4Link: 35,
        Latitude: 36,
        Longitude: 37,
        Database_Id: 38,
        Vendor_Database_Ids: 39,
        Map_X: 40,
        Map_Y: 41,
        Google_Maps_Link: 42,
        Total_Column_Count: 43
    });
    static readonly SQLGet_BaseFields = "SELECT id,state,name,abbreviation,phone,fax,population,google_map_link,address,domain,jms_id,ehr_id,admin_phones_id,inmate_phones_id,cable_tv_id,mps_id,inmate_type,regional_warden_id,warden_id,assistant_warden_id,business_manager_id,hr_manager_id,chief_of_security_id,maintenance_supervisor_id,health_services_admin_id,director_of_nursing_id,hotel_1,hotel_1_link,hotel_2,hotel_2_link,hotel_3,hotel_3_link,hotel_4,hotel_4_link,notes,map_x,map_y,vendors,latitude,longitude,active,ukg_codes,date_deleted,date_deleted_string,map_layer_order FROM location";

    getFieldsModified(data: FacilityDataObject): string {
        let modified = "";
        if (data.name !== this.name) {
            modified += ", Name";
        }
        if (data.address !== this.address) {
            modified += ", Add.";
        }
        if (data.phone !== this.phone) {
            modified += ", Phone";
        }
        if (data.fax !== this.fax) {
            modified += ", Fax";
        }
        if (data.jms_id !== this.jms_id) {
            modified += ", JMS";
        }
        if (data.ehr_id !== this.ehr_id) {
            modified += ", EHR";
        }
        if (data.admin_phones_id !== this.admin_phones_id) {
            modified += ", Admin Phone";
        }
        if (data.inmate_phones_id !== this.inmate_phones_id) {
            modified += ", Inmate Phone";
        }
        if (data.cable_tv_id !== this.cable_tv_id) {
            modified += ", Cable TV";
        }
        if (data.mps_id !== this.mps_id) {
            modified += ", MPS";
        }
        if (data.domain !== this.domain) {
            modified += ", Domain";
        }
        if (data.population !== this.population) {
            modified += ", Pop.";
        }
        if (data.inmate_type !== this.inmate_type) {
            modified += ", Inmate";
        }
        if (data.regional_warden_id !== this.regional_warden_id) {
            modified += ", Regional Warden";
        }
        if (data.warden_id !== this.warden_id) {
            modified += ", Warden";
        }
        if (data.assistant_warden_id !== this.assistant_warden_id) {
            modified += ", Asst. Warden";
        }
        if (data.business_manager_id !== this.business_manager_id) {
            modified += ", Bus. Manager";
        }
        if (data.hr_manager_id !== this.hr_manager_id) {
            modified += ", HR Manager";
        }
        if (data.chief_of_security_id !== this.chief_of_security_id) {
            modified += ", Chief of Sec.";
        }
        if (data.maintenance_supervisor_id !== this.maintenance_supervisor_id) {
            modified += ", Maint. Suprv.";
        }
        if (data.health_services_admin_id !== this.health_services_admin_id) {
            modified += ", HSA";
        }
        if (data.director_of_nursing_id !== this.director_of_nursing_id) {
            modified += ", DOR";
        }
        if (data.hotel_1 !== this.hotel_1) {
            modified += ", Hotel";
        }
        if (data.hotel_1_link !== this.hotel_1_link) {
            modified += ", Hotel Link";
        }
        if (data.hotel_2 !== this.hotel_2) {
            modified += ", Hotel";
        }
        if (data.hotel_2_link !== this.hotel_2_link) {
            modified += ", Hotel Link";
        }
        if (data.hotel_3 !== this.hotel_3) {
            modified += ", Hotel";
        }
        if (data.hotel_3_link !== this.hotel_3_link) {
            modified += ", Hotel Link";
        }
        if (data.hotel_4 !== this.hotel_4) {
            modified += ", Hotel";
        }
        if (data.hotel_4_link !== this.hotel_4_link) {
            modified += ", Hotel Link";
        }
        if (data.notes !== this.notes) {
            modified += ", Notes";
        }
        if (data.map_x !== this.map_x) {
            modified += ", Map X";
        }
        if (data.map_y !== this.map_y) {
            modified += ", Map Y";
        }
        if (data.state !== this.state) {
            modified += ", State";
        }
        if (data.google_map_link !== this.google_map_link) {
            modified += ", Google Maps";
        }
        if (data.abbreviation !== this.abbreviation) {
            modified += ", Abbrev.";
        }
        if (data.latitude !== this.latitude) {
            modified += ", Latitude";
        }
        if (data.longitude !== this.longitude) {
            modified += ", Longitude";
        }
        if (data.ukg_codes !== this.ukg_codes) {
            modified += ", UKG Codes";
        }
        if (data.active !== this.active) {
            modified += ", Active";
        }
        if (data.date_deleted !== this.date_deleted || data.date_deleted_string !== this.date_deleted_string) {
            modified += ", Date Deleted";
        }
        if (data.map_layer_order !== this.map_layer_order) {
            modified += ", Map Layer Order";
        }
    
        if (modified === "") {
            return "None";
        }
        return modified.slice(2);
    };

    static AddToDatabaseQuery = db.prepare("INSERT INTO location (active, state, name, abbreviation, phone, fax, population, google_map_link, address, domain, jms_id, ehr_id, admin_phones_id, inmate_phones_id, cable_tv_id, mps_id, inmate_type, regional_warden_id, warden_id, assistant_warden_id, business_manager_id, hr_manager_id, chief_of_security_id, maintenance_supervisor_id, health_services_admin_id, director_of_nursing_id, hotel_1, hotel_1_link, hotel_2, hotel_2_link, hotel_3, hotel_3_link, hotel_4, hotel_4_link, notes, map_x, map_y, vendors, latitude, longitude, ukg_codes, date_deleted, date_deleted_string, map_layer_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    addToDatabase(admin_username: string, is_import: boolean = false): number {
        const result = Facility.AddToDatabaseQuery.run(
            this.active ? 1 : 0,
            this.state,
            this.name,
            this.abbreviation,
            this.phone,
            this.fax,
            this.population,
            this.google_map_link,
            this.address,
            this.domain,
            this.jms_id,
            this.ehr_id,
            this.admin_phones_id,
            this.inmate_phones_id,
            this.cable_tv_id,
            this.mps_id,
            this.inmate_type,
            this.regional_warden_id,
            this.warden_id,
            this.assistant_warden_id,
            this.business_manager_id,
            this.hr_manager_id,
            this.chief_of_security_id,
            this.maintenance_supervisor_id,
            this.health_services_admin_id,
            this.director_of_nursing_id,
            this.hotel_1,
            this.hotel_1_link,
            this.hotel_2,
            this.hotel_2_link,
            this.hotel_3,
            this.hotel_3_link,
            this.hotel_4,
            this.hotel_4_link,
            encryptFieldValue(this.notes),
            this.map_x,
            this.map_y,
            this.vendors.join(","),
            this.latitude,
            this.longitude,
            this.ukg_codes.join(","),
            this.date_deleted,
            this.date_deleted_string,
            this.map_layer_order,
        );
        this.id = Number(result.lastInsertRowid);
        updateCache_AddEntry_Facility(this);
        (is_import ? ImportActivityLog : ActivityLog).record(admin_username, "Create", "facility", this.id, this.name, "All");
        return this.id;
    };
    static UpdateDatabaseEntryQuery = db.prepare("UPDATE location SET state = ?, name = ?, abbreviation = ?, phone = ?, fax = ?, population = ?, google_map_link = ?, address = ?, domain = ?, jms_id = ?, ehr_id = ?, admin_phones_id = ?, inmate_phones_id = ?, cable_tv_id = ?, mps_id = ?, inmate_type = ?, regional_warden_id = ?, warden_id = ?, assistant_warden_id = ?, business_manager_id = ?, hr_manager_id = ?, chief_of_security_id = ?, maintenance_supervisor_id = ?, health_services_admin_id = ?, director_of_nursing_id = ?, hotel_1 = ?, hotel_1_link = ?, hotel_2 = ?, hotel_2_link = ?, hotel_3 = ?, hotel_3_link = ?, hotel_4 = ?, hotel_4_link = ?, notes = ?, map_x = ?, map_y = ?, vendors = ?, latitude = ?, longitude = ?, ukg_codes = ?, active = ?, date_deleted = ?, date_deleted_string = ?, map_layer_order = ? WHERE id = ?");
    updateDatabaseEntry(admin_username: string, data: FacilityDataObject, is_import: boolean = false): void {
        const fields_modified = this.getFieldsModified(data);
        if (fields_modified !== "None") {
            (is_import ? ImportActivityLog : ActivityLog).record(admin_username, "Edit", "facility", this.id, this.name, fields_modified);
            Facility.UpdateDatabaseEntryQuery.run(
                data.state,
                data.name,
                data.abbreviation,
                data.phone,
                data.fax,
                data.population,
                data.google_map_link,
                data.address,
                data.domain,
                data.jms_id,
                data.ehr_id,
                data.admin_phones_id,
                data.inmate_phones_id,
                data.cable_tv_id,
                data.mps_id,
                data.inmate_type,
                data.regional_warden_id,
                data.warden_id,
                data.assistant_warden_id,
                data.business_manager_id, 
                data.hr_manager_id,
                data.chief_of_security_id,
                data.maintenance_supervisor_id,
                data.health_services_admin_id,
                data.director_of_nursing_id,
                data.hotel_1,
                data.hotel_1_link,
                data.hotel_2,
                data.hotel_2_link,
                data.hotel_3,
                data.hotel_3_link,
                data.hotel_4,
                data.hotel_4_link,
                encryptFieldValue(data.notes),
                data.map_x,
                data.map_y,
                data.vendors.join(","),
                data.latitude,
                data.longitude,
                data.ukg_codes.join(","),
                data.active ? 1 : 0,
                data.date_deleted,
                data.date_deleted_string,
                data.map_layer_order,
                this.id
            );
            updateCache_UpdateEntry_Facility(data);
        }
    };
    static DatabaseEntrySetActiveQuery = db.prepare("UPDATE location SET active = ?, date_deleted = ?, date_deleted_string = ? WHERE id = ?");
    databaseEntrySetActive(
        admin_username: string,
        active: boolean
    ): void {
        const date_deleted = getTimeMS();
        const date_deleted_string = toReadableFullDateString(date_deleted);
        Facility.DatabaseEntrySetActiveQuery.run(active ? 1 : 0, date_deleted, date_deleted_string, this.id);
        updateCache_SetActive_Facility(this.id, active, date_deleted, date_deleted_string);
        ActivityLog.record(admin_username, active ? "Restore" : "Delete", "facility", this.id, this.name, "Active, Date Deleted");
    };
    static DatabaseEntrySetVendorsQuery = db.prepare("UPDATE location SET vendors = ? WHERE id = ?");
    databaseEntrySetVendors(
        admin_username: string,
        vendor_name: string,
        is_adding_vendors: boolean,
        vendors: number[]
    ): void {
        Facility.DatabaseEntrySetVendorsQuery.run(vendors.join(","), this.id);
        updateCache_SetVendors_Facility(this.id, vendors);
        const action = is_adding_vendors ? "Add Vendor" : "Remove Vendor";
        ActivityLog.record(admin_username, action, "facility", this.id, this.name, vendor_name);
    };
    static fromSQLData(data: FacilityCSVRow): Facility {
        if (!data) {
            return Facility.errorCode();
        }
        return new Facility({
            id: data.id,
            state: data.state,
            name: data.name,
            abbreviation: data.abbreviation,
            phone: data.phone,
            fax: data.fax,
            population: data.population,
            google_map_link: data.google_map_link,
            address: data.address,
            domain: data.domain,
            jms_id: data.jms_id,
            ehr_id: data.ehr_id,
            admin_phones_id: data.admin_phones_id,
            inmate_phones_id: data.inmate_phones_id,
            cable_tv_id: data.cable_tv_id,
            mps_id: data.mps_id,
            inmate_type: data.inmate_type,
            regional_warden_id: data.regional_warden_id,
            warden_id: data.warden_id,
            assistant_warden_id: data.assistant_warden_id,
            business_manager_id: data.business_manager_id,
            hr_manager_id: data.hr_manager_id,
            chief_of_security_id: data.chief_of_security_id,
            maintenance_supervisor_id: data.maintenance_supervisor_id,
            health_services_admin_id: data.health_services_admin_id,
            director_of_nursing_id: data.director_of_nursing_id,
            hotel_1: data.hotel_1,
            hotel_1_link: data.hotel_1_link,
            hotel_2: data.hotel_2,
            hotel_2_link: data.hotel_2_link,
            hotel_3: data.hotel_3,
            hotel_3_link: data.hotel_3_link,
            hotel_4: data.hotel_4,
            hotel_4_link: data.hotel_4_link,
            notes: (decryptFieldValueMaybe(data.notes) || ''),
            map_x: data.map_x,
            map_y: data.map_y,
            vendors: data.vendors ? data.vendors.split(",").map((a) => Number(a)) : [],
            latitude: data.latitude,
            longitude: data.longitude,
            ukg_codes: data.ukg_codes ? data.ukg_codes.split(",") : [],
            active: data.active,
            date_deleted: data.date_deleted,
            date_deleted_string: data.date_deleted_string,
            map_layer_order: data.map_layer_order,
        });
    };

    static GetAllQuery = db.prepare<[], FacilityCSVRow>(Facility.SQLGet_BaseFields);
    static getAll_NoCache(): Facility[] {
        const rows: FacilityCSVRow[] = Facility.GetAllQuery.all();

        return rows.map(Facility.fromSQLData);
    }
    static getAll(allow_inactive: boolean = false): Facility[] {
        return (allow_inactive ? getCache_AllFacilities() : getCache_AllActiveFacilities()) ?? [];
    }
    static getAllInactive(): Facility[] {
        return getCache_AllFacilities().filter((a) => !a.active);
    }
    
    static getById(id: number, allow_inactive: boolean = true): Facility {
        const facility = getCache_FacilityById(id);
        if (!allow_inactive && facility && facility.active === false) return Facility.errorCode();
        return facility ?? Facility.errorCode();
    }

    // Almost always you want getById.id !== -1 for fewer cache requests
    static isValidId(id: number, allow_inactive: boolean = false): boolean {
        try {
            const sanitized = sanitize.toInt(id);
            return Boolean(Facility.getById(sanitized, allow_inactive).id !== -1);
        } catch {
            return false;
        }
    }

    static getCSVHeaderFromColumn(column: number): string {
        switch (column) {
            case Facility.CSV_Columns.Active:
                return "Active";
            case Facility.CSV_Columns.Name:
                return "Name";
            case Facility.CSV_Columns.Abbreviation:
                return "Abbreviation";
            case Facility.CSV_Columns.UKG_Codes:
                return "UKG Codes";
            case Facility.CSV_Columns.State:
                return "State";
            case Facility.CSV_Columns.Address:
                return "Address";
            case Facility.CSV_Columns.Phone:
                return "Phone";
            case Facility.CSV_Columns.Fax:
                return "Fax";
            case Facility.CSV_Columns.Regional_Warden:
                return "Regional Warden";
            case Facility.CSV_Columns.Warden:
                return "Warden";
            case Facility.CSV_Columns.Assistant_Warden:
                return "Assistant Warden";
            case Facility.CSV_Columns.Business_Manager:
                return "Business Manager";
            case Facility.CSV_Columns.HR_Manager:
                return "HR Manager";
            case Facility.CSV_Columns.Chief_Of_Security:
                return "Chief of Security";
            case Facility.CSV_Columns.Maintenance_Supervisor:
                return "Maintenance Supervisor";
            case Facility.CSV_Columns.Health_Services_Admin:
                return "Health Services Admin";
            case Facility.CSV_Columns.Director_Of_Nursing:
                return "Director of Nursing";
            case Facility.CSV_Columns.HR_Manager:
                return "HR Manager";
            case Facility.CSV_Columns.Chief_Of_Security:
                return "Chief of Security";
            case Facility.CSV_Columns.Maintenance_Supervisor:
                return "Maintenance Supervisor";
            case Facility.CSV_Columns.Health_Services_Admin:
                return "Health Services Admin";
            case Facility.CSV_Columns.Director_Of_Nursing:
                return "Director of Nursing";
            case Facility.CSV_Columns.Hotel1:
                return "Hotel 1";
            case Facility.CSV_Columns.Hotel1Link:
                return "Hotel 1 Link";
            case Facility.CSV_Columns.Hotel2:
                return "Hotel 2";
            case Facility.CSV_Columns.Hotel2Link:
                return "Hotel 2 Link";
            case Facility.CSV_Columns.Hotel3:
                return "Hotel 3";
            case Facility.CSV_Columns.Hotel3Link:
                return "Hotel 3 Link";
            case Facility.CSV_Columns.Hotel4:
                return "Hotel 4";
            case Facility.CSV_Columns.Hotel4Link:
                return "Hotel 4 Link";
            case Facility.CSV_Columns.Domain:
                return "Domain";
            case Facility.CSV_Columns.JMS:
                return "JMS";
            case Facility.CSV_Columns.EHR:
                return "EHR";
            case Facility.CSV_Columns.Admin_Phone:
                return "Admin Phones";
            case Facility.CSV_Columns.Inmate_Phone:
                return "Inmate Phones";
            case Facility.CSV_Columns.Cable_TV:
                return "Cable TV";
            case Facility.CSV_Columns.MPS:
                return "MPS";
            case Facility.CSV_Columns.Population:
                return "Population";
            case Facility.CSV_Columns.Inmate_Type:
                return "Inmate Type";
            case Facility.CSV_Columns.Notes:
                return "Notes";
            case Facility.CSV_Columns.Vendors:
                return "Vendors";
            case Facility.CSV_Columns.Latitude:
                return "Latitude";
            case Facility.CSV_Columns.Longitude:
                return "Longitude";
            case Facility.CSV_Columns.Database_Id:
                return "Database Id";
            case Facility.CSV_Columns.Vendor_Database_Ids:
                return "Vendor Database Ids";
            case Facility.CSV_Columns.Map_X:
                return "Map X";
            case Facility.CSV_Columns.Map_Y:
                return "Map Y";
            case Facility.CSV_Columns.Google_Maps_Link:
                return "Google Maps Link";
            default:
                return "Unknown Column";
        }
    }

    static getCSVHeaders(): string {
        return Array.from(Array(Facility.CSV_Columns.Total_Column_Count), (x, i) => i).map((a) => Facility.getCSVHeaderFromColumn(a)).join(",")+"\r\n";
    }

    toCSV(maps: FacilityExportMaps): string {
        if (this.id === -1) return "";
        const fields: string[] = [
            this.active ? "TRUE" : "FALSE",
            this.name,
            this.abbreviation,
            this.ukg_codes.join(","),
            this.state,
            this.address,
            this.phone,
            this.fax,
            maps.staffById.get(this.regional_warden_id)?.name ?? "",
            maps.staffById.get(this.warden_id)?.name ?? "",
            maps.staffById.get(this.assistant_warden_id)?.name ?? "",
            maps.staffById.get(this.business_manager_id)?.name ?? "",
            maps.staffById.get(this.hr_manager_id)?.name ?? "",
            maps.staffById.get(this.chief_of_security_id)?.name ?? "",
            maps.staffById.get(this.maintenance_supervisor_id)?.name ?? "",
            maps.staffById.get(this.health_services_admin_id)?.name ?? "",
            maps.staffById.get(this.director_of_nursing_id)?.name ?? "",
            this.domain,
            maps.vendorsById.get(this.jms_id)?.name ?? "",
            maps.vendorsById.get(this.ehr_id)?.name ?? "",
            maps.vendorsById.get(this.admin_phones_id)?.name ?? "",
            maps.vendorsById.get(this.inmate_phones_id)?.name ?? "",
            maps.vendorsById.get(this.cable_tv_id)?.name ?? "",
            maps.vendorsById.get(this.mps_id)?.name ?? "",
            this.hotel_1,
            this.hotel_1_link,
            this.hotel_2,
            this.hotel_2_link,
            this.hotel_3,
            this.hotel_3_link,
            this.hotel_4,
            this.hotel_4_link,
            this.population,
            this.inmate_type,
            this.notes,
            this.vendors.map((a) => maps.vendorsById.get(a)?.name ?? "").join(","),
            this.latitude.toString(),
            this.longitude.toString(),
            this.id.toString(),
            this.vendors.join(","),
            this.map_x.toString(),
            this.map_y.toString(),
            this.google_map_link
        ];
        return fields.map((a) => `"${quoted_csv_sanitize(a)}"`).join(",")+"\r\n";
    }

    static loadFromCSV(line: string[], mode: string, user: string, maps: FacilityImportMaps): void {
        const sline = line.map((v) => sanitize.toString(v));
        // Notes encrypted by addToDatabase and updateDatabaseEntry

        // Locate original
        let original: (Facility | null) = null;
        if (mode !== "add") {
            if (original === null && hasValue(sline[Facility.CSV_Columns.Database_Id])) { // Database Id
                original = maps.facilitiesById.get(Number(sline[Facility.CSV_Columns.Database_Id])) ?? null;
            }
            if (original === null && hasValue(sline[Facility.CSV_Columns.Abbreviation])) { // Abbreviaton
                original = maps.facilitiesByAbbreviation.get(sline[Facility.CSV_Columns.Abbreviation].toLowerCase()) ?? null;
            }
            if (original === null && hasValue(sline[Facility.CSV_Columns.Name])) { // Name
                original = maps.facilitiesByName.get(sline[Facility.CSV_Columns.Name].toLowerCase()) ?? null;
            }
        }
        if (original === null) {
            original = Facility.errorCode();
        }
        const vendors: number[] = withFallback(sline[Facility.CSV_Columns.Vendor_Database_Ids], undefined, (a) => a.split(",").map((b) => Number(b.trim())))
            ?? withFallback(sline[Facility.CSV_Columns.Vendors], original.vendors, (a) => a.split(",").map((b) => maps.vendorIdsByName.get(b.trim()) ?? null).filter((b) => b !== null));
        // Build new
        const updated: Facility = new Facility({
            id:                     withFallback(sline[Facility.CSV_Columns.Database_Id], original.id, Number), //                              Id
            state:                  withFallback(sline[Facility.CSV_Columns.State], original.state), //                                         State
            name:                   withFallback(sline[Facility.CSV_Columns.Name], original.name), //                                           Name
            abbreviation:           withFallback(sline[Facility.CSV_Columns.Abbreviation], original.abbreviation, (a) => a.toUpperCase()), //   Abbreviation
            phone:                  parsePhoneToStandard(withFallback(sline[Facility.CSV_Columns.Phone], original.phone)).result, //            Phone
            fax:                    withFallback(sline[Facility.CSV_Columns.Fax], original.fax), //                                             Fax
            population:             withFallback(sline[Facility.CSV_Columns.Population], original.population), //                               Population
            google_map_link:        withFallback(sline[Facility.CSV_Columns.Google_Maps_Link], original.google_map_link), //                    Google Maps Link
            address:                withFallback(sline[Facility.CSV_Columns.Address], original.address), //                                     Address
            domain:                 withFallback(sline[Facility.CSV_Columns.Domain], original.domain), //                                       Domain
            jms_id:                 withFallback(sline[Facility.CSV_Columns.JMS], original.jms_id), //                                          JMS
            ehr_id:                 withFallback(sline[Facility.CSV_Columns.EHR], original.ehr_id), //                                          EHR
            admin_phones_id:        withFallback(sline[Facility.CSV_Columns.Admin_Phone], original.admin_phones_id), //                         Admin. Phones
            inmate_phones_id:       withFallback(sline[Facility.CSV_Columns.Inmate_Phone], original.inmate_phones_id), //                       Inmate Phones
            cable_tv_id:            withFallback(sline[Facility.CSV_Columns.Cable_TV], original.cable_tv_id), //                                Cable TV
            mps_id:                 withFallback(sline[Facility.CSV_Columns.MPS], original.mps_id), //                                          MPS
            inmate_type:            withFallback(sline[Facility.CSV_Columns.Inmate_Type], original.inmate_type), //                             Type
            regional_warden_id:     withFallback(sline[Facility.CSV_Columns.Regional_Warden], original.regional_warden_id), //                  Regional Warden
            warden_id:              withFallback(sline[Facility.CSV_Columns.Warden], original.warden_id), //                                    Warden
            assistant_warden_id:    withFallback(sline[Facility.CSV_Columns.Assistant_Warden], original.assistant_warden_id), //                Asst. Warden
            business_manager_id:    withFallback(sline[Facility.CSV_Columns.Business_Manager], original.business_manager_id), //                Business Manager
            hr_manager_id:          withFallback(sline[Facility.CSV_Columns.HR_Manager], original.hr_manager_id), //                            HR Manager
            chief_of_security_id:   withFallback(sline[Facility.CSV_Columns.Chief_Of_Security], original.chief_of_security_id), //              Chief of Security
            maintenance_supervisor_id:withFallback(sline[Facility.CSV_Columns.Maintenance_Supervisor], original.maintenance_supervisor_id), //  Maintenance Supervisor
            health_services_admin_id:withFallback(sline[Facility.CSV_Columns.Health_Services_Admin], original.health_services_admin_id), //     Health Services Admin
            director_of_nursing_id: withFallback(sline[Facility.CSV_Columns.Director_Of_Nursing], original.director_of_nursing_id), //          Director of Nursing
            hotel_1:                withFallback(sline[Facility.CSV_Columns.Hotel1], original.hotel_1), //                                      Hotel 1
            hotel_1_link:           withFallback(sline[Facility.CSV_Columns.Hotel1Link], original.hotel_1_link), //                             Hotel 1 Link
            hotel_2:                withFallback(sline[Facility.CSV_Columns.Hotel2], original.hotel_2), //                                      Hotel 2
            hotel_2_link:           withFallback(sline[Facility.CSV_Columns.Hotel2Link], original.hotel_2_link), //                             Hotel 2 Link
            hotel_3:                withFallback(sline[Facility.CSV_Columns.Hotel3], original.hotel_3), //                                      Hotel 3
            hotel_3_link:           withFallback(sline[Facility.CSV_Columns.Hotel3Link], original.hotel_3_link), //                             Hotel 3 Link
            hotel_4:                withFallback(sline[Facility.CSV_Columns.Hotel4], original.hotel_4), //                                      Hotel 4
            hotel_4_link:           withFallback(sline[Facility.CSV_Columns.Hotel4Link], original.hotel_4_link), //                             Hotel 4 Link
            notes:                  withFallback(sline[Facility.CSV_Columns.Notes], original.notes), //                                         Notes
            map_x:                  withFallback(sline[Facility.CSV_Columns.Map_X], original.map_x, Number), //                                 Map X
            map_y:                  withFallback(sline[Facility.CSV_Columns.Map_Y], original.map_y, Number), //                                 Map Y
            vendors:                vendors, //                                                                                                 Vendors
            latitude:               withFallback(sline[Facility.CSV_Columns.Latitude], original.latitude, Number), //                           Latitude
            longitude:              withFallback(sline[Facility.CSV_Columns.Longitude], original.longitude, Number), //                         Longitude
            ukg_codes:              withFallback(sline[Facility.CSV_Columns.UKG_Codes], original.ukg_codes, (a) => a.split(",").map((b) => b.trim().toUpperCase())), // Longitude
            active:                 withFallback(sline[Facility.CSV_Columns.Active], original.active, (a) => a.toLowerCase() === "true" ? true : false), // Active
            date_deleted:           original.date_deleted, //                                                                                   Date Deleted
            date_deleted_string:    original.date_deleted_string, //                                                                            Date Deleted String
            map_layer_order:        original.map_layer_order, //                                                                                Map Layer Order
        });
        // Process
        handleImport(updated, original, original.id !== -1, mode, user);
    }

    importInsertNewDatabaseEntry(user: string): void {
        this.addToDatabase(user, true);
    };
    importUpdateOldDatabaseEntry(user: string, original: Facility | Vendor | Staff): void {
        (original as Facility).updateDatabaseEntry(user, this, true);
    };

    static readonly ERROR = Object.freeze(new Facility({
        id: -1,
        state: "LA",
        name: "Facility Does Not Exist",
        abbreviation: "",
        phone: "",
        fax: "",
        population: "",
        google_map_link: "",
        address: "",
        domain: "",
        jms_id: -1,
        ehr_id: -1,
        admin_phones_id: -1,
        inmate_phones_id: -1,
        cable_tv_id: -1,
        mps_id: -1,
        inmate_type: "",
        regional_warden_id: -1,
        warden_id: -1,
        assistant_warden_id: -1,
        business_manager_id: -1,
        hr_manager_id: -1,
        chief_of_security_id: -1,
        maintenance_supervisor_id: -1,
        health_services_admin_id: -1,
        director_of_nursing_id: -1,
        hotel_1: "",
        hotel_1_link: "",
        hotel_2: "",
        hotel_2_link: "",
        hotel_3: "",
        hotel_3_link: "",
        hotel_4: "",
        hotel_4_link: "",
        notes: "",
        map_x: -1,
        map_y: -1,
        vendors: [],
        latitude: -1,
        longitude: -1,
        ukg_codes: [],
        active: true,
        date_deleted: 0,
        date_deleted_string: "",
        map_layer_order: "",
    }));
    static errorCode(): Facility {
        return Facility.ERROR;
    }

    toJSON(): JSONFacility {
        const out = {...this};
        // delete out.is_facility;
        return out;
    }
}


export interface VendorImportMaps {
    vendorsById: Map<number, Vendor>;
    vendorsByAbbreviation: Map<string, Vendor>;
    vendorsByName: Map<string, Vendor>;
}
interface VendorCSVRow {
    id: number,
    state: string,
    name: string,
    abbreviation: string,
    phone: string,
    fax: string,
    google_map_link: string,
    address: string,
    website: string,
    tech_support_website: string,
    tech_support_phone: string,
    role: string,
    notes: string,
    map_x: number,
    map_y: number,
    active: boolean,
    pinned_staff: string,
    date_deleted: number,
    date_deleted_string: string,
}
export interface VendorDataObject {
    id: number,
    state: string,
    name: string,
    abbreviation: string,
    phone: string,
    fax: string,
    google_map_link: string,
    address: string,
    website: string,
    tech_support_website: string,
    tech_support_phone: string,
    role: string,
    notes: string,
    map_x: number,
    map_y: number,
    active: boolean,
    pinned_staff: number[],
    date_deleted: number,
    date_deleted_string: string,
}
export class Vendor {
    id: number;
    state: string;
    name: string;
    abbreviation: string;
    phone: string;
    fax: string;
    google_map_link: string;
    address: string;
    website: string;
    tech_support_website: string;
    tech_support_phone: string;
    role: string;
    notes: string;
    map_x: number;
    map_y: number;
    is_facility: false;
    active: boolean;
    pinned_staff: number[];
    date_deleted: number;
    date_deleted_string: string;

    warden?: string; // for (Facility | Vendor)

    constructor(data: VendorDataObject) {
        this.id = data.id;
        this.state = data.state;
        this.name = data.name;
        this.abbreviation = data.abbreviation;
        this.phone = data.phone;
        this.fax = data.fax;
        this.google_map_link = data.google_map_link;
        this.address = data.address;
        this.website = data.website;
        this.tech_support_website = data.tech_support_website;
        this.tech_support_phone = data.tech_support_phone;
        this.role = data.role;
        this.notes = data.notes;
        this.map_x = data.map_x;
        this.map_y = data.map_y;
        this.is_facility = false;
        this.active = data.active;
        this.pinned_staff = data.pinned_staff;
        this.date_deleted = data.date_deleted;
        this.date_deleted_string = data.date_deleted_string;
    }

    static readonly CSV_Columns = Object.freeze({
        Active: 0,
        Name: 1,
        Abbreviation: 2,
        Role: 3,
        State: 4,
        Address: 5,
        Phone: 6,
        Fax: 7,
        Website: 8,
        Tech_Support_Website: 9,
        Tech_Support_Phone: 10,
        Facilities: 11,
        Notes: 12,
        Database_Id: 13,
        Map_X: 14,
        Map_Y: 15,
        Google_Maps_Link: 16,
        Total_Column_Count: 17
    });
    static readonly SQLGet_BaseFields = "SELECT id,state,name,abbreviation,phone,fax,google_map_link,address,website,tech_support_website,tech_support_phone,role,notes,map_x,map_y,active,pinned_staff,date_deleted,date_deleted_string FROM vendors";

    getFieldsModified(data: VendorDataObject): string {
        let modified = "";
        if (data.name !== this.name) {
            modified += ", Name";
        }
        if (data.address !== this.address) {
            modified += ", Add.";
        }
        if (data.phone !== this.phone) {
            modified += ", Phone";
        }
        if (data.fax !== this.fax) {
            modified += ", Fax";
        }
        if (data.notes !== this.notes) {
            modified += ", Notes";
        }
        if (data.map_x !== this.map_x) {
            modified += ", Map X";
        }
        if (data.map_y !== this.map_y) {
            modified += ", Map Y";
        }
        if (data.state !== this.state) {
            modified += ", State";
        }
        if (data.google_map_link !== this.google_map_link) {
            modified += ", Google Maps";
        }
        if (data.abbreviation !== this.abbreviation) {
            modified += ", Abbrev.";
        }
        if (data.website !== this.website) {
            modified += ", Website";
        }
        if (data.tech_support_phone !== this.tech_support_phone) {
            modified += ", Tech Phone";
        }
        if (data.tech_support_website !== this.tech_support_website) {
            modified += ", Tech Website";
        }
        if (data.role !== this.role) {
            modified += ", Role";
        }
        if (data.active !== this.active) {
            modified += ", Active";
        }
        if (data.pinned_staff !== this.pinned_staff) {
            modified += ", Pinned Staff";
        }
        if (data.date_deleted !== this.date_deleted || data.date_deleted_string !== this.date_deleted_string) {
            modified += ", Date Deleted";
        }

        if (modified === "") {
            return "None";
        }
        return modified.slice(2);
    };

    static AddToDatabaseQuery = db.prepare("INSERT INTO vendors (active, state, name, abbreviation, phone, fax, google_map_link, address, website, tech_support_website, tech_support_phone, role, notes, map_x, map_y, pinned_staff, date_deleted, date_deleted_string) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    addToDatabase(admin_username: string, is_import: boolean = false): number {
        if (is_import && !this.active) {
            this.date_deleted = getTimeMS();
            this.date_deleted_string = toReadableFullDateString(this.date_deleted);
        }
        const result = Vendor.AddToDatabaseQuery.run(
            this.active ? 1 : 0,
            this.state,
            this.name,
            this.abbreviation,
            this.phone,
            this.fax,
            this.google_map_link,
            this.address,
            this.website,
            this.tech_support_website,
            this.tech_support_phone,
            this.role,
            encryptFieldValue(this.notes),
            this.map_x,
            this.map_y,
            this.pinned_staff.join(","),
            this.date_deleted,
            this.date_deleted_string,
        );
        this.id = Number(result.lastInsertRowid);
        updateCache_AddEntry_Vendor(this);
        (is_import ? ImportActivityLog : ActivityLog).record(admin_username, "Create", "vendors", this.id, this.name, "All");
        return this.id;
    };
    static UpdateDatabaseEntryQuery = db.prepare("UPDATE vendors SET state = ?, name = ?, abbreviation = ?, phone = ?, fax = ?, google_map_link = ?, address = ?, website = ?, tech_support_website = ?, tech_support_phone = ?, role = ?, notes = ?, map_x = ?, map_y = ?, active = COALESCE(?, active), pinned_staff = ?, date_deleted = ?, date_deleted_string = ? WHERE id = ?");
    updateDatabaseEntry(admin_username: string, data: VendorDataObject, is_import: boolean = false): void {
        if (is_import && this.active && !data.active) {
            data.date_deleted = getTimeMS();
            data.date_deleted_string = toReadableFullDateString(data.date_deleted);
        }
        const fields_modified = this.getFieldsModified(data);
        if (fields_modified !== "None") {
            (is_import ? ImportActivityLog : ActivityLog).record(admin_username, "Edit", "vendors", this.id, this.name, fields_modified);
            Vendor.UpdateDatabaseEntryQuery.run(
                data.state,
                data.name,
                data.abbreviation,
                data.phone,
                data.fax,
                data.google_map_link,
                data.address,
                data.website,
                data.tech_support_website,
                data.tech_support_phone,
                data.role,
                encryptFieldValue(data.notes),
                data.map_x,
                data.map_y,
                data.active ? 1 : 0,
                data.pinned_staff.join(","),
                data.date_deleted,
                data.date_deleted_string,
                this.id,
            );
            updateCache_UpdateEntry_Vendor(data);
        }
    };
    static DatabaseEntrySetActiveQuery = db.prepare("UPDATE vendors SET active = ?, date_deleted = ?, date_deleted_string = ? WHERE id = ?");
    databaseEntrySetActive(
        admin_username: string,
        active: boolean
    ): void {
        this.date_deleted = getTimeMS();
        this.date_deleted_string = toReadableFullDateString(this.date_deleted);
        Vendor.DatabaseEntrySetActiveQuery.run(active ? 1 : 0, this.date_deleted, this.date_deleted_string, this.id);
        updateCache_SetActive_Vendor(this.id, active, this.date_deleted, this.date_deleted_string);
        ActivityLog.record(admin_username, active ? "Restore" : "Delete", "vendors", this.id, this.name, "Active, Date Deleted");
    };
    static fromSQLData(data: VendorCSVRow): Vendor {
        if (!data) {
            return Vendor.errorCode();
        }
        return new Vendor({
            id: data.id,
            state: data.state,
            name: data.name,
            abbreviation: data.abbreviation,
            phone: data.phone,
            fax: data.fax,
            google_map_link: data.google_map_link,
            address: data.address,
            website: data.website,
            tech_support_website: data.tech_support_website,
            tech_support_phone: data.tech_support_phone,
            role: data.role,
            notes: (decryptFieldValueMaybe(data.notes) || ''),
            map_x: data.map_x,
            map_y: data.map_y,
            active: data.active,
            pinned_staff: data.pinned_staff ? data.pinned_staff.split(",").map((a) => Number(a)) : [],
            date_deleted: data.date_deleted,
            date_deleted_string: data.date_deleted_string,
        });
    }
    static DatabaseEntrySetPinnedStaffQuery = db.prepare("UPDATE vendors SET pinned_staff = ? WHERE id = ?");
    databaseEntrySetPinnedStaff(
        admin_username: string,
        staff_name: string,
        is_adding_staff: boolean,
        pinned_staff: number[]
    ): void {
        Vendor.DatabaseEntrySetPinnedStaffQuery.run(pinned_staff.join(","), this.id);
        updateCache_SetPinnedStaff_Vendor(this.id, pinned_staff);
        const action = is_adding_staff ? "Add Vendor" : "Remove Vendor";
        ActivityLog.record(admin_username, action, "facility", this.id, this.name, staff_name);
    };

    static GetAllQuery = db.prepare<[], VendorCSVRow>(Vendor.SQLGet_BaseFields);
    static getAll_NoCache(): Vendor[] {
        const rows: VendorCSVRow[] = Vendor.GetAllQuery.all();

        return rows.map(Vendor.fromSQLData);
    }
    static getAll(allow_inactive: boolean = false): Vendor[] {
        return (allow_inactive ? getCache_AllVendors() : getCache_AllActiveVendors()) ?? [];
    }
    static getAllInactive(): Vendor[] {
        return getCache_AllVendors().filter((a) => !a.active);
    }

    static getById(id: number, allow_inactive: boolean = true): Vendor {
        const vendor = getCache_VendorById(id);
        if (!allow_inactive && vendor && vendor.active === false) return Vendor.errorCode();
        return vendor ?? Vendor.errorCode();
    }

    // Almost always you want getById.id !== -1 for fewer cache requests
    static isValidId(id: number, allow_inactive: boolean = false): boolean {
        try {
            const sanitized = sanitize.toInt(id);
            return Boolean(Vendor.getById(sanitized, allow_inactive).id !== -1);
        } catch {
            return false;
        }
    }

    static readonly ERROR = Object.freeze(new Vendor({
        id: -1,
        state: "",
        name: "",
        abbreviation: "",
        phone: "",
        fax: "",
        google_map_link: "",
        address: "",
        website: "",
        tech_support_website: "",
        tech_support_phone: "",
        role: "",
        notes: "",
        map_x: 0,
        map_y: 0,
        active: true,
        pinned_staff: [],
        date_deleted: 0,
        date_deleted_string: "",
    }));
    static errorCode(): Vendor {
        return Vendor.ERROR;
    }

    static getCSVHeaderFromColumn(column: number): string {
        switch (column) {
            case Vendor.CSV_Columns.Active:
                return "Active";
            case Vendor.CSV_Columns.Name:
                return "Name";
            case Vendor.CSV_Columns.Abbreviation:
                return "Abbreviation";
            case Vendor.CSV_Columns.Role:
                return "Role";
            case Vendor.CSV_Columns.State:
                return "State";
            case Vendor.CSV_Columns.Address:
                return "Address";
            case Vendor.CSV_Columns.Phone:
                return "Phone";
            case Vendor.CSV_Columns.Fax:
                return "Fax";
            case Vendor.CSV_Columns.Website:
                return "Website";
            case Vendor.CSV_Columns.Tech_Support_Website:
                return "Tech Support Website";
            case Vendor.CSV_Columns.Tech_Support_Phone:
                return "Tech Support Phone";
            case Vendor.CSV_Columns.Facilities:
                return "Facilities";
            case Vendor.CSV_Columns.Notes:
                return "Notes";
            case Vendor.CSV_Columns.Database_Id:
                return "Database Id";
            case Vendor.CSV_Columns.Map_X:
                return "Map X";
            case Vendor.CSV_Columns.Map_Y:
                return "Map Y";
            case Vendor.CSV_Columns.Google_Maps_Link:
                return "Google Maps Link";
            default:
                return "Unknown Column";
        }
    }

    static getCSVHeaders(): string {
        return Array.from(Array(Vendor.CSV_Columns.Total_Column_Count), (x, i) => i).map((a) => Vendor.getCSVHeaderFromColumn(a)).join(",")+"\r\n";
    }

    toCSV(map_FacilitiesByVendorId: Map<number, Facility[]>): string {
        if (this.id === -1) return "";
        const fields = [
            this.active ? "TRUE" : "FALSE",
            this.name,
            this.abbreviation,
            this.role,
            this.state,
            this.address,
            this.phone,
            this.fax,
            this.website,
            this.tech_support_website,
            this.tech_support_phone,
            (map_FacilitiesByVendorId.get(this.id) ?? []).map((a) => a.name).toString(),
            this.notes,
            this.id.toString(),
            this.map_x.toString(),
            this.map_y.toString(),
            this.google_map_link
        ];
        return fields.map((a) => `"${quoted_csv_sanitize(a)}"`).join(",")+"\r\n";
    }

    static loadFromCSV(line: string[], mode: string, user: string, maps: VendorImportMaps): void {
        const sline = line.map((v) => sanitize.toString(v));
        // Notes encrypted by addToDatabase and updateDatabaseEntry

        // Locate original
        let original: (Vendor | null) = null;
        if (mode !== "add") {
            if (original === null && hasValue(sline[Vendor.CSV_Columns.Database_Id])) { // Database Id
                original = maps.vendorsById.get(Number(sline[Vendor.CSV_Columns.Database_Id])) ?? null;
            }
            if (original === null && hasValue(sline[Vendor.CSV_Columns.Abbreviation])) { // Abbreviaton
                original = maps.vendorsByAbbreviation.get(sline[Vendor.CSV_Columns.Abbreviation].toLowerCase()) ?? null;
            }
            if (original === null && hasValue(sline[Vendor.CSV_Columns.Name])) { // Name
                original = maps.vendorsByName.get(sline[Vendor.CSV_Columns.Name].toLowerCase()) ?? null;
            }
        }
        if (original === null) {
            original = Vendor.errorCode();
        }
        // Build new
        const updated: Vendor = new Vendor({
            id:                     withFallback(sline[Vendor.CSV_Columns.Database_Id], original.id, Number), //                    Id
            state:                  withFallback(sline[Vendor.CSV_Columns.State], original.state), //                               State
            name:                   withFallback(sline[Vendor.CSV_Columns.Name], original.name), //                                 Name
            abbreviation:           withFallback(sline[Vendor.CSV_Columns.Abbreviation], original.abbreviation, (a) => a.toUpperCase()), // Abbreviation
            phone:                  parsePhoneToStandard(withFallback(sline[Vendor.CSV_Columns.Phone], original.phone)).result, //  Phone
            fax:                    withFallback(sline[Vendor.CSV_Columns.Fax], original.fax), //                                   Fax
            google_map_link:        withFallback(sline[Vendor.CSV_Columns.Google_Maps_Link], original.google_map_link), //          Google Maps Link
            address:                withFallback(sline[Vendor.CSV_Columns.Address], original.address), //                           Address
            website:                withFallback(sline[Vendor.CSV_Columns.Website], original.website), //                           Website
            tech_support_website:   withFallback(sline[Vendor.CSV_Columns.Tech_Support_Website], original.tech_support_website), // Tech Support Website
            tech_support_phone:     withFallback(sline[Vendor.CSV_Columns.Tech_Support_Phone], original.tech_support_phone), //     Tech Support Phone
            role:                   withFallback(sline[Vendor.CSV_Columns.Role], original.role), //                                 Role
            notes:                  withFallback(sline[Vendor.CSV_Columns.Notes], original.notes), //                               Notes
            map_x:                  withFallback(sline[Vendor.CSV_Columns.Map_X], original.map_x, Number), //                       Map X
            map_y:                  withFallback(sline[Vendor.CSV_Columns.Map_Y], original.map_y, Number), //                       Map Y
            active:                 withFallback(sline[Vendor.CSV_Columns.Active], original.active, (a) => a.toLowerCase() === "true"), // Active
            pinned_staff:           original.pinned_staff, //                                                                       Pinned Staff
            date_deleted:           original.date_deleted, //                                                                       Date Deleted
            date_deleted_string:    original.date_deleted_string, //                                                                Date Deleted
        });
        // Process
        handleImport(updated, original, original.id !== -1, mode, user);
    }

    importInsertNewDatabaseEntry(user: string): void {
        this.addToDatabase(user, true);
    };
    importUpdateOldDatabaseEntry(user: string, original: Facility | Vendor | Staff): void {
        (original as Vendor).updateDatabaseEntry(user, this, true);
    };

    toJSON(): JSONVendor {
        const out = {...this};
        return out;
    }
}


export function Get_All_Locations_Raw(): (Facility | Vendor)[] {
    return [...Facility.getAll(), ...Vendor.getAll()];
}


export interface StaffImportMaps {
    staffById: Map<number, Staff>;
    staffByLasalleId: Map<number, Staff>;
    staffByName: Map<string, Staff>;
    staffByEmail: Map<string, Staff>;

    facilitiesById: Map<number, Facility>;
    vendorsById: Map<number, Vendor>;
    locationsByAbbreviation: Map<string, Facility | Vendor>;
    locationsByUKGCodes: Map<string, Facility | Vendor>;
    locationsByName: Map<string, Facility | Vendor>;
}
export interface StaffExportMaps {
    facilityInfoById: Map<number, { name: string, abbreviation: string }>;
    vendorInfoById: Map<number, { name: string, abbreviation: string }>;
}
interface StaffCSVRow {
    id: number,
    place_id: number,
    name: string,
    email: string,
    phone: string,
    position: string,
    department: string,
    at_facility: boolean,
    work_ext: string,
    notes: string,
    lasalle_id: number,
    active: boolean,
    date_deleted: number,
    date_deleted_string: string,
}
export interface StaffDataObject {
    id: number,
    place_id: number,
    name: string,
    email: string,
    phone: string,
    position: string,
    department: string,
    at_facility: boolean,
    work_ext: string,
    notes: string,
    lasalle_id: number,
    active: boolean,
    date_deleted: number,
    date_deleted_string: string,
};
export class Staff {
    id: number;
    place_id: number;
    name: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    at_facility: boolean;
    work_ext: string;
    notes: string;
    // image_exists: boolean;
    location_abbreviation: string;
    location_name: string;
    lasalle_id: number;
    active: boolean;
    date_deleted: number;
    date_deleted_string: string;

    constructor(data: StaffDataObject) {
        this.id = data.id;
        this.place_id = data.place_id;
        this.name = data.name;
        this.email = data.email;
        this.phone = data.phone;
        this.position = data.position;
        this.department = data.department;
        this.at_facility = data.at_facility;
        this.work_ext = data.work_ext;
        this.notes = data.notes;
        // this.image_exists = fs.existsSync(path.join(process.cwd(), 'static', "/staff/"+name+".png"));
        let location = this.id !== -1 ? (this.at_facility ? Facility.getById(this.place_id, false) : Vendor.getById(this.place_id, false)) : null;
        this.location_abbreviation = location ? location.abbreviation : "";
        this.location_name = location ? location.name : "";
        this.lasalle_id = data.lasalle_id ?? 0;
        this.active = data.active;
        this.date_deleted = data.date_deleted;
        this.date_deleted_string = data.date_deleted_string;
    }

    static readonly CSV_Columns = Object.freeze({
        Active: 0,
        Employee_Number: 1,
        Name: 2,
        Email: 3,
        Phone: 4,
        Location: 5,
        Location_Code: 6,
        Position: 7,
        Department: 8,
        Work_Ext: 9,
        Notes: 10,
        At_Facility: 11,
        Database_Id: 12,
        Location_Database_Id: 13,
        Total_Column_Count: 14
    });
    static readonly SQLGet_BaseFields = "SELECT id,place_id,name,email,phone,position,department,at_facility,work_ext,notes,lasalle_id,active,date_deleted FROM staff";
    
    getFieldsModified(data: StaffDataObject): string {
        let modified = "";
        if (data.name !== this.name) {
            modified += ", Name";
        }
        if (data.lasalle_id !== this.lasalle_id) {
            modified += ", Employee Number";
        }
        if (data.position !== this.position) {
            modified += ", Title";
        }
        if (data.department !== this.department) {
            modified += ", Dept.";
        }
        if (data.phone !== this.phone) {
            modified += ", Cell";
        }
        if (data.email !== this.email) {
            modified += ", Email";
        }
        if (data.work_ext !== this.work_ext) {
            modified += ", Dept.";
        }
        if (data.notes !== this.notes) {
            modified += ", Notes";
        }
        // The following line is because there is some weird shenanigan where the compiler thinks that this.at_facility is a Boolean, but after compilation typeof says for some strange reason that it is a Number
        if (data.place_id !== this.place_id || (data.at_facility ? 1 : 0) !== (this.at_facility ? 1 : 0)) {
            modified += ", Location";
        }
        if (data.active !== this.active) {
            modified += ", Active";
        }
        if (data.date_deleted !== this.date_deleted) {
            modified += ", Date Deleted";
        }
        if (data.date_deleted_string !== this.date_deleted_string) {
            modified += ", Date Deleted";
        }

        if (modified === "") {
            return "None";
        }
        return modified.slice(2);
    };

    static AddToDatabaseQuery = db.prepare("INSERT INTO staff (active, place_id, name, email, phone, position, department, at_facility, work_ext, notes, lasalle_id, date_deleted, date_deleted_string) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    addToDatabase(admin_username: string, is_import: boolean = false): number {
        if (is_import && !this.active) {
            this.date_deleted = getTimeMS();
            this.date_deleted_string = toReadableFullDateString(this.date_deleted);
        }
        const result = Staff.AddToDatabaseQuery.run(
            this.active ? 1 : 0,
            this.place_id,
            this.name,
            this.email,
            this.phone,
            this.position,
            this.department,
            this.at_facility ? 1 : 0,
            this.work_ext,
            encryptFieldValue(this.notes),
            this.lasalle_id,
            this.date_deleted,
            this.date_deleted_string,
        );
        this.id = Number(result.lastInsertRowid);
        updateCache_AddEntry_Staff(this);
        (is_import ? ImportActivityLog : ActivityLog).record(admin_username, "Create", "staff", this.id, `${this.name} (${this.location_abbreviation})`, "All");
        return this.id;
    };
    static UpdateDatabaseEntryQuery = db.prepare("UPDATE staff SET place_id = ?, name = ?, email = ?, phone = ?, position = ?, department = ?, at_facility = ?, work_ext = ?, notes = ?, lasalle_id = ?, active = COALESCE(?, active), date_deleted = ?, date_deleted_string = ? WHERE id = ?");
    updateDatabaseEntry(admin_username: string, data: StaffDataObject, is_import: boolean = false): void {
        if (is_import && this.active && !data.active) {
            data.date_deleted = getTimeMS();
            data.date_deleted_string = toReadableFullDateString(data.date_deleted);
        }
        const fields_modified = this.getFieldsModified(data);
        if (fields_modified !== "None") {
            (is_import ? ImportActivityLog : ActivityLog).record(admin_username, "Edit", "staff", this.id, `${this.name} (${this.location_abbreviation})`, fields_modified);
            Staff.UpdateDatabaseEntryQuery.run(
                data.place_id,
                data.name,
                data.email,
                data.phone,
                data.position,
                data.department,
                data.at_facility ? 1 : 0,
                data.work_ext,
                encryptFieldValue(data.notes),
                data.lasalle_id,
                data.active ? 1 : 0,
                data.date_deleted,
                data.date_deleted_string,
                this.id,
            );
            updateCache_UpdateEntry_Staff(data);
        }
    };
    static DatabaseEntrySetActiveQuery = db.prepare("UPDATE staff SET active = ?, date_deleted = ?, date_deleted_string = ? WHERE id = ?");
    databaseEntrySetActive(
        admin_username: string,
        active: boolean
    ): void {
        this.date_deleted = getTimeMS();
        this.date_deleted_string = toReadableFullDateString(this.date_deleted);
        Staff.DatabaseEntrySetActiveQuery.run(active ? 1 : 0, this.date_deleted, this.date_deleted_string, this.id);
        updateCache_SetActive_Staff(this.id, active, this.date_deleted, this.date_deleted_string);
        ActivityLog.record(admin_username, active ? "Restore" : "Delete", "staff", this.id, `${this.name} (${this.location_abbreviation})`, "Active, Date Deleted");
    };
    static fromSQLData(data: StaffCSVRow): Staff {
        if (!data) {
            return Staff.errorCode();
        }
        return new Staff({
            id: data.id,
            place_id: data.place_id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            position: data.position,
            department: data.department,
            at_facility: data.at_facility,
            work_ext: data.work_ext,
            notes: (decryptFieldValueMaybe(data.notes) || ''),
            lasalle_id: data.lasalle_id,
            active: data.active,
            date_deleted: data.date_deleted,
            date_deleted_string: data.date_deleted_string,
        });
    };

    static GetAllQuery = db.prepare<[], StaffCSVRow>(Staff.SQLGet_BaseFields);
    static getAll_NoCache(): Staff[] {
        const rows: StaffCSVRow[] = Staff.GetAllQuery.all();

        return rows.map(Staff.fromSQLData);
    }
    static getAll(allow_inactive: boolean = false): Staff[] {
        return (allow_inactive ? getCache_AllStaff() : getCache_AllActiveStaff()) ?? [];
    }
    static getAllInactive(): Staff[] {
        return getCache_AllStaff().filter((a) => !a.active);
    }
    
    static getByFacility(location_id: number, allow_inactive: boolean = false): Staff[] {
        const staff = getCache_StaffByLocation(location_id, true);
        return (allow_inactive ? staff : staff?.filter((a) => a.active)) ?? [];
    }
    static getByVendor(vendor_id: number, allow_inactive: boolean = false): Staff[] {
        const staff = getCache_StaffByLocation(vendor_id, false);
        return (allow_inactive ? staff : staff?.filter((a) => a.active)) ?? [];
    }
    
    static getById(id: number, allow_inactive: boolean = true): Staff {
        const staff = getCache_StaffById(id);
        if (!allow_inactive && staff && staff.active === false) return Staff.errorCode();
        return staff ?? Staff.errorCode();
    }

    static readonly ERROR = Object.freeze(new Staff({
        id: -1,
        place_id: -1,
        name: "",
        email: "",
        phone: "",
        position: "",
        department: "",
        at_facility: true,
        work_ext: "",
        notes: "",
        lasalle_id: -1,
        active: true,
        date_deleted: 0,
        date_deleted_string: "",
    }));
    static errorCode(): Staff {
        return Staff.ERROR;
    }

    // Almost always you want getById.id !== -1 for fewer cache requests
    static isValidId(id: number, allow_inactive: boolean = false): boolean {
        try {
            const sanitized = sanitize.toInt(id);
            return Boolean(Staff.getById(sanitized, allow_inactive).id !== -1);
        } catch {
            return false;
        }
    }

    static getCSVHeaderFromColumn(column: number): string {
        switch (column) {
            case Staff.CSV_Columns.Active:
                return "Active";
            case Staff.CSV_Columns.Employee_Number:
                return "Employee Number";
            case Staff.CSV_Columns.Name:
                return "Name";
            case Staff.CSV_Columns.Email:
                return "Email";
            case Staff.CSV_Columns.Phone:
                return "Phone";
            case Staff.CSV_Columns.Location:
                return "Location";
            case Staff.CSV_Columns.Location_Code:
                return "Location Code";
            case Staff.CSV_Columns.Position:
                return "Position";
            case Staff.CSV_Columns.Department:
                return "Department";
            case Staff.CSV_Columns.Work_Ext:
                return "Work Ext.";
            case Staff.CSV_Columns.Notes:
                return "Notes";
            case Staff.CSV_Columns.At_Facility:
                return "At Facility?";
            case Staff.CSV_Columns.Database_Id:
                return "Database Id";
            case Staff.CSV_Columns.Location_Database_Id:
                return "Location Database Id";
            default:
                return "Unknown Column";
        }
    }

    static getCSVHeaders(): string {
        return Array.from(Array(Staff.CSV_Columns.Total_Column_Count), (x, i) => i).map((a) => Staff.getCSVHeaderFromColumn(a)).join(",")+"\r\n";
    }

    toCSV(maps: StaffExportMaps): string {
        if (this.id === -1) return "";
        const fields = [
            this.active ? "TRUE" : "FALSE",
            this.lasalle_id.toString(),
            this.name,
            this.email,
            this.phone,
            (this.at_facility ? maps.facilityInfoById.get(this.place_id)?.name : maps.vendorInfoById.get(this.place_id)?.name) ?? "",
            (this.at_facility ? maps.facilityInfoById.get(this.place_id)?.abbreviation : maps.vendorInfoById.get(this.place_id)?.abbreviation) ?? "",
            this.position,
            this.department,
            this.work_ext,
            this.notes,
            this.at_facility ? "TRUE" : "FALSE",
            this.id.toString(),
            this.place_id.toString()
        ];
        return fields.map((a) => `"${quoted_csv_sanitize(a)}"`).join(",")+"\r\n";
    }

    static loadFromCSV(line: string[], mode: string, user: string, maps: StaffImportMaps): void {
        const sline = line.map((v) => sanitize.toString(v));
        // Notes encrypted by addDatabaseEntry
        
        if (mode === "ukg_special") {
            if (sline[Staff.CSV_Columns.Active].toLowerCase() === "active") {
                sline[Staff.CSV_Columns.Active] = "True";
            }
            sline[Staff.CSV_Columns.Name] = sline[Staff.CSV_Columns.Name].split(", ").reverse().join(" ");
        }

        // Locate original
        let original: (Staff | null) = null;
        let decode_location: (Facility | Vendor | null) = null;
        if (mode !== "add") {
            if (original === null && hasValue(sline[Staff.CSV_Columns.Database_Id])) { // Database Id
                original = maps.staffById.get(Number(sline[Staff.CSV_Columns.Database_Id])) ?? null;
            }
            if (original === null && hasValue(sline[Staff.CSV_Columns.Employee_Number])) { // Lasalle Id
                original = maps.staffByLasalleId.get(Number(sline[Staff.CSV_Columns.Employee_Number])) ?? null;
            }
            if (original === null && hasValue(sline[Staff.CSV_Columns.Email])) { // Email
                original = maps.staffByEmail.get(sline[Staff.CSV_Columns.Email].toLowerCase()) ?? null;
            }
            if (original === null && hasValue(sline[Staff.CSV_Columns.Name])) { // Name
                original = maps.staffByName.get(sline[Staff.CSV_Columns.Name].toLowerCase()) ?? null;
            }
        }
        if (original === null) {
            original = Staff.errorCode();
        }
        let at_facility: boolean = withFallback(sline[Staff.CSV_Columns.At_Facility], original.at_facility, (a: string) => a.toLowerCase() === "true");
        if (at_facility) {
            if (decode_location === null && hasValue(sline[Staff.CSV_Columns.Location_Database_Id])) { // Location Database Id
                decode_location = maps.facilitiesById.get(Number(sline[Staff.CSV_Columns.Location_Database_Id])) ?? null;
            }
        }else {
            if (decode_location === null && hasValue(sline[Staff.CSV_Columns.Location_Database_Id])) { // Location Database Id
                decode_location = maps.vendorsById.get(Number(sline[Staff.CSV_Columns.Location_Database_Id])) ?? null;
            }
        }
        if (decode_location === null && hasValue(sline[Staff.CSV_Columns.Location_Code])) { // Location Code
            decode_location = maps.locationsByAbbreviation.get(sline[Staff.CSV_Columns.Location_Code].toLowerCase()) ?? null;
        }
        if (decode_location === null && hasValue(sline[Staff.CSV_Columns.Location_Code])) { // Location Code
            decode_location = maps.locationsByUKGCodes.get(sline[Staff.CSV_Columns.Location_Code].toLowerCase()) ?? null;
        }
        if (decode_location === null && hasValue(sline[Staff.CSV_Columns.Location])) { // Location
            decode_location = maps.locationsByName.get(sline[Staff.CSV_Columns.Location].toLowerCase()) ?? null;
        }
        // Build new
        const updated: Staff = new Staff({
            id:                     withFallback(sline[Staff.CSV_Columns.Database_Id], original.id, Number), //                 Id
            place_id:               decode_location !== null ? decode_location.id : original.place_id, //                       Place Id
            name:                   withFallback(sline[Staff.CSV_Columns.Name], original.name), //                              Name
            email:                  withFallback(sline[Staff.CSV_Columns.Email], original.email), //                            Email
            phone:                  parsePhoneToStandard(withFallback(sline[Staff.CSV_Columns.Phone], original.phone)).result, // Phone
            position:               withFallback(sline[Staff.CSV_Columns.Position], original.position), //                      Position
            department:             withFallback(sline[Staff.CSV_Columns.Department], original.department), //                  Department
            at_facility:            decode_location !== null ? decode_location.is_facility : original.at_facility, // At Facility?
            work_ext:               withFallback(sline[Staff.CSV_Columns.Work_Ext], original.work_ext), //                      Work Ext.
            notes:                  withFallback(sline[Staff.CSV_Columns.Notes], original.notes), //                            Notes
            lasalle_id:             withFallback(sline[Staff.CSV_Columns.Employee_Number], original.lasalle_id, Number), //     Employee Number
            active:                 withFallback(sline[Staff.CSV_Columns.Active], original.active, (a: string) => a.toLowerCase() === "true"), // Active
            date_deleted:           original.date_deleted, //                                                                   Date Deleted
            date_deleted_string:    original.date_deleted_string, //                                                            Date Deleted
        });
        // Process
        handleImport(updated, original, original.id !== -1, mode, user);

        let facility_position = kUKGTitlesToPosition.get(updated.position);
        if (facility_position !== undefined && updated.place_id !== -1 && updated.active) {
            let facility = Facility.getById(updated.place_id);
            let modified = facility.toJSON();
            switch (facility_position) {
                case "regional_warden":
                    modified.regional_warden_id = updated.id;
                    break;
                case "warden":
                    modified.warden_id = updated.id;
                    break;
                case "assistant_warden":
                    modified.assistant_warden_id = updated.id;
                    break;
                case "business_manager":
                    modified.business_manager_id = updated.id;
                    break;
                case "hr_manager":
                    modified.hr_manager_id = updated.id;
                    break;
                case "chief_of_security":
                    modified.chief_of_security_id = updated.id;
                    break;
                case "maintenance_supervisor":
                    modified.maintenance_supervisor_id = updated.id;
                    break;
                case "health_services_admin":
                    modified.health_services_admin_id = updated.id;
                    break;
                case "director_of_nursing":
                    modified.director_of_nursing_id = updated.id;
                    break;
            }
            facility.updateDatabaseEntry(user, modified, true);
        }
    }

    importInsertNewDatabaseEntry(user: string): void {
        this.addToDatabase(user, true);
    };
    importUpdateOldDatabaseEntry(user: string, original: Facility | Vendor | Staff): void {
        (original as Staff).updateDatabaseEntry(user, this, true);
    };

    toJSON(): JSONStaff {
        if (this.id !== -1) {
            let location = this.id !== -1 ? (this.at_facility ? Facility.getById(this.place_id, false) : Vendor.getById(this.place_id, false)) : null;
            this.location_abbreviation = location ? location.abbreviation : "";
            this.location_name = location ? location.name : "";
        }
        const out = {...this};
        return out;
    }
}


interface UserCSVRow {
    id: number,
    name: string,
    username: string,
    password: string,
    old_password_1: string,
    old_password_2: string,
    title: string,
    location: string,
    email: string,
    privileges: string,
    colormode: string,
    failed_attempts: number,
    last_failed: number,
    must_change_password: boolean,
    admin_locked: boolean,
    active: boolean,
    date_deleted: number,
    date_deleted_string: string,
    last_login_date: number,
    last_login_date_string: string,
}
export interface UserDataObject {
    id: number,
    name: string,
    username: string,
    password?: string | undefined,
    old_password_1?: string | undefined,
    old_password_2?: string | undefined,
    title: string,
    location: string,
    email: string,
    privileges: string,
    colormode: string,
    failed_attempts: number,
    last_failed: number,
    must_change_password: boolean,
    admin_locked: boolean,
    active: boolean,
    date_deleted: number,
    date_deleted_string: string,
    last_login_date: number,
    last_login_date_string: string,
};
export class User {
    id: number;
    name: string;
    username: string;
    password?: string;
    old_password_1?: string;
    old_password_2?: string;
    title: string;
    location: string;
    email: string;
    privileges: string;
    colormode: string;
    failed_attempts: number;
    last_failed: number;
    must_change_password: boolean;
    admin_locked: boolean; // Admin lock
    account_is_locked: boolean;
    active: boolean;
    date_deleted: number;
    date_deleted_string: string;
    last_login_date: number;
    last_login_date_string: string;

    constructor(data: UserDataObject) {
        this.id = data.id;
        this.name = data.name;
        this.username = data.username;
        this.password = data.password;
        this.old_password_1 = data.old_password_1;
        this.old_password_2 = data.old_password_2;
        this.title = data.title;
        this.location = data.location;
        this.email = data.email;
        this.privileges = data.privileges;
        this.colormode = data.colormode;
        this.failed_attempts = data.failed_attempts;
        this.last_failed = data.last_failed;
        this.must_change_password = data.must_change_password;
        this.admin_locked = data.admin_locked;
        this.account_is_locked = this.accountIsLocked(); // For serialization
        this.active = data.active;
        this.date_deleted = data.date_deleted;
        this.date_deleted_string = data.date_deleted_string;
        this.last_login_date = data.last_login_date;
        this.last_login_date_string = data.last_login_date_string;
    }

    static readonly CSV_Columns = Object.freeze({
        Active: 0,
        Name: 1,
        Username: 2,
        Email: 3,
        Privileges: 4,
        Title: 5,
        Location: 6,
        Locked: 7,
        Database_Id: 8,
        Color_Mode: 9,
        Total_Column_Count: 10
    });
    static readonly SQLGet_BaseFields = "SELECT id,name,username,password,old_password_1,old_password_2,title,location,email,privileges,colormode,failed_attempts,last_failed,must_change_password,admin_locked,active,date_deleted,last_login_date,last_login_date_string FROM users";
    
    getFieldsModified(data: UserDataObject) {
        let modified = "";
        if (data.name !== this.name) {
            modified += ", Name";
        }
        if (data.username !== this.username) {
            modified += ", Username";
        }
        if (data.password && data.password !== this.password) {
            modified += ", Password";
        }
        if (data.old_password_1 && data.old_password_1 !== this.old_password_1) {
            modified += ", Password";
        }
        if (data.old_password_2 && data.old_password_2 !== this.old_password_2) {
            modified += ", Old Pass.";
        }
        if (data.title !== this.title) {
            modified += ", Title";
        }
        if (data.location !== this.location) {
            modified += ", Location";
        }
        if (data.privileges !== this.privileges) {
            modified += ", Privileges";
        }
        if (data.colormode !== this.colormode) {
            modified += ", Color Mode";
        }
        if (data.failed_attempts !== this.failed_attempts) {
            modified += ", Failed Attempts";
        }
        if (data.last_failed !== this.last_failed) {
            modified += ", Last Failed";
        }
        if (data.must_change_password !== this.must_change_password) {
            modified += ", Password Temporary";
        }
        if (data.admin_locked !== this.admin_locked) {
            modified += ", Admin Lock";
        }
        if (data.active !== this.active) {
            modified += ", Active";
        }
        if (data.date_deleted !== this.date_deleted || data.date_deleted_string !== this.date_deleted_string) {
            modified += ", Date Deleted";
        }

        if (modified === "") {
            return "None";
        }
        return modified.slice(2);
    };

    static AddToDatabaseQuery = db.prepare("INSERT INTO users (name, active, username, password, old_password_1, old_password_2, title, location, email, privileges, colormode, failed_attempts, last_failed, must_change_password, admin_locked, date_deleted, date_deleted_string, last_login_date, last_login_date_string) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    addToDatabase(admin_username: string): number {
        const result = User.AddToDatabaseQuery.run(
            this.name,
            this.active ? 1 : 0,
            this.username.toLowerCase(),
            this.password,
            this.old_password_1,
            this.old_password_2,
            this.title,
            this.location,
            this.email,
            this.privileges,
            this.colormode,
            this.failed_attempts,
            this.last_failed,
            this.must_change_password ? 1 : 0,
            this.admin_locked ? 1 : 0,
            this.date_deleted,
            this.date_deleted_string,
            this.last_login_date,
            this.last_login_date_string,
        );
        this.id = Number(result.lastInsertRowid);
        updateCache_AddEntry_User(this);
        ActivityLog.record(admin_username, "Create", "users", this.id, this.name.length > 0 ? this.name : this.username, "All");
        return this.id;
    };
    static UpdateDatabaseEntryQuery = db.prepare("UPDATE users SET name = ?, username = ?, title = ?, location = ?, privileges = ?, active = ?, colormode = ?, password = COALESCE(?, password), old_password_1 = COALESCE(?, old_password_1), old_password_2 = COALESCE(?, old_password_2), failed_attempts = ?, must_change_password = ?, admin_locked = ?, date_deleted = ?, date_deleted_string = ?, last_login_date = ?, last_login_date_string = ? WHERE id = ?");
    updateDatabaseEntry(admin_username: string, data: UserDataObject, internal: boolean = false): void {
        const fields_modified = this.getFieldsModified(data);
        if (fields_modified !== "None" || internal) {
            if (!internal) {
                ActivityLog.record(admin_username, "Edit", "users", this.id, this.name, fields_modified);
            }
            User.UpdateDatabaseEntryQuery.run(
                data.name,
                data.username.toLowerCase(),
                data.title,
                data.location,
                data.privileges,
                data.active ? 1 : 0,
                data.colormode,
                data.password,
                data.old_password_1,
                data.old_password_2,
                data.failed_attempts,
                data.must_change_password ? 1 : 0,
                data.admin_locked ? 1 : 0,
                data.date_deleted,
                data.date_deleted_string,
                data.last_login_date,
                data.last_login_date_string,
                this.id,
            );
            updateCache_UpdateEntry_User(data);
        }
    };
    static DatabaseEntrySetActiveQuery = db.prepare("UPDATE users SET active = ?, date_deleted = ?, date_deleted_string = ? WHERE id = ?");
    databaseEntrySetActive(
        admin_username: string,
        active: boolean
    ): void {
        const date_deleted = getTimeMS();
        const date_deleted_string = toReadableFullDateString(date_deleted);
        User.DatabaseEntrySetActiveQuery.run(active ? 1 : 0, date_deleted, date_deleted_string, this.id);
        updateCache_SetActive_User(this.id, active, date_deleted, date_deleted_string);
        ActivityLog.record(admin_username, active ? "Restore" : "Delete", "users", this.id, this.name.length > 0 ? this.name : this.username, "Active, Date Deleted");
    };
    databaseEntrySetColormode(
        admin_username: string,
        colormode: string
    ): void {
        let data: UserDataObject = {...this};
        data.colormode = colormode;
        this.updateDatabaseEntry(admin_username, data);
    };
    updatePasswordDatabase(
        admin_username: string,
        password: string,
        failed_attempts: number,
        must_change_password: boolean,
        admin_locked: boolean,
    ): void {
        let data: UserDataObject = {...this};
        data.old_password_2 = data.old_password_1;
        data.old_password_1 = data.password;
        data.password = password;
        data.failed_attempts = failed_attempts;
        data.must_change_password = must_change_password;
        data.admin_locked = admin_locked;
        this.updateDatabaseEntry(admin_username, data);
    };
    unlockAccountDatabase(
        admin_username: string,
        failed_attempts: number,
        admin_locked: boolean,
    ): void {
        let data: UserDataObject = {...this};
        data.failed_attempts = failed_attempts;
        data.admin_locked = admin_locked;
        this.updateDatabaseEntry(admin_username, data);
    };
    updateLastLoginDatabase(): void {
        let time = getTimeMS();
        let time_string = toReadableFullDateString(time);
        let data: UserDataObject = {...this};
        data.last_login_date = time;
        data.last_login_date_string = time_string;
        this.updateDatabaseEntry("", data, true);
    };
    static fromSQLData(data: UserCSVRow, redact_password: boolean = true): User {
        if (!data) {
            return User.errorCode();
        }
        return new User({
            id: data.id,
            name: data.name,
            username: data.username,
            password: redact_password ? undefined : data.password,
            old_password_1: redact_password ? undefined : data.old_password_1,
            old_password_2: redact_password ? undefined : data.old_password_2,
            title: data.title,
            location: data.location,
            email: data.email,
            privileges: data.privileges,
            colormode: data.colormode,
            failed_attempts: data.failed_attempts,
            last_failed: data.last_failed,
            must_change_password: data.must_change_password,
            admin_locked: data.admin_locked,
            active: data.active,
            date_deleted: data.date_deleted,
            date_deleted_string: data.date_deleted_string,
            last_login_date: data.last_login_date,
            last_login_date_string: data.last_login_date_string,
        });
    }

    static GetAllQuery = db.prepare<[], UserCSVRow>(User.SQLGet_BaseFields);
    static getAll_NoCache(): User[] {
        const rows: UserCSVRow[] = User.GetAllQuery.all();

        return rows.map((data) => User.fromSQLData(data, false));
    }
    static getAll(allow_inactive: boolean = false): User[] {
        return (allow_inactive ? getCache_AllUsers() : getCache_AllActiveUsers()) ?? [];
    }
    static getAllInactive(): User[] {
        return getCache_AllUsers().filter((a) => !a.active);
    }
    
    static getByUsername(username: string, redact_password: boolean = true, allow_inactive: boolean = false): User {
        const user = getCache_UserByUsername(username);
        if (!allow_inactive && user && user.active === false) return User.errorCode();
        return user ?? User.errorCode();
    }

    static getById(id: number, allow_inactive: boolean = true): User {
        const user = getCache_UserById(id);
        if (!allow_inactive && user && user.active === false) return User.errorCode();
        return user ?? User.errorCode();
    }

    static readonly ERROR = Object.freeze(new User({
        id: -1,
        name: "",
        username: "",
        password: undefined,
        title: "",
        location: "",
        email: "",
        privileges: "",
        colormode: "",
        failed_attempts: 0,
        last_failed: 0,
        must_change_password: false,
        admin_locked: false,
        active: true,
        date_deleted: 0,
        date_deleted_string: "",
        last_login_date: 0,
        last_login_date_string: "",
    }));
    static errorCode(): User {
        return User.ERROR;
    }

    static isValidId(id: number, allow_inactive: boolean = false): boolean {
        try {
            const sanitized = sanitize.toInt(id);
            return Boolean(User.getById(sanitized, allow_inactive).id !== -1);
        } catch {
            return false;
        }
    }

    accountIsLocked(): boolean {
        return this.tooManyFailedAttempts() || this.admin_locked;
    }
    tooManyFailedAttempts(): boolean {
        return (this.failed_attempts >= kFailedAttemptsUntilLockout && getTimeSinceMS(this.last_failed) <= kFailedAttemptsLockoutTimeMS);
    }

    static AddFailedAttemptQuery = db.prepare("UPDATE users SET failed_attempts = ?, last_failed = ? WHERE id = ?");
    addFailedAttempt(): void {
        const new_failed = (getTimeSinceMS(this.last_failed) <= kFailedAttemptsLockoutTimeMS) ? this.failed_attempts + 1 : 1;
        const new_date = (new_failed > kFailedAttemptsUntilLockout) ? this.last_failed : getTimeMS(); // Does not penalize for failed attempts while the account is locked
        User.AddFailedAttemptQuery.run(new_failed, new_date, this.id);
        this.failed_attempts = new_failed;
        this.last_failed = new_date;
    }

    static getCSVHeaderFromColumn(column: number): string {
        switch (column) {
            case User.CSV_Columns.Active:
                return "Active";
            case User.CSV_Columns.Name:
                return "Name";
            case User.CSV_Columns.Username:
                return "Username";
            case User.CSV_Columns.Email:
                return "Email";
            case User.CSV_Columns.Privileges:
                return "Privileges";
            case User.CSV_Columns.Title:
                return "Title";
            case User.CSV_Columns.Location:
                return "Location";
            case User.CSV_Columns.Locked:
                return "Locked";
            case User.CSV_Columns.Database_Id:
                return "Database Id";
            case User.CSV_Columns.Color_Mode:
                return "Color Mode";
            default:
                return "Unknown Column";
        }
    }

    static getCSVHeaders(): string {
        return Array.from(Array(User.CSV_Columns.Total_Column_Count), (x, i) => i).map((a) => User.getCSVHeaderFromColumn(a)).join(",")+"\r\n";
    }

    toCSV(): string {
        if (this.id === -1) return "";
        const fields = [
            this.active ? "TRUE" : "FALSE",
            this.name,
            this.username,
            this.email,
            this.privileges,
            this.title,
            this.location,
            this.admin_locked ? "TRUE" : "FALSE",
            this.id.toString(),
            this.colormode
        ];
        return fields.map((a) => `"${quoted_csv_sanitize(a)}"`).join(",")+"\r\n";
    }

    toJSON(): JSONUser {
        if (this.id !== -1) {
            this.account_is_locked = this.accountIsLocked();
        }
        const out = {...this};
        delete out.password;
        delete out.old_password_1;
        delete out.old_password_2;
        return out;
    }
}

interface ActivityLogCSVRow {
    id: number,
    user: string,
    date: number,
    action: string,
    on_table: string,
    on_id: number,
    on_fields: string,
    object_name: string,
    date_string: string,
}
export interface ActivityLogDataObject {
    id: number,
    user: string,
    date: number,
    action: string,
    on_table: string,
    on_id: number,
    on_fields: string,
    object_name: string,
    date_string: string,
};
export class ActivityLog {
    id: number;
    user: string;
    date: number;
    action: string;
    on_table: string;
    on_id: number;
    on_fields: string;
    object_name: string;
    date_string: string;
    object_is_active: boolean;

    constructor(data: ActivityLogDataObject) {
        this.id = data.id;
        this.user = data.user;
        this.date = data.date;
        // this.date_string = toReadableFullDateString(data.date);
        // this.date_string = "";
        this.action = data.action;
        this.on_table = data.on_table;
        this.on_id = data.on_id;
        this.on_fields = data.on_fields;
        this.object_name = data.object_name;
        this.date_string = data.date_string;
        // const object = getByTableAndId(this.on_table, this.on_id);
        // this.object_is_active = object?.active ?? true;
        this.object_is_active = true;
    }

    static readonly CSV_Columns = Object.freeze({
        Action: 0,
        On_Table: 1,
        On_Entry: 2,
        Performed_By: 3,
        Date: 4,
        Fields_Changed: 5,
        Database_Id: 6,
        Edited_Entry_Database_Id: 7,
        Total_Column_Count: 8
    });
    static readonly SQLGet_BaseFields = "SELECT id,user,date,action,on_table,on_id,on_fields,object_name,date_string FROM activity_log";
    
    static fromSQLData(data: ActivityLogCSVRow): ActivityLog {
        // console.log("Loading one", data);
        return new ActivityLog({
            id: data.id,
            user: data.user,
            date: data.date,
            action: data.action,
            on_table: data.on_table,
            on_id: data.on_id,
            on_fields: data.on_fields,
            object_name: data.object_name,
            date_string: data.date_string
        });
    }

    static GetAllQuery = db.prepare<[], ActivityLogCSVRow>(ActivityLog.SQLGet_BaseFields+" ORDER BY date DESC");
    static getAll_NoCache(): ActivityLog[] {
        // console.log("getAll Start");
        const rows: ActivityLogCSVRow[] = ActivityLog.GetAllQuery.all();
        // console.log("getAll from database");

        return rows.map(ActivityLog.fromSQLData);
    }
    static getAll(): ActivityLog[] {
        return getCache_AllActivityLogs();
    }
    // static getAllLoaded(): ActivityLog[] {
    //     return getCache_AllLoadedActivityLogs();
    // }

    // static GetRecentQuery = db.prepare<[number, number], ActivityLogCSVRow>(ActivityLog.SQLGet_BaseFields+" ORDER BY date DESC LIMIT ? OFFSET ?;");
    // static getRecent_NoCache(count: number, offset: number = 0): ActivityLog[] {
    //     let sanitizedCount = sanitize.toInt(count);
    //     let sanitizedOffset = sanitize.toInt(offset);
    //     if (sanitizedCount < 1) sanitizedCount = 1;
    //     if (sanitizedCount > 100) sanitizedCount = 100; // don't allow arbitrarily large requests
    //     if (sanitizedOffset < 0) sanitizedOffset = 0;
    //     // if (sanitizedOffset > 10000) sanitizedOffset = 10000; // don't allow arbitrarily large requests
    //     const rows: ActivityLogCSVRow[] = ActivityLog.GetRecentQuery.all(sanitizedCount, sanitizedOffset);

    //     return rows.map(ActivityLog.fromSQLData);
    // }
    // static getRecent(count: number, offset: number = 0): ActivityLog[] {
    //     return getCache_RecentActivityLogs(count, offset);
    // }

    // Record an activity log entry programmatically
    static RecordQuery = db.prepare("INSERT INTO activity_log (user,date,action,on_table,on_id,on_fields,object_name,date_string) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    static record(user: string, action: string, on_table: string, on_id: number, object_name: string, on_fields: string | string[]): void {
        try {
            const sanitizedUser = sanitize.toString(user || 'system', 100);
            const date = getTimeMS();
            const sanitizedObjectName = sanitize.toString(object_name || 'Unknown', 100);
            const fieldsStr = Array.isArray(on_fields) ? on_fields.join(',') : (on_fields || '');
            const date_string = toReadableFullDateString(date);
            const result = ActivityLog.RecordQuery.run(sanitizedUser, date, action, on_table, on_id, fieldsStr, sanitizedObjectName, date_string);
            const new_entry = new ActivityLog({
                id: Number(result.lastInsertRowid),
                user: sanitizedUser,
                date,
                action,
                on_table,
                on_id,
                on_fields: fieldsStr,
                object_name: sanitizedObjectName,
                date_string: date_string
            });
            updateCache_AddEntry_ActivityLog(new_entry);
            try { eventLogger.logEvent('ACTIVITY_LOG_CREATED', { user: sanitizedUser, action, on_table, on_id, fields: fieldsStr }); } catch (e) { logger.warn('Failed to emit ACTIVITY_LOG_CREATED event', { err: String(e) }); }
        } catch (e) {
            logger.error('Failed to write activity_log entry', { err: String(e), user, action, on_table, on_id, on_fields });
        }
    }

    // // Utility: compute which top-level fields changed between two plain objects
    // static computeFieldsModified(original: Record<string, any>, updated: Record<string, any>, excludeKeys?: string[]) {
    //     try {
    //         const exclude = new Set(excludeKeys || []);
    //         const modified: string[] = [];
    //         const keys = new Set<string>([...Object.keys(original || {}), ...Object.keys(updated || {})]);
    //         keys.forEach(k => {
    //             if (exclude.has(k)) return;
    //             const a = original ? original[k] : undefined;
    //             const b = updated ? updated[k] : undefined;
    //             try {
    //                 if (JSON.stringify(a) !== JSON.stringify(b)) modified.push(k);
    //             } catch (e) {
    //                 // Fallback: do a coarse comparison
    //                 if (String(a) !== String(b)) modified.push(k);
    //             }
    //         });
    //         return modified.join(',');
    //     } catch (e) {
    //         logger.warn('computeFieldsModified failed', { err: String(e) });
    //         return '';
    //     }
    // }

    static DeleteOldEntriesQuery = db.prepare("DELETE FROM activity_log WHERE date < ?");
    static deleteOldEntries(): void {
        const oldest_to_keep = getTimeMS() - kActivityLogRetentionLength;

        ActivityLog.DeleteOldEntriesQuery.run(oldest_to_keep);
    }

    static getCSVHeaderFromColumn(column: number): string {
        switch (column) {
            case ActivityLog.CSV_Columns.Action:
                return "Action";
            case ActivityLog.CSV_Columns.On_Table:
                return "On Table";
            case ActivityLog.CSV_Columns.On_Entry:
                return "On Entry";
            case ActivityLog.CSV_Columns.Performed_By:
                return "Performed By";
            case ActivityLog.CSV_Columns.Date:
                return "Date";
            case ActivityLog.CSV_Columns.Fields_Changed:
                return "Fields Changed";
            case ActivityLog.CSV_Columns.Database_Id:
                return "Database Id";
            case ActivityLog.CSV_Columns.Edited_Entry_Database_Id:
                return "Edited Entry Database Id";
            default:
                return "Unknown Column";
        }
    }

    static getCSVHeaders(): string {
        return Array.from(Array(ActivityLog.CSV_Columns.Total_Column_Count), (x, i) => i).map((a) => ActivityLog.getCSVHeaderFromColumn(a)).join(",")+"\r\n";
    }

    toCSV(): string {
        if (this.id === -1) return "";
        const fields = [
            this.action,
            pretifyTableName(this.on_table),
            this.object_name,
            this.user,
            toStandardDateString(this.date),
            this.on_fields,
            this.id.toString(),
            this.on_id.toString()
        ];
        return fields.map((a) => `"${quoted_csv_sanitize(a)}"`).join(",")+"\r\n";
    }

    toJSON(): JSONActivityLog {
        if (this.id !== -1) {
            const object = getByTableAndId(this.on_table, this.on_id);
            this.object_is_active = object?.active ?? true;
        }
        const out = {...this};
        return out;
    }
}

interface ImportActivityLogCSVRow {
    id: number,
    user: string,
    date: number,
    action: string,
    on_table: string,
    on_id: number,
    on_fields: string,
    object_name: string,
    date_string: string,
}
export interface ImportActivityLogDataObject {
    id: number,
    user: string,
    date: number,
    action: string,
    on_table: string,
    on_id: number,
    on_fields: string,
    object_name: string,
    date_string: string,
};
export class ImportActivityLog {
    id: number;
    user: string;
    date: number;
    action: string;
    on_table: string;
    on_id: number;
    on_fields: string;
    object_name: string;
    date_string: string;
    object_is_active: boolean;

    constructor(data: ImportActivityLogDataObject) {
        this.id = data.id;
        this.user = data.user;
        this.date = data.date;
        this.action = data.action;
        this.on_table = data.on_table;
        this.on_id = data.on_id;
        this.on_fields = data.on_fields;
        this.object_name = data.object_name;
        this.date_string = data.date_string;
        this.object_is_active = true;
    }

    static readonly CSV_Columns = Object.freeze({
        Action: 0,
        On_Table: 1,
        On_Entry: 2,
        Performed_By: 3,
        Date: 4,
        Fields_Changed: 5,
        Database_Id: 6,
        Edited_Entry_Database_Id: 7,
        Total_Column_Count: 8
    });
    static readonly SQLGet_BaseFields = "SELECT id,user,date,action,on_table,on_id,on_fields,object_name,date_string FROM import_activity_log";
    
    static fromSQLData(data: ImportActivityLogCSVRow): ImportActivityLog {
        return new ImportActivityLog({
            id: data.id,
            user: data.user,
            date: data.date,
            action: data.action,
            on_table: data.on_table,
            on_id: data.on_id,
            on_fields: data.on_fields,
            object_name: data.object_name,
            date_string: data.date_string
        });
    }

    static GetAllQuery = db.prepare<[], ImportActivityLogCSVRow>(ImportActivityLog.SQLGet_BaseFields+" ORDER BY date DESC");
    static getAll_NoCache(): ImportActivityLog[] {
        const rows: ImportActivityLogCSVRow[] = ImportActivityLog.GetAllQuery.all();

        return rows.map(ImportActivityLog.fromSQLData);
    }
    static getAll(): ImportActivityLog[] {
        return getCache_AllImportActivityLogs();
    }

    // Record an activity log entry programmatically
    static RecordQuery = db.prepare("INSERT INTO import_activity_log (user,date,action,on_table,on_id,on_fields,object_name,date_string) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    static record(user: string, action: string, on_table: string, on_id: number, object_name: string, on_fields: string | string[]): void {
        try {
            const sanitizedUser = sanitize.toString(user || 'system', 100);
            const date = getTimeMS();
            const sanitizedObjectName = sanitize.toString(object_name || 'Unknown', 100);
            const fieldsStr = Array.isArray(on_fields) ? on_fields.join(',') : (on_fields || '');
            const date_string = toReadableFullDateString(date);
            const result = ImportActivityLog.RecordQuery.run(sanitizedUser, date, action, on_table, on_id, fieldsStr, sanitizedObjectName, date_string);
            const new_entry = new ImportActivityLog({
                id: Number(result.lastInsertRowid),
                user: sanitizedUser,
                date,
                action,
                on_table,
                on_id,
                on_fields: fieldsStr,
                object_name: sanitizedObjectName,
                date_string: date_string
            });
            updateCache_AddEntry_ImportActivityLog(new_entry);
            try { eventLogger.logEvent('ACTIVITY_LOG_CREATED', { user: sanitizedUser, action, on_table, on_id, fields: fieldsStr }); } catch (e) { logger.warn('Failed to emit ACTIVITY_LOG_CREATED event', { err: String(e) }); }
        } catch (e) {
            logger.error('Failed to write import_activity_log entry', { err: String(e), user, action, on_table, on_id, on_fields });
        }
    }

    static DeleteOldEntriesQuery = db.prepare("DELETE FROM import_activity_log WHERE date < ?");
    static deleteOldEntries(): void {
        const oldest_to_keep = getTimeMS() - kImportActivityLogRetentionLength;

        ImportActivityLog.DeleteOldEntriesQuery.run(oldest_to_keep);
    }

    static getCSVHeaderFromColumn(column: number): string {
        switch (column) {
            case ImportActivityLog.CSV_Columns.Action:
                return "Action";
            case ImportActivityLog.CSV_Columns.On_Table:
                return "On Table";
            case ImportActivityLog.CSV_Columns.On_Entry:
                return "On Entry";
            case ImportActivityLog.CSV_Columns.Performed_By:
                return "Performed By";
            case ImportActivityLog.CSV_Columns.Date:
                return "Date";
            case ImportActivityLog.CSV_Columns.Fields_Changed:
                return "Fields Changed";
            case ImportActivityLog.CSV_Columns.Database_Id:
                return "Database Id";
            case ImportActivityLog.CSV_Columns.Edited_Entry_Database_Id:
                return "Edited Entry Database Id";
            default:
                return "Unknown Column";
        }
    }

    static getCSVHeaders(): string {
        return Array.from(Array(ImportActivityLog.CSV_Columns.Total_Column_Count), (x, i) => i).map((a) => ImportActivityLog.getCSVHeaderFromColumn(a)).join(",")+"\r\n";
    }

    toCSV(): string {
        if (this.id === -1) return "";
        const fields = [
            this.action,
            pretifyTableName(this.on_table),
            this.object_name,
            this.user,
            toStandardDateString(this.date),
            this.on_fields,
            this.id.toString(),
            this.on_id.toString()
        ];
        return fields.map((a) => `"${quoted_csv_sanitize(a)}"`).join(",")+"\r\n";
    }

    toJSON(): JSONImportActivityLog {
        if (this.id !== -1) {
            const object = getByTableAndId(this.on_table, this.on_id);
            this.object_is_active = object?.active ?? true;
        }
        const out = {...this};
        return out;
    }
}


interface SecurityKeyTimestampCSVRow {
    timestamp: number
}
interface SecurityKeyKeyCSVRow {
    key: BinaryLike
}
export class SecurityKey {
    id: number;
    key: BinaryLike;
    timestamp: number;

    constructor(id: number, key: BinaryLike, timestamp: number) {
        this.id = id;
        this.key = key;
        this.timestamp = timestamp;
    }

    static GetCurrentTimestampQuery = db.prepare<[], SecurityKeyTimestampCSVRow>("SELECT timestamp FROM security_key ORDER BY timestamp DESC LIMIT 1")
    static getCurrentTimestamp(): number | null {
        const data: (SecurityKeyTimestampCSVRow | undefined) = SecurityKey.GetCurrentTimestampQuery.get();

        if (!data) {
            return null;
        }

        return data.timestamp;
    }

    static GetCurrentKeyQuery = db.prepare<[], SecurityKeyKeyCSVRow>("SELECT key FROM security_key ORDER BY timestamp DESC LIMIT 1");
    static getCurrentKey(): BinaryLike | null {
        const data: (SecurityKeyKeyCSVRow | undefined) = SecurityKey.GetCurrentKeyQuery.get();

        if (!data) {
            return null;
        }

        return data.key;
    }

    static UpdateKeyDeleteQuery = db.prepare("DELETE FROM security_key WHERE 1 = 1");
    static UpdateKeyRestoreQuery = db.prepare("INSERT INTO security_key (key, timestamp) VALUES (?, ?)");
    static UpdateKeyTransaction = db.transaction(() => {
        SecurityKey.UpdateKeyDeleteQuery.run();
        SecurityKey.UpdateKeyRestoreQuery.run(randomBytes(32), getTimeMS());
    });
    static updateKey(): void {
        SecurityKey.UpdateKeyTransaction();
    }

    // If we have to run .toJSON() on this, we are doing something badly wrong
}


interface AnnouncementCSVRow {
    id: number,
    date: number,
    expiration: number,
    text: string,
    color: string,
    displayed: boolean,
    priority: number,
    active: boolean,
    date_deleted: number,
    date_deleted_string: string,
}
export interface AnnouncementDataObject {
    id: number,
    date: number,
    expiration: number,
    text: string,
    color: string,
    displayed: boolean,
    priority: number,
    active: boolean,
    date_deleted: number,
    date_deleted_string: string,
}
export class Announcement {
    id: number;
    date: number;
    expiration: number;
    text: string;
    color: string;
    displayed: boolean;
    priority: number;
    isInDateRange: boolean;
    active: boolean;
    date_deleted: number;
    date_deleted_string: string;

    constructor(data: AnnouncementDataObject) {
        this.id = data.id;
        this.date = data.date;
        this.expiration = data.expiration;
        this.text = data.text;
        this.color = data.color;
        this.displayed = data.displayed;
        this.priority = data.priority;
        this.isInDateRange = inDateRange(getTimeMS(), this.date, this.expiration);
        this.active = data.active;
        this.date_deleted = data.date_deleted;
        this.date_deleted_string = data.date_deleted_string;
    }

    static readonly SQLGet_BaseFields = "SELECT id,date,expiration,text,color,displayed,priority,active,date_deleted,date_deleted_string FROM announcements";
    
    getFieldsModified(data: AnnouncementDataObject): string {
        let modified = "";
        if (data.text !== this.text) {
            modified += ", Text";
        }
        if (data.date !== this.date) {
            modified += ", Date";
        }
        if (data.expiration !== this.expiration) {
            modified += ", Expiration";
        }
        if (data.color !== this.color) {
            modified += ", Color";
        }
        if (data.displayed !== this.displayed) {
            modified += ", Displayed";
        }
        if (data.priority !== this.priority) {
            modified += ", Priority";
        }
        if (data.active !== this.active) {
            modified += ", Active";
        }
        if (data.date_deleted !== this.date_deleted || data.date_deleted_string !== this.date_deleted_string) {
            modified += ", Date Deleted";
        }

        if (modified === "") {
            return "None";
        }
        return modified.slice(2);
    };

    static AddToDatabaseQuery = db.prepare("INSERT INTO announcements (active, date, expiration, text, color, displayed, priority, date_deleted, date_deleted_string) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    addToDatabase(admin_username: string): number {
        const result = Announcement.AddToDatabaseQuery.run(
            this.active ? 1 : 0,
            this.date,
            this.expiration,
            this.text,
            this.color,
            this.displayed ? 1 : 0, 
            this.priority,
            this.date_deleted,
            this.date_deleted_string,
        );
        this.id = Number(result.lastInsertRowid);
        updateCache_AddEntry_Announcement(this);
        ActivityLog.record(admin_username, "Create", "announcements", this.id, clamp_string_to_length(this.text, 40), "All");
        return this.id;
    };
    static UpdateDatabaseEntryQuery = db.prepare("UPDATE announcements SET date = ?, expiration = ?, text = ?, color = ?, displayed = ?, priority = ?, active = ?, date_deleted = ?, date_deleted_string = ? WHERE id = ?");
    updateDatabaseEntry(admin_username: string, data: AnnouncementDataObject): void {
        const fields_modified = this.getFieldsModified(data);
        if (fields_modified !== "None") {
            ActivityLog.record(admin_username, "Edit", "announcements", this.id, clamp_string_to_length(this.text, 40), fields_modified);
            Announcement.UpdateDatabaseEntryQuery.run(
                data.date,
                data.expiration,
                data.text,
                data.color,
                data.displayed ? 1 : 0,
                data.priority,
                data.active ? 1 : 0,
                data.id,
                data.date_deleted,
                data.date_deleted_string,
            );
            updateCache_UpdateEntry_Announcement(data);
        }
    };
    static DatabaseEntrySetActiveQuery = db.prepare("UPDATE announcements SET active = ?, date_deleted = ?, date_deleted_string = ? WHERE id = ?");
    databaseEntrySetActive(admin_username: string, active: boolean): void {
        const date_deleted = getTimeMS();
        const date_deleted_string = toReadableFullDateString(date_deleted);
        Announcement.DatabaseEntrySetActiveQuery.run(active ? 1 : 0, date_deleted, date_deleted_string, this.id);
        updateCache_SetActive_Announcement(this.id, active, date_deleted, date_deleted_string);
        ActivityLog.record(admin_username, "Delete", "announcements", this.id, clamp_string_to_length(this.text, 40), "Active, Date Deleted");
    };
    // static DatabaseEntrySetDisplayedQuery = db.prepare("UPDATE announcements SET displayed = ? WHERE id = ?");
    databaseEntrySetDisplayed(admin_username: string, displayed: boolean): void {
        let data: AnnouncementDataObject = {...this};
        data.displayed = displayed;
        this.updateDatabaseEntry(admin_username, data);
        // Announcement.DatabaseEntrySetDisplayedQuery
        //     .run(displayed ? 1 : 0, id);
        // updateCache_SetDisplayed_Announcement(id, displayed);
    };
    static fromSQLData(data: AnnouncementCSVRow): Announcement {
        if (!data) {
            return Announcement.errorCode();
        }
        return new Announcement({
            id: data.id,
            date: data.date,
            expiration: data.expiration,
            text: data.text,
            color: data.color,
            displayed: data.displayed,
            priority: data.priority,
            active: data.active,
            date_deleted: data.date_deleted,
            date_deleted_string: data.date_deleted_string,
        });
    }

    static GetAllQuery = db.prepare<[], AnnouncementCSVRow>(Announcement.SQLGet_BaseFields);
    static getAll_NoCache(): Announcement[] {
        const rows: AnnouncementCSVRow[] = Announcement.GetAllQuery.all();

        return rows.map(Announcement.fromSQLData);
    }
    static getAll(allow_inactive: boolean = false): Announcement[] {
        return (allow_inactive ? getCache_AllAnnouncements() : getCache_AllActiveAnnouncements()) ?? [];
    }
    static getAllInactive(): Announcement[] {
        return getCache_AllAnnouncements().filter((a) => !a.active);
    }

    static getById(id: number, allow_inactive: boolean = true): Announcement {
        const announcement = getCache_AnnouncementById(id);
        if (!allow_inactive && announcement && announcement.active === false) return Announcement.errorCode();
        return announcement ?? Announcement.errorCode();
    }

    static readonly ERROR = Object.freeze(new Announcement({
        id: -1,
        date: 0,
        expiration: 0,
        text: "",
        color: "",
        displayed: false,
        priority: 0,
        active: true,
        date_deleted: 0,
        date_deleted_string: "",
    }));
    static errorCode(): Announcement {
        return Announcement.ERROR;
    }
    
    static isValidId(id: number): boolean {
        try {
            const sanitized = sanitize.toInt(id);
            return Boolean(Announcement.getById(sanitized).id !== -1);
        } catch {
            return false;
        }
    }

    toJSON(): JSONAnnouncement {
        if (this.id !== -1) {
            this.isInDateRange = inDateRange(getTimeMS(), this.date, this.expiration);
        }
        const out = {...this};
        return out;
    }
}


export interface ISPImportMaps {
    vendorsById: Map<number, ISP>;
    vendorsByFacility: Map<string, ISP>;
    vendorsByVendor: Map<string, ISP>;
}
interface ISPCSVRow {
    id: number,
    active: boolean,
    facility_id: number,
    vendor_id: number,
    port_circuit_id: string,
    account_number: string,
    notes: string,
    support_phone: string,
    ticket_portal_link: string,
    role: string,
    date_deleted: number,
    date_deleted_string: string,
}
export interface ISPDataObject {
    id: number,
    active: boolean,
    facility_id: number,
    vendor_id: number,
    port_circuit_id: string,
    account_number: string,
    notes: string,
    support_phone: string,
    ticket_portal_link: string,
    role: string,
    date_deleted: number,
    date_deleted_string: string,
};
export class ISP {
    id: number;
    active: boolean;
    facility_id: number;
    vendor_id: number;
    port_circuit_id: string;
    account_number: string;
    notes: string;
    support_phone: string;
    ticket_portal_link: string;
    role: string;
    date_deleted: number;
    date_deleted_string: string;

    facility_name: string;
    vendor_name: string;

    constructor(data: ISPDataObject) {
        this.id = data.id;
        this.active = data.active;
        this.facility_id = data.facility_id;
        this.vendor_id = data.vendor_id;
        this.port_circuit_id = data.port_circuit_id;
        this.account_number = data.account_number;
        this.notes = data.notes;
        this.support_phone = data.support_phone;
        this.ticket_portal_link = data.ticket_portal_link;
        this.role = data.role;
        let facility = Facility.getById(this.facility_id, false);
        this.facility_name = facility.name;
        let vendor = Vendor.getById(this.vendor_id, false);
        this.vendor_name = vendor.name;
        this.date_deleted = data.date_deleted;
        this.date_deleted_string = data.date_deleted_string;
    }

    static readonly SQLGet_BaseFields = "SELECT id,active,facility_id,vendor_id,port_circuit_id,account_number,notes,support_phone,ticket_portal_link,role,date_deleted,date_deleted_string FROM isp";

    getFieldsModified(data: ISPDataObject): string {
        let modified = "";
        if (data.facility_id !== this.facility_id) {
            modified += ", Facility";
        }
        if (data.vendor_id !== this.vendor_id) {
            modified += ", Vendor";
        }
        if (data.role !== this.role) {
            modified += ", Role";
        }
        if (data.port_circuit_id !== this.port_circuit_id) {
            modified += ", Port/Circuit Id";
        }
        if (data.account_number !== this.account_number) {
            modified += ", Account #";
        }
        if (data.support_phone !== this.support_phone) {
            modified += ", Phone";
        }
        if (data.ticket_portal_link !== this.ticket_portal_link) {
            modified += ", Ticket Portal";
        }
        if (data.notes !== this.notes) {
            modified += ", Notes";
        }
        if (data.date_deleted !== this.date_deleted || data.date_deleted_string !== this.date_deleted_string) {
            modified += ", Date Deleted";
        }

        if (modified === "") {
            return "None";
        }
        return modified.slice(2);
    };

    static AddToDatabaseQuery = db.prepare("INSERT INTO isp (active, facility_id, vendor_id, port_circuit_id, account_number, notes, support_phone, ticket_portal_link, role, date_deleted, date_deleted_string) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    addToDatabase(admin_username: string): number {
        const result = ISP.AddToDatabaseQuery.run(
            this.active ? 1 : 0,
            this.facility_id, 
            this.vendor_id,
            this.port_circuit_id,
            this.account_number,
            encryptFieldValue(this.notes),
            this.support_phone,
            this.ticket_portal_link,
            this.role,
            this.date_deleted,
            this.date_deleted_string,
        );
        this.id = Number(result.lastInsertRowid);
        updateCache_AddEntry_ISP(this);
        ActivityLog.record(admin_username, "Create", "isp", this.id, `${this.facility_name} (${this.vendor_name})`, "All");
        return this.id;
    };
    static UpdateDatabaseEntryQuery = db.prepare("UPDATE isp SET active = ?, facility_id = ?, vendor_id = ?, port_circuit_id = ?, account_number = ?, notes = ?, support_phone = ?, ticket_portal_link = ?, role = ?, date_deleted = ?, date_deleted_string = ? WHERE id = ?");
    updateDatabaseEntry(admin_username: string, data: ISPDataObject): void {
        const fields_modified = this.getFieldsModified(data);
        if (fields_modified !== "None") {
            ActivityLog.record(admin_username, "Edit", "isp", this.id, `${this.facility_name} (${this.vendor_name})`, "All");
            ISP.UpdateDatabaseEntryQuery.run(
                data.id,
                data.facility_id,
                data.vendor_id,
                data.port_circuit_id,
                data.account_number,
                encryptFieldValue(data.notes),
                data.support_phone,
                data.ticket_portal_link,
                data.role,
                data.date_deleted,
                data.date_deleted_string,
                data.id,
            );
            updateCache_UpdateEntry_ISP(data);
        }
    };
    static DatabaseEntrySetActiveQuery = db.prepare("UPDATE isp SET active = ?, date_deleted = ?, date_deleted_string = ? WHERE id = ?");
    databaseEntrySetActive(admin_username: string, active: boolean): void {
        const date_deleted = getTimeMS();
        const date_deleted_string = toReadableFullDateString(date_deleted);
        ISP.DatabaseEntrySetActiveQuery
            .run(active ? 1 : 0, date_deleted, date_deleted_string, this.id);
        updateCache_SetActive_ISP(this.id, active, date_deleted, date_deleted_string);
        ActivityLog.record(admin_username, active ? "Restore" : "Delete", "isp", this.id, `${this.facility_name} (${this.vendor_name})`, "Active, Date Deleted");
    };
    static fromSQLData(data: ISPCSVRow): ISP {
        if (!data) {
            return ISP.errorCode();
        }
        return new ISP({
            id: data.id,
            active: data.active,
            facility_id: data.facility_id,
            vendor_id: data.vendor_id,
            port_circuit_id: data.port_circuit_id,
            account_number: data.account_number,
            notes: (decryptFieldValueMaybe(data.notes) || ''),
            support_phone: data.support_phone,
            ticket_portal_link: data.ticket_portal_link,
            role: data.role,
            date_deleted: data.date_deleted,
            date_deleted_string: data.date_deleted_string,
        });
    }

    static GetAllQuery = db.prepare<[], ISPCSVRow>(ISP.SQLGet_BaseFields);
    static getAll_NoCache(): ISP[] {
        const rows: ISPCSVRow[] = ISP.GetAllQuery.all();

        return rows.map(ISP.fromSQLData);
    }
    static getAll(allow_inactive: boolean = false): ISP[] {
        return (allow_inactive ? getCache_AllISP() : getCache_AllActiveISP()) ?? [];
    }
    static getAllInactive(): ISP[] {
        return getCache_AllISP().filter((a) => !a.active);
    }

    static getById(id: number, allow_inactive: boolean = true): ISP {
        const isp = getCache_ISPById(id);
        if (!allow_inactive && isp && isp.active === false) return ISP.errorCode();
        return isp ?? ISP.errorCode();
    }

    static getByFacilityId(facility_id: number, allow_inactive: boolean = false): ISP[] {
        const isp = getCache_ISPByFacility(facility_id);
        return (allow_inactive ? isp : isp?.filter((a) => a.active)) ?? [];
    }

    static getByVendorId(vendor_id: number, allow_inactive: boolean = false): ISP[] {
        const isp = getCache_ISPByVendor(vendor_id);
        return (allow_inactive ? isp : isp?.filter((a) => a.active)) ?? [];
    }

    static isValidId(id: number, allow_inactive: boolean = false): boolean {
        try {
            const sanitized = sanitize.toInt(id);
            return Boolean(ISP.getById(sanitized, allow_inactive).id !== -1);
        } catch {
            return false;
        }
    }

    static readonly ERROR = Object.freeze(new ISP({
        id: -1,
        active: true,
        facility_id: -1,
        vendor_id: -1,
        port_circuit_id: "",
        account_number: "",
        notes: "",
        support_phone: "",
        ticket_portal_link: "",
        role: "",
        date_deleted: 0,
        date_deleted_string: "",
    }));
    static errorCode(): ISP {
        return ISP.ERROR;
    }

    toJSON(): JSONISP {
        if (this.id !== -1) {
            let facility = Facility.getById(this.facility_id, false);
            if (facility.id !== -1) {
                this.facility_name = facility.name;
            }else {
                this.facility_name = "";
            }
            let vendor = Vendor.getById(this.vendor_id, false);
            if (vendor.id !== -1) {
                this.vendor_name = vendor.name;
            }else {
                this.vendor_name = "";
            }
        }
        const out = {...this};
        return out;
    }
}
