<svelte:options runes={true} />
<script lang="ts">
    import { browser } from "$app/environment";
    import { replaceState } from "$app/navigation";
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import ListPage from "$lib/components/ListPage.svelte";
    import ModalPopup from "$lib/components/ModalPopup.svelte";
    import Topbar from "$lib/components/Topbar.svelte";
    import { kDefaultJSONISP, type JSONFacility, type JSONISP, type JSONVendor } from "$lib/db_utils.js";
    import { FacilityISPEntries, getDeleteISPEntries_ISP, getEditISPEntries_ISP, getEntriesFromData_ISP, getNewISPEntries_ISP, getViewISPEntries_ISP } from "$lib/isp_utils.js";
    import { clamp_string_to_length, type NumberDropdownEntry } from "$lib/util.js";
    import { onDestroy, tick } from "svelte";

    let { form, data } = $props();

    let facility = $derived(form?.facility ? form.facility : data.facility);
    let isp_data = $derived(form?.facility_isps ? form.facility_isps : data.facility_isps);
    let isps = $derived(getEntriesFromData_ISP(isp_data, viewISPClickRaise, false, true));
    let oldFacility: (JSONFacility | null) = null; // No, this should not be $state(). In fact, if you make it such you will brick the page


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

    let newISPPopup: (ModalPopup | undefined) = $state();
    function newISPClickRaise() {
        if (!newISPPopup) return;
        newISPPopup.raisePopup();
    };
    let newISPEntries = $derived([
        { type: "hidden_num", name: "page_facility_id", value: facility.id },
        ...getNewISPEntries_ISP(facility.id, -1, facility_dropdown_entries, vendor_dropdown_entries)
    ]);


    let editISPIndex = $state(0);
    let editISPPopup: (ModalPopup | undefined) = $state();
    function editISPClickRaise(id: number) {
        if (!editISPPopup) return;
        editISPIndex = id;
        editISPPopup.raisePopup();
    };
    let editISPEntry = $derived(editISPIndex < isps.length ? (isps[editISPIndex].self as JSONISP) : kDefaultJSONISP);
    let editISPEntries = $derived([
        { type: "hidden_num", name: "page_facility_id", value: facility.id },
        ...getEditISPEntries_ISP(editISPEntry, facility_dropdown_entries, vendor_dropdown_entries)
    ]);


    let deleteISPIndex = $state(0);
    let deleteISPPopup: (ModalPopup | undefined) = $state();
    function deleteISPClickRaise(id: number) {
        if (!deleteISPPopup) return;
        deleteISPIndex = id;
        deleteISPPopup.raisePopup();
    };
    let deleteISPEntry = $derived(deleteISPIndex < isps.length ? (isps[deleteISPIndex].self as JSONISP) : kDefaultJSONISP);
    let deleteISPEntries = $derived([
        { type: "hidden_num", name: "page_facility_id", value: facility.id },
        ...getDeleteISPEntries_ISP(deleteISPEntry)
    ]);


    let viewISPIndex = $state(0);
    let viewISPPopup: (ModalPopup | undefined) = $state();
    function viewISPClickRaise(id: number) {
        if (!viewISPPopup) return;
        viewISPIndex = id;
        viewISPPopup.raisePopup();
    };
    let viewISPEntry = $derived(viewISPIndex < isps.length ? (isps[viewISPIndex].self as JSONISP) : kDefaultJSONISP);
    let viewISPEntries = $derived(getViewISPEntries_ISP(viewISPEntry));

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
                    replaceState("/facility/"+facility_id+"/isp", {});
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
        title={clamp_string_to_length(facility.name, 50)+" Internet Service Providers"}
        columns={FacilityISPEntries}
        entries={isps}
        isAdmin={data.user.privileges === "Admin" && facility.active}
        hasNew={true}
        hasEdit={true}
        hasFacilityVendor={true}
        onClickNew={() => newISPClickRaise()}
        onClickEdit={(id: number) => editISPClickRaise(id)}
        onClickDelete={(id: number) => deleteISPClickRaise(id)}
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
    title="Create ISP"
    action="newISP"
    entries={newISPEntries}
    useFormEnhance={true}
    bind:this={newISPPopup}
/>

<ModalPopup
    title="Edit ISP"
    action="editISP"
    entries={editISPEntries}
    useFormEnhance={true}
    usesEditHighlighting={true}
    bind:this={editISPPopup}
/>

<ModalPopup
    title="Delete ISP"
    action="deleteISP"
    entries={deleteISPEntries}
    useFormEnhance={true}
    bind:this={deleteISPPopup}
/>

<ModalPopup
    title="View ISP"
    action="__N/A__"
    entries={viewISPEntries}
    hasConfirm={false}
    bind:this={viewISPPopup}
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