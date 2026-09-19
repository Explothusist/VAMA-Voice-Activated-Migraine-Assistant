<svelte:options runes={true} />
<script lang="ts">
    import { browser } from "$app/environment";
    import { replaceState } from "$app/navigation";
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import ListPage from "$lib/components/ListPage.svelte";
    import ModalPopup from "$lib/components/ModalPopup.svelte";
    import Topbar from "$lib/components/Topbar.svelte";
    import { kDefaultJSONFacility, type JSONFacility, type JSONVendor } from "$lib/db_utils.js";
    import { AllLocationColumns, getAddVendorEntries_Location, getFacilityEntriesFromData_VendorFacilities, getRemoveVendorEntries_Location, has_vendor } from "$lib/location_utils.js";
    import { clamp_string_to_length, type NumberDropdownEntry } from "$lib/util.js";
    import { onDestroy, tick } from "svelte";

    let { form, data } = $props();

    let vendor = $derived(form?.vendor ? form.vendor : data.vendor);
    let oldVendor: (JSONVendor | null) = null; // No, this should not be $state(). In fact, if you make it such you will brick the page


    let location_data = $derived(form?.all_facilities ? form.all_facilities : data.all_facilities);
    let warden_data = $derived(form?.warden_names ? form.warden_names : data.warden_names);
    let locations = $derived(getFacilityEntriesFromData_VendorFacilities(
        location_data.filter((a) => has_vendor(a, vendor.id)),
        vendor,
        warden_data.filter((a, i) => has_vendor(location_data[i], vendor.id)),
    ));


    const facility_dropdown_entries: NumberDropdownEntry[] = $derived.by(() => {
        let sorted = data.all_facilities.map((a: JSONFacility) => { return { title: a.name, value: a.id }; }).sort((a: NumberDropdownEntry, b: NumberDropdownEntry) => b.title.localeCompare(a.title));
        sorted.push({ title: "<Unassigned>", value: -1 });
        return sorted.reverse();
    });
    const vendor_dropdown_entries: NumberDropdownEntry[] = $derived.by(() => {
        let sorted = data.all_vendors.map((a: JSONVendor) => { return { title: a.name, value: a.id }; }).sort((a: NumberDropdownEntry, b: NumberDropdownEntry) => b.title.localeCompare(a.title));
        sorted.push({ title: "<Unassigned>", value: -1 });
        return sorted.reverse();
    });

    let newFacilityPopup: (ModalPopup | undefined) = $state();
    function newFacilityClickRaise() {
        if (!newFacilityPopup) return;
        newFacilityPopup.raisePopup();
    };
    let newFacilityEntries = $derived([
        { type: "hidden_num", name: "page_vendor_id", value: vendor.id },
        ...getAddVendorEntries_Location(-1, vendor.id, facility_dropdown_entries, vendor_dropdown_entries)
    ]);

    let deleteFacilityPopup: (ModalPopup | undefined) = $state();
    let deleteFacilityIndex = $state(0);
    function deleteFacilityClickRaise(id: number) {
        if (!deleteFacilityPopup) return;
        deleteFacilityIndex = id;
        deleteFacilityPopup.raisePopup();
    };
    let deleteFacilityEntry = $derived(deleteFacilityIndex < locations.length ? (locations[deleteFacilityIndex].self as JSONFacility) : kDefaultJSONFacility);
    let deleteFacilityEntries = $derived([
        { type: "hidden_num", name: "page_vendor_id", value: vendor.id },
        ...getRemoveVendorEntries_Location(deleteFacilityEntry, vendor)
    ]);


    $effect(() => {
        if (browser && form?.message) {
            alert(form?.message);
        }
    });

    let pageAlive = true;
    $effect(() => {
        if (oldVendor !== vendor) {
            oldVendor = vendor;

            if (browser) {
                const vendor_id = vendor.id;
                tick().then(() => {
                    if (!pageAlive) return;
                    replaceState("/vendor/"+vendor_id+"/facilities", {});
                });
            }
        }
    });
    onDestroy(() => {
        pageAlive = false;
    });
</script>

<Topbar user={data.user} profile_picture={data.profile_picture} 
    isLoggedIn={true} 
    isAdmin={data.user.privileges === "Admin"} 
    name={data.user.name.length > 0 ? data.user.name : data.user.username} 
    showVendorDropdown={true} 
    allVendors={data.all_vendors} 
    thisLocationName={vendor.name} 
    thisLocationId={vendor.id}
    thisLocationActive={vendor.active}
    thisLocationIsVendor={true} />

<ExpandingInterior>
    <ListPage
        title={clamp_string_to_length(vendor.name, 50)+" Facilities"}
        columns={AllLocationColumns}
        entries={locations}
        isAdmin={data.user.privileges === "Admin" && vendor.active}
        hasNew={true}
        hasEdit={true}
        onlyDelete={true}
        hasMapStaffVendor={true}
        columnsCollapseMobile={[false, true, false, false]}
        columnsCollapseMobilePortrait={[false, true, true, true]}
        onClickNew={newFacilityClickRaise}
        onClickDelete={deleteFacilityClickRaise}
        tintTitleRed={!vendor.active}
    />
    <text-entry>
        <a href={"/vendor/"+vendor.id}>
            <button>
                Back to Vendor
            </button>
        </a>
    </text-entry>
</ExpandingInterior>

<ModalPopup
    title="Assign To Facility"
    action="newFacility"
    entries={newFacilityEntries}
    useFormEnhance={true}
    bind:this={newFacilityPopup}
/>

<ModalPopup
    title="Remove From Facility"
    action="deleteFacility"
    entries={deleteFacilityEntries}
    useFormEnhance={true}
    bind:this={deleteFacilityPopup}
/>

<style>
    text-entry {
        display: flex;
        text-decoration: none;

        color: var(--accent5);
        font-size: var(--font-size3);

        justify-content: center;
        align-items: center;

        margin: 8px;
        margin-top: 4px;
        margin-bottom: 4px;

        overflow-x: visible;
        white-space: nowrap;
    }

    button {
        font-size: var(--font-size1);
        margin-left: 10px;
        background-color: var(--accent5);
        color: var(--accent1);
        padding: 6px;
        width: 200px;
        /* border-radius: 15px; */
        font-size: var(--font-size3);
        margin-bottom: 40px;
        cursor: pointer;
    }

    button:hover {
        background-color: var(--accent4);
        color: var(--accent1);
    }
    
</style>