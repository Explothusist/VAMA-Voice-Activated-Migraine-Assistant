<svelte:options runes={true} />
<script lang="ts">
    import DarkListScreen from '$lib/components/DarkListScreen.svelte';
    import { toReadableFullDateString, type SubtitleSizedEntry } from '$lib/utils.js';
    import { listenForIdentifiers, textToSpeech } from '$lib/voice_utils.js';
    import { onMount } from 'svelte';
    
    let {
        data
    } = $props();

    let assignments_parsed: SubtitleSizedEntry[] = $derived(data.all_assignments.map((a) => { return { entry: a.name+" (Due "+toReadableFullDateString(a.due_date)+")", size: 2, href: "/assignments/"+a.id+"/" }; }));


    onMount(() => {
        if (data.help) {
            textToSpeech(
                "Say Read Menu to repeat the contents of the menu. Say any of the options to navigate to the corresponding menu."
            );
        }else {
            textToSpeech(
                "Main Page. The Assignments are: "+assignments_parsed.map((a) => a.entry).join(", ")+" The options are: Read Menu, List Classes, View Classes, List Assignments, View Assignment, Settings, Help, Logout."
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
            ...assignments_parsed.map((a) => { return { identifier: a.entry, href: a.href }; }),
        ]);
    });

</script>

<DarkListScreen
    title={"Assignment List"}
    subtitles={assignments_parsed}
    list_entries={[
        { title: "Read Menu", href: "/assignments/" },
        { title: "View Assignment", href: "/assignments/" },
        { title: "Return to Main", href: "/" },
        { title: "Help", href: "/assignments?help=1" },
    ]}
/>

<style>

</style>
