<script lang="ts">
    import { tick } from 'svelte';
    import { gameStore, AVAILABLE_ARTIFACTS, formatNumber } from '../store';
    import gsap from 'gsap';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void;

    let modalEl: HTMLElement;
    let overlayEl: HTMLElement;

    $: if (isOpen) {
        tick().then(() => {
            if (overlayEl && modalEl && !isEmbedded) {
                gsap.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.3 });
                gsap.fromTo(modalEl, { y: 50, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.2)' });
            }
        });
    }

    function close() {
        if (overlayEl && modalEl && !isEmbedded) {
            gsap.to(overlayEl, { opacity: 0, duration: 0.2 });
            gsap.to(modalEl, { y: 30, opacity: 0, scale: 0.9, duration: 0.25, ease: 'power2.in', onComplete: onClose });
        } else {
            onClose();
        }
    }

    function buy(id: number, cost: number) {
        if ($gameStore.stardust >= cost && !$gameStore.artifacts.includes(id)) {
            gameStore.buyArtifact(id, cost);
        }
    }
</script>

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" class:embedded={isEmbedded} bind:this={overlayEl} on:click={close}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal" class:embedded-modal={isEmbedded} bind:this={modalEl} on:click|stopPropagation>
        <div class="modal-header">
            <div class="header-icon">🏺</div>
            <div class="header-text">
                <h2>Лавка Древностей</h2>
                <p class="header-sub">Здесь продаются могущественные артефакты</p>
            </div>
            <button class="close-btn" on:click={close}>✕</button>
        </div>
        
        <div class="balance-row">
            <div class="balance-chip stardust">
                <span>✨ {formatNumber($gameStore.stardust)} Звездной Пыли</span>
            </div>
        </div>
        
        <div class="artifact-list">
            {#each AVAILABLE_ARTIFACTS as art}
                {@const isBought = $gameStore.artifacts.includes(art.id)}
                {@const canAfford = $gameStore.stardust >= art.cost}
                <div class="artifact-card" class:bought={isBought} class:unaffordable={!canAfford && !isBought}>
                    <div class="artifact-icon">
                        {@html art.svg}
                    </div>
                    <div class="artifact-info">
                        <h3>{art.name}</h3>
                        <p>{art.description}</p>
                    </div>
                    <div class="artifact-action">
                        {#if isBought}
                            <span class="status-bought">Куплено</span>
                        {:else}
                            <button 
                                class="btn-buy" 
                                disabled={!canAfford}
                                on:click={() => buy(art.id, art.cost)}
                            >
                                ✨ {art.cost}
                            </button>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>
{/if}

<style>
    .overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.6);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .embedded {
        position: relative;
        background: transparent;
        backdrop-filter: none;
        z-index: 1;
        padding: 0;
        inset: auto;
    }

    .modal {
        width: 100%;
        max-width: 450px;
        background: #1a1a2e;
        height: 80vh;
        max-height: 600px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        border: 2px solid #3498db;
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .embedded-modal {
        box-shadow: none;
        border: none;
        border-radius: 0;
        width: 100%;
        max-width: none;
        max-height: none;
        height: 100%;
        background: transparent;
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

    .artifact-list {
        padding: 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 15px;
    }

    .artifact-card {
        display: flex;
        background: rgba(255,255,255,0.05);
        border-radius: 12px;
        padding: 15px;
        align-items: center;
        gap: 15px;
        border: 1px solid transparent;
        transition: all 0.3s;
    }

    .artifact-card:hover {
        background: rgba(255,255,255,0.08);
        border-color: rgba(52, 152, 219, 0.3);
    }

    .artifact-card.bought {
        border-color: rgba(46, 204, 113, 0.5);
        background: rgba(46, 204, 113, 0.05);
    }

    .artifact-card.unaffordable:not(.bought) {
        opacity: 0.8;
    }

    .artifact-icon {
        width: 60px;
        height: 60px;
        flex-shrink: 0;
    }

    .artifact-info {
        flex: 1;
    }

    .artifact-info h3 {
        margin: 0 0 5px 0;
        color: #f1c40f;
        font-size: 1.1rem;
    }

    .artifact-info p {
        margin: 0;
        font-size: 0.85rem;
        color: #bbb;
    }

    .btn-buy {
        background: #3498db;
        border: none;
        color: white;
        padding: 8px 15px;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s, background 0.2s;
    }

    .btn-buy:disabled {
        background: #7f8c8d;
        cursor: not-allowed;
    }

    .btn-buy:not(:disabled):hover {
        transform: scale(1.05);
        background: #2980b9;
    }

    .status-bought {
        color: #2ecc71;
        font-weight: bold;
        font-size: 0.9rem;
    }
</style>
