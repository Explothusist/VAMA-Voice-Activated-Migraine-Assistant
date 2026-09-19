<svelte:options runes={true} />
<script lang="ts">
    import IconUpload from "virtual:icons/mdi/tray-arrow-up";
    import Footer from '$lib/components/Footer.svelte';
    import Topbar from '$lib/components/Topbar.svelte';
    import { getContext } from 'svelte';
    import type { Writable } from 'svelte/store';
    import ModalPopup from "$lib/components/ModalPopup.svelte";
    import { pretifyTableName } from "$lib/util.js";
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import { data_column_mapper, data_columns_indexer, facility_data_columns, staff_data_columns, staff_data_columns_new_hire, staff_data_columns_promotion_demotion, staff_data_columns_terminations, staff_data_columns_transfer, staff_data_columns_ukg, vendor_data_columns } from "$lib/csv_utils.js";
    import { enhance } from "$app/forms";

    let { form, data } = $props();

    let isMobile: Writable<boolean> = getContext("isMobile");
    let isMobilePortrait: Writable<boolean> = getContext("isMobilePortrait");

    // svelte-ignore state_referenced_locally
    let importMode: string = $state(data.import_mode);
    let importModeFancified = $derived(importMode === "add" ? "Add All" : importMode === "add_update" ? "Add and Update" : importMode === "ukg_special" ? "UKG Staff" : "Update Only");
    let importTableFancified = $derived(pretifyTableName(data.import_table));
    
    let facility_columns_selected = $derived(facility_data_columns.map((a) => data.headers.indexOf(a) !== -1 ? a : "__UNASSIGNED__"));
    let vendor_columns_selected = $derived(vendor_data_columns.map((a) => data.headers.indexOf(a) !== -1 ? a : "__UNASSIGNED__"));
    let staff_columns_selected = $derived(staff_data_columns.map((a, i) => 
        data.headers.indexOf(a) !== -1 ? a : 
        (data.headers.indexOf(staff_data_columns_ukg[i]) !== -1 ? staff_data_columns_ukg[i] : 
        (data.headers.indexOf(staff_data_columns_promotion_demotion[i]) !== -1 ? staff_data_columns_promotion_demotion[i] : 
        (data.headers.indexOf(staff_data_columns_new_hire[i]) !== -1 ? staff_data_columns_new_hire[i] : 
        (data.headers.indexOf(staff_data_columns_terminations[i]) !== -1 ? staff_data_columns_terminations[i] : 
        (data.headers.indexOf(staff_data_columns_transfer[i]) !== -1 ? staff_data_columns_transfer[i] : "__UNASSIGNED__")))))));
    // let account_columns_selected = $derived(account_data_columns.map((a) => data.headers.indexOf(a) !== -1 ? a : "__UNASSIGNED__"));
    
    const column_selected_mapper = $derived([
        facility_columns_selected,
        vendor_columns_selected,
        staff_columns_selected,
        // account_columns_selected
    ]);

    let columns_shown = $derived(data_column_mapper[data_columns_indexer.indexOf(data.import_table)]);
    let column_selected_shown = $derived(column_selected_mapper[data_columns_indexer.indexOf(data.import_table)]);

    
    let cancelImportPopup: (ModalPopup | undefined) = $state();
    function cancelImportClickRaise() {
        if (!cancelImportPopup) return;
        cancelImportPopup.raisePopup();
    };
    let cancelImportEntries = $derived([
        { type: "warning", value: "Are you sure you want to cancel importing "+data.filename+"?" }
    ]);
    
    let confirmImportPopup: (ModalPopup | undefined) = $state();
    function confirmImportClickRaise() {
        if (!confirmImportPopup) return;
        confirmImportPopup.raisePopup();
    };
    let confirmImportEntries = $derived([
        { type: "warning", value: "Are you sure you want to import "+data.filename+"?" },
        { type: "warning", value: "Import to Table: "+importTableFancified },
        { type: "warning", value: "Import Mode: "+importModeFancified },
        { type: "hidden_txt", name: "table", value: data.import_table },
        { type: "hidden_txt", name: "mode", value: data.import_mode }
    ]);

    // $effect(() => {
    //     if (browser && form?.message) {
    //         alert(form?.message);
    //     }
    // });
</script>

<Topbar user={data.user} profile_picture={data.profile_picture} isLoggedIn={true} isAdmin={data.user.privileges === "Admin"} name={data.user.name.length > 0 ? data.user.name : data.user.username} />

<ExpandingInterior>
    <all-stuff id={$isMobile ? "is-mobile" : ""}>
        <stuff-cont id={!$isMobile ? "left" : "mobile-left"}>
            <form id="importForm" action="?/importCSV" method="POST" enctype="multipart/form-data"></form>
            <form id="cancelForm" action="?/cancelImport" method="POST" enctype="multipart/form-data"></form>
            <input form="importForm" name="table" value={data.import_table} hidden />
            <input form="importForm" name="csv_id" value={data.csv_id} hidden />
            <input form="cancelForm" name="csv_id" value={data.csv_id} hidden />

            <flex-spacer></flex-spacer>

            <flex-bit>
                <icon>
                    <IconUpload />
                </icon>
                <big-title>Import CSV File</big-title>
            </flex-bit>

            <flex-spacer></flex-spacer>
            <flex-spacer></flex-spacer>

            <flex-bit>
                <little-info>{data.filename}</little-info>
            </flex-bit>
            <flex-bit>
                <little-info>Import to Table: {importTableFancified}</little-info>
            </flex-bit>
            <flex-bit>
                <little-info>Select Mode: </little-info>
                <select form="importForm" name="mode" bind:value={importMode}>
                    <option value="add">Add All</option>
                    <option value="add_update">Add and Update</option>
                    {#if data.import_table === "staff"}
                        <option value="ukg_special">UKG Staff</option>
                    {/if}
                    <option value="update">Update Only</option>
                </select>
            </flex-bit>

            <flex-bit>
                <little-info>
                    {#if importMode === "add"}
                        All entries will be added, even if a duplicate exists (Add All Mode).
                    {:else if importMode === "add_update"}
                        Entries without a duplicate will be added, entries with a duplicate already in the database will update that duplicate instead (Add and Update Mode).
                    {:else}
                        Entries without a duplicate will be skipped, entries with a duplicate already in the database will update that duplicate (Update Only Mode).
                    {/if}
                    Interprets the first line as headers.
                </little-info>
            </flex-bit>

            <flex-spacer></flex-spacer>
            <flex-spacer></flex-spacer>

            <flex-bit>
                <little-info>Use the following dropdowns to map the columns of the CSV file to the appropriate database entries.</little-info>
            </flex-bit>


            <flex-table>
                {#each columns_shown as column, index}
                    <flex-table-left-col>
                        <little-info>{column}: </little-info>
                    </flex-table-left-col>
                    <flex-table-right-col>
                        <select form="importForm" name={column} bind:value={column_selected_shown[index]}>
                            <option value="__UNASSIGNED__">{"<Unassigned>"}</option>
                            {#each data.headers as header}
                                <option value={header}>{header}</option>
                            {/each}
                        </select>
                    </flex-table-right-col>
                {/each}
            </flex-table>

            <flex-spacer></flex-spacer>
            <flex-spacer></flex-spacer>

            <flex-bit class="bit-widened">
                <!-- <input type="submit" form="importForm" class="big-button" value="Import"> -->
                <button class="big-button" onclick={confirmImportClickRaise}>
                    Import
                </button>
            </flex-bit>
            <flex-bit class="bit-widened">
                <!-- <a target="_self" href={"/data_management"}> -->
                <button class="big-button" onclick={cancelImportClickRaise}>
                    Cancel
                </button>
                <!-- </a> -->
            </flex-bit>
        </stuff-cont>
    </all-stuff>
</ExpandingInterior>

<Footer />

<ModalPopup
    title="Cancel Import"
    action="cancelImport"
    form="cancelForm"
    entries={cancelImportEntries}
    bind:this={cancelImportPopup}
/>

<ModalPopup
    title="Confirm Import"
    action="confirmImport"
    form="importForm"
    entries={confirmImportEntries}
    bind:this={confirmImportPopup}
/>

<style>

    all-stuff {
        display: grid;
        grid-template-columns: 1fr;
        gap: 30px;
        grid-auto-rows: auto 1fr;
        margin: 20px;
        width: 80%;
        margin-left: 10%;
        margin-right: 10%;
        /* height: 100%; */
    }
    #is-mobile {
        grid-template-columns: 1fr;
        grid-auto-rows: auto auto auto;
    }
    

    #left {
        grid-column: 1;
        grid-row: 1;
    }

    #mobile-left {
        grid-column: 1;
        grid-row: 1;
    }

    stuff-cont {
        background-color: var(--accent0);
        /* border-radius: 20px; */
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    flex-bit {
        display: flex;
        /* margin: 25px; */
        margin: 5px;
        margin-left: auto;
        margin-right: auto;
        max-width: 94%;
        /* flex-direction: column; */
    }

    .bit-widened {
        width: 100%;
    }

    flex-spacer {
        display: flex;
        margin: 10px;
        margin-left: auto;
        margin-right: auto;
        max-width: 94%;
        /* flex-direction: column; */
    }

    flex-table {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        grid-auto-rows: 1fr 1fr 1fr 1fr 1fr;
        margin: 20px;
        width: 94%;
        margin-left: 3%;
        margin-right: 3%;
    }

    flex-table-left-col {
        display: flex;
        width: 100%;
        justify-content: flex-end;
    }
    flex-table-right-col {
        display: flex;
        width: 100%;
        justify-content: flex-start;
    }

    select, option {
        color: var(--accent5);
        background-color: var(--accent1);
        font-size: var(--font-size3);
    }

    big-title {
        color: var(--accent5);
        font-size: var(--font-size4);
    }

    little-info {
        color: var(--accent5);
        font-size: var(--font-size3);
        margin-top: auto;
        margin-bottom: auto;
        margin-right: 10px;

        max-width: 1000px;
    }

    .big-button {
        appearance: none;
        user-select: none;
        text-align: center;
        box-sizing: border-box;
        white-space: pre;
        padding-block: 1px;
        padding-inline: 6px;
        border-width: 2px;
        border-style: outset;
        border-color: buttonborder;
        border-image: initial;

        background-color: var(--accent5);
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 8px;
        margin-top: 0px;
        /* border-radius: 8px; */
        cursor: pointer;
        color: var(--accent1);
        font-family: Arial, sans-serif;
        font-weight: bold;

        width: 90%;
        max-width: 300px;
        margin: auto;
        margin-bottom: 12px;

        font-size: var(--font-size3);
    }
    .big-button:hover {
        background-color: var(--accent4);
        color: var(--accent1);
    }

    /* .button-as-blank-box {
        background: none;
        color: inherit;
        border: none;
        padding: 0;
        font: inherit;
        cursor: pointer;
        outline: inherit;
        text-align: left;
        border-radius: 0;
        line-height: inherit;
        letter-spacing: inherit;
        width: auto;
    }

    a {
        text-decoration: none;
        width: 100%;
    } */

    icon {
        color: var(--accent5);
        font-size: var(--font-size4);
        margin-left: 10px;
        margin-right: 10px;
    }

    input {
        color: var(--accent5);
    }

    /* .info-spaced {
        margin: 10px;
    }

    .larger-info {
        font-size: var(--font-size4);
    } */
</style>