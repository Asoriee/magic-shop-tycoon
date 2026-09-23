<script lang="ts">
    import { onMount, onDestroy, tick } from 'svelte';
    import { 
        gameStore, 
        currentIdleIncome, 
        effectiveOfflineRate,
        maxOfflineTimeHours, 
        formatNumber, 
        crystals, 
        isVip,
        vipDaysLeft,
        isVipDailyRewardAvailable,
        readyOrdersCount,
        unclaimedQuestsCount,
        finishedExpeditionsCount,
        milestoneInfo,
        AVAILABLE_POTIONS,
        activeGuideModalId,
        ingredientsCount,
        potionsCount,
        unlockedRecipes,
        isLuckyWheelReady,
        type Potion
    } from './store';
    import { 
        initYandexSdk, 
        saveGame, 
        isAdActive, 
        showInterstitialAd,
        signalGameReady,
        notifyGameplayStart,
        notifyGameplayStop,
        getServerTime,
        canShowShortcutPrompt,
        createGameShortcut
    } from './yandex-sdk';
    import Cauldron from './components/Cauldron.svelte';
    import OfflineIncomePopup from './components/OfflineIncomePopup.svelte';
    import ShopModal from './components/ShopModal.svelte';
    import ParallaxBackground from './components/ParallaxBackground.svelte';
    import PetCompanion from './components/PetCompanion.svelte';
    
    import GrimoireModal from './components/GrimoireModal.svelte';
    import CityModal from './components/CityModal.svelte';
    import PremiumModal from './components/PremiumModal.svelte';
    import DailyCalendarModal from './components/DailyCalendarModal.svelte';
    import LeaderboardModal from './components/LeaderboardModal.svelte';
    import MechanicGuideModal from './components/MechanicGuideModal.svelte';
    import LuckyWheelModal from './components/LuckyWheelModal.svelte';
    import FlyingBonus from './components/FlyingBonus.svelte';
    import ResourceIcon from './components/ResourceIcon.svelte';
    import { isSoundMuted, toggleSound } from './audio';
    import { t, currentLang, setLanguage, getRankTitle } from './i18n';
    import { isCalendarRewardReady } from './calendar';

    let isOfflinePopupOpen = false;
    let isGrimoireOpen = typeof window !== 'undefined' && new URLSearchParams(window.location?.search).get('modal') === 'grimoire';
    let isCityOpen = typeof window !== 'undefined' && new URLSearchParams(window.location?.search).get('modal') === 'city';
    let isPremiumOpen = typeof window !== 'undefined' && new URLSearchParams(window.location?.search).get('modal') === 'premium';
    let isDailyCalendarOpen = typeof window !== 'undefined' && new URLSearchParams(window.location?.search).get('modal') === 'calendar';
    let isLuckyWheelOpen = typeof window !== 'undefined' && new URLSearchParams(window.location?.search).get('modal') === 'wheel';

    $: isCalendarReady = isCalendarRewardReady($gameStore);

    function cycleLanguage() {
        const next = $currentLang === 'ru' ? 'en' : ($currentLang === 'en' ? 'tr' : 'ru');
        setLanguage(next);
    }
    let isShopOpen = typeof window !== 'undefined' && new URLSearchParams(window.location?.search).get('modal') === 'shop';
    let isLeaderboardOpen = false;
    let canAddShortcut = false;
    let shortcutRewardToast = false;

    async function handleAddShortcut() {
        try {
            const accepted = await createGameShortcut();
            if (accepted) {
                crystals.update(c => c + 25);
                gameStore.update(s => ({ ...s, hasCreatedShortcut: true }));
                saveGame();
                shortcutRewardToast = true;
                setTimeout(() => { shortcutRewardToast = false; }, 4000);
            }
        } catch (e) {
            console.warn('Shortcut prompt error', e);
        }
    }
    
    let offlineGoldAmount = 0;
    let offlineSecondsCount = 0;
    let maxOfflineSecondsCount = 0;
    let offlineRatePerSec = 0;
    let isReady = false;
    let gameLoop: number;
    let hiddenTimestamp = 0;
    let autoSaveCounter = 0;
    let nowTime = getServerTime();

    $: totalCityNotifications = $readyOrdersCount + $unclaimedQuestsCount;
    $: liveBuffs = (() => {
        const raw = ($gameStore?.activeBuffs || []).filter(b => b.expiresAt > nowTime);
        const map = new Map<string, typeof raw[0]>();
        for (const b of raw) {
            const existing = map.get(b.potionId);
            if (!existing) {
                map.set(b.potionId, { ...b });
            } else {
                existing.expiresAt = Math.max(existing.expiresAt, b.expiresAt);
            }
        }
        return Array.from(map.values());
    })();

    function formatBuffTime(expiresAt: number): string {
        const diff = Math.max(0, Math.floor((expiresAt - nowTime) / 1000));
        const m = Math.floor(diff / 60);
        const s = diff % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function getPotionSvg(potionId: string): string {
        if (potionId === 'frenzy_lucky_wheel') {
            return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ffd700" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
        }
        const found = AVAILABLE_POTIONS.find((p: Potion) => p.id === potionId);
        return found?.icon || '';
    }

    function getPotionName(potionId: string): string {
        if (potionId === 'frenzy_lucky_wheel') {
            return $t('luckyWheel.sectorFrenzyTitle');
        }
        const found = AVAILABLE_POTIONS.find((p: Potion) => p.id === potionId);
        return found?.name || $t('common.potion');
    }

    function checkOfflineEarnings(forcedAwayMs?: number) {
        const now = getServerTime();
        const lastSave = $gameStore?.lastSaveTime || now;

        // Anti-Cheat: Rollback detection (clock moved back by > 60s)
        if (now < lastSave - 60000) {
            console.warn('[Security] Time anomaly detected: local/server clock moved backwards.');
            gameStore.setLastSaveTime(now);
            saveGame();
            return;
        }

        const rawDiffMs = typeof forcedAwayMs === 'number' && forcedAwayMs > 0 
            ? forcedAwayMs 
            : Math.max(0, now - lastSave);

        const maxHours = $maxOfflineTimeHours || 2;
        const maxOfflineMs = maxHours * 3600 * 1000;
        const cappedDiffMs = Math.min(rawDiffMs, maxOfflineMs);
        const cappedSeconds = Math.floor(cappedDiffMs / 1000);
        const awaySeconds = Math.floor(rawDiffMs / 1000);
        const effectiveRate = $effectiveOfflineRate || 0;

        if (cappedSeconds >= 60 && effectiveRate > 0) {
            offlineGoldAmount = Math.floor(cappedSeconds * effectiveRate);
            offlineSecondsCount = awaySeconds;
            maxOfflineSecondsCount = maxHours * 3600;
            offlineRatePerSec = effectiveRate;
            if (offlineGoldAmount > 0) {
                isOfflinePopupOpen = true;
            }
        }

        gameStore.setLastSaveTime(now);
        saveGame();
    }

    let handleContextMenu: (e: MouseEvent) => void;

    function handleVisibilityChange() {
        const now = getServerTime();
        if (document.hidden) {
            hiddenTimestamp = now;
            gameStore.setLastSaveTime(hiddenTimestamp);
            saveGame();
            notifyGameplayStop();
        } else {
            notifyGameplayStart();
            if (hiddenTimestamp > 0) {
                const awayMs = now - hiddenTimestamp;
                hiddenTimestamp = 0;
                if (awayMs >= 60 * 1000) {
                    checkOfflineEarnings(awayMs);
                } else {
                    gameStore.setLastSaveTime(now);
                }
            }
        }
    }

    function handleWindowFocus() {
        notifyGameplayStart();
        if (hiddenTimestamp > 0) {
            const awayMs = getServerTime() - hiddenTimestamp;
            hiddenTimestamp = 0;
            if (awayMs >= 60 * 1000) {
                checkOfflineEarnings(awayMs);
            }
        }
    }

    onMount(async () => {
        // Init SDK and load game
        await initYandexSdk();
        gameStore.checkDailyQuests();
        
        // Calculate offline income on startup
        checkOfflineEarnings();
        gameStore.checkOrderSpawns();
        isReady = true;

        if (typeof window !== 'undefined' && window.location?.search) {
            const urlParams = new URLSearchParams(window.location.search);
            const queryLang = urlParams.get('lang')?.toLowerCase();
            if (queryLang === 'en' || queryLang === 'tr' || queryLang === 'ru') {
                setLanguage(queryLang);
            }
            if (urlParams.get('demo') === '1') {
                const now = Date.now();
                const isEn = queryLang === 'en';
                const isTr = queryLang === 'tr';
                const order1Name = isEn ? 'Archmage Valerius' : (isTr ? 'Başbüyücü Valerius' : 'Архимаг Валериус');
                const order2Name = isEn ? 'Guild Alchemist' : (isTr ? 'Lonca Simyacısı' : 'Алхимик гильдии');
                const order3Name = isEn ? 'Guard Captain' : (isTr ? 'Muhafız Kaptanı' : 'Капитан стражи');
                const order4Name = isEn ? 'Stargazer Erion' : (isTr ? 'Yıldızbilimci Erion' : 'Звездочет Эрион');

                gameStore.update(s => ({
                    ...s,
                    gold: 48500,
                    stardust: 850,
                    totalStardustEarned: 850,
                    unlockedPets: ['pet_rat', 'pet_owl', 'pet_spirit', 'pet_bat', 'pet_frog', 'pet_phoenix'],
                    artifacts: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                    unlockedCollections: ['archmage_set'],
                    artifactOvercharge: { 1: 2, 3: 1, 6: 3 },
                    petLevels: { pet_rat: 4, pet_owl: 3, pet_spirit: 2, pet_bat: 2, pet_frog: 1, pet_phoenix: 2 },
                    activeCompanionId: 'pet_rat',
                    activeExpeditions: [
                        { petId: 'pet_spirit', startTime: now - 3600 * 1000, durationMs: 2 * 3600 * 1000 },
                        { petId: 'pet_bat', startTime: now - 3 * 3600 * 1000, durationMs: 1.5 * 3600 * 1000 }
                    ],
                    potionMastery: { potion_luck: 4, potion_wealth: 3, potion_focus: 2, potion_fire: 2, potion_swift: 1 },
                    alchemyBrewsCount: 42,
                    activeBuffs: [
                        { potionId: 'potion_wealth', expiresAt: now + 240 * 1000, effect: 'idle_multiplier', value: 0.5 },
                        { potionId: 'potion_luck', expiresAt: now + 165 * 1000, effect: 'click_multiplier', value: 0.25 }
                    ],
                    activeOrders: [
                        {
                            id: 'demo_order_1',
                            name: order1Name,
                            icon: '🧙‍♂️',
                            orderType: 'vip',
                            requirements: [
                                { type: 'potion', id: 'potion_wealth', count: 2 },
                                { type: 'ingredient', id: 'moonpetal', count: 4 }
                            ],
                            rewardGold: 12500,
                            rewardCrystals: 5,
                            rewardChest: 'magical',
                            isVip: true
                        },
                        {
                            id: 'demo_order_2',
                            name: order2Name,
                            icon: '🧪',
                            orderType: 'potion',
                            requirements: [
                                { type: 'potion', id: 'potion_luck', count: 3 }
                            ],
                            rewardGold: 5800,
                            rewardCrystals: 2,
                            rewardChest: 'alchemist',
                            isVip: false
                        },
                        {
                            id: 'demo_order_3',
                            name: order3Name,
                            icon: '🛡️',
                            orderType: 'common',
                            requirements: [
                                { type: 'ingredient', id: 'fire_salamander', count: 3 },
                                { type: 'ingredient', id: 'herb_mundane', count: 10 }
                            ],
                            rewardGold: 4200,
                            rewardCrystals: 1,
                            rewardChest: 'wooden',
                            isVip: false
                        },
                        {
                            id: 'demo_order_4',
                            name: order4Name,
                            icon: '🔮',
                            orderType: 'vip',
                            requirements: [
                                { type: 'potion', id: 'potion_focus', count: 2 },
                                { type: 'ingredient', id: 'void_essence', count: 2 }
                            ],
                            rewardGold: 18000,
                            rewardCrystals: 8,
                            rewardChest: 'astral',
                            isVip: true
                        }
                    ],
                    upgrades: s.upgrades.map(u => {
                        if (u.id === 'click1') return { ...u, level: 25 };
                        if (u.id === 'idle1') return { ...u, level: 30 };
                        if (u.id === 'idle_apprentice') return { ...u, level: 18 };
                        if (u.id === 'click_gloves') return { ...u, level: 12 };
                        if (u.id === 'idle2') return { ...u, level: 10 };
                        if (u.id === 'click2') return { ...u, level: 8 };
                        if (u.id === 'idle_distiller') return { ...u, level: 5 };
                        if (u.id === 'click_crit') return { ...u, level: 4 };
                        return u;
                    })
                }));
                crystals.set(125);
                potionsCount.set({
                    potion_luck: 5,
                    potion_wealth: 8,
                    potion_void: 3,
                    potion_focus: 4,
                    potion_fire: 6,
                    potion_swift: 4,
                    potion_astral: 2
                });
                ingredientsCount.set({
                    herb_mundane: 45,
                    mushroom_gray: 32,
                    toadstone: 28,
                    moonpetal: 24,
                    fairy_breath: 16,
                    fire_salamander: 18,
                    stardew: 12,
                    void_essence: 9,
                    troll_blood: 7,
                    dragon_scale: 5,
                    philosophers_tear: 3,
                    time_crystal: 2
                });
                unlockedRecipes.set({
                    'rec_luck': 3,
                    'rec_wealth': 3,
                    'rec_void': 2,
                    'rec_focus': 3,
                    'rec_sage': 1,
                    'rec_fire': 3,
                    'rec_berserk': 2,
                    'rec_giant': 3,
                    'rec_immortal': 1,
                    'rec_chronos': 2
                });
            }
            const urlModal = urlParams.get('modal');
            if (urlModal === 'shop') isShopOpen = true;
            if (urlModal === 'grimoire') isGrimoireOpen = true;
            if (urlModal === 'city') isCityOpen = true;
            if (urlModal === 'premium') isPremiumOpen = true;
            if (urlModal === 'leaderboard') isLeaderboardOpen = true;
            if (urlModal === 'calendar') isDailyCalendarOpen = true;
            if (urlModal === 'wheel') isLuckyWheelOpen = true;
        }

        await tick();
        signalGameReady();
        notifyGameplayStart();

        canShowShortcutPrompt().then(can => {
            canAddShortcut = can;
        }).catch(() => {});

        handleContextMenu = (e: MouseEvent) => e.preventDefault();
        window.addEventListener('contextmenu', handleContextMenu);

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleWindowFocus);

        // Start idle loop with throttled auto-save
        gameLoop = setInterval(() => {
            nowTime = getServerTime();
            if (!isAdActive() && !document.hidden) {
                gameStore.addGold($currentIdleIncome);
                gameStore.checkOrderSpawns();
                autoSaveCounter++;
                if (autoSaveCounter >= 15) { // Auto-save every 15 seconds
                    autoSaveCounter = 0;
                    saveGame();
                }
            }
        }, 1000);
    });

    onDestroy(() => {
        if (gameLoop) clearInterval(gameLoop);
        if (handleContextMenu) {
            window.removeEventListener('contextmenu', handleContextMenu);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleWindowFocus);
        notifyGameplayStop();
    });

    function handleToggleSound() {
        toggleSound();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            const wasAnyOpen = isGrimoireOpen || isCityOpen || isPremiumOpen || isShopOpen || isLeaderboardOpen;
            isGrimoireOpen = false;
            isCityOpen = false;
            isPremiumOpen = false;
            isShopOpen = false;
            isLeaderboardOpen = false;
            if (wasAnyOpen) showInterstitialAd();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isReady}
<main>
    <svg width="0" height="0" style="position: absolute; pointer-events: none;">
        <defs>
            <linearGradient id="crestGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffeaa7"/>
                <stop offset="50%" stop-color="#f1c40f"/>
                <stop offset="100%" stop-color="#d35400"/>
            </linearGradient>
            <radialGradient id="portalGlowAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#ffeaa7" stop-opacity="0.6"/>
                <stop offset="100%" stop-color="#f39c12" stop-opacity="0"/>
            </radialGradient>
        </defs>
    </svg>

    <ParallaxBackground />
    
    <!-- 1. Master Resource HUD Panel -->
    <header class="master-hud-panel">
        <!-- Shop Rank / Crest Badge -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div 
            class="hud-crest-box" 
            title={$t('hud.rankTooltip', { 
                tier: $milestoneInfo?.rankLevel || (($milestoneInfo?.tier || 0) + 1), 
                title: getRankTitle($milestoneInfo?.tier || 0, $currentLang),
                mult: $milestoneInfo?.multiplier?.toFixed(2) 
            })} 
            on:click={() => isShopOpen = true}
        >
            <div class="crest-icon-wrap">
                <svg viewBox="0 0 32 32" width="22" height="22" fill="none">
                    <path d="M16 2 L28 8 L24 24 L16 30 L8 24 L4 8 Z" fill="url(#crestGoldGrad)" stroke="#ffeaa7" stroke-width="1.4"/>
                    <circle cx="16" cy="15" r="4.5" fill="#d35400" stroke="#fff" stroke-width="0.8"/>
                    <path d="M16 11.5 L16 18.5 M12.5 15 L19.5 15" stroke="#ffeaa7" stroke-width="1.2"/>
                </svg>
            </div>
            <div class="crest-meta">
                <div class="crest-title-row">
                    <span class="crest-tier">{$t('hud.rank', { tier: $milestoneInfo?.rankLevel || (($milestoneInfo?.tier || 0) + 1) })}</span>
                    <span class="crest-bonus">x{$milestoneInfo?.multiplier?.toFixed(2)}</span>
                </div>
                <div class="crest-progress-track" title={$t('hud.rankProgress', { current: $milestoneInfo?.progress, total: $milestoneInfo?.stepTarget || 25 })}>
                    <div class="crest-progress-fill" style="width: {$milestoneInfo?.percent || 0}%"></div>
                </div>
            </div>
        </div>

        <!-- Interactive Resource Chips -->
        <div class="hud-chips-row">
            <!-- Gold Chip -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="hud-chip gold-chip" title={$t('hud.goldTooltip')} on:click={() => isShopOpen = true}>
                <span class="chip-svg-wrap">
                    <ResourceIcon type="gold" size={18} />
                </span>
                <span class="chip-val gold-val">{formatNumber($gameStore.gold)}</span>
            </div>

            <!-- Idle Income Chip -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="hud-chip income-chip" title={$t('hud.incomeTooltip')} on:click={() => isShopOpen = true}>
                <span class="chip-svg-wrap">
                    <ResourceIcon type="income" size={16} />
                </span>
                <span class="chip-val income-val">
                    +{formatNumber($currentIdleIncome)}&nbsp;<span class="unit-full">{$t('common.perSec')}</span><span class="unit-short">{$t('common.perSecShort')}</span>
                </span>
            </div>

            <!-- Crystals Chip -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="hud-chip crystal-chip" title={$t('hud.crystalTooltip')} on:click={() => isPremiumOpen = true}>
                <span class="chip-svg-wrap">
                    <ResourceIcon type="crystals" size={18} />
                </span>
                <span class="chip-val crystal-val">{formatNumber($crystals)}</span>
            </div>

            <!-- Stardust Chip (Shows if stardust > 0 or has artifacts) -->
            {#if $gameStore.stardust > 0 || $gameStore.artifacts.length > 0}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="hud-chip stardust-chip" title={$t('hud.stardustTooltip')} on:click={() => isPremiumOpen = true}>
                <span class="chip-svg-wrap">
                    <ResourceIcon type="stardust" size={18} />
                </span>
                <span class="chip-val stardust-val">{formatNumber($gameStore.stardust)}</span>
            </div>
            {/if}

            <!-- VIP Status Chip -->
            {#if $isVip}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="hud-chip vip-chip" title={$t('hud.vipTooltip', { days: $vipDaysLeft })} on:click={() => isPremiumOpen = true}>
                <span class="chip-svg-wrap">
                    <ResourceIcon type="vip" size={18} />
                </span>
                <span class="chip-val vip-val">
                    {$t('common.vip')} {$vipDaysLeft}&nbsp;<span class="unit-full">{$t('common.day')}</span><span class="unit-short">{$t('common.dayShort')}</span>
                </span>
                {#if $isVipDailyRewardAvailable}
                    <span class="vip-reward-dot" title={$t('hud.vipRewardDot')}></span>
                {/if}
            </div>
            {/if}
        </div>

        <!-- HUD Control Actions -->
        <div class="hud-controls-cluster">
            <!-- Language Switcher Button -->
            <button 
                type="button" 
                class="hud-icon-btn lang-btn" 
                title="{$t('header.language')}: {$currentLang.toUpperCase()}" 
                on:click={cycleLanguage}
                aria-label="{$t('header.language')}"
            >
                <span class="lang-label">{$currentLang.toUpperCase()}</span>
            </button>

            <!-- Daily Calendar Button -->
            <button 
                type="button" 
                class="hud-icon-btn calendar-btn" 
                title="{$t('calendar.title')}" 
                on:click={() => isDailyCalendarOpen = true}
            >
                {#if isCalendarReady}
                    <span class="calendar-notify-dot" title="{$t('calendar.notifyTooltip')}"></span>
                {/if}
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                    <rect x="3" y="4" width="18" height="17" rx="3.5" fill="#2d1b4e" stroke="#ffd32a" stroke-width="1.4"/>
                    <path d="M3 9 L21 9" stroke="#ffd32a" stroke-width="1.4"/>
                    <line x1="8" y1="2" x2="8" y2="5" stroke="#ffd32a" stroke-width="2" stroke-linecap="round"/>
                    <line x1="16" y1="2" x2="16" y2="5" stroke="#ffd32a" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="8" cy="13" r="1.4" fill="#55efc4"/>
                    <circle cx="12" cy="13" r="1.4" fill="#ffd32a"/>
                    <circle cx="16" cy="13" r="1.4" fill="#ff7675"/>
                    <circle cx="8" cy="17" r="1.4" fill="#a29bfe"/>
                    <circle cx="12" cy="17" r="1.4" fill="#74b9ff"/>
                    <circle cx="16" cy="17" r="1.4" fill="#ffd32a"/>
                </svg>
            </button>

            <!-- Archmage Lucky Wheel Button -->
            <button 
                type="button" 
                class="hud-icon-btn wheel-btn" 
                title="{$t('luckyWheel.title')}" 
                on:click={() => isLuckyWheelOpen = true}
                aria-label="{$t('luckyWheel.title')}"
            >
                {#if $isLuckyWheelReady}
                    <span class="wheel-notify-dot" title="{$t('luckyWheel.readyTooltip')}"></span>
                {/if}
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="3 1.5"/>
                    <circle cx="12" cy="12" r="6" stroke="#fbbf24" stroke-width="1.2"/>
                    <line x1="12" y1="2" x2="12" y2="22" stroke="#f59e0b" stroke-width="1.2"/>
                    <line x1="2" y1="12" x2="22" y2="12" stroke="#f59e0b" stroke-width="1.2"/>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="#f59e0b" stroke-width="1"/>
                    <line x1="4.93" y1="19.07" x2="19.07" y2="4.93" stroke="#f59e0b" stroke-width="1"/>
                    <circle cx="12" cy="12" r="2.5" fill="#f59e0b" stroke="#fff" stroke-width="0.8"/>
                </svg>
            </button>

            <!-- Desktop / Mobile App Shortcut Button -->
            {#if canAddShortcut && !$gameStore.hasCreatedShortcut}
                <button 
                    type="button" 
                    class="hud-icon-btn shortcut-btn" 
                    title="{$t('header.shortcutTooltip')}" 
                    on:click={handleAddShortcut}
                >
                    <span class="shortcut-gift-badge">
                        +25
                        <svg viewBox="0 0 24 24" width="9" height="9" fill="#00d2d3" style="display:inline-block; vertical-align:-1px;">
                            <polygon points="12,2 22,8 18,22 6,22 2,8" />
                        </svg>
                    </span>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#2ed573" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="4" stroke="#2ed573" fill="rgba(46, 213, 115, 0.1)"/>
                        <path d="M12 8v8M8 12h8" stroke="#2ed573" stroke-linecap="round"/>
                    </svg>
                </button>
            {/if}

            <!-- Leaderboard Button -->
            <button 
                type="button" 
                class="hud-icon-btn leaderboard-btn" 
                title="{$t('leaderboard.title')}" 
                on:click={() => isLeaderboardOpen = true}
            >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                    <path d="M6 4 L18 4 C18 4 19 13 12 15 C5 13 6 4 6 4 Z" fill="#f1c40f" stroke="#d4ac0d" stroke-width="1.2"/>
                    <path d="M6 6 C2 6 2 11 6 11" stroke="#f1c40f" stroke-width="1.5" fill="none"/>
                    <path d="M18 6 C22 6 22 11 18 11" stroke="#f1c40f" stroke-width="1.5" fill="none"/>
                    <path d="M12 15 L12 19" stroke="#f1c40f" stroke-width="2"/>
                    <path d="M8 19 L16 19 L17 21 L7 21 Z" fill="#e67e22"/>
                </svg>
            </button>

            <!-- Sound Toggle Button -->
            <button 
                type="button" 
                class="hud-icon-btn sound-btn" 
                class:muted={$isSoundMuted} 
                title={$isSoundMuted ? $t('header.soundOn') : $t('header.soundOff')} 
                on:click={handleToggleSound}
            >
                {#if $isSoundMuted}
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/>
                        <line x1="23" y1="9" x2="17" y2="15"/>
                        <line x1="17" y1="9" x2="23" y2="15"/>
                    </svg>
                {:else}
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    </svg>
                {/if}
            </button>
        </div>
    </header>

    {#if shortcutRewardToast}
        <div class="shortcut-toast-notification">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2ed573" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>{$t('header.shortcutRewardToast')}</span>
        </div>
    {/if}

    <!-- 2. Active Magic Deck (Live Potion Countdown Widgets) -->
    {#if liveBuffs.length > 0}
        <div class="active-buffs-dock" aria-label="{$t('grimoire.title')}">
            {#each liveBuffs as buff (buff.potionId)}
                <div class="buff-capsule" title="{getPotionName(buff.potionId)}: +{Math.round(buff.value * 100)}%">
                    <div class="buff-icon-flask">
                        {@html getPotionSvg(buff.potionId)}
                    </div>
                    <div class="buff-meta-data">
                        <span class="buff-countdown">{formatBuffTime(buff.expiresAt)}</span>
                        <span class="buff-value-tag">+{Math.round(buff.value * 100)}%</span>
                    </div>
                </div>
            {/each}
        </div>
    {/if}

    <!-- 3. Center Workshop Area: Familiar and Alchemist Cauldron -->
    <div class="center-area">
        <PetCompanion />
        <Cauldron />
    </div>

    <!-- 4. Master Hub Navigation Console -->
    <nav class="master-hub-dock" aria-label="Navigation">
        <!-- 1. Shop Portal -->
        <button 
            type="button" 
            class="hub-portal-btn shop-portal" 
            on:click={() => isShopOpen = true} 
            title="{$t('shop.title')}"
        >
            <div class="portal-icon-box">
                <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                    <path d="M4 12 L16 4 L28 12 L26 15 L6 15 Z" fill="#f1c40f" stroke="#d4ac0d" stroke-width="1.5"/>
                    <rect x="6" y="15" width="20" height="13" rx="2" fill="#1b1236" stroke="#f1c40f" stroke-width="1.4"/>
                    <path d="M13 28 V20 H19 V28" fill="#a0522d" stroke="#f1c40f" stroke-width="1"/>
                    <circle cx="10" cy="19" r="2" fill="#3498db"/>
                    <circle cx="22" cy="19" r="2" fill="#e74c3c"/>
                </svg>
            </div>
            <div class="portal-texts">
                <span class="portal-name portal-name-full">{$t('shop.title')}</span>
                <span class="portal-name portal-name-short">{$t('nav.shop')}</span>
                <span class="portal-sub">{$t('shop.tabProduction')}</span>
            </div>
        </button>

        <!-- 2. City Portal -->
        <button 
            type="button" 
            class="hub-portal-btn city-portal" 
            on:click={() => isCityOpen = true} 
            title="{$t('city.title')}"
        >
            {#if totalCityNotifications > 0}
                <div class="portal-badge" class:pulse={$readyOrdersCount > 0}>
                    {totalCityNotifications}
                </div>
            {/if}
            <div class="portal-icon-box">
                <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                    <path d="M7 14 L7 28 H25 V14 L20 9 L16 12 L12 9 Z" fill="#1e272e" stroke="#3498db" stroke-width="1.5"/>
                    <rect x="5" y="10" width="5" height="18" fill="#2c3e50" stroke="#3498db" stroke-width="1.2"/>
                    <rect x="22" y="10" width="5" height="18" fill="#2c3e50" stroke="#3498db" stroke-width="1.2"/>
                    <polygon points="7,4 5,10 9,10" fill="#3498db"/>
                    <polygon points="24,4 22,10 26,10" fill="#3498db"/>
                    <path d="M13 28 V20 Q16 17 19 20 V28 Z" fill="#ffd32a"/>
                </svg>
            </div>
            <div class="portal-texts">
                <span class="portal-name portal-name-full">{$t('city.title')}</span>
                <span class="portal-name portal-name-short">{$t('nav.city')}</span>
                <span class="portal-sub">{$t('city.tabOrders')}</span>
            </div>
        </button>

        <!-- 3. Grimoire Portal -->
        <button 
            type="button" 
            class="hub-portal-btn grimoire-portal" 
            on:click={() => isGrimoireOpen = true} 
            title="{$t('grimoire.title')}"
        >
            {#if $finishedExpeditionsCount > 0}
                <div class="portal-badge pulse">
                    {$finishedExpeditionsCount}
                </div>
            {/if}
            <div class="portal-icon-box">
                <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                    <path d="M6 26 C6 26 9 24 16 24 C23 24 26 26 26 26 V6 C26 6 23 4 16 4 C9 4 6 6 6 6 Z" fill="#2d134d" stroke="#a29bfe" stroke-width="1.5"/>
                    <line x1="16" y1="4" x2="16" y2="24" stroke="#a29bfe" stroke-width="1.4"/>
                    <path d="M16 8 Q20 12 16 18 Q12 12 16 8 Z" fill="#f1c40f"/>
                    <path d="M16 24 L16 29 L18 27 L20 29 L20 24" fill="#e74c3c"/>
                </svg>
            </div>
            <div class="portal-texts">
                <span class="portal-name portal-name-full">{$t('grimoire.title')}</span>
                <span class="portal-name portal-name-short">{$t('nav.grimoire')}</span>
                <span class="portal-sub">{$t('alchemy.title')}</span>
            </div>
        </button>

        <!-- 4. Premium Portal -->
        <button 
            type="button" 
            class="hub-portal-btn premium-portal" 
            on:click={() => isPremiumOpen = true} 
            title="{$t('premium.title')}"
        >
            {#if $isVipDailyRewardAvailable}
                <div class="portal-badge pulse vip-alert" title="{$t('header.vipDailyReady')}">
                    !
                </div>
            {/if}
            <div class="portal-icon-box">
                <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                    <path d="M5 23 L27 23 L29 11 L21 17 L16 6 L11 17 L3 11 Z" fill="#f1c40f" stroke="#d4ac0d" stroke-width="1.5"/>
                    <circle cx="16" cy="6" r="2.2" fill="#e74c3c" stroke="#fff" stroke-width="0.8"/>
                    <circle cx="3" cy="11" r="1.8" fill="#3498db"/>
                    <circle cx="29" cy="11" r="1.8" fill="#3498db"/>
                    <rect x="7" y="23" width="18" height="3" rx="1.5" fill="#d35400"/>
                </svg>
            </div>
            <div class="portal-texts">
                <span class="portal-name portal-name-full">{$t('premium.title')}</span>
                <span class="portal-name portal-name-short">{$t('nav.premium')}</span>
                <span class="portal-sub">{$t('common.vip')}</span>
            </div>
        </button>
    </nav>

    <ShopModal 
        isOpen={isShopOpen} 
        onClose={() => { isShopOpen = false; }} 
    />

    <OfflineIncomePopup 
        isOpen={isOfflinePopupOpen} 
        offlineGold={offlineGoldAmount} 
        offlineSeconds={offlineSecondsCount}
        maxOfflineSeconds={maxOfflineSecondsCount}
        currentRate={offlineRatePerSec}
        onClose={() => isOfflinePopupOpen = false} 
    />

    <GrimoireModal 
        isOpen={isGrimoireOpen} 
        onClose={() => { isGrimoireOpen = false; }} 
    />

    <CityModal 
        isOpen={isCityOpen} 
        onClose={() => { isCityOpen = false; }} 
    />

    <PremiumModal 
        isOpen={isPremiumOpen} 
        onClose={() => { isPremiumOpen = false; }} 
    />

    <DailyCalendarModal 
        isOpen={isDailyCalendarOpen} 
        onClose={() => { isDailyCalendarOpen = false; }} 
        onOpenVip={() => { isDailyCalendarOpen = false; isPremiumOpen = true; }} 
    />

    <LuckyWheelModal 
        isOpen={isLuckyWheelOpen} 
        onClose={() => { isLuckyWheelOpen = false; }} 
    />

    <LeaderboardModal 
        isOpen={isLeaderboardOpen} 
        onClose={() => { isLeaderboardOpen = false; }} 
    />

    <MechanicGuideModal />

    <!-- Wait, CustomerOrders is embedded in CityModal now! But we must remove it from App.svelte -->
    <FlyingBonus />
</main>
{:else}
<div class="loading">
    <div class="spinner"></div>
    <p>{$t('hud.loadingMagic')}</p>
</div>
{/if}

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        background-color: #0c0517; /* Deep Arcanum night */
        color: #fff;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        overflow: hidden; /* No scroll */
        -webkit-font-smoothing: antialiased;
    }

    main {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        height: 100dvh;
        max-height: 100dvh;
        background: transparent;
        position: relative;
        overflow: hidden;
    }

    /* ============================================================ */
    /* 1. MASTER HUD PANEL (TOP) */
    /* ============================================================ */
    .master-hud-panel {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: max(10px, env(safe-area-inset-top));
        padding-left: max(18px, env(safe-area-inset-left));
        padding-right: max(18px, env(safe-area-inset-right));
        padding-bottom: 10px;
        background: linear-gradient(180deg, rgba(16, 7, 34, 0.94) 0%, rgba(12, 4, 25, 0.88) 100%);
        border-bottom: 1.5px solid rgba(241, 196, 15, 0.35);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.55), 0 0 15px rgba(241, 196, 15, 0.08);
        z-index: 20;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-sizing: border-box;
        gap: 12px;
        width: 100%;
        max-width: 100vw;
    }

    /* Shop Rank / Crest Box */
    .hud-crest-box {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(241, 196, 15, 0.45);
        padding: 4px 10px;
        border-radius: 12px;
        cursor: pointer;
        transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
        flex-shrink: 0;
        user-select: none;
    }

    .hud-crest-box:hover {
        transform: translateY(-2px);
        background: rgba(241, 196, 15, 0.12);
        border-color: #f1c40f;
    }

    .crest-icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 0 6px rgba(241, 196, 15, 0.5));
    }

    .crest-meta {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 75px;
    }

    .crest-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        line-height: 1;
    }

    .crest-tier {
        font-size: 0.78rem;
        font-weight: 800;
        color: #ffeaa7;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
        letter-spacing: 0.3px;
    }

    .crest-bonus {
        font-size: 0.68rem;
        font-weight: 900;
        color: #2ecc71;
    }

    .crest-progress-track {
        height: 4px;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 2px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .crest-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #f39c12, #f1c40f);
        border-radius: 2px;
        transition: width 0.3s ease;
    }

    /* Chips Row */
    .hud-chips-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
    }

    .hud-chip {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 5px 12px;
        border-radius: 12px;
        cursor: pointer;
        user-select: none;
        transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        position: relative;
    }

    .hud-chip:hover {
        transform: translateY(-2px);
    }

    .chip-svg-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
        flex-shrink: 0;
    }

    .chip-val {
        font-size: 1.05rem;
        font-weight: 800;
        line-height: 1;
        letter-spacing: 0.3px;
    }

    .unit-short {
        display: none;
    }
    .unit-full {
        display: inline;
    }

    /* Specific Chip Themes */
    .gold-chip {
        border-color: rgba(241, 196, 15, 0.35);
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.12), rgba(230, 126, 34, 0.06));
    }
    .gold-chip:hover {
        border-color: #f1c40f;
        box-shadow: 0 0 12px rgba(241, 196, 15, 0.3);
    }
    .gold-val {
        color: #f1c40f;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    }

    .income-chip {
        border-color: rgba(46, 204, 113, 0.35);
        background: linear-gradient(135deg, rgba(46, 204, 113, 0.12), rgba(39, 174, 96, 0.06));
    }
    .income-chip:hover {
        border-color: #2ecc71;
        box-shadow: 0 0 12px rgba(46, 204, 113, 0.3);
    }
    .income-val {
        color: #2ecc71;
        font-size: 0.95rem;
    }

    .crystal-chip {
        border-color: rgba(116, 185, 255, 0.35);
        background: linear-gradient(135deg, rgba(116, 185, 255, 0.12), rgba(9, 132, 227, 0.06));
    }
    .crystal-chip:hover {
        border-color: #74b9ff;
        box-shadow: 0 0 12px rgba(116, 185, 255, 0.3);
    }
    .crystal-val {
        color: #74b9ff;
    }

    .stardust-chip {
        border-color: rgba(224, 86, 253, 0.35);
        background: linear-gradient(135deg, rgba(224, 86, 253, 0.12), rgba(190, 46, 221, 0.06));
    }
    .stardust-chip:hover {
        border-color: #e056fd;
        box-shadow: 0 0 12px rgba(224, 86, 253, 0.3);
    }
    .stardust-val {
        color: #e056fd;
    }

    .vip-chip {
        border-color: rgba(241, 196, 15, 0.5);
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.18), rgba(230, 126, 34, 0.18));
    }
    .vip-chip:hover {
        border-color: #f1c40f;
        box-shadow: 0 0 14px rgba(241, 196, 15, 0.4);
    }
    .vip-val {
        color: #f1c40f;
        font-size: 0.88rem;
    }

    .vip-reward-dot {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 8px;
        height: 8px;
        background: #00cec9;
        border: 1.5px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 8px #00cec9;
        animation: pulseRewardDot 1.5s infinite ease-in-out;
    }

    @keyframes pulseRewardDot {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.7; }
    }

    /* HUD Controls Cluster (Leaderboard & Sound) */
    .hud-controls-cluster {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
    }

    .hud-icon-btn {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.16);
        color: #dfe4ea;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.18s ease;
        padding: 0;
        position: relative;
    }
    .hud-icon-btn::after {
        content: '';
        position: absolute;
        inset: -3px;
    }
    .hud-icon-btn:hover {
        background: rgba(255, 255, 255, 0.16);
        border-color: rgba(255, 255, 255, 0.35);
        transform: translateY(-2px);
    }
    .hud-icon-btn.calendar-btn {
        position: relative;
    }
    .hud-icon-btn.calendar-btn:hover {
        border-color: #ffd32a;
        box-shadow: 0 0 12px rgba(255, 211, 42, 0.4);
    }
    .calendar-notify-dot {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 8px;
        height: 8px;
        background: #ffd32a;
        border: 1.5px solid #110722;
        border-radius: 50%;
        box-shadow: 0 0 8px #ffd32a;
        animation: pulseRewardDot 1.5s infinite ease-in-out;
    }
    .hud-icon-btn.wheel-btn:hover {
        border-color: #f59e0b;
        box-shadow: 0 0 14px rgba(245, 158, 11, 0.45);
    }
    .wheel-notify-dot {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 8px;
        height: 8px;
        background: #f59e0b;
        border: 1.5px solid #110722;
        border-radius: 50%;
        box-shadow: 0 0 8px #f59e0b;
        animation: pulseRewardDot 1.4s infinite ease-in-out;
    }
    .hud-icon-btn.leaderboard-btn:hover {
        border-color: #f1c40f;
        box-shadow: 0 0 12px rgba(241, 196, 15, 0.4);
    }
    .hud-icon-btn.sound-btn.muted {
        color: #e74c3c;
        border-color: rgba(231, 76, 60, 0.45);
        background: rgba(231, 76, 60, 0.12);
    }

    /* ============================================================ */
    /* 2. ACTIVE MAGIC DECK (FLOATING LIVE BUFFS) */
    /* ============================================================ */
    .active-buffs-dock {
        position: absolute;
        top: 72px;
        left: 16px;
        z-index: 15;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: auto;
    }

    .buff-capsule {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(18, 8, 38, 0.85);
        border: 1px solid rgba(162, 155, 254, 0.4);
        padding: 4px 8px;
        border-radius: 12px;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 10px rgba(162, 155, 254, 0.2);
        animation: fadeInBuff 0.3s ease-out;
        transition: transform 0.15s ease;
    }

    .buff-capsule:hover {
        transform: scale(1.05);
        border-color: #f1c40f;
    }

    @keyframes fadeInBuff {
        from { opacity: 0; transform: translateX(-15px); }
        to { opacity: 1; transform: translateX(0); }
    }

    .buff-icon-flask {
        width: 24px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .buff-icon-flask :global(svg) {
        width: 24px;
        height: 28px;
        filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.4));
    }

    .buff-meta-data {
        display: flex;
        flex-direction: column;
        line-height: 1.1;
    }

    .buff-countdown {
        font-size: 0.74rem;
        font-weight: 800;
        color: #ffeaa7;
        font-variant-numeric: tabular-nums;
    }

    .buff-value-tag {
        font-size: 0.65rem;
        font-weight: 900;
        color: #2ecc71;
    }

    /* ============================================================ */
    /* 3. CENTER WORKSHOP */
    /* ============================================================ */
    .center-area {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        z-index: 5;
        padding-bottom: 70px; /* offset for bottom dock */
        box-sizing: border-box;
    }

    /* ============================================================ */
    /* 4. MASTER HUB NAVIGATION CONSOLE (BOTTOM DOCK) */
    /* ============================================================ */
    .master-hub-dock {
        position: absolute;
        bottom: max(16px, env(safe-area-inset-bottom));
        left: 50%;
        transform: translateX(-50%);
        width: calc(100% - 28px);
        max-width: 480px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        background: linear-gradient(165deg, rgba(24, 11, 48, 0.92) 0%, rgba(13, 5, 28, 0.96) 100%);
        border: 1.5px solid rgba(241, 196, 15, 0.4);
        border-radius: 20px;
        padding: 7px 10px;
        box-shadow: 
            0 12px 35px rgba(0, 0, 0, 0.75), 
            0 0 25px rgba(241, 196, 15, 0.12),
            inset 0 1px 6px rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        z-index: 25;
        box-sizing: border-box;
    }

    .hub-portal-btn {
        position: relative;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 14px;
        padding: 6px 4px 5px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        cursor: pointer;
        color: #ffffff;
        transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        outline: none;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
    }

    .hub-portal-btn:hover {
        transform: translateY(-3px);
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(241, 196, 15, 0.35);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
    }

    .hub-portal-btn:active {
        transform: scale(0.96);
    }

    .portal-icon-box {
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.5));
    }

    .portal-texts {
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1.1;
    }

    .portal-name {
        font-size: 0.82rem;
        font-weight: 800;
        color: #dfe6e9;
        letter-spacing: 0.3px;
        transition: color 0.15s ease;
    }

    .portal-name-short {
        display: none;
    }

    .hub-portal-btn:hover .portal-name {
        color: #ffeaa7;
    }

    .portal-sub {
        font-size: 0.62rem;
        font-weight: 600;
        color: rgba(223, 230, 233, 0.6);
        text-transform: uppercase;
        letter-spacing: 0.4px;
    }

    /* Portal Badge */
    .portal-badge {
        position: absolute;
        top: -4px;
        right: 4px;
        background: #e74c3c;
        color: white;
        font-size: 0.72rem;
        font-weight: 900;
        min-width: 18px;
        height: 18px;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        box-shadow: 0 0 10px rgba(231, 76, 60, 0.9);
        border: 1.5px solid rgba(255, 255, 255, 0.95);
        box-sizing: border-box;
        z-index: 5;
    }

    .portal-badge.pulse {
        background: #2ecc71;
        box-shadow: 0 0 12px rgba(46, 204, 113, 0.9);
        animation: portalPulse 1.6s infinite ease-in-out;
    }

    .portal-badge.vip-alert {
        background: #f1c40f;
        color: #1a0a2e;
        border-color: #fff;
        box-shadow: 0 0 12px rgba(241, 196, 15, 0.9);
    }

    @keyframes portalPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.18); }
    }

    /* ============================================================ */
    /* 5. LOADING SCREEN */
    /* ============================================================ */
    .loading {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        width: 100vw;
        background: #0c0517;
        color: #a29bfe;
        font-size: 1.4rem;
        font-weight: 700;
    }

    .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid rgba(162, 155, 254, 0.25);
        border-radius: 50%;
        border-top-color: #f1c40f;
        animation: spin 0.9s ease-in-out infinite;
        margin-bottom: 16px;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* ============================================================ */
    /* 6. RESPONSIVE ADAPTATIONS */
    /* ============================================================ */
    @media (max-width: 680px) {
        .master-hud-panel {
            padding-top: max(6px, env(safe-area-inset-top));
            padding-left: max(6px, env(safe-area-inset-left));
            padding-right: max(6px, env(safe-area-inset-right));
            padding-bottom: 6px;
            gap: 4px;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            max-width: 100vw;
            width: 100%;
            box-sizing: border-box;
            overflow: hidden;
            /* Mobile: disable expensive backdrop-filter — use solid bg instead */
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            background: rgba(16, 7, 34, 0.97);
        }

        .hud-crest-box {
            padding: 2px 6px;
            order: 1;
            flex-shrink: 1;
            min-width: 0;
            max-width: 44%;
        }

        .crest-tier {
            font-size: 0.70rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .crest-bonus {
            font-size: 0.62rem;
            flex-shrink: 0;
        }

        .hud-controls-cluster {
            gap: 3px;
            order: 2;
            flex-shrink: 0;
        }

        .hud-icon-btn {
            width: 31px;
            height: 31px;
            border-radius: 9px;
        }
        .hud-icon-btn::after {
            inset: -4px;
        }

        .hud-icon-btn svg {
            width: 15px;
            height: 15px;
        }

        .lang-label {
            font-size: 0.65rem;
            font-weight: 800;
        }

        .hud-chips-row {
            width: 100%;
            order: 3;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            justify-content: safe center;
            gap: 4px;
            flex-wrap: nowrap;
            overflow-x: auto;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
            padding: 2px 4px;
            box-sizing: border-box;
        }

        .hud-chips-row::-webkit-scrollbar {
            display: none;
        }

        .hud-chip {
            padding: 2px 6px;
            gap: 3px;
            flex-shrink: 0;
            border-radius: 8px;
        }

        .chip-svg-wrap :global(svg) {
            width: 14px !important;
            height: 14px !important;
        }

        .chip-val {
            font-size: 0.75rem;
            font-weight: 800;
            letter-spacing: 0;
        }

        .unit-full {
            display: none;
        }

        .unit-short {
            display: inline;
        }

        .active-buffs-dock {
            top: 76px;
            left: 8px;
            gap: 4px;
        }

        .buff-capsule {
            padding: 2px 5px;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            background: rgba(18, 8, 38, 0.96);
        }

        .master-hub-dock {
            bottom: max(10px, env(safe-area-inset-bottom));
            width: calc(100% - 12px);
            max-width: 420px;
            padding: 4px 3px;
            gap: 2px;
            border-radius: 16px;
            box-sizing: border-box;
            /* Mobile: disable expensive backdrop-filter — use solid bg instead */
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            background: rgba(13, 5, 28, 0.98);
        }

        .hub-portal-btn {
            padding: 4px 1px;
            min-width: 0;
            width: 100%;
            box-sizing: border-box;
        }

        .portal-icon-box svg {
            width: 22px;
            height: 22px;
        }

        .portal-texts {
            max-width: 100%;
            overflow: hidden;
        }

        .portal-name-full {
            display: none;
        }

        .portal-name-short {
            display: block;
            font-size: 0.68rem;
            font-weight: 800;
            color: #dfe6e9;
            letter-spacing: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
            text-align: center;
        }

        .portal-sub {
            display: none; /* Hide sub-labels on mobile for clean breathing room */
        }

        .center-area {
            padding-bottom: 60px;
        }
    }

    @media (max-width: 390px) {
        .master-hud-panel {
            padding-left: max(4px, env(safe-area-inset-left));
            padding-right: max(4px, env(safe-area-inset-right));
            gap: 3px;
        }

        .hud-crest-box {
            padding: 2px 4px;
            gap: 4px;
            max-width: 38%;
        }

        .crest-meta {
            min-width: 0;
        }

        .crest-bonus {
            display: none;
        }

        .hud-controls-cluster {
            gap: 2.5px;
        }

        .hud-icon-btn {
            width: 27px;
            height: 27px;
            border-radius: 7px;
        }

        .hud-icon-btn svg {
            width: 13.5px;
            height: 13.5px;
        }

        .lang-label {
            font-size: 0.58rem;
        }

        .hud-chips-row {
            gap: 2px;
            padding: 1px 2px;
        }

        .hud-chip {
            padding: 2px 4px;
            gap: 2px;
        }

        .chip-val {
            font-size: 0.68rem;
        }

        .master-hub-dock {
            width: calc(100% - 8px);
            padding: 3px 2px;
            gap: 1px;
            border-radius: 14px;
        }

        .hub-portal-btn {
            padding: 3px 0;
        }

        .portal-icon-box svg {
            width: 19px;
            height: 19px;
        }

        .portal-name-short {
            font-size: 0.60rem;
        }
    }
    .shortcut-btn {
        position: relative;
        border-color: rgba(46, 213, 115, 0.4);
        background: rgba(46, 213, 115, 0.08);
    }
    .shortcut-btn:hover {
        border-color: #2ed573;
        background: rgba(46, 213, 115, 0.2);
        box-shadow: 0 0 10px rgba(46, 213, 115, 0.35);
    }
    .shortcut-gift-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #1e272e;
        border: 1px solid #2ed573;
        color: #2ed573;
        font-size: 0.6rem;
        font-weight: 800;
        border-radius: 8px;
        padding: 0px 4px;
        display: flex;
        align-items: center;
        gap: 2px;
        white-space: nowrap;
        pointer-events: none;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
    }

    .shortcut-toast-notification {
        position: fixed;
        bottom: 85px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #1e272e 0%, #2d3436 100%);
        border: 1.5px solid #2ed573;
        border-radius: 12px;
        padding: 10px 18px;
        display: flex;
        align-items: center;
        gap: 10px;
        color: #ffffff;
        font-size: 0.88rem;
        font-weight: 700;
        box-shadow: 0 6px 25px rgba(0,0,0,0.6), 0 0 15px rgba(46, 213, 115, 0.4);
        z-index: 9999;
    }
</style>
