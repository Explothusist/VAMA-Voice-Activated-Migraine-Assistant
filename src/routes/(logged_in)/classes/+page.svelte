<svelte:options runes={true} />
<script lang="ts">
    import DarkListScreen from '$lib/components/DarkListScreen.svelte';
    import type { SubtitleSizedEntry } from '$lib/utils.js';
    import { listenForIdentifiers, textToSpeech } from '$lib/voice_utils.js';
    import { onMount } from 'svelte';
    
    let {
        data
    } = $props();

    let classes_parsed: SubtitleSizedEntry[] = $derived(data.all_classes.map((a) => { return { entry: a.name, size: 2, href: "/classes/"+a.id+"/" }; }));

    onMount(() => {
        if (data.help) {
            textToSpeech(
                "Say Read Menu to repeat the contents of the menu. Say any of the options to navigate to the corresponding menu."
            );
        }else {
            textToSpeech(
                "Class List. The Classes are: "+classes_parsed.map((a) => a.entry).join(", ")+". The options are: Read Menu, View Classes, Return to Main, Help."
            );
        }
        listenForIdentifiers([
            { identifier: "Read Menu", href: "/classes/" },
            { identifier: "View Class", href: "/classes/1/" },
            { identifier: "Return to Main", href: "/" },
            { identifier: "Help", href: "/classes?help=1" },
            ...classes_parsed.map((a) => { return { identifier: a.entry, href: a.href }; }),
        ]);
    });

</script>

<DarkListScreen
    title={"Class List"}
    subtitles={classes_parsed}
    list_entries={[
        { title: "Read Menu", href: "/classes/" },
        { title: "View Class", href: "/classes/1/" },
        { title: "Return to Main", href: "/" },
        { title: "Help", href: "/classes?help=1" },
    ]}
/>

<style>

</style>
