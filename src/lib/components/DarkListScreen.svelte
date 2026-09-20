<svelte:options runes={true} />
<script lang="ts">

    import type { SubtitleSizedEntry, TextLinkButton } from "$lib/utils";

    interface Props {
        title: string;
        subtitles: SubtitleSizedEntry[];
        list_entries: TextLinkButton[];
    };
    let {
        title,
        subtitles,
        list_entries
    }: Props = $props();

</script>

<backdrop-cont>
    <flex-cont class="spacer"></flex-cont>

    <flex-cont>
        <text-cont class="title-text">
            {title}
        </text-cont>
    </flex-cont>
    {#each subtitles as entry}
        <flex-cont>
            {#if entry.size === 2}
                <text-cont class="subtitle-text-2">
                    {entry.entry}
                </text-cont>
            {:else if entry.size === 1}
                <text-cont class="subtitle-text-1">
                    {entry.entry}
                </text-cont>
            {/if}
        </flex-cont>
    {/each}

    <flex-cont class="splitter"></flex-cont>

    {#each list_entries as entry}
        <flex-cont>
            <!-- <button class="button-as-blank-box button-cont list-text">
                {entry.title}
            </button> -->
            <a href={entry.href} class="button-cont list-text" target="_self">
                {entry.title}
            </a>
        </flex-cont>
    {/each}

    <flex-cont class="spacer"></flex-cont>
</backdrop-cont>

<style>

    /* .button-as-blank-box {
        background: none;
        color: inherit; */
        /* border: 2px solid var(--accent5); */
        /* border: none;
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
    } */
    
    backdrop-cont {
        background-color: var(--accent0);
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        /* justify-content: center; */
        /* align-items: center; */
    }

    flex-cont {
        display: flex;
        width: 100%;
        align-items: center;
        align-content: center;
    }

    text-cont {
        display: block;
        width: 100%;
        font-size: var(--font-size3);
        color: var(--accent1);
        margin: 32px;
        text-align: center;
    }
    .button-cont {
        display: block;
        width: 100%;
        font-size: var(--font-size3);
        color: var(--accent1);
        margin: 32px;
        text-align: center;
    }
    .title-text {
        font-size: var(--font-size3);
        margin: 12px;
    }
    .subtitle-text-1 {
        font-size: var(--font-size1);
        margin: 4px;
    }
    .subtitle-text-2 {
        font-size: var(--font-size2);
        margin: 8px;
    }
    .list-text {
        font-size: var(--font-size2);
        margin: 12px;
    }

    .spacer {
        height: 32px;
    }
    .splitter {
        flex: 1 1 auto;
    }

</style>