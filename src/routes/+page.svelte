<svelte:options runes={true} />
<script lang="ts">
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    
    let {
        form
    } = $props();

    let isMobile: Writable<boolean> = getContext("isMobile");
    let isMobilePortrait: Writable<boolean> = getContext("isMobilePortrait");
</script>


<modal>
    <form id = "authenticate" action = "?/authenticate" method="post">
        <dialog-stuff style={$isMobile ? ($isMobilePortrait ? "width: 300px; height: 500px;" : "position: relative; top: 200px; width: 300px; height: 500px;") : ""}>
            <text-entry id="title">
                Employee Login
            </text-entry>

            <flex-bit>
                <text-entry id="username" class="left-align">
                    Username:
                </text-entry>
                <input class="text-entry left-align input" name="username" type="text" placeholder="Username" required />
            </flex-bit>
        
            <flex-bit>
                <text-entry class="left-align">
                    Password:
                </text-entry>
                <input class="text-entry left-align input" name="password" type="password" placeholder="Password" required />
            </flex-bit>
            
            <text-entry>
                {#if form?.message}
                    <login-error>{form.message}</login-error>
                {/if}
            </text-entry>
        
            <text-entry class="login">
                <input type="submit" value="Login" class="button" />
            </text-entry>
        </dialog-stuff>
    </form>
</modal>


<style>
    dialog-stuff {
        display: flex;
        width: 400px;
        height: 550px;
        margin-top: calc(25% - 316px);
        margin-bottom: calc(25% - 316px);
        margin-right: auto;
        margin-left: auto;
        background-color: var(--accent2);
        border: 2px solid var(--accent5);
        /* border-radius: 40px; */

        justify-content: space-between;
        flex-direction: column;

        padding: 30px;
    }

    text-entry, .text-entry {
        display: flex;
        text-decoration: none;

        color: var(--accent5);
        font-size: var(--font-size3);

        max-width: 90%;

        justify-content: center;
        align-items: center;
        text-align: center;

        margin: 8px;
        margin-top: 4px;
        margin-bottom: 4px;

        /* overflow-x: visible; */
        /* white-space: nowrap; */

        margin-left: auto;
        margin-right: auto;
    }

    .input {
        font-size: var(--font-size2);
        /* margin-left: 10px; */
        padding: 10px;
        /* border-radius: 10px; */
        width: 100%;
        
        color: var(--accent5);
        background-color: var(--accent0);
    }

    .left-align {
        /* width: 100%; */
        text-align: left;
        margin-left: 8px;
    }

    #title {
        /* margin-top: 25px; */
        /* margin-bottom: 62px; */
        font-size: var(--font-size6);
        font-weight: bold;
    }

    .button {
        background-color: var(--accent5);
        color: var(--accent1);
        padding: 8px;
        width: 100%;
        /* border-radius: 15px; */
        font-size: var(--font-size3);
        cursor: pointer;
    }

    .button:hover {
        background-color: var(--accent4);
        color: var(--accent0);
    }

    .login {
        /* margin-top: 62px; */
        /* margin-bottom: 15px; */
        width: calc(100% - 40px);
        max-width: calc(100% - 40px);
        padding-left: 20px;
        padding-right: 20px;
        margin-bottom: 20px;
    }
    
    modal {
        display: flex;
        justify-content: center;
        align-items: center;
        position: fixed;
        left: 0px;
        top: 0px;
        background-color: var(--modal-background);
        width: 100%;
        height: 100%;
        /* font-family: helvetica; */
        opacity: 1;
        transition: opacity 500ms;
        z-index: 3;
        overflow-y: auto;
    }

    login-error {
        color: var(--accentr);
    }

    flex-bit {
        display: flex;
        flex-direction: column;
        padding-left: 20px;
        padding-right: 20px;
    }
</style>
