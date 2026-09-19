import { fail, redirect } from '@sveltejs/kit';
import { Facility, Staff, Vendor } from '$lib/db.server';
import sanitize from '$lib/sanitize.server';
import { deleteFacilityAction, removeStaffFromPositionAtFacility, removeVendorFromRoleAtFacility } from '$lib/location_utils.server';
import { getExistingContract_VendorContract } from '$lib/vendor_contract_utils.server';


export function load( { cookies, url, params }) {
    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */
    
    const facility = Facility.getById(sanitize.toInt(params.slug)).toJSON();

    const jms = Vendor.getById(facility.jms_id).toJSON();
    const ehr = Vendor.getById(facility.ehr_id).toJSON();
    const admin_phones = Vendor.getById(facility.admin_phones_id).toJSON();
    const inmate_phones = Vendor.getById(facility.inmate_phones_id).toJSON();
    const cable_tv = Vendor.getById(facility.cable_tv_id).toJSON();
    const mps = Vendor.getById(facility.mps_id).toJSON();
        
    const jms_contract = getExistingContract_VendorContract(facility.id, facility.jms_id);
    const ehr_contract = getExistingContract_VendorContract(facility.id, facility.ehr_id);
    const admin_phones_contract = getExistingContract_VendorContract(facility.id, facility.admin_phones_id);
    const inmate_phones_contract = getExistingContract_VendorContract(facility.id, facility.inmate_phones_id);
    const cable_tv_contract = getExistingContract_VendorContract(facility.id, facility.cable_tv_id);
    const mps_contract = getExistingContract_VendorContract(facility.id, facility.mps_id);

    const regional_warden = Staff.getById(facility.regional_warden_id).toJSON();
    const warden = Staff.getById(facility.warden_id).toJSON();
    const assistant_warden = Staff.getById(facility.assistant_warden_id).toJSON();
    const business_manager = Staff.getById(facility.business_manager_id).toJSON();
    const hr_manager = Staff.getById(facility.hr_manager_id).toJSON();
    const chief_of_security = Staff.getById(facility.chief_of_security_id).toJSON();
    const maintenance_supervisor = Staff.getById(facility.maintenance_supervisor_id).toJSON();
    const health_services_admin = Staff.getById(facility.health_services_admin_id).toJSON();
    const director_of_nursing = Staff.getById(facility.director_of_nursing_id).toJSON();

    return {
        jms: jms,
        ehr: ehr,
        admin_phones: admin_phones,
        inmate_phones: inmate_phones,
        cable_tv: cable_tv,
        mps: mps,
        
        jms_contract: jms_contract,
        ehr_contract: ehr_contract,
        admin_phones_contract: admin_phones_contract,
        inmate_phones_contract: inmate_phones_contract,
        cable_tv_contract: cable_tv_contract,
        mps_contract: mps_contract,

        regional_warden: regional_warden,
        warden: warden,
        assistant_warden: assistant_warden,
        business_manager: business_manager,
        hr_manager: hr_manager,
        chief_of_security: chief_of_security,
        maintenance_supervisor: maintenance_supervisor,
        health_services_admin: health_services_admin,
        director_of_nursing: director_of_nursing,
    };
};

function send_refreshed_data(facility_id: number) {
    const facility = Facility.getById(sanitize.toInt(facility_id)).toJSON();

    const jms = Vendor.getById(facility.jms_id).toJSON();
    const ehr = Vendor.getById(facility.ehr_id).toJSON();
    const admin_phones = Vendor.getById(facility.admin_phones_id).toJSON();
    const inmate_phones = Vendor.getById(facility.inmate_phones_id).toJSON();
    const cable_tv = Vendor.getById(facility.cable_tv_id).toJSON();
    const mps = Vendor.getById(facility.mps_id).toJSON();
        
    const jms_contract = getExistingContract_VendorContract(facility.id, facility.jms_id);
    const ehr_contract = getExistingContract_VendorContract(facility.id, facility.ehr_id);
    const admin_phones_contract = getExistingContract_VendorContract(facility.id, facility.admin_phones_id);
    const inmate_phones_contract = getExistingContract_VendorContract(facility.id, facility.inmate_phones_id);
    const cable_tv_contract = getExistingContract_VendorContract(facility.id, facility.cable_tv_id);
    const mps_contract = getExistingContract_VendorContract(facility.id, facility.mps_id);

    const regional_warden = Staff.getById(facility.regional_warden_id).toJSON();
    const warden = Staff.getById(facility.warden_id).toJSON();
    const assistant_warden = Staff.getById(facility.assistant_warden_id).toJSON();
    const business_manager = Staff.getById(facility.business_manager_id).toJSON();
    const hr_manager = Staff.getById(facility.hr_manager_id).toJSON();
    const chief_of_security = Staff.getById(facility.chief_of_security_id).toJSON();
    const maintenance_supervisor = Staff.getById(facility.maintenance_supervisor_id).toJSON();
    const health_services_admin = Staff.getById(facility.health_services_admin_id).toJSON();
    const director_of_nursing = Staff.getById(facility.director_of_nursing_id).toJSON();
    
    return {
        regional_warden: regional_warden,
        
        jms: jms,
        ehr: ehr,
        admin_phones: admin_phones,
        inmate_phones: inmate_phones,
        cable_tv: cable_tv,
        mps: mps,
        
        jms_contract: jms_contract,
        ehr_contract: ehr_contract,
        admin_phones_contract: admin_phones_contract,
        inmate_phones_contract: inmate_phones_contract,
        cable_tv_contract: cable_tv_contract,
        mps_contract: mps_contract,

        facility: facility,
        warden: warden,
        assistant_warden: assistant_warden,
        business_manager: business_manager,
        hr_manager: hr_manager,
        chief_of_security: chief_of_security,
        maintenance_supervisor: maintenance_supervisor,
        health_services_admin: health_services_admin,
        director_of_nursing: director_of_nursing,
    };
};

export const actions = {

    removeVendor: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();
        const facility_id = sanitize.toInt(data.get("facility_id") as string);

        let result = await removeVendorFromRoleAtFacility(cookies, data, url);

        if (result.success) {
            return send_refreshed_data(facility_id);
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    removeStaff: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();
        const facility_id = sanitize.toInt(data.get("facility_id") as string);

        let result = await removeStaffFromPositionAtFacility(cookies, data, url);

        if (result.success) {
            return send_refreshed_data(facility_id);
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    deleteFacility: async ({ cookies, request, url }) => {

		const hack = url.pathname;
        const data = await request.formData();
        
        const result = await deleteFacilityAction(cookies, data, url);
        
        if (result.success) {
            redirect(303, "/all_location/");
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    swapLocation: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();
        const newLocationId = sanitize.toInt(data.get("newLocationId") as string);

        const valid = Facility.isValidId(newLocationId);
        if (valid) {
            return send_refreshed_data(newLocationId);
        }else {
            cookies.set("error-message", "Request Could Not Be Processed: Inputs Out of Valid Range. Field: Id", { path: "/" });
            return fail(400, { message: "Request Could Not Be Processed: Inputs Out of Valid Range. Field: Id" });
        }
    },

};
