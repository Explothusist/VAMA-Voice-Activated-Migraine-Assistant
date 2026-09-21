<svelte:options runes={true} />
<script lang="ts">
    import DarkListScreen from '$lib/components/DarkListScreen.svelte';
    import { listenForIdentifiers, textToSpeech } from '$lib/voice_utils.js';
    import { onMount } from 'svelte';
    
    let {
        data
    } = $props();

    onMount(() => {
        if (data.help) {
            textToSpeech(
                "Say Read Menu to repeat the contents of the menu. Say any of the options to navigate to the corresponding menu."
            );
        }else {
            textToSpeech(
                "Main Page. The options are: Read Menu, List Classes, View Classes, List Assignments, View Assignment, Settings, Help, Logout."
            );
        }
        listenForIdentifiers([
            { identifier: "Read Menu", href: "/" },
            { identifier: "List Classes", href: "/classes/" },
            { identifier: "View Class", href: "/classes/1/" },
            { identifier: "List Assignments", href: "/assignments/" },
            { identifier: "View Assignment", href: "/assignments/1/" },
            { identifier: "Settings", href: "/settings/" },
            { identifier: "Help", href: "/main?help=1" },
            { identifier: "Logout", href: "/login/" },
        ]);
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
