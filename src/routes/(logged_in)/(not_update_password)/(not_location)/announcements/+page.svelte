<svelte:options runes={true} />
<script lang="ts">
    import ListPage from "$lib/components/ListPage.svelte";
    import ModalPopup from "$lib/components/ModalPopup.svelte";
    import Topbar from "$lib/components/Topbar.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import { browser } from "$app/environment";
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import { AnnouncementColumns, getDeleteAnnouncementEntries_Announcement, getEditAnnouncementEntries_Announcement, getEntriesFromData_Announcement, getNewAnnouncementEntries_Announcement, getViewAnnouncementEntries_Announcement } from "$lib/announcement_utils.js";
    import { kDefaultJSONAnnouncement, type JSONAnnouncement } from "$lib/db_utils.js";

    let { form, data } = $props();

    let announcement_data = $derived(form?.announcements ? form.announcements : data.announcements);
    let announcements = $derived(getEntriesFromData_Announcement(
        announcement_data.filter((a) => a.active),
        viewAnnouncementClickRaise)
    );


    let newAnnouncementPopup: (ModalPopup | undefined) = $state();
    function newAnnouncementClickRaise() {
        if (!newAnnouncementPopup) return;
        newAnnouncementPopup.raisePopup();
    };
    let newAnnouncementEntries = $derived(getNewAnnouncementEntries_Announcement());
    

    let editAnnouncementPopup: (ModalPopup | undefined) = $state();
    let editAnnouncementIndex = $state(0);
    function editAnnouncementClickRaise(id: number) {
        if (!editAnnouncementPopup) return;
        editAnnouncementIndex = id;
        editAnnouncementPopup.raisePopup();
    };
    let editSelectedEntry = $derived(editAnnouncementIndex < announcements.length ? (announcements[editAnnouncementIndex].self as JSONAnnouncement) : kDefaultJSONAnnouncement);
    let editAnnouncementEntries = $derived(getEditAnnouncementEntries_Announcement(editSelectedEntry));


    let deleteAnnouncementIndex = $state(0);
    let deleteAnnouncementPopup: (ModalPopup | undefined) = $state();
    function deleteAnnouncementClickRaise(id: number) {
        if (!deleteAnnouncementPopup) return;
        deleteAnnouncementIndex = id;
        deleteAnnouncementPopup.raisePopup();

    };
    let deleteSelectedEntry = $derived(deleteAnnouncementIndex < announcements.length ? (announcements[deleteAnnouncementIndex].self as JSONAnnouncement) : kDefaultJSONAnnouncement);
    let deleteAnnouncementEntries = $derived(getDeleteAnnouncementEntries_Announcement(deleteSelectedEntry));
    

    let viewAnnouncementIndex = $state(0);
    let viewAnnouncementPopup: (ModalPopup | undefined) = $state();
    function viewAnnouncementClickRaise(id: number) {
        if (!viewAnnouncementPopup) return;
        viewAnnouncementIndex = id;
        viewAnnouncementPopup.raisePopup();
    };
    let viewSelectedEntry = $derived(viewAnnouncementIndex < announcements.length ? (announcements[viewAnnouncementIndex].self as JSONAnnouncement) : kDefaultJSONAnnouncement);
    let viewAnnouncementEntries = $derived(getViewAnnouncementEntries_Announcement(viewSelectedEntry));

    $effect(() => {
        if (browser && form?.message) {
            alert(form?.message);
        }
    });
</script>

<Topbar user={data.user} profile_picture={data.profile_picture} isLoggedIn={true} isAdmin={data.user.privileges === "Admin"} name={data.user.name.length > 0 ? data.user.name : data.user.username} />

<ExpandingInterior>
    <ListPage
        title={"Announcements"}
        columns={AnnouncementColumns}
        entries={announcements}
        isAdmin={data.user.privileges === "Admin"}
        hasNew={true}
        hasEdit={true}
        onClickNew={newAnnouncementClickRaise}
        onClickEdit={editAnnouncementClickRaise}
        onClickDelete={deleteAnnouncementClickRaise}
        column_sorted_by={4}
        sort_reversed={true}
        columnsCollapseMobile={ [false, false, false, true, false, false] }
        columnsCollapseMobilePortrait={ [false, true, true, true, true, false] }
        initialSearch={data.initial_search}
    />
</ExpandingInterior>

<Footer />

<ModalPopup
    title="Add Announcement"
    action="newAnnouncement"
    entries={newAnnouncementEntries}
    useFormEnhance={true}
    bind:this={newAnnouncementPopup}
/>

<ModalPopup
    title="Edit Announcement"
    action="editAnnouncement"
    entries={editAnnouncementEntries}
    useFormEnhance={true}
    usesEditHighlighting={true}
    bind:this={editAnnouncementPopup}
/>

<ModalPopup
    title="Remove Announcement"
    action="deleteAnnouncement"
    entries={deleteAnnouncementEntries}
    useFormEnhance={true}
    bind:this={deleteAnnouncementPopup}
/>

<ModalPopup
    title="View Announcement"
    action=""
    entries={viewAnnouncementEntries}
    hasConfirm={false}
    useFormEnhance={true}
    bind:this={viewAnnouncementPopup}
/>

<style>
    
</style>
