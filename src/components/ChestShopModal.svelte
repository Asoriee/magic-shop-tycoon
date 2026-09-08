<script lang="ts">
    import { tick } from 'svelte';
    import gsap from 'gsap';
    import { crystals, gameStore, openChest, unlockRandomRecipe, AVAILABLE_INGREDIENTS, type Ingredient, type ChestType, type Rarity } from '../store';
    import { showRewardedAd, saveGame } from '../yandex-sdk';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void;

    let overlayEl: HTMLElement;
    let modalEl: HTMLElement;
    let chestEl: SVGElement;
    let lootEl: HTMLElement;
    let cardEls: HTMLElement[] = [];

    // Phase: 'shop' | 'animating' | 'loot'
    let phase: 'shop' | 'animating' | 'loot' = 'shop';
    let droppedItems: Ingredient[] = [];
    let openingChestType: ChestType | null = null;

    const RARITY_COLORS: Record<Rarity, string> = {
        common:    '#b2bec3',
        rare:      '#74b9ff',
        epic:      '#a29bfe',
        legendary: '#f1c40f',
    };
    const RARITY_GLOW: Record<Rarity, string> = {
        common:    '0 0 8px rgba(178,190,195,0.4)',
        rare:      '0 0 14px rgba(116,185,255,0.7)',
        epic:      '0 0 18px rgba(162,155,254,0.8)',
        legendary: '0 0 24px rgba(241,196,15,1)',
    };
    const RARITY_LABELS: Record<Rarity, string> = {
        common:    'Обычный',
        rare:      'Редкий',
        epic:      'Эпический',
        legendary: 'Легендарный',
    };

    const CHESTS = [
        {
            type: 'wooden' as ChestType,
            name: 'Деревянный сундук',
            desc: '3 предмета · Обычные + шанс Редкого',
            costLabel: 'Реклама / Бесплатно',
            crystalCost: 0,
            free: true,
            color: '#8B4513',
            accentColor: '#d4a259',
            items: '3 предмета',
            guarantee: '90% Обычный · 10% Редкий',
        },
        {
            type: 'magical' as ChestType,
            name: 'Магический сундук',
            desc: '5 предметов · Гарантирован Эпический',
            costLabel: '30 кристаллов',
            crystalCost: 30,
            free: false,
            color: '#6c5ce7',
            accentColor: '#a29bfe',
            items: '5 предметов',
            guarantee: '1 Эпический · Обычные + Редкие',
        },
        {
            type: 'astral' as ChestType,
            name: 'Астральный сундук',
            desc: '10 предметов · Гарантирован Легендарный',
            costLabel: '100 кристаллов',
            crystalCost: 100,
            free: false,
            color: '#f1c40f',
            accentColor: '#fdcb6e',
            items: '10 предметов',
            guarantee: '1 Легендарный + Смешанные',
        },
    ];

    // Scroll purchase removed

    $: if (isOpen) {
        tick().then(() => {
            if (overlayEl && modalEl && !isEmbedded) {
                gsap.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.3 });
                gsap.fromTo(modalEl, { y: -50, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.2)' });
            }
        });
    }

    function close() {
        if (overlayEl && modalEl && !isEmbedded) {
            gsap.to(overlayEl, { opacity: 0, duration: 0.3 });
            gsap.to(modalEl, { y: -50, opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.in', onComplete: onClose });
        } else {
            onClose();
        }
    }

    async function handleOpen(chest: typeof CHESTS[number]) {
        if (chest.free) {
            // Wooden chest — rewarded ad
            showRewardedAd(() => {
                triggerOpen(chest.type);
            }, () => {});
        } else {
            if (get($crystals) < chest.crystalCost) return;
            crystals.update(n => n - chest.crystalCost);
            await saveGame();
            triggerOpen(chest.type);
        }
    }

    // Helper to read reactive $crystals synchronously in handler
    function get<T>(val: T): T { return val; }

    async function triggerOpen(type: ChestType) {
        openingChestType = type;
        droppedItems = openChest(type);
        await saveGame();

        // Hide shop, show chest
        phase = 'animating';
        await tick();

        // Step 1: shake chest
        await new Promise<void>(resolve => {
            gsap.to(chestEl, {
                keyframes: [
                    { rotation: -12, duration: 0.08 },
                    { rotation:  12, duration: 0.08 },
                    { rotation: -10, duration: 0.08 },
                    { rotation:  10, duration: 0.08 },
                    { rotation:  -8, duration: 0.07 },
                    { rotation:   8, duration: 0.07 },
                    { rotation:   0, duration: 0.06 },
                ],
                scale: 1.12,
                transformOrigin: 'center bottom',
                onComplete: resolve
            });
        });

        // Step 2: burst — flash + scale up + fade
        await new Promise<void>(resolve => {
            gsap.to(chestEl, {
                scale: 2.2,
                opacity: 0,
                duration: 0.35,
                ease: 'power3.out',
                onComplete: resolve
            });
        });

        // Step 3: show loot cards
        phase = 'loot';
        cardEls = [];
        await tick();

        await new Promise<void>(resolve => {
            gsap.from(cardEls, {
                y: 80,
                opacity: 0,
                scale: 0.4,
                rotation: () => Math.random() * 20 - 10,
                stagger: 0.08,
                duration: 0.5,
                ease: 'back.out(1.5)',
                onComplete: resolve
            });
        });
    }

    function collectLoot() {
        phase = 'shop';
        openingChestType = null;
        close();
    }

    // Current chest color for animation phase
    $: chestConfig = CHESTS.find(c => c.type === openingChestType) ?? CHESTS[0];
</script>

{#if isOpen}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="overlay" class:embedded={isEmbedded} bind:this={overlayEl} on:click={phase === 'shop' ? close : undefined}>

    <!-- ═══ PHASE: SHOP ═══ -->
    {#if phase === 'shop'}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal" class:embedded-modal={isEmbedded} bind:this={modalEl} on:click|stopPropagation>

        <div class="modal-header">
            <div class="header-icon">
                <svg viewBox="0 0 32 28" width="28" height="24">
                    <rect x="2" y="10" width="28" height="18" rx="3" fill="#8B4513"/>
                    <rect x="2" y="10" width="28" height="5" rx="2" fill="#a0522d"/>
                    <rect x="12" y="8" width="8" height="8" rx="2" fill="#f1c40f"/>
                    <rect x="14" y="10" width="4" height="4" rx="1" fill="#d4ac0d"/>
                    <path d="M2 5 Q16 0 30 5 L30 10 L2 10Z" fill="#6B3410"/>
                </svg>
            </div>
            <div class="header-text">
                <h2>Магические Сундуки</h2>
                <p class="header-sub">Добывайте редкие ингредиенты</p>
            </div>
            <button class="close-btn" on:click={close}>✕</button>
        </div>

        <div class="balance-row">
            <div class="balance-chip crystal">
                <span>💎 {$crystals} кристаллов</span>
            </div>
        </div>

        <div class="chest-list">
            {#each CHESTS as chest}
                {@const canAfford = chest.free || $crystals >= chest.crystalCost}
                <div class="chest-card" style="--border: {chest.accentColor}; --glow: {chest.accentColor}40">
                    <!-- SVG Chest Illustration -->
                    <div class="chest-visual">
                        <svg viewBox="0 0 70 60" width="70" height="60">
                            <!-- Shadow -->
                            <ellipse cx="35" cy="57" rx="22" ry="4" fill="black" opacity="0.3"/>
                            <!-- Body -->
                            <rect x="8" y="28" width="54" height="28" rx="4" fill={chest.color}/>
                            <!-- Lid -->
                            <path d="M8 28 Q8 10 35 10 Q62 10 62 28Z" fill={chest.color}/>
                            <path d="M8 28 Q8 14 35 14 Q62 14 62 28Z" fill="rgba(0,0,0,0.2)"/>
                            <!-- Stripe/Highlight -->
                            <rect x="8" y="27" width="54" height="5" fill={chest.accentColor} opacity="0.5"/>
                            <!-- Lock -->
                            <rect x="29" y="32" width="12" height="10" rx="2" fill={chest.accentColor}/>
                            <path d="M31 32 Q31 26 35 26 Q39 26 39 32" fill="none" stroke={chest.accentColor} stroke-width="3"/>
                            <!-- Hinges -->
                            <rect x="10" y="26" width="6" height="4" rx="1" fill={chest.accentColor} opacity="0.7"/>
                            <rect x="54" y="26" width="6" height="4" rx="1" fill={chest.accentColor} opacity="0.7"/>
                            <!-- Sparkles for rare+ -->
                            {#if chest.type !== 'wooden'}
                                <circle cx="15" cy="18" r="2" fill={chest.accentColor} opacity="0.8"/>
                                <circle cx="55" cy="16" r="2.5" fill={chest.accentColor} opacity="0.7"/>
                                <circle cx="35" cy="8" r="3" fill={chest.accentColor} opacity="0.9"/>
                            {/if}
                        </svg>
                    </div>

                    <div class="chest-info">
                        <h3 style="color: {chest.accentColor}">{chest.name}</h3>
                        <p>{chest.desc}</p>
                        <div class="chest-guarantee">{chest.guarantee}</div>
                    </div>

                    <button
                        class="open-btn"
                        style="--btn-color: {chest.accentColor}; --btn-glow: {chest.accentColor}60"
                        disabled={!canAfford}
                        on:click={() => handleOpen(chest)}
                    >
                        {#if chest.free}
                            📺 Реклама
                        {:else}
                            <svg viewBox="0 0 16 16" width="12" height="12" style="flex-shrink:0"><polygon points="8,1 10.5,5.5 15.5,6.2 12,9.5 12.8,14.5 8,12 3.2,14.5 4,9.5 0.5,6.2 5.5,5.5" fill="currentColor"/></svg>
                            {chest.crystalCost} Открыть
                        {/if}
                    </button>
                </div>
            {/each}
        </div>



    </div>
    {/if}


    <!-- ═══ PHASE: ANIMATING — chest on screen ═══ -->
    {#if phase === 'animating'}
    <div class="anim-stage">
        <p class="anim-label">Открываем {chestConfig.name}…</p>
        <svg bind:this={chestEl} viewBox="0 0 140 120" width="220" height="190"
            style="filter: drop-shadow(0 0 30px {chestConfig.accentColor}); will-change: transform, opacity">
            <!-- Shadow -->
            <ellipse cx="70" cy="115" rx="45" ry="8" fill="black" opacity="0.4"/>
            <!-- Body -->
            <rect x="15" y="58" width="110" height="56" rx="6" fill={chestConfig.color}/>
            <!-- Lid -->
            <path d="M15 58 Q15 18 70 18 Q125 18 125 58Z" fill={chestConfig.color}/>
            <path d="M15 58 Q15 28 70 28 Q125 28 125 58Z" fill="rgba(0,0,0,0.2)"/>
            <!-- Stripe -->
            <rect x="15" y="56" width="110" height="8" fill={chestConfig.accentColor} opacity="0.5"/>
            <!-- Lock -->
            <rect x="57" y="65" width="26" height="20" rx="4" fill={chestConfig.accentColor}/>
            <path d="M61 65 Q61 50 70 50 Q79 50 79 65" fill="none" stroke={chestConfig.accentColor} stroke-width="6"/>
            <!-- Hinges -->
            <rect x="18" y="54" width="14" height="8" rx="2" fill={chestConfig.accentColor} opacity="0.7"/>
            <rect x="108" y="54" width="14" height="8" rx="2" fill={chestConfig.accentColor} opacity="0.7"/>
            <!-- Sparkles -->
            <circle cx="30" cy="35" r="4" fill={chestConfig.accentColor}/>
            <circle cx="110" cy="30" r="5" fill={chestConfig.accentColor}/>
            <circle cx="70" cy="14" r="6" fill={chestConfig.accentColor}/>
        </svg>
    </div>
    {/if}

    <!-- ═══ PHASE: LOOT — fanned ingredient cards ═══ -->
    {#if phase === 'loot'}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="loot-stage" bind:this={lootEl} on:click|stopPropagation>
        <h3 class="loot-title">✨ Вы получили!</h3>
        <div class="loot-grid">
            {#each droppedItems as item, i (i)}
                <div
                    class="loot-card"
                    bind:this={cardEls[i]}
                    style="
                        --border: {RARITY_COLORS[item.rarity]};
                        --glow: {RARITY_GLOW[item.rarity]};
                    "
                >
                    <div class="loot-icon">{@html item.icon}</div>
                    <div class="loot-name">{item.name}</div>
                    <div class="loot-rarity" style="color: {RARITY_COLORS[item.rarity]}">{RARITY_LABELS[item.rarity]}</div>
                </div>
            {/each}
        </div>
        <button class="collect-btn" on:click={collectLoot}>
            🎒 Забрать всё
        </button>
    </div>
    {/if}

</div>
{/if}

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.88);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 210;
        backdrop-filter: blur(10px);
    }

    /* ── SHOP MODAL ── */
    .modal {
        background: linear-gradient(155deg, #12071f, #1e0c38);
        border: 1.5px solid rgba(241, 196, 15, 0.2);
        border-radius: 22px;
        box-shadow: 0 0 60px rgba(241, 196, 15, 0.15), 0 20px 60px rgba(0,0,0,0.7);
        width: 94%;
        max-width: 480px;
        max-height: 90vh;
        overflow-y: auto;
        color: white;
        padding: 0 0 20px;
    }

    .modal::-webkit-scrollbar { width: 4px; }
    .modal::-webkit-scrollbar-thumb { background: rgba(241,196,15,0.2); border-radius: 10px; }

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

    /* Chest cards */
    .chest-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 8px 16px 0;
    }

    .chest-card {
        display: grid;
        grid-template-columns: 80px 1fr auto;
        align-items: center;
        gap: 12px;
        background: rgba(255,255,255,0.04);
        border: 1.5px solid var(--border, rgba(255,255,255,0.1));
        border-radius: 16px;
        padding: 14px;
        transition: box-shadow 0.3s;
    }
    .chest-card:hover {
        box-shadow: 0 0 20px var(--glow, transparent);
    }

    .chest-visual {
        display: flex;
        justify-content: center;
        align-items: center;
        filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));
    }

    .chest-info { min-width: 0; }

    .chest-info h3 {
        margin: 0 0 4px;
        font-size: 0.95rem;
    }

    .chest-info p {
        margin: 0 0 4px;
        font-size: 0.75rem;
        color: rgba(255,255,255,0.5);
    }

    .chest-guarantee {
        font-size: 0.68rem;
        color: rgba(255,255,255,0.35);
    }

    .open-btn {
        padding: 9px 13px;
        background: rgba(255,255,255,0.06);
        border: 1.5px solid var(--btn-color, #fff);
        border-radius: 10px;
        color: var(--btn-color, #fff);
        font-size: 0.8rem;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.2s, box-shadow 0.2s;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 5px;
    }
    .open-btn:hover:not(:disabled) {
        background: rgba(255,255,255,0.12);
        box-shadow: 0 0 16px var(--btn-glow, transparent);
    }
    .open-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    /* ── ANIMATION STAGE ── */
    .anim-stage {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 24px;
    }

    .anim-label {
        color: rgba(255,255,255,0.6);
        font-size: 1rem;
        margin: 0;
    }

    /* ── LOOT STAGE ── */
    .loot-stage {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        padding: 20px;
        max-height: 90vh;
        overflow-y: auto;
        width: 100%;
        max-width: 560px;
    }

    .loot-title {
        margin: 0;
        font-size: 1.5rem;
        background: linear-gradient(90deg, #f1c40f, #fd79a8, #a29bfe);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-align: center;
    }

    .loot-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 12px;
        width: 100%;
    }

    .loot-card {
        background: rgba(255,255,255,0.05);
        border: 2px solid var(--border, rgba(255,255,255,0.15));
        border-radius: 14px;
        padding: 12px 8px 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        box-shadow: var(--glow, none);
        will-change: transform, opacity;
    }

    .loot-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .loot-name {
        font-size: 0.68rem;
        color: rgba(255,255,255,0.7);
        text-align: center;
        font-weight: bold;
        line-height: 1.2;
    }

    .loot-rarity {
        font-size: 0.6rem;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .collect-btn {
        padding: 13px 36px;
        background: linear-gradient(135deg, #6c5ce7, #a29bfe);
        border: none;
        border-radius: 14px;
        color: white;
        font-size: 1.05rem;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(108, 92, 231, 0.5);
        transition: transform 0.15s, box-shadow 0.2s;
    }
    .collect-btn:hover {
        transform: scale(1.04);
        box-shadow: 0 8px 28px rgba(108, 92, 231, 0.7);
    }
    .collect-btn:active { transform: scale(0.97); }


</style>

