<svelte:options runes={true} />
<script lang="ts">
    import DarkListScreen from '$lib/components/DarkListScreen.svelte';
    import { onMount } from 'svelte';
    
    let {
        data
    } = $props();

    onMount(() => {
        if (data.help) {

        }
    });

</script>

<DarkListScreen
    title={"Welcome to VAMA"}
    subtitles={[

    ]}
    list_entries={[
        { title: "Username", href: "/" },
        { title: "Password", href: "/" },
        { title: "Remember this Machine", href: "/" },
        { title: "Help", href: "/login?help=1" },
    ]}
/>

<style>

</style>
