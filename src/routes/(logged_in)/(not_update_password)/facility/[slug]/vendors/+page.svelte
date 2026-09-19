<svelte:options runes={true} />
<script lang="ts">
    import { browser } from "$app/environment";
    import { replaceState } from "$app/navigation";
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import ListPage from "$lib/components/ListPage.svelte";
    import ModalPopup from "$lib/components/ModalPopup.svelte";
    import Topbar from "$lib/components/Topbar.svelte";
    import { kDefaultJSONVendor, type JSONFacility, type JSONVendor } from "$lib/db_utils.js";
    import { FacilityVendorColumns, getAddVendorEntries_Location, getAssignVendorToRoleEntries_Location, getRemoveVendorEntries_Location, getVendorsEntriesFromData_FacilityVendors, is_vendor_of } from "$lib/location_utils.js";
    import { clamp_string_to_length, type NumberDropdownEntry } from "$lib/util.js";
    import { onDestroy, tick } from "svelte";

    let { form, data } = $props();

    let facility = $derived(form?.facility ? form.facility : data.facility);
    let vendor_data = $derived(data.all_vendors);
    let vendors = $derived(getVendorsEntriesFromData_FacilityVendors(
        vendor_data.filter((a) => is_vendor_of(facility, a.id)),
        facility
    ));
    let oldFacility: (JSONFacility | null) = null; // No, this should not be $state(). In fact, if you make it such you will brick the page


    let facility_dropdown_entries: NumberDropdownEntry[] = $derived(data.all_locations
        .map((a) => { return { title: a.name, value: a.id }; })
        .sort((a, b) => a.title.localeCompare(b.title)));
    let vendor_dropdown_entries: NumberDropdownEntry[] = $derived(vendor_data
        .map((a) => { return { title: a.name, value: a.id }; })
        .sort((a, b) => a.title.localeCompare(b.title)));

    let newVendorPopup: (ModalPopup | undefined) = $state();
    function newVendorClickRaise() {
        if (!newVendorPopup) return;
        newVendorPopup.raisePopup();
    };
    let newVendorEntries = $derived([
        { type: "hidden_num", name: "page_facility_id", value: facility.id },
        ...getAddVendorEntries_Location(facility.id, -1, facility_dropdown_entries, vendor_dropdown_entries)
    ]);

    let assignVendorIndex = $state(0);
    let assignVendorPopup: (ModalPopup | undefined) = $state();
    function assignVendorClickRaise(id: number) {
        if (!assignVendorPopup) return;
        assignVendorIndex = id;
        assignVendorPopup.raisePopup();
    };
    let assignVendorEntry = $derived(assignVendorIndex < vendors.length ? (vendors[assignVendorIndex].self as JSONVendor) : kDefaultJSONVendor);
    let assignVendorEntries = $derived([
        { type: "hidden_num", name: "page_facility_id", value: facility.id },
        ...getAssignVendorToRoleEntries_Location(assignVendorEntry, facility.id, facility_dropdown_entries)
    ]);

    let deleteVendorIndex = $state(0);
    let deleteVendorPopup: (ModalPopup | undefined) = $state();
    function deleteVendorClickRaise(id: number) {
        if (!deleteVendorPopup) return;
        deleteVendorIndex = id;
        deleteVendorPopup.raisePopup();
    };
    let deleteVendorEntry = $derived(deleteVendorIndex < vendors.length ? (vendors[deleteVendorIndex].self as JSONVendor) : kDefaultJSONVendor);
    let deleteVendorEntries = $derived([
        { type: "hidden_num", name: "page_facility_id", value: facility.id },
        ...getRemoveVendorEntries_Location(facility, deleteVendorEntry)
    ]);

    $effect(() => {
        if (browser && form?.message) {
            alert(form?.message);
        }
    });

    let pageAlive = true;
    $effect(() => {
        if (oldFacility !== facility) {
            oldFacility = facility;

            const facility_id = facility.id;
            if (browser) {
                tick().then(() => {
                    if (!pageAlive) return;
                    replaceState("/facility/"+facility_id+"/vendors", {});
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
    showLocationDropdown={true} 
    allLocations={data.all_locations} 
    thisLocationName={facility.name} 
    thisLocationId={facility.id}
    thisLocationActive={facility.active} />

<ExpandingInterior>
    <ListPage
        title={clamp_string_to_length(facility.name, 50)+" Vendors"}
        columns={FacilityVendorColumns}
        entries={vendors}
        isAdmin={data.user.privileges === "Admin" && facility.active}
        hasNew={true}
        hasEdit={true}
        onlyDelete={true}
        hasMapStaffVendor={true}
        hasAssignTo={true}
        assignToIsVendor={true}
        onClickNew={newVendorClickRaise}
        onClickDelete={deleteVendorClickRaise}
        onClickAssignTo={assignVendorClickRaise}
        columnsCollapseMobile={[false, false, true, false, true]}
        columnsCollapseMobilePortrait={[false, false, true, true, true]}
        column_sorted_by={1}
        tintTitleRed={!facility.active}
    />
    <text-entry>
        <a href={"/facility/"+facility.id}>
            <button>
                Back to Facility
            </button>
        </a>
    </text-entry>
</ExpandingInterior>

<ModalPopup
    title="Add Vendor"
    action="newVendor"
    entries={newVendorEntries}
    useFormEnhance={true}
    bind:this={newVendorPopup}
/>

<ModalPopup
    title="Assign Vendor To Role"
    action="assignVendor"
    entries={assignVendorEntries}
    useFormEnhance={true}
    bind:this={assignVendorPopup}
/>

<ModalPopup
    title="Remove Vendor"
    action="deleteVendor"
    entries={deleteVendorEntries}
    useFormEnhance={true}
    bind:this={deleteVendorPopup}
/>

<Footer />

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