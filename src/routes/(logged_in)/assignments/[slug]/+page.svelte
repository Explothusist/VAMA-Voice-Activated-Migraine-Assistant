<svelte:options runes={true} />
<script lang="ts">
    import DarkListScreen from '$lib/components/DarkListScreen.svelte';

    
    let {
        form
    } = $props();

</script>

<DarkListScreen
    title={"Assignment: Excessive Expostulation"}
    subtitles={[
        { entry: "AP Comp Sci A", size: 2 },
        { entry: "Mrs. Bryan", size: 1 },
        { entry: "kbryan@fakeschools.org", size: 1 },
        { entry: "", size: 2 },
        { entry: "Due: Oct 13, 2028", size: 2 },
        { entry: "Priority: High", size: 2 },
    ]}
    list_entries={[
        { title: "Read Menu", href: "" },
        { title: "Email Teacher", href: "" },
        { title: "Print", href: "" },
        { title: "Scan and Upload", href: "" },
        { title: "Return to Main", href: "/main/" },
        { title: "Help", href: "" },
    ]}
/>

<style>

</style>
