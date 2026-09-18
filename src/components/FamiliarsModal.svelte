<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import gsap from 'gsap';
    import { get } from 'svelte/store';
    import { 
        gameStore, 
        crystals, 
        AVAILABLE_PETS, 
        type Pet, 
        type ActiveExpedition, 
        openChest, 
        formatNumber,
        getExpeditionSkipCost,
        currentIdleIncome
    } from '../store';
    import { t, currentLang, getPetName, getPetDesc } from '../i18n';
    import { getPetAuraDetails } from '../petBonuses';
    import { showRewardedAd, saveGame } from '../yandex-sdk';
    import { playSuccessSound, playLevelUpSound, playCoinSound, playCauldronBubble } from '../audio';
    import ResourceIcon from './ResourceIcon.svelte';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void;

    interface RollOutcome {
        pet: Pet;
        type: 'new' | 'upgrade' | 'max_refund';
        level: number;
    }

    let activeTab: 'pets' | 'gacha' = 'pets';
    let isSummoning = false;
    let showResult = false;
    let rolledPet: Pet | null = null;
    let rollType: 'new' | 'upgrade' | 'max_refund' = 'new';
    let newLevelReached = 1;
    let isMultiRoll = false;
    let multiResults: RollOutcome[] = [];
    let eggElement: HTMLElement;
    let resultElement: HTMLElement;

    let toastMessage: string | null = null;
    let toastTimer: number;

    const GACHA_COST_1 = 100;
    const GACHA_COST_5 = 450;

    function showToast(msg: string) {
        toastMessage = msg;
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => {
            toastMessage = null;
        }, 2500);
    }

    $: unlockedPets = AVAILABLE_PETS.filter(p => $gameStore.unlockedPets.includes(p.id));
    $: rollablePets = AVAILABLE_PETS.filter(p => !p.isCollectionExclusive);
    $: lockedPets = rollablePets.filter(p => !$gameStore.unlockedPets.includes(p.id));
    $: activeExps = $gameStore.activeExpeditions;
    $: jackpotPets = AVAILABLE_PETS.filter(p => p.rarity === 'legendary' && !p.isCollectionExclusive);

    // Timers update
    let now = Date.now();
    let timerInterval: number;

    onMount(() => {
        timerInterval = setInterval(() => {
            now = Date.now();
        }, 1000);
    });

    onDestroy(() => {
        if (timerInterval) clearInterval(timerInterval);
    });

    function getExpeditionTimeRemaining(exp: ActiveExpedition) {
        const end = exp.startTime + exp.durationMs;
        const diff = end - now;
        return diff > 0 ? diff : 0;
    }

    function getExpeditionProgress(exp: ActiveExpedition) {
        const elapsed = now - exp.startTime;
        const progress = Math.min(100, Math.max(0, (elapsed / exp.durationMs) * 100));
        return progress;
    }

    function formatTime(ms: number) {
        if (ms <= 0) return get(t)('common.ready');
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) return `${hours} ${get(t)('common.hour')} ${minutes} ${get(t)('common.min')}`;
        return `${minutes} ${get(t)('common.min')} ${seconds} ${get(t)('common.sec')}`;
    }


    function rollGacha(count: 1 | 5 = 1) {
        if (isSummoning || showResult) return;
        const cost = count === 5 ? GACHA_COST_5 : GACHA_COST_1;
        if ($crystals < cost) {
            showToast(get(t)('familiars.notEnoughCrystalsSummon'));
            const btnSelector = count === 5 ? '.cta-multi' : '.cta-single';
            const targetBtn = document.querySelector(btnSelector);
            if (targetBtn) {
                gsap.fromTo(targetBtn, 
                    { x: -10 }, 
                    { x: 10, duration: 0.08, yoyo: true, repeat: 5, onComplete: () => gsap.set(targetBtn, { x: 0 }) }
                );
            }
            return;
        }

        const rollablePool = AVAILABLE_PETS.filter(p => !p.isCollectionExclusive);
        if (rollablePool.length === 0) return;

        // Deduct crystals
        crystals.update(c => c - cost);

        // Track simulated state for sequential rolls
        const simUnlocked = new Set($gameStore.unlockedPets);
        const simLevels: Record<string, number> = { ...($gameStore.petLevels || {}) };

        const outcomes: RollOutcome[] = [];

        for (let i = 0; i < count; i++) {
            // Weighted roll: Common 55%, Rare 28%, Epic 13%, Legendary 4%
            const rand = Math.random() * 100;
            let targetRarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common';
            if (rand < 4) {
                targetRarity = 'legendary';
            } else if (rand < 17) {
                targetRarity = 'epic';
            } else if (rand < 45) {
                targetRarity = 'rare';
            } else {
                targetRarity = 'common';
            }

            let candidates = rollablePool.filter(p => p.rarity === targetRarity);
            if (candidates.length === 0) candidates = rollablePool;
            const pet = candidates[Math.floor(Math.random() * candidates.length)];

            const isUnlocked = simUnlocked.has(pet.id);
            const curLvl = simLevels[pet.id] || (isUnlocked ? 1 : 0);

            let outcomeType: 'new' | 'upgrade' | 'max_refund';
            let resLvl: number;

            if (!isUnlocked) {
                outcomeType = 'new';
                resLvl = 1;
                simUnlocked.add(pet.id);
                simLevels[pet.id] = 1;
            } else if (curLvl < 10) {
                outcomeType = 'upgrade';
                resLvl = curLvl + 1;
                simLevels[pet.id] = resLvl;
            } else {
                outcomeType = 'max_refund';
                resLvl = 10;
            }

            outcomes.push({ pet, type: outcomeType, level: resLvl });
        }

        isSummoning = true;
        isMultiRoll = (count === 5);
        rolledPet = null;
        multiResults = [];
        playCauldronBubble();

        // Egg ritual animation on the sacred altar
        if (eggElement) {
            gsap.timeline()
                .set(eggElement, { scale: 1, rotation: 0, x: 0, opacity: 1 })
                .to(eggElement, { rotation: -10, x: -4, duration: 0.08, yoyo: true, repeat: 5 })
                .to(eggElement, { rotation: 12, x: 5, scale: 1.15, duration: 0.07, yoyo: true, repeat: 6 })
                .to(eggElement, { scale: 1.35, duration: 0.22, ease: 'power2.in' })
                .to(eggElement, { scale: 0.1, opacity: 0, duration: 0.14, ease: 'back.in(2)', onComplete: () => {
                    // Apply mutations
                    let hasLegendary = false;
                    let hasUpgrade = false;

                    for (const out of outcomes) {
                        if (out.pet.rarity === 'legendary') hasLegendary = true;
                        if (out.type === 'new') {
                            gameStore.unlockPet(out.pet.id);
                        } else if (out.type === 'upgrade') {
                            gameStore.upgradePet(out.pet.id);
                            hasUpgrade = true;
                        } else if (out.type === 'max_refund') {
                            crystals.update(c => c + 50);
                        }
                    }

                    if (hasLegendary) {
                        playSuccessSound();
                    } else if (hasUpgrade) {
                        playLevelUpSound();
                    } else {
                        playSuccessSound();
                    }
                    saveGame();

                    if (count === 1) {
                        rolledPet = outcomes[0].pet;
                        rollType = outcomes[0].type;
                        newLevelReached = outcomes[0].level;
                    } else {
                        multiResults = outcomes;
                    }

                    isSummoning = false;
                    showResult = true;

                    setTimeout(() => {
                        if (resultElement) {
                            gsap.fromTo(resultElement, 
                                { scale: 0.35, opacity: 0, y: 25 },
                                { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: 'back.out(1.3)' }
                            );
                        }
                    }, 50);
                }});
        }
    }

    function closeGachaResult() {
        showResult = false;
        isSummoning = false;
        rolledPet = null;
        multiResults = [];
        isMultiRoll = false;
        setTimeout(() => {
            if (eggElement) {
                gsap.fromTo(eggElement, 
                    { scale: 0, opacity: 0 },
                    { scale: 1, opacity: 1, rotation: 0, x: 0, duration: 0.4, ease: 'elastic.out(1, 0.6)' }
                );
            }
        }, 50);
    }

    function startExpedition(petId: string) {
        const pet = AVAILABLE_PETS.find(p => p.id === petId);
        if (!pet) return;
        
        const hours = pet.expeditionHours || 2;
        gameStore.startExpedition(petId, hours);
        showToast(get(t)('familiars.expeditionSent', { name: getPetName(pet.id, get(currentLang)), hours }));
        saveGame();
    }

    function speedUpExpedition(petId: string) {
        showRewardedAd(() => {
            gameStore.speedUpExpedition(petId, 2); // Reduce by 2 hours
            gameStore.updateQuestProgress('watch_ads', 1);
            showToast(get(t)('familiars.expeditionSpeedUpToast'));
            saveGame();
        }, () => {});
    }

    function instantSkipExpedition(petId: string, timeRem: number) {
        const cost = getExpeditionSkipCost(timeRem);
        if ($crystals < cost) {
            showToast(get(t)('familiars.notEnoughCrystalsCost', { cost }));
            return;
        }

        crystals.update(c => c - cost);
        gameStore.completeExpeditionInstantly(petId);
        showToast(get(t)('familiars.expeditionInstantComplete'));
        saveGame();
    }

    function claimExpedition(petId: string) {
        const pet = AVAILABLE_PETS.find(p => p.id === petId);
        gameStore.claimExpedition(petId);
        
        let chestType: 'wooden' | 'magical' | 'astral' = 'wooden';
        if (pet?.rarity === 'rare') chestType = 'wooden';
        if (pet?.rarity === 'epic') chestType = 'magical';
        if (pet?.rarity === 'legendary') chestType = 'astral';
        
        openChest(chestType);
        let crystalGain = 1;
        if (pet?.rarity === 'epic') crystalGain = 3;
        if (pet?.rarity === 'legendary') crystalGain = 5;
        if (petId === 'pet_void_titan') crystalGain = 8;

        const petLevel = ($gameStore.petLevels && $gameStore.petLevels[petId]) || 1;
        // Level bonus: extra crystals for high level pets
        const bonusCrystals = Math.floor((petLevel - 1) * 0.5);
        const totalCrystals = crystalGain + bonusCrystals;

        // Dynamic gold reward based on shop's idle income, expedition length, and +15% per pet level:
        const idle = get(currentIdleIncome) || 0;
        const expHours = pet?.expeditionHours || 2;
        const baseGold = Math.max(5000, Math.round(idle * expHours * 300));
        const lootMult = 1 + (petLevel - 1) * 0.15;
        const awardedGold = Math.round(baseGold * lootMult);
        gameStore.addGold(awardedGold);

        crystals.update(c => c + totalCrystals);
        playSuccessSound();
        showToast(get(t)('familiars.expeditionLootToast', { gold: formatNumber(awardedGold), crystals: totalCrystals }));
        saveGame();
    }

    function setCompanion(petId: string) {
        gameStore.setActiveCompanion(petId);
        playCoinSound();
        const pet = AVAILABLE_PETS.find(p => p.id === petId);
        showToast(get(t)('familiars.companionAssigned', { name: pet ? getPetName(pet.id, get(currentLang)) : '' }));
        saveGame();
    }

    $: RARITY_NAMES = {
        common: $t('rarity.common'),
        rare: $t('rarity.rare'),
        epic: $t('rarity.epic'),
        legendary: $t('rarity.legendary')
    };
</script>

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key-events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" class:embedded={isEmbedded} on:click={onClose}>
    <!-- svelte-ignore a11y_click_events_have_key-events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal" class:embedded-modal={isEmbedded} on:click|stopPropagation>

        <!-- Toast Feedback -->
        {#if toastMessage}
            <div class="pet-toast">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#2ed573" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>{toastMessage}</span>
            </div>
        {/if}

        {#if !isEmbedded}
            <div class="modal-header">
                <div class="header-icon">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="#ffd700">
                        <path d="M12 3C8 3 4.5 5.5 3 9c-1.5 3.5 0 8 3 10.5 1.5 1.2 3.5 1.5 5 1 .5 1.5 1.8 2.5 3.5 2.5 2 0 3.5-1.5 3.5-3.5 0-.5-.1-1-.3-1.5 2.8-1 4.8-3.5 5.3-6.5C24 6 18 3 12 3z"/>
                    </svg>
                </div>
                <div class="header-text">
                    <h2>{$t('familiars.title')}</h2>
                    <p class="header-sub">{$t('city.expeditionsTitle')}</p>
                </div>
                <button class="close-btn" on:click={onClose}>✕</button>
            </div>
            
            <div class="balance-row">
                <div class="balance-chip crystal">
                    <ResourceIcon type="crystals" size={14} />
                    <span>{formatNumber($crystals)} {$t('common.crystals')}</span>
                </div>
            </div>
        {/if}
        
        <!-- Sub Tabs -->
        <div class="sub-tabs">
            <button 
                class="sub-tab" 
                class:active={activeTab === 'pets'} 
                on:click={() => activeTab = 'pets'}
            >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12 3C8 3 4.5 5.5 3 9c-1.5 3.5 0 8 3 10.5 1.5 1.2 3.5 1.5 5 1 .5 1.5 1.8 2.5 3.5 2.5 2 0 3.5-1.5 3.5-3.5 0-.5-.1-1-.3-1.5 2.8-1 4.8-3.5 5.3-6.5C24 6 18 3 12 3z"/>
                </svg>
                <span>{$t('familiars.myPets')}</span>
                <span class="sub-pill">{unlockedPets.length}/{AVAILABLE_PETS.length}</span>
            </button>
            <button 
                class="sub-tab" 
                class:active={activeTab === 'gacha'} 
                on:click={() => activeTab = 'gacha'}
            >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M12 7v10M7 12h10"/>
                </svg>
                <span>{$t('familiars.magicSummon')}</span>
            </button>
        </div>

        <div class="tab-content">
            {#if activeTab === 'pets'}
                <div class="pets-list">
                    {#if unlockedPets.length === 0}
                        <div class="empty-state">
                            <svg viewBox="0 0 48 48" width="56" height="56" fill="none" stroke="#718093" stroke-width="1.8">
                                <circle cx="24" cy="24" r="20"/>
                                <path d="M16 20h2M30 20h2M18 30c2 3 10 3 12 0"/>
                            </svg>
                            <p class="empty-title">{$t('familiars.emptyTitle')}</p>
                            <p class="empty-sub">{$t('familiars.emptySub')}</p>
                        </div>
                    {:else}
                        {#each unlockedPets as pet (pet.id)}
                            {@const exp = activeExps.find(e => e.petId === pet.id)}
                            {@const timeRem = exp ? getExpeditionTimeRemaining(exp) : 0}
                            {@const isExpActive = !!exp}
                            {@const isExpDone = isExpActive && timeRem <= 0}
                            {@const progress = exp ? getExpeditionProgress(exp) : 0}
                            {@const petLevel = ($gameStore.petLevels && $gameStore.petLevels[pet.id]) || 1}
                            {@const aura = getPetAuraDetails(pet.id, petLevel, $currentLang)}
                            
                            <div class="pet-card {pet.rarity}">
                                <div class="pet-icon-box">
                                    <div class="pet-svg-wrap">{@html pet.icon}</div>
                                    <span class="rarity-badge {pet.rarity}">{RARITY_NAMES[pet.rarity]}</span>
                                    <span class="pet-level-badge" class:max-level={petLevel >= 10}>{$t('common.levelShort')} {petLevel}</span>
                                </div>
                                
                                <div class="pet-info">
                                    <div class="pet-name-line">
                                        <h3 class="pet-title">{getPetName(pet.id, $currentLang)}</h3>
                                        {#if isExpDone}
                                            <span class="status-chip ready-chip">{$t('familiars.readyToClaim')}</span>
                                        {:else if isExpActive}
                                            <span class="status-chip active-chip">{$t('familiars.inExpedition')}</span>
                                        {:else}
                                            <span class="status-chip idle-chip">{$t('familiars.inAbode')}</span>
                                        {/if}
                                    </div>
                                    <p class="pet-desc">{getPetDesc(pet.id, $currentLang)}</p>
                                    
                                    <!-- Pet Level Perks -->
                                    <div class="pet-perks-row">
                                        <span class="pet-perk-tag loot-tag">{$t('familiars.lootBonus', { pct: Math.min(135, (petLevel - 1) * 15) })}</span>
                                        <span class="pet-perk-tag time-tag">{$t('familiars.timeBonus', { pct: Math.min(36, (petLevel - 1) * 4) })}</span>
                                        {#if petLevel >= 10}
                                            <span class="pet-perk-tag max-tag">{$t('familiars.maxLevel')}</span>
                                        {/if}
                                    </div>

                                    <!-- Companion Passive Aura Box -->
                                    <div class="companion-aura-box" class:legendary-aura={aura.isLegendary} class:aura-active={$gameStore.activeCompanionId === pet.id}>
                                        <div class="aura-top-line">
                                            <div class="aura-tag-group">
                                                <svg viewBox="0 0 24 24" width="13" height="13" class="aura-sparkle-icon" fill="currentColor">
                                                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z"/>
                                                </svg>
                                                <span class="aura-type-label">{$t('familiars.auraTitle')}</span>
                                                {#if aura.isLegendary}
                                                    <span class="aura-legendary-pill">{$t('familiars.legendaryAuraBadge')}</span>
                                                {/if}
                                            </div>
                                            {#if $gameStore.activeCompanionId === pet.id}
                                                <span class="aura-status-badge active-status">{$t('familiars.auraActive')}</span>
                                            {:else}
                                                <span class="aura-status-badge inactive-status">{$t('familiars.auraInactive')}</span>
                                            {/if}
                                        </div>

                                        <div class="aura-main-info">
                                            <div class="aura-name-title">{aura.title}</div>
                                            <div class="aura-current-effect">{aura.description}</div>
                                        </div>

                                        {#if petLevel < 10 && aura.nextLevelDescription}
                                            <div class="aura-next-scaling">
                                                <span class="aura-next-label">{$t('familiars.auraLevelNext', { lvl: petLevel + 1, bonus: aura.nextLevelDescription })}</span>
                                            </div>
                                        {:else if petLevel >= 10}
                                            <div class="aura-max-reached">
                                                <span>✨ {$t('familiars.auraMaxNotice')}</span>
                                            </div>
                                        {/if}
                                    </div>

                                    <div class="pet-card-actions">
                                        {#if $gameStore.activeCompanionId === pet.id}
                                            <button class="action-btn companion-btn active" disabled title="Companion">
                                                <svg viewBox="0 0 24 24" width="13" height="13" fill="#ffd700">
                                                    <polygon points="12,2 15,8.5 22,9.3 17,14 18.5,21 12,17.5 5.5,21 7,14 2,9.3 9,8.5"/>
                                                </svg>
                                                <span>{$t('familiars.inShop')}</span>
                                            </button>
                                        {:else}
                                            <button class="action-btn companion-btn" on:click={() => setCompanion(pet.id)} title="Set as companion">
                                                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                                                    <polygon points="12,2 15,8.5 22,9.3 17,14 18.5,21 12,17.5 5.5,21 7,14 2,9.3 9,8.5"/>
                                                </svg>
                                                <span>{$t('familiars.takeToShop')}</span>
                                            </button>
                                        {/if}

                                        {#if isExpDone}
                                            <button class="action-btn claim-btn" on:click={() => claimExpedition(pet.id)}>
                                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                                {$t('familiars.claimReward')}
                                            </button>
                                        {:else if !isExpActive}
                                            <button class="action-btn start-btn" on:click={() => startExpedition(pet.id)}>
                                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                                    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                                                </svg>
                                                <span>{$t('familiars.startExpedition', { hours: pet.expeditionHours || 2 })}</span>
                                            </button>
                                        {/if}
                                    </div>

                                    {#if isExpActive && !isExpDone}
                                        <div class="exp-progress-container">
                                            <div class="exp-meta">
                                                <span class="exp-timer">
                                                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                                                        <circle cx="12" cy="12" r="9"/>
                                                        <polyline points="12 7 12 12 15 14"/>
                                                    </svg>
                                                    {formatTime(timeRem)}
                                                </span>
                                                <span class="exp-pct">{Math.round(progress)}%</span>
                                            </div>
                                            <div class="exp-bar">
                                                <div class="exp-fill" style="width: {progress}%"></div>
                                            </div>
                                        </div>

                                        {@const skipCost = getExpeditionSkipCost(timeRem)}
                                        <div class="exp-actions-row">
                                            <button 
                                                class="action-btn speed-btn" 
                                                on:click={() => speedUpExpedition(pet.id)}
                                                title={$t('common.speedUpAd')}
                                            >
                                                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                                                    <polygon points="5,3 19,12 5,21"/>
                                                </svg>
                                                <span>{$t('familiars.speedUp2h')}</span>
                                                <span class="exp-ad-tag">{$t('common.ad')}</span>
                                            </button>

                                            <button 
                                                class="action-btn skip-crystal-btn" 
                                                disabled={$crystals < skipCost}
                                                on:click={() => instantSkipExpedition(pet.id, timeRem)}
                                                title={$t('familiars.instantReturn', { cost: skipCost })}
                                            >
                                                <ResourceIcon type="crystals" size={13} />
                                                <span>{$t('familiars.instantReturn', { cost: skipCost })}</span>
                                            </button>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
            {:else if activeTab === 'gacha'}
                <div class="gacha-container">
                    {#if !showResult}
                        <!-- Grand Jackpot Showcase -->
                        <div class="gacha-jackpot-showcase" class:dimmed={isSummoning}>
                            <div class="jackpot-header">
                                <svg viewBox="0 0 24 24" width="16" height="16" class="jackpot-crown-icon" fill="#ffd700">
                                    <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V17H19V19Z"/>
                                </svg>
                                <span class="jackpot-title">{$t('familiars.jackpotTitle')}</span>
                            </div>
                            <div class="jackpot-cards-row">
                                {#each jackpotPets as jpPet (jpPet.id)}
                                    {@const jpAura = getPetAuraDetails(jpPet.id, 1, $currentLang)}
                                    <div class="jackpot-card">
                                        <div class="jackpot-icon-wrap">
                                            <div class="jackpot-svg">{@html jpPet.icon}</div>
                                            <span class="jackpot-badge">{RARITY_NAMES[jpPet.rarity]}</span>
                                        </div>
                                        <div class="jackpot-info">
                                            <div class="jackpot-name">{getPetName(jpPet.id, $currentLang)}</div>
                                            <div class="jackpot-aura-desc">
                                                <span class="aura-icon-star">✦</span>
                                                <span>{jpAura.title}: {jpAura.description}</span>
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>

                        <!-- Sacred Altar of Summoning -->
                        <div class="gacha-altar-stage" class:ritual-active={isSummoning}>
                            <!-- Outer Runic Orbit SVG -->
                            <div class="altar-orbit altar-orbit-outer" class:orbit-accelerate={isSummoning}>
                                <svg viewBox="0 0 200 200" width="100%" height="100%">
                                    <defs>
                                        <linearGradient id="orbitGradOuter" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stop-color="#fd79a8" stop-opacity="0.8"/>
                                            <stop offset="50%" stop-color="#a29bfe" stop-opacity="0.4"/>
                                            <stop offset="100%" stop-color="#00cec9" stop-opacity="0.9"/>
                                        </linearGradient>
                                    </defs>
                                    <circle cx="100" cy="100" r="92" fill="none" stroke="url(#orbitGradOuter)" stroke-width="1.8" stroke-dasharray="8, 6, 2, 6"/>
                                    <!-- Orbit Glyphs -->
                                    <circle cx="100" cy="8" r="3.5" fill="#f1c40f"/>
                                    <circle cx="192" cy="100" r="3.5" fill="#00cec9"/>
                                    <circle cx="100" cy="192" r="3.5" fill="#fd79a8"/>
                                    <circle cx="8" cy="100" r="3.5" fill="#a29bfe"/>
                                </svg>
                            </div>

                            <!-- Inner Counter-rotating Orbit SVG -->
                            <div class="altar-orbit altar-orbit-inner" class:orbit-accelerate-counter={isSummoning}>
                                <svg viewBox="0 0 160 160" width="100%" height="100%">
                                    <defs>
                                        <linearGradient id="orbitGradInner" x1="100%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stop-color="#f1c40f" stop-opacity="0.7"/>
                                            <stop offset="50%" stop-color="#e056fd" stop-opacity="0.3"/>
                                            <stop offset="100%" stop-color="#74b9ff" stop-opacity="0.8"/>
                                        </linearGradient>
                                    </defs>
                                    <circle cx="80" cy="80" r="72" fill="none" stroke="url(#orbitGradInner)" stroke-width="1.5" stroke-dasharray="14, 8"/>
                                    <polygon points="80,10 83,16 77,16" fill="#f1c40f"/>
                                    <polygon points="150,80 144,83 144,77" fill="#f1c40f"/>
                                    <polygon points="80,150 77,144 83,144" fill="#f1c40f"/>
                                    <polygon points="10,80 16,77 16,83" fill="#f1c40f"/>
                                </svg>
                            </div>

                            <!-- Altar Pedestal Base -->
                            <div class="altar-pedestal">
                                <svg viewBox="0 0 140 32" width="140" height="32">
                                    <defs>
                                        <linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stop-color="#2c1a4d"/>
                                            <stop offset="100%" stop-color="#0f071e"/>
                                        </linearGradient>
                                    </defs>
                                    <ellipse cx="70" cy="16" rx="66" ry="12" fill="url(#pedestalGrad)" stroke="rgba(241, 196, 15, 0.4)" stroke-width="1.5"/>
                                    <ellipse cx="70" cy="14" rx="52" ry="8" fill="rgba(108, 92, 231, 0.25)" stroke="rgba(162, 155, 254, 0.3)" stroke-width="1"/>
                                </svg>
                            </div>

                            <!-- Draconic Elemental Egg -->
                            <div class="gacha-draconic-egg" class:egg-ritual={isSummoning} bind:this={eggElement}>
                                {#if isSummoning}
                                    <div class="ritual-flare-halo"></div>
                                {/if}
                                <svg viewBox="0 0 120 140" width="120" height="140">
                                    <defs>
                                        <radialGradient id="eggShellGlow" cx="42%" cy="36%" r="65%">
                                            <stop offset="0%" stop-color="#ffd56b"/>
                                            <stop offset="25%" stop-color="#e056fd"/>
                                            <stop offset="65%" stop-color="#4834d4"/>
                                            <stop offset="100%" stop-color="#130f40"/>
                                        </radialGradient>
                                        <linearGradient id="eggGoldTrim" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stop-color="#ffeaa7"/>
                                            <stop offset="50%" stop-color="#fdcb6e"/>
                                            <stop offset="100%" stop-color="#e17055"/>
                                        </linearGradient>
                                        <filter id="eggAuraGlow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="5" result="blur"/>
                                            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                                        </filter>
                                    </defs>
                                    <!-- Egg Glow Aura -->
                                    <path d="M 60 14 C 90 14, 106 54, 102 90 C 98 116, 82 128, 60 128 C 38 128, 22 116, 18 90 C 14 54, 30 14, 60 14 Z"
                                          fill="rgba(162, 155, 254, 0.22)" filter="url(#eggAuraGlow)" />
                                    <!-- Egg Body -->
                                    <path d="M 60 14 C 90 14, 106 54, 102 90 C 98 116, 82 128, 60 128 C 38 128, 22 116, 18 90 C 14 54, 30 14, 60 14 Z"
                                          fill="url(#eggShellGlow)" stroke="url(#eggGoldTrim)" stroke-width="2.5" />
                                    <!-- Draconic Runes & Scale Veins -->
                                    <path d="M 60 22 Q 68 45 54 70 T 66 110" fill="none" stroke="#ffeaa7" stroke-width="2" stroke-linecap="round" opacity="0.85" />
                                    <path d="M 54 70 Q 38 78 30 96" fill="none" stroke="#00cec9" stroke-width="1.8" stroke-linecap="round" opacity="0.8" />
                                    <path d="M 54 70 Q 76 80 88 100" fill="none" stroke="#fd79a8" stroke-width="1.8" stroke-linecap="round" opacity="0.8" />
                                    <path d="M 44 40 Q 58 50 68 42" fill="none" stroke="#ffeaa7" stroke-width="1.5" opacity="0.75" />
                                    <!-- Shimmer Star -->
                                    <circle cx="48" cy="38" r="10" fill="#ffffff" opacity="0.35" filter="url(#eggAuraGlow)" />
                                    <circle cx="44" cy="34" r="3.5" fill="#ffffff" opacity="0.9" />
                                    <circle cx="53" cy="42" r="1.8" fill="#ffffff" opacity="0.8" />
                                </svg>
                            </div>
                        </div>

                        <!-- Drop Rates Transparency Bar -->
                        <div class="gacha-odds-bar" class:dimmed={isSummoning}>
                            <span class="odd-pill leg-pill">{$t('familiars.ratesLegendary')}</span>
                            <span class="odd-pill epic-pill">{$t('familiars.ratesEpic')}</span>
                            <span class="odd-pill rare-pill">{$t('familiars.ratesRare')}</span>
                            <span class="odd-pill com-pill">{$t('familiars.ratesCommon')}</span>
                        </div>

                        <!-- Dual Summon CTA Buttons Row -->
                        <div class="gacha-actions-row">
                            <button class="gacha-cta-btn cta-single" disabled={isSummoning} on:click={() => rollGacha(1)}>
                                <span class="cta-label">{$t('familiars.summon1Btn')}</span>
                                <div class="cta-price">
                                    <ResourceIcon type="crystals" size={17} />
                                    <span class="price-val">{GACHA_COST_1}</span>
                                </div>
                            </button>
                            
                            <button class="gacha-cta-btn cta-multi" disabled={isSummoning} on:click={() => rollGacha(5)}>
                                <span class="cta-discount-tag">{$t('familiars.discountTag')}</span>
                                <span class="cta-label">{$t('familiars.summon5Btn')}</span>
                                <div class="cta-price">
                                    <span class="old-price">500</span>
                                    <ResourceIcon type="crystals" size={17} />
                                    <span class="price-val gold-val">{GACHA_COST_5}</span>
                                </div>
                            </button>
                        </div>
                    {:else}
                        {#if isMultiRoll && multiResults.length > 0}
                            <!-- 5-Card Multi-Summon Results Celebration Grid -->
                            <div class="gacha-multi-result" bind:this={resultElement}>
                                <div class="multi-header">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="#ffd700">
                                        <polygon points="12,2 15,8.5 22,9.3 17,14 18.5,21 12,17.5 5.5,21 7,14 2,9.3 9,8.5"/>
                                    </svg>
                                    <h2 class="multi-title">{$t('familiars.multiResultTitle')}</h2>
                                </div>

                                <div class="multi-grid">
                                    {#each multiResults as item, idx}
                                        {@const itemAura = getPetAuraDetails(item.pet.id, item.level, $currentLang)}
                                        <div class="multi-card {item.pet.rarity}">
                                            <div class="multi-card-icon">{@html item.pet.icon}</div>
                                            <div class="multi-card-name">{getPetName(item.pet.id, $currentLang)}</div>
                                            <div class="multi-card-rarity {item.pet.rarity}">
                                                {RARITY_NAMES[item.pet.rarity]}
                                            </div>
                                            {#if item.type === 'new'}
                                                <span class="multi-badge new-badge">{$t('familiars.newBadge') || 'NEW!'}</span>
                                            {:else if item.type === 'upgrade'}
                                                <span class="multi-badge up-badge">{$t('common.levelShort')} {item.level}</span>
                                            {:else}
                                                <span class="multi-badge refund-badge">+50 💎</span>
                                            {/if}
                                            <div class="multi-card-aura" title="{itemAura.title}: {itemAura.description}">
                                                ✦ {itemAura.title}
                                            </div>
                                        </div>
                                    {/each}
                                </div>

                                <button class="action-btn claim-btn celebrate-btn" on:click={closeGachaResult}>
                                    {$t('common.ready')}
                                </button>
                            </div>
                        {:else if rolledPet}
                            <!-- Single Result Celebration View -->
                            {@const resAura = getPetAuraDetails(rolledPet.id, newLevelReached, $currentLang)}
                            <div class="gacha-result {rolledPet.rarity}" bind:this={resultElement}>
                                {#if rollType === 'new'}
                                    <span class="result-celebration">{$t('familiars.newCompanionSummoned')}</span>
                                {:else if rollType === 'upgrade'}
                                    <span class="result-celebration upgrade-celebration">{$t('familiars.levelUpCelebration', { level: newLevelReached })}</span>
                                {:else}
                                    <span class="result-celebration max-celebration">{$t('familiars.maxLevelCelebration')}</span>
                                {/if}
                                <div class="result-icon">{@html rolledPet.icon}</div>
                                <h2 class="pet-name">{rolledPet ? getPetName(rolledPet.id, $currentLang) : ''}</h2>
                                <p class="rarity-label {rolledPet.rarity}">{RARITY_NAMES[rolledPet.rarity]} • {$t('common.levelShort')} {newLevelReached}</p>
                                
                                {#if rollType === 'upgrade'}
                                    <div class="upgrade-bonus-notice">
                                        <span>{$t('familiars.efficiencyGrown')}</span>
                                        <strong>{$t('familiars.efficiencyBonusDesc')}</strong>
                                    </div>
                                {:else if rollType === 'max_refund'}
                                    <div class="upgrade-bonus-notice refund-notice">
                                        <span>{$t('familiars.maxLevelReachedDesc')}</span>
                                        <strong>{$t('familiars.compensationDesc')}</strong>
                                    </div>
                                {:else}
                                    <p class="result-desc">{rolledPet.description}</p>
                                {/if}

                                <div class="gacha-aura-preview" class:legendary={resAura.isLegendary}>
                                    <div class="gacha-aura-head">
                                        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                                            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z"/>
                                        </svg>
                                        <span>{$t('familiars.auraTitle')}: <strong>{resAura.title}</strong></span>
                                    </div>
                                    <div class="gacha-aura-desc">{resAura.description}</div>
                                </div>

                                <button class="action-btn claim-btn celebrate-btn" on:click={closeGachaResult}>
                                    {rollType === 'new' ? $t('common.confirm') : $t('common.ready')}
                                </button>
                            </div>
                        {/if}
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
        background: rgba(0,0,0,0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 210;
        backdrop-filter: blur(8px);
    }
    
    .modal {
        background: linear-gradient(160deg, #120724, #1b0c33);
        padding: 24px;
        border-radius: 22px;
        border: 1.5px solid rgba(162, 155, 254, 0.3);
        box-shadow: 0 10px 45px rgba(0, 0, 0, 0.8), 0 0 40px rgba(108, 92, 231, 0.3);
        width: 94%;
        max-width: 620px;
        color: white;
        position: relative;
        display: flex;
        flex-direction: column;
        max-height: 88vh;
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
        padding: 0;
    }

    /* Standalone Header */
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

    /* Toast */
    .pet-toast {
        position: absolute;
        top: 12px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 50;
        background: rgba(14, 28, 20, 0.95);
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

    .gold-pill {
        background: rgba(241, 196, 15, 0.15);
        color: #ffd700;
        border-color: rgba(241, 196, 15, 0.4);
    }

    .ok-pill {
        background: rgba(46, 213, 115, 0.15);
        color: #2ed573;
        border-color: rgba(46, 213, 115, 0.4);
    }

    .tab-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
    }
    .tab-content::-webkit-scrollbar { width: 5px; }
    .tab-content::-webkit-scrollbar-thumb { background: rgba(162,155,254,0.3); border-radius: 10px; }

    /* Pets List */
    .pets-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 40px 20px;
        gap: 12px;
        background: rgba(0,0,0,0.25);
        border: 1px dashed rgba(162, 155, 254, 0.25);
        border-radius: 16px;
    }
    .empty-title { margin: 0; font-size: 1rem; font-weight: 700; color: #dcdde1; }
    .empty-sub { margin: 0; font-size: 0.82rem; color: #8395a7; max-width: 320px; line-height: 1.4; }

    .pet-card {
        background: linear-gradient(135deg, rgba(26, 14, 46, 0.7), rgba(15, 7, 28, 0.85));
        border: 1.5px solid rgba(255,255,255,0.08);
        border-left: 5px solid gray;
        border-radius: 16px;
        padding: 14px;
        display: flex;
        gap: 16px;
        align-items: flex-start;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .pet-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.6);
    }

    .pet-card.common { border-left-color: #b2bec3; }
    .pet-card.rare { border-left-color: #74b9ff; box-shadow: inset 0 0 15px rgba(116, 185, 255, 0.05); }
    .pet-card.epic { border-left-color: #a29bfe; box-shadow: inset 0 0 15px rgba(162, 155, 254, 0.06); }
    .pet-card.legendary { border-left-color: #f1c40f; box-shadow: inset 0 0 20px rgba(241, 196, 15, 0.08); }

    .pet-icon-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
    }

    .pet-svg-wrap {
        width: 52px;
        height: 52px;
        background: rgba(0,0,0,0.35);
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 1px solid rgba(255,255,255,0.1);
        filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
    }

    .rarity-badge {
        font-size: 0.65rem;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .rarity-badge.common { background: rgba(178, 190, 195, 0.15); color: #b2bec3; }
    .rarity-badge.rare { background: rgba(116, 185, 255, 0.15); color: #74b9ff; }
    .rarity-badge.epic { background: rgba(162, 155, 254, 0.15); color: #a29bfe; }
    .rarity-badge.legendary { background: rgba(241, 196, 15, 0.15); color: #f1c40f; }

    .pet-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    .pet-name-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
    }

    .pet-title {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 800;
        color: #fff;
    }

    .status-chip {
        font-size: 0.7rem;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 10px;
    }
    .ready-chip { background: rgba(46, 213, 115, 0.2); color: #2ed573; border: 1px solid rgba(46, 213, 115, 0.4); }
    .active-chip { background: rgba(241, 196, 15, 0.2); color: #f1c40f; border: 1px solid rgba(241, 196, 15, 0.4); }
    .idle-chip { background: rgba(255, 255, 255, 0.08); color: #a4b0be; }

    .pet-desc {
        margin: 0;
        font-size: 0.78rem;
        color: #a4b0be;
        line-height: 1.35;
    }

    .exp-progress-container {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 4px;
    }

    .exp-meta {
        display: flex;
        justify-content: space-between;
        font-size: 0.72rem;
    }

    .exp-timer {
        display: flex;
        align-items: center;
        gap: 5px;
        color: #f1c40f;
        font-weight: 700;
    }

    .exp-pct {
        color: #8395a7;
        font-weight: 700;
    }

    .exp-bar {
        width: 100%;
        height: 6px;
        background: rgba(0,0,0,0.4);
        border-radius: 4px;
        overflow: hidden;
    }

    .exp-fill {
        height: 100%;
        background: linear-gradient(90deg, #f1c40f, #e67e22);
        border-radius: 4px;
        transition: width 0.5s ease;
    }

    .action-btn {
        margin-top: 6px;
        padding: 8px 14px;
        border: none;
        border-radius: 10px;
        font-weight: 800;
        font-size: 0.82rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        width: fit-content;
        transition: transform 0.15s, box-shadow 0.15s;
    }
    .action-btn:hover { transform: scale(1.04); }
    .action-btn:active { transform: scale(0.96); }

    .start-btn {
        background: linear-gradient(135deg, #0984e3, #6c5ce7);
        color: white;
        box-shadow: 0 3px 10px rgba(9, 132, 227, 0.3);
    }

    .exp-actions-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 6px;
    }
    .exp-actions-row .action-btn {
        margin-top: 0;
    }

    .speed-btn {
        background: linear-gradient(135deg, #e17055, #d63031);
        color: white;
        box-shadow: 0 3px 10px rgba(225, 112, 85, 0.3);
    }

    .exp-ad-tag {
        background: rgba(0, 0, 0, 0.28);
        border: 1px solid rgba(255, 255, 255, 0.35);
        font-size: 0.6rem;
        font-weight: 900;
        padding: 1px 5px;
        border-radius: 4px;
        letter-spacing: 0.5px;
    }

    .skip-crystal-btn {
        background: linear-gradient(135deg, rgba(9, 132, 227, 0.85), rgba(108, 92, 231, 0.85));
        border: 1px solid rgba(116, 185, 255, 0.4);
        color: #ffffff;
        box-shadow: 0 3px 10px rgba(9, 132, 227, 0.3);
    }
    .skip-crystal-btn:hover:not(:disabled) {
        background: linear-gradient(135deg, #0984e3, #6c5ce7);
        box-shadow: 0 4px 14px rgba(108, 92, 231, 0.5);
    }
    .skip-crystal-btn:disabled {
        opacity: 0.38;
        cursor: not-allowed;
        box-shadow: none;
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.1);
        color: #8395a7;
    }

    .claim-btn {
        background: linear-gradient(135deg, #2ed573, #10ac84);
        color: #042410;
        box-shadow: 0 3px 12px rgba(46, 213, 115, 0.4);
    }

    .pet-card-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 6px;
    }
    .pet-card-actions .action-btn {
        margin-top: 0;
    }

    .companion-btn {
        background: rgba(255, 215, 0, 0.12);
        border: 1px solid rgba(255, 215, 0, 0.35);
        color: #f1c40f;
    }
    .companion-btn:hover:not(:disabled) {
        background: rgba(255, 215, 0, 0.22);
        border-color: #ffd700;
    }
    .companion-btn.active {
        background: rgba(46, 213, 115, 0.18);
        border-color: rgba(46, 213, 115, 0.5);
        color: #2ed573;
        cursor: default;
        opacity: 0.9;
    }

    /* Companion Aura Box */
    .companion-aura-box {
        background: rgba(16, 12, 38, 0.7);
        border: 1px solid rgba(162, 155, 254, 0.22);
        border-radius: 12px;
        padding: 9px 12px;
        margin: 4px 0;
        display: flex;
        flex-direction: column;
        gap: 5px;
        transition: all 0.25s ease;
    }
    .companion-aura-box.aura-active {
        background: rgba(46, 213, 115, 0.08);
        border-color: rgba(46, 213, 115, 0.55);
        box-shadow: 0 0 16px rgba(46, 213, 115, 0.15), inset 0 0 12px rgba(46, 213, 115, 0.05);
    }
    .companion-aura-box.legendary-aura {
        background: linear-gradient(135deg, rgba(35, 18, 55, 0.85), rgba(58, 28, 90, 0.75));
        border: 1px solid rgba(241, 196, 15, 0.4);
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4), 0 0 15px rgba(241, 196, 15, 0.12);
    }
    .companion-aura-box.legendary-aura.aura-active {
        border-color: #f1c40f;
        background: linear-gradient(135deg, rgba(46, 213, 115, 0.12), rgba(241, 196, 15, 0.15));
        box-shadow: 0 0 20px rgba(241, 196, 15, 0.3), inset 0 0 12px rgba(241, 196, 15, 0.1);
    }

    .aura-top-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
    }
    .aura-tag-group {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .aura-sparkle-icon {
        color: #f1c40f;
        filter: drop-shadow(0 0 4px rgba(241, 196, 15, 0.7));
    }
    .aura-type-label {
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: #a29bfe;
    }
    .legendary-aura .aura-type-label {
        color: #ffeaa7;
    }
    .aura-legendary-pill {
        background: linear-gradient(90deg, #f1c40f, #e67e22);
        color: #120524;
        font-size: 0.58rem;
        font-weight: 900;
        padding: 1px 6px;
        border-radius: 4px;
        letter-spacing: 0.5px;
        box-shadow: 0 1px 6px rgba(241, 196, 15, 0.4);
    }

    .aura-status-badge {
        font-size: 0.65rem;
        font-weight: 800;
        letter-spacing: 0.4px;
    }
    .aura-status-badge.active-status {
        color: #2ed573;
        background: rgba(46, 213, 115, 0.18);
        border: 1px solid rgba(46, 213, 115, 0.45);
        padding: 2px 7px;
        border-radius: 12px;
        animation: auraPulse 2s infinite ease-in-out;
    }
    .aura-status-badge.inactive-status {
        color: #747d8c;
        font-style: italic;
    }

    @keyframes auraPulse {
        0%, 100% { opacity: 0.85; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.03); filter: drop-shadow(0 0 5px rgba(46, 213, 115, 0.6)); }
    }

    .aura-main-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .aura-name-title {
        font-size: 0.88rem;
        font-weight: 800;
        color: #ffeaa7;
        line-height: 1.2;
    }
    .legendary-aura .aura-name-title {
        color: #ffd700;
        text-shadow: 0 0 8px rgba(241, 196, 15, 0.35);
    }
    .aura-current-effect {
        font-size: 0.78rem;
        color: #ffffff;
        line-height: 1.35;
        font-weight: 600;
    }

    .aura-next-scaling {
        font-size: 0.7rem;
        color: #74b9ff;
        padding-top: 4px;
        border-top: 1px dashed rgba(255, 255, 255, 0.1);
    }
    .aura-next-label {
        opacity: 0.9;
    }
    .aura-max-reached {
        font-size: 0.68rem;
        color: #f1c40f;
        font-weight: 700;
        padding-top: 3px;
        border-top: 1px dashed rgba(241, 196, 15, 0.25);
    }

    /* Gacha Aura Preview */
    .gacha-aura-preview {
        margin: 10px 0;
        background: rgba(16, 12, 38, 0.8);
        border: 1px solid rgba(162, 155, 254, 0.3);
        border-radius: 12px;
        padding: 8px 12px;
        text-align: left;
    }
    .gacha-aura-preview.legendary {
        border-color: #f1c40f;
        background: linear-gradient(135deg, rgba(35, 18, 55, 0.9), rgba(58, 28, 90, 0.85));
        box-shadow: 0 0 16px rgba(241, 196, 15, 0.25);
    }
    .gacha-aura-head {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.75rem;
        color: #f1c40f;
        margin-bottom: 3px;
    }
    .gacha-aura-desc {
        font-size: 0.8rem;
        color: #ffffff;
        font-weight: 600;
    }

    /* Gacha Container */
    .gacha-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 12px 6px;
        text-align: center;
        gap: 14px;
        width: 100%;
        box-sizing: border-box;
    }

    /* Grand Jackpot Showcase */
    .gacha-jackpot-showcase {
        width: 100%;
        max-width: 520px;
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.09), rgba(108, 92, 231, 0.12));
        border: 1px solid rgba(241, 196, 15, 0.35);
        border-radius: 16px;
        padding: 10px 14px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), inset 0 0 15px rgba(241, 196, 15, 0.08);
        box-sizing: border-box;
    }

    .jackpot-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-bottom: 8px;
    }

    .jackpot-crown-icon {
        filter: drop-shadow(0 0 6px rgba(241, 196, 15, 0.6));
    }

    .jackpot-title {
        font-size: 0.78rem;
        font-weight: 900;
        letter-spacing: 1px;
        color: #ffd700;
        text-shadow: 0 0 8px rgba(241, 196, 15, 0.5);
        text-transform: uppercase;
    }

    .jackpot-cards-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
        gap: 8px;
        width: 100%;
    }

    .jackpot-card {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(18, 12, 34, 0.75);
        border: 1px solid rgba(241, 196, 15, 0.25);
        border-radius: 12px;
        padding: 6px 10px;
        text-align: left;
        transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    }

    .jackpot-card:hover {
        transform: translateY(-2px);
        border-color: rgba(241, 196, 15, 0.6);
        box-shadow: 0 4px 14px rgba(241, 196, 15, 0.2);
    }

    .jackpot-icon-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        flex-shrink: 0;
    }

    .jackpot-svg {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.4);
        border-radius: 50%;
        border: 1px solid rgba(241, 196, 15, 0.4);
    }

    .jackpot-badge {
        font-size: 0.55rem;
        font-weight: 800;
        color: #ffd700;
        text-transform: uppercase;
        background: rgba(241, 196, 15, 0.15);
        padding: 1px 4px;
        border-radius: 4px;
    }

    .jackpot-info {
        flex: 1;
        min-width: 0;
    }

    .jackpot-name {
        font-size: 0.78rem;
        font-weight: 800;
        color: #fff;
        line-height: 1.2;
        margin-bottom: 2px;
    }

    .jackpot-aura-desc {
        font-size: 0.68rem;
        color: #ffeaa7;
        line-height: 1.25;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .aura-icon-star {
        color: #ffd700;
        font-weight: bold;
    }

    /* Sacred Altar Stage */
    .gacha-altar-stage {
        position: relative;
        width: 220px;
        height: 180px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 4px 0;
    }

    .altar-orbit {
        position: absolute;
        top: 48%;
        left: 50%;
        pointer-events: none;
    }

    .altar-orbit-outer {
        width: 190px;
        height: 190px;
        animation: rotateClockwise 26s linear infinite;
    }

    .altar-orbit-inner {
        width: 145px;
        height: 145px;
        animation: rotateCounter 18s linear infinite;
    }

    .altar-pedestal {
        position: absolute;
        bottom: 8px;
        left: 50%;
        transform: translateX(-50%);
        pointer-events: none;
        filter: drop-shadow(0 0 12px rgba(241, 196, 15, 0.3));
    }

    .gacha-draconic-egg {
        position: relative;
        z-index: 2;
        animation: eggFloat 3.8s ease-in-out infinite;
        filter: drop-shadow(0 10px 22px rgba(108, 92, 231, 0.55)) drop-shadow(0 0 12px rgba(241, 196, 15, 0.4));
    }

    /* Ritual Active Effects on Sacred Altar */
    .gacha-altar-stage.ritual-active {
        pointer-events: none;
    }

    .altar-orbit.orbit-accelerate {
        animation: rotateClockwise 1.1s linear infinite !important;
        filter: drop-shadow(0 0 16px #ffd700) drop-shadow(0 0 8px #fd79a8);
    }

    .altar-orbit.orbit-accelerate-counter {
        animation: rotateCounter 0.85s linear infinite !important;
        filter: drop-shadow(0 0 16px #00cec9) drop-shadow(0 0 8px #a29bfe);
    }

    .ritual-flare-halo {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 140px;
        height: 140px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 215, 0, 0.45) 0%, rgba(224, 86, 253, 0.25) 50%, transparent 72%);
        animation: haloPulse 0.35s ease-in-out infinite alternate;
        pointer-events: none;
        z-index: 1;
    }

    @keyframes haloPulse {
        from { transform: translate(-50%, -50%) scale(0.9); opacity: 0.7; }
        to { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
    }

    .dimmed {
        opacity: 0.35;
        pointer-events: none;
        transition: opacity 0.3s ease;
    }

    /* Drop Rates Transparency Bar */
    .gacha-odds-bar {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        justify-content: center;
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 5px 12px;
        max-width: 480px;
    }

    .odd-pill {
        font-size: 0.68rem;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 8px;
    }

    .odd-pill.leg-pill {
        background: rgba(241, 196, 15, 0.16);
        color: #ffd700;
        border: 1px solid rgba(241, 196, 15, 0.4);
    }

    .odd-pill.epic-pill {
        background: rgba(162, 155, 254, 0.16);
        color: #a29bfe;
        border: 1px solid rgba(162, 155, 254, 0.4);
    }

    .odd-pill.rare-pill {
        background: rgba(116, 185, 255, 0.16);
        color: #74b9ff;
        border: 1px solid rgba(116, 185, 255, 0.4);
    }

    .odd-pill.com-pill {
        background: rgba(178, 190, 195, 0.12);
        color: #b2bec3;
        border: 1px solid rgba(178, 190, 195, 0.3);
    }

    /* Dual Action CTA Buttons */
    .gacha-actions-row {
        display: flex;
        gap: 12px;
        justify-content: center;
        width: 100%;
        max-width: 460px;
    }

    .gacha-cta-btn {
        flex: 1;
        min-width: 130px;
        padding: 10px 14px;
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        cursor: pointer;
        position: relative;
        font-weight: 800;
        border: none;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .gacha-cta-btn:hover:not(:disabled) {
        transform: translateY(-2px);
    }

    .gacha-cta-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        filter: grayscale(0.2);
        box-shadow: none;
    }

    .gacha-cta-btn.cta-single {
        background: linear-gradient(135deg, #4834d4, #686de0);
        box-shadow: 0 4px 16px rgba(72, 52, 212, 0.4);
        border: 1.5px solid rgba(162, 155, 254, 0.45);
        color: #ffffff;
    }

    .gacha-cta-btn.cta-single:hover {
        box-shadow: 0 6px 20px rgba(72, 52, 212, 0.6);
    }

    .gacha-cta-btn.cta-multi {
        background: linear-gradient(135deg, #a29bfe, #6c5ce7);
        box-shadow: 0 5px 20px rgba(108, 92, 231, 0.5);
        border: 1.5px solid rgba(241, 196, 15, 0.65);
        color: #ffffff;
    }

    .gacha-cta-btn.cta-multi:hover {
        box-shadow: 0 8px 25px rgba(108, 92, 231, 0.7);
    }

    .cta-discount-tag {
        position: absolute;
        top: -9px;
        right: 8px;
        background: linear-gradient(90deg, #f1c40f, #e67e22);
        color: #0f071e;
        font-size: 0.6rem;
        font-weight: 900;
        padding: 2px 7px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        animation: pulseBadge 2.2s infinite;
    }

    .cta-label {
        font-size: 0.95rem;
        font-weight: 800;
        letter-spacing: 0.5px;
    }

    .cta-price {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.95rem;
    }

    .old-price {
        text-decoration: line-through;
        color: rgba(255, 255, 255, 0.45);
        font-size: 0.75rem;
        margin-right: 2px;
    }

    .price-val {
        font-weight: 900;
        color: #74b9ff;
    }

    .price-val.gold-val {
        color: #ffd700;
        text-shadow: 0 0 6px rgba(241, 196, 15, 0.5);
    }

    /* Multi-Result Celebration View */
    .gacha-multi-result {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        max-width: 540px;
        background: linear-gradient(160deg, rgba(26, 14, 46, 0.96), rgba(15, 7, 28, 0.98));
        padding: 18px 14px;
        border-radius: 20px;
        border: 2px solid rgba(241, 196, 15, 0.5);
        box-shadow: 0 0 35px rgba(241, 196, 15, 0.3);
        box-sizing: border-box;
    }

    .multi-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
    }

    .multi-title {
        font-size: 1.1rem;
        font-weight: 900;
        color: #ffd700;
        margin: 0;
        text-shadow: 0 0 10px rgba(241, 196, 15, 0.4);
    }

    .multi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
        gap: 8px;
        width: 100%;
        margin-bottom: 12px;
    }

    .multi-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(10, 6, 20, 0.65);
        border: 1.5px solid;
        border-radius: 12px;
        padding: 8px 4px;
        text-align: center;
        gap: 3px;
        box-sizing: border-box;
    }

    .multi-card.common { border-color: #b2bec3; }
    .multi-card.rare { border-color: #74b9ff; box-shadow: 0 0 10px rgba(116, 185, 255, 0.25); }
    .multi-card.epic { border-color: #a29bfe; box-shadow: 0 0 12px rgba(162, 155, 254, 0.3); }
    .multi-card.legendary { border-color: #f1c40f; box-shadow: 0 0 16px rgba(241, 196, 15, 0.45); }

    .multi-card-icon {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 50%;
    }

    .multi-card-icon :global(svg) {
        width: 32px;
        height: 32px;
    }

    .multi-card-name {
        font-size: 0.72rem;
        font-weight: 800;
        color: #fff;
        line-height: 1.15;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 82px;
    }

    .multi-card-rarity {
        font-size: 0.58rem;
        font-weight: 700;
        text-transform: uppercase;
    }
    .multi-card-rarity.common { color: #b2bec3; }
    .multi-card-rarity.rare { color: #74b9ff; }
    .multi-card-rarity.epic { color: #a29bfe; }
    .multi-card-rarity.legendary { color: #ffd700; }

    .multi-badge {
        font-size: 0.58rem;
        font-weight: 900;
        padding: 1px 5px;
        border-radius: 6px;
    }

    .multi-badge.new-badge {
        background: #2ed573;
        color: #0b1f13;
    }

    .multi-badge.up-badge {
        background: #f1c40f;
        color: #211905;
    }

    .multi-badge.refund-badge {
        background: #74b9ff;
        color: #071929;
    }

    .multi-card-aura {
        font-size: 0.58rem;
        color: #ffeaa7;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 82px;
        opacity: 0.9;
    }

    /* Keyframes */
    @keyframes rotateClockwise {
        from { transform: translate(-50%, -50%) rotate(0deg); }
        to { transform: translate(-50%, -50%) rotate(360deg); }
    }

    @keyframes rotateCounter {
        from { transform: translate(-50%, -50%) rotate(360deg); }
        to { transform: translate(-50%, -50%) rotate(0deg); }
    }

    @keyframes eggFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-7px); }
    }

    @keyframes pulseBadge {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.07); }
    }

    .gacha-result {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: linear-gradient(160deg, rgba(26, 14, 46, 0.9), rgba(15, 7, 28, 0.95));
        padding: 24px;
        border-radius: 20px;
        border: 2px solid;
        max-width: 380px;
        gap: 8px;
    }

    .gacha-result.common { border-color: #b2bec3; box-shadow: 0 0 25px rgba(178, 190, 195, 0.3); }
    .gacha-result.rare { border-color: #74b9ff; box-shadow: 0 0 25px rgba(116, 185, 255, 0.4); }
    .gacha-result.epic { border-color: #a29bfe; box-shadow: 0 0 30px rgba(162, 155, 254, 0.4); }
    .gacha-result.legendary { border-color: #f1c40f; box-shadow: 0 0 35px rgba(241, 196, 15, 0.5); }

    .result-celebration {
        font-size: 0.8rem;
        font-weight: 800;
        letter-spacing: 1px;
        color: #f1c40f;
    }

    .result-icon {
        width: 100px;
        height: 100px;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(0,0,0,0.3);
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.1);
        margin: 8px 0;
    }

    .result-icon :global(svg) {
        width: 70px;
        height: 70px;
    }

    .pet-name { margin: 0; color: white; font-size: 1.5rem; font-weight: 900; }

    .result-desc {
        font-size: 0.82rem;
        color: #a4b0be;
        margin: 0;
        line-height: 1.35;
    }

    .celebrate-btn {
        margin-top: 12px;
        font-size: 0.95rem;
        padding: 10px 24px;
    }

    .pet-level-badge {
        font-size: 0.68rem;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 8px;
        background: rgba(241, 196, 15, 0.18);
        border: 1px solid rgba(241, 196, 15, 0.5);
        color: #f1c40f;
        text-shadow: 0 0 6px rgba(241, 196, 15, 0.5);
    }
    .pet-level-badge.max-level {
        background: rgba(46, 213, 115, 0.2);
        border-color: #2ed573;
        color: #2ed573;
        text-shadow: 0 0 6px rgba(46, 213, 115, 0.5);
    }

    .pet-perks-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin: 4px 0 8px;
    }
    .pet-perk-tag {
        font-size: 0.7rem;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 6px;
    }
    .pet-perk-tag.loot-tag {
        background: rgba(46, 213, 115, 0.12);
        color: #2ed573;
        border: 1px solid rgba(46, 213, 115, 0.25);
    }
    .pet-perk-tag.time-tag {
        background: rgba(116, 185, 255, 0.12);
        color: #74b9ff;
        border: 1px solid rgba(116, 185, 255, 0.25);
    }
    .pet-perk-tag.max-tag {
        background: rgba(241, 196, 15, 0.2);
        color: #ffd700;
        border: 1px solid rgba(241, 196, 15, 0.4);
    }

    .upgrade-celebration {
        color: #2ed573 !important;
        text-shadow: 0 0 10px rgba(46, 213, 115, 0.6);
    }
    .max-celebration {
        color: #00cec9 !important;
        text-shadow: 0 0 10px rgba(0, 206, 201, 0.6);
    }

    .upgrade-bonus-notice {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        background: rgba(46, 213, 115, 0.1);
        border: 1px solid rgba(46, 213, 115, 0.3);
        padding: 8px 14px;
        border-radius: 12px;
        margin: 6px 0;
        font-size: 0.8rem;
        color: #e4fbf0;
    }
    .upgrade-bonus-notice strong {
        color: #ffd700;
        font-size: 0.85rem;
    }
    .upgrade-bonus-notice.refund-notice {
        background: rgba(241, 196, 15, 0.1);
        border-color: rgba(241, 196, 15, 0.3);
        color: #ffeaa7;
    }

    @media (max-width: 480px) {
        .pet-card {
            gap: 12px;
            padding: 12px;
        }
        .pet-svg-wrap {
            width: 44px;
            height: 44px;
        }
        .action-btn {
            width: 100%;
            justify-content: center;
        }
    }
</style>
