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
                "Assignment List. The Assignments are: "+data.all_assignments.map((a) => a.name).join(", ")+". The options are: Read Menu, View Assignment, Return to Main, Help."
            );
        }
        listenForIdentifiers([
            { identifier: "Read Menu", href: "/assignments/" },
            { identifier: "View Assignment", href: "/assignments/0/" },
            { identifier: "Return to Main", href: "/" },
            { identifier: "Help", href: "/assignments?help=1" },
            ...data.all_assignments.map((a) => { return { identifier: a.name, href: "/assignments/"+a.id+"/" }; }),
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
