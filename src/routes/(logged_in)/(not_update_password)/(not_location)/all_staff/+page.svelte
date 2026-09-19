<svelte:options runes={true} />
<script lang="ts">
    import Footer from "$lib/components/Footer.svelte";
    import ListPage from "$lib/components/ListPage.svelte";
    import StaffEditModals from "$lib/components/StaffEditModals.svelte";
    import Topbar from "$lib/components/Topbar.svelte";
    import { browser } from '$app/environment';
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import { AllStaffColumns, getEntriesFromData_Staff } from "$lib/staff_utils.js";
    import type { JSONStaff } from "$lib/db_utils.js";
    import { tick } from "svelte";
    import { replaceState } from "$app/navigation";

    let { form, data } = $props();


    // svelte-ignore state_referenced_locally
    let page_filter = $state(data.initial_filter);
    let page_title = $derived(page_filter === "facility" ? "All Facility Staff" : (page_filter === "vendor" ? "All Vendor Staff" : "All Staff"));

    function filter_page(new_value: string) {
        page_filter = new_value;
        changeSearchParams(search_term, sort_column, sort_reversed);
    };

    // svelte-ignore state_referenced_locally
    let staff_data = $state<JSONStaff[]>(data.initial_data);
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
            const result = await fetch(`/all_staff?facility_id=-1&count=${loadMoreCount}&filter=${page_filter}&offset=${offset}&search_term=${encodeURIComponent(search_term)}&sort_col=${sort_column}&sort_reversed=${sort_reversed ? 1 : 0}`);
            if (this_id !== requestId) return;
            const new_data = await result.json();
            if (this_id !== requestId) return;
            if (override_data) {
                staff_data = [...new_data.entries];
                override_data = false;
            }else {
                staff_data = [...staff_data, ...new_data.entries];
            }
            offset = new_data.new_offset;
            hasMore = new_data.has_more;
            total_results = new_data.total_results;
        } finally { // Runs either way
            isLoading = false;
        }
    };
    async function reloadExisting() {
        // if (isLoading) return;
        requestId += 1;
        const this_id = requestId;

        isLoading = true;
        try {
            const result = await fetch(`/all_staff?facility_id=-1&count=${offset}&offset=0&search_term=${encodeURIComponent(search_term)}&sort_col=${sort_column}&sort_reversed=${sort_reversed ? 1 : 0}`);
            if (this_id !== requestId) return;
            const new_data = await result.json();
            if (this_id !== requestId) return;
            staff_data = [...new_data.entries];
            offset = new_data.new_offset;
            hasMore = new_data.has_more;
            total_results = new_data.total_results;
        } finally { // Runs either way
            isLoading = false;
        }
    };
    async function changeSearchParams(n_search_term: string, n_sort_column: number, n_sort_reversed: boolean) {
        search_term = n_search_term;
        sort_column = n_sort_column;
        sort_reversed = n_sort_reversed;
        offset = 0;
        // staff_data = [];
        hasMore = true;
        override_data = true;
        
        const new_table = page_filter;
        const new_search_term = search_term;
        const new_sort_column = sort_column;
        const new_sort_reversed = sort_reversed;
        if (browser) {
            tick().then(() => {
                // if (!pageAlive) return;
                replaceState(`/all_staff?filter=${new_table}&search=${new_search_term}&sort_col=${new_sort_column}&sort_reversed=${new_sort_reversed}`, {});
            });
        }

        await loadMore();
    };

    let staff_edit_modals: (StaffEditModals | undefined) = $state();

    function viewStaffClickRaise(id: number) {
        staff_edit_modals?.viewStaffClickRaise(id);
    }
    
    let staff_members = $derived(getEntriesFromData_Staff(staff_data, viewStaffClickRaise, true));

    let old_reload_token = 0;
    let reload_token = $derived(form?.reload_token ?? 0);
    $effect(() => {
        if (reload_token !== old_reload_token) {
            old_reload_token = reload_token;
            reloadExisting();
        }
    });

    $effect(() => {
        if (browser && form?.message) {
            alert(form?.message);
        }
    });

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
        columns={AllStaffColumns}
        entries={staff_members} 
        isAdmin={data.user.privileges === "Admin"} 
        hasNew={true}
        hasEdit={true} 
        hasEmail={true}
        hasAssignTo={true}
        column_sorted_by={sort_column} 
        sort_reversed={sort_reversed}
        onClickNew={() => staff_edit_modals?.newStaffClickRaise()} 
        onClickEdit={(id: number) => staff_edit_modals?.editStaffClickRaise(id)} 
        onClickDelete={(id: number) => staff_edit_modals?.deleteStaffClickRaise(id)}
        onClickAssignTo={(id: number) => staff_edit_modals?.assignStaffClickRaise(id)}
        columnsCollapseMobile={ [false, true, false, false, true] }
        columnsCollapseMobilePortrait={ [false, true, false, true, true, true] }
        hasOpenLocation={true}
        withoutStandardSearchSort={true}
        onSearchSortChange={(search_term: string, sort_column: number, sort_reversed: boolean) => changeSearchParams(search_term, sort_column, sort_reversed)}
        hasNumResults={true}
        numResults={total_results}
        titleAsDropDown={true}
        titleDropDownOptions={[
            { value: "facility", title: "All Facility Staff" }, 
            { value: "vendor", title: "All Vendor Staff" }, 
            { value: "all", title: "All Staff" }
        ]}
        titleDropDownSelected={page_filter}
        onTitleDropdownChange={(new_value: string) => filter_page(new_value)}
        initialSearch={data.initial_search}
    />
    <nothing bind:this={LoadMoreSentinel}></nothing>
</ExpandingInterior>

<StaffEditModals 
    bind:this={staff_edit_modals} 
    all_facilities={data.all_facilities} 
    all_vendors={data.all_vendors}
    staff_members={staff_members}
    default_at_facility={"Facility"}
    default_location_id={-1}
/>

<Footer />

<style>

</style>

