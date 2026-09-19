import { Facility, Vendor } from '$lib/db.server';
import { addLayerFacilityMapAction } from '$lib/facility_map_utils.server';
import sanitize from '$lib/sanitize.server';
import type { ExistingContractPDF } from '$lib/vendor_contract_utils.js';
import { getExistingContract_VendorContract } from '$lib/vendor_contract_utils.server.js';
import { fail } from '@sveltejs/kit';


export const ssr = false;

export function load( { cookies, url, params, depends }) {
    // depends("facility:facility_map");

    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */
    
    const facility = Facility.getById(sanitize.toInt(params.slug)).toJSON();
    const vendor = Vendor.getById(sanitize.toInt(params.vslug)).toJSON();
    const existing_contract: ExistingContractPDF = getExistingContract_VendorContract(facility.id, vendor.id);

    return {
        vendor: vendor,
        existing_contract: existing_contract
    };
};

function send_refreshed_data(facility_id: number, vendor_id: number) {
    const facility = Facility.getById(sanitize.toInt(facility_id)).toJSON();
    const vendor = Vendor.getById(sanitize.toInt(vendor_id)).toJSON();
    const existing_contract: ExistingContractPDF = getExistingContract_VendorContract(facility.id, vendor.id);
    
    return {
        facility: facility,
        vendor: vendor,
        existing_contract: existing_contract
    };
};

export const actions = {

    addLayer: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();
        const facility_id = sanitize.toInt(data.get("facility_id") as string);
        const vendor_id = sanitize.toInt(data.get("vendor_id") as string);

        let result = await addLayerFacilityMapAction(cookies, data, url);
        
        if (result.success) {
            return send_refreshed_data(facility_id, vendor_id);
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },

    swapFacility: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();
        const newLocationId = sanitize.toInt(data.get("newLocationId") as string);
        const pageVendorId = sanitize.toInt(data.get("pageVendorId") as string);

        const valid = Facility.isValidId(newLocationId) && Vendor.isValidId(pageVendorId);
        if (valid) {
            return send_refreshed_data(newLocationId, pageVendorId);
        }else {
            cookies.set("error-message", "Request Could Not Be Processed: Inputs Out of Valid Range. Field: Id", { path: "/" });
            return fail(400, { message: "Request Could Not Be Processed: Inputs Out of Valid Range. Field: Id" });
        }
    },

};