<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { 
        gameStore, 
        currentIdleIncome, 
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
        type Potion
    } from './store';
    import { initYandexSdk, saveGame, isAdActive, showInterstitialAd } from './yandex-sdk';
    import Cauldron from './components/Cauldron.svelte';
    import OfflineIncomePopup from './components/OfflineIncomePopup.svelte';
    import ShopModal from './components/ShopModal.svelte';
    import ParallaxBackground from './components/ParallaxBackground.svelte';
    import PetCompanion from './components/PetCompanion.svelte';
    
    import GrimoireModal from './components/GrimoireModal.svelte';
    import CityModal from './components/CityModal.svelte';
    import PremiumModal from './components/PremiumModal.svelte';
    import FlyingBonus from './components/FlyingBonus.svelte';
    
    

    let isOfflinePopupOpen = false;
    let isGrimoireOpen = false;
    let isCityOpen = false;
    let isPremiumOpen = false;
    let isShopOpen = false;
    
    let offlineGoldAmount = 0;
    let offlineSecondsCount = 0;
    let maxOfflineSecondsCount = 0;
    let offlineRatePerSec = 0;
    let isReady = false;
    let gameLoop: number;
    let hiddenTimestamp = 0;
    let autoSaveCounter = 0;
    let nowTime = Date.now();

    $: totalCityNotifications = $readyOrdersCount + $unclaimedQuestsCount;
    $: liveBuffs = ($gameStore?.activeBuffs || []).filter(b => b.expiresAt > nowTime);

    function formatBuffTime(expiresAt: number): string {
        const diff = Math.max(0, Math.floor((expiresAt - nowTime) / 1000));
        const m = Math.floor(diff / 60);
        const s = diff % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function getPotionSvg(potionId: string): string {
        const found = AVAILABLE_POTIONS.find((p: Potion) => p.id === potionId);
        return found?.icon || '';
    }

    function getPotionName(potionId: string): string {
        const found = AVAILABLE_POTIONS.find((p: Potion) => p.id === potionId);
        return found?.name || 'Зелье';
    }

    function checkOfflineEarnings(forcedAwayMs?: number) {
        const now = Date.now();
        const lastSave = $gameStore?.lastSaveTime || now;
        const rawDiffMs = typeof forcedAwayMs === 'number' && forcedAwayMs > 0 
            ? forcedAwayMs 
            : Math.max(0, now - lastSave);

        const maxHours = $maxOfflineTimeHours || 2;
        const maxOfflineMs = maxHours * 3600 * 1000;
        const cappedDiffMs = Math.min(rawDiffMs, maxOfflineMs);
        const cappedSeconds = Math.floor(cappedDiffMs / 1000);
        const awaySeconds = Math.floor(rawDiffMs / 1000);
        const idleRate = $currentIdleIncome || 0;

        if (cappedSeconds >= 60 && idleRate > 0) {
            offlineGoldAmount = Math.floor(cappedSeconds * idleRate);
            offlineSecondsCount = awaySeconds;
            maxOfflineSecondsCount = maxHours * 3600;
            offlineRatePerSec = idleRate;
            if (offlineGoldAmount > 0) {
                isOfflinePopupOpen = true;
            }
        }

        gameStore.setLastSaveTime(now);
        saveGame();
    }

    function handleVisibilityChange() {
        if (document.hidden) {
            hiddenTimestamp = Date.now();
            gameStore.setLastSaveTime(hiddenTimestamp);
            saveGame();
        } else {
            if (hiddenTimestamp > 0) {
                const awayMs = Date.now() - hiddenTimestamp;
                hiddenTimestamp = 0;
                if (awayMs >= 60 * 1000) {
                    checkOfflineEarnings(awayMs);
                } else {
                    gameStore.setLastSaveTime(Date.now());
                }
            }
        }
    }

    function handleWindowFocus() {
        if (hiddenTimestamp > 0) {
            const awayMs = Date.now() - hiddenTimestamp;
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

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleWindowFocus);

        // Start idle loop with throttled auto-save
        gameLoop = setInterval(() => {
            nowTime = Date.now();
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
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleWindowFocus);
    });

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            const wasAnyOpen = isGrimoireOpen || isCityOpen || isPremiumOpen || isShopOpen;
            isGrimoireOpen = false;
            isCityOpen = false;
            isPremiumOpen = false;
            isShopOpen = false;
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
            title="Ранг мастерства лавки: {$milestoneInfo?.tier + 1} (Множитель: x{$milestoneInfo?.multiplier?.toFixed(2)}). Нажмите для перехода в Лавку" 
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
                    <span class="crest-tier">Ранг {$milestoneInfo?.tier + 1}</span>
                    <span class="crest-bonus">x{$milestoneInfo?.multiplier?.toFixed(2)}</span>
                </div>
                <div class="crest-progress-track" title="Прогресс до следующего ранга: {$milestoneInfo?.progress} / 25">
                    <div class="crest-progress-fill" style="width: {(($milestoneInfo?.progress || 0) / 25) * 100}%"></div>
                </div>
            </div>
        </div>

        <!-- Interactive Resource Chips -->
        <div class="hud-chips-row">
            <!-- Gold Chip -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="hud-chip gold-chip" title="Золото (нажмите для перехода в Лавку)" on:click={() => isShopOpen = true}>
                <span class="chip-svg-wrap">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <circle cx="12" cy="12" r="10" fill="#f1c40f" stroke="#b7791f" stroke-width="1.8"/>
                        <circle cx="12" cy="12" r="6.5" fill="#f39c12"/>
                        <circle cx="12" cy="12" r="3" fill="#ffeaa7"/>
                    </svg>
                </span>
                <span class="chip-val gold-val">{formatNumber($gameStore.gold)}</span>
            </div>

            <!-- Idle Income Chip -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="hud-chip income-chip" title="Пассивный доход в секунду (нажмите для перехода в Лавку)" on:click={() => isShopOpen = true}>
                <span class="chip-svg-wrap">
                    <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                        <path d="M3 14 L8 9 L12 13 L18 5" stroke="#2ecc71" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <polyline points="13,5 18,5 18,10" stroke="#2ecc71" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
                <span class="chip-val income-val">+{formatNumber($currentIdleIncome)}/с</span>
            </div>

            <!-- Crystals Chip -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="hud-chip crystal-chip" title="Кристаллы (нажмите для перехода в Сокровищницу)" on:click={() => isPremiumOpen = true}>
                <span class="chip-svg-wrap">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                        <polygon points="12,2 20,7 16,21 8,21 4,7" fill="#74b9ff" stroke="#0984e3" stroke-width="1.5"/>
                        <polygon points="12,2 16,7 12,16 8,7" fill="#a0d2ff"/>
                    </svg>
                </span>
                <span class="chip-val crystal-val">{formatNumber($crystals)}</span>
            </div>

            <!-- Stardust Chip (Shows if stardust > 0 or has artifacts) -->
            {#if $gameStore.stardust > 0 || $gameStore.artifacts.length > 0}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="hud-chip stardust-chip" title="Звёздная Пыль (нажмите для перехода к Алтарю Перерождения)" on:click={() => isPremiumOpen = true}>
                <span class="chip-svg-wrap">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                        <path d="M12 2 L14 8 L20 10 L15 14 L17 21 L12 17 L7 21 L9 14 L4 10 L10 8 Z" fill="#e056fd" stroke="#be2edd" stroke-width="1.5"/>
                    </svg>
                </span>
                <span class="chip-val stardust-val">{formatNumber($gameStore.stardust)}</span>
            </div>
            {/if}

            <!-- VIP Status Chip -->
            {#if $isVip}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="hud-chip vip-chip" title="VIP-статус: активно {$vipDaysLeft} дн. (нажмите для управления)" on:click={() => isPremiumOpen = true}>
                <span class="chip-svg-wrap">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                        <path d="M4 17 L20 17 L22 8 L17 12 L12 4 L7 12 L2 8 Z" fill="#f1c40f" stroke="#d4ac0d" stroke-width="1.5"/>
                        <circle cx="12" cy="17" r="1.5" fill="#e74c3c"/>
                    </svg>
                </span>
                <span class="chip-val vip-val">VIP {$vipDaysLeft}д</span>
                {#if $isVipDailyRewardAvailable}
                    <span class="vip-reward-dot" title="Доступна ежедневная награда VIP"></span>
                {/if}
            </div>
            {/if}
        </div>
    </header>

    <!-- 2. Active Magic Deck (Live Potion Countdown Widgets) -->
    {#if liveBuffs.length > 0}
        <div class="active-buffs-dock" aria-label="Активные чародейские зелья">
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
    <nav class="master-hub-dock" aria-label="Порталы лавки">
        <!-- 1. Shop Portal -->
        <button 
            type="button" 
            class="hub-portal-btn shop-portal" 
            on:click={() => isShopOpen = true} 
            title="Лавка улучшений"
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
                <span class="portal-name">Лавка</span>
                <span class="portal-sub">Апгрейды</span>
            </div>
        </button>

        <!-- 2. City Portal -->
        <button 
            type="button" 
            class="hub-portal-btn city-portal" 
            on:click={() => isCityOpen = true} 
            title="Королевский Город (рынок, заказы, квесты)"
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
                <span class="portal-name">Город</span>
                <span class="portal-sub">Рынок</span>
            </div>
        </button>

        <!-- 3. Grimoire Portal -->
        <button 
            type="button" 
            class="hub-portal-btn grimoire-portal" 
            on:click={() => isGrimoireOpen = true} 
            title="Древний Гримуар (алхимия, экспедиции, артефакты)"
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
                <span class="portal-name">Гримуар</span>
                <span class="portal-sub">Алхимия</span>
            </div>
        </button>

        <!-- 4. Premium Portal -->
        <button 
            type="button" 
            class="hub-portal-btn premium-portal" 
            on:click={() => isPremiumOpen = true} 
            title="Великий Арканум (Сокровищница, Хрономантия, Перерождение)"
        >
            {#if $isVipDailyRewardAvailable}
                <div class="portal-badge pulse vip-alert" title="Доступна ежедневная награда VIP">
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
                <span class="portal-name">Премиум</span>
                <span class="portal-sub">Арканум</span>
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

    <!-- Wait, CustomerOrders is embedded in CityModal now! But we must remove it from App.svelte -->
    <FlyingBonus />
</main>
{:else}
<div class="loading">
    <div class="spinner"></div>
    <p>Загрузка магии...</p>
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
        min-height: 100vh;
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
        padding: 10px 18px;
        background: linear-gradient(180deg, rgba(16, 7, 34, 0.94) 0%, rgba(12, 4, 25, 0.88) 100%);
        border-bottom: 1.5px solid rgba(241, 196, 15, 0.35);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.55), 0 0 15px rgba(241, 196, 15, 0.08);
        z-index: 20;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-sizing: border-box;
        gap: 12px;
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
        bottom: 16px;
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
            padding: 8px 10px;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: center;
        }

        .hud-crest-box {
            padding: 3px 8px;
        }

        .hud-chip {
            padding: 4px 8px;
            gap: 4px;
        }

        .chip-val {
            font-size: 0.92rem;
        }

        .active-buffs-dock {
            top: 86px;
            left: 8px;
            gap: 6px;
        }

        .buff-capsule {
            padding: 3px 6px;
        }

        .master-hub-dock {
            bottom: 10px;
            width: calc(100% - 16px);
            padding: 5px 6px;
            gap: 4px;
            border-radius: 16px;
        }

        .hub-portal-btn {
            padding: 5px 2px;
        }

        .portal-name {
            font-size: 0.74rem;
        }

        .portal-sub {
            display: none; /* Hide sub-labels on mobile for clean breathing room */
        }

        .center-area {
            padding-bottom: 60px;
        }
    }
</style>
