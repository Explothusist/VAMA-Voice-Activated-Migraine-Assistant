<svelte:options runes={true} />
<script lang="ts">
    import { browser } from "$app/environment";
    import { afterNavigate, beforeNavigate } from "$app/navigation";
    import { page } from "$app/state";
    import { onMount, onDestroy, setContext } from "svelte";
    import { writable, type Writable } from "svelte/store";

    let { data, children } = $props();
    let isLoading: Writable<boolean> = writable(true);

    function getColorClass(color_mode: string) {
        switch (color_mode) {
            case "Beige Standard":
                return "beige-mode";
            case "Beige Dark":
                return "beige-dark-mode";
            case "Beige Tinted":
                return "beige-tinted-mode";
            case "Gold Standard":
                return "gold-mode";
            case "Gold Dark":
                return "gold-dark-mode";
            case "Gold Tinted":
                return "gold-tinted-mode";
            case "Indigo Standard":
                return "indigo-mode";
            case "Indigo Dark":
                return "indigo-dark-mode";
            case "Indigo Tinted":
                return "indigo-tinted-mode";
            case "Monochrome Standard":
                return "monochrome-mode";
            case "Monochrome Dark":
                return "monochrome-dark-mode";
            case "Monochrome Tinted":
                return "monochrome-mode";
            case "Navy Standard":
                return "navy-mode";
            case "Navy Dark":
                return "navy-dark-mode";
            case "Navy Tinted":
                return "navy-tinted-mode";
            case "Orange Standard":
                return "orange-mode";
            case "Orange Dark":
                return "orange-dark-mode";
            case "Orange Tinted":
                return "orange-tinted-mode";
            case "Pink Standard":
                return "pink-mode";
            case "Pink Dark":
                return "pink-dark-mode";
            case "Pink Tinted":
                return "pink-tinted-mode";
            case "Scarlet Standard":
                return "scarlet-mode";
            case "Scarlet Dark":
                return "scarlet-dark-mode";
            case "Scarlet Tinted":
                return "scarlet-tinted-mode";
            case "Standard Standard":
                return "standard-mode";
            case "Standard Dark":
                return "standard-dark-mode";
            case "Standard Tinted":
                return "standard-tinted-mode";
            case "Turquoise Standard":
                return "turquoise-mode";
            case "Turquoise Dark":
                return "turquoise-dark-mode";
            case "Turquoise Tinted":
                return "turquoise-tinted-mode";
            default:
                return "standard-mode";
        }
    }

    let color_class = $derived(getColorClass(data.colormode));

    // use window/document scroll instead of a custom scroll container
    function update_scroll() {
        if (!browser) return;
        $scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    }

    let scrollY: Writable<number> = writable(0);
    let screen_width: Writable<number> = writable(2000);
    let isMobile: Writable<boolean> = writable(true);
    let isMobilePortrait: Writable<boolean> = writable(true);
    let isLaptop: Writable<boolean> = writable(true);

    $effect(() => {
        setContext('scroll', scrollY);
        setContext('width', screen_width);
        determineMobile($screen_width);
        setContext('isMobile', isMobile);
        setContext('isMobilePortrait', isMobilePortrait);
        setContext('isLaptop', isLaptop);
    });

    function determineMobile(width: number) {
        if (width < 500) {
            $isLaptop = true;
            $isMobile = true;
            $isMobilePortrait = true;
        }else if (width < 1000) {
            $isLaptop = true;
            $isMobile = true;
            $isMobilePortrait = false;
        }else if (width < 1350) {
            $isLaptop = true;
            $isMobile = false;
            $isMobilePortrait = false;
        }else {
            $isLaptop = false;
            $isMobile = false;
            $isMobilePortrait = false;
        }
    };

    function onResize() {
        if (!browser) return;
        $screen_width = window.innerWidth;
    }

    function handleFormSubmission(event: SubmitEvent) {
        const form = event.target;
        if (!(form instanceof HTMLFormElement)) return;

        $isLoading = true;
    }
    $effect(() => {
        const form = page.form;

        if (form) {
            $isLoading = false;
        }
    });
    afterNavigate(() => {
        $isLoading = false;
    });
    beforeNavigate(() => {
        $isLoading = true;
    })

    onMount(() => {
        if (!browser) return;

        // initialize values from window
        $screen_width = window.innerWidth;
        update_scroll();

        window.addEventListener('scroll', update_scroll, { passive: true });
        window.addEventListener('resize', onResize);

        $isLoading = false;
    });

    onDestroy(() => {
        if (!browser) return;
        window.removeEventListener('scroll', update_scroll);
        window.removeEventListener('resize', onResize);
    });
</script>

<svelte:head>
    <title>LaSalle Location Database</title>
</svelte:head>

<svelte:body onsubmitcapture={handleFormSubmission} />

<page>
    <content class={color_class}>
		{#if $isLoading}
			<div class="loading-overlay">
				<div class="loading-spinner"></div>
			</div>
		{/if}
        
        {@render children?.()}
    </content>
</page>

<style>

    :global(:root) {
        --accent0: #a0a0a0;
        --accent1: #a0a0a0;
        --accent2: #a0a0a0;
        --accent3: #a0a0a0;
        --accent4: #a0a0a0;
        --accent5: #a0a0a0;
        --accent6: #a0a0a0;
        --bg: var(--accent1);
        --topbar: var(--accent5);
        --topbar-text: var(--accent1);
        --topbar-hover: var(--accent2);
        --footer: #a0a0a0;
        --mapbg: var(--accent1);
        --hover: #00000033;
        --hover-flipped: #ffffff88;
        --hover-red: #ff000055;
        --accentb: #a0a0a0;
        --accentr: #a0a0a0;
        --accentgreyed: #a0a0a0;
        --accentedited: #b5b94a;
        --transparent: #00000000;
        --modal-background: #000000aa;
        --accent-input-border: #909090;

        --font-size1: 14px;
        --font-size2: 16px;
        --font-size3: 18px;
        --font-size4: 22px;
        --font-size5: 26px;
        --font-size6: 30px;
        --font-size7: 34px;
        --font-size-map-marker: 40px;
    }

    :global(content.beige-mode) {
        --accent0: #f3f3f3;
        --accent1: #ffffff;
        --accent2: #ebebeb;
        --accent3: #c59e74;
        --accent4: #6e4e18;
        --accent5: #45351f;
        --accent6: #13100b;
        --bg: var(--accent1);
        --topbar: var(--accent5);
        --topbar-text: var(--accent1);
        --topbar-hover: color-mix(in srgb, var(--accent2) 30%, var(--transparent));
        --mapbg: var(--accent1);
        --footer: #b4843c;
        --hover: #00000033;
        --hover-flipped: #ffffff88;
        --hover-red: #ff000055;
        --accentb: #2727b3;
        --accentr: #b32727;
        --accentgreyed: #707070;
        --accentedited: #f9cd5e;
    }
    :global(content.beige-dark-mode) {
        --accent0: #45351f;
        --accent1: #13100b;
        --accent2: #332813;
        --accent3: #835e27;
        --accent4: #c9c9c9;
        --accent5: #ffffff;
        --accent6: #f3f3f3;
        --bg: var(--accent1);
        --topbar: var(--accent2);
        --topbar-text: var(--accent5);
        --topbar-hover: color-mix(in srgb, var(--accent4) 30%, transparent);
        --mapbg: var(--accent4);
        --footer: #68401a;
        --hover: #ffffff33;
        --hover-flipped: #00000088;
        --hover-red: #ff000055;
        --accentb: #2ea6eb;
        --accentr: #ff5f20;
        --accentgreyed: #995858;
        --accentedited: #8d7433;
    }
    :global(content.beige-tinted-mode) {
        --accent0: #f3f3f3;
        --accent1: #ffffff;
        --accent2: #efe0d9;
        --accent3: #c59e74;
        --accent4: #6e4e18;
        --accent5: #45351f;
        --accent6: #13100b;
        --bg: var(--accent1);
        --topbar: var(--accent5);
        --topbar-text: var(--accent1);
        --topbar-hover: color-mix(in srgb, var(--accent2) 30%, var(--transparent));
        --mapbg: var(--accent1);
        --footer: #b4843c;
        --hover: #00000033;
        --hover-flipped: #ffffff88;
        --hover-red: #ff000055;
        --accentb: #2727b3;
        --accentr: #b32727;
        --accentgreyed: #707070;
        --accentedited: #f9cd5e;
    }

    :global(content.gold-mode) {
        --accent0: #f3f3f3;
        --accent1: #ffffff;
        --accent2: #ebebeb;
        --accent3: #d2ce4d;
        --accent4: #6e6c18;
        --accent5: #55531f;
        --accent6: #13130b;
        --bg: var(--accent1);
        --topbar: var(--accent5);
        --topbar-text: var(--accent1);
        --topbar-hover: color-mix(in srgb, var(--accent2) 30%, var(--transparent));
        --mapbg: var(--accent1);
        --footer: #aeb43c;
        --hover: #00000033;
        --hover-flipped: #ffffff88;
        --hover-red: #ff000055;
        --accentb: #2727b3;
        --accentr: #b32727;
        --accentgreyed: #707070;
        --accentedited: #f9cd5e;
    }
    :global(content.gold-dark-mode) {
        --accent0: #44451f;
        --accent1: #13130b;
        --accent2: #333113;
        --accent3: #837a27;
        --accent4: #c9c9c9;
        --accent5: #ffffff;
        --accent6: #f3f3f3;
        --bg: var(--accent1);
        --topbar: var(--accent2);
        --topbar-text: var(--accent5);
        --topbar-hover: color-mix(in srgb, var(--accent4) 30%, transparent);
        --mapbg: var(--accent4);
        --footer: #68631a;
        --hover: #ffffff33;
        --hover-flipped: #00000088;
        --hover-red: #ff000055;
        --accentb: #2ea6eb;
        --accentr: #ff5f20;
        --accentgreyed: #995858;
        --accentedited: #8d7433;
    }
    :global(content.gold-tinted-mode) {
        --accent0: #f3f3f3;
        --accent1: #ffffff;
        --accent2: #efedd9;
        --accent3: #d2ce4d;
        --accent4: #6e6c18;
        --accent5: #55531f;
        --accent6: #13130b;
        --bg: var(--accent1);
        --topbar: var(--accent5);
        --topbar-text: var(--accent1);
        --topbar-hover: color-mix(in srgb, var(--accent2) 30%, var(--transparent));
        --mapbg: var(--accent1);
        --footer: #aeb43c;
        --hover: #00000033;
        --hover-flipped: #ffffff88;
        --hover-red: #ff000055;
        --accentb: #2727b3;
        --accentr: #b32727;
        --accentgreyed: #707070;
        --accentedited: #f9cd5e;
    }

    :global(content.indigo-mode) {
        --accent0: #f3f3f3;
        --accent1: #ffffff;
        --accent2: #ebebeb;
        --accent3: #9e74c5;
        --accent4: #41186e;
        --accent5: #331f45;
        --accent6: #100b13;
        --bg: var(--accent1);
        --topbar: var(--accent5);
        --topbar-text: var(--accent1);
        --topbar-hover: color-mix(in srgb, var(--accent2) 30%, var(--transparent));
        --mapbg: var(--accent1);
        --footer: #783cb4;
        --hover: #00000033;
        --hover-flipped: #ffffff88;
        --hover-red: #ff000055;
        --accentb: #2727b3;
        --accentr: #b32727;
        --accentgreyed: #707070;
        --accentedited: #f9cd5e;
    }
    :global(content.indigo-dark-mode) {
        --accent0: #331f45;
        --accent1: #100b13;
        --accent2: #261333;
        --accent3: #5e2783;
        --accent4: #c9c9c9;
        --accent5: #ffffff;
        --accent6: #f3f3f3;
        --bg: var(--accent1);
        --topbar: var(--accent2);
        --topbar-text: var(--accent5);
        --topbar-hover: color-mix(in srgb, var(--accent4) 30%, transparent);
        --mapbg: var(--accent4);
        --footer: #3c1a68;
        --hover: #ffffff33;
        --hover-flipped: #00000088;
        --hover-red: #ff000055;
        --accentb: #2ea6eb;
        --accentr: #ff5f20;
        --accentgreyed: #995858;
        --accentedited: #8d7433;
    }
    :global(content.indigo-tinted-mode) {
        --accent0: #f3f3f3;
        --accent1: #ffffff;
        --accent2: #e5d9ef;
        --accent3: #9e74c5;
        --accent4: #41186e;
        --accent5: #331f45;
        --accent6: #100b13;
        --bg: var(--accent1);
        --topbar: var(--accent5);
        --topbar-text: var(--accent1);
        --topbar-hover: color-mix(in srgb, var(--accent2) 30%, var(--transparent));
        --mapbg: var(--accent1);
        --footer: #783cb4;
        --hover: #00000033;
        --hover-flipped: #ffffff88;
        --hover-red: #ff000055;
        --accentb: #2727b3;
        --accentr: #b32727;
        --accentgreyed: #707070;
        --accentedited: #f9cd5e;
    }

    :global(content.monochrome-mode) {
        --accent0: #f3f3f3;
        --accent1: #ffffff;
        --accent2: #ebebeb;
        --accent3: #b9b9b9;
        --accent4: #646464;
        --accent5: #191919;
        --accent6: #000000;
        --bg: var(--accent1);
        --topbar: var(--accent5);
        --topbar-text: var(--accent1);
        /* --topbar-hover: var(--accent2); */
        --topbar-hover: color-mix(in srgb, var(--accent2) 30%, transparent);
        --mapbg: var(--accent1);
        --footer: #8f8f8f;
        --hover: #00000033;
        --hover-flipped: #ffffff88;
        --hover-red: #ff000055;
        --accentb: #2727b3;
        --accentr: #b32727;
        --accentgreyed: #707070;
        --accentedited: #f9cd5e;
    }
    :global(content.monochrome-dark-mode) {
        --accent0: #3e3e3e;
        --accent1: #000000;
        --accent2: #262626;
        --accent3: #7c7c7c;
        --accent4: #c9c9c9;
        --accent5: #ffffff;
        --accent6: #f3f3f3;
        --bg: var(--accent1);
        --topbar: var(--accent2);
        --topbar-text: var(--accent5);
        /* --topbar-hover: var(--accent4); */
        --topbar-hover: color-mix(in srgb, var(--accent4) 30%, transparent);
        --mapbg: var(--accent4);
        --footer: #606060;
        --hover: #ffffff55;
        --hover-flipped: #00000088;
        --hover-red: #ff000077;
        --accentb: #2ea6eb;
        --accentr: #ff5f20;
        --accentgreyed: #995858;
        --accentedited: #8d7433;
    }

    :global(content.navy-mode) {
        --accent0: #f3f3f3;
        --accent1: #ffffff;
        --accent2: #ebebeb;
        --accent3: #7492c5;
        --accent4: #18366e;
        --accent5: #1f2a45;
        --accent6: #0b0d13;
        --bg: var(--accent1);
        --topbar: var(--accent5);
        --topbar-text: var(--accent1);
        --topbar-hover: color-mix(in srgb, var(--accent2) 30%, var(--transparent));
        --mapbg: var(--accent1);
        --footer: #3c6ab4;
        --hover: #00000033;
        --hover-flipped: #ffffff88;
        --hover-red: #ff000055;
        --accentb: #2727b3;
        --accentr: #b32727;
        --accentgreyed: #707070;
        --accentedited: #f9cd5e;
    }
    :global(content.navy-dark-mode) {
        --accent0: #1f2c45;
        --accent1: #0b0f13;
        --accent2: #131e33;
        --accent3: #274a83;
        --accent4: #c9c9c9;
        --accent5: #ffffff;
        --accent6: #f3f3f3;
        --bg: var(--accent1);
        --topbar: var(--accent2);
        --topbar-text: var(--accent5);
        --topbar-hover: color-mix(in srgb, var(--accent4) 30%, transparent);
        --mapbg: var(--accent4);
        --footer: #1a3568;
        --hover: #ffffff33;
        --hover-flipped: #00000088;
        --hover-red: #ff000055;
        --accentb: #2ea6eb;
        --accentr: #ff5f20;
        --accentgreyed: #995858;
        --accentedited: #8d7433;
    }
    :global(content.navy-tinted-mode) {
        --accent0: #f3f3f3;
        --accent1: #ffffff;
        --accent2: #d9e1ef;
        --accent3: #7492c5;
        --accent4: #18366e;
        --accent5: #1f2a45;
        --accent6: #0b0d13;
        --bg: var(--accent1);
        --topbar: var(--accent5);
        --topbar-text: var(--accent1);
        --topbar-hover: color-mix(in srgb, var(--accent2) 30%, var(--transparent));
        --mapbg: var(--accent1);
        --footer: #3c6ab4;
        --hover: #00000033;
        --hover-flipped: #ffffff88;
        --hover-red: #ff000055;
        --accentb: #2727b3;
        --accentr: #b32727;
        --accentgreyed: #707070;
        --accentedited: #f9cd5e;
    }

    :global(content.orange-mode) {
        --accent0: #f3f3f3;
        --accent1: #ffffff;
        --accent2: #ebebeb;
        --accent3: #d29d4d;
        --accent4: #6e4018;
        --accent5: #55351f;
        --accent6: #2b1f17;
        --bg: var(--accent1);
        --topbar: var(--accent5);
        --topbar-text: var(--accent1);
        --topbar-hover: color-mix(in srgb, var(--accent2) 30%, var(--transparent));
        --mapbg: var(--accent1);
        --footer: #c27134;
        --hover: #00000033;
        --hover-flipped: #ffffff88;
        --hover-red: #ff000055;
        --accentb: #2727b3;
        --accentr: #b32727;
        --accentgreyed: #707070;
        --accentedited: #f9cd5e;
    }
    :global(content.orange-dark-mode) {
        --accent0: #44451f;
        --accent1: #13130b;
        --accent2: #333113;
        --accent3: #837a27;
        --accent4: #c9c9c9;
        --accent5: #ffffff;
        --accent6: #f3f3f3;
        --bg: var(--accent1);
        --topbar: var(--accent2);
        --topbar-text: var(--accent5);
        --topbar-hover: color-mix(in srgb, var(--accent4) 30%, transparent);
        --mapbg: var(--accent4);
        --footer: #68631a;
        --hover: #ffffff33;
        --hover-flipped: #00000088;
        --hover-red: #ff000055;
        --accentb: #2ea6eb;
        --accentr: #ff5f20;
        --accentgreyed: #995858;
        --accentedited: #8d7433;
    }
    :global(content.orange-tinted-mode) {
        --accent0: #f3f3f3;
        --accent1: #ffffff;
        --accent2: #efe4d9;
        --accent3: #d29d4d;
        --accent4: #6e4018;
        --accent5: #55351f;
        --accent6: #2b1f17;
        --bg: var(--accent1);
        --topbar: var(--accent5);
        --topbar-text: var(--accent1);
        --topbar-hover: color-mix(in srgb, var(--accent2) 30%, var(--transparent));
        --mapbg: var(--accent1);
        --footer: #c27134;
        --hover: #00000033;
        --hover-flipped: #ffffff88;
        --hover-red: #ff000055;
        --accentb: #2727b3;
        --accentr: #b32727;
        --accentgreyed: #707070;
        --accentedited: #f9cd5e;
    }

    :global(content.pink-mode) {
        --accent0: #f3f3f3;
        --accent1: #ffffff;
        --accent2: #ebebeb;
        --accent3: #c574a3;
        --accent4: #53186e;
        --accent5: #451f31;
        --accent6: #130b10;
        --bg: var(--accent1);
        --topbar: var(--accent5);
        --topbar-text: var(--accent1);
        --topbar-hover: color-mix(in srgb, var(--accent2) 30%, var(--transparent));
        --mapbg: var(--accent1);
        --footer: #b43c8c;
        --hover: #00000033;
        --hover-flipped: #ffffff88;
        --hover-red: #ff000055;
        --accentb: #2727b3;
        --accentr: #b32727;
        --accentgreyed: #707070;
        --accentedited: #f9cd5e;
    }
    :global(content.pink-dark-mode) {
        --accent0: #451f33;
        --accent1: #130b11;
        --accent2: #33132c;
        --accent3: #832767;
        --accent4: #c9c9c9;
        --accent5: #ffffff;
        --accent6: #f3f3f3;
        --bg: var(--accent1);
        --topbar: var(--accent2);
        --topbar-text: var(--accent5);
        --topbar-hover: color-mix(in srgb, var(--accent4) 30%, transparent);
        --mapbg: var(--accent4);
        --footer: #681a53;
        --hover: #ffffff33;
        --hover-flipped: #00000088;
        --hover-red: #ff000055;
        --accentb: #2ea6eb;
        --accentr: #ff5f20;
        --accentgreyed: #995858;
        --accentedited: #8d7433;
    }
    :global(content.pink-tinted-mode) {
        --accent0: #f3f3f3;
        --accent1: #ffffff;
        --accent2: #efd9e7;
        --accent3: #c574a3;
        --accent4: #53186e;
        --accent5: #451f31;
        --accent6: #130b10;
        --bg: var(--accent1);
        --topbar: var(--accent5);
        --topbar-text: var(--accent1);
        --topbar-hover: color-mix(in srgb, var(--accent2) 30%, var(--transparent));
        --mapbg: var(--accent1);
        --footer: #b43c8c;
        --hover: #00000033;
        --hover-flipped: #ffffff88;
        --hover-red: #ff000055;
        --accentb: #2727b3;
        --accentr: #b32727;
        --accentgreyed: #707070;
        --accentedited: #f9cd5e;
    }

    :global(content.scarlet-mode) {
        --accent0: #f3f3f3;
        --accent1: #ffffff;
        --accent2: #ebebeb;
        --accent3: #c57474;
        --accent4: #6e1818;
        --accent5: #451f1f;
        --accent6: #130b0b;
        --bg: var(--accent1);
        --topbar: var(--accent5);
        --topbar-text: var(--accent1);
        --topbar-hover: color-mix(in srgb, var(--accent2) 30%, var(--transparent));
        --mapbg: var(--accent1);
        --footer: #b43c3c;
        --hover: #00000033;
        --hover-flipped: #ffffff88;
        --hover-red: #ff000055;
        --accentb: #2727b3;
        --accentr: #b32727;
        --accentgreyed: #707070;
        --accentedited: #f9cd5e;
    }
    :global(content.scarlet-dark-mode) {
        --accent0: #451f1f;
        --accent1: #130b0b;
        --accent2: #331313;
        --accent3: #832727;
        --accent4: #c9c9c9;
        --accent5: #ffffff;
        --accent6: #f3f3f3;
        --bg: var(--accent1);
        --topbar: var(--accent2);
        --topbar-text: var(--accent5);
        --topbar-hover: color-mix(in srgb, var(--accent4) 30%, transparent);
        --mapbg: var(--accent4);
        --footer: #681a1a;
        --hover: #ffffff33;
        --hover-flipped: #00000088;
        --hover-red: #ff000055;
        --accentb: #2ea6eb;
        --accentr: #ff5f20;
        --accentgreyed: #995858;
        --accentedited: #8d7433;
    }
    :global(content.scarlet-tinted-mode) {
        --accent0: #f3f3f3;
        --accent1: #ffffff;
        --accent2: #efd9d9;
        --accent3: #c57474;
        --accent4: #6e1818;
        --accent5: #451f1f;
        --accent6: #130b0b;
        --bg: var(--accent1);
        --topbar: var(--accent5);
        --topbar-text: var(--accent1);
        --topbar-hover: color-mix(in srgb, var(--accent2) 30%, var(--transparent));
        --mapbg: var(--accent1);
        --footer: #b43c3c;
        --hover: #00000033;
        --hover-flipped: #ffffff88;
        --hover-red: #ff000055;
        --accentb: #2727b3;
        --accentr: #b32727;
        --accentgreyed: #707070;
        --accentedited: #f9cd5e;
    }

    :global(content.standard-mode) {
        --accent0: #f3f3f3;
        --accent1: #ffffff;
        --accent2: #ebebeb;
        --accent3: #b4c574;
        --accent4: #5c6e18;
        --accent5: #3C451F;
        --accent6: #10130b;
        --bg: var(--accent1);
        --topbar: var(--accent5);
        --topbar-text: var(--accent1);
        --topbar-hover: color-mix(in srgb, var(--accent2) 30%, var(--transparent));
        --mapbg: var(--accent1);
        --footer: #a1b43c;
        --hover: #00000033;
        --hover-flipped: #ffffff88;
        --hover-red: #ff000055;
        --accentb: #2727b3;
        --accentr: #b32727;
        --accentgreyed: #707070;
        --accentedited: #f9cd5e;
    }
    :global(content.standard-dark-mode) {
        --accent0: #3C451F;
        --accent1: #10130b;
        --accent2: #2b3313;
        --accent3: #708327;
        --accent4: #c9c9c9;
        --accent5: #ffffff;
        --accent6: #f3f3f3;
        --bg: var(--accent1);
        --topbar: var(--accent2);
        --topbar-text: var(--accent5);
        --topbar-hover: color-mix(in srgb, var(--accent4) 30%, transparent);
        --mapbg: var(--accent4);
        --footer: #5b681a;
        --hover: #ffffff33;
        --hover-flipped: #00000088;
        --hover-red: #ff000055;
        --accentb: #2ea6eb;
        --accentr: #ff5f20;
        --accentgreyed: #995858;
        --accentedited: #8d7433;
    }
    :global(content.standard-tinted-mode) {
        --accent0: #f3f3f3;
        --accent1: #ffffff;
        --accent2: #ddebdb;
        --accent3: #b4c574;
        --accent4: #5c6e18;
        --accent5: #3C451F;
        --accent6: #10130b;
        --bg: var(--accent1);
        --topbar: var(--accent5);
        --topbar-text: var(--accent1);
        --topbar-hover: color-mix(in srgb, var(--accent2) 30%, var(--transparent));
        --mapbg: var(--accent1);
        --footer: #a1b43c;
        --hover: #00000033;
        --hover-flipped: #ffffff88;
        --hover-red: #ff000055;
        --accentb: #2727b3;
        --accentr: #b32727;
        --accentgreyed: #707070;
        --accentedited: #f9cd5e;
    }

    :global(content.turquoise-mode) {
        --accent0: #f3f3f3;
        --accent1: #ffffff;
        --accent2: #ebebeb;
        --accent3: #74bec5;
        --accent4: #186e6a;
        --accent5: #1f4345;
        --accent6: #0b1313;
        --bg: var(--accent1);
        --topbar: var(--accent5);
        --topbar-text: var(--accent1);
        --topbar-hover: color-mix(in srgb, var(--accent2) 30%, var(--transparent));
        --mapbg: var(--accent1);
        --footer: #359b9c;
        --hover: #00000033;
        --hover-flipped: #ffffff88;
        --hover-red: #ff000055;
        --accentb: #2727b3;
        --accentr: #b32727;
        --accentgreyed: #707070;
        --accentedited: #f9cd5e;
    }
    :global(content.turquoise-dark-mode) {
        --accent0: #1f4345;
        --accent1: #0b1313;
        --accent2: #133133;
        --accent3: #277883;
        --accent4: #c9c9c9;
        --accent5: #ffffff;
        --accent6: #f3f3f3;
        --bg: var(--accent1);
        --topbar: var(--accent2);
        --topbar-text: var(--accent5);
        --topbar-hover: color-mix(in srgb, var(--accent4) 30%, transparent);
        --mapbg: var(--accent4);
        --footer: #1a5c68;
        --hover: #ffffff33;
        --hover-flipped: #00000088;
        --hover-red: #ff000055;
        --accentb: #2ea6eb;
        --accentr: #ff5f20;
        --accentgreyed: #995858;
        --accentedited: #8d7433;
    }
    :global(content.turquoise-tinted-mode) {
        --accent0: #f3f3f3;
        --accent1: #ffffff;
        --accent2: #d9ebef;
        --accent3: #74bec5;
        --accent4: #186e6a;
        --accent5: #1f4345;
        --accent6: #0b1313;
        --bg: var(--accent1);
        --topbar: var(--accent5);
        --topbar-text: var(--accent1);
        --topbar-hover: color-mix(in srgb, var(--accent2) 30%, var(--transparent));
        --mapbg: var(--accent1);
        --footer: #359b9c;
        --hover: #00000033;
        --hover-flipped: #ffffff88;
        --hover-red: #ff000055;
        --accentb: #2727b3;
        --accentr: #b32727;
        --accentgreyed: #707070;
        --accentedited: #f9cd5e;
    }

    :global(html, body) {
        height: 100%;
        width: 100%;
    }

    :global(body) {
        margin: 0px;
        font-family: Arial, sans-serif;
    }

    content {
        background-color: var(--accent1);
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        /* min-height: 100%; */
        /* height: 100%; */
        /* overflow-y: auto; /* means overflow */
        /* overflow-y: auto; */

        min-height: 100vh;
        
        /* height: auto; */
        /* min-height: 100vh; */
    }

	.loading-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background-color: rgba(0, 0, 0, 0.4); /* dimmed background */
		z-index: 10;
		display: flex;
		justify-content: center;
		align-items: center;
		pointer-events: none;
	}

	.loading-spinner {
        width: 48px;
        height: 48px;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top: 4px solid var(--accent3, #96AD45); /* your accent color */
        border-radius: 50%;
        animation: spin-alt 0.8s ease-in-out infinite;
		z-index: 10;
    }

	@keyframes spin-alt {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}


</style>