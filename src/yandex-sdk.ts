import { get } from 'svelte/store';
import { 
    gameStore, 
    crystals, 
    isVip, 
    vipExpiresAt, 
    vipLastDailyClaimDate, 
    activateVip30Days, 
    ingredientsCount, 
    potionsCount, 
    unlockedRecipes, 
    failedBrewAttempts, 
    sanitizeOrders,
    type GameState 
} from './store';

import { setAdAudioMute } from './audio';
import { 
    detectInitialLanguage, 
    setLanguage, 
    translate,
    getUpgradeName,
    getUpgradeDesc,
    getSecretUpgradeName,
    getSecretUpgradeDesc
} from './i18n';
import { 
    packSaveData, 
    unpackSaveData, 
    sanitizeStateValues 
} from './security';

declare global {
    interface Window {
        ysdk: any;
    }
}

let ysdk: any = null;
let player: any = null;
let payments: any = null;
let isAdPlaying = false;
let lastInterstitialTime = 0;
let catalogProducts: any[] = [];

const LOCAL_STORAGE_KEY = 'magicShopTycoonSave';

export async function initYandexSdk() {
    try {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isLocal) {
            console.warn('Running locally. Yandex SDK is disabled to prevent console spam.');
            ysdk = null;
        } else if (typeof window.ysdk !== 'undefined') {
            ysdk = window.ysdk;
        } else if (typeof (window as any).YaGames !== 'undefined') {
            ysdk = await (window as any).YaGames.init();
        } else {
            console.warn('Yandex Games SDK not found, using local fallback.');
        }

        if (ysdk) {
            try {
                player = await ysdk.getPlayer();
            } catch (e) {
                console.warn('Player API not available', e);
            }
        }

        // Initialize language via Yandex Games SDK environment with URL and local fallback
        const ysdkLang = ysdk?.environment?.i18n?.lang || null;
        const initialLang = detectInitialLanguage(ysdkLang);
        setLanguage(initialLang);
        console.log('Language initialized:', initialLang, '(SDK environment:', ysdkLang, ')');

        // Sync server time offset to defeat device clock tampering
        updateServerTimeOffset();
    } catch (error) {
        console.error('Failed to init Yandex SDK', error);
    }

    await loadGame();
    await initPayments();

    // Hook unload events for guaranteed final save flush
    if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
            flushCloudSave();
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                flushCloudSave();
            }
        });
    }
}

export function signalGameReady() {
    if (ysdk?.features?.LoadingAPI?.ready) {
        try {
            ysdk.features.LoadingAPI.ready();
            console.log('Yandex SDK: LoadingAPI.ready() signaled.');
        } catch (e) {
            console.warn('Failed to signal LoadingAPI.ready()', e);
        }
    }
}

export function notifyGameplayStart() {
    if (ysdk?.features?.GameplayAPI?.start) {
        try {
            ysdk.features.GameplayAPI.start();
        } catch (e) {}
    }
}

export function notifyGameplayStop() {
    if (ysdk?.features?.GameplayAPI?.stop) {
        try {
            ysdk.features.GameplayAPI.stop();
        } catch (e) {}
    }
}

// --- Payments API ---

async function initPayments() {
    if (!ysdk) return;
    try {
        payments = await ysdk.getPayments({ signed: true });
        try {
            catalogProducts = await payments.getCatalog();
        } catch (e) {
            console.warn('Failed to fetch catalog', e);
        }
        await checkPurchases();
    } catch (e) {
        console.warn('Payments API not available', e);
    }
}

export function getProductDisplayPrice(productId: string, fallback: string): string {
    if (!catalogProducts || catalogProducts.length === 0) return fallback;
    const found = catalogProducts.find((p: any) => p.id === productId);
    return found?.price || fallback;
}

async function checkPurchases() {
    if (!payments) return;
    try {
        const purchasesList = await payments.getPurchases();
        // Consume any pending consumable purchases and activate VIP
        for (const purchase of purchasesList) {
            if (purchase.productID === 'vip_status' || purchase.productID === 'vip_month') {
                activateVip30Days();
                saveGame();
                try {
                    await payments.consumePurchase(purchase.purchaseToken);
                } catch (e) {
                    console.warn('Failed to consume pending VIP purchase', e);
                }
            }
        }
    } catch (e) {
        console.warn('Failed to check purchases', e);
    }
}

export async function purchaseItem(itemId: string): Promise<void> {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (!payments && !isLocal) {
        console.warn('Payments API not initialized');
        throw new Error('Payments API not initialized');
    }

    if (isLocal) {
        console.log('Mocking purchase locally for:', itemId);
        if (itemId === 'pack_crystals_100') {
            crystals.update(n => n + 100);
            saveGame();
        } else if (itemId === 'pack_crystals_300') {
            crystals.update(n => n + 350);
            saveGame();
        } else if (itemId === 'pack_crystals_1000') {
            crystals.update(n => n + 1250);
            saveGame();
        } else if (itemId === 'vip_status' || itemId === 'vip_month') {
            activateVip30Days();
            saveGame();
        }
        return;
    }

    const purchase = await payments.purchase({ id: itemId });

    // Handle purchase result
    if (itemId === 'pack_crystals_100') {
        crystals.update(n => n + 100);
        saveGame();
        try {
            await payments.consumePurchase(purchase.purchaseToken);
        } catch (e) {
            console.warn('Failed to consume purchase', e);
        }
    } else if (itemId === 'pack_crystals_300') {
        crystals.update(n => n + 350);
        saveGame();
        try {
            await payments.consumePurchase(purchase.purchaseToken);
        } catch (e) {
            console.warn('Failed to consume purchase', e);
        }
    } else if (itemId === 'pack_crystals_1000') {
        crystals.update(n => n + 1250);
        saveGame();
        try {
            await payments.consumePurchase(purchase.purchaseToken);
        } catch (e) {
            console.warn('Failed to consume purchase', e);
        }
    } else if (itemId === 'vip_status' || itemId === 'vip_month') {
        activateVip30Days();
        saveGame();
        try {
            await payments.consumePurchase(purchase.purchaseToken);
        } catch (e) {
            console.warn('Failed to consume VIP purchase', e);
        }
    }
}

// --- Save / Load & Throttled Cloud Sync ---

let cloudSaveTimeout: any = null;
let pendingCloudState: any = null;
let lastCloudSaveTime = 0;
const MIN_CLOUD_SAVE_INTERVAL_MS = 8000; // 8 seconds cooldown between cloud saves

let serverTimeOffset = 0;

export function updateServerTimeOffset(): void {
    if (ysdk?.serverTime && typeof ysdk.serverTime === 'function') {
        try {
            const serverMs = ysdk.serverTime();
            if (serverMs > 0) {
                serverTimeOffset = serverMs - Date.now();
            }
        } catch (e) {}
    }
}

export function getServerTime(): number {
    if (ysdk?.serverTime && typeof ysdk.serverTime === 'function') {
        try {
            const serverMs = ysdk.serverTime();
            if (serverMs > 0) return serverMs;
        } catch (e) {}
    }
    return Date.now() + serverTimeOffset;
}

export async function flushCloudSave(): Promise<void> {
    if (!player || !pendingCloudState) return;
    if (cloudSaveTimeout) {
        clearTimeout(cloudSaveTimeout);
        cloudSaveTimeout = null;
    }
    const stateToPush = pendingCloudState;
    pendingCloudState = null;
    lastCloudSaveTime = Date.now();
    try {
        await player.setData(stateToPush);
    } catch (e) {
        console.warn('[CloudSave] Failed to push to Yandex Player API', e);
    }
}

export async function saveGame() {
    const state = get(gameStore);
    const stateToSave = {
        ...state,
        lastSaveTime: getServerTime(),
        crystals: get(crystals),
        isVip: get(isVip),
        vipExpiresAt: get(vipExpiresAt),
        vipLastDailyClaimDate: get(vipLastDailyClaimDate),
        ingredientsCount: get(ingredientsCount),
        potionsCount: get(potionsCount),
        unlockedRecipes: get(unlockedRecipes),
        failedBrewAttempts: get(failedBrewAttempts),
    };

    // 1. Immediate local save with obfuscation & cryptographic checksum
    try {
        const packed = packSaveData(stateToSave);
        localStorage.setItem(LOCAL_STORAGE_KEY, packed);
    } catch (e) {
        console.warn('Failed to save to local storage', e);
    }

    // 2. Throttled Cloud Save (respecting Yandex quota limit)
    if (player) {
        pendingCloudState = stateToSave;
        const now = Date.now();
        const elapsed = now - lastCloudSaveTime;

        if (elapsed >= MIN_CLOUD_SAVE_INTERVAL_MS) {
            flushCloudSave();
        } else if (!cloudSaveTimeout) {
            cloudSaveTimeout = setTimeout(() => {
                flushCloudSave();
            }, MIN_CLOUD_SAVE_INTERVAL_MS - elapsed);
        }
    }
}

export async function loadGame(): Promise<void> {
    let savedData: Partial<GameState> | null = null;
    
    if (player) {
        try {
            const data = await player.getData();
            if (Object.keys(data).length > 0) {
                savedData = sanitizeStateValues(data);
            }
        } catch (e) {
            console.warn('Failed to load from Yandex Player API, using localStorage', e);
        }
    }

    if (!savedData) {
        const localRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localRaw) {
            savedData = unpackSaveData(localRaw);
        }
    }

    if (savedData) {
        gameStore.update(state => {
            const merged = { ...state, ...savedData };
            if (merged.stardust === undefined) merged.stardust = 0;
            if (merged.artifacts === undefined) merged.artifacts = [];
            if (merged.lastQuestDate === undefined) merged.lastQuestDate = '';
            if (merged.quests === undefined || !Array.isArray(merged.quests)) merged.quests = state.quests;
            if (merged.dailyBonusClaimed === undefined) merged.dailyBonusClaimed = false;
            if (merged.unlockedPets === undefined) merged.unlockedPets = ['pet_rat'];
            if (merged.activeExpeditions === undefined) merged.activeExpeditions = [];
            if (merged.activeOrders === undefined || !Array.isArray(merged.activeOrders)) {
                merged.activeOrders = state.activeOrders;
            } else {
                merged.activeOrders = sanitizeOrders(merged.activeOrders);
            }
            if (merged.lastOrderSpawnTime === undefined) merged.lastOrderSpawnTime = Date.now();
            if (merged.activeBuffs === undefined) merged.activeBuffs = [];
            if (merged.unlockedCollections === undefined) merged.unlockedCollections = [];
            if (merged.lastDragonGiftTime === undefined) merged.lastDragonGiftTime = 0;
            if (merged.lastFreeTimeSkipTime === undefined) merged.lastFreeTimeSkipTime = 0;
            if (merged.cauldronOverheatUntil === undefined) merged.cauldronOverheatUntil = 0;
            if (merged.recipeAdHintsUsed === undefined) merged.recipeAdHintsUsed = {};
            if (merged.alchemyBrewsCount === undefined) merged.alchemyBrewsCount = 0;
            if (merged.totalStardustEarned === undefined) merged.totalStardustEarned = merged.stardust || 0;
            if (!merged.petLevels || typeof merged.petLevels !== 'object') {
                merged.petLevels = { 'pet_rat': 1 };
            }
            if (!merged.activeCompanionId) {
                merged.activeCompanionId = merged.unlockedPets?.[0] || 'pet_rat';
            }
            
            // Restore missing upgrades from default state
            // Restore missing upgrades from default state with dynamic reactive getters
            if (!merged.upgrades) {
                merged.upgrades = state.upgrades;
            } else {
                merged.upgrades = state.upgrades.map(defaultU => {
                    const savedU = merged.upgrades.find((u: any) => u.id === defaultU.id);
                    const lvl = savedU ? (savedU.level || 0) : defaultU.level;
                    const u = { ...defaultU, level: lvl };
                    Object.defineProperty(u, 'name', {
                        get() { return getUpgradeName(defaultU.id); },
                        enumerable: true,
                        configurable: true
                    });
                    Object.defineProperty(u, 'description', {
                        get() { return getUpgradeDesc(defaultU.id); },
                        enumerable: true,
                        configurable: true
                    });
                    return u;
                });
            }

            // Restore secret upgrades with seamless migration and dynamic reactive getters
            if (!merged.secretUpgrades) {
                merged.secretUpgrades = state.secretUpgrades;
            } else {
                merged.secretUpgrades = state.secretUpgrades.map(defaultU => {
                    let savedU = merged.secretUpgrades.find((u: any) => u.id === defaultU.id);
                    // Legacy migrations
                    if (!savedU && defaultU.id === 'crystal_transmute') {
                        savedU = merged.secretUpgrades.find((u: any) => u.id === 'magnet');
                    }
                    if (!savedU && defaultU.id === 'archmage_heritage') {
                        savedU = merged.secretUpgrades.find((u: any) => u.id === 'wallet');
                    }
                    if (!savedU && defaultU.id === 'cooldown_mastery') {
                        savedU = merged.secretUpgrades.find((u: any) => u.id === 'alchemy');
                    }
                    const lvl = savedU ? Math.min(defaultU.maxLevel, savedU.level || 0) : defaultU.level;
                    const u = { ...defaultU, level: lvl };
                    Object.defineProperty(u, 'name', {
                        get() { return getSecretUpgradeName(defaultU.id); },
                        enumerable: true,
                        configurable: true
                    });
                    Object.defineProperty(u, 'description', {
                        get() { return getSecretUpgradeDesc(defaultU.id); },
                        enumerable: true,
                        configurable: true
                    });
                    return u;
                });
            }
            
            return merged;
        });

        // Restore premium currency and VIP status separately
        if ((savedData as any).crystals !== undefined) {
            crystals.set((savedData as any).crystals);
        }
        if ((savedData as any).vipExpiresAt !== undefined) {
            vipExpiresAt.set((savedData as any).vipExpiresAt);
        } else if ((savedData as any).isVip) {
            // Legacy VIP fallback: activate 30 days
            vipExpiresAt.set(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
        if ((savedData as any).vipLastDailyClaimDate !== undefined) {
            vipLastDailyClaimDate.set((savedData as any).vipLastDailyClaimDate);
        }

        // Restore alchemy inventory
        if ((savedData as any).ingredientsCount) {
            ingredientsCount.set((savedData as any).ingredientsCount);
        }
        if ((savedData as any).potionsCount) {
            potionsCount.set((savedData as any).potionsCount);
        }
        if ((savedData as any).unlockedRecipes) {
            unlockedRecipes.set((savedData as any).unlockedRecipes);
        }
        if ((savedData as any).failedBrewAttempts !== undefined) {
            const rawFails = Math.max(0, Number((savedData as any).failedBrewAttempts) || 0);
            failedBrewAttempts.set(rawFails);
        }
    }
}

// --- Ads ---

export interface RewardedAdOptions {
    onRewarded?: () => void;
    onClose?: () => void;
    onError?: (err: any) => void;
}

export function showRewardedAd(
    onRewardOrOptions: (() => void) | RewardedAdOptions,
    onCloseParam?: () => void,
    onErrorParam?: (err: any) => void
) {
    const isOptions = typeof onRewardOrOptions === 'object' && onRewardOrOptions !== null;
    const onReward = isOptions ? (onRewardOrOptions.onRewarded || (() => {})) : onRewardOrOptions;
    const onClose = isOptions ? onRewardOrOptions.onClose : onCloseParam;
    const onError = isOptions ? onRewardOrOptions.onError : onErrorParam;

    // If user is VIP — skip ad and reward immediately
    if (get(isVip)) {
        onReward();
        if (onClose) onClose();
        return;
    }

    if (!ysdk) {
        const isLocalDev = typeof window !== 'undefined' && 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

        if (isLocalDev) {
            // Fallback strictly for local testing & development
            isAdPlaying = true;
            setAdAudioMute(true);
            setTimeout(() => {
                onReward();
                isAdPlaying = false;
                setAdAudioMute(false);
                if (onClose) onClose();
            }, 800);
            return;
        }

        // In production, do not grant free reward if ad service is unreachable or blocked
        console.warn('[AdSecurity] Rewarded ad requested but SDK is unavailable.');
        if (onError) onError(new Error('Ad service unavailable'));
        else if (onClose) onClose();
        return;
    }

    try { ysdk.features?.GameplayAPI?.stop(); } catch(e) {}
    ysdk.adv.showRewardedVideo({
        callbacks: {
            onOpen: () => {
                isAdPlaying = true;
                setAdAudioMute(true);
            },
            onRewarded: () => {
                onReward();
            },
            onClose: () => {
                isAdPlaying = false;
                setAdAudioMute(false);
                try { ysdk.features?.GameplayAPI?.start(); } catch(e) {}
                if (onClose) onClose();
            }, 
            onError: (e: any) => {
                console.error('Error while showing rewarded ad:', e);
                isAdPlaying = false;
                setAdAudioMute(false);
                try { ysdk.features?.GameplayAPI?.start(); } catch(e) {}
                if (onError) onError(e);
                else if (onClose) onClose();
            }
        }
    });
}

export function showInterstitialAd(onClose?: () => void) {
    // If user is VIP or cooldown hasn't passed — skip ad
    if (get(isVip)) {
        if (onClose) onClose();
        return;
    }

    const now = Date.now();
    // 3 minutes cooldown
    if (now - lastInterstitialTime < 3 * 60 * 1000) {
        if (onClose) onClose();
        return;
    }

    if (!ysdk) {
        // Fallback for testing
        isAdPlaying = true;
        setAdAudioMute(true);
        try { (ysdk as any)?.features?.GameplayAPI?.stop(); } catch(e) {}
        setTimeout(() => {
            lastInterstitialTime = Date.now();
            isAdPlaying = false;
            setAdAudioMute(false);
            try { (ysdk as any)?.features?.GameplayAPI?.start(); } catch(e) {}
            if (onClose) onClose();
        }, 1000);
        return;
    }

    try { ysdk.features?.GameplayAPI?.stop(); } catch(e) {}
    ysdk.adv.showFullscreenAdv({
        callbacks: {
            onOpen: () => {
                isAdPlaying = true;
                setAdAudioMute(true);
            },
            onClose: (wasShown: boolean) => {
                if (wasShown) {
                    lastInterstitialTime = Date.now();
                }
                isAdPlaying = false;
                setAdAudioMute(false);
                try { ysdk.features?.GameplayAPI?.start(); } catch(e) {}
                if (onClose) onClose();
            },
            onError: (e: any) => {
                console.error('Error while showing interstitial ad:', e);
                isAdPlaying = false;
                setAdAudioMute(false);
                try { ysdk.features?.GameplayAPI?.start(); } catch(e) {}
                if (onClose) onClose();
            }
        }
    });
}

export function isAdActive() {
    return isAdPlaying;
}

// --- Leaderboards API ---

export interface LeaderboardEntry {
    rank: number;
    name: string;
    score: number;
    isUser?: boolean;
    avatarUrl?: string;
}

const LEADERBOARD_NAME = 'stardustmasters';
let leaderboards: any = null;
let lastLeaderboardSubmitTime = 0;

export async function submitLeaderboardScore(score: number): Promise<void> {
    const numericScore = Math.floor(Math.max(0, score));
    if (numericScore <= 0) return;

    // Security & Anti-Cheat: Validate score against total earned
    const state = get(gameStore);
    const verifiedTotal = state.totalStardustEarned || state.stardust || 0;
    
    // Score cannot exceed mathematically earned total stardust
    const safeScore = Math.min(numericScore, Math.floor(verifiedTotal));
    if (safeScore <= 0) return;

    // Rate limiter: max 1 submission every 8 seconds
    const now = Date.now();
    if (now - lastLeaderboardSubmitTime < 8000) {
        return;
    }
    lastLeaderboardSubmitTime = now;

    // Save locally always for fallback
    try {
        const currentSaved = parseInt(localStorage.getItem('localLeaderboardScore') || '0', 10);
        if (safeScore > currentSaved) {
            localStorage.setItem('localLeaderboardScore', String(safeScore));
        }
    } catch (e) {}

    if (!ysdk) return;

    try {
        if (ysdk.leaderboards?.setScore) {
            await ysdk.leaderboards.setScore(LEADERBOARD_NAME, safeScore);
        } else if (typeof ysdk.getLeaderboards === 'function') {
            if (!leaderboards) {
                leaderboards = await ysdk.getLeaderboards();
            }
            await leaderboards.setLeaderboardScore(LEADERBOARD_NAME, safeScore);
        }
    } catch (e) {
        console.warn('Failed to submit leaderboard score to Yandex SDK', e);
    }
}

export async function getLeaderboardEntries(topCount: number = 10): Promise<{ entries: LeaderboardEntry[]; userEntry: LeaderboardEntry | null }> {
    const youLabel = translate('leaderboard.you');
    const anonLabel = translate('leaderboard.anonymousMage');

    const getMockFallback = () => {
        const savedScore = parseInt(localStorage.getItem('localLeaderboardScore') || '0', 10);
        const mockEntries: LeaderboardEntry[] = [
            { rank: 1, name: 'Archmage Merlin', score: Math.max(125000, savedScore + 5000) },
            { rank: 2, name: 'Master White', score: Math.max(84000, savedScore + 2000) },
            { rank: 3, name: 'Alchemist Nika', score: Math.max(52000, savedScore + 500) },
            { rank: 4, name: youLabel, score: savedScore, isUser: true },
            { rank: 5, name: 'Flame Keeper', score: Math.max(15000, Math.floor(savedScore * 0.8)) },
            { rank: 6, name: 'Moon Herbalist', score: 9800 },
            { rank: 7, name: 'Rune Master', score: 6400 },
            { rank: 8, name: 'Star Seeker', score: 3200 },
        ].sort((a, b) => b.score - a.score).map((entry, idx) => ({ ...entry, rank: idx + 1 }));

        const user = mockEntries.find(e => e.isUser) || null;
        return { entries: mockEntries.slice(0, topCount), userEntry: user };
    };

    if (!ysdk) {
        return getMockFallback();
    }

    try {
        let res: any = null;
        if (ysdk.leaderboards?.getEntries) {
            res = await ysdk.leaderboards.getEntries(LEADERBOARD_NAME, {
                quantityTop: topCount,
                includeUser: true,
                quantityAround: 2
            });
        } else if (typeof ysdk.getLeaderboards === 'function') {
            if (!leaderboards) {
                leaderboards = await ysdk.getLeaderboards();
            }
            res = await leaderboards.getLeaderboardEntries(LEADERBOARD_NAME, {
                quantityTop: topCount,
                includeUser: true,
                quantityAround: 2
            });
        }

        if (!res) {
            return getMockFallback();
        }

        const entries: LeaderboardEntry[] = (res.entries || []).map((e: any) => ({
            rank: e.rank,
            name: e.player?.publicName || anonLabel,
            score: e.score,
            isUser: e.player?.uniqueID === player?.getUniqueID?.(),
            avatarUrl: e.player?.getAvatarSrc?.('small') || ''
        }));

        let userEntry: LeaderboardEntry | null = null;
        if (res.userRank && res.userRank > 0) {
            userEntry = entries.find(e => e.isUser) || {
                rank: res.userRank,
                name: player?.getPublicName?.() || youLabel,
                score: res.score || 0,
                isUser: true
            };
        }

        return { entries, userEntry };
    } catch (e) {
        console.warn('Failed to get leaderboard entries from Yandex SDK (using fallback)', e);
        return getMockFallback();
    }
}

