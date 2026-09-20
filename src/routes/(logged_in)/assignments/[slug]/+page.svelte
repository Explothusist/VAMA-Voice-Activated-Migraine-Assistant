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
        { entry: "AP Comp Sci A", size: 2, href: "" },
        { entry: "Mrs. Bryan", size: 1, href: "" },
        { entry: "kbryan@fakeschools.org", size: 1, href: "" },
        { entry: "Due: Oct 13, 2028", size: 2, href: "" },
        { entry: "Priority: High", size: 2, href: "" },
    ]}
    list_entries={[
        { title: "Read Menu", href: "" },
        { title: "Email Teacher", href: "" },
        { title: "Print", href: "" },
        { title: "Scan and Upload", href: "" },
        { title: "Return to Main", href: "/" },
        { title: "Help", href: "" },
    ]}
/>

<style>

</style>
