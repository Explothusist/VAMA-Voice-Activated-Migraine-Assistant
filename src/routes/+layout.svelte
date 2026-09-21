<svelte:options runes={true} />
<script lang="ts">

    let { data, children } = $props();

</script>

<svelte:head>
    <title>VAMA - Voice Activated Migraine Assistant</title>
</svelte:head>

<page>
    <!-- <content class={color_class}> -->
    {@render children?.()}
    <!-- </content> -->
</page>

<style>

    :global(:root) {
        --accent0: #000000;
        --accent1: #595959;

        --font-size1: 20px;
        --font-size2: 26px;
        --font-size3: 38px;
    }

    :global(html, body) {
        height: 100%;
        width: 100%;
    }

    :global(body) {
        margin: 0px;
        font-family: Arial, sans-serif;
    }

</style>