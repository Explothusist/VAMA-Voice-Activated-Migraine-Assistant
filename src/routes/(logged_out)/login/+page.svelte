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
        { title: "Username", href: "/main/" },
        { title: "Password", href: "/main/" },
        { title: "Remeber this Machine", href: "/main/" },
    ]}
/>

<style>

</style>
