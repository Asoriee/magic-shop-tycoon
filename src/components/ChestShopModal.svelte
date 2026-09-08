<script lang="ts">
    import { onMount, onDestroy, tick } from 'svelte';
    import gsap from 'gsap';
    import { crystals, gameStore, openChest, AVAILABLE_INGREDIENTS, type Ingredient, type ChestType, type Rarity, formatNumber } from '../store';
    import { showRewardedAd, saveGame } from '../yandex-sdk';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void = () => {};

    let overlayEl: HTMLElement;
    let modalEl: HTMLElement;
    let chestEl: SVGElement;
    let lootEl: HTMLElement;
    let cardEls: HTMLElement[] = [];

    // Phase: 'shop' | 'animating' | 'loot'
    let phase: 'shop' | 'animating' | 'loot' = 'shop';
    let droppedItems: Ingredient[] = [];
    let openingChestType: ChestType | null = null;

    let freeCooldownText = '';
    let cooldownTimer: any;

    function updateCooldown() {
        const remaining = Math.max(0, 20 * 60 * 1000 - (Date.now() - ($gameStore.lastFreeChestTime || 0)));
        if (remaining <= 0) {
            freeCooldownText = '';
        } else {
            const totalSec = Math.ceil(remaining / 1000);
            const m = Math.floor(totalSec / 60);
            const s = totalSec % 60;
            freeCooldownText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
    }

    onMount(() => {
        updateCooldown();
        cooldownTimer = setInterval(updateCooldown, 1000);
    });

    onDestroy(() => {
        if (cooldownTimer) clearInterval(cooldownTimer);
    });

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
            desc: '3 ингредиента · Обычные + шанс Редкого',
            costLabel: 'Бесплатно (раз в 20 мин или за Рекламу)',
            crystalCost: 0,
            free: true,
            color: '#8B4513',
            accentColor: '#d4a259',
            items: '3 предмета',
            guarantee: '90% Обычный · 10% Редкий',
            chances: [{ label: '90% Обычные', color: '#b2bec3' }, { label: '10% Редкие', color: '#74b9ff' }]
        },
        {
            type: 'magical' as ChestType,
            name: 'Магический сундук',
            desc: '5 ингредиентов · Гарантирован Эпический',
            costLabel: '30 кристаллов',
            crystalCost: 30,
            free: false,
            color: '#6c5ce7',
            accentColor: '#a29bfe',
            items: '5 предметов',
            guarantee: '1 Эпический · Обычные + Редкие',
            chances: [{ label: '1x Эпик', color: '#a29bfe' }, { label: 'Редкие & Обычные', color: '#74b9ff' }]
        },
        {
            type: 'astral' as ChestType,
            name: 'Астральный сундук',
            desc: '10 ингредиентов · Гарантирован Легендарный',
            costLabel: '100 кристаллов',
            crystalCost: 100,
            free: false,
            color: '#f1c40f',
            accentColor: '#fdcb6e',
            items: '10 предметов',
            guarantee: '1 Легендарный + Смешанные',
            chances: [{ label: '1x Легендарный', color: '#f1c40f' }, { label: 'Эпик & Редкие', color: '#a29bfe' }]
        },
    ];

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
            gsap.to(overlayEl, { opacity: 0, duration: 0.2 });
            gsap.to(modalEl, { y: -30, opacity: 0, scale: 0.95, duration: 0.2, ease: 'power2.in', onComplete: onClose });
        } else {
            onClose();
        }
    }

    async function handleOpen(chest: typeof CHESTS[number]) {
        if (chest.free) {
            const isReady = (Date.now() - ($gameStore.lastFreeChestTime || 0)) >= 20 * 60 * 1000;
            if (isReady) {
                gameStore.recordFreeChest();
                await saveGame();
                triggerOpen(chest.type);
            } else {
                showRewardedAd(async () => {
                    gameStore.recordFreeChest();
                    gameStore.updateQuestProgress('watch_ads', 1);
                    await saveGame();
                    triggerOpen(chest.type);
                }, () => {});
            }
        } else {
            if ($crystals < chest.crystalCost) return;
            crystals.update(n => n - chest.crystalCost);
            await saveGame();
            triggerOpen(chest.type);
        }
    }

    async function triggerOpen(type: ChestType) {
        openingChestType = type;
        droppedItems = openChest(type);
        await saveGame();

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

        // Step 2: burst
        await new Promise<void>(resolve => {
            gsap.to(chestEl, {
                scale: 2.2,
                opacity: 0,
                duration: 0.35,
                ease: 'power3.out',
                onComplete: resolve
            });
        });

        // Step 3: loot cards
        phase = 'loot';
        cardEls = [];
        await tick();

        await new Promise<void>(resolve => {
            gsap.fromTo(cardEls,
                { opacity: 0, scale: 0.5, y: 30 },
                { opacity: 1, scale: 1, y: 0, stagger: 0.08, duration: 0.4, ease: 'back.out(1.5)', onComplete: resolve }
            );
        });
    }

    function collectLoot() {
        phase = 'shop';
        droppedItems = [];
    }

    $: chestConfig = CHESTS.find(c => c.type === openingChestType) ?? CHESTS[0];
</script>

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
    class="overlay" 
    class:embedded={isEmbedded && phase === 'shop'} 
    class:cinematic-overlay={phase !== 'shop'}
    bind:this={overlayEl} 
    on:click={phase === 'shop' ? close : undefined}
>
    <!-- PHASE: SHOP -->
    {#if phase === 'shop'}
    <div class="modal" class:embedded-modal={isEmbedded} bind:this={modalEl} on:click|stopPropagation>
        {#if !isEmbedded}
            <div class="tab-header">
                <div class="tab-title-row">
                    <div class="header-icon">
                        <svg viewBox="0 0 32 28" width="28" height="24">
                            <rect x="2" y="10" width="28" height="18" rx="3" fill="#8B4513"/>
                            <rect x="2" y="10" width="28" height="5" rx="2" fill="#a0522d"/>
                            <rect x="12" y="8" width="8" height="8" rx="2" fill="#f1c40f"/>
                            <rect x="14" y="10" width="4" height="4" rx="1" fill="#d4ac0d"/>
                            <path d="M2 5 Q16 0 30 5 L30 10 L2 10Z" fill="#6B3410"/>
                        </svg>
                    </div>
                    <h2 class="tab-title">Магические Сундуки</h2>
                </div>
                <p class="header-sub">Добывайте редкие ингредиенты и рецепты</p>

                <div class="balance-row">
                    <div class="balance-chip crystal">
                        <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
                            <polygon points="8,1 14,5 11,14 5,14 2,5" fill="#74b9ff" stroke="#0984e3" stroke-width="1.5"/>
                        </svg>
                        <span>{formatNumber($crystals)} кристаллов</span>
                    </div>
                </div>

                <button class="close-btn" on:click={close}>✕</button>
            </div>
        {/if}

        <div class="chest-list">
            {#each CHESTS as chest}
                {@const canAfford = chest.free || $crystals >= chest.crystalCost}
                <div class="chest-card" style="--border: {chest.accentColor}; --glow: {chest.accentColor}40">
                    <div class="chest-visual">
                        <svg viewBox="0 0 70 60" width="70" height="60">
                            <ellipse cx="35" cy="57" rx="22" ry="4" fill="black" opacity="0.3"/>
                            <rect x="8" y="28" width="54" height="28" rx="4" fill={chest.color}/>
                            <path d="M8 28 Q8 10 35 10 Q62 10 62 28Z" fill={chest.color}/>
                            <path d="M8 28 Q8 14 35 14 Q62 14 62 28Z" fill="rgba(0,0,0,0.2)"/>
                            <rect x="8" y="27" width="54" height="5" fill={chest.accentColor} opacity="0.5"/>
                            <rect x="29" y="32" width="12" height="10" rx="2" fill={chest.accentColor}/>
                            <path d="M31 32 Q31 26 35 26 Q39 26 39 32" fill="none" stroke={chest.accentColor} stroke-width="3"/>
                            <rect x="10" y="26" width="6" height="4" rx="1" fill={chest.accentColor} opacity="0.7"/>
                            <rect x="54" y="26" width="6" height="4" rx="1" fill={chest.accentColor} opacity="0.7"/>
                            {#if chest.type !== 'wooden'}
                                <circle cx="15" cy="18" r="2" fill={chest.accentColor} opacity="0.8"/>
                                <circle cx="55" cy="16" r="2.5" fill={chest.accentColor} opacity="0.7"/>
                                <circle cx="35" cy="8" r="3" fill={chest.accentColor} opacity="0.9"/>
                            {/if}
                        </svg>
                    </div>

                    <div class="chest-info">
                        <div class="chest-title-row">
                            <h3 style="color: {chest.accentColor}">{chest.name}</h3>
                            <span class="chest-items-badge">{chest.items}</span>
                        </div>
                        <p>{chest.desc}</p>
                        
                        {#if chest.free && freeCooldownText}
                            <div class="cooldown-pill">
                                <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <circle cx="8" cy="8" r="6"/>
                                    <polyline points="8,4 8,8 11,8"/>
                                </svg>
                                <span>Бесплатно через: {freeCooldownText}</span>
                            </div>
                        {/if}

                        <div class="chances-row">
                            {#each chest.chances as ch}
                                <span class="chance-tag" style="color: {ch.color}; border-color: {ch.color}50; background: {ch.color}15">
                                    {ch.label}
                                </span>
                            {/each}
                        </div>
                    </div>

                    <button
                        type="button"
                        class="open-btn"
                        class:free-ready={chest.free && !freeCooldownText}
                        style="--btn-color: {chest.accentColor}; --btn-glow: {chest.accentColor}60"
                        disabled={!canAfford}
                        on:click={() => handleOpen(chest)}
                    >
                        {#if chest.free}
                            {#if !freeCooldownText}
                                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3,8 7,12 13,4" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <span>Забрать Бесплатно!</span>
                            {:else}
                                <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
                                    <polygon points="4,2 14,8 4,14"/>
                                </svg>
                                <span>Открыть (Реклама)</span>
                            {/if}
                        {:else}
                            <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
                                <polygon points="8,1 14,5 11,14 5,14 2,5" fill="currentColor"/>
                            </svg>
                            <span>{chest.crystalCost} Открыть</span>
                        {/if}
                    </button>
                </div>
            {/each}
        </div>
    </div>
    {/if}

    <!-- PHASE: ANIMATING -->
    {#if phase === 'animating'}
    <div class="anim-stage">
        <p class="anim-label">Открываем {chestConfig.name}…</p>
        <svg bind:this={chestEl} viewBox="0 0 140 120" width="220" height="190"
            style="filter: drop-shadow(0 0 30px {chestConfig.accentColor}); will-change: transform, opacity">
            <ellipse cx="70" cy="115" rx="45" ry="8" fill="black" opacity="0.4"/>
            <rect x="15" y="58" width="110" height="56" rx="6" fill={chestConfig.color}/>
            <path d="M15 58 Q15 18 70 18 Q125 18 125 58Z" fill={chestConfig.color}/>
            <path d="M15 58 Q15 28 70 28 Q125 28 125 58Z" fill="rgba(0,0,0,0.2)"/>
            <rect x="15" y="56" width="110" height="8" fill={chestConfig.accentColor} opacity="0.5"/>
            <rect x="57" y="65" width="26" height="20" rx="4" fill={chestConfig.accentColor}/>
            <path d="M61 65 Q61 50 70 50 Q79 50 79 65" fill="none" stroke={chestConfig.accentColor} stroke-width="6"/>
            <rect x="18" y="54" width="14" height="8" rx="2" fill={chestConfig.accentColor} opacity="0.7"/>
            <rect x="108" y="54" width="14" height="8" rx="2" fill={chestConfig.accentColor} opacity="0.7"/>
            <circle cx="30" cy="35" r="4" fill={chestConfig.accentColor}/>
            <circle cx="110" cy="30" r="5" fill={chestConfig.accentColor}/>
            <circle cx="70" cy="14" r="6" fill={chestConfig.accentColor}/>
        </svg>
    </div>
    {/if}

    <!-- PHASE: LOOT -->
    {#if phase === 'loot'}
    <div class="loot-stage" bind:this={lootEl} on:click|stopPropagation>
        <div class="loot-header">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
                <polygon points="12,2 15,8 21,9 17,14 18,21 12,17 6,21 7,14 3,9 9,8" fill="#f1c40f" stroke="#ffeaa7" stroke-width="1.5"/>
            </svg>
            <h3 class="loot-title">Полученные Ингредиенты!</h3>
        </div>

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

        <button type="button" class="collect-btn" on:click={collectLoot}>
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
                <polyline points="3,8 7,12 13,4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Забрать в инвентарь</span>
        </button>
    </div>
    {/if}
</div>
{/if}

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(8, 5, 18, 0.88);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(8px);
        padding: 16px;
        box-sizing: border-box;
    }

    .embedded {
        position: relative;
        background: transparent;
        backdrop-filter: none;
        padding: 0;
        inset: auto;
        z-index: 1;
        width: 100%;
    }

    .cinematic-overlay {
        position: fixed !important;
        inset: 0 !important;
        background: rgba(8, 5, 18, 0.95) !important;
        backdrop-filter: blur(12px) !important;
        z-index: 1100 !important;
    }

    .modal {
        background: linear-gradient(160deg, #1a0a2e 0%, #150826 40%, #0d041a 100%);
        border: 2px solid rgba(241, 196, 15, 0.35);
        border-radius: 24px;
        box-shadow: 0 0 50px rgba(241, 196, 15, 0.25);
        width: 100%;
        max-width: 580px;
        max-height: 88vh;
        overflow-y: auto;
        color: white;
        padding: 24px;
        box-sizing: border-box;
    }

    .embedded-modal {
        box-shadow: none;
        border: none;
        border-radius: 0;
        width: 100%;
        max-width: none;
        max-height: none;
        background: transparent;
        padding: 0;
    }

    .chest-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        box-sizing: border-box;
    }

    .chest-card {
        display: grid;
        grid-template-columns: 80px 1fr auto;
        align-items: center;
        gap: 14px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%);
        border: 1.5px solid var(--border, rgba(255, 255, 255, 0.1));
        border-radius: 16px;
        padding: 12px 16px;
        box-shadow: 0 4px 16px var(--glow, transparent);
        transition: transform 0.2s, border-color 0.2s;
        box-sizing: border-box;
    }

    .chest-card:hover {
        transform: translateY(-1px);
        border-color: rgba(241, 196, 15, 0.6);
    }

    .chest-visual {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .chest-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
    }

    .chest-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .chest-info h3 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
        text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    }

    .chest-items-badge {
        background: rgba(255, 255, 255, 0.1);
        padding: 1px 6px;
        border-radius: 8px;
        font-size: 0.72rem;
        color: rgba(255, 255, 255, 0.75);
    }

    .chest-info p {
        margin: 0;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.65);
    }

    .chances-row {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 2px;
    }

    .chance-tag {
        font-size: 0.7rem;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 6px;
        border: 1px solid;
    }

    .open-btn {
        padding: 10px 14px;
        background: rgba(255, 255, 255, 0.08);
        border: 1.5px solid var(--btn-color, #fff);
        border-radius: 12px;
        color: var(--btn-color, #fff);
        font-size: 0.82rem;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
    }

    .open-btn:hover:not(:disabled) {
        background: var(--btn-color, #fff);
        color: #1e1035;
        box-shadow: 0 0 16px var(--btn-glow, transparent);
        transform: scale(1.03);
    }

    .open-btn:disabled {
        opacity: 0.35;
        cursor: not-allowed;
    }

    .open-btn.free-ready {
        background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%) !important;
        border-color: #2ecc71 !important;
        color: #ffffff !important;
        box-shadow: 0 0 16px rgba(46, 204, 113, 0.6) !important;
        animation: freePulse 1.6s infinite ease-in-out;
    }

    @keyframes freePulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.04); }
    }

    .cooldown-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: rgba(241, 196, 15, 0.12);
        border: 1px solid rgba(241, 196, 15, 0.35);
        border-radius: 8px;
        padding: 2px 8px;
        font-size: 0.74rem;
        font-weight: 700;
        color: #ffeaa7;
        width: fit-content;
        margin: 2px 0 4px 0;
    }

    /* Animation stage */
    .anim-stage {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
    }

    .anim-label {
        color: #ffeaa7;
        font-size: 1.2rem;
        font-weight: 700;
        margin: 0;
        text-shadow: 0 0 10px rgba(241, 196, 15, 0.5);
    }

    /* Loot stage */
    .loot-stage {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 18px;
        padding: 24px;
        max-height: 90vh;
        overflow-y: auto;
        width: 100%;
        max-width: 600px;
        box-sizing: border-box;
    }

    .loot-header {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .loot-title {
        margin: 0;
        font-size: 1.6rem;
        color: #f1c40f;
        text-shadow: 0 0 16px rgba(241, 196, 15, 0.5);
        text-align: center;
    }

    .loot-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));
        gap: 10px;
        width: 100%;
    }

    .loot-card {
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid var(--border, rgba(255, 255, 255, 0.15));
        border-radius: 14px;
        padding: 10px 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        box-shadow: var(--glow, none);
    }

    .loot-icon {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .loot-icon :global(svg) {
        width: 40px;
        height: 40px;
    }

    .loot-name {
        font-size: 0.72rem;
        color: rgba(255, 255, 255, 0.85);
        text-align: center;
        font-weight: bold;
        line-height: 1.2;
    }

    .loot-rarity {
        font-size: 0.65rem;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .collect-btn {
        padding: 12px 32px;
        background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
        border: none;
        border-radius: 14px;
        color: #0c241d;
        font-size: 1.05rem;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 16px rgba(0, 184, 148, 0.4);
        transition: transform 0.15s, box-shadow 0.2s;
    }

    .collect-btn:hover {
        transform: scale(1.04);
        box-shadow: 0 6px 24px rgba(0, 184, 148, 0.6);
    }

    @media (max-width: 600px) {
        .chest-card {
            grid-template-columns: 60px 1fr;
            grid-template-rows: auto auto;
            gap: 10px;
            padding: 10px;
        }

        .open-btn {
            grid-column: 1 / -1;
            justify-content: center;
        }
    }
</style>
