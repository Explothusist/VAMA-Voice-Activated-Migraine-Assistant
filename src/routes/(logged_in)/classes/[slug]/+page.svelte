<svelte:options runes={true} />
<script lang="ts">
    import DarkListScreen from '$lib/components/DarkListScreen.svelte';
    
    let {
        data
    } = $props();

</script>

<DarkListScreen
    title={"Class: "+data.class_data.name}
    subtitles={[
        { entry: data.class_data.teacher_name, size: 2, href: "" },
        { entry: data.class_data.teacher_email, size: 1, href: "" },
    ]}
    list_entries={[
        { title: "Read Menu", href: "" },
        { title: "Email Teacher", href: "" },
        { title: "List Assignments", href: "" },
        { title: "View Assignment", href: "" },
        { title: "Return to Main", href: "/" },
        { title: "Help", href: "" },
    ]}
/>

<style>

</style>
