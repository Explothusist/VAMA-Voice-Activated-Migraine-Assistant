<svelte:options runes={true} />
<script lang="ts">
    import DarkListScreen from '$lib/components/DarkListScreen.svelte';
    import { toReadableFullDateString, type SubtitleSizedEntry } from '$lib/utils.js';
    
    let {
        data
    } = $props();

    let assignments_parsed: SubtitleSizedEntry[] = $derived(data.all_assignments.map((a) => { return { entry: a.name+" (Due "+toReadableFullDateString(a.due_date)+")", size: 2, href: "/assignments/"+a.id+"/" }; }));

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
