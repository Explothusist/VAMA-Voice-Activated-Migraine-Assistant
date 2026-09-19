<svelte:options runes={true} />
<script lang="ts">

    let { children } = $props();

</script>

<!-- <slot /> -->
{@render children?.()}

<style>

</style>
