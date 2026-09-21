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
    title={"Welcome, Logan"}
    subtitles={[

    ]}
    list_entries={[
        { title: "Read Menu", href: "/" },
        { title: "List Classes", href: "/classes/" },
        { title: "View Class", href: "/classes/1/" },
        { title: "List Assignments", href: "/assignments/" },
        { title: "View Assignment", href: "/assignments/1/" },
        { title: "Settings", href: "/settings/" },
        { title: "Help", href: "/main?help=1" },
        { title: "Logout", href: "/login/" },
    ]}
/>

<style>

</style>
