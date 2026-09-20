import Database from 'better-sqlite3';
// NOTE: All inputs into SQL queries in this module must be sanitized prior to usage.
// Use `src/lib/sanitize.ts` helpers to enforce typed conversions and limits.
// Always prefer parameterized queries (use ? placeholders) instead of string interpolation.
import { randomBytes, type BinaryLike } from 'crypto';


// interface FacilityCSVRow {

// }
// export interface FacilityDataObject {

// }
// export class Facility {

//     constructor(data: FacilityDataObject) {
        
//     }
//     static readonly SQLGet_BaseFields = "SELECT  FROM location";

//     static AddToDatabaseQuery = db.prepare("INSERT INTO location () VALUES ()");
//     addToDatabase(admin_username: string, is_import: boolean = false): number {
//         const result = Facility.AddToDatabaseQuery.run(
            
//         );
//         this.id = Number(result.lastInsertRowid);
//         updateCache_AddEntry_Facility(this);
//         (is_import ? ImportActivityLog : ActivityLog).record(admin_username, "Create", "facility", this.id, this.name, "All");
//         return this.id;
//     };
//     static UpdateDatabaseEntryQuery = db.prepare("UPDATE location SET state = ?, name = ?, abbreviation = ?, phone = ?, fax = ?, population = ?, google_map_link = ?, address = ?, domain = ?, jms_id = ?, ehr_id = ?, admin_phones_id = ?, inmate_phones_id = ?, cable_tv_id = ?, mps_id = ?, inmate_type = ?, regional_warden_id = ?, warden_id = ?, assistant_warden_id = ?, business_manager_id = ?, hr_manager_id = ?, chief_of_security_id = ?, maintenance_supervisor_id = ?, health_services_admin_id = ?, director_of_nursing_id = ?, hotel_1 = ?, hotel_1_link = ?, hotel_2 = ?, hotel_2_link = ?, hotel_3 = ?, hotel_3_link = ?, hotel_4 = ?, hotel_4_link = ?, notes = ?, map_x = ?, map_y = ?, vendors = ?, latitude = ?, longitude = ?, ukg_codes = ?, active = ?, date_deleted = ?, date_deleted_string = ?, map_layer_order = ? WHERE id = ?");
//     updateDatabaseEntry(admin_username: string, data: FacilityDataObject, is_import: boolean = false): void {
//         const fields_modified = this.getFieldsModified(data);
//         if (fields_modified !== "None") {
//             (is_import ? ImportActivityLog : ActivityLog).record(admin_username, "Edit", "facility", this.id, this.name, fields_modified);
//             Facility.UpdateDatabaseEntryQuery.run(
                
//             );
//             updateCache_UpdateEntry_Facility(data);
//         }
//     };
//     static DatabaseEntrySetActiveQuery = db.prepare("UPDATE location SET active = ?, date_deleted = ?, date_deleted_string = ? WHERE id = ?");
//     databaseEntrySetActive(
//         admin_username: string,
//         active: boolean
//     ): void {
//         const date_deleted = getTimeMS();
//         const date_deleted_string = toReadableFullDateString(date_deleted);
//         Facility.DatabaseEntrySetActiveQuery.run(active ? 1 : 0, date_deleted, date_deleted_string, this.id);
//         updateCache_SetActive_Facility(this.id, active, date_deleted, date_deleted_string);
//         ActivityLog.record(admin_username, active ? "Restore" : "Delete", "facility", this.id, this.name, "Active, Date Deleted");
//     };
//     static DatabaseEntrySetVendorsQuery = db.prepare("UPDATE location SET vendors = ? WHERE id = ?");
//     databaseEntrySetVendors(
//         admin_username: string,
//         vendor_name: string,
//         is_adding_vendors: boolean,
//         vendors: number[]
//     ): void {
//         Facility.DatabaseEntrySetVendorsQuery.run(vendors.join(","), this.id);
//         updateCache_SetVendors_Facility(this.id, vendors);
//         const action = is_adding_vendors ? "Add Vendor" : "Remove Vendor";
//         ActivityLog.record(admin_username, action, "facility", this.id, this.name, vendor_name);
//     };
//     static fromSQLData(data: FacilityCSVRow): Facility {
//         if (!data) {
//             return Facility.errorCode();
//         }
//         return new Facility({
//             id: data.id,
//             state: data.state,
//             name: data.name,
//             abbreviation: data.abbreviation,
//             phone: data.phone,
//             fax: data.fax,
//             population: data.population,
//             google_map_link: data.google_map_link,
//             address: data.address,
//             domain: data.domain,
//             jms_id: data.jms_id,
//             ehr_id: data.ehr_id,
//             admin_phones_id: data.admin_phones_id,
//             inmate_phones_id: data.inmate_phones_id,
//             cable_tv_id: data.cable_tv_id,
//             mps_id: data.mps_id,
//             inmate_type: data.inmate_type,
//             regional_warden_id: data.regional_warden_id,
//             warden_id: data.warden_id,
//             assistant_warden_id: data.assistant_warden_id,
//             business_manager_id: data.business_manager_id,
//             hr_manager_id: data.hr_manager_id,
//             chief_of_security_id: data.chief_of_security_id,
//             maintenance_supervisor_id: data.maintenance_supervisor_id,
//             health_services_admin_id: data.health_services_admin_id,
//             director_of_nursing_id: data.director_of_nursing_id,
//             hotel_1: data.hotel_1,
//             hotel_1_link: data.hotel_1_link,
//             hotel_2: data.hotel_2,
//             hotel_2_link: data.hotel_2_link,
//             hotel_3: data.hotel_3,
//             hotel_3_link: data.hotel_3_link,
//             hotel_4: data.hotel_4,
//             hotel_4_link: data.hotel_4_link,
//             notes: (decryptFieldValueMaybe(data.notes) || ''),
//             map_x: data.map_x,
//             map_y: data.map_y,
//             vendors: data.vendors ? data.vendors.split(",").map((a) => Number(a)) : [],
//             latitude: data.latitude,
//             longitude: data.longitude,
//             ukg_codes: data.ukg_codes ? data.ukg_codes.split(",") : [],
//             active: data.active,
//             date_deleted: data.date_deleted,
//             date_deleted_string: data.date_deleted_string,
//             map_layer_order: data.map_layer_order,
//         });
//     };

//     static GetAllQuery = db.prepare<[], FacilityCSVRow>(Facility.SQLGet_BaseFields);
//     static getAll_NoCache(): Facility[] {
//         const rows: FacilityCSVRow[] = Facility.GetAllQuery.all();

//         return rows.map(Facility.fromSQLData);
//     }
//     static getAll(allow_inactive: boolean = false): Facility[] {
//         return (allow_inactive ? getCache_AllFacilities() : getCache_AllActiveFacilities()) ?? [];
//     }
//     static getAllInactive(): Facility[] {
//         return getCache_AllFacilities().filter((a) => !a.active);
//     }
    
//     static getById(id: number, allow_inactive: boolean = true): Facility {
//         const facility = getCache_FacilityById(id);
//         if (!allow_inactive && facility && facility.active === false) return Facility.errorCode();
//         return facility ?? Facility.errorCode();
//     }

//     // Almost always you want getById.id !== -1 for fewer cache requests
//     static isValidId(id: number, allow_inactive: boolean = false): boolean {
//         try {
//             const sanitized = sanitize.toInt(id);
//             return Boolean(Facility.getById(sanitized, allow_inactive).id !== -1);
//         } catch {
//             return false;
//         }
//     }

//     static getCSVHeaderFromColumn(column: number): string {
//         switch (column) {
//             case Facility.CSV_Columns.Active:
//                 return "Active";
//             case Facility.CSV_Columns.Name:
//                 return "Name";
//             case Facility.CSV_Columns.Abbreviation:
//                 return "Abbreviation";
//             case Facility.CSV_Columns.UKG_Codes:
//                 return "UKG Codes";
//             case Facility.CSV_Columns.State:
//                 return "State";
//             case Facility.CSV_Columns.Address:
//                 return "Address";
//             case Facility.CSV_Columns.Phone:
//                 return "Phone";
//             case Facility.CSV_Columns.Fax:
//                 return "Fax";
//             case Facility.CSV_Columns.Regional_Warden:
//                 return "Regional Warden";
//             case Facility.CSV_Columns.Warden:
//                 return "Warden";
//             case Facility.CSV_Columns.Assistant_Warden:
//                 return "Assistant Warden";
//             case Facility.CSV_Columns.Business_Manager:
//                 return "Business Manager";
//             case Facility.CSV_Columns.HR_Manager:
//                 return "HR Manager";
//             case Facility.CSV_Columns.Chief_Of_Security:
//                 return "Chief of Security";
//             case Facility.CSV_Columns.Maintenance_Supervisor:
//                 return "Maintenance Supervisor";
//             case Facility.CSV_Columns.Health_Services_Admin:
//                 return "Health Services Admin";
//             case Facility.CSV_Columns.Director_Of_Nursing:
//                 return "Director of Nursing";
//             case Facility.CSV_Columns.HR_Manager:
//                 return "HR Manager";
//             case Facility.CSV_Columns.Chief_Of_Security:
//                 return "Chief of Security";
//             case Facility.CSV_Columns.Maintenance_Supervisor:
//                 return "Maintenance Supervisor";
//             case Facility.CSV_Columns.Health_Services_Admin:
//                 return "Health Services Admin";
//             case Facility.CSV_Columns.Director_Of_Nursing:
//                 return "Director of Nursing";
//             case Facility.CSV_Columns.Hotel1:
//                 return "Hotel 1";
//             case Facility.CSV_Columns.Hotel1Link:
//                 return "Hotel 1 Link";
//             case Facility.CSV_Columns.Hotel2:
//                 return "Hotel 2";
//             case Facility.CSV_Columns.Hotel2Link:
//                 return "Hotel 2 Link";
//             case Facility.CSV_Columns.Hotel3:
//                 return "Hotel 3";
//             case Facility.CSV_Columns.Hotel3Link:
//                 return "Hotel 3 Link";
//             case Facility.CSV_Columns.Hotel4:
//                 return "Hotel 4";
//             case Facility.CSV_Columns.Hotel4Link:
//                 return "Hotel 4 Link";
//             case Facility.CSV_Columns.Domain:
//                 return "Domain";
//             case Facility.CSV_Columns.JMS:
//                 return "JMS";
//             case Facility.CSV_Columns.EHR:
//                 return "EHR";
//             case Facility.CSV_Columns.Admin_Phone:
//                 return "Admin Phones";
//             case Facility.CSV_Columns.Inmate_Phone:
//                 return "Inmate Phones";
//             case Facility.CSV_Columns.Cable_TV:
//                 return "Cable TV";
//             case Facility.CSV_Columns.MPS:
//                 return "MPS";
//             case Facility.CSV_Columns.Population:
//                 return "Population";
//             case Facility.CSV_Columns.Inmate_Type:
//                 return "Inmate Type";
//             case Facility.CSV_Columns.Notes:
//                 return "Notes";
//             case Facility.CSV_Columns.Vendors:
//                 return "Vendors";
//             case Facility.CSV_Columns.Latitude:
//                 return "Latitude";
//             case Facility.CSV_Columns.Longitude:
//                 return "Longitude";
//             case Facility.CSV_Columns.Database_Id:
//                 return "Database Id";
//             case Facility.CSV_Columns.Vendor_Database_Ids:
//                 return "Vendor Database Ids";
//             case Facility.CSV_Columns.Map_X:
//                 return "Map X";
//             case Facility.CSV_Columns.Map_Y:
//                 return "Map Y";
//             case Facility.CSV_Columns.Google_Maps_Link:
//                 return "Google Maps Link";
//             default:
//                 return "Unknown Column";
//         }
//     }

//     static getCSVHeaders(): string {
//         return Array.from(Array(Facility.CSV_Columns.Total_Column_Count), (x, i) => i).map((a) => Facility.getCSVHeaderFromColumn(a)).join(",")+"\r\n";
//     }

//     toCSV(maps: FacilityExportMaps): string {
//         if (this.id === -1) return "";
//         const fields: string[] = [
//             this.active ? "TRUE" : "FALSE",
//             this.name,
//             this.abbreviation,
//             this.ukg_codes.join(","),
//             this.state,
//             this.address,
//             this.phone,
//             this.fax,
//             maps.staffById.get(this.regional_warden_id)?.name ?? "",
//             maps.staffById.get(this.warden_id)?.name ?? "",
//             maps.staffById.get(this.assistant_warden_id)?.name ?? "",
//             maps.staffById.get(this.business_manager_id)?.name ?? "",
//             maps.staffById.get(this.hr_manager_id)?.name ?? "",
//             maps.staffById.get(this.chief_of_security_id)?.name ?? "",
//             maps.staffById.get(this.maintenance_supervisor_id)?.name ?? "",
//             maps.staffById.get(this.health_services_admin_id)?.name ?? "",
//             maps.staffById.get(this.director_of_nursing_id)?.name ?? "",
//             this.domain,
//             maps.vendorsById.get(this.jms_id)?.name ?? "",
//             maps.vendorsById.get(this.ehr_id)?.name ?? "",
//             maps.vendorsById.get(this.admin_phones_id)?.name ?? "",
//             maps.vendorsById.get(this.inmate_phones_id)?.name ?? "",
//             maps.vendorsById.get(this.cable_tv_id)?.name ?? "",
//             maps.vendorsById.get(this.mps_id)?.name ?? "",
//             this.hotel_1,
//             this.hotel_1_link,
//             this.hotel_2,
//             this.hotel_2_link,
//             this.hotel_3,
//             this.hotel_3_link,
//             this.hotel_4,
//             this.hotel_4_link,
//             this.population,
//             this.inmate_type,
//             this.notes,
//             this.vendors.map((a) => maps.vendorsById.get(a)?.name ?? "").join(","),
//             this.latitude.toString(),
//             this.longitude.toString(),
//             this.id.toString(),
//             this.vendors.join(","),
//             this.map_x.toString(),
//             this.map_y.toString(),
//             this.google_map_link
//         ];
//         return fields.map((a) => `"${quoted_csv_sanitize(a)}"`).join(",")+"\r\n";
//     }

//     static loadFromCSV(line: string[], mode: string, user: string, maps: FacilityImportMaps): void {
//         const sline = line.map((v) => sanitize.toString(v));
//         // Notes encrypted by addToDatabase and updateDatabaseEntry

//         // Locate original
//         let original: (Facility | null) = null;
//         if (mode !== "add") {
//             if (original === null && hasValue(sline[Facility.CSV_Columns.Database_Id])) { // Database Id
//                 original = maps.facilitiesById.get(Number(sline[Facility.CSV_Columns.Database_Id])) ?? null;
//             }
//             if (original === null && hasValue(sline[Facility.CSV_Columns.Abbreviation])) { // Abbreviaton
//                 original = maps.facilitiesByAbbreviation.get(sline[Facility.CSV_Columns.Abbreviation].toLowerCase()) ?? null;
//             }
//             if (original === null && hasValue(sline[Facility.CSV_Columns.Name])) { // Name
//                 original = maps.facilitiesByName.get(sline[Facility.CSV_Columns.Name].toLowerCase()) ?? null;
//             }
//         }
//         if (original === null) {
//             original = Facility.errorCode();
//         }
//         const vendors: number[] = withFallback(sline[Facility.CSV_Columns.Vendor_Database_Ids], undefined, (a) => a.split(",").map((b) => Number(b.trim())))
//             ?? withFallback(sline[Facility.CSV_Columns.Vendors], original.vendors, (a) => a.split(",").map((b) => maps.vendorIdsByName.get(b.trim()) ?? null).filter((b) => b !== null));
//         // Build new
//         const updated: Facility = new Facility({
//             id:                     withFallback(sline[Facility.CSV_Columns.Database_Id], original.id, Number), //                              Id
//             state:                  withFallback(sline[Facility.CSV_Columns.State], original.state), //                                         State
//             name:                   withFallback(sline[Facility.CSV_Columns.Name], original.name), //                                           Name
//             abbreviation:           withFallback(sline[Facility.CSV_Columns.Abbreviation], original.abbreviation, (a) => a.toUpperCase()), //   Abbreviation
//             phone:                  parsePhoneToStandard(withFallback(sline[Facility.CSV_Columns.Phone], original.phone)).result, //            Phone
//             fax:                    withFallback(sline[Facility.CSV_Columns.Fax], original.fax), //                                             Fax
//             population:             withFallback(sline[Facility.CSV_Columns.Population], original.population), //                               Population
//             google_map_link:        withFallback(sline[Facility.CSV_Columns.Google_Maps_Link], original.google_map_link), //                    Google Maps Link
//             address:                withFallback(sline[Facility.CSV_Columns.Address], original.address), //                                     Address
//             domain:                 withFallback(sline[Facility.CSV_Columns.Domain], original.domain), //                                       Domain
//             jms_id:                 withFallback(sline[Facility.CSV_Columns.JMS], original.jms_id), //                                          JMS
//             ehr_id:                 withFallback(sline[Facility.CSV_Columns.EHR], original.ehr_id), //                                          EHR
//             admin_phones_id:        withFallback(sline[Facility.CSV_Columns.Admin_Phone], original.admin_phones_id), //                         Admin. Phones
//             inmate_phones_id:       withFallback(sline[Facility.CSV_Columns.Inmate_Phone], original.inmate_phones_id), //                       Inmate Phones
//             cable_tv_id:            withFallback(sline[Facility.CSV_Columns.Cable_TV], original.cable_tv_id), //                                Cable TV
//             mps_id:                 withFallback(sline[Facility.CSV_Columns.MPS], original.mps_id), //                                          MPS
//             inmate_type:            withFallback(sline[Facility.CSV_Columns.Inmate_Type], original.inmate_type), //                             Type
//             regional_warden_id:     withFallback(sline[Facility.CSV_Columns.Regional_Warden], original.regional_warden_id), //                  Regional Warden
//             warden_id:              withFallback(sline[Facility.CSV_Columns.Warden], original.warden_id), //                                    Warden
//             assistant_warden_id:    withFallback(sline[Facility.CSV_Columns.Assistant_Warden], original.assistant_warden_id), //                Asst. Warden
//             business_manager_id:    withFallback(sline[Facility.CSV_Columns.Business_Manager], original.business_manager_id), //                Business Manager
//             hr_manager_id:          withFallback(sline[Facility.CSV_Columns.HR_Manager], original.hr_manager_id), //                            HR Manager
//             chief_of_security_id:   withFallback(sline[Facility.CSV_Columns.Chief_Of_Security], original.chief_of_security_id), //              Chief of Security
//             maintenance_supervisor_id:withFallback(sline[Facility.CSV_Columns.Maintenance_Supervisor], original.maintenance_supervisor_id), //  Maintenance Supervisor
//             health_services_admin_id:withFallback(sline[Facility.CSV_Columns.Health_Services_Admin], original.health_services_admin_id), //     Health Services Admin
//             director_of_nursing_id: withFallback(sline[Facility.CSV_Columns.Director_Of_Nursing], original.director_of_nursing_id), //          Director of Nursing
//             hotel_1:                withFallback(sline[Facility.CSV_Columns.Hotel1], original.hotel_1), //                                      Hotel 1
//             hotel_1_link:           withFallback(sline[Facility.CSV_Columns.Hotel1Link], original.hotel_1_link), //                             Hotel 1 Link
//             hotel_2:                withFallback(sline[Facility.CSV_Columns.Hotel2], original.hotel_2), //                                      Hotel 2
//             hotel_2_link:           withFallback(sline[Facility.CSV_Columns.Hotel2Link], original.hotel_2_link), //                             Hotel 2 Link
//             hotel_3:                withFallback(sline[Facility.CSV_Columns.Hotel3], original.hotel_3), //                                      Hotel 3
//             hotel_3_link:           withFallback(sline[Facility.CSV_Columns.Hotel3Link], original.hotel_3_link), //                             Hotel 3 Link
//             hotel_4:                withFallback(sline[Facility.CSV_Columns.Hotel4], original.hotel_4), //                                      Hotel 4
//             hotel_4_link:           withFallback(sline[Facility.CSV_Columns.Hotel4Link], original.hotel_4_link), //                             Hotel 4 Link
//             notes:                  withFallback(sline[Facility.CSV_Columns.Notes], original.notes), //                                         Notes
//             map_x:                  withFallback(sline[Facility.CSV_Columns.Map_X], original.map_x, Number), //                                 Map X
//             map_y:                  withFallback(sline[Facility.CSV_Columns.Map_Y], original.map_y, Number), //                                 Map Y
//             vendors:                vendors, //                                                                                                 Vendors
//             latitude:               withFallback(sline[Facility.CSV_Columns.Latitude], original.latitude, Number), //                           Latitude
//             longitude:              withFallback(sline[Facility.CSV_Columns.Longitude], original.longitude, Number), //                         Longitude
//             ukg_codes:              withFallback(sline[Facility.CSV_Columns.UKG_Codes], original.ukg_codes, (a) => a.split(",").map((b) => b.trim().toUpperCase())), // Longitude
//             active:                 withFallback(sline[Facility.CSV_Columns.Active], original.active, (a) => a.toLowerCase() === "true" ? true : false), // Active
//             date_deleted:           original.date_deleted, //                                                                                   Date Deleted
//             date_deleted_string:    original.date_deleted_string, //                                                                            Date Deleted String
//             map_layer_order:        original.map_layer_order, //                                                                                Map Layer Order
//         });
//         // Process
//         handleImport(updated, original, original.id !== -1, mode, user);
//     }

//     importInsertNewDatabaseEntry(user: string): void {
//         this.addToDatabase(user, true);
//     };
//     importUpdateOldDatabaseEntry(user: string, original: Facility | Vendor | Staff): void {
//         (original as Facility).updateDatabaseEntry(user, this, true);
//     };

//     static readonly ERROR = Object.freeze(new Facility({
//         id: -1,
//         state: "LA",
//         name: "Facility Does Not Exist",
//         abbreviation: "",
//         phone: "",
//         fax: "",
//         population: "",
//         google_map_link: "",
//         address: "",
//         domain: "",
//         jms_id: -1,
//         ehr_id: -1,
//         admin_phones_id: -1,
//         inmate_phones_id: -1,
//         cable_tv_id: -1,
//         mps_id: -1,
//         inmate_type: "",
//         regional_warden_id: -1,
//         warden_id: -1,
//         assistant_warden_id: -1,
//         business_manager_id: -1,
//         hr_manager_id: -1,
//         chief_of_security_id: -1,
//         maintenance_supervisor_id: -1,
//         health_services_admin_id: -1,
//         director_of_nursing_id: -1,
//         hotel_1: "",
//         hotel_1_link: "",
//         hotel_2: "",
//         hotel_2_link: "",
//         hotel_3: "",
//         hotel_3_link: "",
//         hotel_4: "",
//         hotel_4_link: "",
//         notes: "",
//         map_x: -1,
//         map_y: -1,
//         vendors: [],
//         latitude: -1,
//         longitude: -1,
//         ukg_codes: [],
//         active: true,
//         date_deleted: 0,
//         date_deleted_string: "",
//         map_layer_order: "",
//     }));
//     static errorCode(): Facility {
//         return Facility.ERROR;
//     }

//     toJSON(): JSONFacility {
//         const out = {...this};
//         // delete out.is_facility;
//         return out;
//     }
// }