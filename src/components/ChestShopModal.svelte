<script lang="ts">
    import { onMount, onDestroy, tick } from 'svelte';
    import gsap from 'gsap';
    import { 
        crystals, 
        gameStore, 
        stableIdleIncome,
        openChest, 
        type ChestType, 
        type ChestDropItem,
        type ChestResult,
        type Rarity, 
        formatNumber 
    } from '../store';
    import { showRewardedAd, saveGame } from '../yandex-sdk';
    import { playSuccessSound, playLevelUpSound } from '../audio';
    import ResourceIcon from './ResourceIcon.svelte';
    import { t, currentLang, getIngredientName, getPotionName, getPetName } from '../i18n';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void = () => {};

    let overlayEl: HTMLElement;
    let modalEl: HTMLElement;
    let chestEl: SVGElement;
    let lootEl: HTMLElement;
    let cardEls: HTMLElement[] = [];

    // Multi-open toggle: 1 or 5 chests
    let openMultiplier: 1 | 5 = 1;

    // Phase: 'shop' | 'animating' | 'loot'
    let phase: 'shop' | 'animating' | 'loot' = 'shop';
    let currentResult: ChestResult | null = null;
    let droppedItems: ChestDropItem[] = [];
    let openingChestType: ChestType | null = null;

    let freeCooldownText = '';
    let cooldownTimer: any;

    function updateCooldown() {
        const remaining = Math.max(0, 10 * 60 * 1000 - (Date.now() - ($gameStore.lastFreeChestTime || 0)));
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
    $: RARITY_LABELS = {
        common:    $t('rarity.common'),
        rare:      $t('rarity.rare'),
        epic:      $t('rarity.epic'),
        legendary: $t('rarity.legendary'),
    };

    interface ChestConfig {
        type: ChestType;
        name: string;
        desc: string;
        crystalCost: number;
        free?: boolean;
        canBuyWithGold?: boolean;
        color: string;
        accentColor: string;
        items: string;
        resonance: number;
        chances: { label: string; color: string }[];
    }

    $: CHESTS = [
        {
            type: 'wooden' as ChestType,
            name: $t('chests.wooden'),
            desc: $t('chests.itemsCount', { count: 3 }) + ' · ' + $t('common.gold'),
            crystalCost: 0,
            free: true,
            color: '#8B4513',
            accentColor: '#d4a259',
            items: $t('chests.itemsCount', { count: 3 }),
            resonance: 5,
            chances: [
                { label: `85% ${$t('rarity.common')}`, color: '#b2bec3' },
                { label: `15% ${$t('rarity.rare')}`, color: '#74b9ff' },
                { label: `30% ${$t('common.gold')}`, color: '#ffeaa7' }
            ]
        },
        {
            type: 'alchemist' as ChestType,
            name: $t('chests.alchemist'),
            desc: `2x ${$t('inventory.potionsTab')} + 3x ${$t('inventory.ingredientsTab')}`,
            crystalCost: 15,
            canBuyWithGold: true,
            color: '#00b894',
            accentColor: '#55efc4',
            items: $t('chests.itemsCount', { count: 5 }),
            resonance: 10,
            chances: [
                { label: `2x ${$t('inventory.potionsTab')}`, color: '#55efc4' },
                { label: `1x ${$t('rarity.rare')}`, color: '#74b9ff' },
                { label: `40% ${$t('common.gold')}`, color: '#ffeaa7' }
            ]
        },
        {
            type: 'magical' as ChestType,
            name: $t('chests.magical'),
            desc: `5x ${$t('inventory.ingredientsTab')} + 1x ${$t('inventory.potionsTab')}`,
            crystalCost: 25,
            color: '#6c5ce7',
            accentColor: '#a29bfe',
            items: $t('chests.itemsCount', { count: 6 }),
            resonance: 15,
            chances: [
                { label: `1x ${$t('rarity.epic')}`, color: '#a29bfe' },
                { label: `1x ${$t('inventory.potionsTab')}`, color: '#74b9ff' },
                { label: `50% ${$t('common.gold')}`, color: '#ffeaa7' },
                { label: `20% ${$t('common.crystals')}`, color: '#00cec9' }
            ]
        },
        {
            type: 'astral' as ChestType,
            name: $t('chests.astral'),
            desc: `10x ${$t('inventory.ingredientsTab')} + 1x ${$t('inventory.potionsTab')}`,
            crystalCost: 65,
            color: '#0984e3',
            accentColor: '#74b9ff',
            items: $t('chests.itemsCount', { count: 11 }),
            resonance: 30,
            chances: [
                { label: `1x ${$t('rarity.legendary')}`, color: '#f1c40f' },
                { label: `3x ${$t('rarity.epic')}`, color: '#a29bfe' },
                { label: `1x ${$t('inventory.potionsTab')}`, color: '#74b9ff' },
                { label: `70% ${$t('common.gold')}`, color: '#ffeaa7' },
                { label: `35% ${$t('common.crystals')}`, color: '#00cec9' }
            ]
        },
        {
            type: 'titan' as ChestType,
            name: $t('chests.titan'),
            desc: `16x ${$t('inventory.ingredientsTab')} + 2x ${$t('inventory.potionsTab')}`,
            crystalCost: 140,
            color: '#c0392b',
            accentColor: '#f1c40f',
            items: $t('chests.itemsCount', { count: '19+' }),
            resonance: 60,
            chances: [
                { label: `2x ${$t('rarity.legendary')}`, color: '#f1c40f' },
                { label: `5x ${$t('rarity.epic')}`, color: '#a29bfe' },
                { label: `2x ${$t('inventory.potionsTab')}`, color: '#ff7675' },
                { label: `100% ${$t('common.gold')}`, color: '#ffeaa7' },
                { label: `100% ${$t('common.crystals')}`, color: '#00cec9' },
                { label: `15% ${$t('familiars.title')}`, color: '#e056fd' }
            ]
        }
    ];

    function getChestCost(chest: ChestConfig, mult: 1 | 5): number {
        if (chest.free) return 0;
        if (mult === 1) return chest.crystalCost;
        return Math.floor(chest.crystalCost * 5 * 0.95); // 5% скидка на опт
    }

    function getChestGoldCost(mult: 1 | 5): number {
        const base = Math.max(5000, Math.round(($stableIdleIncome || 0) * 300));
        if (mult === 1) return base;
        return Math.floor(base * 5 * 0.95); // 5% скидка на опт
    }

    $: alchemistGoldCost = getChestGoldCost(openMultiplier);

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

    async function handleOpen(chest: ChestConfig, payWithGold = false) {
        const mult = chest.free ? 1 : openMultiplier;

        if (chest.free) {
            const isReady = (Date.now() - ($gameStore.lastFreeChestTime || 0)) >= 10 * 60 * 1000;
            if (isReady) {
                gameStore.recordFreeChest();
                await saveGame();
                await triggerOpen(chest.type, 1);
            } else {
                showRewardedAd(async () => {
                    gameStore.recordFreeChest();
                    gameStore.updateQuestProgress('watch_ads', 1);
                    await saveGame();
                    await triggerOpen(chest.type, 1);
                }, () => {});
            }
        } else if (payWithGold) {
            const cost = getChestGoldCost(mult);
            if ($gameStore.gold < cost) return;
            gameStore.update(s => ({ ...s, gold: s.gold - cost }));
            await saveGame();
            await triggerOpen(chest.type, mult);
        } else {
            const cost = getChestCost(chest, mult);
            if ($crystals < cost) return;
            crystals.update(n => n - cost);
            await saveGame();
            await triggerOpen(chest.type, mult);
        }
    }

    async function triggerOpen(type: ChestType, count: number) {
        openingChestType = type;
        currentResult = openChest(type, count);
        droppedItems = currentResult.drops;
        await saveGame();

        phase = 'animating';
        await tick();

        // Step 1: shake chest
        await new Promise<void>(resolve => {
            if (chestEl) {
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
                    scale: 1.15,
                    transformOrigin: 'center bottom',
                    onComplete: resolve
                });
            } else {
                resolve();
            }
        });

        // Step 2: burst
        await new Promise<void>(resolve => {
            if (chestEl) {
                gsap.to(chestEl, {
                    scale: 2.2,
                    opacity: 0,
                    duration: 0.35,
                    ease: 'power3.out',
                    onComplete: resolve
                });
            } else {
                resolve();
            }
        });

        // Step 3: loot cards
        phase = 'loot';
        cardEls = [];
        if (openingChestType === 'astral' || openingChestType === 'titan') {
            playLevelUpSound();
        } else {
            playSuccessSound();
        }
        await tick();

        await new Promise<void>(resolve => {
            if (cardEls && cardEls.length > 0) {
                gsap.fromTo(cardEls,
                    { opacity: 0, scale: 0.6, y: 25 },
                    { opacity: 1, scale: 1, y: 0, stagger: 0.04, duration: 0.35, ease: 'back.out(1.4)', onComplete: resolve }
                );
            } else {
                resolve();
            }
        });
    }

    function collectLoot() {
        phase = 'shop';
        droppedItems = [];
        currentResult = null;
    }

    $: chestConfig = CHESTS.find(c => c.type === openingChestType) ?? CHESTS[0];
    $: resonanceProgress = Math.min(100, $gameStore.chestResonanceProgress || 0);
    $: isResonanceReady = resonanceProgress >= 100;
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
                    <h2 class="tab-title">{$t('chests.title')}</h2>
                </div>
                <p class="header-sub">{$t('chests.subtitle')}</p>

                <div class="balance-row">
                    <div class="balance-chip gold">
                        <ResourceIcon type="gold" size={15} />
                        <span>{formatNumber($gameStore.gold)}</span>
                    </div>
                    <div class="balance-chip crystal">
                        <ResourceIcon type="crystals" size={15} />
                        <span>{formatNumber($crystals)}</span>
                    </div>
                </div>

                <button class="close-btn" on:click={close} aria-label={$t('common.close')}>
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.2" fill="none">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        {/if}

        <!-- PITY METER: ШКАЛА МАГИЧЕСКОГО РЕЗОНАНСА -->
        <div class="resonance-container" class:active-resonance={isResonanceReady}>
            <div class="resonance-header">
                <div class="resonance-title-box">
                    <span class="resonance-icon">
                        {#if isResonanceReady}
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="#f1c40f">
                                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
                            </svg>
                        {:else}
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#a29bfe" stroke-width="2">
                                <circle cx="12" cy="12" r="8"/>
                                <path d="M12 8v4l3 3"/>
                            </svg>
                        {/if}
                    </span>
                    <span class="resonance-title">
                        {isResonanceReady ? $t('chests.resonanceActive') : $t('chests.resonanceScale')}
                    </span>
                </div>
                <span class="resonance-percent">{resonanceProgress}% / 100%</span>
            </div>

            <div class="resonance-track">
                <div 
                    class="resonance-fill" 
                    class:charged={isResonanceReady}
                    style="width: {resonanceProgress}%"
                ></div>
            </div>

            <p class="resonance-hint">
                {#if isResonanceReady}
                    <strong>{$t('chests.resonanceNextDouble')}</strong>
                {:else}
                    {@html $t('chests.resonanceHint')}
                {/if}
            </p>
        </div>

        <!-- MULTIPLIER TOGGLE: x1 vs x5 -->
        <div class="multi-toggle-bar">
            <span class="toggle-label">{$t('chests.openMode')}</span>
            <div class="toggle-buttons">
                <button 
                    type="button" 
                    class="toggle-btn" 
                    class:active={openMultiplier === 1}
                    on:click={() => openMultiplier = 1}
                >
                    1x
                </button>
                <button 
                    type="button" 
                    class="toggle-btn discount" 
                    class:active={openMultiplier === 5}
                    on:click={() => openMultiplier = 5}
                >
                    5x <span class="discount-pill">-5%</span>
                </button>
            </div>
        </div>

        <!-- CHESTS LIST -->
        <div class="chest-list">
            {#each CHESTS as chest}
                {@const mult = chest.free ? 1 : openMultiplier}
                {@const currentCost = getChestCost(chest, mult)}
                {@const currentGoldCost = getChestGoldCost(mult)}
                {@const canAffordCrystals = chest.free || $crystals >= currentCost}
                {@const canAffordGold = $gameStore.gold >= currentGoldCost}
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

                            {#if chest.type === 'alchemist'}
                                <circle cx="20" cy="20" r="3" fill="#55efc4" opacity="0.8"/>
                                <circle cx="50" cy="18" r="2.5" fill="#55efc4" opacity="0.7"/>
                                <circle cx="35" cy="12" r="4" fill="#00cec9" opacity="0.9"/>
                            {:else if chest.type === 'magical'}
                                <polygon points="35,6 38,14 46,14 40,19 42,27 35,22 28,27 30,19 24,14 32,14" fill="#ffeaa7" opacity="0.9"/>
                            {:else if chest.type === 'astral'}
                                <circle cx="35" cy="18" r="7" fill="#74b9ff" opacity="0.6"/>
                                <circle cx="35" cy="18" r="3" fill="#ffffff"/>
                                <circle cx="20" cy="22" r="2" fill="#ffeaa7"/>
                                <circle cx="50" cy="20" r="2" fill="#ffeaa7"/>
                            {:else if chest.type === 'titan'}
                                <polygon points="35,4 43,18 35,25 27,18" fill="#f1c40f"/>
                                <circle cx="35" cy="16" r="3" fill="#ff7675"/>
                                <circle cx="16" cy="22" r="2.5" fill="#f1c40f"/>
                                <circle cx="54" cy="22" r="2.5" fill="#f1c40f"/>
                            {/if}
                        </svg>
                    </div>

                    <div class="chest-info">
                        <div class="chest-title-row">
                            <h3 style="color: {chest.accentColor}">{chest.name}</h3>
                            <span class="chest-items-badge">{chest.items}</span>
                            <span class="resonance-gain-badge">
                                +{chest.resonance * mult}%
                                <svg viewBox="0 0 24 24" width="11" height="11" fill="#f1c40f">
                                    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
                                </svg>
                            </span>
                        </div>
                        <p>{chest.desc}</p>
                        
                        {#if chest.free && freeCooldownText}
                            <div class="cooldown-pill">
                                <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <circle cx="8" cy="8" r="6"/>
                                    <polyline points="8,4 8,8 11,8"/>
                                </svg>
                                <span>{$t('chests.freeChestIn', { time: freeCooldownText })}</span>
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

                    <div class="chest-actions-col">
                        {#if chest.canBuyWithGold}
                            <button
                                type="button"
                                class="open-btn gold-buy-btn"
                                disabled={!canAffordGold}
                                on:click={() => handleOpen(chest, true)}
                                title={$t('chests.buyGoldHint')}
                            >
                                <ResourceIcon type="gold" size={13} />
                                <span>{formatNumber(currentGoldCost)} {mult > 1 ? `(${mult}x)` : ''}</span>
                            </button>
                        {/if}

                        <button
                            type="button"
                            class="open-btn"
                            class:free-ready={chest.free && !freeCooldownText}
                            style="--btn-color: {chest.accentColor}; --btn-glow: {chest.accentColor}60"
                            disabled={!canAffordCrystals}
                            on:click={() => handleOpen(chest, false)}
                        >
                            {#if chest.free}
                                {#if !freeCooldownText}
                                    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3,8 7,12 13,4" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    <span>{$t('chests.openFree')}</span>
                                {:else}
                                    <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
                                        <polygon points="4,2 14,8 4,14"/>
                                    </svg>
                                    <span>{$t('chests.openAd')}</span>
                                {/if}
                            {:else}
                                <ResourceIcon type="crystals" size={13} />
                                <span>{currentCost} {mult > 1 ? `(${mult}x)` : $t('chests.open')}</span>
                            {/if}
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    </div>
    {/if}

    <!-- PHASE: ANIMATING -->
    {#if phase === 'animating'}
    <div class="anim-stage">
        <p class="anim-label">{$t('chests.openingTitle', { name: chestConfig.name })}</p>
        <svg bind:this={chestEl} viewBox="0 0 140 120" width="220" height="190"
            style="filter: drop-shadow(0 0 35px {chestConfig.accentColor}); will-change: transform, opacity">
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
            <h3 class="loot-title">{$t('chests.lootCollected')}</h3>
        </div>

        {#if currentResult?.isDoubleResonance}
            <div class="resonance-banner">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#f1c40f">
                    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
                </svg>
                <span>{$t('chests.doubleResonanceBanner')}</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#f1c40f">
                    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
                </svg>
            </div>
        {/if}

        <div class="loot-summary-row">
            {#if currentResult && currentResult.totalGold > 0}
                <div class="summary-chip gold">
                    <ResourceIcon type="gold" size={16} />
                    <span>+{formatNumber(currentResult.totalGold)} {$t('common.gold')}</span>
                </div>
            {/if}
            {#if currentResult && currentResult.totalCrystals > 0}
                <div class="summary-chip crystals">
                    <ResourceIcon type="crystals" size={16} />
                    <span>+{currentResult.totalCrystals} {$t('common.crystals')}</span>
                </div>
            {/if}
            <div class="summary-chip items">
                <span>{$t('chests.itemsCount', { count: droppedItems.length })}</span>
            </div>
        </div>

        <div class="loot-grid">
            {#each droppedItems as item, i (i)}
                <div
                    class="loot-card loot-{item.type}"
                    bind:this={cardEls[i]}
                    style="
                        --border: {RARITY_COLORS[item.rarity] || '#74b9ff'};
                        --glow: {RARITY_GLOW[item.rarity] || '0 0 10px rgba(116,185,255,0.5)'};
                    "
                >
                    {#if item.count > 1}
                        <div class="card-count-badge">x{item.count}</div>
                    {/if}

                    <div class="loot-icon">
                        {#if item.type === 'ingredient' && item.icon}
                            {@html item.icon}
                        {:else if item.type === 'potion' && item.icon}
                            {@html item.icon}
                        {:else if item.type === 'gold'}
                            <ResourceIcon type="gold" size={32} />
                        {:else if item.type === 'crystals'}
                            <ResourceIcon type="crystals" size={32} />
                        {:else if item.type === 'pet' && item.icon}
                            {@html item.icon}
                        {/if}
                    </div>

                    <div class="loot-name">
                        {item.type === 'ingredient' ? getIngredientName(item.id, $currentLang) : 
                         (item.type === 'potion' ? getPotionName(item.id, $currentLang) : 
                         (item.type === 'pet' ? getPetName(item.id, $currentLang) : item.name))}
                    </div>

                    {#if item.type === 'gold'}
                        <div class="loot-detail gold-text">+{formatNumber(item.goldAmount || 0)} {$t('common.gold')}</div>
                    {:else if item.type === 'crystals'}
                        <div class="loot-detail crystal-text">+{item.crystalAmount || 0} {$t('common.crystals')}</div>
                    {:else if item.type === 'potion'}
                        <div class="loot-detail potion-text">{$t('chests.readyPotion')}</div>
                    {:else if item.type === 'pet'}
                        <div class="loot-detail pet-text">{$t('chests.newFamiliar')}</div>
                    {:else}
                        <div class="loot-rarity" style="color: {RARITY_COLORS[item.rarity]}">{RARITY_LABELS[item.rarity]}</div>
                    {/if}
                </div>
            {/each}
        </div>

        <button type="button" class="collect-btn" on:click={collectLoot}>
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
                <polyline points="3,8 7,12 13,4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{$t('chests.claimToInventory')}</span>
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
        max-width: 620px;
        max-height: 90vh;
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

    .tab-header {
        position: relative;
        margin-bottom: 16px;
    }

    .tab-title-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .header-icon {
        display: flex;
        align-items: center;
    }

    .tab-title {
        font-size: 1.4rem;
        font-weight: 800;
        margin: 0;
        color: #ffeaa7;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
    }

    .header-sub {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.65);
        margin: 4px 0 10px 0;
    }

    .balance-row {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .balance-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(0, 0, 0, 0.4);
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 700;
    }

    .balance-chip.gold {
        color: #ffeaa7;
        border: 1px solid rgba(241, 196, 15, 0.3);
    }

    .balance-chip.crystal {
        color: #74b9ff;
        border: 1px solid rgba(116, 185, 255, 0.3);
    }

    .close-btn {
        position: absolute;
        top: 0;
        right: 0;
        width: 44px;
        height: 44px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: white;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        transition: all 0.2s;
    }

    .close-btn:hover {
        background: rgba(231, 76, 60, 0.7);
        border-color: #e74c3c;
    }

    /* Pity Resonance Container */
    .resonance-container {
        background: rgba(0, 0, 0, 0.35);
        border: 1.5px solid rgba(162, 155, 254, 0.35);
        border-radius: 14px;
        padding: 12px 14px;
        margin-bottom: 14px;
        transition: all 0.3s;
    }

    .resonance-container.active-resonance {
        border-color: #f1c40f;
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.15), rgba(162, 155, 254, 0.2));
        box-shadow: 0 0 20px rgba(241, 196, 15, 0.3);
        animation: activePulse 2s infinite ease-in-out;
    }

    @keyframes activePulse {
        0%, 100% { box-shadow: 0 0 16px rgba(241, 196, 15, 0.25); }
        50% { box-shadow: 0 0 28px rgba(241, 196, 15, 0.5); }
    }

    .resonance-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .resonance-title-box {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .resonance-icon {
        font-size: 1rem;
    }

    .resonance-title {
        font-size: 0.86rem;
        font-weight: 800;
        color: #ffeaa7;
    }

    .resonance-percent {
        font-size: 0.8rem;
        font-weight: 800;
        color: #a29bfe;
    }

    .resonance-track {
        height: 10px;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 5px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .resonance-fill {
        height: 100%;
        background: linear-gradient(90deg, #6c5ce7 0%, #a29bfe 60%, #00cec9 100%);
        border-radius: 5px;
        transition: width 0.4s ease;
    }

    .resonance-fill.charged {
        background: linear-gradient(90deg, #f39c12 0%, #f1c40f 50%, #fff 100%);
        box-shadow: 0 0 12px #f1c40f;
    }

    .resonance-hint {
        margin: 6px 0 0 0;
        font-size: 0.74rem;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.3;
    }

    /* Multi-open toggle bar */
    .multi-toggle-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 6px 12px;
        margin-bottom: 14px;
    }

    .toggle-label {
        font-size: 0.82rem;
        color: rgba(255, 255, 255, 0.75);
        font-weight: 600;
    }

    .toggle-buttons {
        display: flex;
        gap: 6px;
    }

    .toggle-btn {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.7);
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s;
    }

    .toggle-btn:hover {
        color: white;
        background: rgba(255, 255, 255, 0.12);
    }

    .toggle-btn.active {
        background: #6c5ce7;
        border-color: #a29bfe;
        color: white;
        box-shadow: 0 0 10px rgba(108, 92, 231, 0.5);
    }

    .discount-pill {
        background: #e74c3c;
        color: white;
        padding: 1px 4px;
        border-radius: 4px;
        font-size: 0.65rem;
        font-weight: 900;
    }

    /* Chests List */
    .chest-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        box-sizing: border-box;
    }

    .chest-card {
        display: grid;
        grid-template-columns: 74px 1fr auto;
        align-items: center;
        gap: 12px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%);
        border: 1.5px solid var(--border, rgba(255, 255, 255, 0.1));
        border-radius: 16px;
        padding: 12px 14px;
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
        gap: 6px;
        flex-wrap: wrap;
    }

    .chest-info h3 {
        margin: 0;
        font-size: 0.98rem;
        font-weight: 800;
        text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    }

    .chest-items-badge {
        background: rgba(255, 255, 255, 0.1);
        padding: 1px 6px;
        border-radius: 8px;
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.75);
    }

    .resonance-gain-badge {
        background: rgba(162, 155, 254, 0.2);
        color: #a29bfe;
        border: 1px solid rgba(162, 155, 254, 0.35);
        padding: 1px 6px;
        border-radius: 6px;
        font-size: 0.68rem;
        font-weight: 800;
    }

    .chest-info p {
        margin: 0;
        font-size: 0.78rem;
        color: rgba(255, 255, 255, 0.65);
    }

    .chances-row {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 2px;
    }

    .chance-tag {
        font-size: 0.68rem;
        font-weight: 700;
        padding: 1px 5px;
        border-radius: 5px;
        border: 1px solid;
    }

    .chest-actions-col {
        display: flex;
        flex-direction: column;
        gap: 6px;
        align-items: flex-end;
    }

    .open-btn {
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.08);
        border: 1.5px solid var(--btn-color, #fff);
        border-radius: 10px;
        color: var(--btn-color, #fff);
        font-size: 0.8rem;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 5px;
        flex-shrink: 0;
    }

    .open-btn:hover:not(:disabled) {
        background: var(--btn-color, #fff);
        color: #1e1035;
        box-shadow: 0 0 16px var(--btn-glow, transparent);
        transform: scale(1.02);
    }

    .open-btn:disabled {
        opacity: 0.35;
        cursor: not-allowed;
    }

    .gold-buy-btn {
        border-color: #f1c40f !important;
        color: #ffeaa7 !important;
        background: rgba(241, 196, 15, 0.12) !important;
    }

    .gold-buy-btn:hover:not(:disabled) {
        background: #f1c40f !important;
        color: #1e1035 !important;
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
        font-size: 0.72rem;
        font-weight: 700;
        color: #ffeaa7;
        width: fit-content;
        margin: 2px 0;
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
        gap: 14px;
        padding: 24px;
        max-height: 90vh;
        overflow-y: auto;
        width: 100%;
        max-width: 620px;
        box-sizing: border-box;
    }

    .loot-header {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .loot-title {
        margin: 0;
        font-size: 1.5rem;
        color: #f1c40f;
        text-shadow: 0 0 16px rgba(241, 196, 15, 0.5);
        text-align: center;
    }

    .resonance-banner {
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.25), rgba(108, 92, 231, 0.35));
        border: 1.5px solid #f1c40f;
        box-shadow: 0 0 20px rgba(241, 196, 15, 0.4);
        padding: 8px 16px;
        border-radius: 10px;
        color: #ffffff;
        font-weight: 800;
        font-size: 0.88rem;
        display: flex;
        align-items: center;
        gap: 6px;
        animation: activePulse 1.5s infinite ease-in-out;
    }

    .loot-summary-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
        width: 100%;
    }

    .summary-chip {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 0.82rem;
        font-weight: 700;
        background: rgba(0, 0, 0, 0.4);
    }

    .summary-chip.gold {
        color: #ffeaa7;
        border: 1px solid rgba(241, 196, 15, 0.4);
    }

    .summary-chip.crystals {
        color: #74b9ff;
        border: 1px solid rgba(116, 185, 255, 0.4);
    }

    .summary-chip.items {
        color: #a29bfe;
        border: 1px solid rgba(162, 155, 254, 0.4);
    }

    .loot-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));
        gap: 10px;
        width: 100%;
    }

    .loot-card {
        position: relative;
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid var(--border, rgba(255, 255, 255, 0.15));
        border-radius: 14px;
        padding: 10px 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 6px;
        box-shadow: var(--glow, none);
        transition: transform 0.2s;
    }

    .loot-card:hover {
        transform: translateY(-2px);
    }

    .card-count-badge {
        position: absolute;
        top: 6px;
        right: 6px;
        background: #e74c3c;
        color: white;
        font-size: 0.68rem;
        font-weight: 900;
        padding: 1px 5px;
        border-radius: 6px;
        line-height: 1.2;
    }

    .loot-icon {
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .loot-icon :global(svg) {
        width: 34px;
        height: 34px;
    }

    .loot-name {
        font-size: 0.78rem;
        font-weight: 700;
        color: #ffffff;
        line-height: 1.2;
        max-width: 90px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .loot-rarity, .loot-detail {
        font-size: 0.7rem;
        font-weight: 700;
    }

    .gold-text {
        color: #ffeaa7;
    }

    .crystal-text {
        color: #74b9ff;
    }

    .potion-text {
        color: #55efc4;
    }

    .pet-text {
        color: #f1c40f;
    }

    .collect-btn {
        background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
        border: none;
        border-radius: 14px;
        color: #0c241d;
        font-size: 0.95rem;
        font-weight: 800;
        padding: 12px 28px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 0 #00886c, 0 6px 20px rgba(0, 184, 148, 0.4);
        transition: all 0.2s;
        margin-top: 6px;
    }

    .collect-btn:hover {
        transform: translateY(-1px);
        filter: brightness(1.08);
    }

    .collect-btn:active {
        transform: translateY(2px);
        box-shadow: 0 1px 0 #00886c;
    }

    @media (max-width: 600px) {
        .modal {
            padding: 16px 12px;
            max-height: 94vh;
        }

        .chest-card {
            grid-template-columns: 60px 1fr;
            gap: 10px;
        }

        .chest-actions-col {
            grid-column: 1 / -1;
            flex-direction: row;
            justify-content: flex-end;
            width: 100%;
        }

        .loot-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }
</style>
