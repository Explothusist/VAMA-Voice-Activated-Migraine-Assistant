<svelte:options runes={true} />
<script lang="ts">
    import DarkListScreen from '$lib/components/DarkListScreen.svelte';

    
    let {
        form
    } = $props();

</script>

<DarkListScreen
    title={"Class: Comp Sci A"}
    subtitles={[
        { entry: "Mrs. Bryan", size: 2 },
        { entry: "kbryan@fakeschools.org", size: 1 },
    ]}
    list_entries={[
        { title: "Read Menu", href: "" },
        { title: "Email Teacher", href: "" },
        { title: "List Assignments", href: "" },
        { title: "View Assignment", href: "" },
        { title: "Return to Main", href: "/main/" },
        { title: "Help", href: "" },
    ]}
/>

<style>

</style>
