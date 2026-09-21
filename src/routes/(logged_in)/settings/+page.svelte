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
    title={"Settings"}
    subtitles={[

    ]}
    list_entries={[
        { title: "Read Menu", href: "/settings/" },
        { title: "Text Brightness", href: "/settings?change_brightness=1" },
        { title: "Help", href: "/settings?help=1" },
        { title: "Return to Main", href: "/" },
    ]}
/>

<style>

</style>
