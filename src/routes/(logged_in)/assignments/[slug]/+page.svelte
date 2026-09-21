<svelte:options runes={true} />
<script lang="ts">
    import DarkListScreen from '$lib/components/DarkListScreen.svelte';
    import { toReadableFullDateString } from '$lib/utils.js';

    let {
        data
    } = $props();

</script>

<DarkListScreen
    title={"Assignment: "+data.assignment_data.name}
    subtitles={[
        { entry: data.class_data.name, size: 2, href: "" },
        { entry: data.class_data.teacher_name, size: 1, href: "" },
        { entry: data.class_data.teacher_email, size: 1, href: "" },
        { entry: "Due: "+toReadableFullDateString(data.assignment_data.due_date), size: 2, href: "" },
        { entry: "Priority: "+data.assignment_data.priority, size: 2, href: "" },
        { entry: data.assignment_data.notes, size: 1, href: "" },
    ]}
    list_entries={[
        { title: "Read Menu", href: "/assignments/"+data.assignment_data.id+"/" },
        { title: "Email Teacher", href: "/classes/"+data.class_data.id+"?email=1" },
        { title: "Print", href: "/classes/"+data.class_data.id+"?print=1" },
        { title: "Scan and Upload", href: "/classes/"+data.class_data.id+"?scan=1" },
        { title: "Return to Main", href: "/" },
        { title: "Help", href: "/classes/"+data.class_data.id+"?help=1" },
    ]}
/>

<style>

</style>
