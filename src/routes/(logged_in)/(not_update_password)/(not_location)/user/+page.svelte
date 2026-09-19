<svelte:options runes={true} />
<script lang="ts">
    import { browser } from "$app/environment";
    import { getRemoveProfilePictureEntries_Account, getUploadProfilePictureEntries_Account, kColorModeColors, kColorModeModes, kColorModes } from "$lib/account_utils.js";
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import ModalPopup from "$lib/components/ModalPopup.svelte";
    import TableBox from "$lib/components/TableBox.svelte";
    import Topbar from "$lib/components/Topbar.svelte";
    import type { TableBoxEntry } from "$lib/util.js";

    let { data, form } = $props();

    let profile_picture = $derived(form?.profile_picture ? form.profile_picture : data.profile_picture);
    
    let changePasswordPopup: (ModalPopup | undefined) = $state();
    function changePasswordClickRaise() {
        if (!changePasswordPopup) return;
        changePasswordPopup.raisePopup();
    };
    let changePasswordEntries = $derived([
        { type: "hidden_txt", name: "username", value: data.user.username },
        { type: "hidden_txt", name: "log_name", value: data.user.name.length > 0 ? data.user.name : data.user.username },
        { type: "password", name: "password", title: "Old Password: ", placeholder: "Password", value: "", min_length: 1, max_length: 100, hasNoReqValidation: true },
        { type: "password", name: "new_pass", title: "New Password: ", placeholder: "Password", min_length: 1, max_length: 100, isPatterned: true, pattern: data.password_regex},
    ]);
    
    let changeColorsPopup: (ModalPopup | undefined) = $state();
    function changeColorsClickRaise() {
        if (!changeColorsPopup) return;
        changeColorsPopup.raisePopup();
    };
    let changeColorsEntries = $derived([
        { type: "hidden_txt", name: "log_name", value: data.user.name.length > 0 ? data.user.name : data.user.username },
        // { type: "dropdown_txt", name: "colormode", title: "Color Mode: ", options: [{ title: "Monochrome", value: "Monochrome" }, { title: "Monochrome Dark", value: "Monochrome Dark" }, { title: "Standard", value: "Standard" }, { title: "Standard Dark", value: "Standard Dark" }] , value: data.user.colormode },
        // { type: "dropdown_txt", name: "colormode", title: "Color Mode: ", options: kColorModes.map((a) => { return { title: a, value: a }; }) , value: data.user.colormode },
        { type: "dropdown_txt", name: "colormodecolor", title: "Primary Color: ", options: kColorModeColors.map((a) => { return { title: a, value: a }; }) , value: data.user.colormode.split(" ")[0] },
        { type: "dropdown_txt", name: "colormodemode", title: "Mode: ", options: kColorModeModes.map((a) => { return { title: a, value: a }; }) , value: data.user.colormode.split(" ")[1] },
    ]);

    let user_profile_entries: TableBoxEntry[] = $derived([
        { columns: [{ isLinked: false, link: "", value: "Name:" }, { isLinked: false, link: "", value: data.user.name }] },
        { columns: [{ isLinked: false, link: "", value: "Username:" }, { isLinked: false, link: "", value: data.user.username }] },
        { columns: [{ isLinked: false, link: "", value: "Password:" }, { isLinked: true, link: changePasswordClickRaise, linkIsIcon: true, linkIsOnClick: true, iconHoverText: "Change Password", iconType: "key", value: "" }] },
        { columns: [{ isLinked: false, link: "", value: "Title:" }, { isLinked: false, link: "", value: data.user.title }] },
        { columns: [{ isLinked: false, link: "", value: "Location:" }, { isLinked: false, link: "", value: data.user.location }] },
        { columns: [{ isLinked: false, link: "", value: "Privileges:" }, { isLinked: false, link: "", value: data.user.privileges }] },
        { columns: [{ isLinked: false, link: "", value: "Colors:" }, { isLinked: true, link: changeColorsClickRaise, linkIsIcon: true, linkIsOnClick: true, iconHoverText: "Change Colors", iconType: "color", value: data.user.colormode }] }
    ]);
    
    let addProfilePicturePopup: (ModalPopup | undefined) = $state();
    function addProfilePictureClickRaise() {
        if (!addProfilePicturePopup) return;
        addProfilePicturePopup.raisePopup();
    };
    let addProfilePictureEntries = $derived(getUploadProfilePictureEntries_Account(data.user, profile_picture.exists));

    let removeProfilePicturePopup: (ModalPopup | undefined) = $state();
    function removeProfilePictureClickRaise() {
        if (!removeProfilePicturePopup) return;
        removeProfilePicturePopup.raisePopup();
    };
    let removeProfilePictureEntries = $derived(getRemoveProfilePictureEntries_Account(data.user));


    $effect(() => {
        if (browser && form?.message) {
            alert(form?.message);
        }
    });
</script>

<Topbar user={data.user} profile_picture={data.profile_picture} isLoggedIn={true} isAdmin={data.user.privileges === "Admin"} name={data.user.name.length > 0 ? data.user.name : data.user.username} />

<ExpandingInterior>
    <logo-cont>
        {#if profile_picture.exists}
            <img alt={data.user.name} src={"/uploads/profile_pictures/user_"+data.user.id+".png?v="+profile_picture.last_modified} height=70px width=auto />
            <button type="button" onclick={addProfilePictureClickRaise}>Replace Profile Picture</button>
            <button type="button" onclick={removeProfilePictureClickRaise}>Remove Profile Picture</button>
        {:else}
            <button type="button" onclick={addProfilePictureClickRaise}>Upload Profile Picture</button>
        {/if}
    </logo-cont>
    <block-cont>
        <TableBox 
            title="User Profile"
            entries={user_profile_entries}
            hasIcons={true}
        />
    </block-cont>
</ExpandingInterior>

<Footer />

<ModalPopup
    title="Upload New Profile Picture"
    action="addProfilePicture"
    entries={addProfilePictureEntries}
    useFormEnhance={true}
    bind:this={addProfilePicturePopup}
    formWithFiles={true}
/>

<ModalPopup
    title="Remove Profile Picture"
    action="removeProfilePicture"
    entries={removeProfilePictureEntries}
    useFormEnhance={true}
    bind:this={removeProfilePicturePopup}
    formWithFiles={true}
/>

<ModalPopup
    title="Change Password"
    action="changePassword"
    entries={changePasswordEntries}
    useFormEnhance={true}
    bind:this={changePasswordPopup}
/>

<ModalPopup
    title="Change Colors"
    action="changeColors"
    entries={changeColorsEntries}
    usesEditHighlighting={true}
    bind:this={changeColorsPopup}
/>

<style>

    logo-cont {
        display: flex;
        margin: 0px;
        margin-left: 3%;
        margin-top: 20px;

        gap: 20px;
        align-items: center;
    }

    block-cont {
        margin: 3%;
        width: 94%;
        margin-top: 20px;
    }

    button {
        background-color: var(--accent5);
        color: var(--accent1);
        padding: 6px;
        width: 220px;
        /* border-radius: 15px; */
        font-size: var(--font-size3);
        height: 40px;
        cursor: pointer;
    }

</style>