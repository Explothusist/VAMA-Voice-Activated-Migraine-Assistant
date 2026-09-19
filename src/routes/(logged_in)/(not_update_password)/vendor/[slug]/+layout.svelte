<svelte:options runes={true} />
<script lang="ts">
    import Footer from "$lib/components/Footer.svelte";
    
    let { children } = $props();

</script>

{@render children?.()}

<Footer />

<style>

</style>
