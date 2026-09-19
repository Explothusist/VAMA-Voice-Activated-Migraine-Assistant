<svelte:options runes={true} />
<script lang="ts">
    import { browser } from "$app/environment";
    import { replaceState } from "$app/navigation";
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import ListPage from "$lib/components/ListPage.svelte";
    import ModalPopup from "$lib/components/ModalPopup.svelte";
    import StaffEditModals from "$lib/components/StaffEditModals.svelte";
    import Topbar from "$lib/components/Topbar.svelte";
    import { kDefaultJSONStaff, type JSONStaff, type JSONVendor } from "$lib/db_utils.js";
    import { getEntriesFromData_Staff, getPinStaffEntries_Staff, getUnpinStaffEntries_Staff, LocationStaffColumns } from "$lib/staff_utils.js";
    import { clamp_string_to_length } from "$lib/util.js";
    import { onDestroy, tick } from "svelte";

    let { form, data } = $props();

    let staff_edit_modals: (StaffEditModals | undefined) = $state();

    function viewStaffClickRaise(id: number) {
        staff_edit_modals?.viewStaffClickRaise(id);
    }
    
    let vendor = $derived(form?.vendor ? form.vendor : data.vendor);
    let staff_data = $derived(form?.staff ? form.staff : data.staff);
    let staff_members = $derived(getEntriesFromData_Staff(staff_data, viewStaffClickRaise, false).map((a) => {
        a.pinIsUnpin = vendor.pinned_staff.includes((a.self as JSONStaff).id);
        return a;
    }));
    let oldVendor: (JSONVendor | null) = null; // No, this should not be $state(). In fact, if you make it such you will brick the page

    
    let pinStaffIndex = $state(0);
    let pinStaffPopup: (ModalPopup | undefined) = $state();
    export function pinStaffClickRaise(id: number) {
        if (!pinStaffPopup) return;
        pinStaffIndex = id;
        pinStaffPopup.raisePopup();
    };
    let pinSelectedStaff = $derived(pinStaffIndex < staff_members.length ? (staff_members[pinStaffIndex].self as JSONStaff) : kDefaultJSONStaff);
    let pinStaffEntries = $derived(getPinStaffEntries_Staff(pinSelectedStaff, vendor));


    let unpinStaffIndex = $state(0);
    let unpinStaffPopup: (ModalPopup | undefined) = $state();
    export function unpinStaffClickRaise(id: number) {
        if (!unpinStaffPopup) return;
        unpinStaffIndex = id;
        unpinStaffPopup.raisePopup();
    };
    let unpinSelectedStaff = $derived(unpinStaffIndex < staff_members.length ? (staff_members[unpinStaffIndex].self as JSONStaff) : kDefaultJSONStaff);
    let unpinStaffEntries = $derived(getUnpinStaffEntries_Staff(unpinSelectedStaff, vendor));

    let pageAlive = true;
    $effect(() => {
        if (oldVendor !== vendor) {
            oldVendor = vendor;

            if (browser) {
                const vendor_id = vendor.id;
                tick().then(() => {
                    if (!pageAlive) return;
                    replaceState("/vendor/"+vendor_id+"/staff", {});
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
        title={clamp_string_to_length(vendor.name, 50)+" Staff"} 
        columns={LocationStaffColumns} 
        entries={staff_members} 
        isAdmin={data.user.privileges === "Admin" && vendor.active} 
        hasNew={true} 
        hasEmail={true} 
        hasEdit={true}
        hasPin={true}
        onClickNew={() => staff_edit_modals?.newStaffClickRaise()} 
        onClickEdit={(id: number) => staff_edit_modals?.editStaffClickRaise(id)} 
        onClickDelete={(id: number) => staff_edit_modals?.deleteStaffClickRaise(id)}
        onClickPin={(id: number) => pinStaffClickRaise(id)}
        onClickUnpin={(id: number) => unpinStaffClickRaise(id)}
        columnsCollapseMobile={ [false, false, false, true] }
        columnsCollapseMobilePortrait={ [false, false, true, true] }
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

<StaffEditModals 
    bind:this={staff_edit_modals} 
    all_facilities={data.all_facilities} 
    all_vendors={data.all_vendors}
    staff_members={staff_members}
    default_at_facility={"Vendor"}
    default_location_id={vendor.id}
    vendor_id={vendor.id}
/>

<ModalPopup
    title="Pin Staff to View Page"
    action="pinStaff" 
    entries={pinStaffEntries}
    useFormEnhance={true}
    bind:this={pinStaffPopup}
/>

<ModalPopup 
    title="Unpin Staff from View Page"
    action="unpinStaff"
    entries={unpinStaffEntries}
    useFormEnhance={true}
    bind:this={unpinStaffPopup}
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