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
            <h2>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="#74b9ff" style="vertical-align: middle; display: inline-block;">
                    <polygon points="12,2 21,9 12,22 3,9"/>
                </svg>
                Премиум и Ритуалы
            </h2>
            <button class="close-btn" on:click={close}>✕</button>
        </div>

        <div class="tabs">
            <button class="tab" class:active={activeTab === 'bank'} on:click={() => activeTab = 'bank'}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="vertical-align: middle; display: inline-block;">
                    <path d="M12 2L2 7v2h20V7L12 2zm-8 8h3v8H4v-8zm6 0h3v8h-3v-8zm6 0h3v8h-3v-8zM2 20h20v2H2v-2z"/>
                </svg>
                Банк
            </button>
            <button class="tab" class:active={activeTab === 'timeskip'} on:click={() => activeTab = 'timeskip'}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="vertical-align: middle; display: inline-block;">
                    <path d="M6 2v6l4 4-4 4v6h12v-6l-4-4 4-4V2H6zm10 14.5l-4-4-4 4V20h8v-3.5zm-4-5l4-4V4H8v3.5l4 4z"/>
                </svg>
                Прыжок времени
            </button>
            <button class="tab" class:active={activeTab === 'secret'} on:click={() => activeTab = 'secret'}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="#a29bfe" style="vertical-align: middle; display: inline-block;">
                    <circle cx="12" cy="11" r="7" opacity="0.8"/>
                    <path d="M8 20h8v2H8z M10 18h4v2h-4z"/>
                </svg>
                Тайные Знания
            </button>
            <button class="tab" class:active={activeTab === 'rebirth'} on:click={() => activeTab = 'rebirth'}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="#e74c3c" style="vertical-align: middle; display: inline-block;">
                    <path d="M12 2a8 8 0 0 0-8 8c0 3.25 1.94 6.05 4.7 7.28V20h6.6v-2.72c2.76-1.23 4.7-4.03 4.7-7.28a8 8 0 0 0-8-8zm-3 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                </svg>
                Темный Ритуал
            </button>
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
