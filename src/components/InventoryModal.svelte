<script lang="ts">
    import { tick } from 'svelte';
    import gsap from 'gsap';
    import {
        ingredientsCount, potionsCount,
        AVAILABLE_INGREDIENTS, AVAILABLE_POTIONS,
        gameStore,
        type Rarity
    } from '../store';
    import { saveGame } from '../yandex-sdk';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void;

    let activeTab: 'ingredients' | 'potions' = 'ingredients';
    let modalEl: HTMLElement;
    let overlayEl: HTMLElement;
    let toastMessage: string | null = null;
    let toastTimer: number;

    const RARITY_COLORS: Record<Rarity, string> = {
        common:    '#b2bec3',
        rare:      '#74b9ff',
        epic:      '#a29bfe',
        legendary: '#f1c40f',
    };

    const RARITY_GLOW: Record<Rarity, string> = {
        common:    '0 0 6px rgba(178,190,195,0.3)',
        rare:      '0 0 10px rgba(116,185,255,0.5)',
        epic:      '0 0 14px rgba(162,155,254,0.6)',
        legendary: '0 0 18px rgba(241,196,15,0.7)',
    };

    const RARITY_LABELS: Record<Rarity, string> = {
        common:    'Обычный',
        rare:      'Редкий',
        epic:      'Эпический',
        legendary: 'Легендарный',
    };

    $: if (isOpen) {
        tick().then(() => {
            if (overlayEl && modalEl && !isEmbedded) {
                gsap.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.25 });
                gsap.fromTo(modalEl,
                    { y: 40, opacity: 0, scale: 0.93 },
                    { y: 0,  opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.3)' }
                );
            }
        });
    }

    function close() {
        if (overlayEl && modalEl && !isEmbedded) {
            gsap.to(overlayEl, { opacity: 0, duration: 0.2 });
            gsap.to(modalEl, { y: 30, opacity: 0, scale: 0.93, duration: 0.25, ease: 'power2.in', onComplete: onClose });
        } else {
            onClose();
        }
    }

    // All ingredients with their current count
    $: ingredientSlots = AVAILABLE_INGREDIENTS.map(ing => ({
        ...ing,
        count: $ingredientsCount[ing.id] ?? 0
    }));

    // Rarity order for sorting
    const RARITY_ORDER: Record<Rarity, number> = { legendary: 0, epic: 1, rare: 2, common: 3 };

    $: sortedIngredients = [...ingredientSlots].sort((a, b) => {
        // Sort by: has items first, then rarity
        if (b.count !== a.count && (a.count === 0 || b.count === 0)) {
            return b.count - a.count;
        }
        return RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
    });

    $: totalIngredients = Object.values($ingredientsCount).reduce((s, v) => s + v, 0);
    $: uniqueIngredients = Object.values($ingredientsCount).filter(v => v > 0).length;
    $: totalPotions = Object.values($potionsCount).reduce((s, v) => s + v, 0);

    function showFeedback(msg: string) {
        toastMessage = msg;
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => {
            toastMessage = null;
        }, 2200);
    }

    function handleUsePotion(potionId: string) {
        const potion = AVAILABLE_POTIONS.find(p => p.id === potionId);
        if (($potionsCount[potionId] ?? 0) > 0) {
            gameStore.usePotion(potionId);
            saveGame();
            showFeedback(`Зелье «${potion?.name ?? ''}» выпито!`);
        }
    }
</script>

{#if isOpen}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="overlay" class:embedded={isEmbedded} bind:this={overlayEl} on:click={close}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal" class:embedded-modal={isEmbedded} bind:this={modalEl} on:click|stopPropagation>

        <!-- Toast Feedback -->
        {#if toastMessage}
            <div class="inv-toast">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#2ed573" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>{toastMessage}</span>
            </div>
        {/if}

        <!-- Header only when standalone -->
        {#if !isEmbedded}
            <div class="modal-header">
                <div class="header-icon">
                    <svg viewBox="0 0 32 36" width="28" height="32">
                        <rect x="8" y="8" width="16" height="24" rx="4" fill="#a29bfe" stroke="#6c5ce7" stroke-width="1.5"/>
                        <rect x="12" y="4" width="8" height="6" rx="3" fill="#6c5ce7"/>
                        <rect x="13" y="14" width="6" height="2" rx="1" fill="white" opacity="0.5"/>
                        <rect x="13" y="18" width="6" height="2" rx="1" fill="white" opacity="0.4"/>
                    </svg>
                </div>
                <div class="header-text">
                    <h2>Инвентарь</h2>
                    <p class="header-sub">{uniqueIngredients}/{AVAILABLE_INGREDIENTS.length} видов · {totalIngredients} предметов</p>
                </div>
                <button class="close-btn" on:click={close}>✕</button>
            </div>
        {/if}

        <!-- Sub Tabs (SVG Only, No Emojis) -->
        <div class="sub-tabs">
            <button
                class="sub-tab"
                class:active={activeTab === 'ingredients'}
                on:click={() => activeTab = 'ingredients'}
            >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
                </svg>
                <span>Ингредиенты</span>
                <span class="sub-pill">{totalIngredients}</span>
            </button>
            <button
                class="sub-tab"
                class:active={activeTab === 'potions'}
                on:click={() => activeTab = 'potions'}
            >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 3h6M10 3v5l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3" stroke-linecap="round"/>
                    <line x1="8" y1="15" x2="16" y2="15" stroke="rgba(255,255,255,0.7)" stroke-linecap="round"/>
                </svg>
                <span>Зелья</span>
                <span class="sub-pill">{totalPotions}</span>
            </button>
        </div>

        <!-- Content -->
        <div class="content">
            {#if activeTab === 'ingredients'}
                <!-- Rarity Legend -->
                <div class="rarity-legend">
                    {#each Object.entries(RARITY_LABELS) as [rarity, label]}
                        <span class="rarity-dot" style="--c: {RARITY_COLORS[rarity as Rarity]}">{label}</span>
                    {/each}
                </div>

                <!-- Items Grid -->
                <div class="items-grid">
                    {#each sortedIngredients as ing (ing.id)}
                        <div
                            class="item-slot"
                            class:empty={ing.count === 0}
                            style="
                                --border-color: {ing.count > 0 ? RARITY_COLORS[ing.rarity] : 'rgba(255,255,255,0.08)'};
                                --glow: {ing.count > 0 ? RARITY_GLOW[ing.rarity] : 'none'};
                            "
                            title="{ing.name} ({RARITY_LABELS[ing.rarity]}){ing.count > 0 ? ` — ${ing.count} шт.` : ' — нет в наличии'}"
                        >
                            <div class="item-icon">
                                {@html ing.icon}
                            </div>
                            {#if ing.count > 0}
                                <div class="item-badge">{ing.count}</div>
                            {/if}
                            <div class="item-name">{ing.name}</div>
                        </div>
                    {/each}
                </div>

            {:else}
                {@const ownedPotions = AVAILABLE_POTIONS.filter(p => ($potionsCount[p.id] ?? 0) > 0)}
                <!-- Potions Tab -->
                <div class="potions-section">
                    {#if ownedPotions.length === 0}
                        <div class="empty-potions-box">
                            <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="#718093" stroke-width="1.8">
                                <path d="M18 6h12M20 6v10l-10 18a4 4 0 0 0 3.5 6h21a4 4 0 0 0 3.5-6l-10-18V6" stroke-linecap="round"/>
                                <circle cx="24" cy="30" r="3" fill="#718093" opacity="0.4"/>
                            </svg>
                            <p class="no-potions">У вас пока нет готовых зелий.</p>
                            <span class="no-potions-hint">Сварите эликсиры во вкладке «Алхимия» из найденных ингредиентов!</span>
                        </div>
                    {:else}
                        <div class="potions-grid">
                            {#each ownedPotions as potion (potion.id)}
                                <div class="potion-card">
                                    <div class="potion-icon">{@html potion.icon}</div>
                                    <div class="potion-info">
                                        <div class="potion-name-row">
                                            <span class="potion-name">{potion.name}</span>
                                            <span class="potion-count-pill">×{$potionsCount[potion.id]}</span>
                                        </div>
                                        <div class="potion-desc">{potion.description}</div>
                                    </div>
                                    <button class="use-potion-btn" on:click={() => handleUsePotion(potion.id)}>
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        Пить
                                    </button>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}

        </div>

    </div>
</div>
{/if}

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 200;
        backdrop-filter: blur(6px);
    }

    .modal {
        background: linear-gradient(160deg, #110722, #1b0c33);
        border: 1.5px solid rgba(162, 155, 254, 0.25);
        border-radius: 22px;
        box-shadow: 0 0 50px rgba(108, 92, 231, 0.25), 0 20px 50px rgba(0,0,0,0.7);
        width: 94%;
        max-width: 540px;
        max-height: 88vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: white;
        position: relative;
    }

    .embedded {
        position: relative;
        background: transparent;
        backdrop-filter: none;
        z-index: 1;
        padding: 0;
        inset: auto;
        width: 100%;
        height: 100%;
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

    /* Standalone Header */
    .modal-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        background: rgba(0,0,0,0.25);
        border-bottom: 1px solid rgba(255,255,255,0.08);
        position: relative;
    }

    .header-text h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #f1c40f;
    }

    .header-sub {
        margin: 2px 0 0;
        font-size: 0.8rem;
        color: #a4b0be;
    }

    .close-btn {
        position: absolute;
        right: 16px;
        top: 16px;
        background: rgba(255,255,255,0.07);
        border: 1px solid rgba(255,255,255,0.12);
        color: white;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: background 0.2s;
    }
    .close-btn:hover { background: rgba(255,255,255,0.15); }

    /* Toast */
    .inv-toast {
        position: absolute;
        top: 12px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 50;
        background: rgba(16, 32, 22, 0.95);
        border: 1px solid #2ed573;
        color: #e4fbf0;
        padding: 6px 14px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        font-weight: 700;
        box-shadow: 0 4px 15px rgba(0,0,0,0.6);
        animation: toastDrop 0.2s ease-out;
    }

    @keyframes toastDrop {
        from { opacity: 0; transform: translate(-50%, -10px); }
        to { opacity: 1; transform: translate(-50%, 0); }
    }

    /* Sub Tabs */
    .sub-tabs {
        display: flex;
        padding: 12px 16px 0;
        gap: 8px;
        flex-shrink: 0;
        background: rgba(0,0,0,0.2);
        border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .sub-tab {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 9px 12px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-bottom: none;
        border-radius: 12px 12px 0 0;
        color: #8395a7;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 700;
        transition: all 0.2s ease;
    }

    .sub-tab:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #dfe4ea;
    }

    .sub-tab.active {
        background: rgba(162, 155, 254, 0.16);
        border-color: rgba(162, 155, 254, 0.4);
        color: #ffeaa7;
    }

    .sub-pill {
        background: rgba(0, 0, 0, 0.4);
        padding: 2px 7px;
        border-radius: 10px;
        font-size: 0.72rem;
        border: 1px solid rgba(255,255,255,0.1);
    }

    .sub-tab.active .sub-pill {
        background: rgba(241, 196, 15, 0.25);
        color: #ffd700;
        border-color: rgba(241, 196, 15, 0.4);
    }

    /* Content Area */
    .content {
        flex: 1;
        overflow-y: auto;
        padding: 14px 16px 20px;
    }

    .content::-webkit-scrollbar { width: 5px; }
    .content::-webkit-scrollbar-track { background: transparent; }
    .content::-webkit-scrollbar-thumb { background: rgba(162,155,254,0.3); border-radius: 10px; }

    /* Rarity Legend */
    .rarity-legend {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 14px;
        padding: 6px 12px;
        border-radius: 10px;
        background: rgba(0,0,0,0.25);
        border: 1px solid rgba(255,255,255,0.05);
    }

    .rarity-dot {
        font-size: 0.72rem;
        color: var(--c);
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .rarity-dot::before {
        content: '';
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--c);
        display: block;
        box-shadow: 0 0 6px var(--c);
    }

    /* Ingredients Grid */
    .items-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(82px, 1fr));
        gap: 10px;
    }

    .item-slot {
        position: relative;
        background: rgba(15, 8, 25, 0.6);
        border: 1.5px solid var(--border-color, rgba(255,255,255,0.08));
        border-radius: 14px;
        padding: 10px 6px 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        box-shadow: var(--glow, none);
        transition: transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s;
        cursor: default;
    }

    .item-slot:not(.empty):hover {
        transform: translateY(-2px) scale(1.05);
    }

    .item-slot.empty {
        opacity: 0.28;
        filter: grayscale(100%);
    }

    .item-icon {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .item-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        background: rgba(8, 4, 15, 0.88);
        border: 1px solid rgba(241, 196, 15, 0.5);
        border-radius: 8px;
        font-size: 0.68rem;
        font-weight: 800;
        color: #f1c40f;
        padding: 1px 5px;
        min-width: 16px;
        text-align: center;
        line-height: 1.3;
        box-shadow: 0 2px 5px rgba(0,0,0,0.5);
    }

    .item-name {
        font-size: 0.68rem;
        font-weight: 600;
        color: #dcdde1;
        text-align: center;
        line-height: 1.2;
        word-break: break-word;
    }

    /* Potions Section */
    .potions-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .empty-potions-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 40px 20px;
        gap: 10px;
        background: rgba(0,0,0,0.25);
        border: 1px dashed rgba(162, 155, 254, 0.25);
        border-radius: 16px;
    }

    .no-potions {
        color: #dcdde1;
        margin: 0;
        font-size: 0.95rem;
        font-weight: 700;
    }

    .no-potions-hint {
        font-size: 0.8rem;
        color: #8395a7;
        max-width: 320px;
        line-height: 1.4;
    }

    .potions-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .potion-card {
        background: linear-gradient(135deg, rgba(26, 14, 46, 0.7), rgba(15, 7, 28, 0.85));
        border: 1.5px solid rgba(162, 155, 254, 0.3);
        border-radius: 16px;
        padding: 12px 14px;
        display: flex;
        align-items: center;
        gap: 14px;
        position: relative;
        transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    }

    .potion-card:hover {
        transform: translateY(-2px);
        border-color: rgba(241, 196, 15, 0.5);
        box-shadow: 0 6px 20px rgba(0,0,0,0.6), 0 0 15px rgba(162, 155, 254, 0.2);
    }

    .potion-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 0 10px rgba(162, 155, 254, 0.6));
        flex-shrink: 0;
    }

    .potion-info {
        flex: 1;
        min-width: 0;
    }

    .potion-name-row {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .potion-name {
        font-weight: 800;
        color: #ffeaa7;
        font-size: 0.95rem;
    }

    .potion-count-pill {
        font-size: 0.75rem;
        font-weight: 800;
        color: #f1c40f;
        background: rgba(241, 196, 15, 0.15);
        border: 1px solid rgba(241, 196, 15, 0.35);
        padding: 1px 6px;
        border-radius: 10px;
    }

    .potion-desc {
        font-size: 0.78rem;
        color: #a4b0be;
        margin-top: 4px;
        line-height: 1.3;
    }

    .use-potion-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        background: linear-gradient(135deg, #2ed573, #10ac84);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 12px;
        color: #042410;
        font-weight: 800;
        font-size: 0.85rem;
        cursor: pointer;
        transition: transform 0.15s, box-shadow 0.15s;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(46, 213, 115, 0.3);
    }

    .use-potion-btn:hover {
        transform: scale(1.06);
        box-shadow: 0 6px 16px rgba(46, 213, 115, 0.5);
    }

    .use-potion-btn:active {
        transform: scale(0.95);
    }

    @media (max-width: 480px) {
        .items-grid {
            grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
            gap: 8px;
        }
        .item-slot {
            padding: 8px 4px 6px;
        }
        .item-icon {
            width: 36px;
            height: 36px;
        }
        .potion-card {
            padding: 10px 12px;
            gap: 10px;
        }
        .potion-icon {
            width: 40px;
            height: 40px;
        }
    }
</style>
