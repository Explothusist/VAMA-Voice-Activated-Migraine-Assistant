<svelte:options runes={true} />
<script lang="ts">
    import DarkListScreen from '$lib/components/DarkListScreen.svelte';
    import type { SubtitleSizedEntry } from '$lib/utils.js';
    
    let {
        data
    } = $props();

    let classes_parsed: SubtitleSizedEntry[] = $derived(data.all_classes.map((a) => { return { entry: a.name, size: 2, href: "/classes/"+a.id+"/" }; }));

</script>

<DarkListScreen
    title={"Class List"}
    subtitles={classes_parsed}
    list_entries={[
        { title: "Read Menu", href: "" },
        { title: "View Class", href: "/classes/1/" },
        { title: "Return to Main", href: "/" },
        { title: "Help", href: "" },
    ]}
/>

<style>

</style>
