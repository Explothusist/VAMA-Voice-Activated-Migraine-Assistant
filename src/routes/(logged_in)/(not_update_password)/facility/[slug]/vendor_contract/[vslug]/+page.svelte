<svelte:options runes={true} />
<script lang="ts">
    import LeafletFacilityMap from '$lib/components/LeafletFacilityMap.svelte';
    import Footer from '$lib/components/Footer.svelte';
    import { browser } from '$app/environment';
    import { replaceState } from '$app/navigation';
    import { onDestroy, tick } from 'svelte';
    import ExpandingInterior from '$lib/components/ExpandingInterior.svelte';
    import Topbar from '$lib/components/Topbar.svelte';
    import ModalPopup from '$lib/components/ModalPopup.svelte';
    import type { JSONFacility } from '$lib/db_utils.js';

    let {
        data,
        form
    } = $props();

    let facility = $derived(form?.facility ? form.facility : data.facility);
    let vendor = $derived(form?.vendor ? form.vendor : data.vendor);

    
    let oldFacility: (JSONFacility | null) = null; // No, this should not be $state(). In fact, if you make it such you will brick the page
    let pageAlive = true;
    $effect(() => {
        if (oldFacility !== facility) {
            oldFacility = facility;

            const facility_id = facility.id;
            const vendor_id = vendor.id;
            if (browser) {
                tick().then(() => {
                    if (!pageAlive) return;
                    replaceState("/facility/"+facility_id+"/vendor_contract/"+vendor_id, {});
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
    showLocationDropdown={true} 
    allLocations={data.all_locations} 
    thisLocationName={facility.name} 
    thisLocationId={facility.id}
    thisLocationActive={facility.active} />

<ExpandingInterior>
    <object
        data={`/facility/${facility.id}/vendor_contract/${vendor.id}/pdf`}
        type="application/pdf"
        class="big"
        title="Vendor Contract"
    >
        <p>
            This browser can't display PDFs.
            <a href={`/facility/${facility.id}/vendor_contract/${vendor.id}/pdf`}>
                Download the contract
            </a>.
        </p>
    </object>
    <text-entry>
        <a href={"/facility/"+facility.id}>
            <button>
                Back to Facility
            </button>
        </a>
    </text-entry>
</ExpandingInterior>

<Footer withSpacer={false} />

<style>
    text-entry {
        display: flex;
        text-decoration: none;

        color: var(--accent5);
        font-size: var(--font-size3);

        justify-content: center;
        align-items: center;

        margin: 8px;
        /* margin-top: 20%; */
        /* margin-bottom: 20%; */
        gap: 50px;

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
        cursor: pointer;
    }

    button:hover {
        background-color: var(--accent4);
        color: var(--accent1);
    }


    a {
        text-decoration: none;
    }
    
    .big {
        width: 100%;
        height: auto;
        z-index: 1;

        flex: 1 1 auto;
        min-height: 0;
        display: flex;
    }
</style>