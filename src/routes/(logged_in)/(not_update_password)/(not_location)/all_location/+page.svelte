<svelte:options runes={true} />
<script lang="ts">
    import AnnouncementBar from "$lib/components/AnnouncementBar.svelte";
    import ListPage from "$lib/components/ListPage.svelte";
    import ModalPopup from "$lib/components/ModalPopup.svelte";
    import { toReadableDateString, type NumberDropdownEntry } from "$lib/util";
    import Topbar from "$lib/components/Topbar.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import { browser } from "$app/environment";
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import { AllLocationColumns, getAssignVendorToRoleEntries_Location, getEntriesFromData_AllLocation, getNewLocationEntries_AllLocation } from "$lib/location_utils.js";
    import { onDestroy, tick } from "svelte";
    import { replaceState } from "$app/navigation";
    import { kDefaultJSONVendor, type JSONFacility, type JSONVendor } from "$lib/db_utils.js";

    let { form, data } = $props();

    let all_locations = $derived(getEntriesFromData_AllLocation(data.locations, data.warden_names));
    // let vendors = $derived(data.locations.filter((a) => !a.is_facility));
    let facilities = $derived(data.locations.filter((a) => a.is_facility));

    let facility_dropdown_entries: NumberDropdownEntry[] = $derived(facilities
        .map((a) => { return { title: a.name, value: a.id }; })
        .sort((a, b) => a.title.localeCompare(b.title)));

    let announcements = $derived(data.announcements.filter((a) => a.isInDateRange));

    // svelte-ignore state_referenced_locally
    let page_filter = $state(data.select_table === "all" ? "All" : (data.select_table === "vendors" ? "Vendor" : "Facility"));
    let locations = $derived(all_locations.filter((a) => 
        page_filter === "Facility" ? (a.self as (JSONFacility | JSONVendor)).is_facility : 
        page_filter === "Vendor" ? !(a.self as (JSONFacility | JSONVendor)).is_facility :
        true
    ));
    let page_title = $derived(page_filter === "All" ? "All Locations" : page_filter);

    function filter_page(new_value: string) {
        page_filter = new_value;
    };
    
    let newLocationPopup: (ModalPopup | undefined) = $state();
    function newLocationClickRaise() {
        if (!newLocationPopup) return;
        newLocationPopup.raisePopup();
    };
    let newLocationEntries = $derived(getNewLocationEntries_AllLocation());

    let assignVendorIndex = $state(0);
    let assignVendorPopup: (ModalPopup | undefined) = $state();
    function assignVendorClickRaise(id: number) {
        if (!assignVendorPopup) return;
        assignVendorIndex = id;
        assignVendorPopup.raisePopup();
    };
    let assignVendorEntry = $derived(assignVendorIndex < locations.length ? (locations[assignVendorIndex].self as JSONVendor) : kDefaultJSONVendor);
    let assignVendorEntries = $derived([
        ...getAssignVendorToRoleEntries_Location(assignVendorEntry, -1, facility_dropdown_entries)
    ]);

    $effect(() => {
        if (browser && form?.message) {
            alert(form?.message);
        }
    });

    let oldPageFilter = "facility"; // No, this should not be $state. In fact, if you make it such, you will brick the page.
    let pageAlive = true;
    $effect(() => {
        if (oldPageFilter !== page_filter) {
            oldPageFilter = page_filter;

            const new_table = page_filter === "Facility" ? "facility" : (page_filter === "All" ? "all" : "vendors");
            if (browser) {
                tick().then(() => {
                    if (!pageAlive) return;
                    replaceState("/all_location?select="+new_table, {});
                });
            }
        }
    });
    onDestroy(() => {
        pageAlive = false;
    });
</script>



{#each announcements as announce}
    {#if announce.displayed}
        <AnnouncementBar date={(toReadableDateString(announce.date))} text={announce.text} color={announce.color} />
    {/if}
{/each}

<Topbar user={data.user} profile_picture={data.profile_picture} isLoggedIn={true} isAdmin={data.user.privileges === "Admin"} name={data.user.name.length > 0 ? data.user.name : data.user.username} />


<ExpandingInterior>
    <ListPage 
        title={page_title} 
        columns={AllLocationColumns}
        entries={locations} 
        isAdmin={data.user.privileges === "Admin"} 
        hasNew={true} 
        hasEdit={false}
        hasAssignTo={true}
        assignToIsVendor={true}
        onClickNew={newLocationClickRaise}
        onClickAssignTo={assignVendorClickRaise}
        hasMapStaffVendor={true}
        columnsCollapseMobile={[false, true, false, false]}
        columnsCollapseMobilePortrait={[false, true, true, true]}
        titleAsDropDown={true}
        titleDropDownOptions={[
            { value: "Facility", title: "Only Facilities" }, 
            { value: "Vendor", title: "Only Vendors" }, 
            { value: "All", title: "All Locations" }
        ]}
        titleDropDownSelected={page_filter}
        onTitleDropdownChange={(new_value: string) => filter_page(new_value)}
        initialSearch={data.initial_search}
    />
</ExpandingInterior>

<Footer />

<ModalPopup
    title="New Location"
    action="newLocation"
    entries={newLocationEntries}
    useFormEnhance={true}
    bind:this={newLocationPopup}
/>

<ModalPopup
    title="Assign Vendor To Role"
    action="assignVendor"
    entries={assignVendorEntries}
    useFormEnhance={true}
    bind:this={assignVendorPopup}
/>

<style>

</style>