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

    const RARITY_COLORS: Record<Rarity, string> = {
        common:    '#b2bec3',
        rare:      '#74b9ff',
        epic:      '#a29bfe',
        legendary: '#f1c40f',
    };

    const RARITY_GLOW: Record<Rarity, string> = {
        common:    '0 0 6px rgba(178,190,195,0.4)',
        rare:      '0 0 10px rgba(116,185,255,0.6)',
        epic:      '0 0 14px rgba(162,155,254,0.7)',
        legendary: '0 0 18px rgba(241,196,15,0.8)',
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

    function handleUsePotion(potionId: string) {
        if (($potionsCount[potionId] ?? 0) > 0) {
            gameStore.usePotion(potionId);
            saveGame();
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

        <!-- Header -->
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

        <!-- Tabs -->
        <div class="tabs">
            <button
                class="tab"
                class:active={activeTab === 'ingredients'}
                on:click={() => activeTab = 'ingredients'}
            >
                🧪 Ингредиенты
            </button>
            <button
                class="tab"
                class:active={activeTab === 'potions'}
                on:click={() => activeTab = 'potions'}
            >
                ⚗️ Зелья
            </button>
        </div>

        <!-- Content -->
        <div class="content">
            {#if activeTab === 'ingredients'}
                <div class="rarity-legend">
                    {#each Object.entries(RARITY_LABELS) as [rarity, label]}
                        <span class="rarity-dot" style="--c: {RARITY_COLORS[rarity as Rarity]}">{label}</span>
                    {/each}
                </div>

                <div class="items-grid">
                    {#each sortedIngredients as ing (ing.id)}
                        <div
                            class="item-slot"
                            class:empty={ing.count === 0}
                            style="
                                --border-color: {ing.count > 0 ? RARITY_COLORS[ing.rarity] : 'rgba(255,255,255,0.08)'};
                                --glow: {ing.count > 0 ? RARITY_GLOW[ing.rarity] : 'none'};
                            "
                            title="{ing.name} ({RARITY_LABELS[ing.rarity]}){ing.count > 0 ? ` — ${ing.count} шт.` : ' — нет'}"
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
                <!-- Potions tab -->
                <div class="potions-section">
                    {#if ownedPotions.length === 0}
                        <p class="no-potions">У вас пока нет сваренных зелий.</p>
                    {:else}
                        <div class="potions-grid">
                            {#each ownedPotions as potion (potion.id)}
                                <div class="potion-card">
                                    <div class="potion-icon">{@html potion.icon}</div>
                                    <div class="potion-info">
                                        <div class="potion-name">{potion.name}</div>
                                        <div class="potion-desc">{potion.description}</div>
                                    </div>
                                    <div class="potion-badge">{$potionsCount[potion.id]}</div>
                                    <button class="use-potion-btn" on:click={() => handleUsePotion(potion.id)}>
                                        Использовать
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
        background: linear-gradient(160deg, #0f0820, #1a0f2e);
        border: 1.5px solid rgba(162, 155, 254, 0.25);
        border-radius: 22px;
        box-shadow: 0 0 50px rgba(108, 92, 231, 0.25), 0 20px 50px rgba(0,0,0,0.7);
        width: 94%;
        max-width: 520px;
        max-height: 88vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: white;
    }

    .embedded {
        position: relative;
        background: transparent;
        backdrop-filter: none;
        z-index: 1;
        padding: 0;
        inset: auto;
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
        width: 30px;
        height: 30px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: background 0.2s;
        flex-shrink: 0;
    }
    .close-btn:hover { background: rgba(255,255,255,0.15); }

    /* Tabs */
    .tabs {
        display: flex;
        padding: 10px 16px 0;
        gap: 6px;
        flex-shrink: 0;
    }

    .tab {
        flex: 1;
        padding: 8px 12px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 10px 10px 0 0;
        color: rgba(255,255,255,0.5);
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.2s;
    }

    .tab.active {
        background: rgba(162, 155, 254, 0.15);
        border-color: rgba(162, 155, 254, 0.4);
        color: #a29bfe;
        font-weight: bold;
    }

    /* Content */
    .content {
        flex: 1;
        overflow-y: auto;
        padding: 14px 16px 20px;
    }

    .content::-webkit-scrollbar { width: 5px; }
    .content::-webkit-scrollbar-track { background: transparent; }
    .content::-webkit-scrollbar-thumb { background: rgba(162,155,254,0.3); border-radius: 10px; }

    /* Rarity legend */
    .rarity-legend {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 12px;
    }

    .rarity-dot {
        font-size: 0.68rem;
        color: var(--c);
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .rarity-dot::before {
        content: '';
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--c);
        display: block;
        box-shadow: 0 0 5px var(--c);
    }

    /* Grid */
    .items-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 10px;
    }

    .item-slot {
        position: relative;
        background: rgba(255,255,255,0.04);
        border: 1.5px solid var(--border-color, rgba(255,255,255,0.08));
        border-radius: 12px;
        padding: 8px 6px 6px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        box-shadow: var(--glow, none);
        transition: transform 0.15s, box-shadow 0.2s;
        cursor: default;
    }

    .item-slot:not(.empty):hover {
        transform: scale(1.06);
    }

    .item-slot.empty {
        opacity: 0.3;
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
        background: rgba(0,0,0,0.75);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 8px;
        font-size: 0.65rem;
        font-weight: bold;
        color: #f1c40f;
        padding: 1px 4px;
        min-width: 16px;
        text-align: center;
        line-height: 1.4;
    }

    .item-name {
        font-size: 0.6rem;
        color: rgba(255,255,255,0.55);
        text-align: center;
        line-height: 1.2;
        word-break: break-word;
    }

    .potions-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .no-potions {
        color: rgba(255,255,255,0.4);
        text-align: center;
        margin-top: 20px;
        font-size: 0.9rem;
    }

    .potions-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .potion-card {
        background: rgba(255,255,255,0.04);
        border: 1.5px solid rgba(162, 155, 254, 0.3);
        border-radius: 16px;
        padding: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .potion-card:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 15px rgba(162, 155, 254, 0.15);
    }

    .potion-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 0 8px rgba(162, 155, 254, 0.5));
    }

    .potion-info {
        flex: 1;
    }

    .potion-name {
        font-weight: bold;
        color: #a29bfe;
        font-size: 0.95rem;
    }

    .potion-desc {
        font-size: 0.75rem;
        color: rgba(255,255,255,0.6);
        margin-top: 4px;
    }

    .potion-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #6c5ce7;
        color: white;
        font-weight: bold;
        font-size: 0.7rem;
        padding: 4px 8px;
        border-radius: 12px;
        border: 2px solid #1a0f2e;
    }

    .use-potion-btn {
        padding: 8px 16px;
        background: linear-gradient(135deg, #a29bfe, #6c5ce7);
        border: none;
        border-radius: 10px;
        color: white;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.15s, box-shadow 0.15s;
    }

    .use-potion-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(108, 92, 231, 0.4);
    }

    .use-potion-btn:active {
        transform: scale(0.95);
    }
</style>
