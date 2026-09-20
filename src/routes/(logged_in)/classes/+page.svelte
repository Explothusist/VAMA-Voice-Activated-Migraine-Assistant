<svelte:options runes={true} />
<script lang="ts">
    import DarkListScreen from '$lib/components/DarkListScreen.svelte';

    
    let {
        form
    } = $props();

</script>

<DarkListScreen
    title={"Class List"}
    subtitles={[
        { entry: "AP Comp Sci A", size: 2 },
        { entry: "AP Comp Sci B", size: 2 },
        { entry: "BQ Dpnq Tdj C", size: 2 },
        { entry: "CR Eqor Uek D", size: 2 },
    ]}
    list_entries={[
        { title: "Read Menu", href: "" },
        { title: "View Class", href: "/classes/1/" },
        { title: "Return to Main", href: "/main/" },
        { title: "Help", href: "" },
    ]}
/>

<style>

</style>
