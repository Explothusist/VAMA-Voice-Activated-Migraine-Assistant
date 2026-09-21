<svelte:options runes={true} />
<script lang="ts">
    import { goto } from '$app/navigation';
    import DarkListScreen from '$lib/components/DarkListScreen.svelte';
    import { listenForIdentifiers, textToSpeech } from '$lib/voice_utils.js';
    import { onMount } from 'svelte';
    
    let {
        data
    } = $props();

    onMount(() => {
        if (data.email) {
            goto("mailto:"+data.class_data.teacher_email);
        }else if (data.help) {
            textToSpeech(
                "Say Read Menu to repeat the contents of the menu. Say any of the options to navigate to the corresponding menu."
            );
        }else {
            textToSpeech(
                "Class "+data.class_data.name+". The teacher is "+data.class_data.teacher_name+", whose email is "+data.class_data.teacher_email+". The options are: Read Menu, Email Teacher, List Assignments, View Assignment, Return to Main, Help."
            );
        }
        listenForIdentifiers([
            { identifier: "Read Menu", href: "/classes/"+data.class_data.id+"/" },
            { identifier: "Email Teacher", href: "/classes/"+data.class_data.id+"?email=1" },
            { identifier: "List Assignments", href: "/assignments?filter_class="+data.class_data.id },
            { identifier: "View Assignment", href: "/assignments?filter_class="+data.class_data.id },
            { identifier: "Return to Main", href: "/" },
            { identifier: "Help", href: "/classes/"+data.class_data.id+"?help=1" },
        ]);
    });

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
