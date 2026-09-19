<svelte:options runes={true} />
<script lang="ts">
    import Logo from "./Logo.svelte";
    import IconDown from "virtual:icons/mdi/menu-down-outline";
    import IconMenu from "virtual:icons/mdi/menu";
    import { clamp_string_to_length } from "$lib/util";
    import { onMount, getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import Breadcrumb from "./Breadcrumb.svelte";
    import { enhance } from "$app/forms";
    import { kDefaultJSONUser, kDefaultJSONVendor, type JSONUser, type JSONVendor } from "$lib/db_utils";
    import type { ExistingProfilePicture } from "$lib/account_utils";

    interface Props {
        isAdmin: boolean;
        isLoggedIn: boolean;
        showLocationDropdown?: boolean;
        allLocations?: { id: number, name: string }[];
        showVendorDropdown?: boolean;
        allVendors?: { id: number, name: string }[];
        thisLocationName?: string;
        thisLocationId?: number;
        thisLocationActive?: boolean;
        thisLocationIsVendor?: boolean;
        name?: string;
        profile_picture?: ExistingProfilePicture;
        user?: JSONUser;
        pageVendor?: JSONVendor;
    };
    let {
        isAdmin,
        isLoggedIn,
        showLocationDropdown = false,
        allLocations = [],
        showVendorDropdown = false,
        allVendors = [],
        thisLocationName = "",
        thisLocationId = -1,
        thisLocationIsVendor = false,
        thisLocationActive = false,
        name = "",
        profile_picture = { exists: false, src: "", last_modified: 0 },
        user = kDefaultJSONUser,
        pageVendor = kDefaultJSONVendor,
    }: Props = $props();

    let allLocationsSorted = $derived(allLocations.length > 0 ? allLocations.sort((a, b) => a.name.localeCompare(b.name)) : []);
    let allVendorsSorted = $derived(allVendors.length > 0 ? allVendors.sort((a, b) => a.name.localeCompare(b.name)) : []);

    let isMobile: Writable<boolean> = getContext("isMobile");
    let isMobilePortrait: Writable<boolean> = getContext("isMobilePortrait");
    let isLaptop: Writable<boolean> = getContext("isLaptop");

    let DropdownBoxTitle: HTMLElement | undefined = $state();
    let DropdownBox: HTMLElement | undefined = $state();
    let DropdownTitleWidth: string = $state("");
    let DropdownVisible: boolean = $state(false);

    let IconDropdownBoxTitle: HTMLElement | undefined = $state();
    let IconDropdown: HTMLElement | undefined = $state();
    let IconDropdownWidth: string = $state("");
    let IconDropdownVisible: boolean = $state(false);

    let ProfileDropdownBoxTitle: HTMLElement | undefined = $state();
    let ProfileDropdown: HTMLElement | undefined = $state();
    let ProfileDropdownWidth: string = $state("");
    let ProfileDropdownVisible: boolean = $state(false);

    function toggleIconDropdown(set_to = !IconDropdownVisible) {
        IconDropdownVisible = set_to;
    };
    function toggleProfileDropdown(set_to = !ProfileDropdownVisible) {
        ProfileDropdownVisible = set_to;
    };
    function toggleDropdown() {
        DropdownVisible = !DropdownVisible;
    };

    let locationsInDropdown = $derived(showLocationDropdown ? allLocationsSorted :
        (showVendorDropdown ? allVendorsSorted : []));
    let dropdownLink = $derived(showLocationDropdown ? "facility" :
        (showVendorDropdown ? "vendor" : ""));
    let showDropdown = $derived(showLocationDropdown || showVendorDropdown);


    onMount(() => {
        const handler = (event: MouseEvent) => {
            if (DropdownBoxTitle && !DropdownBoxTitle.contains(event.target as Node)) {
                DropdownVisible = false;
            }
            if (IconDropdownBoxTitle && !IconDropdownBoxTitle.contains(event.target as Node)) {
                IconDropdownVisible = false;
            }
            if (ProfileDropdownBoxTitle && !ProfileDropdownBoxTitle.contains(event.target as Node)) {
                ProfileDropdownVisible = false;
            }
        };
        window.addEventListener('click', handler);

        if (DropdownBox) {
            DropdownVisible = true; // Make it visible so it has a width
            DropdownTitleWidth = DropdownBox.clientWidth+"px";
            DropdownVisible = false;
        }
        return () => {
            window.removeEventListener('click', handler);
        }
    });

</script>

<nav style={$isMobile ? ($isMobilePortrait ? "grid-template-columns: 150px 1fr 1fr" : "grid-template-columns: 150px 300px 1fr 1fr") : ""}>
    <entry id="logo_container">
        <Logo disableAlignment={true} />
    </entry>

    {#if !$isMobile || !$isMobilePortrait}
        <topbar-entry id="title">
            LaSalle Location Database
        </topbar-entry>
    {/if}

    {#if showDropdown && !$isMobilePortrait}
        <topbar-entry id="dropdown" class="dropdown" style={"grid-column: "+(($isMobile && $isMobilePortrait) ? 2 : 3)}>
            <!-- <dropdown-title bind:this={DropdownBoxTitle} style:width={DropdownTitleWidth} onclick={() => toggleDropdown()} style={($isMobilePortrait ? "min-width: 150px;" : "")}> -->
            <button class="button-as-blank-box dropdown-title" bind:this={DropdownBoxTitle} onclick={() => toggleDropdown()} style={($isMobilePortrait ? "min-width: 150px;" : "")}>
                <not-a>
                    {clamp_string_to_length(thisLocationName, !$isMobilePortrait ? 55 : 20)}
                </not-a>
                <not-a class="push-right">
                    <IconDown />
                </not-a>
            </button>
            <dropdown-box bind:this={DropdownBox} style={(DropdownVisible ? "" : "display: none;")+($isMobilePortrait ? "min-width: 150px; max-height: 600px" : ($isMobile ? "max-height: 300px" : ""))}>
                {#each locationsInDropdown as location}
                    <form id={"TopbarForm_"+location.name} action="?/swapLocation" method="POST" use:enhance={({ formData }) => {
                        return async ({ update, result }) => {
                            await update({ reset: false });
                        };
                    }}></form>
                    <input type="number" form={"TopbarForm_"+location.name} name="newLocationId" value={location.id} hidden />
                    <input type="number" form={"TopbarForm_"+location.name} name="pageVendorId" value={pageVendor.id} hidden />
                    <button class="a button-as-blank-box" form={"TopbarForm_"+location.name}>
                        {clamp_string_to_length(location.name, !$isMobilePortrait ? 55 : 20)}
                    </button>
                {/each}
            </dropdown-box>
        </topbar-entry>
    {/if}
    
    {#if isLoggedIn}
        <!-- {#if !$isMobile} -->
            <topbar-entry id="user" class="dropdown profile-dropdown">
                <button class="button-as-blank-box dropdown-title profile-dropdown-title" bind:this={ProfileDropdownBoxTitle} onclick={() => toggleProfileDropdown()}>
                    <not-a class="push-right image-container">
                        {#if profile_picture.exists}
                            <not-a>
                                <!-- <img alt="Profile Picture" src={"/uploads/profile_pictures/user_"+user.id+".png?v="+profile_picture.last_modified} /> -->
                                <img alt={name} src={profile_picture.src} />
                            </not-a>
                        {/if}
                        {name} 
                        {#if isAdmin}
                            (Admin)
                        {/if}
                    </not-a>
                </button>
                <dropdown-box bind:this={ProfileDropdown} class="profile-dropdown-box" style={(ProfileDropdownVisible ? "" : "display: none;")+($isMobilePortrait ? "max-height: 600px" : ($isMobile ? "max-height: 300px" : ""))}>
                    <a href={"/user/"}><smaller>Profile</smaller></a>
                    <a href={"/logout/"} data-sveltekit-preload-data="off"><smaller>Logout</smaller></a>
                </dropdown-box>
            </topbar-entry>
        <!-- {/if} -->

        {#if !$isMobile}
            <icon-container id="icons" style={"grid-column: "+(($isMobile) ? ($isMobilePortrait ? 3 : 4) : 5)}>
                {#if !$isLaptop}
                    <topbar-entry id="home">
                        <a href="/" class="topbar-button icon-text">
                            Home
                        </a>
                    </topbar-entry>
                    <topbar-entry>
                        <a href="/all_location/" class="topbar-button icon-text">
                            Locations
                        </a>
                    </topbar-entry>
                    <topbar-entry>
                        <a href="/all_staff/" class="topbar-button icon-text">
                            All Staff
                        </a>
                    </topbar-entry>
                    <topbar-entry>
                        <a href="/all_isp/" class="topbar-button icon-text">
                            All ISPs
                        </a>
                    </topbar-entry>
                    <topbar-entry>
                        <a href="/links/" class="topbar-button icon-text">
                            Links
                        </a>
                    </topbar-entry>
                    <!-- <topbar-entry id="logout">
                        <a href="/logout/" data-sveltekit-preload-data="off" class="topbar-button icon-text">
                            Logout
                        </a>
                    </topbar-entry> -->
                {/if}
                {#if isAdmin || $isLaptop}
                    <topbar-entry id="hamburger" class="dropdown icon-dropdown">
                        <!-- style:width={IconDropdownWidth} -->
                        <button class="dropdown-title icon-dropdown-title dropdown-title" bind:this={IconDropdownBoxTitle} onclick={() => toggleIconDropdown()}>
                            <not-a class="push-right">
                                <IconMenu />
                            </not-a>
                        </button>
                        <dropdown-box bind:this={IconDropdown} class="icon-dropdown-box" style={(IconDropdownVisible ? "" : "display: none;")+($isMobilePortrait ? "max-height: 600px" : ($isMobile ? "max-height: 300px" : ""))}>
                            {#if $isLaptop}
                                <a href={"/"}><smaller>Home</smaller></a>
                                <a href={"/all_location/"}><smaller>Locations</smaller></a>
                                <a href={"/all_staff/"}><smaller>All Staff</smaller></a>
                                <a href={"/all_isp/"}><smaller>All ISPs</smaller></a>
                                <a href={"/links/"}><smaller>Links</smaller></a>
                            {/if}
                            <!-- <a href={"/user/"}><smaller>Profile</smaller></a> -->
                            {#if isAdmin}
                                <a href={"/accounts/"}><smaller>Accounts</smaller></a>
                                <a href={"/activity_log/"}><smaller>Activity Log</smaller></a>
                                <a href={"/announcements/"}><smaller>Announcements</smaller></a>
                                <a href={"/data_management/"}><smaller>Data Management</smaller></a>
                                <a href={"/trash_can/"}><smaller>Trash Can</smaller></a>
                            {/if}
                            <!-- {#if $isLaptop}
                                <a href={"/logout/"} data-sveltekit-preload-data="off"><smaller>Logout</smaller></a>
                            {/if} -->
                        </dropdown-box>
                    </topbar-entry>
                {/if}
            </icon-container>
        {:else}
            <icon-container id="icons" style={"grid-column: "+(($isMobile) ? ($isMobilePortrait ? 3 : 4) : 5)}>
                <topbar-entry id="hamburger" class="dropdown icon-dropdown">
                    <!-- style:width={IconDropdownWidth} -->
                    <button class="icon-dropdown-title dropdown-title button-as-blank-box" bind:this={IconDropdownBoxTitle} onclick={() => toggleIconDropdown()}>
                        <not-a class="push-right">
                            <IconMenu />
                        </not-a>
                    </button>
                    <dropdown-box bind:this={IconDropdown} class="icon-dropdown-box" style={(IconDropdownVisible ? "" : "display: none;")+($isMobilePortrait ? "max-height: 600px" : ($isMobile ? "max-height: 300px" : ""))}>
                        <a href={"/"}><smaller>Home</smaller></a>
                        <a href={"/all_location/"}><smaller>Locations</smaller></a>
                        <a href={"/user/"}><smaller>Profile</smaller></a>
                        <a href={"/all_isp/"}><smaller>All ISPs</smaller></a>
                        <a href={"/all_staff/"}><smaller>All Staff</smaller></a>
                        {#if isAdmin}
                            <a href={"/accounts/"}><smaller>Accounts</smaller></a>
                            <a href={"/activity_log/"}><smaller>Activity Log</smaller></a>
                            <!-- <a href={"/activity_log/?reload_cache=1"}><smaller>Activity Log</smaller></a> -->
                            <a href={"/announcements/"}><smaller> Announcements</smaller></a>
                            <a href={"/data_management/"}><smaller>Data Management</smaller></a>
                            <a href={"/trash_can/"}><smaller>Trash Can</smaller></a>
                        {/if}
                        <a href={"/links/"}><smaller>Links</smaller></a>
                        <a href={"/logout/"} data-sveltekit-preload-data="off"><smaller>Logout</smaller></a>
                    </dropdown-box>
                </topbar-entry>
            </icon-container>
        {/if}
    {/if}
</nav>

{#if isLoggedIn}
    <Breadcrumb current_location_id={thisLocationId} current_location_active={thisLocationActive} on_vendors_page={thisLocationIsVendor} />
{/if}

<style>

    nav {
        width: 100%;
        display: grid;
        
        grid-template-columns: 150px 300px 1fr 1fr minmax(0px, 480px);
        grid-auto-rows: minmax(70px, auto);
        min-height: 70px;
        
        background-color: var(--topbar);
        position: sticky;
        top: 0px;
        left: 0px;

        z-index: 3;
    }
    
    .button-as-blank-box {
        background: none;
        color: inherit;
        /* border: 2px solid var(--accent5); */
        border: none;
        padding: 0;
        font: inherit;
        cursor: pointer;
        outline: inherit;
        text-align: left;
        border-radius: 0;
        line-height: inherit;
        letter-spacing: inherit;
    }
    .button-as-blank-box:focus {
        outline: var(--accent5) auto 2px;
    }
    
    topbar-entry {
        display: flex;
        text-decoration: none;

        color: var(--topbar-text);
        font-size: var(--font-size3);
        font-weight: bold;

        justify-content: center;
        align-items: center;

        overflow-x: visible;
        white-space: nowrap;
    }

    icon-container {
        display: grid;
        grid-template-columns: 1fr auto auto auto auto auto auto auto auto;
        grid-auto-rows: minmax(50px, auto);
    }

    a, .a {
        /* font-size: var(--font-size7); */
        padding: 20px;
        /* width: 100%; */
    }
    
    .topbar-button {
        display: flex;
        text-decoration: none;

        cursor: pointer;

        color: var(--topbar-text);
        font-size: var(--font-size5);
        font-weight: bold;

        justify-content: center;
        align-items: center;

        padding: 12px;
        /* margin: 12px; */
        padding-top: 12px;
        padding-bottom: 12px;

        transition: background-color 200ms;
        background-color: var(--transparent);
    }

    .topbar-button:hover {
        background-color: var(--topbar-hover);
    }

    /* select {
        color: var(--accent5);
        font-size: var(--font-size1);
    } */

    /* In Nav */
    #logo_container {
        grid-column: 1;

        justify-self: left;
        margin-left: 10px;
        /* margin-bottom: 10px; */
        /* margin-top: 4px; */
    }
    #title {
        grid-column: 2;

        font-size: var(--font-size4);
        justify-self: left;
    }
    #dropdown {
        grid-column: 3;

        font-size: var(--font-size3);
        justify-self: left;
    }
    #user {
        grid-column: 4;

        margin-left: 5px;
        justify-self: right;
    }
    #icons {
        grid-column: 5;
        
        width: calc(100% - 10px);
        margin-right: 10px;
    }

    /* In Icon-Container */
    #home {
        grid-column: 2;
    }
    /* #locations { */
        /* grid-column: 4; */
    /* } */
    /* #logout { */
        /* grid-column: 5; */
    /* } */
    #hamburger {
        grid-column: 7;
        /* margin-left: 12px; */
    }
    
    .dropdown {
        position: relative;
        display: inline-block;
        margin-top: auto;
        margin-bottom: auto;
    }

    .dropdown-title {
        display: flex;
        background-color: var(--topbar-text);
        padding: 4px;
        font-weight: normal;
        font-size: var(--font-size1);
        min-width: 250px;
        color: var(--topbar);
        border: 1px solid var(--accent6);
        /* border-radius: 5px; */
        flex-direction: row;
        justify-content: space-between;
        cursor: pointer;
    }

    dropdown-box {
        display: block;
        position: absolute;
        background-color: var(--accent1);
        min-width: 320px;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
        z-index: 3;
        border: 1px solid var(--accent6);
        /* border-radius: 5px; */
        /* z-index: ; */
        max-height: 800px;
        overflow-y: auto;
    }

    dropdown-box a, dropdown-box .a {
        color: var(--accent5);
        padding: 3px;
        padding-right: 6px;
        /* padding: 1%; */
        /* width: 98%; */
        text-decoration: none;
        display: block;
        font-weight: normal;
        font-size: var(--font-size1);
        width: 100%;
    }

    dropdown-box a:hover, dropdown-box .a:hover {
        background-color: var(--accent0);
    }

    /* .dropdown:hover dropdown-box {
        display: block;
    } */

    .dropdown:hover .dropdown-title {
        background-color: var(--accent0);
    }

    .icon-dropdown {
        min-width: 0;
    }
    .icon-dropdown-title {
        min-width: 0;
        /* width: auto; */
        background-color: transparent;
        border: none;
        border-radius: none;
        color: var(--topbar-text);
        font-size: var(--font-size4);
        padding: 8px;
        padding-top: 8px;
        padding-bottom: 8px;

        grid-row: 1;
        grid-column: 8;
    }
    .icon-dropdown-box {
        min-width: 200px;
        right: 0px;
    }
    .icon-dropdown-box a {
        text-align: left;
        align-items: start;
        display: flex;
        width: auto;
    }

    .icon-dropdown:hover .icon-dropdown-title {
        background-color: var(--topbar-hover);
    }

    .profile-dropdown {
        min-width: 0;
    }
    .profile-dropdown-title {
        min-width: 0;
        /* width: auto; */
        background-color: transparent;
        border: none;
        border-radius: none;
        color: var(--topbar-text);
        font-size: var(--font-size3);
        padding: 4px;
        padding-top: 4px;
        padding-bottom: 4px;
        /* padding: 0px; */

        grid-row: 1;
        grid-column: 8;
    }
    .profile-dropdown-box {
        min-width: 100px;
        right: 0px;
    }
    .profile-dropdown-box a {
        text-align: left;
        align-items: start;
        display: flex;
        width: auto;
    }

    .profile-dropdown:hover .profile-dropdown-title {
        background-color: var(--topbar-hover);
    }

    not-a {
        display: flex;
    }

    .push-right {
        width: auto;
        justify-content: right;
        align-items: flex-end;
        display: flex;
    }

    smaller {
        font-size: var(--font-size3);
        margin-left: 5px;
        padding: 5px;
        color: var(--accent5);
    }

    .icon-text {
        font-size: var(--font-size2);
    }

    .image-container {
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .image-container not-a {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        overflow: hidden;
        background: white;
        /* border: 2px solid var(--topbar-text); */
    }

    .image-container not-a img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
</style>