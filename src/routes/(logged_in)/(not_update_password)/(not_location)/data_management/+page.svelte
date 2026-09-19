<svelte:options runes={true} />
<script lang="ts">
    import IconDownload from "virtual:icons/mdi/tray-arrow-down";
    import IconUpload from "virtual:icons/mdi/tray-arrow-up";
    import IconRestore from "virtual:icons/mdi/file-restore-outline";
    import IconBackup from "virtual:icons/mdi/database-arrow-down-outline";
    import IconInfo from "virtual:icons/mdi/help-circle-outline";
    import IconRefreshCache from "virtual:icons/mdi/database-refresh-outline";
    import Footer from '$lib/components/Footer.svelte';
    import Topbar from '$lib/components/Topbar.svelte';
    import { getContext, tick } from 'svelte';
    import type { Writable } from 'svelte/store';
    import ModalPopup from "$lib/components/ModalPopup.svelte";
    import { browser } from "$app/environment";
    import { enhance } from "$app/forms";
    import { replaceState } from "$app/navigation";
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import Tooltip from "$lib/components/Tooltip.svelte";
    import { BackupCreateExplanation, BackupRestoreExplanation, CSVExportExplanation, CSVExportIncludeDeletedExplanation, CSVExportTableExplanation, CSVImportExplanation, CSVImportFileExplanation, CSVImportModeExplanation, CSVImportTableExplanation, RefreshAllCachesExplanation } from "$lib/data_management_utils.js";
    import FormDropdown from "$lib/components/FormDropdown.svelte";

    let { form, data } = $props();
    let weekly_backups_data = $derived(form?.weekly_backups ? form.weekly_backups : data.weekly_backups);
    let weekly_backups = $derived(weekly_backups_data.filter((a) => a.endsWith(".db")).sort((a, b) => a.localeCompare(b)));

    let table_to_download: string = $derived(form?.is_exporting ? form.table_to_export : "staff");
    let include_deleted: string = $derived(form?.is_exporting ? (form.include_deleted ? "True" : "False") : "False");
    let importTable: string = $state("staff");
    let importMode: string = $state("ukg_special");

    let isMobile: Writable<boolean> = getContext("isMobile");
    let isMobilePortrait: Writable<boolean> = getContext("isMobilePortrait");

    // svelte-ignore state_referenced_locally
    let backup_selected_index = $state(weekly_backups.length-1);
    let backups_scrollable: (HTMLElement | undefined) = $state();

    let restoreScriptPopup: (ModalPopup | undefined) = $state();
    function restoreScriptClickRaise() {
        if (!restoreScriptPopup) return;
        restoreScriptPopup.raisePopup();
    };
    // let restoreScriptEntries = $derived([
    //     { type: "warning", value: "Restoring a backup requires restarting the application from the computer where it is hosted. Find the window where the application is being hosted (probably Command Prompt), close the application (in Command Prompt: type 'q' then enter), then paste the following script, then restart the application (in Command Prompt: 'npx vite dev --host')." },
    //     { type: "copyable", value: "del db\\main.db"+"\n"+"del db\\main.db-shm"+"\n"+"del db\\main.db-wal"+"\n"+"copy db\\backups\\minute\\"+weekly_backups[backup_selected_index]+" db\\main.db" }
    // ]);
    let restoreScriptEntries = $derived([
        { type: "warning", value: `Are you sure you want to restore the following backup?` },
        { type: "warning", value: weekly_backups[backup_selected_index] },
        { type: "hidden_txt", name: "filename", value: weekly_backups[backup_selected_index] }
    ]);

    // let importFileInput = $state(HTMLElement); // Reactive state variable (initialized to null)
    let importFileInput: HTMLInputElement;
    function validateImportSubmit(event: SubmitEvent) {
        if (importFileInput && importFileInput.files && importFileInput.files.length > 0) {
            // File attached properly
        }else {
            alert("Please attach a file");
            event.preventDefault();
        }
    };

    $effect(() => {
        if (browser && form?.message) {
            alert(form?.message);
        }
    });

    // onMount(() => {
    $effect.pre(() => {
        if (form?.is_exporting) {
            const csv_blob = new Blob([form.csv_file], { type: "text/csv;charset=utf-8;"});
            const csv_url = URL.createObjectURL(csv_blob);
            const csv_link = document.createElement('a');
            csv_link.setAttribute("href", csv_url);
            csv_link.setAttribute("download", form.filename+".csv");
            document.body.appendChild(csv_link);
            csv_link.click();
            document.body.removeChild(csv_link);
            URL.revokeObjectURL(csv_url);

            tick().then(() => {
                replaceState("/data_management", {});
            });
        }

        if (browser) {
            tick().then(() => {
                if (!backups_scrollable) return;
                backups_scrollable.scrollTop = backups_scrollable.scrollHeight;
            });
        }
    });
</script>

<Topbar user={data.user} profile_picture={data.profile_picture} isLoggedIn={true} isAdmin={data.user.privileges === "Admin"} name={data.user.name.length > 0 ? data.user.name : data.user.username} />

<ExpandingInterior>
    <all-stuff id={$isMobile ? "is-mobile" : ""}>
        <stuff-cont id={!$isMobile ? "left" : "mobile-left"}>
            <form id="exportForm" action="?/exportData" method="POST" use:enhance={() => {
                return async ({ update, result }) => {
                    await update({ reset: false });
                };
            }}></form>
            <flex-bit>
                <icon>
                    <IconDownload />
                </icon>
                <big-title>Export Data</big-title>
            </flex-bit>
            <flex-bit>
                <little-info>Select Table: </little-info>
                <!-- <select form="exportForm" name="table_to_download" bind:value={table_to_download}>
                    <option value="users">Accounts</option>
                    <option value="activity_log">Activity Log</option>
                    <option value="facility">Facilities</option>
                    <option value="staff">Staff</option>
                    <option value="vendors">Vendors</option>
                </select> -->
                <not-a class="shifted-dropdown">
                    <FormDropdown
                        entries={[
                            { title: "Accounts", value: "users" },
                            { title: "Activity Log", value: "activity_log" },
                            { title: "Facilities", value: "facility" },
                            { title: "Staff", value: "staff" },
                            { title: "Vendors", value: "vendors" }
                        ]}
                        form="exportForm"
                        name="table_to_download"
                        bind:value={table_to_download}
                        input_type="text"
                        is_data_management_dropdown={true}
                    />
                </not-a>
                <Tooltip hover_text={CSVExportTableExplanation}>
                    <not-a class="icon shifted-info-icon">
                        <IconInfo />
                    </not-a>
                </Tooltip>
            </flex-bit>
            <flex-bit>
                <little-info>Include Deleted: </little-info>
                <!-- <select form="exportForm" name="include_deleted" bind:value={include_deleted}>
                    <option value="True">Yes</option>
                    <option value="False">No</option>
                </select> -->
                <not-a class="shifted-dropdown">
                    <FormDropdown
                        entries={[
                            { title: "Yes", value: "True" },
                            { title: "No", value: "False" },
                        ]}
                        form="exportForm"
                        name="include_deleted"
                        bind:value={include_deleted}
                        input_type="text"
                        is_data_management_dropdown={true}
                    />
                </not-a>
                <Tooltip hover_text={CSVExportIncludeDeletedExplanation}>
                    <not-a class="icon shifted-info-icon">
                        <IconInfo />
                    </not-a>
                </Tooltip>
            </flex-bit>
            <flex-bit>
                <little-info>Data will be downloaded as a CSV file.</little-info>
            </flex-bit>
            <flex-bit class="bit-widened">
                <!-- <a target="_self" href={"/data_management?export=true&&table="+table_to_download}> -->
                <button form="exportForm" class="big-button">
                    <IconDownload /> Export
                    <Tooltip hover_text={CSVExportExplanation}>
                        <not-a class="icon shifted-info-icon button-icon">
                            <IconInfo />
                        </not-a>
                    </Tooltip>
                </button>
                <!-- </a> -->
            </flex-bit>
        </stuff-cont>
        <stuff-cont id={!$isMobile ? "mid" : "mobile-mid"}>
            <form id="importForm" action="?/loadCSVFile" method="POST" enctype="multipart/form-data" onsubmit={validateImportSubmit} use:enhance></form>
            <flex-bit>
                <icon>
                    <IconUpload />
                </icon>
                <big-title>Import Data</big-title>
            </flex-bit>
            <flex-bit class="flex-column">
                <little-info>Use with caution! Read instructions carefully. It is highly recommended to create a manual backup before use.</little-info>
            </flex-bit>
            <flex-bit>
                <little-info>Select Table: </little-info>
                <!-- <select form="importForm" name="table" bind:value={importTable}>
                    <option value="facility">Facilities</option>
                    <option value="staff">Staff</option>
                    <option value="vendors">Vendors</option>
                </select> -->
                <not-a class="shifted-dropdown">
                    <FormDropdown
                        entries={[
                            { title: "Facilities", value: "facility" },
                            { title: "Staff", value: "staff" },
                            { title: "Vendors", value: "vendors" },
                        ]}
                        form="importForm"
                        name="table"
                        bind:value={importTable}
                        input_type="text"
                        is_data_management_dropdown={true}
                    />
                </not-a>
                <Tooltip hover_text={CSVImportTableExplanation}>
                    <not-a class="icon shifted-info-icon">
                        <IconInfo />
                    </not-a>
                </Tooltip>
            </flex-bit>
            <flex-bit>
                <little-info>Select Mode: </little-info>
                <!-- <select form="importForm" name="mode" bind:value={importMode}>
                    <option value="add">Add All</option>
                    <option value="add_update">Add and Update</option>
                    <option value="ukg_special">UKG Staff</option>
                    <option value="update">Update Only</option>
                </select> -->
                <not-a class="shifted-dropdown">
                    <FormDropdown
                        entries={[
                            { title: "Add All", value: "add" },
                            { title: "Add and Update", value: "add_update" },
                            { title: "UKG Staff", value: "ukg_special" },
                            { title: "Update Only", value: "update" },
                        ]}
                        form="importForm"
                        name="mode"
                        bind:value={importMode}
                        input_type="text"
                        is_data_management_dropdown={true}
                    />
                </not-a>
                <Tooltip hover_text={CSVImportModeExplanation}>
                    <not-a class="icon shifted-info-icon">
                        <IconInfo />
                    </not-a>
                </Tooltip>
            </flex-bit>
            <flex-bit>
                <little-info>Select File: </little-info>
                <input type="file" form="importForm" name="csv_file" class="file-selector shifted-input" bind:this={importFileInput} accept=".csv, .txt">
                <Tooltip hover_text={CSVImportFileExplanation}>
                    <not-a class="icon shifted-info-icon">
                        <IconInfo />
                    </not-a>
                </Tooltip>
            </flex-bit>
            <flex-bit class="flex-column">
                <little-info class="info-spaced">
                    Select a CSV file for upload. 
                    {#if importMode === "add"}
                        All entries will be added, even if a duplicate exists (Add All Mode).
                    {:else if importMode === "add_update"}
                        Entries without a duplicate will be added, entries with a duplicate already in the database will update that duplicate instead (Add and Update Mode).
                    {:else if importMode === "ukg_special"}
                        Entries without a duplicate will be added, entries with a duplicate already in the database will update that duplicate instead. Columns are parsed specially to support UKG Imports (UKG Staff Mode).
                    {:else}
                        Entries without a duplicate will be skipped, entries with a duplicate already in the database will update that duplicate (Update Only Mode).
                    {/if}
                    Interprets the first line as headers.
                </little-info>
            </flex-bit>
            <flex-bit class="bit-widened">
                <!-- <a target="_self" href={"/data_management?export=true&&table="+table_to_download}> -->
                <!-- <input type="submit" form="importForm" class="big-button" value="Import"> -->
                <!-- </a> -->
                <button form="importForm" class="big-button">
                    <IconUpload /> Import
                    <Tooltip hover_text={CSVImportExplanation}>
                        <not-a class="icon shifted-info-icon button-icon">
                            <IconInfo />
                        </not-a>
                    </Tooltip>
                </button>
            </flex-bit>
        </stuff-cont>
        <stuff-cont id={!$isMobile ? "right" : "mobile-right"}>
            <flex-bit>
                <icon>
                    <IconRestore />
                </icon>
                <big-title>Restore Backup</big-title>
            </flex-bit>
            <!-- <flex-bit>
                <little-info class="larger-info">Backup Files:</little-info>
            </flex-bit> -->
            <flex-bit class="bit-with-scroll" bind:this={backups_scrollable}>
                {#each weekly_backups as backup, index}
                    {#if index === backup_selected_index}
                        <flex-bit class="bit-with-background bit-with-border">
                            {backup}
                        </flex-bit>
                    {:else}
                        <button class="flex-bit button-as-blank-box bit-with-background" onclick={() => backup_selected_index = index}>
                            <!-- <flex-bit class="bit-with-background"> -->
                                {backup}
                            <!-- </flex-bit> -->
                        </button>
                    {/if}
                {/each}
            </flex-bit>
            <flex-bit class="bit-widened flex-column">
                <button class="big-button" onclick={restoreScriptClickRaise}>
                    <IconRestore />
                    Restore Backup
                    <Tooltip hover_text={BackupRestoreExplanation}>
                        <not-a class="icon shifted-info-icon button-icon">
                            <IconInfo />
                        </not-a>
                    </Tooltip>
                </button>
                <!-- <a target="_self" href={"/data_management?backup=true"}> -->
                <form id="backupForm" action="?/createBackup" method="POST" use:enhance></form>
                <button form="backupForm" class="big-button">
                    <IconBackup />
                    Backup Now
                    <Tooltip hover_text={BackupCreateExplanation}>
                        <not-a class="icon shifted-info-icon button-icon">
                            <IconInfo />
                        </not-a>
                    </Tooltip>
                </button>
                <!-- </a> -->
                <form id="invalidateCacheForm" action="?/invalidateCaches" method="POST" use:enhance></form>
                <button form="invalidateCacheForm" class="big-button">
                    <IconRefreshCache />
                    Refresh All Caches
                    <Tooltip hover_text={RefreshAllCachesExplanation}>
                        <not-a class="icon shifted-info-icon button-icon">
                            <IconInfo />
                        </not-a>
                    </Tooltip>
                </button>
            </flex-bit>
        </stuff-cont>
    </all-stuff>
</ExpandingInterior>

<Footer withSpacer={false} />

<ModalPopup
    title="Restore Backup"
    action="restoreBackup"
    entries={restoreScriptEntries}
    bind:this={restoreScriptPopup}
/>

<style>

    .button-as-blank-box {
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

    all-stuff {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 30px;
        grid-auto-rows: auto 1fr;
        margin: 20px;
        width: 94%;
        margin-left: 3%;
        margin-right: 3%;
        height: 100%;
    }
    #is-mobile {
        grid-template-columns: 1fr;
        grid-auto-rows: auto auto auto;
    }
    

    #left {
        grid-column: 1;
        grid-row: 1;
    }
    #mid {
        grid-column: 2;
        grid-row: 1;
    }
    #right {
        grid-column: 3;
        grid-row: 1;
    }

    #mobile-left {
        grid-column: 1;
        grid-row: 1;
    }
    #mobile-mid {
        grid-column: 1;
        grid-row: 2;
    }
    #mobile-right {
        grid-column: 1;
        grid-row: 3;
    }

    stuff-cont {
        background-color: var(--accent0);
        /* border-radius: 20px; */
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    flex-bit, .flex-bit {
        display: flex;
        margin: 20px;
        margin-left: auto;
        margin-right: auto;
        max-width: 94%;
        /* flex-direction: column; */
    }

    .bit-widened {
        width: 100%;
    }

    .bit-with-background {
        /* background-color: var(--accent3); */
        border: 2px solid var(--accent1);
        /* border-radius: 10px; */
        padding: 3px;
        /* padding-right: auto; */
        margin: 1px;
        /* width: 90%; */
        width: 100%;
        /* align-items: center; */
    }

    .bit-with-border {
        border: 2px solid var(--accentb);
    }

    .bit-with-scroll {
        flex-direction: column;
        overflow-y: auto;
        height: 300px;
        width: 90%;
        margin-right: 5%;
        margin-left: 5%;
        background-color: var(--accent1);
        /* border-radius: 10px; */
        border: 2px solid var(--accent5);
    }

    .flex-column {
        flex-direction: column;
    }

    /* select, option {
        color: var(--accent5);
        background-color: var(--accent1);
        font-size: var(--font-size3);
    } */

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
        padding: 2px;
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

    /* a {
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

    .info-spaced {
        margin: 10px;
    }

    /* .larger-info {
        font-size: var(--font-size4);
    } */

    .file-selector {
        border-radius: 0px;
    }

    .icon {
        padding: 6px;
        /* padding-left: 4px; */
        /* padding-right: 20px; */
        /* text-align: right; */
        font-size: var(--font-size3);
        color: var(--accent5);
        font-family: Arial, sans-serif;
    }
    .shifted-info-icon {
        position: relative;
        top: 0px;

        display: inline-flex;
        gap: 2px;
        align-items: center;
    }

    .shifted-dropdown {
        position: relative;
        top: 2px;
    }
    .shifted-input {
        position: relative;
        top: 6px;
    }

    .button-icon {
        color: var(--accent1);
    }

</style>