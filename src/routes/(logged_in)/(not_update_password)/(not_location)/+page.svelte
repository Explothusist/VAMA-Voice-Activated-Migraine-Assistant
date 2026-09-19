<svelte:options runes={true} />
<script lang="ts">
    import type { LatLngExpression } from 'leaflet';
    import Footer from '$lib/components/Footer.svelte';
    import LeafletStatesMap from '$lib/components/LeafletStatesMap.svelte';
    import Topbar from '$lib/components/Topbar.svelte';
    import AnnouncementBar from '$lib/components/AnnouncementBar.svelte';
    import { toReadableDateString } from '$lib/util.js';
    import ExpandingInterior from '$lib/components/ExpandingInterior.svelte';

    let {
        data
    } = $props();

    const initialView: LatLngExpression = [32.5232, -92.6379];
    
    let announcements = $derived(data.announcements.filter((a) => a.isInDateRange));

    function isValidCoordinate(value: unknown): value is number {
        return typeof value === 'number' && Number.isFinite(value);
    }

    let markers = $derived(data.facilities
        .filter((a) => isValidCoordinate(a.latitude) && isValidCoordinate(a.longitude))
        .map((a) => {
            return { title: "<a style=\"text-decoration: none;\" href=\"\\facility\\"+a.id+"\">"+a.name+"</a>", latitude: a.latitude, longitude: a.longitude, link: "\\facility\\"+a.id };
        }));
</script>

{#each announcements as announce}
    {#if announce.displayed}
        <AnnouncementBar date={(toReadableDateString(announce.date))} text={announce.text} color={announce.color} />
    {/if}
{/each}

<Topbar user={data.user} profile_picture={data.profile_picture} isLoggedIn={true} isAdmin={data.user.privileges === "Admin"} name={data.user.name.length > 0 ? data.user.name : data.user.username} />

<ExpandingInterior>
    <LeafletStatesMap view={initialView} zoom={5} markers={markers} />
</ExpandingInterior>

<Footer withSpacer={false} />

<style>

</style>