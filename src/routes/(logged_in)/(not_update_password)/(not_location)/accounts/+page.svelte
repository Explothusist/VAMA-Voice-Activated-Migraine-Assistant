<svelte:options runes={true} />
<script lang="ts">
    import ListPage from "$lib/components/ListPage.svelte";
    import ModalPopup from "$lib/components/ModalPopup.svelte";
    import Topbar from "$lib/components/Topbar.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import { browser } from "$app/environment";
    import ExpandingInterior from "$lib/components/ExpandingInterior.svelte";
    import { AccountColumns, getChangePassAccountEntries_Account, getDeleteAccountEntries_Account, getEditAccountEntries_Account, getEntriesFromData_Account, getNewAccountEntries_Account, getUnlockAccountEntries_Account, getViewAccountEntries_Account, kDefaultExistingProfilePicture } from "$lib/account_utils.js";
    import { kDefaultJSONUser, type JSONUser } from "$lib/db_utils.js";
    
    let { form, data } = $props();

    let account_data = $derived(form?.accounts ? form.accounts : data.accounts);
    let profile_picture_data = $derived(form?.profile_pictures ? form.profile_pictures : data.profile_pictures);
    let accounts = $derived(getEntriesFromData_Account(account_data, profile_picture_data, viewAccountClickRaise));
    let existing_usernames = $derived(account_data.map((a) => a.username));


    let newAccountPopup: (ModalPopup | undefined) = $state();
    function newAccountClickRaise() {
        if (!newAccountPopup) return;
        newAccountPopup.raisePopup();
    };
    let newAccountEntries = $derived(getNewAccountEntries_Account(existing_usernames));
    

    let editAccountPopup: (ModalPopup | undefined) = $state();
    let editAccountIndex = $state(0);
    function editAccountClickRaise(id: number) {
        if (!editAccountPopup) return;
        editAccountIndex = id;
        editAccountPopup.raisePopup();
    };
    let editSelectedAccount = $derived(editAccountIndex < accounts.length ? (accounts[editAccountIndex].self as JSONUser) : kDefaultJSONUser);
    let editAccountEntries = $derived(getEditAccountEntries_Account(editSelectedAccount, existing_usernames));
    

    let unlockAccountPopup: (ModalPopup | undefined) = $state();
    let unlockAccountIndex = $state(0);
    function unlockAccountClickRaise(id: number) {
        if (!unlockAccountPopup) return;
        unlockAccountIndex = id;
        unlockAccountPopup.raisePopup();
    };
    let unlockSelectedAccount = $derived(unlockAccountIndex < accounts.length ? (accounts[unlockAccountIndex].self as JSONUser) : kDefaultJSONUser);
    let unlockAccountEntries = $derived(getUnlockAccountEntries_Account(unlockSelectedAccount));
    

    let changePassAccountPopup: (ModalPopup | undefined) = $state();
    let changePassAccountIndex = $state(0);
    function changePassAccountClickRaise(id: number) {
        if (!changePassAccountPopup) return;
        changePassAccountIndex = id;
        changePassAccountPopup.raisePopup();
    };
    let changePassSelectedAccount = $derived(changePassAccountIndex < accounts.length ? (accounts[changePassAccountIndex].self as JSONUser) : kDefaultJSONUser);
    let changePassAccountEntries = $derived(getChangePassAccountEntries_Account(changePassSelectedAccount));
    

    let deleteAccountPopup: (ModalPopup | undefined) = $state();
    let deleteAccountIndex = $state(0);
    function deleteAccountClickRaise(id: number) {
        if (!deleteAccountPopup) return;
        deleteAccountIndex = id;
        deleteAccountPopup.raisePopup();
    };
    let deleteSelectedAccount = $derived(deleteAccountIndex < accounts.length ? (accounts[deleteAccountIndex].self as JSONUser) : kDefaultJSONUser);
    let deleteAccountEntries = $derived(getDeleteAccountEntries_Account(deleteSelectedAccount));
    

    let viewAccountPopup: (ModalPopup | undefined) = $state();
    let viewAccountIndex = $state(0);
    function viewAccountClickRaise(id: number) {
        if (!viewAccountPopup) return;
        viewAccountIndex = id;
        viewAccountPopup.raisePopup();
    };
    let viewSelectedAccount = $derived(viewAccountIndex < accounts.length ? (accounts[viewAccountIndex].self as JSONUser) : kDefaultJSONUser);
    let viewSelectedProfilePicture = $derived(viewAccountIndex < profile_picture_data.length ? (profile_picture_data[viewAccountIndex]) : kDefaultExistingProfilePicture);
    let viewAccountEntries = $derived(getViewAccountEntries_Account(viewSelectedAccount, viewSelectedProfilePicture));

    
    $effect(() => {
        if (browser && form?.message) {
            alert(form?.message);
        }
    });
</script>

<Topbar user={data.user} profile_picture={data.profile_picture} isLoggedIn={true} isAdmin={data.user.privileges === "Admin"} name={data.user.name.length > 0 ? data.user.name : data.user.username} />

<ExpandingInterior>
    <ListPage 
        title="Accounts" 
        columns={AccountColumns} 
        entries={accounts} 
        isAdmin={data.user.privileges === "Admin"} 
        hasNew={true} 
        hasEdit={true} 
        hasUnlockPassword={true}
        onClickNew={newAccountClickRaise} 
        onClickEdit={editAccountClickRaise} 
        onClickDelete={deleteAccountClickRaise}
        onClickUnlock={unlockAccountClickRaise} 
        onClickPassword={changePassAccountClickRaise}
        columnsCollapseMobile={[false, false, true, false, false]}
        columnsCollapseMobilePortrait={[false, true, true, true, false]}
        initialSearch={data.initial_search}
        column_sorted_by={1}
    />
</ExpandingInterior>

<Footer />

<ModalPopup
    title="New Account"
    action="newAccount"
    entries={newAccountEntries}
    useFormEnhance={true}
    bind:this={newAccountPopup}
/>

<ModalPopup
    title="Edit Account"
    action="editAccount"
    entries={editAccountEntries}
    useFormEnhance={true}
    usesEditHighlighting={true}
    bind:this={editAccountPopup}
/>

<ModalPopup
    title="Unlock Account"
    action="unlockAccount"
    entries={unlockAccountEntries}
    useFormEnhance={true}
    bind:this={unlockAccountPopup}
/>

<ModalPopup
    title="Change Password"
    action="changePassAccount"
    entries={changePassAccountEntries}
    useFormEnhance={true}
    bind:this={changePassAccountPopup}
/>

<ModalPopup
    title="Delete Account"
    action="deleteAccount"
    entries={deleteAccountEntries}
    useFormEnhance={true}
    bind:this={deleteAccountPopup}
/>

<ModalPopup
    title="View Account"
    action="__N/A__"
    entries={viewAccountEntries}
    hasConfirm={false}
    bind:this={viewAccountPopup}
/>

<style>

</style>