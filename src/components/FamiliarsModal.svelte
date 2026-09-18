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
    import { playSuccessSound, playLevelUpSound, playCoinSound } from '../audio';
    import ResourceIcon from './ResourceIcon.svelte';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void;

    let activeTab: 'pets' | 'gacha' = 'pets';
    let gachaAnimating = false;
    let rolledPet: Pet | null = null;
    let rollType: 'new' | 'upgrade' | 'max_refund' = 'new';
    let newLevelReached = 1;
    let eggElement: HTMLElement;
    let resultElement: HTMLElement;

    let toastMessage: string | null = null;
    let toastTimer: number;

    const GACHA_COST = 100;

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

    function rollGacha() {
        if ($crystals < GACHA_COST) {
            showToast(get(t)('familiars.notEnoughCrystalsSummon'));
            const gachaBtn = document.querySelector('.gacha-btn');
            if (gachaBtn) {
                gsap.fromTo(gachaBtn, 
                    { x: -10 }, 
                    { x: 10, duration: 0.08, yoyo: true, repeat: 5, onComplete: () => gsap.set(gachaBtn, { x: 0 }) }
                );
            }
            return;
        }

        // Available rollable pets ONLY (collection exclusive pets can NEVER be rolled)
        const rollablePool = AVAILABLE_PETS.filter(p => !p.isCollectionExclusive);
        if (rollablePool.length === 0) return;

        // Deduct crystals
        crystals.update(c => c - GACHA_COST);

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
        const newPet = candidates[Math.floor(Math.random() * candidates.length)];

        const isUnlocked = $gameStore.unlockedPets.includes(newPet.id);
        const currentLvl = ($gameStore.petLevels && $gameStore.petLevels[newPet.id]) || (isUnlocked ? 1 : 0);

        if (!isUnlocked) {
            rollType = 'new';
            newLevelReached = 1;
        } else if (currentLvl < 10) {
            rollType = 'upgrade';
            newLevelReached = currentLvl + 1;
        } else {
            rollType = 'max_refund';
            newLevelReached = 10;
        }

        gachaAnimating = true;
        rolledPet = null;

        // Egg animation
        setTimeout(() => {
            if (eggElement) {
                gsap.timeline()
                    .set(eggElement, { scale: 1, rotation: 0, opacity: 1 })
                    .to(eggElement, { rotation: 15, duration: 0.1, yoyo: true, repeat: 5 })
                    .to(eggElement, { rotation: -15, duration: 0.1, yoyo: true, repeat: 5 })
                    .to(eggElement, { scale: 1.5, duration: 0.2 })
                    .to(eggElement, { scale: 0, duration: 0.1, ease: 'back.in(2)', onComplete: () => {
                        rolledPet = newPet;
                        
                        if (rollType === 'new') {
                            gameStore.unlockPet(newPet.id);
                            playSuccessSound();
                        } else if (rollType === 'upgrade') {
                            gameStore.upgradePet(newPet.id);
                            playLevelUpSound();
                        } else {
                            crystals.update(c => c + 50);
                            playCoinSound();
                        }
                        saveGame();
                        
                        setTimeout(() => {
                            if (resultElement) {
                                gsap.fromTo(resultElement, 
                                    { scale: 0, opacity: 0, rotation: -180 },
                                    { scale: 1, opacity: 1, rotation: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' }
                                );
                            }
                        }, 50);
                    }});
            }
        }, 50);
    }

    function closeGachaResult() {
        gachaAnimating = false;
        rolledPet = null;
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
                {#if lockedPets.length > 0}
                    <span class="sub-pill gold-pill">{$t('familiars.newPetsTag', { count: lockedPets.length })}</span>
                {:else}
                    <span class="sub-pill ok-pill">{$t('familiars.levelingTag')}</span>
                {/if}
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
                    {#if !gachaAnimating}
                        <div class="gacha-info">
                            <h3 class="gacha-headline">{$t('familiars.magicSummon')}</h3>
                            <p class="gacha-desc">
                                {$t('familiars.summonNotice')}
                            </p>
                            
                            <div class="cost-badge">
                                <span>{$t('familiars.summonCostLabel')}:</span>
                                <div class="cost-crystal">
                                    <ResourceIcon type="crystals" size={18} />
                                    <span class="cost-num">{GACHA_COST}</span>
                                </div>
                            </div>

                            <button class="gacha-btn" on:click={rollGacha}>
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                                </svg>
                                {$t('familiars.magicSummon')}
                            </button>
                        </div>
                        
                        <div class="gacha-egg">
                            <svg viewBox="0 0 100 100" width="130" height="130">
                                <defs>
                                    <linearGradient id="eggGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="#a29bfe"/>
                                        <stop offset="50%" stop-color="#6c5ce7"/>
                                        <stop offset="100%" stop-color="#fd79a8"/>
                                    </linearGradient>
                                    <radialGradient id="eggShine" cx="30%" cy="30%" r="70%">
                                        <stop offset="0%" stop-color="#fff" stop-opacity="0.6"/>
                                        <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
                                    </radialGradient>
                                </defs>
                                <ellipse cx="50" cy="52" rx="36" ry="46" fill="url(#eggGrad)" stroke="#f1c40f" stroke-width="2"/>
                                <ellipse cx="44" cy="40" rx="20" ry="28" fill="url(#eggShine)"/>
                                <circle cx="38" cy="32" r="5" fill="white" opacity="0.6"/>
                            </svg>
                        </div>
                    {:else}
                        {#if !rolledPet}
                            <div class="gacha-egg animating" bind:this={eggElement}>
                                <svg viewBox="0 0 100 100" width="140" height="140">
                                    <defs>
                                        <linearGradient id="eggGradActive" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stop-color="#fd79a8"/>
                                            <stop offset="100%" stop-color="#f1c40f"/>
                                        </linearGradient>
                                    </defs>
                                    <ellipse cx="50" cy="50" rx="36" ry="46" fill="url(#eggGradActive)" stroke="#fff" stroke-width="3"/>
                                </svg>
                            </div>
                        {:else}
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

    /* Gacha */
    .gacha-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px 10px;
        text-align: center;
        gap: 16px;
    }

    .gacha-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
    }

    .gacha-headline {
        margin: 0 0 6px;
        font-size: 1.3rem;
        color: #ffd700;
        font-weight: 900;
    }

    .gacha-desc {
        margin: 0 auto;
        font-size: 0.85rem;
        color: #a4b0be;
        max-width: 420px;
        line-height: 1.4;
    }

    .cost-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(0, 0, 0, 0.35);
        padding: 6px 14px;
        border-radius: 20px;
        border: 1px solid rgba(116, 185, 255, 0.3);
        margin-top: 8px;
        font-size: 0.85rem;
    }

    .cost-crystal {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #74b9ff;
        font-weight: 800;
    }

    .gacha-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: linear-gradient(135deg, #a29bfe, #6c5ce7);
        border: none;
        border-radius: 16px;
        padding: 12px 28px;
        font-size: 1.05rem;
        color: white;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(108, 92, 231, 0.5);
        transition: transform 0.2s, box-shadow 0.2s;
        margin: 14px auto 0;
    }
    .gacha-btn:hover:not(:disabled) {
        transform: scale(1.05);
        box-shadow: 0 8px 25px rgba(108, 92, 231, 0.7);
    }
    .gacha-btn:disabled {
        background: rgba(255,255,255,0.1);
        color: #8395a7;
        cursor: not-allowed;
        box-shadow: none;
    }

    .gacha-egg {
        filter: drop-shadow(0 10px 20px rgba(108, 92, 231, 0.4));
        cursor: pointer;
        transition: transform 0.2s;
    }
    .gacha-egg:hover {
        transform: scale(1.05);
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
