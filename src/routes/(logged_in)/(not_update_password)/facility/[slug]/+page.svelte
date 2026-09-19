<svelte:options runes={true} />
<script lang="ts">
    import TableBox from "$lib/components/TableBox.svelte";
    import IconTrash from "virtual:icons/mdi/trash-can-outline";
    import IconPencil from "virtual:icons/mdi/pencil-box-outline";
    import IconInfo from "virtual:icons/mdi/help-circle-outline";
    import { getContext, onDestroy, tick } from "svelte";
    import ModalPopup from "$lib/components/ModalPopup.svelte";
    import Tooltip from "$lib/components/Tooltip.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import Map from "$lib/components/Map.svelte";
    import { clockCurrentMilliseconds, getTimeMS, newlineify, stateTimeZones, toReadableFullDateString, type TableBoxEntry } from "$lib/util.js";
    import type { Writable } from "svelte/store";
    import { browser } from "$app/environment";
    import { replaceState } from "$app/navigation";
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import Topbar from "$lib/components/Topbar.svelte";
    import { FacilityAddressExplanation, FacilityAdminPhonesExplanation, FacilityAssistantWardenExplanation, FacilityBusinessManagerExplanation, FacilityCableTVExplanation, FacilityChiefOfSecurityExplanation, FacilityDirectorOfNursingExplanation, FacilityDomainExplanation, FacilityEHRExplanation, FacilityFaxExplanation, FacilityHealthServicesAdminExplanation, FacilityHotelExplanation, FacilityHRManagerExplanation, FacilityInmatePhonesExplanation, FacilityInmateTypeExplanation, FacilityJMSExplanation, FacilityMaintenanceSupervisorExplanation, FacilityMPSExplanation, FacilityNameExplanation, FacilityNotesExplanation, FacilityOnePassExplanation, FacilityPhoneExplanation, FacilityPopulationExplanation, FacilityRegionalWardenExplanation, FacilityWardenExplanation, getDeleteFacilityEntries_Facility, getRemoveVendorEntries_Location, getRemoveVendorFromRoleEntries_Location } from "$lib/location_utils.js";
    import { kDefaultJSONStaff, kDefaultJSONVendor, type JSONFacility, type JSONStaff, type JSONVendor } from "$lib/db_utils.js";
    import { getRemoveStaffEntries_Staff } from "$lib/staff_utils.js";
    import type { ExistingContractPDF } from "$lib/vendor_contract_utils.js";

    let { form, data } = $props();

    let facility: JSONFacility = $derived(form?.facility ? form.facility : data.facility);

    let jms = $derived(form?.jms ? form.jms : data.jms);
    let ehr = $derived(form?.ehr ? form.ehr : data.ehr);
    let admin_phones = $derived(form?.admin_phones ? form.admin_phones : data.admin_phones);
    let inmate_phones = $derived(form?.inmate_phones ? form.inmate_phones : data.inmate_phones);
    let cable_tv = $derived(form?.cable_tv ? form.cable_tv : data.cable_tv);
    let mps = $derived(form?.mps ? form.mps : data.mps);
    
    let jms_contract = $derived(form?.jms_contract ? form.jms_contract : data.jms_contract);
    let ehr_contract = $derived(form?.ehr_contract ? form.ehr_contract : data.ehr_contract);
    let admin_phones_contract = $derived(form?.admin_phones_contract ? form.admin_phones_contract : data.admin_phones_contract);
    let inmate_phones_contract = $derived(form?.inmate_phones_contract ? form.inmate_phones_contract : data.inmate_phones_contract);
    let cable_tv_contract = $derived(form?.cable_tv_contract ? form.cable_tv_contract : data.cable_tv_contract);
    let mps_contract = $derived(form?.mps_contract ? form.mps_contract : data.mps_contract);
    
    let regional_warden = $derived(form?.regional_warden ? form.regional_warden : data.regional_warden);
    let warden = $derived(form?.warden ? form.warden : data.warden);
    let assistant_warden = $derived(form?.assistant_warden ? form.assistant_warden : data.assistant_warden);
    let business_manager = $derived(form?.business_manager ? form.business_manager : data.business_manager);
    let hr_manager = $derived(form?.hr_manager ? form.hr_manager : data.hr_manager);
    let chief_of_security = $derived(form?.chief_of_security ? form.chief_of_security : data.chief_of_security);
    let maintenance_supervisor = $derived(form?.maintenance_supervisor ? form.maintenance_supervisor : data.maintenance_supervisor);
    let health_services_admin = $derived(form?.health_services_admin ? form.health_services_admin : data.health_services_admin);
    let director_of_nursing = $derived(form?.director_of_nursing ? form.director_of_nursing : data.director_of_nursing);
    
    let oldFacility: (JSONFacility | null) = null; // No, this should not be $state(). In fact, if you make it such you will brick the page
    // let vendor_link = $derived("/facility/"+(facility?.id ?? "")+"/vendors");
    // let staff_link = $derived("/facility/"+(facility?.id ?? "")+"/staff");

    let facility_info: TableBoxEntry[] = $derived([
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Name" }, { isLinked: false, link: "", value: facility.name+" ("+facility.abbreviation+")", hasTooltip: true, tooltipText: FacilityNameExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Address" }, { isLinked: true, link: facility.google_map_link, linkIsIcon: true, iconHoverText: "Google Maps", iconType: "open new", value: facility.address, hasTooltip: true, tooltipText: FacilityAddressExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Phone" }, { isLinked: false, link: "", value: facility.phone, hasTooltip: true, tooltipText: FacilityPhoneExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Fax" }, { isLinked: false, link: "", value: facility.fax, hasTooltip: true, tooltipText: FacilityFaxExplanation }] }
    ]);
    function generate_system_info(display_name: string, object: JSONVendor, contract: ExistingContractPDF, tooltip: string): TableBoxEntry {
        return { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: display_name }, { isLinked: (object.id !== -1), link: `/vendor/${object.id}/`, linkIsIcon: true, iconHoverText: "Open Vendor", iconType: "open new", value: (object.id !== -1 ? object.name : ""), hasDocumentIcon: (object.id !== -1 && contract.exists), documentIconLink: `/facility/${facility.id}/vendor_contract/${object.id}/`, hasTooltip: true, tooltipText: tooltip }] };
    }
    let systems_info: TableBoxEntry[] = $derived([
        generate_system_info("JMS", jms, jms_contract, FacilityJMSExplanation),
        generate_system_info("EHR", ehr, ehr_contract, FacilityEHRExplanation),
        generate_system_info("Admin. Ph.", admin_phones, admin_phones_contract, FacilityAdminPhonesExplanation),
        generate_system_info("Inmate Ph.", inmate_phones, inmate_phones_contract, FacilityInmatePhonesExplanation),
        generate_system_info("Cable TV", cable_tv, cable_tv_contract, FacilityCableTVExplanation),
        generate_system_info("MPS", mps, mps_contract, FacilityMPSExplanation),
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Domain" }, { isLinked: false, link: "", value: facility.domain, hasTooltip: true, tooltipText: FacilityDomainExplanation }] },
        // { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "JMS" }, { isLinked: (jms.id !== -1), link: `/vendor/${jms.id}/`, linkIsIcon: true, iconHoverText: "Open Vendor", iconType: "open new", value: (jms.id !== -1 ? jms.name : ""), hasTooltip: true, tooltipText: FacilityJMSExplanation }] },
        // { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "EHR" }, { isLinked: (ehr.id !== -1), link: `/vendor/${ehr.id}/`, linkIsIcon: true, iconHoverText: "Open Vendor", iconType: "open new", value: (ehr.id !== -1 ? ehr.name : ""), hasTooltip: true, tooltipText: FacilityEHRExplanation }] },
        // { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Admin. Ph." }, { isLinked: (admin_phones.id !== -1), link: `/vendor/${admin_phones.id}/`, linkIsIcon: true, iconHoverText: "Open Vendor", iconType: "open new", value: (admin_phones.id !== -1 ? admin_phones.name : ""), hasTooltip: true, tooltipText: FacilityAdminPhonesExplanation }] },
        // { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Inmate Ph." }, { isLinked: (inmate_phones.id !== -1), link: `/vendor/${inmate_phones.id}/`, linkIsIcon: true, iconHoverText: "Open Vendor", iconType: "open new", value: (inmate_phones.id !== -1 ? inmate_phones.name : ""), hasTooltip: true, tooltipText: FacilityInmatePhonesExplanation }] },
        // { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Cable TV" }, { isLinked: (cable_tv.id !== -1), link: `/vendor/${cable_tv.id}/`, linkIsIcon: true, iconHoverText: "Open Vendor", iconType: "open new", value: (cable_tv.id !== -1 ? cable_tv.name : ""), hasTooltip: true, tooltipText: FacilityCableTVExplanation }] },
        // { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "MPS" }, { isLinked: (mps.id !== -1), link: `/vendor/${mps.id}/`, linkIsIcon: true, iconHoverText: "Open Vendor", iconType: "open new", value: (mps.id !== -1 ? mps.name : ""), hasTooltip: true, tooltipText: FacilityMPSExplanation }] },
        // { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Domain" }, { isLinked: false, link: "", value: facility.domain, hasTooltip: true, tooltipText: FacilityDomainExplanation }] },
    ]);
    let staff_info: TableBoxEntry[] = $derived([
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Regional Warden" }, { isLinked: (regional_warden.id !== -1), link: "mailto:"+regional_warden.email, linkIsIcon: true, iconHoverText: "Mail To", iconType: "email", value: (regional_warden.id !== -1 ? regional_warden.name : ""), hasTooltip: true, tooltipText: FacilityRegionalWardenExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Warden" }, { isLinked: (warden.id !== -1), link: "mailto:"+warden.email, linkIsIcon: true, iconHoverText: "Mail To", iconType: "email", value: (warden.id !== -1 ? warden.name : ""), hasTooltip: true, tooltipText: FacilityWardenExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Assistant Warden" }, { isLinked: (assistant_warden.id !== -1), link: "mailto:"+assistant_warden.email, linkIsIcon: true, iconHoverText: "Mail To", iconType: "email", value: (assistant_warden.id !== -1 ? assistant_warden.name : ""), hasTooltip: true, tooltipText: FacilityAssistantWardenExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Business Manager" }, { isLinked: (business_manager.id !== -1), link: "mailto:"+business_manager.email, linkIsIcon: true, iconHoverText: "Mail To", iconType: "email", value: (business_manager.id !== -1 ? business_manager.name : ""), hasTooltip: true, tooltipText: FacilityBusinessManagerExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "HR Manager" }, { isLinked: (hr_manager.id !== -1), link: "mailto:"+hr_manager.email, linkIsIcon: true, iconHoverText: "Mail To", iconType: "email", value: (hr_manager.id !== -1 ? hr_manager.name : ""), hasTooltip: true, tooltipText: FacilityHRManagerExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Chief of Security" }, { isLinked: (chief_of_security.id !== -1), link: "mailto:"+chief_of_security.email, linkIsIcon: true, iconHoverText: "Mail To", iconType: "email", value: (chief_of_security.id !== -1 ? chief_of_security.name : ""), hasTooltip: true, tooltipText: FacilityChiefOfSecurityExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Maint. Supervisor" }, { isLinked: (maintenance_supervisor.id !== -1), link: "mailto:"+maintenance_supervisor.email, linkIsIcon: true, iconHoverText: "Mail To", iconType: "email", value: (maintenance_supervisor.id !== -1 ? maintenance_supervisor.name : ""), hasTooltip: true, tooltipText: FacilityMaintenanceSupervisorExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "HSA" }, { isLinked: (health_services_admin.id !== -1), link: "mailto:"+health_services_admin.email, linkIsIcon: true, iconHoverText: "Mail To", iconType: "email", value: (health_services_admin.id !== -1 ? health_services_admin.name : ""), hasTooltip: true, tooltipText: FacilityHealthServicesAdminExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Director of Nursing" }, { isLinked: (director_of_nursing.id !== -1), link: "mailto:"+director_of_nursing.email, linkIsIcon: true, iconHoverText: "Mail To", iconType: "email", value: (director_of_nursing.id !== -1 ? director_of_nursing.name : ""), hasTooltip: true, tooltipText: FacilityDirectorOfNursingExplanation }] },
    ]);
    let demographics_info: TableBoxEntry[] = $derived([
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Population" }, { isLinked: false, link: "", value: facility.population, hasTooltip: true, tooltipText: FacilityPopulationExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Inmate Type" }, { isLinked: false, link: "", value: facility.inmate_type, hasTooltip: true, tooltipText: FacilityInmateTypeExplanation }] },
    ]);
    let hotels_info: TableBoxEntry[] = $derived([
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Hotel 1" }, { isLinked: (facility.hotel_1_link !== ""), link: facility.hotel_1_link, linkIsIcon: true, iconHoverText: "Open In New", iconType: "open new", value: facility.hotel_1, hasTooltip: true, tooltipText: FacilityHotelExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Hotel 2" }, { isLinked: (facility.hotel_2_link !== ""), link: facility.hotel_2_link, linkIsIcon: true, iconHoverText: "Open In New", iconType: "open new", value: facility.hotel_2, hasTooltip: true, tooltipText: FacilityHotelExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Hotel 3" }, { isLinked: (facility.hotel_3_link !== ""), link: facility.hotel_3_link, linkIsIcon: true, iconHoverText: "Open In New", iconType: "open new", value: facility.hotel_3, hasTooltip: true, tooltipText: FacilityHotelExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Hotel 4" }, { isLinked: (facility.hotel_4_link !== ""), link: facility.hotel_4_link, linkIsIcon: true, iconHoverText: "Open In New", iconType: "open new", value: facility.hotel_4, hasTooltip: true, tooltipText: FacilityHotelExplanation }] },
    ]);

    let deleteFacilityPopup: (ModalPopup | undefined) = $state();
    function deleteFacilityClickRaise() {
        if (!deleteFacilityPopup) return;
        deleteFacilityPopup.raisePopup();
    };
    let deleteFacilityEntries = $derived(getDeleteFacilityEntries_Facility(facility));

    let time = $state(getTimeMS());

    
    let isMobile: Writable<boolean> = getContext("isMobile");
    let isMobilePortrait: Writable<boolean> = getContext("isMobilePortrait");

    
    $effect(() => {
        if (browser && form?.message) {
            alert(form?.message);
        }
    });

    let tickClockTimeout: (number | undefined) = $state();
    function tick_clock() {
        // time = getLocalTimeInState(facility.state);
        time = getTimeMS();
        clearTimeout(tickClockTimeout);
        tickClockTimeout = window.setTimeout(tick_clock, 1000 - clockCurrentMilliseconds());
    };
    let pageAlive = true;
    $effect(() => {
        if (oldFacility !== facility) {
            tick_clock();
            oldFacility = facility;

            const facility_id = facility.id;
            if (browser) {
                tick().then(() => {
                    if (!pageAlive) return;
                    replaceState("/facility/"+facility_id, {});
                });
            }
        }
    });
    onDestroy(() => {
        pageAlive = false;
        clearTimeout(tickClockTimeout);
    });
</script>

<Topbar user={data.user} profile_picture={data.profile_picture} 
    isLoggedIn={true} 
    isAdmin={data.user.privileges === "Admin"} 
    name={data.user.name.length > 0 ? data.user.name : data.user.username} 
    showLocationDropdown={true} 
    allLocations={data.all_locations} 
    thisLocationName={facility.name} 
    thisLocationId={facility.id}
    thisLocationActive={facility.active} />

<ExpandingInterior>
    <all-stuff id={$isMobile ? "is-mobile" : ""}>
        <stuff-cont id={!$isMobile ? "top" : "mobile-top"}>
            <TableBox title="Facility Info" entries={facility_info} hasIcons={true} tintEntriesRed={!facility.active} />
        </stuff-cont>
        <stuff-cont id={!$isMobile ? "mid-left" : "mobile-mid-left"}>
            <TableBox title="Systems" entries={systems_info} isAdmin={data.user.privileges === "Admin" && facility.active}  hasIcons={true} tintEntriesRed={!facility.active} />
        </stuff-cont>
        <stuff-cont id={!$isMobile ? "mid-right" : "mobile-mid-right"}>
            <TableBox title="Staff" entries={staff_info} isAdmin={data.user.privileges === "Admin" && facility.active}  hasIcons={true} isWide={true} tintEntriesRed={!facility.active} />
        </stuff-cont>
        <stuff-cont id={!$isMobile ? "bot-left" : "mobile-bot-left"}>
            <TableBox title="Demographics" entries={demographics_info} hasIcons={true} isWide={true} tintEntriesRed={!facility.active} />
            <TableBox title="Hotels" entries={hotels_info} hasIcons={true} isWide={true} tintEntriesRed={!facility.active} />
        </stuff-cont>
        <stuff-cont id={!$isMobile ? "bot-right" : "mobile-bot-right"}>
            <stuff>
                <title-cont>
                    Notes:
                    <gap-left>
                        <Tooltip hover_text={FacilityNotesExplanation}>
                            <not-a class="shifted-info-icon">
                                <IconInfo />
                            </not-a>
                        </Tooltip>
                    </gap-left>
                </title-cont>
                <fill-box class="min-sized" class:tint-red={!facility.active}>
                    {#each newlineify(facility.notes) as line}
                        {line} <br>
                    {/each}
                </fill-box>
            </stuff>
        </stuff-cont>
        <stuff-cont id={!$isMobile ? "right" : "mobile-right"}>
            <size-limited>
                <a class="text-entry map-cont" target="_blank" href={facility.google_map_link}>
                    <Map state = {facility.state} map_x = {facility.map_x} map_y = {facility.map_y} />
                </a>
                {#key time}
                    <text-entry class="local-time">
                        Local Time: {toReadableFullDateString(time, stateTimeZones[facility.state])}
                    </text-entry>
                {/key}
                <text-entry class="spaced upshifted">
                    <a href={"/facility/"+facility.id+"/facility_map"}>
                        <button>Facility Map</button>
                    </a>
                </text-entry>
                <text-entry class="spaced">
                    <a href={"/facility/"+facility.id+"/staff"}>
                        <button>Staff</button>
                    </a>
                </text-entry>
                <text-entry class="spaced">
                    <a href={"/facility/"+facility.id+"/vendors"}>
                        <button>Vendors</button>
                    </a>
                </text-entry>
                <text-entry class="spaced">
                    <a href={"/facility/"+facility.id+"/isp"}>
                        <button>ISP List</button>
                    </a>
                </text-entry>
                <text-entry class="spaced">
                    {#if data.user.privileges === "Admin" && facility.active}
                        <Tooltip hover_text="Edit Facility">
                            <a href={"/facility/"+facility.id+"/edit"}>
                                <button class="icon-button"><IconPencil /></button>
                            </a>
                        </Tooltip>
                        <Tooltip hover_text="Delete Facility">
                            <button class="icon-button delete-icon" onclick={deleteFacilityClickRaise} ><IconTrash /></button>
                        </Tooltip>
                    {/if}
                </text-entry>
            </size-limited>
        </stuff-cont>
    </all-stuff>
</ExpandingInterior>

<Footer />

<ModalPopup
    title="Delete Facility"
    action="deleteFacility"
    entries={deleteFacilityEntries}
    useFormEnhance={true}
    bind:this={deleteFacilityPopup}
/>

<style>
    all-stuff {
        display: grid;
        grid-template-columns: 1fr 1fr 300px;
        gap: 30px;
        grid-auto-rows: auto auto 1fr;
        margin: 20px;
        width: 94%;
        margin-left: 3%;
        margin-right: 3%;
    }
    #is-mobile {
        grid-template-columns: 1fr;
        grid-auto-rows: auto auto auto auto auto auto auto auto;
    }

    #top {
        grid-column: 1 / span 2;
        grid-row: 1;
    }
    #mid-left {
        grid-column: 1;
        grid-row: 2;
    }
    #mid-right {
        grid-column: 2;
        grid-row: 2;
    }
    #bot-left {
        grid-column: 1;
        grid-row: 3;
    }
    #bot-right {
        grid-column: 2;
        grid-row: 3;
    }
    #right {
        grid-column: 3;
        grid-row: 1 / span 3;
    }

    #mobile-top {
        grid-column: 1;
        grid-row: 1;
    }
    #mobile-mid-left {
        grid-column: 1;
        grid-row: 2;
    }
    #mobile-mid-right {
        grid-column: 1;
        grid-row: 3;
    }
    #mobile-bot-left {
        grid-column: 1;
        grid-row: 4;
    }
    #mobile-bot-right {
        grid-column: 1;
        grid-row: 5;
    }
    #mobile-right {
        grid-column: 1;
        grid-row: 6 / span 8;
    }
    

    title-cont {
        display: flex;
        text-decoration: none;

        color: var(--accent5);
        font-size: var(--font-size4);

        justify-content: left;
        align-items: center;

        margin: 8px;
        margin-top: 4px;
        margin-bottom: 4px;

        overflow-x: visible;
        white-space: nowrap;

        width: 100%;
    }

    fill-box {
        display: inline-block;
        background-color: var(--accent2);
        width: calc(100% - 24px);
        /* height: 150px; */
        border: 2px solid var(--accent5);
        padding: 10px;
        color: var(--accent5);
        font-size: var(--font-size1);
    }

    text-entry {
        display: flex;
        text-decoration: none;

        color: var(--accent5);
        font-size: var(--font-size3);

        justify-content: center;
        align-items: center;

        margin: 8px;
        margin-top: 12px;
        margin-bottom: 12px;

        /* margin-bottom: 20%; */

        /* overflow-x: visible;
        white-space: nowrap; */
    }

    /* .text-entry {
        display: flex;
    } */

    /* .spaced {
        margin-top: 20%;
    } */
    /* .upshifted {
        margin-top: -50px;
    } */

    button {
        background-color: var(--accent5);
        color: var(--accent1);
        padding: 6px;
        width: 200px;
        /* border-radius: 15px; */
        font-size: var(--font-size3);
        height: 40px;
        cursor: pointer;
    }

    .icon-button {
        /* width: auto; */
        padding: 5px;
        margin: 6px;
        width: 94px;

        font-size: var(--font-size4);
    }

    button:hover, .icon-button:hover {
        background-color: var(--accent4);
        color: var(--accent1);
    }
    
    a {
        text-decoration: none;
    }

    .min-sized {
        min-height: 75px;
    }

    .delete-icon:hover {
        background-color: var(--accentr);
    }

    size-limited {
        display: flex;
        max-width: 300px;
        flex-direction: column;
        align-items: center;
        margin-left: auto;
        margin-right: auto;
    }

    .map-cont {
        /* pointer-events: none; */
        margin-top: 39px;
    }
    
    .tint-red::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background-color: var(--hover-red);
        opacity: 0.30;
    }

    .tint-red {
        position: relative;
        z-index: 1;
    }

    gap-left {
        margin-left: 10px;
    }
    .shifted-info-icon {
        position: relative;
        top: 2px;

        display: inline-flex;
        gap: 2px;
        align-items: center;
    }

    .local-time {
        font-weight: bold;
    }

    stuff-cont {
        display: flex;
        flex-direction: column;
        gap: 30px;
    }

</style>