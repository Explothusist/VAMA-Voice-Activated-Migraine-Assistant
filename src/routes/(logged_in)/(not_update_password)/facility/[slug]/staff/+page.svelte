<svelte:options runes={true} />
<script lang="ts">
    import { browser } from "$app/environment";
    import { replaceState } from "$app/navigation";
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import ListPage from "$lib/components/ListPage.svelte";
    import StaffEditModals from "$lib/components/StaffEditModals.svelte";
    import Topbar from "$lib/components/Topbar.svelte";
    import type { JSONFacility, JSONStaff } from "$lib/db_utils.js";
    import { getEntriesFromData_Staff, LocationStaffColumns } from "$lib/staff_utils.js";
    import { clamp_string_to_length } from "$lib/util.js";
    import { tick } from "svelte";

    let { form, data } = $props();
    
    let facility = $derived(form?.facility ? form.facility : data.facility);
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
    let search_term = $state(data.initial_search);
    // svelte-ignore state_referenced_locally
    let sort_column = $state(data.initial_sort_col);
    // svelte-ignore state_referenced_locally
    let sort_reversed = $state(data.initial_sort_reversed);
    let override_data = $state(false);
    // svelte-ignore state_referenced_locally
    let total_results = $state(data.initial_total_results);

    let pendingReload = $state(false);

    async function loadMore() {
        requestId += 1;
        const thisId = requestId;

        try {
            const result = await fetch(`/all_staff?facility_id=${facility.id}&count=50&offset=${offset}&search_term=${encodeURIComponent(search_term)}&sort_col=${sort_column}&sort_reversed=${sort_reversed ? 1 : 0}`);
            const new_data = await result.json();
            if (requestId !== thisId) {
                return;
            }
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
            if (pendingReload) {
                pendingReload = false;
                reloadExisting();
            }
        }
    };
    async function reloadExisting() {
        requestId += 1;
        const thisId = requestId;

        try {
            const result = await fetch(`/all_staff?facility_id=${facility.id}&count=${offset}&offset=0&search_term=${encodeURIComponent(search_term)}&sort_col=${sort_column}&sort_reversed=${sort_reversed ? 1 : 0}`);
            const new_data = await result.json();
            if (requestId !== thisId) {
                pendingReload = true;
                return;
            }
            staff_data = [...new_data.entries];
            offset = new_data.new_offset;
            hasMore = new_data.has_more;
            total_results = new_data.total_results;
        } finally { // Runs either way
        }
    };
    async function changeSearchParams(n_search_term: string, n_sort_column: number, n_sort_reversed: boolean) {
        search_term = n_search_term;
        sort_column = n_sort_column;
        sort_reversed = n_sort_reversed;
        offset = 0;
        hasMore = true;
        override_data = true;
        
        const new_search_term = search_term;
        const new_sort_column = sort_column;
        const new_sort_reversed = sort_reversed;
        const facility_id = facility.id;
        if (browser) {
            tick().then(() => {
                // if (!pageAlive) return;
                replaceState(`/facility/${facility_id}/staff?search=${new_search_term}&sort_col=${new_sort_column}&sort_reversed=${new_sort_reversed}`, {});
            });
        }

        await loadMore();
    };

    let staff_edit_modals: (StaffEditModals | undefined) = $state();

    function viewStaffClickRaise(id: number) {
        staff_edit_modals?.viewStaffClickRaise(id);
    }
    
    let staff_members = $derived(getEntriesFromData_Staff(staff_data, viewStaffClickRaise, false));
    let oldFacility: (JSONFacility | null) = null; // No, this should not be $state(). In fact, if you make it such you will brick the page

    let old_reload_token = 0;
    let reload_token = $derived(form?.reload_token ?? 0);
    $effect(() => {
        if (oldFacility?.id !== facility.id) {
            oldFacility = facility;

            // // changeSearchParams(search_term, sort_column, sort_reversed);
            // const facility_id = facility.id;
            // if (browser) {
            //     tick().then(() => {
            //         replaceState("/facility/"+facility_id+"/staff", {});
            //     });
            // }
        }
    });

    $effect(() => {
        if (reload_token !== old_reload_token && reload_token !== 0) {
            old_reload_token = reload_token;
            if (form?.reset) {
                window.scrollTo({
                    top: 0,
                    behavior: "auto"
                })
                changeSearchParams(search_term, sort_column, sort_reversed);
            }else {
                reloadExisting();
            }
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

<Topbar user={data.user} profile_picture={data.profile_picture} 
    isLoggedIn={true} 
    isAdmin={data.user.privileges === "Admin"} 
    name={data.user.name.length > 0 ? data.user.name : data.user.username} 
    showLocationDropdown={true} 
    allLocations={data.all_locations} 
    thisLocationName={facility.name} 
    thisLocationId={facility.id}
    thisLocationActive={facility.active} />

<ExpandingInterior>
    <ListPage 
        title={clamp_string_to_length(facility.name, 50)+" Staff"} 
        columns={LocationStaffColumns} 
        entries={staff_members} 
        isAdmin={data.user.privileges === "Admin" && facility.active} 
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
        columnsCollapseMobile={ [false, false, false, true] }
        columnsCollapseMobilePortrait={ [false, false, true, true] }
        withoutStandardSearchSort={true}
        onSearchSortChange={(search_term: string, sort_column: number, sort_reversed: boolean) => changeSearchParams(search_term, sort_column, sort_reversed)}
        hasNumResults={true}
        numResults={total_results}
        tintTitleRed={!facility.active}
    />
    <nothing bind:this={LoadMoreSentinel}></nothing>
    <text-entry>
        <a href={"/facility/"+facility.id}>
            <button>
                Back to Facility
            </button>
        </a>
    </text-entry>
</ExpandingInterior>

<StaffEditModals 
    bind:this={staff_edit_modals} 
    all_facilities={data.all_facilities} 
    all_vendors={data.all_vendors}
    staff_members={staff_members}
    default_at_facility={"Facility"}
    default_location_id={facility.id}
    facility_id={facility.id}
/>

<Footer />

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

