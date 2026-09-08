<script lang="ts">
    import { tick } from 'svelte';
    import { gameStore, AVAILABLE_ARTIFACTS, formatNumber } from '../store';
    import { saveGame } from '../yandex-sdk';
    import gsap from 'gsap';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void = () => {};

    let modalEl: HTMLElement;
    let overlayEl: HTMLElement;

    const archmageIds = [3, 4, 5, 6, 7];
    $: archmageOwnedCount = archmageIds.filter(id => $gameStore.artifacts.includes(id)).length;
    $: hasFullArchmageSet = archmageOwnedCount === archmageIds.length;

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

    async function buy(id: number, cost: number) {
        if ($gameStore.stardust >= cost && !$gameStore.artifacts.includes(id)) {
            gameStore.buyArtifact(id, cost);
            await saveGame();
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
        {#if !isEmbedded}
            <div class="tab-header">
                <div class="tab-title-row">
                    <div class="header-icon">
                        <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                            <path d="M10 6 C10 4 22 4 22 6 L21 9 C25 12 26 17 23 23 C21 27 18 28 16 28 C14 28 11 27 9 23 C6 17 7 12 11 9 Z" fill="#d35400" stroke="#f39c12" stroke-width="1.5"/>
                            <path d="M8 12 Q5 14 5 17 Q5 20 9 20" stroke="#f39c12" stroke-width="1.5" stroke-linecap="round"/>
                            <path d="M24 12 Q27 14 27 17 Q27 20 23 20" stroke="#f39c12" stroke-width="1.5" stroke-linecap="round"/>
                            <ellipse cx="16" cy="6" rx="6" ry="2" fill="#e67e22"/>
                        </svg>
                    </div>
                    <h2 class="tab-title">Лавка Древностей</h2>
                </div>
                <p class="header-sub">Здесь продаются могущественные реликвии за Звездную Пыль</p>

                <div class="balance-row">
                    <div class="balance-chip stardust">
                        <span class="icon">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                                <path d="M12 2 L14 8 L20 10 L15 14 L17 21 L12 17 L7 21 L9 14 L4 10 L10 8 Z" fill="#e056fd" stroke="#be2edd" stroke-width="1.5"/>
                            </svg>
                        </span>
                        <span>{formatNumber($gameStore.stardust)} Звездной Пыли</span>
                    </div>
                </div>

                <button class="close-btn" on:click={close}>✕</button>
            </div>
        {/if}

        <!-- Archmage Synergy Banner -->
        <div class="synergy-banner" class:completed={hasFullArchmageSet}>
            <div class="synergy-icon">
                <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                    <circle cx="16" cy="16" r="14" stroke="#f1c40f" stroke-width="2" stroke-dasharray="3 2"/>
                    <path d="M16 6 L19 13 L26 14 L21 19 L22 26 L16 22 L10 26 L11 19 L6 14 L13 13 Z" fill="url(#starSynergyGrad)" stroke="#f39c12" stroke-width="1.2"/>
                    <defs>
                        <linearGradient id="starSynergyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#ffeaa7"/>
                            <stop offset="100%" stop-color="#fdcb6e"/>
                        </linearGradient>
                    </defs>
                </svg>
            </div>
            <div class="synergy-info">
                <div class="synergy-title-row">
                    <span class="synergy-name">Сет Наследия Архимага</span>
                    <span class="synergy-count" class:done={hasFullArchmageSet}>{archmageOwnedCount}/5</span>
                </div>
                <div class="synergy-desc">
                    {#if hasFullArchmageSet}
                        Комплект собран! Разблокирован легендарный Астральный Дракон в Коллекциях.
                    {:else}
                        Соберите Мантию, Посох, Шляпу, Кольцо и Око для призыва Астрального Дракона.
                    {/if}
                </div>
            </div>
        </div>
        
        <div class="artifact-list">
            {#each AVAILABLE_ARTIFACTS as art}
                {@const isBought = $gameStore.artifacts.includes(art.id)}
                {@const canAfford = $gameStore.stardust >= art.cost}
                {@const isArchmagePiece = archmageIds.includes(art.id)}
                <div class="artifact-card" class:bought={isBought} class:unaffordable={!canAfford && !isBought} class:archmage={isArchmagePiece}>
                    <div class="artifact-icon">
                        {@html art.svg}
                    </div>
                    <div class="artifact-info">
                        <div class="art-header-line">
                            <h3>{art.name}</h3>
                            {#if isArchmagePiece}
                                <span class="badge-set">Сет</span>
                            {/if}
                        </div>
                        <p>{art.description}</p>
                    </div>
                    <div class="artifact-action">
                        {#if isBought}
                            <span class="status-bought">
                                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3,8 7,12 13,4" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Получено
                            </span>
                        {:else}
                            <button 
                                class="btn-buy" 
                                disabled={!canAfford}
                                on:click={() => buy(art.id, art.cost)}
                            >
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                                    <path d="M12 2 L14 8 L20 10 L15 14 L17 21 L12 17 L7 21 L9 14 L4 10 L10 8 Z" fill="#ffeaa7" stroke="#fdcb6e" stroke-width="1.5"/>
                                </svg>
                                <span>{formatNumber(art.cost)}</span>
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
        background: rgba(0, 0, 0, 0.75);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(8px);
    }

    .embedded {
        position: relative;
        background: transparent;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        z-index: 1;
        padding: 0;
        inset: auto;
    }

    .modal {
        width: 100%;
        max-width: 540px;
        background: linear-gradient(160deg, #1a0a2e 0%, #150826 40%, #0d041a 100%);
        height: 85vh;
        max-height: 650px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.8), 0 0 30px rgba(162, 155, 254, 0.2);
        border: 2px solid rgba(241, 196, 15, 0.35);
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 20px;
        box-sizing: border-box;
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
        padding: 12px;
    }

    .tab-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 6px;
        margin-bottom: 12px;
        position: relative;
        flex-shrink: 0;
    }

    .tab-title-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 10px;
    }

    .header-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 0 8px rgba(241, 196, 15, 0.4));
    }

    .tab-title {
        margin: 0;
        color: #f1c40f;
        font-size: 1.6rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        text-shadow: 0 0 16px rgba(241, 196, 15, 0.5), 0 2px 4px rgba(0,0,0,0.8);
    }

    .header-sub {
        margin: 0;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.7);
    }

    .balance-row {
        display: flex;
        justify-content: center;
        margin-top: 4px;
    }

    .balance-chip.stardust {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(224, 86, 253, 0.4);
        color: #e056fd;
    }

    .close-btn {
        position: absolute;
        right: 0;
        top: 0;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.15);
        color: white;
        border-radius: 50%;
        width: 32px; height: 32px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .close-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.05); }

    /* Synergy Banner */
    .synergy-banner {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.1) 0%, rgba(155, 89, 182, 0.15) 100%);
        border: 1px solid rgba(241, 196, 15, 0.3);
        border-radius: 12px;
        margin-bottom: 12px;
        flex-shrink: 0;
    }

    .synergy-banner.completed {
        background: linear-gradient(135deg, rgba(46, 204, 113, 0.15) 0%, rgba(241, 196, 15, 0.2) 100%);
        border-color: rgba(46, 204, 113, 0.5);
    }

    .synergy-icon {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .synergy-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .synergy-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .synergy-name {
        font-size: 0.88rem;
        font-weight: 700;
        color: #ffeaa7;
    }

    .synergy-count {
        font-size: 0.82rem;
        font-weight: 800;
        color: #f1c40f;
        background: rgba(0, 0, 0, 0.35);
        padding: 2px 8px;
        border-radius: 10px;
        border: 1px solid rgba(241, 196, 15, 0.3);
    }

    .synergy-count.done {
        color: #2ecc71;
        border-color: rgba(46, 204, 113, 0.4);
    }

    .synergy-desc {
        font-size: 0.78rem;
        color: rgba(255, 255, 255, 0.75);
        line-height: 1.3;
    }

    /* Artifacts Grid */
    .artifact-list {
        flex: 1;
        overflow-y: auto;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 10px;
        padding-right: 4px;
    }

    .artifact-card {
        display: flex;
        background: linear-gradient(135deg, rgba(26, 10, 46, 0.75) 0%, rgba(45, 27, 78, 0.6) 100%);
        border: 1px solid rgba(241, 196, 15, 0.2);
        border-radius: 14px;
        padding: 12px;
        align-items: center;
        gap: 12px;
        transition: all 0.25s ease;
        position: relative;
    }

    .artifact-card:hover {
        background: linear-gradient(135deg, rgba(36, 15, 62, 0.85) 0%, rgba(55, 33, 94, 0.7) 100%);
        border-color: rgba(241, 196, 15, 0.5);
        box-shadow: 0 4px 15px rgba(241, 196, 15, 0.12);
    }

    .artifact-card.archmage {
        border-color: rgba(162, 155, 254, 0.35);
    }

    .artifact-card.bought {
        border-color: rgba(46, 204, 113, 0.4);
        background: linear-gradient(135deg, rgba(46, 204, 113, 0.08) 0%, rgba(26, 10, 46, 0.7) 100%);
    }

    .artifact-card.unaffordable:not(.bought) {
        opacity: 0.75;
    }

    .artifact-icon {
        width: 50px;
        height: 50px;
        flex-shrink: 0;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 4px;
        box-sizing: border-box;
    }

    .artifact-icon :global(svg) {
        width: 100%;
        height: 100%;
    }

    .artifact-info {
        flex: 1;
        min-width: 0;
    }

    .art-header-line {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 3px;
    }

    .artifact-info h3 {
        margin: 0;
        color: #ffeaa7;
        font-size: 0.95rem;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .badge-set {
        background: linear-gradient(135deg, #a29bfe, #6c5ce7);
        color: white;
        font-size: 0.65rem;
        font-weight: 800;
        padding: 1px 5px;
        border-radius: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .artifact-info p {
        margin: 0;
        font-size: 0.78rem;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.3;
    }

    .artifact-action {
        flex-shrink: 0;
    }

    .btn-buy {
        background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%);
        border: 1px solid #a29bfe;
        color: white;
        padding: 7px 12px;
        border-radius: 10px;
        font-weight: 700;
        font-size: 0.85rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(108, 92, 231, 0.4);
    }

    .btn-buy:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(108, 92, 231, 0.6);
        background: linear-gradient(135deg, #b8b1ff 0%, #7d6df0 100%);
    }

    .btn-buy:disabled {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.4);
        cursor: not-allowed;
        box-shadow: none;
    }

    .status-bought {
        color: #2ecc71;
        font-weight: 700;
        font-size: 0.82rem;
        display: flex;
        align-items: center;
        gap: 4px;
        background: rgba(46, 204, 113, 0.12);
        padding: 4px 8px;
        border-radius: 8px;
        border: 1px solid rgba(46, 204, 113, 0.3);
    }

    @media (max-width: 480px) {
        .artifact-list {
            grid-template-columns: 1fr;
        }
    }
</style>
