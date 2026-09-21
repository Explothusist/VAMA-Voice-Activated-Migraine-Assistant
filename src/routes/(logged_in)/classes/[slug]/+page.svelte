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
        { title: "Read Menu", href: "/classes/"+data.class_data.id+"/" },
        { title: "Email Teacher", href: "/classes/"+data.class_data.id+"?email=1" },
        { title: "List Assignments", href: "/assignments?filter_class="+data.class_data.id },
        { title: "View Assignment", href: "/assignments?filter_class="+data.class_data.id },
        { title: "Return to Main", href: "/" },
        { title: "Help", href: "/classes/"+data.class_data.id+"?help=1" },
    ]}
/>

<style>

</style>
