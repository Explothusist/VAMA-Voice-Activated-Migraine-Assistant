<svelte:options runes={true} />
<script lang="ts">
    import Footer from "$lib/components/Footer.svelte";
    import ListPage from "$lib/components/ListPage.svelte";
    import Topbar from "$lib/components/Topbar.svelte";
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import ModalPopup from "$lib/components/ModalPopup.svelte";
    import { AllLocationColumns, FacilityVendorColumns, getFacilityEntriesFromData_VendorFacilities, getRestoreFacilityEntries_Facility, getRestoreVendorEntries_Vendor, getVendorsEntriesFromData_FacilityVendors } from "$lib/location_utils.js";
    import { AllStaffColumns, getEntriesFromData_Staff, getRestoreStaffEntries_Staff, getViewStaffEntries_Staff } from "$lib/staff_utils.js";
    import { AccountColumns, getEntriesFromData_Account, getRestoreAccountEntries_Account, getViewAccountEntries_Account, kDefaultExistingProfilePicture } from "$lib/account_utils.js";
    import { AnnouncementColumns, getEntriesFromData_Announcement, getRestoreAnnouncementEntries_Announcement, getViewAnnouncementEntries_Announcement } from "$lib/announcement_utils.js";
    import { AllISPEntries, getEntriesFromData_ISP, getRestoreISPEntries_ISP, getViewISPEntries_ISP } from "$lib/isp_utils.js";
    import { onDestroy, tick } from "svelte";
    import { browser } from "$app/environment";
    import { replaceState } from "$app/navigation";
    import { kDefaultAnyJSON, kDefaultJSONFacility, kDefaultJSONVendor, type anyJSON, type JSONAnnouncement, type JSONFacility, type JSONISP, type JSONStaff, type JSONUser, type JSONVendor } from "$lib/db_utils.js";
    import type { ListPageEntry, ModalPopupEntry } from "$lib/util.js";

    let { form, data } = $props();

    function getFilterFromTable(table: string): string {
        switch (table) {
            case "facility":
                return "Deleted Facilities";
            case "vendors":
                return "Deleted Vendors";
            case "staff":
                return "Deleted Staff";
            case "users":
                return "Deleted Accounts";
            case "announcements":
                return "Deleted Announcements";
            case "isp":
                return "Deleted ISPs";
        }
        return "Deleted Facilities";
    };
    function getTableFromFilter(filter: string): string {
        switch (filter) {
            case "Deleted Facilities":
                return "facility";
            case "Deleted Vendors":
                return "vendors";
            case "Deleted Staff":
                return "staff";
            case "Deleted Accounts":
                return "users";
            case "Deleted Announcements":
                return "announcements";
            case "Deleted ISPs":
                return "isp";
        }
        return "facility";
    };
    function getColumnsFromFilter(filter: string): string[] {
        switch (filter) {
            case "Deleted Facilities":
                return [...AllLocationColumns, "Date Deleted"];
            case "Deleted Vendors":
                return [...FacilityVendorColumns, "Date Deleted"];
            case "Deleted Staff":
                return [...AllStaffColumns, "Date Deleted"];
            case "Deleted Accounts":
                return [...AccountColumns, "Date Deleted"];
            case "Deleted Announcements":
                return [...AnnouncementColumns, "Date Deleted"];
            case "Deleted ISPs":
                return [...AllISPEntries, "Date Deleted"];
        }
        return AllLocationColumns;
    };
    function getColumnsMappedFromFilter(data: anyJSON[], filter: string): ListPageEntry[] {
        switch (filter) {
            case "Deleted Facilities":
                return getFacilityEntriesFromData_VendorFacilities(data as JSONFacility[], kDefaultJSONVendor, [], true);
            case "Deleted Vendors":
                return getVendorsEntriesFromData_FacilityVendors(data as JSONVendor[], kDefaultJSONFacility, true);
            case "Deleted Staff":
                return getEntriesFromData_Staff(data as JSONStaff[], viewDeletedClickRaise, true, true);
            case "Deleted Accounts":
                return getEntriesFromData_Account(data as JSONUser[], data.map((a) => kDefaultExistingProfilePicture), viewDeletedClickRaise, true);
            case "Deleted Announcements":
                return getEntriesFromData_Announcement(data as JSONAnnouncement[], viewDeletedClickRaise, true);
            case "Deleted ISPs":
                return getEntriesFromData_ISP(data as JSONISP[], viewDeletedClickRaise, true, true, true);
        }
        return [];
    };
    function getViewEntriesFromFilter(entry: anyJSON, filter: string): ModalPopupEntry[] {
        switch (filter) {
            case "Deleted Facilities":
                return [];
            case "Deleted Vendors":
                return [];
            case "Deleted Staff":
                return getViewStaffEntries_Staff(entry as JSONStaff);
            case "Deleted Accounts":
                return getViewAccountEntries_Account(entry as JSONUser, kDefaultExistingProfilePicture);
            case "Deleted Announcements":
                return getViewAnnouncementEntries_Announcement(entry as JSONAnnouncement);
            case "Deleted ISPs":
                return getViewISPEntries_ISP(entry as JSONISP);
        }
        return [];
    };
    function getRestoreEntriesFromFilter(entry: anyJSON, filter: string): ModalPopupEntry[] {
        switch (filter) {
            case "Deleted Facilities":
                return getRestoreFacilityEntries_Facility(entry as JSONFacility);
            case "Deleted Vendors":
                return getRestoreVendorEntries_Vendor(entry as JSONVendor);
            case "Deleted Staff":
                return getRestoreStaffEntries_Staff(entry as JSONStaff);
            case "Deleted Accounts":
                return getRestoreAccountEntries_Account(entry as JSONUser);
            case "Deleted Announcements":
                return getRestoreAnnouncementEntries_Announcement(entry as JSONAnnouncement);
            case "Deleted ISPs":
                return getRestoreISPEntries_ISP(entry as JSONISP);
        }
        return [];
    };

    // svelte-ignore state_referenced_locally
    let page_filter = $state(getFilterFromTable(data.select_table ?? "facility"));
    // let page_title = $derived(page_filter);
    let page_table = $derived(getTableFromFilter(page_filter));
    let page_columns = $derived(getColumnsFromFilter(page_filter));
    const page_title_dropdown_options = [
        { value: "Deleted Accounts", title: "Deleted Accounts" },
        { value: "Deleted Announcements", title: "Deleted Announcements" },
        { value: "Deleted Facilities", title: "Deleted Facilities" }, 
        { value: "Deleted ISPs", title: "Deleted ISPs" }, 
        { value: "Deleted Staff", title: "Deleted Staff" },
        { value: "Deleted Vendors", title: "Deleted Vendors" }, 
    ];

    let entry_data = $state<anyJSON[]>([]);
    let offset = $state(0);
    let isLoading = $state(false);
    let hasMore = $state(true);
    let LoadMoreSentinel: HTMLDivElement | undefined = $state();
    let search_term = $state("");
    let sort_column = $state(0);
    let sort_reversed = $state(false);
    let override_data = $state(false);
    let total_results = $state(0);

    async function loadMore() {
        if (isLoading || !hasMore) return;

        isLoading = true;

        try {
            const result = await fetch(`/trash_can?table=${page_table}&count=50&offset=${offset}&search_term=${encodeURIComponent(search_term)}&sort_col=${sort_column}&sort_reversed=${sort_reversed ? 1 : 0}`);
            const new_data = await result.json();
            if (override_data) {
                entry_data = [...new_data.entries];
                override_data = false;
            }else {
                entry_data = [...entry_data, ...new_data.entries];
            }
            offset = new_data.new_offset;
            hasMore = new_data.has_more;
            total_results = new_data.total_results;
        } finally { // Runs either way
            isLoading = false;
        }
    };
    async function reloadExisting() {
        if (isLoading) return;

        isLoading = true;
        try {
            const result = await fetch(`/trash_can?table=${page_table}&count=${offset}&offset=0&search_term=${encodeURIComponent(search_term)}&sort_col=${sort_column}&sort_reversed=${sort_reversed ? 1 : 0}`);
            const new_data = await result.json();
            entry_data = [...new_data.entries];
            offset = new_data.new_offset;
            hasMore = new_data.has_more;
            total_results = new_data.total_results;
        } finally { // Runs either way
            isLoading = false;
        }
    };
    async function resetEntries(hard = false) {
        offset = 0;
        hasMore = true;
        if (hard) {
            entry_data = [];
        }
        override_data = true;

        await loadMore();
    };
    async function changeSearchParams(n_search_term: string, n_sort_column: number, n_sort_reversed: boolean) {
        search_term = n_search_term;
        sort_column = n_sort_column;
        sort_reversed = n_sort_reversed;

        await resetEntries();
    };
    
    let page_entries = $derived(
        getColumnsMappedFromFilter(entry_data, page_filter).map((a) => { return {...a, tintEntryRed: true, hasRestore: true}; })
    );

    let viewDeletedIndex = $state(0);
    let viewDeletedPopup: (ModalPopup | undefined) = $state();
    function viewDeletedClickRaise(id: number) {
        if (!viewDeletedPopup) return;
        viewDeletedIndex = id;
        viewDeletedPopup.raisePopup();
    };
    let viewSelectedEntry = $derived(viewDeletedIndex < page_entries.length ? (page_entries[viewDeletedIndex].self as anyJSON) : kDefaultAnyJSON);
    let viewDeletedEntries = $derived(getViewEntriesFromFilter(viewSelectedEntry, page_filter));

    let restoreDeletedPopup: (ModalPopup | undefined) = $state();
    let restoreDeletedIndex = $state(0);
    function restoreDeletedClickRaise(id: number) {
        if (!restoreDeletedPopup) return;
        restoreDeletedIndex = id;
        restoreDeletedPopup.raisePopup();
    };
    let restoreSelectedEntry = $derived(restoreDeletedIndex < page_entries.length ? page_entries[restoreDeletedIndex].self : kDefaultAnyJSON);
    let restoreDeletedEntries = $derived(getRestoreEntriesFromFilter(restoreSelectedEntry, page_filter));

    async function filter_page(new_value: string) {
        page_filter = new_value;

        await resetEntries(true);
    };

    let old_reload_token = 0;
    let reload_token = $derived(form?.reload_token ?? 0);
    $effect(() => {
        if (reload_token !== old_reload_token) {
            old_reload_token = reload_token;
            reloadExisting();
        }
    });

    // $effect(() => {
    //     if (browser && form?.message) {
    //         alert(form?.message);
    //     }
    // });

    $effect(() => {
        // loadMore(); // Initial Load
        if (!LoadMoreSentinel) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    loadMore();
                }
            },
            {
                root: null,
                rootMargin: '500px',
                threshold: 0
            }
        );
        if (LoadMoreSentinel) {
            observer.observe(LoadMoreSentinel);
        }

        return () => observer.disconnect();
    });
    
    let oldPageFilter = "facility"; // No, this should not be $state. In fact, if you make it such, you will brick the page.
    let pageAlive = true;
    $effect(() => {
        if (oldPageFilter !== page_filter) {
            oldPageFilter = page_filter;

            const new_table = page_table;
            if (browser) {
                tick().then(() => {
                    if (!pageAlive) return;
                    replaceState("/trash_can?select="+new_table, {});
                });
            }
        }
    });
    onDestroy(() => {
        pageAlive = false;
    });
</script>

<Topbar user={data.user} profile_picture={data.profile_picture} isLoggedIn={true} isAdmin={data.user.privileges === "Admin"} name={data.user.name.length > 0 ? data.user.name : data.user.username} />

<ExpandingInterior>
    <ListPage 
        title={page_filter} 
        columns={page_columns}
        entries={page_entries} 
        isAdmin={data.user.privileges === "Admin"} 
        hasNew={false}
        hasEdit={false} 
        hasRestore={true}
        onClickRestore={restoreDeletedClickRaise}
        columnsCollapseMobile={ [false, true, false, false, true] }
        columnsCollapseMobilePortrait={ [false, true, false, true, true, true] }
        withoutStandardSearchSort={true}
        onSearchSortChange={(search_term: string, sort_column: number, sort_reversed: boolean) => changeSearchParams(search_term, sort_column, sort_reversed)}
        hasNumResults={true}
        numResults={total_results}
        titleAsDropDown={true}
        titleDropDownOptions={page_title_dropdown_options}
        titleDropDownSelected={page_filter}
        onTitleDropdownChange={(new_value: string) => filter_page(new_value)}
        tintEntriesRed={true}
        initialSearch={data.initial_search}
    />
    <nothing bind:this={LoadMoreSentinel}></nothing>
</ExpandingInterior>

<ModalPopup
    title="Restore Deleted Object"
    action="restoreDeleted"
    entries={restoreDeletedEntries}
    useFormEnhance={true}
    bind:this={restoreDeletedPopup}
/>

<ModalPopup
    title="View Deleted"
    action=""
    entries={viewDeletedEntries}
    hasConfirm={false}
    useFormEnhance={true}
    bind:this={viewDeletedPopup}
/>

<Footer />

<style>

</style>

