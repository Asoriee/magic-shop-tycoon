import { get } from 'svelte/store';
import { gameStore, crystals, isVip, ingredientsCount, potionsCount, unlockedRecipes, failedBrewAttempts, type GameState } from './store';

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
            ysdk.features.LoadingAPI?.ready();
            try {
                player = await ysdk.getPlayer();
            } catch (e) {
                console.warn('Player API not available', e);
            }
        }
    } catch (error) {
        console.error('Failed to init Yandex SDK', error);
    }

    await loadGame();
    await initPayments();
}

// --- Payments API ---

async function initPayments() {
    if (!ysdk) return;
    try {
        payments = await ysdk.getPayments({ signed: true });
        await checkPurchases();
    } catch (e) {
        console.warn('Payments API not available', e);
    }
}

async function checkPurchases() {
    if (!payments) return;
    try {
        const purchasesList = await payments.getPurchases();
        // Restore non-consumable purchases (VIP)
        for (const purchase of purchasesList) {
            if (purchase.productID === 'vip_status') {
                isVip.set(true);
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
        } else if (itemId === 'vip_status') {
            isVip.set(true);
            saveGame();
        }
        return;
    }

    const purchase = await payments.purchase({ id: itemId });

    // Handle purchase result
    if (itemId === 'pack_crystals_100') {
        crystals.update(n => n + 100);
        saveGame(); // persist crystals immediately after purchase
        // Consumable — must be consumed so it can be bought again
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
    } else if (itemId === 'vip_status') {
        // Non-consumable — just activate and save
        isVip.set(true);
        saveGame();
    }
}

// --- Save / Load ---

export async function saveGame() {
    const state = get(gameStore);
    const stateToSave = {
        ...state,
        lastSaveTime: Date.now(),
        crystals: get(crystals),
        isVip: get(isVip),
        ingredientsCount: get(ingredientsCount),
        potionsCount: get(potionsCount),
        unlockedRecipes: get(unlockedRecipes),
        failedBrewAttempts: get(failedBrewAttempts),
    };
    
    if (player) {
        try {
            await player.setData(stateToSave);
            return;
        } catch (e) {
            console.warn('Failed to save to Yandex Player API, using localStorage', e);
        }
    }
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
}

export async function loadGame(): Promise<void> {
    let savedData: Partial<GameState> | null = null;
    
    if (player) {
        try {
            const data = await player.getData();
            if (Object.keys(data).length > 0) {
                savedData = data;
            }
        } catch (e) {
            console.warn('Failed to load from Yandex Player API, using localStorage', e);
        }
    }

    if (!savedData) {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
            try {
                savedData = JSON.parse(localData);
            } catch (e) {
                console.error('Error parsing local save data', e);
            }
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
            if (merged.activeOrders === undefined) merged.activeOrders = [];
            if (merged.lastOrderSpawnTime === undefined) merged.lastOrderSpawnTime = Date.now();
            if (merged.activeBuffs === undefined) merged.activeBuffs = [];
            if (merged.unlockedCollections === undefined) merged.unlockedCollections = [];
            if (merged.lastDragonGiftTime === undefined) merged.lastDragonGiftTime = 0;
            if (merged.lastFreeTimeSkipTime === undefined) merged.lastFreeTimeSkipTime = 0;
            
            // Restore missing upgrades from default state
            if (!merged.upgrades) {
                merged.upgrades = state.upgrades;
            } else {
                merged.upgrades = state.upgrades.map(defaultU => {
                    const savedU = merged.upgrades.find((u: any) => u.id === defaultU.id);
                    return savedU ? { ...defaultU, level: savedU.level } : defaultU;
                });
            }

            // Restore secret upgrades
            if (!merged.secretUpgrades) {
                merged.secretUpgrades = state.secretUpgrades;
            } else {
                merged.secretUpgrades = state.secretUpgrades.map(defaultU => {
                    const savedU = merged.secretUpgrades.find((u: any) => u.id === defaultU.id);
                    return savedU ? { ...defaultU, level: savedU.level } : defaultU;
                });
            }
            
            return merged;
        });

        // Restore premium currency separately
        if ((savedData as any).crystals !== undefined) {
            crystals.set((savedData as any).crystals);
        }
        if ((savedData as any).isVip !== undefined) {
            isVip.set(!!(savedData as any).isVip);
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
            failedBrewAttempts.set((savedData as any).failedBrewAttempts);
        }
    }
}

// --- Ads ---

export function showRewardedAd(onReward: () => void, onClose: () => void) {
    // If user is VIP — skip ad and reward immediately
    if (get(isVip)) {
        onReward();
        onClose();
        return;
    }

    if (!ysdk) {
        // Fallback for testing
        isAdPlaying = true;
        setTimeout(() => {
            onReward();
            isAdPlaying = false;
            onClose();
        }, 1000);
        return;
    }

    ysdk.adv.showRewardedVideo({
        callbacks: {
            onOpen: () => {
                isAdPlaying = true;
            },
            onRewarded: () => {
                onReward();
            },
            onClose: () => {
                isAdPlaying = false;
                onClose();
            }, 
            onError: (e: any) => {
                console.error('Error while showing rewarded ad:', e);
                isAdPlaying = false;
                onClose();
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
        setTimeout(() => {
            lastInterstitialTime = Date.now();
            isAdPlaying = false;
            if (onClose) onClose();
        }, 1000);
        return;
    }

    ysdk.adv.showFullscreenAdv({
        callbacks: {
            onOpen: () => {
                isAdPlaying = true;
            },
            onClose: (wasShown: boolean) => {
                if (wasShown) {
                    lastInterstitialTime = Date.now();
                }
                isAdPlaying = false;
                if (onClose) onClose();
            },
            onError: (e: any) => {
                console.error('Error while showing interstitial ad:', e);
                isAdPlaying = false;
                if (onClose) onClose();
            }
        }
    });
}

export function isAdActive() {
    return isAdPlaying;
}
