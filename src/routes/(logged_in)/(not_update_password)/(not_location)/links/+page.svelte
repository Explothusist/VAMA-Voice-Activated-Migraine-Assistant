<svelte:options runes={true} />
<script lang="ts">
    import ListPage from "$lib/components/ListPage.svelte";
    import Topbar from "$lib/components/Topbar.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import type { ListPageEntry } from "$lib/util.js";
    import type { JSONLink } from "$lib/db_utils.js";

    let { form, data } = $props();

    const links: JSONLink[] = [
        { name: "Adobe", link: "https://adminconsole.adobe.com/" },
        { name: "1Password", link: "https://1password.com/" },
        { name: "SpamTitan", link: "https://cloudj-ui.spamtitan.com/auth/sign-in" },
        { name: "Unify", link: "https://unifi.ui.com/" },
        { name: "Prey", link: "https://panel.preyproject.com/session/new" },
        { name: "Sophos", link: "https://central.sophos.com" },
        { name: "UKG", link: "https://welcome-us.ukg.net/u/login?state=hqFo2SB4RUpmdzg1RTNhajhwU0lZUG5wWjNucWctU18tSVZDWqFur3VuaXZlcnNhbC1sb2dpbqN0aWTZIGctWjgzRUhqb3NpUXdGcjFrMVI1dlVBSWZiYXF1bUxYo2NpZNkkZmU4YjU0NTAtZTZmNi00MjNlLTllMjUtZWM5MmYzMWI4NjRipW9yZ2lktG9yZ19td01NS29peExMUG5NNHBvp29yZ25hbWXZMmxhc2FsbGVfbWFuYWdlbWVudF9sbGNfZGJhX2xhc2FsbGVfY29ycmVjdGlvbnNfcHJk" },
        { name: "Stormwinds", link: "https://stormwindstudios.com/" },
        { name: "Monday", link: "https://lasallemgmt.monday.com/auth/login_monday/email_password" },
        { name: "Connectwise", link: "https://home.connectwise.com/" },
        { name: "On-Call", link: "http://asterisk.w3it.us:8088/" },
    ];

    const link_entries: ListPageEntry[] = links.map((a) => { return {
        self: a, original_id: 0, // original_id to be set by ListPage
        columns: [
            { isLinked: true, link: a.link, value: a.name }
        ],
        website_href: a.link
    }});
    
</script>

<Topbar user={data.user} profile_picture={data.profile_picture} isLoggedIn={true} isAdmin={data.user.privileges === "Admin"} name={data.user.name.length > 0 ? data.user.name : data.user.username} />

<ExpandingInterior>
    <ListPage 
        title={"Links"} 
        columns={["Link"]}
        entries={link_entries} 
        isAdmin={data.user.privileges === "Admin"}
        hasEdit={false} 
        hasNew={false}
        hasWebsites={true}
        columnsCollapseMobile={[false, true, false, false]}
        columnsCollapseMobilePortrait={[false, true, true, true]}
    />
</ExpandingInterior>

<Footer />

<style>

</style>