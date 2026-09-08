<script lang="ts">
    import { tick } from 'svelte';
    import gsap from 'gsap';
    import BankModal from './BankModal.svelte';
    import CrystalShopModal from './CrystalShopModal.svelte';
    import RebirthModal from './RebirthModal.svelte';
    import SecretUpgradesTab from './SecretUpgradesTab.svelte';
    import { showInterstitialAd } from '../yandex-sdk';

    export let isOpen = false;
    export let onClose: () => void;

    let activeTab: 'bank' | 'timeskip' | 'rebirth' | 'secret' = 'bank';
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
            <h2>💎 Премиум и Ритуалы</h2>
            <button class="close-btn" on:click={close}>✕</button>
        </div>

        <div class="tabs">
            <button class="tab" class:active={activeTab === 'bank'} on:click={() => activeTab = 'bank'}>🏦 Банк</button>
            <button class="tab" class:active={activeTab === 'timeskip'} on:click={() => activeTab = 'timeskip'}>⏳ Прыжок времени</button>
            <button class="tab" class:active={activeTab === 'secret'} on:click={() => activeTab = 'secret'}>🔮 Тайные Знания</button>
            <button class="tab" class:active={activeTab === 'rebirth'} on:click={() => activeTab = 'rebirth'}>💀 Темный Ритуал</button>
        </div>

        <div class="content">
            {#if activeTab === 'bank'}
                <BankModal isOpen={true} isEmbedded={true} onClose={() => {}} />
            {:else if activeTab === 'timeskip'}
                <CrystalShopModal isOpen={true} isEmbedded={true} onClose={() => {}} />
            {:else if activeTab === 'secret'}
                <SecretUpgradesTab />
            {:else if activeTab === 'rebirth'}
                <RebirthModal isOpen={true} isEmbedded={true} onClose={() => {}} />
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
        background: linear-gradient(160deg, #2d1b4e, #1a0a2e);
        border: 2px solid #f1c40f;
        border-radius: 20px;
        box-shadow: 0 0 40px rgba(241, 196, 15, 0.4), inset 0 0 20px rgba(0,0,0,0.5);
        width: 95%;
        max-width: 650px;
        height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: white;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        background: rgba(0, 0, 0, 0.3);
        border-bottom: 1px solid rgba(241, 196, 15, 0.5);
    }
    
    .modal-header h2 { margin: 0; font-size: 1.8rem; color: #f1c40f; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
    .close-btn { background: none; border: none; color: #b2bec3; font-size: 1.8rem; cursor: pointer; transition: color 0.2s; }
    .close-btn:hover { color: #ff7675; }

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
        color: #b2bec3;
        font-size: 1.1rem;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .tab:hover { background: rgba(255,255,255,0.05); color: white; }
    .tab.active { color: #f1c40f; border-bottom-color: #f1c40f; background: rgba(241, 196, 15, 0.1); }

    .content {
        flex: 1;
        overflow-y: auto;
        position: relative;
    }
</style>
