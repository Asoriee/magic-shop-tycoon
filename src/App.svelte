<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { gameStore, currentIdleIncome, maxOfflineTimeHours, formatNumber, crystals, isVip } from './store';
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
    let isReady = false;
    let gameLoop: number;

    $: hasUnclaimedQuests = $gameStore.quests.some(q => q.isCompleted && !q.isClaimed);

    onMount(async () => {
        // Init SDK and load game
        await initYandexSdk();
        gameStore.checkDailyQuests();
        
        // Calculate offline income
        const now = Date.now();
        const maxOfflineTimeMs = $maxOfflineTimeHours * 3600 * 1000;
        const timeDiffMs = Math.min(now - $gameStore.lastSaveTime, maxOfflineTimeMs);
        const timeDiffSeconds = timeDiffMs / 1000;
        
        if (timeDiffSeconds > 60 && $currentIdleIncome > 0) { // Only show if away for > 1 min
            offlineGoldAmount = Math.floor(timeDiffSeconds * $currentIdleIncome);
            if (offlineGoldAmount > 0) {
                isOfflinePopupOpen = true;
            }
        }
        
        gameStore.setLastSaveTime(now);
        isReady = true;

        // Start idle loop
        gameLoop = setInterval(() => {
            if (!isAdActive()) {
                gameStore.addGold($currentIdleIncome);
                saveGame();
            }
        }, 1000);
    });

    onDestroy(() => {
        if (gameLoop) clearInterval(gameLoop);
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
    <ParallaxBackground />
    
    <div class="top-panel">
        <div class="resource-box">
            <span class="icon">💰</span>
            <span class="value">{formatNumber($gameStore.gold)}</span>
        </div>
        <div class="resource-box">
            <span class="icon">📈</span>
            <span class="value">{formatNumber($currentIdleIncome)}/сек</span>
        </div>
        {#if $gameStore.stardust > 0 || $gameStore.artifacts.length > 0}
        <div class="resource-box stardust-box">
            <span class="icon">✨</span>
            <span class="value">{formatNumber($gameStore.stardust)}</span>
        </div>
        {/if}
        <div class="resource-box crystals-box" title="Откройте Премиум внизу экрана, чтобы купить больше!">
            <span class="icon">💎</span>
            <span class="value">{formatNumber($crystals)}</span>
        </div>
        {#if $isVip}
        <div class="resource-box vip-box">
            <span class="icon">👑</span>
            <span class="value">VIP</span>
        </div>
        {/if}
    </div>

    <div class="hub-buttons">
        <button class="hub-btn shop-btn" on:click={() => isShopOpen = true} title="Лавка">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
                <path d="M12 18H6V14H12V18M20 14V18H14V14H20M20 11.1L18.8 8H5.2L4 11.1V12H20V11.1M20.2 6L21 9.8V13H22V15H20V20H4V15H2V13H3V9.8L3.8 6H20.2M12 20H14V22H10V20H12M6 2L8 4L6 6L4 4L6 2M18 2L20 4L18 6L16 4L18 2Z" />
            </svg>
            <span>Лавка</span>
        </button>

        <button class="hub-btn city-btn" on:click={() => isCityOpen = true} title="Городской Рынок">
            {#if hasUnclaimedQuests}
                <div class="notification-dot"></div>
            {/if}
            <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
                <path d="M12,3L2,12H5V20H19V12H22L12,3M12,7.7C14.1,7.7 15.8,9.4 15.8,11.5C15.8,14.5 12,18 12,18C12,18 8.2,14.5 8.2,11.5C8.2,9.4 9.9,7.7 12,7.7Z" />
            </svg>
            <span>Город</span>
        </button>

        <button class="hub-btn grimoire-btn" on:click={() => isGrimoireOpen = true} title="Гримуар">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
                <path d="M21,5C19.89,4.65 18.67,4.5 17.5,4.5C15.55,4.5 13.45,4.9 12,6C10.55,4.9 8.45,4.5 6.5,4.5C4.55,4.5 2.45,4.9 1,6V20.65C1,20.9 1.25,21.15 1.5,21.15C1.6,21.15 1.65,21.1 1.75,21.1C3.1,20.45 5.05,20 6.5,20C8.45,20 10.55,20.4 12,21.5C13.35,20.65 15.8,20 17.5,20C19.1,20 20.65,20.25 22.2,21C22.3,21.05 22.4,21.1 22.5,21.1C22.75,21.1 23,20.85 23,20.6V6C22.4,5.55 21.75,5.25 21,5M21,18.5C19.9,18.15 18.75,18 17.5,18C15.8,18 13.35,18.65 12,19.5V8C13.35,7.15 15.8,6.5 17.5,6.5C18.75,6.5 19.9,6.65 21,7V18.5Z" />
            </svg>
            <span>Гримуар</span>
        </button>

        <button class="hub-btn premium-btn" on:click={() => isPremiumOpen = true} title="Премиум">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
                <path d="M12,2L1,12H4V21H20V12H23L12,2M12,11A3,3 0 0,1 15,14A3,3 0 0,1 12,17A3,3 0 0,1 9,14A3,3 0 0,1 12,11M12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5Z" />
            </svg>
            <span>Премиум</span>
        </button>
    </div>

    <div class="center-area">
        <PetCompanion />
        <Cauldron />
    </div>

    <ShopModal 
        isOpen={isShopOpen} 
        onClose={() => { isShopOpen = false; }} 
    />

    <OfflineIncomePopup 
        isOpen={isOfflinePopupOpen} 
        offlineGold={offlineGoldAmount} 
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
        background-color: #1e1e2f; /* Dark background */
        color: #fff;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        overflow: hidden; /* No scroll */
        -webkit-font-smoothing: antialiased;
    }

    main {
        display: flex;
        flex-direction: column;
        width: 100vw;
        height: 100vh;
        background: transparent;
    }

    .top-panel {
        display: flex;
        justify-content: space-around;
        padding: 20px;
        background: rgba(0, 0, 0, 0.4);
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 10;
        backdrop-filter: blur(5px);
        border-bottom: 2px solid rgba(255,255,255,0.05);
    }

    .resource-box {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(255, 255, 255, 0.1);
        padding: 10px 20px;
        border-radius: 15px;
        font-size: 1.5rem;
        font-weight: bold;
        box-shadow: inset 0 2px 5px rgba(0,0,0,0.2);
    }

    .resource-box .icon {
        filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));
    }
    
    .resource-box .value {
        color: #f1c40f;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }

    .hub-buttons {
        position: absolute;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 20px;
        z-index: 20;
    }

    .hub-btn {
        background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(0,0,0,0.5));
        border: 2px solid rgba(255,255,255,0.2);
        border-radius: 20px;
        padding: 10px 20px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 5px;
        cursor: pointer;
        box-shadow: 0 8px 20px rgba(0,0,0,0.6);
        transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        position: relative;
        backdrop-filter: blur(5px);
        color: white;
        font-family: inherit;
        font-weight: bold;
        font-size: 0.9rem;
    }

    .hub-btn:hover {
        transform: translateY(-5px) scale(1.05);
        box-shadow: 0 12px 25px rgba(0,0,0,0.8);
        border-color: rgba(255,255,255,0.5);
    }

    .hub-btn.city-btn {
        background: linear-gradient(135deg, rgba(52, 152, 219, 0.2), rgba(41, 128, 185, 0.8));
        border-color: rgba(52, 152, 219, 0.5);
        color: #74b9ff;
    }
    .hub-btn.city-btn:hover { border-color: #74b9ff; }

    .hub-btn.grimoire-btn {
        background: linear-gradient(135deg, rgba(155, 89, 182, 0.2), rgba(142, 68, 173, 0.8));
        border-color: rgba(155, 89, 182, 0.5);
        color: #a29bfe;
    }
    .hub-btn.grimoire-btn:hover { border-color: #a29bfe; }

    .hub-btn.premium-btn {
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.2), rgba(230, 126, 34, 0.8));
        border-color: rgba(241, 196, 15, 0.5);
        color: #f1c40f;
    }
    .hub-btn.premium-btn:hover { border-color: #f1c40f; }

    .crystals-box .value { color: #74b9ff; }

    .vip-box {
        border: 1px solid rgba(241, 196, 15, 0.5);
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.15), rgba(230, 126, 34, 0.15));
    }
    .vip-box .value { color: #f1c40f; }

    .notification-dot {
        position: absolute;
        top: -5px;
        right: -5px;
        width: 14px;
        height: 14px;
        background: #e74c3c;
        border-radius: 50%;
        border: 2px solid #d35400;
    }

    .stardust-box .value {
        color: #3498db;
    }

    .center-area {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
    }

    .loading {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        width: 100vw;
        background: #151522;
        color: #a29bfe;
        font-size: 1.5rem;
    }

    .spinner {
        width: 50px;
        height: 50px;
        border: 5px solid rgba(162, 155, 254, 0.3);
        border-radius: 50%;
        border-top-color: #a29bfe;
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 20px;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
</style>
