<svelte:options runes={true} />
<script lang="ts">
    import TableBox from "$lib/components/TableBox.svelte";
    import IconSave from "virtual:icons/mdi/content-save-outline";
    import IconCancel from "virtual:icons/mdi/cancel";
    import IconRevert from "virtual:icons/mdi/arrow-u-left-top";
    import IconInfo from "virtual:icons/mdi/help-circle-outline";
    import { getContext, onDestroy, tick } from "svelte";
    import ModalPopup from "$lib/components/ModalPopup.svelte";
    import Tooltip from "$lib/components/Tooltip.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import Map from "$lib/components/Map.svelte";
    import type { Writable } from "svelte/store";
    import { browser } from "$app/environment";
    import { replaceState } from "$app/navigation";
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import Topbar from "$lib/components/Topbar.svelte";
    import { kStatesArrayAlphabetized, type TableBoxEntry } from "$lib/util.js";
    import FormDropdown from "$lib/components/FormDropdown.svelte";
    import { FacilityAbbreviationExplanation, FacilityAddressExplanation, FacilityAdminPhonesExplanation, FacilityAssistantWardenExplanation, FacilityBusinessManagerExplanation, FacilityCableTVExplanation, FacilityChiefOfSecurityExplanation, FacilityDirectorOfNursingExplanation, FacilityDomainExplanation, FacilityEHRExplanation, FacilityFaxExplanation, FacilityGoogleMapsLinkExplanation, FacilityHealthServicesAdminExplanation, FacilityHotelExplanation, FacilityHotelLinkExplanation, FacilityHRManagerExplanation, FacilityInmatePhonesExplanation, FacilityInmateTypeExplanation, FacilityJMSExplanation, FacilityLatitudeExplanation, FacilityLongitudeExplanation, FacilityMaintenanceSupervisorExplanation, FacilityMapMarkerExplanation, FacilityMPSExplanation, FacilityNameExplanation, FacilityNotesExplanation, FacilityOnePassExplanation, FacilityPhoneExplanation, FacilityPopulationExplanation, FacilityRegionalWardenExplanation, FacilityStateExplanation, FacilityUKGCodesExplanation, FacilityWardenExplanation, getRemoveVendorFromRoleEntries_Location } from "$lib/location_utils.js";
    import { kDefaultJSONStaff, kDefaultJSONVendor, type JSONFacility, type JSONStaff, type JSONVendor } from "$lib/db_utils.js";
    import { enhance } from "$app/forms";
    import { getRemoveStaffEntries_Staff } from "$lib/staff_utils.js";
    import { getRemoveContractEntries_VendorContract, getUploadContractEntries_VendorContract, kDefaultContractPDF, type ExistingContractPDF } from "$lib/vendor_contract_utils.js";
    import { vendor_data_columns } from "$lib/csv_utils.js";

    let { form, data } = $props();

    let facility = $derived(form?.facility ? form.facility : data.facility);

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

    function getVendorFromRole(position: string): JSONVendor {
        switch (position) {
            case "jms":
                return jms;
            case "ehr":
                return ehr;
            case "admin_phones":
                return admin_phones;
            case "inmate_phones":
                return inmate_phones;
            case "cable_tv":
                return cable_tv;
            case "mps":
                return mps;
        }
        return kDefaultJSONVendor;
    };
    function getVendorContractFromRole(position: string): ExistingContractPDF {
        switch (position) {
            case "jms":
                return jms_contract;
            case "ehr":
                return ehr_contract;
            case "admin_phones":
                return admin_phones_contract;
            case "inmate_phones":
                return inmate_phones_contract;
            case "cable_tv":
                return cable_tv_contract;
            case "mps":
                return mps_contract;
        }
        return kDefaultContractPDF;
    };
    function getStaffFromPosition(position: string): JSONStaff {
        switch (position) {
            case "regional_warden":
                return regional_warden;
            case "warden":
                return warden;
            case "assistant_warden":
                return assistant_warden;
            case "business_manager":
                return business_manager;
            case "hr_manager":
                return hr_manager;
            case "chief_of_security":
                return chief_of_security;
            case "maintenance_supervisor":
                return maintenance_supervisor;
            case "health_services_admin":
                return health_services_admin;
            case "director_of_nursing":
                return director_of_nursing;
        }
        return kDefaultJSONStaff;
    };

    let facility_info: TableBoxEntry[] = $derived([
        { columns: [{ isLinked: false, link: "", value: "Name" }, { isLinked: false, link: "", value: facility.name, name: "name", min_length: 1, max_length: 100, hasTooltip: true, tooltipText: FacilityNameExplanation }] },
        { columns: [{ isLinked: false, link: "", value: "Abbrev." }, { isLinked: false, link: "", value: facility.abbreviation, name: "abbreviation", min_length: 1, max_length: 20, pattern: "[a-zA-Z0-9]{1,20}", warning: "Abbreviation can only include letters and numbers", hasTooltip: true, tooltipText: FacilityAbbreviationExplanation }] },
        { columns: [{ isLinked: false, link: "", value: "UKG Codes" }, { isLinked: false, link: "", value: facility.ukg_codes.join(", "), name: "ukg_codes", min_length: 0, max_length: 100, hasTooltip: true, tooltipText: FacilityUKGCodesExplanation }] },
        { columns: [{ isLinked: false, link: "", value: "Address" }, { isLinked: false, link: "", value: facility.address, name: "address", min_length: 0, max_length: 200, hasTooltip: true, tooltipText: FacilityAddressExplanation }] },
        { columns: [{ isLinked: false, link: "", value: "Phone" }, { validation: "phone", isLinked: false, link: "", value: facility.phone, name: "phone", min_length: 0, max_length: 20, hasTooltip: true, tooltipText: FacilityPhoneExplanation }] },
        { columns: [{ isLinked: false, link: "", value: "Fax" }, { validation: "phone", isLinked: false, link: "", value: facility.fax, name: "fax", min_length: 0, max_length: 20, hasTooltip: true, tooltipText: FacilityFaxExplanation }] }
    ]);
    function generate_system_info(display_name: string, name: string, object: JSONVendor, contract: ExistingContractPDF, tooltip: string): TableBoxEntry {
        return { columns: [{ isLinked: false, link: "", value: display_name }, { isNotFormEntry: true, isLinked: false, link: "", value: (object.id !== -1 ? object.name : ""), hasRemoveIcon: (object.id !== -1), removeIconIsVendor: true, onClickRemoveIcon: () => removeVendorClickRaise(name), hasAddDocumentIcon: (object.id !== -1), onClickAddDocumentIcon: () => uploadContractClickRaise(name), hasRemoveDocumentIcon: (object.id !== -1 && contract.exists), onClickRemoveDocumentIcon: () => removeContractClickRaise(name), hasTooltip: true, tooltipText: tooltip }] };
    }
    let systems_info: TableBoxEntry[] = $derived([
        generate_system_info("JMS", "jms", jms, jms_contract, FacilityJMSExplanation),
        generate_system_info("EHR", "ehr", ehr, ehr_contract, FacilityEHRExplanation),
        generate_system_info("Admin. Ph.", "admin_phones", admin_phones, admin_phones_contract, FacilityAdminPhonesExplanation),
        generate_system_info("Inmate Ph.", "inmate_phones", inmate_phones, inmate_phones_contract, FacilityInmatePhonesExplanation),
        generate_system_info("Cable TV", "cable_tv", cable_tv, cable_tv_contract, FacilityCableTVExplanation),
        generate_system_info("MPS", "mps", mps, mps_contract, FacilityMPSExplanation),
        { columns: [{ isLinked: false, link: "", value: "Domain" }, { isLinked: false, link: "", value: facility.domain, name: "domain", min_length: 0, max_length: 100, hasTooltip: true, tooltipText: FacilityDomainExplanation }] },
        // { columns: [{ isLinked: false, link: "", value: "JMS" }, { isNotFormEntry: true, isLinked: false, link: "", value: (jms.id !== -1 ? jms.name : ""), hasRemoveIcon: (jms.id !== -1), removeIconIsVendor: true, onClickRemoveIcon: () => removeVendorClickRaise("jms"), hasAddDocumentIcon: (jms.id !== -1), onClickAddDocumentIcon: () => removeVendorClickRaise("jms"), hasRemoveDocumentIcon: (jms.id !== -1 && jms_contract.exists), onClickRemoveDocumentIcon: () => removeVendorClickRaise("jms"), hasTooltip: true, tooltipText: FacilityJMSExplanation }] },
        // { columns: [{ isLinked: false, link: "", value: "EHR" }, { isNotFormEntry: true, isLinked: false, link: "", value: (ehr.id !== -1 ? ehr.name : ""), hasRemoveIcon: (ehr.id !== -1), removeIconIsVendor: true, onClickRemoveIcon: () => removeVendorClickRaise("ehr"), hasTooltip: true, tooltipText: FacilityEHRExplanation }] },
        // { columns: [{ isLinked: false, link: "", value: "Admin. Ph." }, { isNotFormEntry: true, isLinked: false, link: "", value: (admin_phones.id !== -1 ? admin_phones.name : ""), hasRemoveIcon: (admin_phones.id !== -1), removeIconIsVendor: true, onClickRemoveIcon: () => removeVendorClickRaise("admin_phones"), hasTooltip: true, tooltipText: FacilityAdminPhonesExplanation }] },
        // { columns: [{ isLinked: false, link: "", value: "Inmate Ph." }, { isNotFormEntry: true, isLinked: false, link: "", value: (inmate_phones.id !== -1 ? inmate_phones.name : ""), hasRemoveIcon: (inmate_phones.id !== -1), removeIconIsVendor: true, onClickRemoveIcon: () => removeVendorClickRaise("inmate_phones"), hasTooltip: true, tooltipText: FacilityInmatePhonesExplanation }] },
        // { columns: [{ isLinked: false, link: "", value: "Cable TV" }, { isNotFormEntry: true, isLinked: false, link: "", value: (cable_tv.id !== -1 ? cable_tv.name : ""), hasRemoveIcon: (cable_tv.id !== -1), removeIconIsVendor: true, onClickRemoveIcon: () => removeVendorClickRaise("cable_tv"), hasTooltip: true, tooltipText: FacilityCableTVExplanation }] },
        // { columns: [{ isLinked: false, link: "", value: "MPS" }, { isNotFormEntry: true, isLinked: false, link: "", value: (mps.id !== -1 ? mps.name : ""), hasRemoveIcon: (mps.id !== -1), removeIconIsVendor: true, onClickRemoveIcon: () => removeVendorClickRaise("mps"), hasTooltip: true, tooltipText: FacilityMPSExplanation }] },
        // { columns: [{ isLinked: false, link: "", value: "Domain" }, { isNotFormEntry: true, isLinked: false, link: "", value: facility.domain, name: "domain", min_length: 0, max_length: 100, hasTooltip: true, tooltipText: FacilityDomainExplanation }] },
    ]);
    let staff_info: TableBoxEntry[] = $derived([
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Regional Warden" }, { isNotFormEntry: true, isLinked: false, link: "", value: (regional_warden.id !== -1 ? regional_warden.name : ""), hasRemoveIcon: (regional_warden.id !== -1), onClickRemoveIcon: () => removeStaffClickRaise("regional_warden"), hasTooltip: true, tooltipText: FacilityRegionalWardenExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Warden" }, { isNotFormEntry: true, isLinked: false, link: "", value: (warden.id !== -1 ? warden.name : ""), hasRemoveIcon: (warden.id !== -1), onClickRemoveIcon: () => removeStaffClickRaise("warden"), hasTooltip: true, tooltipText: FacilityWardenExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Assistant Warden" }, { isNotFormEntry: true, isLinked: false, link: "", value: (assistant_warden.id !== -1 ? assistant_warden.name : ""), hasRemoveIcon: (assistant_warden.id !== -1), onClickRemoveIcon: () => removeStaffClickRaise("assistant_warden"), hasTooltip: true, tooltipText: FacilityAssistantWardenExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Business Manager" }, { isNotFormEntry: true, isLinked: false, link: "", value: (business_manager.id !== -1 ? business_manager.name : ""), hasRemoveIcon: (business_manager.id !== -1), onClickRemoveIcon: () => removeStaffClickRaise("business_manager"), hasTooltip: true, tooltipText: FacilityBusinessManagerExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "HR Manager" }, { isNotFormEntry: true, isLinked: false, link: "", value: (hr_manager.id !== -1 ? hr_manager.name : ""), hasRemoveIcon: (hr_manager.id !== -1), onClickRemoveIcon: () => removeStaffClickRaise("hr_manager"), hasTooltip: true, tooltipText: FacilityHRManagerExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Chief of Security" }, { isNotFormEntry: true, isLinked: false, link: "", value: (chief_of_security.id !== -1 ? chief_of_security.name : ""), hasRemoveIcon: (chief_of_security.id !== -1), onClickRemoveIcon: () => removeStaffClickRaise("chief_of_security"), hasTooltip: true, tooltipText: FacilityChiefOfSecurityExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Maint. Supervisor" }, { isNotFormEntry: true, isLinked: false, link: "", value: (maintenance_supervisor.id !== -1 ? maintenance_supervisor.name : ""), hasRemoveIcon: (maintenance_supervisor.id !== -1), onClickRemoveIcon: () => removeStaffClickRaise("maintenance_supervisor"), hasTooltip: true, tooltipText: FacilityMaintenanceSupervisorExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "HSA" }, { isNotFormEntry: true, isLinked: false, link: "", value: (health_services_admin.id !== -1 ? health_services_admin.name : ""), hasRemoveIcon: (health_services_admin.id !== -1), onClickRemoveIcon: () => removeStaffClickRaise("health_services_admin"), hasTooltip: true, tooltipText: FacilityHealthServicesAdminExplanation }] },
        { tintEntryRed: !facility.active, columns: [{ isLinked: false, link: "", value: "Director of Nursing" }, { isNotFormEntry: true, isLinked: false, link: "", value: (director_of_nursing.id !== -1 ? director_of_nursing.name : ""), hasRemoveIcon: (director_of_nursing.id !== -1), onClickRemoveIcon: () => removeStaffClickRaise("director_of_nursing"), hasTooltip: true, tooltipText: FacilityDirectorOfNursingExplanation }] },
    ]);
    let demographics_info: TableBoxEntry[] = $derived([
        { columns: [{ isLinked: false, link: "", value: "Population" }, { isLinked: false, link: "", value: facility.population, name: "population", min_length: 0, max_length: 100, hasTooltip: true, tooltipText: FacilityPopulationExplanation }] },
        { columns: [{ isLinked: false, link: "", value: "Inmate Type" }, { isLinked: false, link: "", value: facility.inmate_type, name: "inmate_type", min_length: 0, max_length: 100, hasTooltip: true, tooltipText: FacilityInmateTypeExplanation }] }
    ]);
    let hotels_info: TableBoxEntry[] = $derived([
        { columns: [{ isLinked: false, link: "", value: "Hotel 1" }, { isLinked: false, link: "", name: "hotel_1", value: facility.hotel_1, min_length: 0, max_length: 100, hasTooltip: true, tooltipText: FacilityHotelExplanation }] },
        { columns: [{ isLinked: false, link: "", value: "Hotel 1 Link" }, { validation: "url", isLinked: false, link: "", name: "hotel_1_link", value: facility.hotel_1_link, min_length: 0, max_length: 2000, hasTooltip: true, tooltipText: FacilityHotelLinkExplanation }] },
        { columns: [{ isLinked: false, link: "", value: "Hotel 2" }, { isLinked: false, link: "", name: "hotel_2", value: facility.hotel_2, min_length: 0, max_length: 100, hasTooltip: true, tooltipText: FacilityHotelExplanation }] },
        { columns: [{ isLinked: false, link: "", value: "Hotel 2 Link" }, { validation: "url", isLinked: false, link: "", name: "hotel_2_link", value: facility.hotel_2_link, min_length: 0, max_length: 2000, hasTooltip: true, tooltipText: FacilityHotelLinkExplanation }] },
        { columns: [{ isLinked: false, link: "", value: "Hotel 3" }, { isLinked: false, link: "", name: "hotel_3", value: facility.hotel_3, min_length: 0, max_length: 100, hasTooltip: true, tooltipText: FacilityHotelExplanation }] },
        { columns: [{ isLinked: false, link: "", value: "Hotel 3 Link" }, { validation: "url", isLinked: false, link: "", name: "hotel_3_link", value: facility.hotel_3_link, min_length: 0, max_length: 2000, hasTooltip: true, tooltipText: FacilityHotelLinkExplanation }] },
        { columns: [{ isLinked: false, link: "", value: "Hotel 4" }, { isLinked: false, link: "", name: "hotel_4", value: facility.hotel_4, min_length: 0, max_length: 100, hasTooltip: true, tooltipText: FacilityHotelExplanation }] },
        { columns: [{ isLinked: false, link: "", value: "Hotel 4 Link" }, { validation: "url", isLinked: false, link: "", name: "hotel_4_link", value: facility.hotel_4_link, min_length: 0, max_length: 2000, hasTooltip: true, tooltipText: FacilityHotelLinkExplanation }] },
    ]);
    
    let removeVendorPopup: (ModalPopup | undefined) = $state();
    function removeVendorClickRaise(position: string) {
        if (!removeVendorPopup) return;
        removeVendorPosition = position;
        removeVendorPopup.raisePopup();
    };
    let removeVendorPosition = $state("jms");
    let removeVendorEntries = $derived(getRemoveVendorFromRoleEntries_Location(getVendorFromRole(removeVendorPosition), facility, removeVendorPosition));
    
    let removeStaffPopup: (ModalPopup | undefined) = $state();
    function removeStaffClickRaise(position: string) {
        if (!removeStaffPopup) return;
        removeStaffPosition = position;
        removeStaffPopup.raisePopup();
    };
    let removeStaffPosition = $state("regional_warden");
    let removeStaffEntries = $derived(getRemoveStaffEntries_Staff(getStaffFromPosition(removeStaffPosition), facility, removeStaffPosition));

    let uploadContractPopup: (ModalPopup | undefined) = $state();
    function uploadContractClickRaise(position: string) {
        if (!uploadContractPopup) return;
        uploadContractPosition = position;
        uploadContractPopup.raisePopup();
    };
    let uploadContractPosition = $state("jms");
    let uploadContractEntries = $derived(getUploadContractEntries_VendorContract(facility, getVendorFromRole(uploadContractPosition), getVendorContractFromRole(uploadContractPosition)));

    let removeContractPopup: (ModalPopup | undefined) = $state();
    function removeContractClickRaise(position: string) {
        if (!removeContractPopup) return;
        removeContractPosition = position;
        removeContractPopup.raisePopup();
    };
    let removeContractPosition = $state("jms");
    let removeContractEntries = $derived(getRemoveContractEntries_VendorContract(facility, getVendorFromRole(removeContractPosition), getVendorContractFromRole(removeContractPosition)));


    function change_map_marker(event: MouseEvent) {
        entryNewValues[kMapX] = Math.round(event.clientX-(event.target as HTMLElement).getBoundingClientRect().x);
        entryNewValues[kMapY] = Math.round(event.clientY-(event.target as HTMLElement).getBoundingClientRect().y);
    };
    
    let oldFacility: (JSONFacility | null) = null; // No, this should not be $state(). In fact, if you make it such you will brick the page
    let pageAlive = true;
    $effect(() => {
        if (oldFacility !== facility) {
            oldFacility = facility;

            const facility_id = facility.id;
            if (browser) {
                tick().then(() => {
                    if (!pageAlive) return;
                    replaceState("/facility/"+facility_id+"/edit", {});
                });
            }
        }
    });
    onDestroy(() => {
        pageAlive = false;
    });

    const kNotes = 0;
    const kMapX = 1;
    const kMapY = 2;
    const kState = 3;
    const kGMapLink = 4;
    const kLatitude = 5;
    const kLongitude = 6;
    function getEditedValueArray(readFacility: JSONFacility) {
        return [
            readFacility.notes,
            readFacility.map_x,
            readFacility.map_y,
            readFacility.state,
            readFacility.google_map_link,
            readFacility.latitude,
            readFacility.longitude
        ];
    };
    // svelte-ignore state_referenced_locally
    let entryNewValues = $state(getEditedValueArray(facility));
    $effect(() => {
        entryNewValues = getEditedValueArray(facility);
    });
    let entryEdited = $derived(
        getEditedValueArray(facility).map((row: string | number, i: number) => 
            entryNewValues[i] !== getEditedValueArray(facility)[i]
        )
    );
    
    function revertEntry(index: number) {
        entryNewValues[index] = getEditedValueArray(facility)[index];
    };
    
    let isMobile: Writable<boolean> = getContext("isMobile");
    let isMobilePortrait: Writable<boolean> = getContext("isMobilePortrait");
    
    let stateDropdownOptions = $derived(kStatesArrayAlphabetized.map((a) => { return { title: a, value: a }; }));

    $effect(() => {
        if (browser && form?.message) {
            alert(form?.message);
        }
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

<form id="editPage" action="?/saveFacility" method="POST" use:enhance>
</form>
<input hidden form="editPage" type="number" value={entryNewValues[kMapX]} name="map_x">
<input hidden form="editPage" type="number" value={entryNewValues[kMapY]} name="map_y">
<input hidden form="editPage" type="number" value={facility.id} name="facility_id">
<ExpandingInterior>
    <all-stuff id={$isMobile ? "is-mobile" : ""}>
        <stuff-cont id={!$isMobile ? "top" : "mobile-top"}>
            <TableBox title="Facility Info" entries={facility_info} isInForm={true} form="editPage" hasIcons={false} usesEditHighlighting={true} />
        </stuff-cont>
        <stuff-cont id={!$isMobile ? "mid-left" : "mobile-mid-left"}>
            <TableBox title="Systems" entries={systems_info} isInForm={true} form="editPage" hasIcons={true} usesEditHighlighting={true} isAdmin={true} />
        </stuff-cont>
        <stuff-cont id={!$isMobile ? "mid-right" : "mobile-mid-right"}>
            <TableBox title="Staff" entries={staff_info} isInForm={true} form="editPage" hasIcons={true} isWide={true} usesEditHighlighting={true} isAdmin={true} />
        </stuff-cont>
        <stuff-cont id={!$isMobile ? "bot-left" : "mobile-bot-left"}>
            <TableBox title="Demographics" entries={demographics_info} isInForm={true} form="editPage" hasIcons={false} isWide={true} usesEditHighlighting={true} />
            <TableBox title="Hotels" entries={hotels_info} isInForm={true} form="editPage" hasIcons={false} isWide={true} usesEditHighlighting={true} />
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
                    <hideable class:hidden={!entryEdited[kNotes]}>
                        <Tooltip hover_text={"Revert"}>
                            <button class="button-as-blank-box link-box notes-button shifted-revert-icon" onclick={() => revertEntry(kNotes)} >
                                <IconRevert />
                            </button>
                        </Tooltip>
                    </hideable>
                </title-cont>
                <fill-box>
                    <textarea form="editPage" name="notes" rows="6" cols={!$isMobilePortrait ? 60 : 30} maxlength="4750" bind:value={entryNewValues[kNotes]} class:edited={entryEdited[kNotes]} ></textarea>
                </fill-box>
            </stuff>
        </stuff-cont>
        <stuff-cont id={!$isMobile ? "right" : "mobile-right"}>
            <size-limited>
                <button type="button" class="not-a button-as-blank-box map-cont" onclick={change_map_marker} id="map-cont">
                    <Map state={entryNewValues[kState] as string} map_x={entryNewValues[kMapX] as number} map_y={entryNewValues[kMapY] as number} />
                </button>
                <text-entry id="map-title" class="right-shifted" class:edited={entryEdited[kMapX] || entryEdited[kMapY]}>
                    Click on map to move marker.
                    <small-gap-left>
                        <Tooltip hover_text={FacilityMapMarkerExplanation}>
                            <not-a class="shifted-info-icon">
                                <IconInfo />
                            </not-a>
                        </Tooltip>
                    </small-gap-left>
                    <hideable class:hidden={!entryEdited[kMapX] && !entryEdited[kMapY]}>
                        <Tooltip hover_text={"Revert"}>
                            <button class="button-as-blank-box link-box notes-button shifted-revert-icon" onclick={() => {revertEntry(kMapX);revertEntry(kMapY);}} >
                                <IconRevert />
                            </button>
                        </Tooltip>
                    </hideable>
                </text-entry>

                <text-entry class="right-shifted">
                    <label for="state-selector">State: </label>
                    <FormDropdown 
                        entries={stateDropdownOptions}
                        form={"editPage"}
                        name={"state"}
                        bind:value={entryNewValues[kState]}
                        edited={entryEdited[kState]}
                        input_type="text"
                    />
                    <small-gap-left>
                        <Tooltip hover_text={FacilityStateExplanation}>
                            <not-a class="shifted-info-icon">
                                <IconInfo />
                            </not-a>
                        </Tooltip>
                    </small-gap-left>
                    <hideable class:hidden={!entryEdited[kState]}>
                        <Tooltip hover_text={"Revert"}>
                            <button class="button-as-blank-box link-box notes-button shifted-revert-icon" onclick={() => revertEntry(kState)} >
                                <IconRevert />
                            </button>
                        </Tooltip>
                    </hideable>
                </text-entry>
                <text-entry class="right-shifted">
                    Google Maps Link:
                    <small-gap-left>
                        <Tooltip hover_text={FacilityGoogleMapsLinkExplanation}>
                            <not-a class="shifted-info-icon">
                                <IconInfo />
                            </not-a>
                        </Tooltip>
                    </small-gap-left>
                    <hideable class:hidden={!entryEdited[kGMapLink]}>
                        <Tooltip hover_text={"Revert"}>
                            <button class="button-as-blank-box link-box notes-button shifted-revert-icon" onclick={() => revertEntry(kGMapLink)} >
                                <IconRevert />
                            </button>
                        </Tooltip>
                    </hideable>
                </text-entry>
                <text-entry id="gm-link">
                    <textarea form="editPage" name="google_map_link" rows="6" cols="20" maxlength="950" bind:value={entryNewValues[kGMapLink]} class:edited={entryEdited[kGMapLink]}></textarea>
                </text-entry>
                <text-entry class="flex-column">
                    <line class="right-shifted">
                        Latitude:
                        <small-gap-left>
                            <Tooltip hover_text={FacilityLatitudeExplanation}>
                                <not-a class="shifted-info-icon higher-info-icon">
                                    <IconInfo />
                                </not-a>
                            </Tooltip>
                        </small-gap-left>
                        <hideable class:hidden={!entryEdited[kLatitude]}>
                            <Tooltip hover_text={"Revert"}>
                                <button class="button-as-blank-box link-box notes-button shifted-revert-icon higher-revert-icon" onclick={() => revertEntry(kLatitude)} >
                                    <IconRevert />
                                </button>
                            </Tooltip>
                        </hideable>
                    </line>
                    <input type="number" step="any" form="editPage" name="latitude" min="18" max="72" bind:value={entryNewValues[kLatitude]} class:edited={entryEdited[kLatitude]}>
                    <line class="right-shifted">
                        Longitude:
                        <small-gap-left>
                            <Tooltip hover_text={FacilityLongitudeExplanation}>
                                <not-a class="shifted-info-iconn higher-info-icon">
                                    <IconInfo />
                                </not-a>
                            </Tooltip>
                        </small-gap-left>
                        <hideable class:hidden={!entryEdited[kLongitude]}>
                            <Tooltip hover_text={"Revert"}>
                                <button class="button-as-blank-box link-box notes-button shifted-revert-icon higher-revert-icon" onclick={() => revertEntry(kLongitude)} >
                                    <IconRevert />
                                </button>
                            </Tooltip>
                        </hideable>
                    </line>
                    <input type="number" step="any" form="editPage" name="longitude" min="-179" max="-66" bind:value={entryNewValues[kLongitude]} class:edited={entryEdited[kLongitude]}>
                </text-entry>
                <text-entry>
                    <Tooltip hover_text="Save Changes">
                        <!-- <button type="button" class="icon-button" onclick={() => saveFacilityClickRaise()}><IconSave /></button> -->
                        <button type="submit" class="icon-button" form="editPage"><IconSave /></button>
                    </Tooltip>
                    <Tooltip hover_text="Discard Changes">
                        <!-- <button type="button" class="icon-button" onclick={() => cancelFacilityClickRaise()}><IconCancel /></button> -->
                        <a href={"/facility/"+facility.id}>
                            <button type="button" class="icon-button"><IconCancel /></button>
                        </a>
                    </Tooltip>
                </text-entry>
            </size-limited>
        </stuff-cont>
    </all-stuff>
</ExpandingInterior>

<Footer />

<ModalPopup
    title="Remove Vendor from Position"
    action="removeVendor"
    entries={removeVendorEntries}
    useFormEnhance={true}
    bind:this={removeVendorPopup}
/>

<ModalPopup
    title="Remove Staff from Position"
    action="removeStaff"
    entries={removeStaffEntries}
    useFormEnhance={true}
    bind:this={removeStaffPopup}
/>

<ModalPopup
    title="Upload Vendor Contract"
    action="uploadContract"
    entries={uploadContractEntries}
    useFormEnhance={true}
    bind:this={uploadContractPopup}
    formWithFiles={true}
/>

<ModalPopup
    title="Remove Vendor Contract"
    action="removeContract"
    entries={removeContractEntries}
    useFormEnhance={true}
    bind:this={removeContractPopup}
/>

<style>

    .button-as-blank-box {
        background: none;
        color: inherit;
        /* border: 2px solid var(--accent5); */
        border: none;
        padding: 0;
        font: inherit;
        cursor: pointer;
        outline: inherit;
        text-align: left;
        border-radius: 0;
        line-height: inherit;
        letter-spacing: inherit;
    }
    .button-as-blank-box:focus {
        outline: var(--accent5) auto 2px;
    }

    form {
        width: 100%;
    }

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
        /* margin-top: 15%; */
        /* margin-bottom: 20%; */

        overflow-x: visible;
        white-space: nowrap;
    }
    .right-shifted {
        position: relative;
        left: 16px;
    }

    button {
        background-color: var(--accent5);
        color: var(--accent1);
        padding: 6px;
        width: 200px;
        /* border-radius: 15px; */
        font-size: var(--font-size3);
        /* max-height: 40px; */
        cursor: pointer;
    }

    .icon-button {
        /* width: auto; */
        padding: 5px;
        margin: 6px;
        width: 94px;
        height: 40px;

        font-size: var(--font-size4);
    }

    button:hover, .icon-button:hover {
        background-color: var(--accent4);
        color: var(--accent1);
    }
    
    textarea {
        color: var(--accent5);
        font-size: var(--font-size3);
        font-family: Arial, sans-serif;
        background-color: var(--accent0);
    }
    
    input, textarea {
        font-size: var(--font-size1);
        color: var(--accent5);
        background-color: var(--accent0);
    }
    input:invalid {
        background-color: var(--hover-red);
    }

    /* input {
        display: flex;
    } */

    #map-cont {
        margin-top: 39px;
        margin-bottom: 0px;
        display: block;
        box-sizing: content-box;
        margin-left: auto;
        margin-right: auto;
    }

    /* #map-title {
        margin-top: -50px;
    } */

    label {
        color: var(--accent5);
        font-size: var(--font-size3);
        margin-right: 10px;
    }

    #gm-link {
        margin-top: 0px;
    }

    textarea {
        resize: none;
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
        user-select: none;
        width: 304px;
        height: 304px;
        margin-left: 100px;
    }

    .map-cont:hover {
        background-color: var(--accent1);
    }


    input[type=number]::-webkit-inner-spin-button, 
    input[type=number]::-webkit-outer-spin-button { 
        -webkit-appearance: none; 
        margin: 0; 
    }
    input[type=number] {
        -moz-appearance: textfield;
        appearance: textfield;
    }

    .flex-column {
        flex-direction: column;
        gap: 5px;
    }

    .edited {
        background-color: var(--accentedited);
    }

    .link-box {
        font-weight: bold;
        /* font-size: var(--font-size3); */

        background-color: var(--transparent);
        transition: background-color 200ms;
        padding: 3px;

        color: var(--accentb);
        width: auto;
    }
    .link-box:hover {
        background-color: var(--hover);
        color: var(--accentb);
    }

    .notes-button {
        font-size: 16px;
        height: 1%;
    }

    line {
        display: flex;
        flex-direction: row;
    }

    hideable.hidden {
        opacity: 0;
        pointer-events: none;
    }

    gap-left {
        margin-left: 10px;
    }
    small-gap-left {
        margin-left: 4px;
    }
    
    .shifted-revert-icon {
        position: relative;
        top: 0px;

        display: inline-flex;
        gap: 2px;
        align-items: center;
    }
    .shifted-info-icon {
        position: relative;
        top: 2px;

        display: inline-flex;
        gap: 2px;
        align-items: center;
    }
    .higher-info-icon {
        top: -1px;
    }
    .higher-revert-icon {
        top: -3px;
    }

    stuff-cont {
        display: flex;
        flex-direction: column;
        gap: 30px;
    }

</style>