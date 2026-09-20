<svelte:options runes={true} />
<script lang="ts">
    import DarkListScreen from '$lib/components/DarkListScreen.svelte';

    
    let {
        form
    } = $props();

</script>

<DarkListScreen
    title={"Welcome to VAMA"}
    subtitles={[

    ]}
    list_entries={[
        { title: "Username", href: "/" },
        { title: "Password", href: "/" },
        { title: "Remember this Machine", href: "/" },
    ]}
/>

<style>

</style>
