<svelte:options runes={true} />
<script lang="ts">
    import DarkListScreen from '$lib/components/DarkListScreen.svelte';

    
    let {
        form
    } = $props();

</script>

<DarkListScreen
    title={"Settings"}
    subtitles={[

    ]}
    list_entries={[
        { title: "Read Menu", href: "" },
        { title: "Text Brightness", href: "" },
        { title: "Help", href: "" },
        { title: "Logout", href: "/login/" },
    ]}
/>

<style>

</style>
