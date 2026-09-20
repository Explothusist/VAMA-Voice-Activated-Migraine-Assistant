<svelte:options runes={true} />
<script lang="ts">
    import DarkListScreen from '$lib/components/DarkListScreen.svelte';

    
    let {
        form
    } = $props();

</script>

<DarkListScreen
    title={"Assignments List"}
    subtitles={[
        { entry: "Excessive Expostulation", size: 2 },
        { entry: "Incentive Exposition", size: 2 },
        { entry: "Expensive Exfoliation", size: 2 },
        { entry: "Intensive Explanation", size: 2 },
    ]}
    list_entries={[
        { title: "Read Menu", href: "" },
        { title: "View Assignment", href: "/assignments/1/" },
        { title: "Return to Main", href: "/main/" },
        { title: "Help", href: "" },
    ]}
/>

<style>

</style>
