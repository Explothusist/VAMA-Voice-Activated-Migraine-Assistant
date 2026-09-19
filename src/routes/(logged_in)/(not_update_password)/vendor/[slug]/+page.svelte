<svelte:options runes={true} />
<script lang="ts">
    import TableBox from "$lib/components/TableBox.svelte";
    import IconTrash from "virtual:icons/mdi/trash-can-outline";
    import IconPencil from "virtual:icons/mdi/pencil-box-outline";
    import IconInfo from "virtual:icons/mdi/help-circle-outline";
    import { getContext, onDestroy, tick } from "svelte";
    import ModalPopup from "$lib/components/ModalPopup.svelte";
    import Tooltip from "$lib/components/Tooltip.svelte";
    import TableBoxTitled from "$lib/components/TableBoxTitled.svelte";
    import Map from "$lib/components/Map.svelte";
    import type { Writable } from "svelte/store";
    import { clamp_string_to_length, clockCurrentMilliseconds, getTimeMS, newlineify, stateTimeZones, toReadableFullDateString, type TableBoxEntry, type TableBoxTitleRow } from "$lib/util.js";
    import { browser } from "$app/environment";
    import { replaceState } from "$app/navigation";
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import Topbar from "$lib/components/Topbar.svelte";
    import { getDeleteVendorEntries_Vendor, VendorAddressExplanation, VendorFaxExplanation, VendorNameExplanation, VendorNotesExplanation, VendorPhoneExplanation, VendorPinnedStaffExplanation, VendorRoleExplanation, VendorSupportPhoneExplanation, VendorSupportWebsiteExplanation, VendorWebsiteExplanation } from "$lib/location_utils.js";
    import { kDefaultJSONStaff, type JSONVendor } from "$lib/db_utils.js";
    import { getUnpinStaffEntries_Staff } from "$lib/staff_utils.js";

    let { form, data } = $props();

    let vendor = $derived(form?.vendor ? form.vendor : data.vendor);
    let staff_members = $derived(form?.staff_members ? form.staff_members : data.staff_members);
    // let filtered_staff_members = $derived(staff_members.filter());
    let vendor_logo = $derived(form?.vendor_logo ? form.vendor_logo : data.vendor_logo);
    let oldVendor: (JSONVendor | null) = null; // No, this should not be $state(). In fact, if you make it such you will brick the page

    let vendor_info: TableBoxEntry[] = $derived([
        { tintEntryRed: !vendor.active, columns: [{ isLinked: false, link: "", value: "Name" }, { isLinked: false, link: "", value: vendor.name+" ("+vendor.abbreviation+")", hasTooltip: true, tooltipText: VendorNameExplanation }] },
        { tintEntryRed: !vendor.active, columns: [{ isLinked: false, link: vendor.google_map_link, value: "Address" }, { isLinked: true, linkIsIcon: true, iconHoverText: "Google Maps", iconType: "open new", link: vendor.google_map_link, value: vendor.address, hasTooltip: true, tooltipText: VendorAddressExplanation }] },
        { tintEntryRed: !vendor.active, columns: [{ isLinked: false, link: "", value: "Phone" }, { isLinked: false, link: "", value: vendor.phone, hasTooltip: true, tooltipText: VendorPhoneExplanation }] },
        { tintEntryRed: !vendor.active, columns: [{ isLinked: false, link: "", value: "Fax" }, { isLinked: false, link: "", value: vendor.fax, hasTooltip: true, tooltipText: VendorFaxExplanation }] },
        { tintEntryRed: !vendor.active, columns: [{ isLinked: false, link: "", value: "Role" }, { isLinked: false, link: "", value: vendor.role, hasTooltip: true, tooltipText: VendorRoleExplanation }] }
    ]);
    let support_info: TableBoxEntry[] = $derived([
        { tintEntryRed: !vendor.active, columns: [{ isLinked: false, link: vendor.website, value: "Website" }, { isLinked: true, linkIsIcon: true, iconHoverText: "Website", iconType: "open new", link: vendor.website, value: vendor.website, hasTooltip: true, tooltipText: VendorWebsiteExplanation }] },
        { tintEntryRed: !vendor.active, columns: [{ isLinked: false, link: "", value: "Support Phone" }, { isLinked: false, link: "", value: vendor.tech_support_phone, hasTooltip: true, tooltipText: VendorSupportPhoneExplanation }] },
        { tintEntryRed: !vendor.active, columns: [{ isLinked: false, link: vendor.tech_support_website, value: "Web Support" }, { isLinked: true, linkIsIcon: true, iconHoverText: "Support Website", iconType: "open new", link: vendor.tech_support_website, value: vendor.tech_support_website, hasTooltip: true, tooltipText: VendorSupportWebsiteExplanation }] }
    ]);
    let support_info_portrait: TableBoxEntry[] = $derived([
        { tintEntryRed: !vendor.active, columns: [{ isLinked: false, link: vendor.website, value: "Website" }, { isLinked: true, linkIsIcon: true, iconHoverText: "Website", iconType: "open new", link: vendor.website, value: clamp_string_to_length(vendor.website, 15) }], hasTooltip: true, tooltipText: VendorWebsiteExplanation },
        { tintEntryRed: !vendor.active, columns: [{ isLinked: false, link: "", value: "Support Phone" }, { isLinked: false, link: "", value: vendor.tech_support_phone, hasTooltip: true, tooltipText: VendorSupportPhoneExplanation }] },
        { tintEntryRed: !vendor.active, columns: [{ isLinked: false, link: vendor.tech_support_website, value: "Web Support" }, { isLinked: true, linkIsIcon: true, iconHoverText: "Support Website", iconType: "open new", link: vendor.tech_support_website, value: clamp_string_to_length(vendor.tech_support_website, 15), hasTooltip: true, tooltipText: VendorSupportWebsiteExplanation }] }
    ]);

    let staff_entries: TableBoxEntry[] = $derived(staff_members.map((a, i) => {
        return { tintEntryRed: !vendor.active, columns: [
            { isLinked: false, link: "", value: a.name }, 
            { isLinked: false, link: "", value: a.position }, 
            { isLinked: false, link: "", value: a.phone }, 
            { isLinked: true, link: "mailto:"+a.email, linkIsIcon: true, iconHoverText: "Mail To", iconType: "email", value: a.email, hasUnpinIcon: true, onClickUnpinIcon: () => unpinStaffClickRaise(i) }
        ] };
    }));
    let staff_entries_portrait: TableBoxEntry[] = $derived(staff_members.map((a, i) => {
        return { tintEntryRed: !vendor.active, columns: [
            { isLinked: false, link: "", value: a.name },
            { isLinked: true, link: "mailto:"+a.email, linkIsIcon: true, iconHoverText: "Mail To", iconType: "email", value: a.email }
        ] };
    }));

    const staff_title: TableBoxTitleRow = { columns: [
        { isLinked: false, value: "Name" }, 
        { isLinked: false, value: "Title" }, 
        { isLinked: false, value: "Cell" }, 
        { isLinked: false, value: "Email" }
    ] };
    const staff_title_portrait: TableBoxTitleRow = { columns: [
        { isLinked: false, value: "Name" },
        { isLinked: false, value: "Email" }
    ] };

    let deleteVendorPopup: (ModalPopup | undefined) = $state();
    function deleteVendorClickRaise() {
        if (!deleteVendorPopup) return;
        deleteVendorPopup.raisePopup();
    };
    let deleteVendorEntries = $derived(getDeleteVendorEntries_Vendor(vendor));

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
        // time = getLocalTimeInState(vendor.state);
        time = getTimeMS();
        clearTimeout(tickClockTimeout);
        tickClockTimeout = window.setTimeout(tick_clock, 1000 - clockCurrentMilliseconds());
    };
    

    let unpinStaffIndex = $state(0);
    let unpinStaffPopup: (ModalPopup | undefined) = $state();
    export function unpinStaffClickRaise(id: number) {
        if (!unpinStaffPopup) return;
        unpinStaffIndex = id;
        unpinStaffPopup.raisePopup();
    };
    let unpinSelectedStaff = $derived(unpinStaffIndex < staff_members.length ? (staff_members[unpinStaffIndex]) : kDefaultJSONStaff);
    let unpinStaffEntries = $derived(getUnpinStaffEntries_Staff(unpinSelectedStaff, vendor));


    let pageAlive = true;
    $effect(() => {
        if (oldVendor !== vendor) {
            tick_clock();
            oldVendor = vendor;

            if (browser) {
                const vendor_id = vendor.id;
                tick().then(() => {
                    if (!pageAlive) return;
                    replaceState("/vendor/"+vendor_id, {});
                });
            }
        }
    });
    onDestroy(() => {
        clearTimeout(tickClockTimeout);
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
    {#if vendor_logo.exists}
        <logo-cont>
            <img alt="Vendor Logo" src={"/uploads/vendor_logo/vendor_"+vendor.id+".png?v="+vendor_logo.last_modified} height=70px width=auto />
        </logo-cont>
    {/if}
    <all-stuff id={$isMobile ? "is-mobile" : ""}>
        <stuff-cont id={!$isMobile ? "top" : "mobile-top"}>
            <TableBox title="Vendor Info" entries={vendor_info} hasIcons={true} tintEntriesRed={!vendor.active} />
        </stuff-cont>
        <stuff-cont id={!$isMobile ? "mid" : "mobile-mid"}>
            <TableBox title="Support" entries={!$isMobilePortrait ? support_info : support_info_portrait} hasIcons={true} isWide={true} tintEntriesRed={!vendor.active} />
        </stuff-cont>
        <stuff-cont id={!$isMobile ? "lower-mid" : "mobile-lower-mid"}>
            <TableBoxTitled title="Staff" title_row={staff_title} entries={!$isMobilePortrait ? staff_entries : staff_entries_portrait} hasIcons={true} hasUnpinIcon={true} tintEntriesRed={!vendor.active} hasTooltip={true} tooltipText={VendorPinnedStaffExplanation} />
            <!-- <gap-left>
                <Tooltip hover_text={VendorNotesExplanation}>
                    <not-a class="shifted-info-icon">
                        <IconInfo />
                    </not-a>
                </Tooltip>
            </gap-left> -->
        </stuff-cont>
        <stuff-cont id={!$isMobile ? "bot" : "mobile-bot"}>
            <title-cont>
                Notes:
                <gap-left>
                    <Tooltip hover_text={VendorNotesExplanation}>
                        <not-a class="shifted-info-icon">
                            <IconInfo />
                        </not-a>
                    </Tooltip>
                </gap-left>
            </title-cont>
            <fill-box class="min-sized" class:tint-red={!vendor.active}>
                {#each newlineify(vendor.notes) as line}
                    {line} <br>
                {/each}
            </fill-box>
        </stuff-cont>
        <stuff-cont id={!$isMobile ? "right" : "mobile-right"}>
            <size-limited>
                <a class="text-entry map-cont" target="_blank" href={vendor.google_map_link} >
                    <Map state = {vendor.state} map_x = {vendor.map_x} map_y = {vendor.map_y} />
                </a>
                {#key time}
                    <text-entry class="local-time">
                        Local Time: {toReadableFullDateString(time, stateTimeZones[vendor.state])}
                    </text-entry>
                {/key}
                <text-entry class="spaced upshifted">
                    <a href={"/vendor/"+vendor.id+"/staff"}>
                        <button>Staff</button>
                    </a>
                </text-entry>
                <text-entry class="spaced">
                    <a href={"/vendor/"+vendor.id+"/facilities"}>
                        <button>Facilities</button>
                    </a>
                </text-entry>
                <text-entry class="spaced">
                    <a href={"/vendor/"+vendor.id+"/isp"}>
                        <button>ISP Facilities</button>
                    </a>
                </text-entry>
                <text-entry class="spaced">
                    {#if data.user.privileges === "Admin" && vendor.active}
                        <Tooltip hover_text="Edit Vendor">
                            <a href={"/vendor/"+vendor.id+"/edit"}>
                                <button class="icon-button"><IconPencil /></button>
                            </a>
                        </Tooltip>
                        <Tooltip hover_text="Delete Vendor">
                            <button class="icon-button delete-icon" onclick={deleteVendorClickRaise} ><IconTrash /></button>
                        </Tooltip>
                    {/if}
                </text-entry>
            </size-limited>
        </stuff-cont>
    </all-stuff>
</ExpandingInterior>

<ModalPopup
    title="Delete Vendor"
    action="deleteVendor"
    entries={deleteVendorEntries}
    useFormEnhance={true}
    bind:this={deleteVendorPopup}
/>

<ModalPopup 
    title="Unpin Staff from View Page"
    action="unpinStaff"
    entries={unpinStaffEntries}
    useFormEnhance={true}
    bind:this={unpinStaffPopup}
/>

<style>
    logo-cont {
        margin: 0px;
        margin-left: 3%;
        margin-top: 20px;
    }
    all-stuff {
        display: grid;
        grid-template-columns: 1fr 1fr 300px;
        gap: 30px;
        grid-auto-rows: auto auto auto 1fr;
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
    #mid {
        grid-column: 1 / span 2;
        grid-row: 2;
    }
    #lower-mid {
        grid-column: 1 / span 2;
        grid-row: 3;
    }
    #bot {
        grid-column: 1 / span 2;
        grid-row: 4;
    }
    #right {
        grid-column: 3;
        grid-row: 1 / span 4;
    }

    #mobile-top {
        grid-column: 1;
        grid-row: 1;
    }
    #mobile-mid {
        grid-column: 1;
        grid-row: 2;
    }
    #mobile-lower-mid {
        grid-column: 1;
        grid-row: 3;
    }
    #mobile-bot {
        grid-column: 1;
        grid-row: 4;
    }
    #mobile-right {
        grid-column: 1;
        grid-row: 5 / span 8;
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

    .delete-icon:hover {
        background-color: var(--accentr);
    }

    
    a {
        text-decoration: none;
    }

    .min-sized {
        min-height: 75px;
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

</style>