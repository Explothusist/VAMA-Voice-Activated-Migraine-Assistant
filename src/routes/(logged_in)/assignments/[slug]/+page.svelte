<svelte:options runes={true} />
<script lang="ts">
    import { goto } from '$app/navigation';
    import DarkListScreen from '$lib/components/DarkListScreen.svelte';
    import { toReadableFullDateString } from '$lib/utils.js';
    import { listenForIdentifiers, textToSpeech } from '$lib/voice_utils.js';
    import { onMount } from 'svelte';

    let {
        data
    } = $props();

    onMount(() => {
        if (data.email) {
            goto("mailto:"+data.class_data.teacher_email);
        }else if (data.print) {

        }else if (data.scan) {

        }else if (data.help) {
            textToSpeech(
                "Say Read Menu to repeat the contents of the menu. Say any of the options to navigate to the corresponding menu."
            );
        }else {
            textToSpeech(
                "Assignment "+data.assignment_data.name+". The Assignment is for the class "+data.class_data.name+". The teacher is "+data.class_data.teacher_name+". The assignment is due "+toReadableFullDateString(data.assignment_data.due_date)+". The priority is "+data.assignment_data.priority+". The teacher has provided the following notes: "+data.assignment_data.notes+". The options are: Read Menu, Email Teacher, Print, Scan and Upload, Return to Main, Help."
            );
        }
        listenForIdentifiers([
            { identifier: "Read Menu", href: "/assignments/"+data.assignment_data.id+"/" },
            { identifier: "Email Teacher", href: "/assignments/"+data.assignment_data.id+"?email=1" },
            { identifier: "Print", href: "/assignments/"+data.assignment_data.id+"?print=1" },
            { identifier: "Scan and Upload", href: "/assignments/"+data.assignment_data.id+"?scan=1" },
            { identifier: "Return to Main", href: "/" },
            { identifier: "Help", href: "/assignments/"+data.assignment_data.id+"?help=1" },
        ]);
    });

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
        { title: "Email Teacher", href: "/assignments/"+data.assignment_data.id+"?email=1" },
        { title: "Print", href: "/assignments/"+data.assignment_data.id+"?print=1" },
        { title: "Scan and Upload", href: "/assignments/"+data.assignment_data.id+"?scan=1" },
        { title: "Return to Main", href: "/" },
        { title: "Help", href: "/assignments/"+data.assignment_data.id+"?help=1" },
    ]}
/>

<style>

</style>
