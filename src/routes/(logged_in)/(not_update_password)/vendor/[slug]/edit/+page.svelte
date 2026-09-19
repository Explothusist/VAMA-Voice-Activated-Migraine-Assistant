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
    import Map from "$lib/components/Map.svelte";
    import type { Writable } from "svelte/store";
    import { browser } from "$app/environment";
    import { replaceState } from "$app/navigation";
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import Topbar from "$lib/components/Topbar.svelte";
    import { VendorGoogleMapsLinkExplanation, VendorMapMarkerExplanation, VendorNotesExplanation, VendorStateExplanation, VendorAbbreviationExplanation, VendorAddressExplanation, VendorFaxExplanation, VendorNameExplanation, VendorPhoneExplanation, VendorRoleExplanation, VendorSupportPhoneExplanation, VendorSupportWebsiteExplanation, VendorWebsiteExplanation, getUploadVendorLogoEntries_Vendor, getRemoveVendorLogoEntries_Vendor } from "$lib/location_utils.js";
    import FormDropdown from "$lib/components/FormDropdown.svelte";
    import { kStatesArrayAlphabetized, type TableBoxEntry } from "$lib/util.js";
    import type { JSONVendor } from "$lib/db_utils.js";
    import { enhance } from "$app/forms";

    let { form, data } = $props();

    let vendor = $derived(form?.vendor ? form.vendor : data.vendor);
    let vendor_logo = $derived(form?.vendor_logo ? form.vendor_logo : data.vendor_logo);
    let oldVendor: (JSONVendor | null) = null; // No, this should not be $state(). In fact, if you make it such you will brick the page

    let vendor_info: TableBoxEntry[] = $derived([
        { columns: [{ isLinked: false, link: "", value: "Name" }, { isLinked: false, link: "", value: vendor.name, name: "name", min_length: 1, max_length: 100, hasTooltip: true, tooltipText: VendorNameExplanation }] },
        { columns: [{ isLinked: false, link: "", value: "Abbrev" }, { isLinked: false, link: "", value: vendor.abbreviation, name: "abbreviation", min_length: 1, max_length: 20, hasTooltip: true, tooltipText: VendorAbbreviationExplanation }] },
        { columns: [{ isLinked: false, link: "", value: "Address" }, { isLinked: false, link: "", value: vendor.address, name: "address", min_length: 0, max_length: 200, hasTooltip: true, tooltipText: VendorAddressExplanation }] },
        { columns: [{ isLinked: false, link: "", value: "Phone" }, { validation: "phone", isLinked: false, link: "", value: vendor.phone, name: "phone", min_length: 0, max_length: 20, hasTooltip: true, tooltipText: VendorPhoneExplanation }] },
        { columns: [{ isLinked: false, link: "", value: "Fax" }, { validation: "phone", isLinked: false, link: "", value: vendor.fax, name: "fax", min_length: 0, max_length: 20, hasTooltip: true, tooltipText: VendorFaxExplanation }] },
        { columns: [{ isLinked: false, link: "", value: "Role" }, { isLinked: false, link: "", value: vendor.role, name: "role", min_length: 0, max_length: 100, hasTooltip: true, tooltipText: VendorRoleExplanation }] }
    ]);
    let support_info: TableBoxEntry[] = $derived([
        { columns: [{ isLinked: false, link: "", value: "Website" }, { validation: "url", isLinked: false, link: "", value: vendor.website, name: "website", min_length: 0, max_length: 200, hasTooltip: true, tooltipText: VendorWebsiteExplanation }] },
        { columns: [{ isLinked: false, link: "", value: "Support Phone" }, { validation: "phone", isLinked: false, link: "", value: vendor.tech_support_phone, name: "tech_support_phone", min_length: 0, max_length: 20, hasTooltip: true, tooltipText: VendorSupportPhoneExplanation }] },
        { columns: [{ isLinked: false, link: "", value: "Web Support" }, { validation: "url", isLinked: false, link: "", value: vendor.tech_support_website, name: "tech_support_website", min_length: 0, max_length: 200, hasTooltip: true, tooltipText: VendorSupportWebsiteExplanation }] }
    ]);

    // let saveVendorPopup: (ModalPopup | undefined) = $state();
    // function saveVendorClickRaise() {
    //     if (!saveVendorPopup) return;
    //     saveVendorPopup.raisePopup();
    // };
    // let saveVendorEntries = $derived([
    //     { type: "hidden_num", name: "vendor_id", value: vendor.id },
    //     { type: "warning", value: "Are you sure you want to save changes made to "+vendor.name+"?" }
    // ]);

    // let cancelVendorPopup: (ModalPopup | undefined) = $state();
    // function cancelVendorClickRaise() {
    //     if (!cancelVendorPopup) return;
    //     cancelVendorPopup.raisePopup();
    // };
    // let cancelVendorEntries = $derived([
    //     { type: "hidden_num", name: "vendor_id", value: vendor.id },
    //     { type: "warning", value: "Are you sure you want to discard changes made to "+vendor.name+"?" }
    // ]);
    
    let addLogoPopup: (ModalPopup | undefined) = $state();
    function addLogoClickRaise() {
        if (!addLogoPopup) return;
        addLogoPopup.raisePopup();
    };
    let addLogoEntries = $derived(getUploadVendorLogoEntries_Vendor(vendor, vendor_logo.exists));

    let removeLogoPopup: (ModalPopup | undefined) = $state();
    function removeLogoClickRaise() {
        if (!removeLogoPopup) return;
        removeLogoPopup.raisePopup();
    };
    let removeLogoEntries = $derived(getRemoveVendorLogoEntries_Vendor(vendor));


    function change_map_marker(event: MouseEvent) {
        entryNewValues[kMapX] = Math.round(event.clientX-(event.target as HTMLElement).getBoundingClientRect().x);
        entryNewValues[kMapY] = Math.round(event.clientY-(event.target as HTMLElement).getBoundingClientRect().y);
    };

    let pageAlive = true;
    $effect(() => {
        if (oldVendor !== vendor) {
            oldVendor = vendor;

            if (browser) {
                const vendor_id = vendor.id;
                tick().then(() => {
                    if (!pageAlive) return;
                    replaceState("/vendor/"+vendor_id+"/edit", {});
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
    function getEditedValueArray(readVendor: JSONVendor) {
        return [
            readVendor.notes,
            readVendor.map_x,
            readVendor.map_y,
            readVendor.state,
            readVendor.google_map_link
        ];
    };
    // svelte-ignore state_referenced_locally
    let entryNewValues = $state(getEditedValueArray(vendor));
    $effect(() => {
        entryNewValues = getEditedValueArray(vendor);
    });
    let entryEdited = $derived(
        getEditedValueArray(vendor).map((row: string | number, i: number) => 
            entryNewValues[i] !== getEditedValueArray(vendor)[i]
        )
    );
    
    function revertEntry(index: number) {
        entryNewValues[index] = getEditedValueArray(vendor)[index];
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
    showVendorDropdown={true} 
    allVendors={data.all_vendors} 
    thisLocationName={vendor.name} 
    thisLocationId={vendor.id}
    thisLocationActive={vendor.active}
    thisLocationIsVendor={true} />

<form id="editPage" action="?/saveVendor" method="POST" use:enhance>
</form>
<input hidden form="editPage" type="number" value={entryNewValues[kMapX]} name="map_x">
<input hidden form="editPage" type="number" value={entryNewValues[kMapY]} name="map_y">
<input hidden form="editPage" type="number" value={vendor.id} name="vendor_id">
<ExpandingInterior>
    <logo-cont>
        {#if vendor_logo.exists}
            <img alt="Vendor Logo" src={"/uploads/vendor_logo/vendor_"+vendor.id+".png?v="+vendor_logo.last_modified} height=70px width=auto />
            <button type="button" onclick={addLogoClickRaise}>Replace Vendor Logo</button>
            <button type="button" onclick={removeLogoClickRaise}>Remove Vendor Logo</button>
        {:else}
            <button type="button" onclick={addLogoClickRaise}>Upload Vendor Logo</button>
        {/if}
    </logo-cont>
    <all-stuff id={$isMobile ? "is-mobile" : ""}>
        <stuff-cont id={!$isMobile ? "top" : "mobile-top"}>
            <TableBox title="Vendor Info" entries={vendor_info} isInForm={true} form="editPage" hasIcons={false} usesEditHighlighting={true} />
        </stuff-cont>
        <stuff-cont id={!$isMobile ? "mid" : "mobile-mid"}>
            <TableBox title="Support Info" entries={support_info} isInForm={true} form="editPage" isWide={true} hasIcons={false} usesEditHighlighting={true} />
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
                <hideable class:hidden={!entryEdited[kNotes]}>
                    <Tooltip hover_text={"Revert"}>
                        <button class="button-as-blank-box link-box shifted-revert-icon" onclick={() => revertEntry(kNotes)} >
                            <IconRevert />
                        </button>
                    </Tooltip>
                </hideable>
            </title-cont>
            <fill-box>
                <textarea form="editPage" name="notes" rows="6" cols={!$isMobilePortrait ? 60 : 30} maxlength="4750" bind:value={entryNewValues[kNotes]} class:edited={entryEdited[kNotes]} ></textarea>
            </fill-box>
        </stuff-cont>
        <stuff-cont id={!$isMobile ? "right" : "mobile-right"}>
            <size-limited>
                <button type="button" class="not-a button-as-blank-box map-cont" onclick={change_map_marker} id="map-cont">
                    <Map state={entryNewValues[kState] as string} map_x={entryNewValues[kMapX] as number} map_y={entryNewValues[kMapY] as number} />
                </button>
                <text-entry id="map-title" class="right-shifted" class:edited={entryEdited[kMapX] || entryEdited[kMapY]}>
                    Click on map to move marker.
                    <small-gap-left>
                        <Tooltip hover_text={VendorMapMarkerExplanation}>
                            <not-a class="shifted-info-icon">
                                <IconInfo />
                            </not-a>
                        </Tooltip>
                    </small-gap-left>
                    <hideable class:hidden={!entryEdited[kMapX] && !entryEdited[kMapY]}>
                        <Tooltip hover_text={"Revert"}>
                            <button class="button-as-blank-box link-box shifted-revert-icon" onclick={() => {revertEntry(kMapX);revertEntry(kMapY);}} >
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
                        <Tooltip hover_text={VendorStateExplanation}>
                            <not-a class="shifted-info-icon">
                                <IconInfo />
                            </not-a>
                        </Tooltip>
                    </small-gap-left>
                    <hideable class:hidden={!entryEdited[kState]}>
                        <Tooltip hover_text={"Revert"}>
                            <button class="button-as-blank-box link-box shifted-revert-icon" onclick={() => revertEntry(kState)} >
                                <IconRevert />
                            </button>
                        </Tooltip>
                    </hideable>
                </text-entry>
                <text-entry class="right-shifted">
                    Google Maps Link:
                    <small-gap-left>
                        <Tooltip hover_text={VendorGoogleMapsLinkExplanation}>
                            <not-a class="shifted-info-icon">
                                <IconInfo />
                            </not-a>
                        </Tooltip>
                    </small-gap-left>
                    <hideable class:hidden={!entryEdited[kGMapLink]}>
                        <Tooltip hover_text={"Revert"}>
                            <button class="button-as-blank-box link-box shifted-revert-icon" onclick={() => revertEntry(kGMapLink)} >
                                <IconRevert />
                            </button>
                        </Tooltip>
                    </hideable>
                </text-entry>
                <text-entry id="gm-link">
                    <textarea form="editPage" name="google_map_link" rows="6" cols="20" maxlength="950" bind:value={entryNewValues[kGMapLink]} class:edited={entryEdited[kGMapLink]}></textarea>
                </text-entry>
                <text-entry>
                    <Tooltip hover_text="Save Changes">
                        <!-- <button type="button" class="icon-button" onclick={saveVendorClickRaise}><IconSave /></button> -->
                        <button type="submit" class="icon-button" form="editPage"><IconSave /></button>
                    </Tooltip>
                    <Tooltip hover_text="Discard Changes">
                        <!-- <button type="button" class="icon-button" onclick={cancelVendorClickRaise}><IconCancel /></button> -->
                        <a href={"/vendor/"+vendor.id}>
                            <button type="button" class="icon-button"><IconCancel /></button>
                        </a>
                    </Tooltip>
                </text-entry>
            </size-limited>
        </stuff-cont>
    </all-stuff>
</ExpandingInterior>

<!-- <ModalPopup
    title="Save Changes"
    action="saveLocation"
    entries={saveVendorEntries}
    form="editPage"
    useFormEnhance={true}
    bind:this={saveVendorPopup}
/> -->

<!-- <ModalPopup
    title="Discard Changes"
    action="__N/A__"
    entries={cancelVendorEntries}
    confirmIsLink={true}
    confirmLink={"/vendor/"+vendor.id}
    bind:this={cancelVendorPopup}
/> -->

<ModalPopup
    title="Upload New Logo"
    action="addLogo"
    entries={addLogoEntries}
    useFormEnhance={true}
    bind:this={addLogoPopup}
    formWithFiles={true}
/>

<ModalPopup
    title="Remove Logo"
    action="removeLogo"
    entries={removeLogoEntries}
    useFormEnhance={true}
    bind:this={removeLogoPopup}
    formWithFiles={true}
/>

<style>
    logo-cont {
        display: flex;
        margin: 0px;
        margin-left: 3%;
        margin-top: 20px;

        gap: 20px;
        align-items: center;
    }

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
    #mid {
        grid-column: 1 / span 2;
        grid-row: 2;
    }
    #bot {
        grid-column: 1 / span 2;
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
    #mobile-mid {
        grid-column: 1;
        grid-row: 2;
    }
    #mobile-bot {
        grid-column: 1;
        grid-row: 3;
    }
    #mobile-right {
        grid-column: 1;
        grid-row: 4 / span 7;
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

    textarea {
        color: var(--accent5);
        font-size: var(--font-size3);
        font-family: Arial, sans-serif;
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

    hideable.hidden {
        opacity: 0;
        pointer-events: none;
    }
    .right-shifted {
        position: relative;
        left: 16px;
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

</style>