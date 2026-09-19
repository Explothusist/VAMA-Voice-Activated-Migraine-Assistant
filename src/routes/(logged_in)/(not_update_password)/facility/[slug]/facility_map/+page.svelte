<svelte:options runes={true} />
<script lang="ts">
    import type { LatLngExpression } from 'leaflet';
    import LeafletFacilityMap from '$lib/components/LeafletFacilityMap.svelte';
    import Footer from '$lib/components/Footer.svelte';
    import { browser } from '$app/environment';
    import { replaceState } from '$app/navigation';
    import { onDestroy, tick } from 'svelte';
    import ExpandingInterior from '$lib/components/ExpandingInterior.svelte';
    import Topbar from '$lib/components/Topbar.svelte';
    import { getAdjustLayerOrderEntries_FacilityMap, getRemoveLayerEntries_FacilityMap, getUploadLayerEntries_FacilityMap, type ExistingLayerImage } from '$lib/facility_map_utils.js';
    import ModalPopup from '$lib/components/ModalPopup.svelte';
    import type { JSONFacility } from '$lib/db_utils.js';

    let {
        data,
        form
    } = $props();

    let facility = $derived(form?.facility ? form.facility : data.facility);
    let existing_images: ExistingLayerImage[] = $derived(form?.existing_images ? form.existing_images : data.existing_images);
    let oldFacility: (JSONFacility | null) = null; // No, this should not be $state(). In fact, if you make it such you will brick the page

    const initialView: LatLngExpression = [0, 0];

    
    let addLayerPopup: (ModalPopup | undefined) = $state();
    function addLayerClickRaise() {
        if (!addLayerPopup) return;
        addLayerPopup.raisePopup();
    };
    let addLayerEntries = $derived(getUploadLayerEntries_FacilityMap(facility.id, existing_images));

    
    let removeLayerPopup: (ModalPopup | undefined) = $state();
    function removeLayerClickRaise() {
        if (!removeLayerPopup) return;
        removeLayerPopup.raisePopup();
    };
    let removeLayerEntries = $derived(getRemoveLayerEntries_FacilityMap(facility.id, existing_images));

    
    let adjustLayerOrderPopup: (ModalPopup | undefined) = $state();
    function adjustLayerOrderClickRaise() {
        if (!adjustLayerOrderPopup) return;
        adjustLayerOrderPopup.raisePopup();
    };
    let adjustLayerOrderEntries = $derived(getAdjustLayerOrderEntries_FacilityMap(facility, existing_images));


    let pageAlive = true;
    $effect(() => {
        if (oldFacility !== facility) {
            oldFacility = facility;

            const facility_id = facility.id;
            if (browser) {
                tick().then(() => {
                    if (!pageAlive) return;
                    replaceState("/facility/"+facility_id+"/facility_map", {});
                });
            }
        }
    });
    onDestroy(() => {
        pageAlive = false;
    });
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
    showLocationDropdown={true} 
    allLocations={data.all_locations} 
    thisLocationName={facility.name} 
    thisLocationId={facility.id}
    thisLocationActive={facility.active} />

<ExpandingInterior>
    <LeafletFacilityMap facility_id={facility.id} view={initialView} zoom={12} existing_images={existing_images} />
    <text-entry>
        <a href={"/facility/"+facility.id}>
            <button>
                Back to Facility
            </button>
        </a>
        {#if data.user.privileges === "Admin" && facility.active}
            <button onclick={addLayerClickRaise}>
                Upload Layer
            </button>
            {#if existing_images.some((a) => a.exists)}
                <button onclick={removeLayerClickRaise}>
                    Remove Layer
                </button>
                <button onclick={adjustLayerOrderClickRaise}>
                    Adjust Layer Order
                </button>
            {/if}
        {/if}
    </text-entry>
</ExpandingInterior>

<Footer withSpacer={false} />

<ModalPopup
    title="Upload New Layer"
    action="addLayer"
    entries={addLayerEntries}
    useFormEnhance={true}
    bind:this={addLayerPopup}
    formWithFiles={true}
/>
<ModalPopup
    title="Remove Layer"
    action="removeLayer"
    entries={removeLayerEntries}
    useFormEnhance={true}
    bind:this={removeLayerPopup}
    formWithFiles={true}
/>
<ModalPopup
    title="Adjust Layer Order"
    action="adjustLayerOrder"
    entries={adjustLayerOrderEntries}
    useFormEnhance={true}
    bind:this={adjustLayerOrderPopup}
    formWithFiles={true}
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
</style>