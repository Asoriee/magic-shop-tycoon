<script lang="ts">
    import { tick } from 'svelte';
    import gsap from 'gsap';
    import InventoryModal from './InventoryModal.svelte';
    import AlchemyTableModal from './AlchemyTableModal.svelte';
    import FamiliarsModal from './FamiliarsModal.svelte';
    import CollectionsTab from './CollectionsTab.svelte';
    import { showInterstitialAd } from '../yandex-sdk';

    export let isOpen = false;
    export let onClose: () => void;

    let activeTab: 'inventory' | 'alchemy' | 'pets' | 'collections' = 'inventory';
    let overlayEl: HTMLElement;
    let modalEl: HTMLElement;

    $: if (isOpen) {
        tick().then(() => {
            if (overlayEl && modalEl) {
                gsap.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.25 });
                gsap.fromTo(modalEl,
                    { y: 40, opacity: 0, scale: 0.93 },
                    { y: 0,  opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.3)' }
                );
            }
        });
    }

    function close() {
        if (overlayEl && modalEl) {
            gsap.to(overlayEl, { opacity: 0, duration: 0.2 });
            gsap.to(modalEl, { y: 30, opacity: 0, scale: 0.93, duration: 0.25, ease: 'power2.in', onComplete: () => {
                onClose();
                showInterstitialAd();
            }});
        } else {
            onClose();
            showInterstitialAd();
        }
    }
</script>

{#if isOpen}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="overlay" bind:this={overlayEl} on:click={close}>
    <div class="modal" bind:this={modalEl} on:click|stopPropagation>
        <div class="modal-header">
            <div class="header-icon">📖</div>
            <div class="header-text">
                <h2>Гримуар</h2>
                <p class="header-sub">Тайные знания и предметы</p>
            </div>
            <button class="close-btn" on:click={close}>✕</button>
        </div>

        <div class="tabs">
            <button class="tab" class:active={activeTab === 'inventory'} on:click={() => activeTab = 'inventory'}>🎒 Инвентарь</button>
            <button class="tab" class:active={activeTab === 'alchemy'} on:click={() => activeTab = 'alchemy'}>⚗️ Алхимия</button>
            <button class="tab" class:active={activeTab === 'pets'} on:click={() => activeTab = 'pets'}>🐉 Фамильяры</button>
            <button class="tab" class:active={activeTab === 'collections'} on:click={() => activeTab = 'collections'}>🏆 Коллекции</button>
        </div>

        <div class="content">
            {#if activeTab === 'inventory'}
                <InventoryModal isOpen={true} isEmbedded={true} onClose={() => {}} />
            {:else if activeTab === 'alchemy'}
                <AlchemyTableModal isOpen={true} isEmbedded={true} onClose={() => {}} />
            {:else if activeTab === 'pets'}
                <FamiliarsModal isOpen={true} isEmbedded={true} onClose={() => {}} />
            {:else if activeTab === 'collections'}
                <CollectionsTab />
            {/if}
        </div>
    </div>
</div>
{/if}

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 200;
        backdrop-filter: blur(8px);
    }

    .modal {
        background: linear-gradient(160deg, #130f24, #21193b);
        border: 2px solid #8e44ad;
        border-radius: 20px;
        box-shadow: 0 0 40px rgba(142, 68, 173, 0.4), inset 0 0 20px rgba(0,0,0,0.5);
        width: 95%;
        max-width: 650px;
        height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: white;
    }

    .close-btn {
        position: absolute;
        right: 16px;
        top: 16px;
        background: rgba(255,255,255,0.07);
        border: 1px solid rgba(255,255,255,0.12);
        color: white;
        border-radius: 50%;
        width: 30px; height: 30px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: background 0.2s;
    }
    .close-btn:hover { background: rgba(255,255,255,0.15); }

    .tabs {
        display: flex;
        background: rgba(0,0,0,0.4);
    }

    .tab {
        flex: 1;
        padding: 15px;
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        color: #7f8fa6;
        font-size: 1.1rem;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .tab:hover { background: rgba(255,255,255,0.05); color: white; }
    .tab.active { color: #a29bfe; border-bottom-color: #a29bfe; background: rgba(162, 155, 254, 0.1); }

    .content {
        flex: 1;
        overflow-y: auto;
        position: relative;
    }
</style>
