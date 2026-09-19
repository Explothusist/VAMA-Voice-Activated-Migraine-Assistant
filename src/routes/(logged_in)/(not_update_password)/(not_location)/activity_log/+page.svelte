<svelte:options runes={true} />
<script lang="ts">
    import ListPage from "$lib/components/ListPage.svelte";
    import ModalPopup from "$lib/components/ModalPopup.svelte";
    import Topbar from "$lib/components/Topbar.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import { ActivityLogColumns, getEntriesFromData_ActivityLog, getViewActivityLogEntries_ActivityLog } from "$lib/activity_log_utils.js";
    import { kDefaultJSONActivityLog, type JSONActivityLog } from "$lib/db_utils.js";
    import { browser } from "$app/environment";
    import { tick } from "svelte";
    import { replaceState } from "$app/navigation";

    let { data } = $props();


    // svelte-ignore state_referenced_locally
    let page_filter = $state(data.initial_filter);
    let page_title = $derived(page_filter === "all" ? "All Logs" : (page_filter === "import" ? "Import Logs" : "Activity Logs"));

    function filter_page(new_value: string) {
        page_filter = new_value;
        changeSearchParams(search_term, sort_column, sort_reversed);
    };

    // svelte-ignore state_referenced_locally
    let activity_log_data = $state<JSONActivityLog[]>(data.initial_data);
    // svelte-ignore state_referenced_locally
    let offset = $state(data.initial_offset);
    let isLoading = $state(false);
    let requestId = $state(0);
    // svelte-ignore state_referenced_locally
    let hasMore = $state(data.initial_has_more);
    let LoadMoreSentinel: HTMLDivElement | undefined = $state();
    // svelte-ignore state_referenced_locally
    let search_term: string = $state(data.initial_search);
    // svelte-ignore state_referenced_locally
    let sort_column: number = $state(data.initial_sort_col);
    // svelte-ignore state_referenced_locally
    let sort_reversed: boolean = $state(data.initial_sort_reversed);
    let override_data = $state(false);
    // svelte-ignore state_referenced_locally
    let total_results = $state(data.initial_total_results);

    const loadMoreCount = 50;
    async function loadMore() {
        // if (isLoading || !hasMore) return;
        if (!hasMore) return;
        requestId += 1;
        const this_id = requestId;

        isLoading = true;

        try {
            const result = await fetch(`/activity_log?count=${loadMoreCount}&filter=${page_filter}&offset=${offset}&filter=${page_filter}&search_term=${encodeURIComponent(search_term)}&sort_col=${sort_column}&sort_reversed=${sort_reversed ? 1 : 0}`);
            if (this_id !== requestId) return;
            const new_data = await result.json();
            if (this_id !== requestId) return;
            if (override_data) {
                activity_log_data = [...new_data.entries];
                override_data = false;
            }else {
                activity_log_data = [...activity_log_data, ...new_data.entries];
            }
            offset = new_data.new_offset;
            hasMore = new_data.has_more;
            total_results = new_data.total_results;
        } finally { // Runs either way
            isLoading = false;
        }
    };
    // async function reloadExisting() {
    //     if (isLoading) return;

    //     isLoading = true;
    //     try {
    //         const result = await fetch(`/activity_log?count=${offset}&offset=0&search_term=${encodeURIComponent(search_term)}&sort_col=${sort_column}&sort_reversed=${sort_reversed ? 1 : 0}`);
    //         const new_data = await result.json();
    //         activity_log_data = [...new_data.entries];
    //         offset = new_data.new_offset;
    //         hasMore = new_data.has_more;
    //         total_results = new_data.total_results;
    //     } finally { // Runs either way
    //         isLoading = false;
    //     }
    // };
    async function changeSearchParams(n_search_term: string, n_sort_column: number, n_sort_reversed: boolean) {
        search_term = n_search_term;
        sort_column = n_sort_column;
        sort_reversed = n_sort_reversed;
        offset = 0;
        hasMore = true;
        override_data = true;

        const new_table = page_filter;
        const new_search_term = search_term;
        const new_sort_column = sort_column;
        const new_sort_reversed = sort_reversed;
        if (browser) {
            tick().then(() => {
                // if (!pageAlive) return;
                replaceState(`/activity_log?filter=${new_table}&search=${new_search_term}&sort_col=${new_sort_column}&sort_reversed=${new_sort_reversed}`, {});
            });
        }

        await loadMore();
    };

    let activity_log = $derived(getEntriesFromData_ActivityLog(activity_log_data, viewActLogClickRaise));

    
    let viewActLogPopup: (ModalPopup | undefined) = $state();
    let viewActLogIndex = $state(0);
    function viewActLogClickRaise(id: number) {
        if (!viewActLogPopup) return;
        viewActLogIndex = id;
        viewActLogPopup.raisePopup();
    };
    let viewActLogEntry = $derived(viewActLogIndex < activity_log.length ? (activity_log[viewActLogIndex].self as JSONActivityLog) : kDefaultJSONActivityLog);
    let viewActLogEntries = $derived(getViewActivityLogEntries_ActivityLog(viewActLogEntry));

    // let oldPageFilter = ""; // No, this should not be $state. In fact, if you make it such, you will brick the page.
    // let pageAlive = true;
    // $effect(() => {
    //     if (oldPageFilter !== page_filter) {
    //         oldPageFilter = page_filter;
    //         changeSearchParams(search_term, sort_column, sort_reversed);

    //         // const new_table = page_filter;
    //         // if (browser) {
    //         //     tick().then(() => {
    //         //         if (!pageAlive) return;
    //         //         replaceState("/activity_log?select="+new_table, {});
    //         //     });
    //         // }
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
</script>

<Topbar user={data.user} profile_picture={data.profile_picture} isLoggedIn={true} isAdmin={data.user.privileges === "Admin"} name={data.user.name.length > 0 ? data.user.name : data.user.username} />

<ExpandingInterior>
    <ListPage 
        title={page_title}
        columns={ActivityLogColumns} 
        entries={activity_log} 
        isAdmin={data.user.privileges === "Admin"} 
        hasEdit={false} 
        hasNew={false}
        hasOpenNew={true}
        column_sorted_by={sort_column} 
        sort_reversed={sort_reversed}
        columnsCollapseMobile={[false, false, false, false, false, true]}
        columnsCollapseMobilePortrait={[false, true, true, false, false, true]}
        withoutStandardSearchSort={true}
        onSearchSortChange={(search_term: string, sort_column: number, sort_reversed: boolean) => changeSearchParams(search_term, sort_column, sort_reversed)}
        hasNumResults={true}
        numResults={total_results}
        titleAsDropDown={true}
        titleDropDownOptions={[
            { value: "activity", title: "Activity Logs" }, 
            { value: "import", title: "Import Logs" }, 
            { value: "all", title: "All Logs" }
        ]}
        titleDropDownSelected={page_filter}
        onTitleDropdownChange={(new_value: string) => filter_page(new_value)}
        initialSearch={data.initial_search}
    />
    {#if isLoading}
        <text-entry>
            <loading-text>
                Loading...
            </loading-text>
        </text-entry>
    {/if}
    <nothing bind:this={LoadMoreSentinel}></nothing>
</ExpandingInterior>

<Footer />

<ModalPopup
    title="Activity Log Entry"
    action=""
    entries={viewActLogEntries}
    hasConfirm={false}
    bind:this={viewActLogPopup}
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

    loading-text {
        font-size: var(--font-size1);
        margin-left: 10px;
        color: var(--accent5);
        padding: 6px;
        width: 200px;
        font-size: var(--font-size4);
        margin-bottom: 40px;
    }
</style>