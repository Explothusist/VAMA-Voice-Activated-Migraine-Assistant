<svelte:options runes={true} />
<script lang="ts">
    import { browser } from "$app/environment";
    import { replaceState } from "$app/navigation";
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import ListPage from "$lib/components/ListPage.svelte";
    import ModalPopup from "$lib/components/ModalPopup.svelte";
    import Topbar from "$lib/components/Topbar.svelte";
    import { kDefaultJSONISP, type JSONISP, type JSONVendor } from "$lib/db_utils.js";
    import { getDeleteISPEntries_ISP, getEditISPEntries_ISP, getEntriesFromData_ISP, getNewISPEntries_ISP, getViewISPEntries_ISP, VendorISPEntries } from "$lib/isp_utils.js";
    import { clamp_string_to_length } from "$lib/util.js";
    import { onDestroy, tick } from "svelte";

    let { form, data } = $props();

    let vendor = $derived(form?.vendor ? form.vendor : data.vendor);
    let isp_data = $derived(form?.vendor_isps ? form.vendor_isps : data.vendor_isps);
    let isps = $derived(getEntriesFromData_ISP(isp_data, viewISPClickRaise, true, false));
    let oldVendor: (JSONVendor | null) = null; // No, this should not be $state(). In fact, if you make it such you will brick the page


    let vendor_dropdown_entries = $derived(data.all_vendors.map((a) => { return { title: a.name, value: a.id }; })
        .sort((a, b) => a.title.localeCompare(b.title)));
    let facility_dropdown_entries = $derived(data.all_facilities.map((a) => { return { title: a.name, value: a.id }; })
        .sort((a, b) => a.title.localeCompare(b.title)));

    let newISPPopup: (ModalPopup | undefined) = $state();
    function newISPClickRaise() {
        if (!newISPPopup) return;
        newISPPopup.raisePopup();
    };
    let newISPEntries = $derived([
        { type: "hidden_num", name: "page_vendor_id", value: vendor.id },
        ...getNewISPEntries_ISP(-1, vendor.id, facility_dropdown_entries, vendor_dropdown_entries)
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
        { type: "hidden_num", name: "page_vendor_id", value: vendor.id },
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
        { type: "hidden_num", name: "page_vendor_id", value: vendor.id },
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
        if (oldVendor !== vendor) {
            oldVendor = vendor;

            const vendor_id = vendor.id;
            if (browser) {
                tick().then(() => {
                    if (!pageAlive) return;
                    replaceState("/vendor/"+vendor_id+"/isp", {});
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
        title={clamp_string_to_length(vendor.name, 50)+" Internet Service Providers"}
        columns={VendorISPEntries}
        entries={isps}
        isAdmin={data.user.privileges === "Admin" && vendor.active}
        hasNew={true}
        hasEdit={true}
        hasFacilityVendor={true}
        onClickNew={() => newISPClickRaise()}
        onClickEdit={(id: number) => editISPClickRaise(id)}
        onClickDelete={(id: number) => deleteISPClickRaise(id)}
        columnsCollapseMobile={[false, false, true, false, true]}
        columnsCollapseMobilePortrait={[false, false, true, true, true]}
        column_sorted_by={1}
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