import { Facility } from '$lib/db.server';
import { type ExistingLayerImage } from '$lib/facility_map_utils.js';
import { addLayerFacilityMapAction, adjustLayerOrderFacilityMapAction, getExistingImages_FacilityMap, removeLayerFacilityMapAction } from '$lib/facility_map_utils.server';
import sanitize from '$lib/sanitize.server';
import { fail } from '@sveltejs/kit';


export const ssr = false;

export function load( { cookies, url, params, depends }) {
    // depends("facility:facility_map");

    const hack = url.pathname;
    /*  HACK: According to https://kit.svelte.dev/docs/load#rerunning-load-functions-when-do-load-functions-rerun
    load functions will not run when changing pages unless something referenced in the function, such as url, changes. Maybe could be replaced with invalidateAll()? 
    It must be url.pathname too, not just url.  */
    
    const facility = Facility.getById(sanitize.toInt(params.slug)).toJSON();
    const existing_images: ExistingLayerImage[] = getExistingImages_FacilityMap(facility);

    return {
        facility: facility,
        existing_images: existing_images
    };
};

function send_refreshed_data(facility_id: number) {
    const facility = Facility.getById(sanitize.toInt(facility_id)).toJSON();
    const existing_images: ExistingLayerImage[] = getExistingImages_FacilityMap(facility);
    
    return {
        facility: facility,
        existing_images: existing_images
    };
};

export const actions = {

    addLayer: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();
        const facility_id = sanitize.toInt(data.get("facility_id") as string);

        let result = await addLayerFacilityMapAction(cookies, data, url);
        
        if (result.success) {
            return send_refreshed_data(facility_id);
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },
    
    removeLayer: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();
        const facility_id = sanitize.toInt(data.get("facility_id") as string);

        let result = await removeLayerFacilityMapAction(cookies, data, url);
        
        if (result.success) {
            return send_refreshed_data(facility_id);
        }else {
            cookies.set("error-message", result.error_message, { path: "/" });
            return fail(400, { message: result.error_message });
        }
    },
    
    adjustLayerOrder: async ({ cookies, request, url }) => {

        const hack = url.pathname;
        const data = await request.formData();
        const facility_id = sanitize.toInt(data.get("facility_id") as string);

        let result = await adjustLayerOrderFacilityMapAction(cookies, data, url);
        
        if (result.success) {
            return send_refreshed_data(facility_id);
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