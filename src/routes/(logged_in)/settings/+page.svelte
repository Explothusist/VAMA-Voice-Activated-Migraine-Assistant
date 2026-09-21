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
                "Settings Page. The options are: Read Menu, Text Brightness, Help, Return to Main."
            );
        }
        listenForIdentifiers([
            { identifier: "Read Menu", href: "/settings/" },
            { identifier: "Text Brightness", href: "/settings?change_brightness=1" },
            { identifier: "Help", href: "/settings?help=1" },
            { identifier: "Return to Main", href: "/" },
        ]);
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
