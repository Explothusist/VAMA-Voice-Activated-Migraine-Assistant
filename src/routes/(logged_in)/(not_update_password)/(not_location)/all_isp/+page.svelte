<svelte:options runes={true} />
<script lang="ts">
    import ListPage from "$lib/components/ListPage.svelte";
    import ModalPopup from "$lib/components/ModalPopup.svelte";
    import Topbar from "$lib/components/Topbar.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import { browser } from "$app/environment";
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import { AllISPEntries, getDeleteISPEntries_ISP, getEditISPEntries_ISP, getEntriesFromData_ISP, getNewISPEntries_ISP, getViewISPEntries_ISP } from "$lib/isp_utils.js";
    import { kDefaultJSONISP, type JSONFacility, type JSONISP, type JSONVendor } from "$lib/db_utils.js";
    import type { NumberDropdownEntry } from "$lib/util.js";
    
    let { form, data } = $props();

    let isp_data = $derived(form?.isps ? form.isps : data.isps);
    let isps = $derived(getEntriesFromData_ISP(isp_data, viewISPClickRaise, true, true));


    const facility_dropdown_entries: NumberDropdownEntry[] = $derived.by(() => {
        let sorted: NumberDropdownEntry[] = data.all_facilities.map((a: JSONFacility) => { return { title: a.name, value: a.id }; }).sort((a: NumberDropdownEntry, b: NumberDropdownEntry) => b.title.localeCompare(a.title));
        sorted.push({ title: "<Unassigned>", value: -1 });
        return sorted.reverse();
    });
    const vendor_dropdown_entries: NumberDropdownEntry[] = $derived.by(() => {
        let sorted: NumberDropdownEntry[] = data.all_vendors.map((a: JSONVendor) => { return { title: a.name, value: a.id }; }).sort((a: NumberDropdownEntry, b: NumberDropdownEntry) => b.title.localeCompare(a.title));
        sorted.push({ title: "<Unassigned>", value: -1 });
        return sorted.reverse();
    });

    let newISPPopup: (ModalPopup | undefined) = $state();
    function newISPClickRaise() {
        if (!newISPPopup) return;
        newISPPopup.raisePopup();
    };
    let newISPEntries = $derived(getNewISPEntries_ISP(-1, -1, facility_dropdown_entries, vendor_dropdown_entries));


    let editISPIndex = $state(0);
    let editISPPopup: (ModalPopup | undefined) = $state();
    function editISPClickRaise(id: number) {
        if (!editISPPopup) return;
        editISPIndex = id;
        editISPPopup.raisePopup();
    };
    let editISPEntry = $derived(editISPIndex < isps.length ? (isps[editISPIndex].self as JSONISP) : kDefaultJSONISP);
    let editISPEntries = $derived(getEditISPEntries_ISP(editISPEntry, facility_dropdown_entries, vendor_dropdown_entries));


    let deleteISPIndex = $state(0);
    let deleteISPPopup: (ModalPopup | undefined) = $state();
    function deleteISPClickRaise(id: number) {
        if (!deleteISPPopup) return;
        deleteISPIndex = id;
        deleteISPPopup.raisePopup();
    };
    let deleteISPEntry = $derived(deleteISPIndex < isps.length ? (isps[deleteISPIndex].self as JSONISP) : kDefaultJSONISP);
    let deleteISPEntries = $derived(getDeleteISPEntries_ISP(deleteISPEntry));


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
</script>

<Topbar user={data.user} profile_picture={data.profile_picture} isLoggedIn={true} isAdmin={data.user.privileges === "Admin"} name={data.user.name.length > 0 ? data.user.name : data.user.username} />

<ExpandingInterior>
    <ListPage 
        title="All ISPs" 
        columns={AllISPEntries} 
        entries={isps} 
        isAdmin={data.user.privileges === "Admin"} 
        hasNew={true} 
        hasEdit={true} 
        hasFacilityVendor={true}
        onClickNew={newISPClickRaise} 
        onClickEdit={editISPClickRaise} 
        onClickDelete={deleteISPClickRaise}
        columnsCollapseMobile={[false, false, true, false, false]}
        columnsCollapseMobilePortrait={[false, true, true, true, false]}
        initialSearch={data.initial_search}
        column_sorted_by={1}
    />
</ExpandingInterior>

<Footer />

<ModalPopup
    title="New ISP"
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

<style>

</style>