<script lang="ts">
    import { onMount, onDestroy, tick } from 'svelte';
    import { get } from 'svelte/store';
    import gsap from 'gsap';
    import {
        gameStore,
        ingredientsCount, crystals, failedBrewAttempts, unlockedRecipes,
        maxBrewAttempts, brewAttemptsLeft,
        AVAILABLE_INGREDIENTS, AVAILABLE_POTIONS, RECIPES, HINT_COSTS,
        brewPotion as doBrewPotion, quickBrewRecipe, coolDownCauldron, coolDownCauldronAd, coolDownCauldronCrystals,
        buyRecipeHint, unlockRecipeHintFree,
        type Rarity, type AlchemyRecipe, formatNumber,
    } from '../store';
    import { t, currentLang, getIngredientName, getPotionName } from '../i18n';
    import { saveGame, showRewardedAd } from '../yandex-sdk';
    import { playSuccessSound, playOverheatSizzle, playCoinSound } from '../audio';
    import ResourceIcon from './ResourceIcon.svelte';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void;

    let overlayEl: HTMLElement;
    let modalEl:   HTMLElement;
    let cauldronEl: HTMLElement;
    let flashEl:    HTMLElement;

    let slots: [string | null, string | null, string | null] = [null, null, null];
    let lastResonanceMsg: string | null = null;

    type ToastType = 'success' | 'warning' | 'burn';
    let toast: { text: string; type: ToastType } | null = null;
    let toastTimer = 0;
    function showToast(text: string, type: ToastType = 'warning', ms = 3500) {
        clearTimeout(toastTimer);
        toast = { text, type };
        toastTimer = window.setTimeout(() => (toast = null), ms);
    }

    let nowTime = Date.now();
    let timerInterval: any;

    onMount(() => {
        timerInterval = setInterval(() => {
            nowTime = Date.now();
        }, 1000);
    });

    onDestroy(() => {
        if (timerInterval) clearInterval(timerInterval);
        if (toastTimer) clearTimeout(toastTimer);
    });

    $: overheatUntil = $gameStore.cauldronOverheatUntil || 0;
    $: isOverheated = overheatUntil > nowTime;
    $: remainingOverheatSeconds = Math.max(0, Math.ceil((overheatUntil - nowTime) / 1000));
    $: isDangerouslyClose = $brewAttemptsLeft <= 1 && $failedBrewAttempts > 0;

    // Mastery stats
    $: brewsCount = $gameStore.alchemyBrewsCount || 0;
    $: masteryLevel = Math.min(4, Math.floor(brewsCount / 5));
    $: doubleChancePercent = masteryLevel * 5;
    $: brewsToNextLevel = masteryLevel < 4 ? 5 - (brewsCount % 5) : 0;

    // Rarity filter
    let selectedRarity: 'all' | Rarity = 'all';

    $: if (isOpen) {
        tick().then(() => {
            if (!overlayEl || !modalEl || isEmbedded) return;
            gsap.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.3 });
            gsap.fromTo(modalEl,
                { y: 60, opacity: 0, scale: 0.88 },
                { y: 0,  opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.2)' }
            );
        });
    }

    function close() {
        if (overlayEl && modalEl && !isEmbedded) {
            gsap.to(overlayEl, { opacity: 0, duration: 0.25 });
            gsap.to(modalEl, { y: 40, opacity: 0, scale: 0.9, duration: 0.3, ease: 'power2.in', onComplete: onClose });
        } else { onClose(); }
    }

    $: usedCounts = slots.reduce((acc, s) => {
        if (s) acc[s] = (acc[s] ?? 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    $: ownedIngredients = AVAILABLE_INGREDIENTS
        .map(ing => ({
            ...ing,
            total:     $ingredientsCount[ing.id] ?? 0,
            available: ($ingredientsCount[ing.id] ?? 0) - (usedCounts[ing.id] ?? 0),
        }))
        .filter(ing => ing.total > 0);

    $: filteredIngredients = selectedRarity === 'all'
        ? ownedIngredients
        : ownedIngredients.filter(i => i.rarity === selectedRarity);

    $: canBrew  = slots.every(s => s !== null);
    $: slotsAll = slots.every(s => s !== null);

    function clearSlot(i: number) {
        slots[i] = null;
        slots = [...slots] as typeof slots;
    }
    function clearAllSlots() {
        slots = [null, null, null];
    }
    function addToSlot(id: string) {
        const avail = ($ingredientsCount[id] ?? 0) - (usedCounts[id] ?? 0);
        if (avail <= 0 || slotsAll) return;
        const idx = slots.findIndex(s => s === null);
        if (idx === -1) return;
        slots[idx] = id;
        slots = [...slots] as typeof slots;
    }

    let isBrewing = false;
    async function handleBrew() {
        if (!canBrew || isBrewing || isOverheated) return;
        isBrewing = true;
        const result = doBrewPotion(slots as [string, string, string]);

        if (result.status === 'success') {
            slots = [null, null, null];
            lastResonanceMsg = null;
            playSuccessSound();
            gsap.timeline()
                .to(cauldronEl, { y: -22, scale: 1.14, duration: 0.18, ease: 'power2.out' })
                .to(cauldronEl, { y: 0,   scale: 1,    duration: 0.55, ease: 'elastic.out(1, 0.5)' });
            gsap.fromTo(flashEl, { opacity: 0.65, backgroundColor: 'rgba(241,196,15,0.55)' }, { opacity: 0, duration: 0.7 });
            
            const doubleText = result.isDouble ? get(t)('alchemy.criticalDoubleSuccess') : '';
            showToast(get(t)('alchemy.brewSuccessMsg', { name: result.recipeName || '', double: doubleText }), 'success', 3500);
            await saveGame();
        } else if (result.status === 'warning') {
            playOverheatSizzle();
            const left = Math.max(0, result.attemptsLeft ?? 1);
            const matches = result.matches ?? 0;
            gsap.to(cauldronEl, { keyframes: [{ x:-7, duration:.07 },{ x:7, duration:.07 },{ x:-5, duration:.07 },{ x:5, duration:.07 },{ x:0, duration:.06 }] });
            gsap.fromTo(flashEl, { opacity: 0.35, backgroundColor: 'rgba(253,203,0,0.3)' }, { opacity: 0, duration: 0.5 });
            
            let resText = get(t)('alchemy.resonance0');
            if (matches === 1) resText = get(t)('alchemy.resonance1');
            if (matches === 2) resText = get(t)('alchemy.resonance2');
            
            lastResonanceMsg = resText;
            showToast(get(t)('alchemy.resonanceWarning', { resonance: resText, left: String(left) }), 'warning', 4200);
        } else if (result.status === 'overheat') {
            lastResonanceMsg = null;
            nowTime = Date.now();
            playOverheatSizzle();
            gsap.to(cauldronEl, { keyframes: [{ x:-14, duration:.07 },{ x:14, duration:.07 },{ x:-12, duration:.07 },{ x:12, duration:.07 },{ x:-10, duration:.07 },{ x:10, duration:.07 },{ x:0, duration:.07 }] });
            gsap.fromTo(flashEl, { opacity: 0.7, backgroundColor: 'rgba(231,76,60,0.6)' }, { opacity: 0, duration: 0.8 });
            showToast(get(t)('alchemy.overheatedNotice'), 'burn', 5000);
            await saveGame();
        } else if (result.status === 'blocked') {
            showToast(get(t)('alchemy.coolingWait'), 'warning');
        }
        isBrewing = false;
    }

    async function handleQuickBrew(recipeId: string) {
        if (isOverheated) {
            showToast(get(t)('alchemy.overheatedBlocked'), 'warning');
            return;
        }
        const res = quickBrewRecipe(recipeId);
        if (res.success) {
            playSuccessSound();
            if (cauldronEl) {
                gsap.timeline()
                    .to(cauldronEl, { y: -16, scale: 1.08, duration: 0.15, ease: 'power2.out' })
                    .to(cauldronEl, { y: 0,   scale: 1,    duration: 0.4, ease: 'elastic.out(1, 0.5)' });
            }
            const doubleText = res.isDouble ? get(t)('alchemy.criticalDoubleSuccess') : '';
            showToast(get(t)('alchemy.recipeBrewSuccess', { double: doubleText }), 'success');
            await saveGame();
        } else {
            showToast(res.reason ?? get(t)('alchemy.recipeBrewFail'), 'warning');
        }
    }

    function handleCoolDownAd() {
        showRewardedAd(() => {
            coolDownCauldronAd();
            lastResonanceMsg = null;
            nowTime = Date.now();
            playCoinSound();
            showToast(get(t)('alchemy.iceCoolingSuccess'), 'success');
            saveGame();
        }, undefined, () => {
            showToast(get(t)('alchemy.adLoadError'));
        });
    }

    async function handleCoolDownCrystals(cost = 8) {
        if ($crystals < cost) {
            showToast(get(t)('alchemy.notEnoughCrystalsCooling'), 'warning');
            return;
        }
        if (coolDownCauldronCrystals(cost)) {
            lastResonanceMsg = null;
            nowTime = Date.now();
            playCoinSound();
            showToast(get(t)('alchemy.instantCoolSuccess', { cost }), 'success');
            await saveGame();
        }
    }

    async function handleHint(recipeId: string) {
        if (buyRecipeHint(recipeId)) {
            playCoinSound();
            showToast(get(t)('alchemy.hintRevealedCrystals'), 'success', 2000);
            await saveGame();
        } else {
            showToast(get(t)('alchemy.notEnoughCrystalsHint'), 'warning');
        }
    }

    function handleHintAd(recipeId: string) {
        showRewardedAd(() => {
            if (unlockRecipeHintFree(recipeId)) {
                gameStore.updateQuestProgress('watch_ads', 1);
                showToast(get(t)('alchemy.hintRevealedAd'), 'success', 2500);
                saveGame();
            } else {
                showToast(get(t)('alchemy.hintAdOnlyFirst'), 'warning');
            }
        }, undefined, () => {
            showToast(get(t)('alchemy.videoLoadError'));
        });
    }

    function canQuickBrew(recipe: AlchemyRecipe): { can: boolean; missingName?: string } {
        const counts = $ingredientsCount;
        const needed: Record<string, number> = {};
        for (const ing of recipe.ingredients) {
            needed[ing] = (needed[ing] ?? 0) + 1;
        }
        for (const [ing, cnt] of Object.entries(needed)) {
            if ((counts[ing] ?? 0) < cnt) {
                const ingObj = getIng(ing);
                return { can: false, missingName: ingObj ? getIngredientName(ingObj.id, get(currentLang)) : ing };
            }
        }
        return { can: true };
    }

    function getIng(id: string) { return AVAILABLE_INGREDIENTS.find(i => i.id === id); }
    function getPotion(id: string) { return AVAILABLE_POTIONS.find(p => p.id === id); }

    const RC: Record<Rarity, string> = { common:'#b2bec3', rare:'#74b9ff', epic:'#a29bfe', legendary:'#f1c40f' };
    $: RL = { 
        common: $t('rarity.common'), 
        rare: $t('rarity.rare'), 
        epic: $t('rarity.epic'), 
        legendary: $t('rarity.legendary') 
    };
</script>

{#if isOpen}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="overlay" class:embedded={isEmbedded} bind:this={overlayEl} on:click={close}>
<div class="screen-flash" bind:this={flashEl}></div>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="modal" class:embedded-modal={isEmbedded} bind:this={modalEl} on:click|stopPropagation>
    {#if !isEmbedded}
        <div class="modal-header">
            <div class="header-icon">
                <svg viewBox="0 0 36 36" width="26" height="26">
                    <rect x="2" y="24" width="32" height="10" rx="3" fill="#5D3A1A"/>
                    <rect x="2" y="22" width="32" height="4" rx="2" fill="#7B4F2E"/>
                    <ellipse cx="18" cy="18" rx="12" ry="14" fill="#2d1b4e"/>
                    <ellipse cx="18" cy="18" rx="10" ry="12" fill="#3d2466"/>
                    <path d="M10 14 Q18 10 26 14" stroke="#a29bfe" stroke-width="1.5" fill="none"/>
                    <circle cx="10" cy="10" r="2.5" fill="#f1c40f" opacity="0.9"/>
                    <circle cx="26" cy="10" r="2.5" fill="#f1c40f" opacity="0.9"/>
                    <circle cx="18" cy="7" r="2" fill="#fd79a8" opacity="0.9"/>
                </svg>
            </div>
            <div class="header-text">
                <h2>{$t('alchemy.title')}</h2>
                <p class="header-sub">{$t('alchemy.subtitle')}</p>
            </div>
            <button class="close-btn" on:click={close} aria-label="{$t('common.close')}">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.2" fill="none">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>

        <div class="balance-row">
            <div class="balance-chip crystal">
                <ResourceIcon type="crystals" size={14} />
                <span>{formatNumber($crystals)} {$t('common.crystals')}</span>
            </div>
        </div>
    {/if}

    <div class="content-grid">
        <!-- LEFT: CAULDRON + BREW -->
        <div class="brew-panel">
            {#if isOverheated}
                {@const mins = Math.floor(remainingOverheatSeconds / 60)}
                {@const secs = remainingOverheatSeconds % 60}
                <div class="overheat-banner">
                    <div class="overheat-info">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" class="flame-pulse">
                            <path d="M12 2C8 6 6 9 6 13C6 16.3 8.7 19 12 19C15.3 19 18 16.3 18 13C18 9 16 6 12 2Z" fill="#ff4757"/>
                            <path d="M12 7C10 9.5 9 11.5 9 13.5C9 15.2 10.3 16.5 12 16.5C13.7 16.5 15 15.2 15 13.5C15 11.5 14 9.5 12 7Z" fill="#ffa502"/>
                        </svg>
                        <div class="overheat-text-col">
                            <span class="overheat-title">{$t('alchemy.overheated')}</span>
                            <span class="overheat-timer">{$t('alchemy.timeLeft')} <strong>{mins > 0 ? `${mins} ${$t('common.min')} ${secs.toString().padStart(2, '0')} ${$t('common.sec')}` : `${secs} ${$t('common.sec')}`}</strong></span>
                        </div>
                    </div>
                    <div class="overheat-actions">
                        <button class="cooldown-ad-btn" on:click={handleCoolDownAd} title="Cool down">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#74b9ff" stroke-width="2.2">
                                <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/>
                            </svg>
                            <span>{$t('alchemy.cooldown')}</span>
                            <span class="ad-pill">{$t('alchemy.adTag')}</span>
                        </button>
                        <button class="cooldown-crystal-btn" on:click={() => handleCoolDownCrystals(8)} title="Cool down with crystals">
                            <ResourceIcon type="crystals" size={12} />
                            <span>8</span>
                        </button>
                    </div>
                </div>
            {:else if $failedBrewAttempts > 0}
                <div class="danger-bar">
                    <div class="danger-left">
                        <svg viewBox="0 0 16 16" width="16" height="16" fill={isDangerouslyClose ? '#ff4757' : '#ffa502'} class="danger-svg">
                            <path d="M8 1c-.5 2-3 4-3 7 0 2.5 2 4 3 4s3-1.5 3-4c0-3-2.5-5-3-7z"/>
                        </svg>
                        <div class="danger-info-col">
                            <div class="danger-title-row">
                                <span class="danger-label" class:danger-critical={isDangerouslyClose}>
                                    {$brewAttemptsLeft <= 1 ? $t('alchemy.brewLastChance') : `${$brewAttemptsLeft} / ${$maxBrewAttempts}`}
                                </span>
                                <div class="pips">
                                    {#each Array.from({ length: $maxBrewAttempts }, (_, i) => i + 1) as p}
                                        <div class="pip" class:active={p <= $failedBrewAttempts} class:critical={isDangerouslyClose && p <= $failedBrewAttempts}></div>
                                    {/each}
                                </div>
                            </div>
                            {#if lastResonanceMsg}
                                <span class="resonance-subtext">{lastResonanceMsg}</span>
                            {/if}
                        </div>
                    </div>

                    <div class="danger-actions">
                        <button class="cooldown-btn" on:click={handleCoolDownAd} title="Cool down">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#74b9ff" stroke-width="2.2">
                                <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/>
                            </svg>
                            <span>{$t('alchemy.cooldown')}</span>
                            <span class="ad-pill">{$t('alchemy.adTag')}</span>
                        </button>
                        <button class="cooldown-crystal-btn" on:click={() => handleCoolDownCrystals(4)} title="Cool down">
                            <ResourceIcon type="crystals" size={12} />
                            <span>4</span>
                        </button>
                    </div>
                </div>
            {/if}

            <div class="mastery-chip" title="Mastery">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="#f1c40f">
                    <polygon points="12,2 15,8.5 22,9.3 17,14 18.5,21 12,17.5 5.5,21 7,14 2,9.3 9,8.5"/>
                </svg>
                <span>{$t('alchemy.masteryChip', { lvl: masteryLevel, pct: doubleChancePercent })}</span>
                {#if brewsToNextLevel > 0}
                    <span class="mastery-sub">{$t('alchemy.brewsToNext', { count: brewsToNextLevel })}</span>
                {:else}
                    <span class="mastery-sub">{$t('alchemy.maxLevel')}</span>
                {/if}
            </div>

            <div class="cauldron-wrap" bind:this={cauldronEl}>
                <svg viewBox="0 0 120 100" width="148" height="123">
                    <defs>
                        <radialGradient id="liqG" cx="40%" cy="40%" r="60%">
                            <stop offset="0%" stop-color="#a29bfe"/><stop offset="100%" stop-color="#6c5ce7"/>
                        </radialGradient>
                        <filter id="cGl"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    </defs>
                    <ellipse cx="60" cy="96" rx="36" ry="5" fill="black" opacity="0.3"/>
                    <rect x="26" y="78" width="7" height="14" rx="3" fill="#2d3436"/>
                    <rect x="56" y="80" width="7" height="12" rx="3" fill="#2d3436"/>
                    <rect x="86" y="78" width="7" height="14" rx="3" fill="#2d3436"/>
                    <path d="M18 52 Q18 82 60 82 Q102 82 102 52Z" fill="#2d3436"/>
                    <path d="M22 52 Q22 76 60 76 Q98 76 98 52" fill="#636e72" opacity="0.25"/>
                    <ellipse cx="60" cy="52" rx="42" ry="12" fill="#636e72"/>
                    <ellipse cx="60" cy="50" rx="40" ry="10" fill="#2d3436"/>
                    <ellipse cx="60" cy="50" rx="34" ry="8" fill="url(#liqG)" filter="url(#cGl)" opacity="0.9"/>
                    <ellipse cx="55" cy="48" rx="16" ry="4" fill="white" opacity="0.1"/>
                    <circle class="bubble"    cx="46" cy="50" r="3"   fill="#a29bfe" opacity="0.8"/>
                    <circle class="bubble b2" cx="68" cy="48" r="2"   fill="#fd79a8" opacity="0.6"/>
                    <circle class="bubble b3" cx="58" cy="52" r="2.5" fill="#74b9ff" opacity="0.55"/>
                    <path d="M18 52 Q4 52 4 42 Q4 30 18 34" fill="none" stroke="#636e72" stroke-width="5" stroke-linecap="round"/>
                    <path d="M102 52 Q116 52 116 42 Q116 30 102 34" fill="none" stroke="#636e72" stroke-width="5" stroke-linecap="round"/>
                    {#if isOverheated}
                        <ellipse class="steam intense"    cx="44" cy="26" rx="10" ry="7" fill="#ff4757" opacity="0.6"/>
                        <ellipse class="steam intense s2" cx="60" cy="18" rx="12" ry="8" fill="#e17055" opacity="0.55"/>
                        <ellipse class="steam intense s3" cx="76" cy="24" rx="9"  ry="6" fill="#ff4757" opacity="0.5"/>
                    {:else if $failedBrewAttempts > 0}
                        <ellipse class="steam"    cx="44" cy="30" rx="8"  ry="6" fill={isDangerouslyClose ? '#e17055' : '#f1c40f'} opacity="0.45"/>
                        <ellipse class="steam s2" cx="60" cy="22" rx="10" ry="7" fill={isDangerouslyClose ? '#e17055' : '#f1c40f'} opacity="0.35"/>
                        <ellipse class="steam s3" cx="76" cy="28" rx="7"  ry="5" fill={isDangerouslyClose ? '#e17055' : '#f1c40f'} opacity="0.3"/>
                    {/if}
                </svg>
            </div>

            <div class="slots-row">
                {#each slots as slotId, i}
                    {@const ing = slotId ? getIng(slotId) : null}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div class="slot" class:filled={!!slotId}
                        style={ing ? `--sg:${RC[ing.rarity]}` : ''}
                        on:click={() => slotId && clearSlot(i)}
                        title={ing ? `${getIngredientName(ing.id, $currentLang)} — ${$t('alchemy.removeSlot')}` : `${$t('alchemy.slot')} ${i+1}`}
                    >
                        {#if ing}
                            <div class="slot-icon">{@html ing.icon}</div>
                            <div class="slot-x">
                                <svg viewBox="0 0 12 12" width="9" height="9" stroke="currentColor" stroke-width="2.2" fill="none">
                                    <line x1="2" y1="2" x2="10" y2="10"/>
                                    <line x1="10" y1="2" x2="2" y2="10"/>
                                </svg>
                            </div>
                        {:else}
                            <span class="slot-num">{i+1}</span>
                        {/if}
                    </div>
                {/each}
            </div>

            <!-- Pure SVG Brew Button -->
            <button class="brew-btn" class:danger={isDangerouslyClose && !isOverheated} class:overheated={isOverheated}
                disabled={!canBrew || isBrewing || isOverheated} on:click={handleBrew}>
                {#if isOverheated}
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ff7675" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {$t('alchemy.coolingDown')}
                {:else if isBrewing}
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" class="spin-icon">
                        <circle cx="12" cy="12" r="10" stroke-dasharray="16 16"/>
                    </svg>
                    {$t('alchemy.brewing')}
                {:else if isDangerouslyClose}
                    <svg viewBox="0 0 16 16" width="18" height="18" fill="#fff">
                        <path d="M8 1c-.5 2-3 4-3 7 0 2.5 2 4 3 4s3-1.5 3-4c0-3-2.5-5-3-7z"/>
                    </svg>
                    {$t('alchemy.brewLastChance')}
                {:else}
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 3h6M10 3v5l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/>
                    </svg>
                    {$t('alchemy.brewButton')}
                {/if}
            </button>

            <div class="picker-wrap">
                <div class="picker-header-row">
                    <p class="picker-label">{$t('alchemy.inventoryLabel')}</p>
                    {#if slots.some(s => s !== null)}
                        <button type="button" class="clear-all-btn" on:click={clearAllSlots}>{$t('alchemy.clearAll')}</button>
                    {/if}
                </div>

                <div class="rarity-filter-tabs">
                    <button type="button" class="rf-tab" class:active={selectedRarity === 'all'} on:click={() => selectedRarity = 'all'}>{$t('rarity.all')}</button>
                    <button type="button" class="rf-tab common" class:active={selectedRarity === 'common'} on:click={() => selectedRarity = 'common'}>{$t('rarity.common')}</button>
                    <button type="button" class="rf-tab rare" class:active={selectedRarity === 'rare'} on:click={() => selectedRarity = 'rare'}>{$t('rarity.rare')}</button>
                    <button type="button" class="rf-tab epic" class:active={selectedRarity === 'epic'} on:click={() => selectedRarity = 'epic'}>{$t('rarity.epic')}</button>
                    <button type="button" class="rf-tab legendary" class:active={selectedRarity === 'legendary'} on:click={() => selectedRarity = 'legendary'}>{$t('rarity.legendary')}</button>
                </div>

                {#if filteredIngredients.length === 0}
                    <p class="no-ings">{$t('alchemy.noIngs')}</p>
                {:else}
                    <div class="picker-grid">
                        {#each filteredIngredients as ing}
                            {@const avail = ing.available}
                            {@const used  = usedCounts[ing.id] ?? 0}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <div class="picker-item"
                                class:depleted={avail <= 0} class:all-full={slotsAll && avail > 0}
                                style="--bc:{RC[ing.rarity]}"
                                on:click={() => addToSlot(ing.id)} title={getIngredientName(ing.id, $currentLang)}>
                                <div class="picker-icon">{@html ing.icon}</div>
                                <div class="picker-cnt">{ing.total}</div>
                                {#if used > 0}<div class="picker-used">-{used}</div>{/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <!-- RIGHT: RECIPE BOOK -->
        <div class="recipe-book">
            <div class="book-title-row">
                <div class="book-title">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="#f1c40f" opacity="0.9">
                        <path d="M6,2H18C19.1,2 20,2.9 20,4V20C20,21.1 19.1,22 18,22H6C4.9,22 4,21.1 4,20V4C4,2.9 4.9,2 6,2ZM8,6V8H16V6H8ZM8,10V12H16V10H8ZM8,14V16H12V14H8Z"/>
                    </svg>
                    {$t('alchemy.recipeBook')} ({RECIPES.length})
                </div>
                <span class="book-sub">{$t('alchemy.recipesUnlocked', { current: Object.values($unlockedRecipes).filter(l => l === 3).length, total: RECIPES.length })}</span>
            </div>

            {#each RECIPES as recipe}
                {@const hints  = $unlockedRecipes[recipe.id] ?? 0}
                {@const potion = getPotion(recipe.resultPotionId)}
                {#if potion}
                <div class="recipe-entry" style="--acc:{RC[recipe.rarity]}">
                    <div class="recipe-head">
                        <div class="r-pot-icon">{@html potion.icon}</div>
                        <div class="r-pot-info">
                            <div class="r-pot-name">{getPotionName(potion.id, $currentLang)}</div>
                            <div class="r-rarity" style="color:{RC[recipe.rarity]}">{RL[recipe.rarity]}</div>
                        </div>
                        {#if hints === 3}
                            <div class="r-ok" title={$t('alchemy.recipeKnown')}>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                        {/if}
                    </div>

                    <div class="recipe-row">
                        {#each recipe.ingredients as ingId, idx}
                            {#if idx > 0}<span class="rp">+</span>{/if}
                            {#if hints > idx}
                                {@const ing = getIng(ingId)}
                                {#if ing}
                                <div class="r-ing revealed"
                                    style="border-color:{RC[ing.rarity]};box-shadow:0 0 8px {RC[ing.rarity]}44"
                                    title={getIngredientName(ing.id, $currentLang)}>
                                    <div class="r-ing-icon">{@html ing.icon}</div>
                                </div>
                                {/if}
                            {:else}
                                <div class="r-ing hidden" title="?">?</div>
                            {/if}
                        {/each}
                        <span class="rp">=</span>
                        <div class="r-result" title={getPotionName(potion.id, $currentLang)}>{@html potion.icon}</div>
                    </div>

                    {#if hints < 3}
                        <div class="hint-actions-row">
                            <button class="hint-btn crystal-hint-btn" disabled={$crystals < HINT_COSTS[hints]}
                                on:click={() => handleHint(recipe.id)}
                                title={$t('alchemy.unlockCrystals')}>
                                <ResourceIcon type="crystals" size={13} />
                                <span>{HINT_COSTS[hints]}</span>
                                <span class="hint-step-tag">({hints+1}/3)</span>
                            </button>
                            {#if hints === 0 && !$gameStore.recipeAdHintsUsed?.[recipe.id]}
                                <button class="hint-btn ad-hint-btn"
                                    on:click={() => handleHintAd(recipe.id)}
                                    title={$t('alchemy.unlockAd')}>
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                                        <polygon points="5,3 19,12 5,21"/>
                                    </svg>
                                    <span>{$t('alchemy.freeFirst')}</span>
                                    <span class="hint-ad-pill">{$t('alchemy.adTag')}</span>
                                </button>
                            {/if}
                        </div>
                    {:else}
                        <div class="r-desc">{potion.description}</div>
                        <!-- 1-Click Quick Craft Button -->
                        {@const craftCheck = canQuickBrew(recipe)}
                        <button 
                            class="quick-brew-btn" 
                            disabled={!craftCheck.can || isOverheated} 
                            on:click={() => handleQuickBrew(recipe.id)}
                            title={isOverheated ? $t('alchemy.coolingDown') : (craftCheck.can ? $t('alchemy.quickBrew') : $t('alchemy.needIngredients'))}
                        >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                                <path d="M9 3h6M10 3v5l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/>
                            </svg>
                            <span>{isOverheated ? $t('alchemy.coolingDown') : (craftCheck.can ? $t('alchemy.quickBrew') : $t('alchemy.missingIng', { name: craftCheck.missingName || '' }))}</span>
                        </button>
                    {/if}
                </div>
                {/if}
            {/each}
        </div>
    </div>

    {#if toast}
        <div class="toast toast-{toast.type}">
            {#if toast.type === 'success'}
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            {:else if toast.type === 'warning'}
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                </svg>
            {:else}
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                    <path d="M8 1c-.5 2-3 4-3 7 0 2.5 2 4 3 4s3-1.5 3-4c0-3-2.5-5-3-7z"/>
                </svg>
            {/if}
            <span>{toast.text}</span>
        </div>
    {/if}
</div>
</div>
{/if}

<style>
.overlay { 
    position:fixed;inset:0;background:rgba(0,0,0,0.88);
    display:flex;justify-content:center;align-items:center;
    z-index:220;backdrop-filter:blur(12px); 
}
.screen-flash { position:fixed;inset:0;pointer-events:none;opacity:0;z-index:225; }

.modal {
    background:linear-gradient(155deg,#0e0620,#1a0b32,#0e0620);
    border:1.5px solid rgba(162,155,254,0.25);border-radius:24px;
    box-shadow:0 0 60px rgba(108,92,231,0.3),0 24px 60px rgba(0,0,0,0.75),inset 0 1px 0 rgba(255,255,255,0.07);
    width:96%;max-width:820px;max-height:92vh;overflow-y:auto;color:white;
    position:relative;
}
.modal::-webkit-scrollbar{width:4px}
.modal::-webkit-scrollbar-thumb{background:rgba(162,155,254,0.25);border-radius:10px}

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
    overflow-y: visible;
}

.modal-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
}
.header-text h2 { margin: 0; font-size: 1.25rem; color: #f1c40f; }
.header-sub { margin: 2px 0 0; font-size: 0.8rem; color: #a4b0be; }

.balance-row {
    display: flex;
    padding: 8px 20px;
    background: rgba(0,0,0,0.2);
}
.balance-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.82rem;
    font-weight: bold;
    background: rgba(52, 152, 219, 0.15);
    border: 1px solid rgba(52, 152, 219, 0.4);
    color: #74b9ff;
}

.close-btn{position:absolute;right:16px;top:16px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);color:white;border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:0.85rem;transition:background 0.2s}
.close-btn:hover{background:rgba(255,255,255,0.15)}

.content-grid{display:grid;grid-template-columns:1fr 1fr;min-height:0;height:100%}
@media(max-width:640px){.content-grid{grid-template-columns:1fr}}

.brew-panel{display:flex;flex-direction:column;align-items:center;gap:14px;padding:16px 14px 20px;border-right:1px solid rgba(255,255,255,0.06)}
@media(max-width:640px){.brew-panel{border-right:none;border-bottom:1px solid rgba(255,255,255,0.06)}}

.danger-bar{
    width:100%;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    background:rgba(231,76,60,0.12);
    border:1px solid rgba(231,76,60,0.4);
    border-radius:14px;
    padding:8px 12px;
    color:#ff7675;
    box-sizing:border-box;
}

.danger-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
}

.danger-info-col {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.danger-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.danger-label{font-size:0.75rem;font-weight:700}
.danger-label.danger-critical{color:#ff4757;text-shadow:0 0 8px rgba(255,71,87,0.4)}

.resonance-subtext {
    font-size: 0.68rem;
    color: #ffd700;
    font-weight: 600;
    line-height: 1.2;
}

.pips{display:flex;gap:4px}
.pip{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.18);transition:background 0.3s}
.pip.active{background:#ffa502;box-shadow:0 0 6px rgba(255,165,2,0.6)}
.pip.active.critical{background:#ff4757;box-shadow:0 0 8px #ff4757}

.danger-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
}

.cooldown-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 8px;
    background: rgba(116, 185, 255, 0.15);
    border: 1px solid rgba(116, 185, 255, 0.4);
    color: #74b9ff;
    font-size: 0.7rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
}
.cooldown-btn:hover {
    background: rgba(116, 185, 255, 0.25);
    transform: scale(1.04);
}
.ad-pill {
    background: #e67e22;
    color: #fff;
    font-size: 0.6rem;
    font-weight: 900;
    padding: 1px 4px;
    border-radius: 4px;
}

.cauldron-wrap{will-change:transform;filter:drop-shadow(0 6px 20px rgba(108,92,231,0.5))}
@keyframes bubbleFloat{0%,100%{transform:translateY(0) scale(1);opacity:.7}50%{transform:translateY(-5px) scale(1.1);opacity:1}}
@keyframes steamRise{0%{transform:translateY(0) scale(1);opacity:.45}100%{transform:translateY(-14px) scale(1.5);opacity:0}}
:global(.bubble){animation:bubbleFloat 1.8s ease-in-out infinite}
:global(.bubble.b2){animation-delay:.6s;animation-duration:2.1s}
:global(.bubble.b3){animation-delay:1.1s;animation-duration:1.6s}
:global(.steam){animation:steamRise 1.5s ease-out infinite}
:global(.steam.s2){animation-delay:.4s;animation-duration:1.9s}
:global(.steam.s3){animation-delay:.8s;animation-duration:1.7s}

.slots-row{display:flex;gap:10px;align-items:center}
.slot{width:62px;height:62px;border-radius:16px;border:2px dashed rgba(255,255,255,0.18);background:rgba(255,255,255,0.03);display:flex;align-items:center;justify-content:center;position:relative;transition:border-color .25s,box-shadow .25s,transform .15s;cursor:default}
.slot.filled{border:2px solid var(--sg,#a29bfe);box-shadow:0 0 14px var(--sg,rgba(162,155,254,0.5));cursor:pointer;background:rgba(162,155,254,0.06)}
.slot.filled:hover{transform:scale(1.06)}
.slot-num{font-size:1.1rem;color:rgba(255,255,255,0.2);font-weight:bold}
.slot-icon{width:44px;height:44px;display:flex;align-items:center;justify-content:center}
.slot-x{position:absolute;top:2px;right:4px;font-size:.52rem;color:rgba(255,255,255,0.25);opacity:0;transition:opacity .2s}
.slot.filled:hover .slot-x{opacity:1}

.brew-btn{
    display:flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    padding:12px 24px;
    background:linear-gradient(135deg,#6c5ce7,#a29bfe);
    border:none;
    border-radius:14px;
    color:white;
    font-size:.95rem;
    font-weight:800;
    cursor:pointer;
    box-shadow:0 6px 22px rgba(108,92,231,0.55);
    transition:transform .15s,box-shadow .2s,background .3s;
    width:100%;
    max-width:260px;
}
.brew-btn:hover:not(:disabled){transform:scale(1.03);box-shadow:0 8px 28px rgba(108,92,231,0.75)}
.brew-btn.danger{background:linear-gradient(135deg,#e17055,#d63031);box-shadow:0 6px 22px rgba(231,76,60,0.55);animation:dangerPulse 1s ease-in-out infinite}
@keyframes dangerPulse{0%,100%{box-shadow:0 6px 22px rgba(231,76,60,0.55)}50%{box-shadow:0 8px 30px rgba(231,76,60,0.85)}}
.brew-btn:active:not(:disabled){transform:scale(0.97)}
.brew-btn:disabled{opacity:.35;cursor:not-allowed;background:rgba(255,255,255,0.08);box-shadow:none}

.spin-icon{animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

.picker-wrap{width:100%}
.picker-label{margin:0 0 7px;font-size:.7rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:.7px;font-weight:700}
.no-ings{font-size:.75rem;color:rgba(255,255,255,0.35);text-align:center;padding:16px;line-height:1.4}
.picker-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:7px}
.picker-item{position:relative;background:rgba(255,255,255,0.04);border:1.5px solid var(--bc,rgba(255,255,255,0.1));border-radius:12px;padding:5px 4px 4px;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;transition:box-shadow .2s,transform .15s,opacity .2s}
.picker-item:hover:not(.depleted):not(.all-full){box-shadow:0 0 12px var(--bc,transparent);transform:scale(1.08)}
.picker-item.depleted{opacity:.25;cursor:not-allowed}
.picker-item.all-full{opacity:.4;cursor:not-allowed}
.picker-icon{width:32px;height:32px;display:flex;align-items:center;justify-content:center}
.picker-cnt{font-size:.62rem;font-weight:bold;color:rgba(255,255,255,0.7)}
.picker-used{position:absolute;top:1px;right:2px;background:rgba(231,76,60,0.85);color:white;font-size:.5rem;font-weight:bold;border-radius:5px;padding:0 3px;line-height:1.4}

.recipe-book{display:flex;flex-direction:column;gap:12px;padding:16px 14px 20px;overflow-y:auto;max-height:85vh}
.recipe-book::-webkit-scrollbar{width:4px}.recipe-book::-webkit-scrollbar-thumb{background:rgba(162,155,254,0.3);border-radius:10px}

.book-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
}

.book-title{display:flex;align-items:center;gap:8px;font-size:.82rem;font-weight:800;color:#f1c40f;text-transform:uppercase;letter-spacing:.8px}
.book-sub{font-size:0.72rem;color:#8395a7;font-weight:700}

.recipe-entry{background:linear-gradient(135deg,rgba(255,255,255,0.03),rgba(162,155,254,0.03));border:1.5px solid rgba(255,255,255,0.08);border-radius:16px;padding:13px;display:flex;flex-direction:column;gap:9px;transition:border-color .3s,box-shadow .3s}
.recipe-entry:hover{border-color:var(--acc,rgba(162,155,254,0.3));box-shadow:0 4px 16px rgba(0,0,0,0.4)}
.recipe-head{display:flex;align-items:center;gap:10px}
.r-pot-icon{width:38px;height:46px;flex-shrink:0;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 7px rgba(255,255,255,0.25))}
.r-pot-info{flex:1}
.r-pot-name{font-size:.88rem;font-weight:bold;color:white}
.r-rarity{font-size:.62rem;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
.r-ok{background:rgba(0,184,148,0.2);border:1px solid #00b894;color:#00b894;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center}
.recipe-row{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.rp{font-size:.95rem;color:rgba(255,255,255,0.28);font-weight:bold}
.r-ing{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center}
.r-ing.revealed{background:rgba(255,255,255,0.04);border:1.5px solid;transition:transform .15s}
.r-ing.revealed:hover{transform:scale(1.1)}
.r-ing.hidden{background:rgba(255,255,255,0.03);border:1.5px dashed rgba(255,255,255,0.18);font-size:.7rem;color:rgba(255,255,255,0.35);font-weight:bold}
.r-ing-icon{width:26px;height:26px;display:flex;align-items:center;justify-content:center}
.r-result{width:34px;height:42px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 6px rgba(162,155,254,0.4))}

.hint-actions-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    align-self: flex-start;
}

.hint-btn {
    padding: 6px 11px;
    border-radius: 10px;
    font-size: 0.74rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}
.hint-btn:active:not(:disabled) {
    transform: scale(0.97);
}

.crystal-hint-btn {
    background: rgba(116, 185, 255, 0.1);
    border: 1px solid rgba(116, 185, 255, 0.35);
    color: #74b9ff;
}
.crystal-hint-btn:hover:not(:disabled) {
    background: rgba(116, 185, 255, 0.2);
    box-shadow: 0 0 12px rgba(116, 185, 255, 0.35);
    transform: translateY(-1px);
}
.crystal-hint-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    border-color: rgba(255, 255, 255, 0.1);
}

.ad-hint-btn {
    background: linear-gradient(135deg, rgba(255, 107, 129, 0.16), rgba(255, 71, 87, 0.12));
    border: 1px solid rgba(255, 107, 129, 0.45);
    color: #ff7675;
}
.ad-hint-btn:hover {
    background: linear-gradient(135deg, rgba(255, 107, 129, 0.26), rgba(255, 71, 87, 0.22));
    box-shadow: 0 0 12px rgba(255, 107, 129, 0.4);
    transform: translateY(-1px);
}

.hint-ad-pill {
    background: #ff4757;
    color: #ffffff;
    font-size: 0.6rem;
    font-weight: 900;
    padding: 1px 5px;
    border-radius: 4px;
    letter-spacing: 0.5px;
}

.hint-step-tag {
    font-size: 0.68rem;
    opacity: 0.75;
}

.r-desc{font-size:.72rem;color:rgba(255,255,255,0.6);font-style:italic;padding:4px 8px;background:rgba(0,184,148,0.08);border-left:2px solid #00b894;border-radius:0 6px 6px 0}

.quick-brew-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 7px 14px;
    background: linear-gradient(135deg, #2ed573, #10ac84);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    color: #042410;
    font-size: 0.78rem;
    font-weight: 800;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
    align-self: flex-start;
    box-shadow: 0 3px 10px rgba(46, 213, 115, 0.3);
}
.quick-brew-btn:hover:not(:disabled) {
    transform: scale(1.04);
    box-shadow: 0 4px 14px rgba(46, 213, 115, 0.5);
}
.quick-brew-btn:disabled {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
    color: #8395a7;
    cursor: not-allowed;
    box-shadow: none;
}

.toast{
    position:absolute;
    bottom:16px;
    left:50%;
    transform:translateX(-50%);
    padding:10px 20px;
    border-radius:14px;
    font-size:.88rem;
    font-weight:bold;
    z-index:100;
    pointer-events:none;
    animation:toastIn .3s ease;
    max-width:88%;
    box-shadow:0 8px 24px rgba(0,0,0,0.6);
    display:flex;
    align-items:center;
    gap:8px;
}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.toast-success{background:linear-gradient(135deg,rgba(0,184,148,0.95),rgba(0,206,201,0.92));color:white}
.toast-warning{background:linear-gradient(135deg,rgba(253,203,0,0.95),rgba(225,112,85,0.92));color:#2d0a00}
.toast-burn{background:linear-gradient(135deg,rgba(231,76,60,0.95),rgba(192,57,43,0.92));color:white}

.overheat-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    background: linear-gradient(135deg, rgba(231, 76, 60, 0.2) 0%, rgba(214, 48, 49, 0.12) 100%);
    border: 1px solid rgba(231, 76, 60, 0.55);
    border-radius: 14px;
    padding: 8px 12px;
    box-sizing: border-box;
    animation: overheatGlow 1.8s ease-in-out infinite alternate;
}
@keyframes overheatGlow {
    0% { box-shadow: 0 0 8px rgba(231, 76, 60, 0.2); }
    100% { box-shadow: 0 0 18px rgba(231, 76, 60, 0.45); }
}

.overheat-info {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}
.flame-pulse {
    animation: flamePulse 1s ease-in-out infinite alternate;
}
@keyframes flamePulse {
    0% { transform: scale(0.92); }
    100% { transform: scale(1.08); }
}
.overheat-text-col {
    display: flex;
    flex-direction: column;
    gap: 1px;
}
.overheat-title {
    font-size: 0.74rem;
    font-weight: 800;
    color: #ff7675;
}
.overheat-timer {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.85);
}
.overheat-timer strong {
    color: #ffeaa7;
}

.overheat-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
}
.cooldown-ad-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 8px;
    background: linear-gradient(135deg, rgba(116, 185, 255, 0.25) 0%, rgba(9, 132, 227, 0.15) 100%);
    border: 1px solid rgba(116, 185, 255, 0.5);
    color: #74b9ff;
    font-size: 0.7rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
}
.cooldown-ad-btn:hover {
    background: rgba(116, 185, 255, 0.35);
    transform: scale(1.04);
}
.cooldown-crystal-btn {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 4px 8px;
    border-radius: 8px;
    background: linear-gradient(135deg, rgba(241, 196, 15, 0.2) 0%, rgba(243, 156, 18, 0.12) 100%);
    border: 1px solid rgba(241, 196, 15, 0.45);
    color: #ffeaa7;
    font-size: 0.72rem;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s ease;
}
.cooldown-crystal-btn:hover {
    background: rgba(241, 196, 15, 0.32);
    transform: scale(1.04);
}

.mastery-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: rgba(241, 196, 15, 0.08);
    border: 1px solid rgba(241, 196, 15, 0.22);
    border-radius: 12px;
    color: #ffeaa7;
    font-size: 0.72rem;
    font-weight: 700;
    margin-bottom: 2px;
}
.mastery-sub {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.66rem;
    font-weight: 600;
}

.brew-btn.overheated {
    background: rgba(231, 76, 60, 0.2);
    border: 1px solid rgba(231, 76, 60, 0.4);
    color: #ff7675;
    cursor: not-allowed;
    box-shadow: none;
}

.picker-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
}
.clear-all-btn {
    background: transparent;
    border: none;
    color: #ff7675;
    font-size: 0.68rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
}
.clear-all-btn:hover {
    color: #ff4757;
}

.rarity-filter-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
    overflow-x: auto;
}
.rf-tab {
    padding: 3px 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.68rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
}
.rf-tab:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}
.rf-tab.active {
    background: rgba(162, 155, 254, 0.25);
    border-color: #a29bfe;
    color: #fff;
    box-shadow: 0 0 8px rgba(162, 155, 254, 0.3);
}
.rf-tab.common.active { border-color: #b2bec3; color: #dfe6e9; }
.rf-tab.rare.active { border-color: #74b9ff; color: #74b9ff; }
.rf-tab.epic.active { border-color: #a29bfe; color: #a29bfe; }
.rf-tab.legendary.active { border-color: #f1c40f; color: #f1c40f; }

.steam.intense {
    filter: drop-shadow(0 0 6px rgba(255, 71, 87, 0.6));
    animation: intenseSteam 1.2s ease-out infinite;
}
@keyframes intenseSteam {
    0% { transform: translateY(0) scale(1); opacity: 0.65; }
    100% { transform: translateY(-18px) scale(1.6); opacity: 0; }
}
</style>
