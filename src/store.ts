import { writable, get, derived } from 'svelte/store';
import { 
    formatNumberLocalized, 
    translate,
    getIngredientName, 
    getPotionName, 
    getPotionDesc, 
    getPetName, 
    getPetDesc,
    getUpgradeName,
    getUpgradeDesc,
    getSecretUpgradeName,
    getSecretUpgradeDesc,
    getArtifactName,
    getArtifactDesc,
    getCollectionName,
    getCollectionDesc,
    getCollectionPerks,
    getCustomerName
} from './i18n';
import { type PetBonusData, getPetBonusValues } from './petBonuses';
export type { PetBonusData };
export { getPetBonusValues };
import { 
    ACHIEVEMENTS, 
    calculateAchievementPerks, 
    getAchievementStatus, 
    getAchievementCurrentProgress,
    type AchievementId 
} from './achievements';
export { ACHIEVEMENTS, calculateAchievementPerks, getAchievementStatus, getAchievementCurrentProgress };
export type { AchievementId };

// ============================================================
// UTILS
// ============================================================

export function formatNumber(num: number | undefined | null): string {
    return formatNumberLocalized(num);
}

// ============================================================
// TYPES
// ============================================================

export type QuestType = 
    | 'clicks' 
    | 'buy_upgrades' 
    | 'watch_ads' 
    | 'brew_potions' 
    | 'complete_orders' 
    | 'send_expeditions';

export type QuestRewardType = 'gold' | 'crystals' | 'stardust';
export type QuestDifficulty = 'easy' | 'medium' | 'hard';

export interface Quest {
    id: string;
    type: QuestType;
    difficulty: QuestDifficulty;
    target: number;
    current: number;
    rewardType: QuestRewardType;
    rewardAmount: number;
    reward?: number; // legacy fallback
    isCompleted: boolean;
    isClaimed: boolean;
}

export type UpgradeType = 'click' | 'idle' | 'crit' | 'resonance' | 'heat' | 'hearth' | 'resonance_flow' | 'crit_dmg';
export type UpgradeCategory = 'production' | 'click' | 'mastery';

export interface Upgrade {
    id: string;
    name: string;
    description: string;
    type: UpgradeType;
    category: UpgradeCategory;
    baseCost: number;
    costMultiplier: number;
    baseValue: number;
    level: number;
    iconSvg: string;
}

export type SecretUpgradeId = 
    | 'stardust_extractor'
    | 'essence_mastery'
    | 'scout_whisper'
    | 'orders'
    | 'cooldown_mastery'
    | 'crystal_transmute'
    | 'archmage_heritage'
    | 'familiar'
    | 'magnet'
    | 'alchemy'
    | 'wallet'
    | 'astral_resonance';

export interface SecretUpgrade {
    id: SecretUpgradeId;
    name: string;
    description: string;
    category?: 'ritual' | 'alchemy' | 'expeditions' | 'orders' | 'economy';
    baseCost: number;
    costMultiplier: number;
    level: number;
    maxLevel: number;
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ChestType = 'wooden' | 'alchemist' | 'magical' | 'astral' | 'titan';

export interface ChestDropItem {
    type: 'ingredient' | 'potion' | 'gold' | 'crystals' | 'pet';
    id: string;
    name: string;
    count: number;
    rarity: Rarity;
    icon?: string;
    goldAmount?: number;
    crystalAmount?: number;
    potion?: Potion;
    ingredient?: Ingredient;
    pet?: Pet;
}

export interface ChestResult {
    chestType: ChestType;
    drops: ChestDropItem[];
    totalGold: number;
    totalCrystals: number;
    isDoubleResonance: boolean;
    resonanceGain: number;
}

export interface Ingredient {
    id: string;
    name: string;
    rarity: Rarity;
    icon: string; // inline SVG string
}

export type PotionEffect = 'gold_multiplier' | 'click_multiplier' | 'idle_multiplier';

export interface Potion {
    id: string;
    name: string;
    icon: string;
    description: string;
    effect: PotionEffect;
    value: number;   // multiplier value, e.g. 0.5 = +50%
    durationMin: number; // in game-minutes (display only for now)
}


export interface Pet {
    id: string;
    name: string;
    rarity: Rarity;
    icon: string;
    description: string;
    isCollectionExclusive?: boolean;
    expeditionHours?: number;
}

export interface ActiveExpedition {
    petId: string;
    startTime: number;
    durationMs: number;
}

export interface OrderRequirement {
    type: 'ingredient' | 'potion';
    id: string;
    count: number;
}

export interface CustomerOrder {
    id: string;
    name: string;
    icon: string;
    orderType?: 'common' | 'potion' | 'vip';
    requirements: OrderRequirement[];
    goldSeconds?: number;
    minGold?: number;
    rewardGold: number;
    rewardCrystals?: number;
    rewardChest?: ChestType | null;
    rewardStardust?: number;
    isVip: boolean;
}

export interface ActiveBuff {
    potionId: string;
    expiresAt: number;
    effect: PotionEffect;
    value: number;
}

export interface Artifact {
    id: number;
    name: string;
    description: string;
    cost: number;
    svg: string;
}

export interface CollectionPerk {
    iconColor: string;
    text: string;
}

export interface Collection {
    id: string;
    name: string;
    description: string;
    themeColor: string;
    requiredArtifactIds: number[];
    rewardPetId: string;
    perks: CollectionPerk[];
}

export interface GameState {
    gold: number;
    lastSaveTime: number;
    stardust: number;
    artifacts: number[];
    upgrades: Upgrade[];
    secretUpgrades: SecretUpgrade[];
    lastQuestDate: string;
    quests: Quest[];
    dailyBonusClaimed?: boolean;
    unlockedPets: string[];
    activeExpeditions: ActiveExpedition[];
    activeOrders: CustomerOrder[];
    lastOrderSpawnTime: number;
    activeBuffs: ActiveBuff[];
    unlockedCollections: string[];
    lastFreeChestTime?: number;
    lastDragonGiftTime?: number;
    lastFreeTimeSkipTime?: number;
    vipExpiresAt?: number;
    vipLastDailyClaimDate?: string;
    chestResonanceProgress?: number;
    cauldronOverheatUntil?: number;
    recipeAdHintsUsed?: Record<string, boolean>;
    alchemyBrewsCount?: number;
    secretKnowledgeBoostUntil?: number;
    petLevels?: Record<string, number>;
    totalStardustEarned?: number;
    activeCompanionId?: string;
    showFamiliarOnMain?: boolean;
    viewedGuides?: string[];
    potionMastery?: Record<string, number>;
    potionMasteryXp?: Record<string, number>;
    calendarDay?: number;
    calendarLastClaimDate?: string;
    calendarSeason?: number;
    hasCreatedShortcut?: boolean;
    artifactOvercharge?: Record<number, number>;
    hasRelicEternityEye?: boolean;
    hasNoAds?: boolean;
    hasBoughtStarterPack?: boolean;
    luckyWheel?: LuckyWheelState;
    achievements?: Record<string, number>;
    totalGoldEarned?: number;
    rebirthCount?: number;
    ordersCompletedCount?: number;
}

export interface LuckyWheelState {
    lastFreeSpinTimestamp: number;
    adSpinsCount: number;
    lastAdSpinTimestamp: number;
    adSpinsDate: string;
    pityProgress: number;
    totalSpins: number;
}

// ============================================================
// ALCHEMY: INGREDIENTS CATALOGUE
// ============================================================

export const AVAILABLE_INGREDIENTS: Ingredient[] = [
    // --- Common ---
    {
        id: 'herb_mundane',
        get name() { return getIngredientName('herb_mundane'); },
        rarity: 'common',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40">
            <path d="M20 35 Q10 20 12 8 Q16 15 20 12 Q24 15 28 8 Q30 20 20 35Z" fill="#55efc4" stroke="#00b894" stroke-width="1.5"/>
            <line x1="20" y1="35" x2="20" y2="20" stroke="#00b894" stroke-width="1.5"/>
        </svg>`
    },
    {
        id: 'mushroom_gray',
        get name() { return getIngredientName('mushroom_gray'); },
        rarity: 'common',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40">
            <ellipse cx="20" cy="18" rx="14" ry="9" fill="#b2bec3"/>
            <rect x="17" y="18" width="6" height="12" rx="2" fill="#dfe6e9"/>
            <ellipse cx="20" cy="18" rx="8" ry="4" fill="#636e72" opacity="0.3"/>
        </svg>`
    },
    {
        id: 'toadstone',
        get name() { return getIngredientName('toadstone'); },
        rarity: 'common',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40">
            <ellipse cx="20" cy="24" rx="12" ry="8" fill="#81ecec"/>
            <ellipse cx="20" cy="22" rx="8" ry="5" fill="#00cec9"/>
            <circle cx="16" cy="20" r="2" fill="#2d3436"/>
            <circle cx="24" cy="20" r="2" fill="#2d3436"/>
        </svg>`
    },
    // --- Rare ---
    {
        id: 'moonpetal',
        get name() { return getIngredientName('moonpetal'); },
        rarity: 'rare',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40">
            <defs><filter id="rareGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
            <path d="M20 5 Q28 14 28 22 Q28 32 20 35 Q12 32 12 22 Q12 14 20 5Z" fill="#74b9ff" filter="url(#rareGlow)" opacity="0.9"/>
            <path d="M20 10 Q25 17 25 22 Q25 30 20 32" fill="none" stroke="white" stroke-width="1" opacity="0.5"/>
        </svg>`
    },
    {
        id: 'fairy_breath',
        get name() { return getIngredientName('fairy_breath'); },
        rarity: 'rare',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40">
            <defs><filter id="rareGlowFairy"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
            <circle cx="20" cy="20" r="10" fill="rgba(255, 159, 243, 0.4)" filter="url(#rareGlowFairy)"/>
            <path d="M20 35 Q10 20 20 5 Q30 20 20 35Z" fill="#ff9ff3" opacity="0.7"/>
            <circle cx="20" cy="20" r="4" fill="white"/>
        </svg>`
    },
    {
        id: 'fire_salamander',
        get name() { return getIngredientName('fire_salamander'); },
        rarity: 'rare',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40">
            <defs><filter id="rareGlow2"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
            <path d="M8 30 Q15 10 28 8 Q22 20 30 32 Q20 25 8 30Z" fill="#fd79a8" filter="url(#rareGlow2)"/>
            <circle cx="27" cy="10" r="3" fill="#e17055"/>
        </svg>`
    },
    {
        id: 'stardew',
        get name() { return getIngredientName('stardew'); },
        rarity: 'rare',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40">
            <defs><filter id="rareGlow3"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
            <ellipse cx="20" cy="26" rx="8" ry="10" fill="#74b9ff" filter="url(#rareGlow3)" opacity="0.8"/>
            <polygon points="20,5 22,12 29,12 24,17 26,24 20,19 14,24 16,17 11,12 18,12" fill="#f1c40f" filter="url(#rareGlow3)" opacity="0.9"/>
        </svg>`
    },
    // --- Epic ---
    {
        id: 'void_essence',
        get name() { return getIngredientName('void_essence'); },
        rarity: 'epic',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40">
            <defs>
                <filter id="epicGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <radialGradient id="voidGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fd79a8"/><stop offset="100%" stop-color="#6c5ce7"/></radialGradient>
            </defs>
            <circle cx="20" cy="20" r="14" fill="url(#voidGrad)" filter="url(#epicGlow)"/>
            <circle cx="20" cy="20" r="7" fill="#1a0a2e"/>
            <circle cx="20" cy="20" r="3" fill="#fd79a8" filter="url(#epicGlow)"/>
        </svg>`
    },
    {
        id: 'troll_blood',
        get name() { return getIngredientName('troll_blood'); },
        rarity: 'epic',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40">
            <defs><filter id="epicGlowBlood"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
            <path d="M20 35 Q5 20 20 5 Q35 20 20 35Z" fill="#c0392b" filter="url(#epicGlowBlood)"/>
            <circle cx="20" cy="25" r="4" fill="#e74c3c"/>
            <circle cx="20" cy="15" r="2" fill="#ff7979"/>
        </svg>`
    },
    {
        id: 'dragon_scale',
        get name() { return getIngredientName('dragon_scale'); },
        rarity: 'epic',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40">
            <defs><filter id="epicGlow2"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
            <path d="M20 4 L34 28 L20 22 L6 28Z" fill="#e17055" filter="url(#epicGlow2)"/>
            <path d="M20 4 L34 28 L20 22Z" fill="#d63031" opacity="0.7"/>
            <path d="M20 10 L28 24 L20 20 L12 24Z" fill="#ff7675" opacity="0.5"/>
        </svg>`
    },
    // --- Legendary ---
    {
        id: 'philosophers_tear',
        get name() { return getIngredientName('philosophers_tear'); },
        rarity: 'legendary',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40">
            <defs>
                <filter id="legGlow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <radialGradient id="tearGrad" cx="40%" cy="30%" r="60%"><stop offset="0%" stop-color="#fff" stop-opacity="0.9"/><stop offset="100%" stop-color="#f1c40f"/></radialGradient>
            </defs>
            <ellipse cx="20" cy="26" rx="10" ry="12" fill="url(#tearGrad)" filter="url(#legGlow)"/>
            <path d="M20 5 Q22 14 30 24 Q25 35 20 38 Q15 35 10 24 Q18 14 20 5Z" fill="url(#tearGrad)" filter="url(#legGlow)" opacity="0.6"/>
            <polygon points="20,8 21.5,13 27,13 22.5,16.5 24,22 20,18.5 16,22 17.5,16.5 13,13 18.5,13" fill="white" opacity="0.8" filter="url(#legGlow)"/>
        </svg>`
    },
    {
        id: 'time_crystal',
        get name() { return getIngredientName('time_crystal'); },
        rarity: 'legendary',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40">
            <defs>
                <filter id="legGlow2"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <path d="M20 3 L30 13 L30 27 L20 37 L10 27 L10 13Z" fill="#a29bfe" filter="url(#legGlow2)" opacity="0.9"/>
            <path d="M20 8 L27 15 L27 25 L20 32 L13 25 L13 15Z" fill="#6c5ce7" opacity="0.7"/>
            <path d="M20 13 L24 17 L24 23 L20 27 L16 23 L16 17Z" fill="white" opacity="0.6" filter="url(#legGlow2)"/>
            <line x1="20" y1="3" x2="20" y2="37" stroke="white" stroke-width="0.5" opacity="0.4"/>
            <line x1="10" y1="20" x2="30" y2="20" stroke="white" stroke-width="0.5" opacity="0.4"/>
        </svg>`
    },
];


function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function rollIngredient(rarityWeights: { rarity: Rarity; weight: number }[]): Ingredient {
    const total = rarityWeights.reduce((s, r) => s + r.weight, 0);
    let rand = Math.random() * total;
    for (const { rarity, weight } of rarityWeights) {
        rand -= weight;
        if (rand <= 0) {
            const pool = AVAILABLE_INGREDIENTS.filter(i => i.rarity === rarity);
            if (pool.length > 0) return pickRandom(pool);
        }
    }
    return pickRandom(AVAILABLE_INGREDIENTS.filter(i => i.rarity === 'common'));
}

// ============================================================
// ALCHEMY STORES (separate writables to avoid polluting GameState)
// ============================================================

export const ingredientsCount = writable<Record<string, number>>({});
export const potionsCount     = writable<Record<string, number>>({ 'potion_wealth': 1 });

// ============================================================
// ALCHEMY: POTIONS CATALOGUE & RECIPES
// ============================================================

export const AVAILABLE_POTIONS: Potion[] = [
    {
        id: 'potion_luck',
        get name() { return getPotionName('potion_luck'); },
        get description() { return getPotionDesc('potion_luck'); },
        effect: 'click_multiplier',
        value: 0.25,
        durationMin: 5,
        icon: `<svg viewBox="0 0 40 48" width="40" height="48">
            <defs>
                <radialGradient id="luckGrad" cx="40%" cy="30%" r="60%"><stop offset="0%" stop-color="#fdcb6e"/><stop offset="100%" stop-color="#e17055"/></radialGradient>
                <filter id="luckGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <path d="M16 8 L16 22 Q6 30 6 38 Q6 46 20 46 Q34 46 34 38 Q34 30 24 22 L24 8Z" fill="url(#luckGrad)" filter="url(#luckGlow)"/>
            <rect x="14" y="4" width="12" height="6" rx="3" fill="#b2bec3"/>
            <ellipse cx="14" cy="32" rx="4" ry="6" fill="rgba(255,255,255,0.25)"/>
        </svg>`
    },
    {
        id: 'potion_wealth',
        get name() { return getPotionName('potion_wealth'); },
        get description() { return getPotionDesc('potion_wealth'); },
        effect: 'idle_multiplier',
        value: 0.5,
        durationMin: 5,
        icon: `<svg viewBox="0 0 40 48" width="40" height="48">
            <defs>
                <radialGradient id="wealthGrad" cx="40%" cy="30%" r="60%"><stop offset="0%" stop-color="#55efc4"/><stop offset="100%" stop-color="#00b894"/></radialGradient>
                <filter id="wealthGlow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <path d="M16 8 L16 22 Q6 30 6 38 Q6 46 20 46 Q34 46 34 38 Q34 30 24 22 L24 8Z" fill="url(#wealthGrad)" filter="url(#wealthGlow)"/>
            <rect x="14" y="4" width="12" height="6" rx="3" fill="#636e72"/>
            <ellipse cx="14" cy="32" rx="4" ry="6" fill="rgba(255,255,255,0.2)"/>
        </svg>`
    },
    {
        id: 'potion_void',
        get name() { return getPotionName('potion_void'); },
        get description() { return getPotionDesc('potion_void'); },
        effect: 'gold_multiplier',
        value: 1.0,
        durationMin: 3,
        icon: `<svg viewBox="0 0 40 48" width="40" height="48">
            <defs>
                <radialGradient id="voidPotGrad" cx="40%" cy="30%" r="60%"><stop offset="0%" stop-color="#fd79a8"/><stop offset="100%" stop-color="#6c5ce7"/></radialGradient>
                <filter id="voidPotGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <path d="M16 8 L16 22 Q6 30 6 38 Q6 46 20 46 Q34 46 34 38 Q34 30 24 22 L24 8Z" fill="url(#voidPotGrad)" filter="url(#voidPotGlow)"/>
            <rect x="14" y="4" width="12" height="6" rx="3" fill="#2d3436"/>
            <circle cx="20" cy="34" r="5" fill="rgba(0,0,0,0.4)"/>
            <circle cx="20" cy="34" r="2" fill="#fd79a8" filter="url(#voidPotGlow)"/>
        </svg>`
    },
    {
        id: 'potion_focus',
        get name() { return getPotionName('potion_focus'); },
        get description() { return getPotionDesc('potion_focus'); },
        effect: 'click_multiplier',
        value: 0.5,
        durationMin: 2,
        icon: `<svg viewBox="0 0 40 48" width="40" height="48">
            <defs>
                <radialGradient id="focusGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#00cec9"/><stop offset="100%" stop-color="#0984e3"/></radialGradient>
                <filter id="focusGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <path d="M20 10 L30 25 L30 45 L10 45 L10 25 Z" fill="url(#focusGrad)" filter="url(#focusGlow)"/>
            <rect x="16" y="5" width="8" height="5" rx="2" fill="#636e72"/>
            <circle cx="20" cy="35" r="4" fill="white" opacity="0.8"/>
        </svg>`
    },
    {
        id: 'potion_sage',
        get name() { return getPotionName('potion_sage'); },
        get description() { return getPotionDesc('potion_sage'); },
        effect: 'idle_multiplier',
        value: 1.5,
        durationMin: 10,
        icon: `<svg viewBox="0 0 40 48" width="40" height="48">
            <defs>
                <radialGradient id="sageGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffeaa7"/><stop offset="100%" stop-color="#fdcb6e"/></radialGradient>
                <filter id="sageGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <circle cx="20" cy="30" r="16" fill="url(#sageGrad)" filter="url(#sageGlow)"/>
            <polygon points="17,14 23,14 20,4" fill="#2d3436"/>
            <path d="M20 20 Q15 30 20 40 Q25 30 20 20" fill="white" opacity="0.6"/>
        </svg>`
    },
    {
        id: 'potion_fire',
        get name() { return getPotionName('potion_fire'); },
        get description() { return getPotionDesc('potion_fire'); },
        effect: 'click_multiplier',
        value: 0.4,
        durationMin: 3,
        icon: `<svg viewBox="0 0 40 48" width="40" height="48">
            <defs>
                <radialGradient id="firePotGrad" cx="40%" cy="30%" r="65%">
                    <stop offset="0%" stop-color="#ffeaa7"/>
                    <stop offset="50%" stop-color="#ff7675"/>
                    <stop offset="100%" stop-color="#d63031"/>
                </radialGradient>
                <filter id="firePotGlow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <path d="M16 8 L16 20 L8 36 Q6 44 20 44 Q34 44 32 36 L24 20 L24 8 Z" fill="url(#firePotGrad)" filter="url(#firePotGlow)"/>
            <rect x="14" y="4" width="12" height="5" rx="2" fill="#2d3436"/>
            <path d="M16 32 Q20 24 24 32 Q20 38 16 32 Z" fill="#ffeaa7" opacity="0.85"/>
        </svg>`
    },
    {
        id: 'potion_berserk',
        get name() { return getPotionName('potion_berserk'); },
        get description() { return getPotionDesc('potion_berserk'); },
        effect: 'click_multiplier',
        value: 0.75,
        durationMin: 3,
        icon: `<svg viewBox="0 0 40 48" width="40" height="48">
            <defs>
                <radialGradient id="berserkGrad" cx="45%" cy="35%" r="60%">
                    <stop offset="0%" stop-color="#ff7675"/>
                    <stop offset="60%" stop-color="#c0392b"/>
                    <stop offset="100%" stop-color="#2c0b0e"/>
                </radialGradient>
                <filter id="berserkGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <rect x="12" y="14" width="16" height="30" rx="6" fill="url(#berserkGrad)" filter="url(#berserkGlow)"/>
            <rect x="15" y="6" width="10" height="8" rx="2" fill="#7f1d1d"/>
            <path d="M14 22 L26 36 M26 22 L14 36" stroke="#fca5a5" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
        </svg>`
    },
    {
        id: 'potion_giant',
        get name() { return getPotionName('potion_giant'); },
        get description() { return getPotionDesc('potion_giant'); },
        effect: 'idle_multiplier',
        value: 0.8,
        durationMin: 7,
        icon: `<svg viewBox="0 0 40 48" width="40" height="48">
            <defs>
                <radialGradient id="giantGrad" cx="40%" cy="30%" r="60%">
                    <stop offset="0%" stop-color="#55efc4"/>
                    <stop offset="60%" stop-color="#00b894"/>
                    <stop offset="100%" stop-color="#1b4d3e"/>
                </radialGradient>
                <filter id="giantGlow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <circle cx="20" cy="28" r="15" fill="url(#giantGrad)" filter="url(#giantGlow)"/>
            <rect x="16" y="6" width="8" height="8" rx="2" fill="#2d3436"/>
            <ellipse cx="16" cy="24" rx="3" ry="5" fill="white" opacity="0.35"/>
        </svg>`
    },
    {
        id: 'potion_immortal',
        get name() { return getPotionName('potion_immortal'); },
        get description() { return getPotionDesc('potion_immortal'); },
        effect: 'idle_multiplier',
        value: 2.5,
        durationMin: 15,
        icon: `<svg viewBox="0 0 40 48" width="40" height="48">
            <defs>
                <radialGradient id="immortalGrad" cx="35%" cy="30%" r="65%">
                    <stop offset="0%" stop-color="#fff"/>
                    <stop offset="40%" stop-color="#ffd700"/>
                    <stop offset="100%" stop-color="#b7791f"/>
                </radialGradient>
                <filter id="immortalGlow"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <path d="M20 4 L33 16 L28 42 L12 42 L7 16 Z" fill="url(#immortalGrad)" filter="url(#immortalGlow)"/>
            <polygon points="20,16 23,23 30,23 25,27 27,34 20,30 13,34 15,27 10,23 17,23" fill="#ffffff" opacity="0.9"/>
            <rect x="15" y="2" width="10" height="4" rx="2" fill="#ffd700"/>
        </svg>`
    },
    {
        id: 'potion_chronos',
        get name() { return getPotionName('potion_chronos'); },
        get description() { return getPotionDesc('potion_chronos'); },
        effect: 'gold_multiplier',
        value: 3.0,
        durationMin: 5,
        icon: `<svg viewBox="0 0 40 48" width="40" height="48">
            <defs>
                <radialGradient id="chronosGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#e056fd"/>
                    <stop offset="60%" stop-color="#686de0"/>
                    <stop offset="100%" stop-color="#130f40"/>
                </radialGradient>
                <filter id="chronosGlow"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <!-- Orbit Ring -->
            <ellipse cx="20" cy="28" rx="18" ry="7" fill="none" stroke="#f1c40f" stroke-width="1.8" transform="rotate(-20 20 28)"/>
            <circle cx="20" cy="28" r="14" fill="url(#chronosGrad)" filter="url(#chronosGlow)"/>
            <rect x="17" y="6" width="6" height="8" rx="2" fill="#a29bfe"/>
            <!-- Hourglass / Core Rune -->
            <path d="M16 22 L24 22 L20 28 L24 34 L16 34 L20 28 Z" fill="#ffeaa7" opacity="0.9"/>
        </svg>`
    },
    {
        id: 'potion_swift',
        get name() { return getPotionName('potion_swift'); },
        get description() { return getPotionDesc('potion_swift'); },
        effect: 'idle_multiplier',
        value: 0.4,
        durationMin: 5,
        icon: `<svg viewBox="0 0 40 48" width="40" height="48">
            <defs>
                <radialGradient id="swiftGrad" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#81ecec"/><stop offset="100%" stop-color="#00cec9"/></radialGradient>
                <filter id="swiftGlow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <path d="M16 8 L16 22 Q6 30 6 38 Q6 46 20 46 Q34 46 34 38 Q34 30 24 22 L24 8Z" fill="url(#swiftGrad)" filter="url(#swiftGlow)"/>
            <path d="M12 28 Q20 20 28 28" stroke="white" stroke-width="2" fill="none" opacity="0.8"/>
            <path d="M15 33 Q20 27 25 33" stroke="white" stroke-width="1.5" fill="none" opacity="0.7"/>
            <rect x="14" y="4" width="12" height="6" rx="3" fill="#00cec9"/>
        </svg>`
    },
    {
        id: 'potion_midas',
        get name() { return getPotionName('potion_midas'); },
        get description() { return getPotionDesc('potion_midas'); },
        effect: 'gold_multiplier',
        value: 1.5,
        durationMin: 5,
        icon: `<svg viewBox="0 0 40 48" width="40" height="48">
            <defs>
                <radialGradient id="midasGrad" cx="40%" cy="30%" r="60%"><stop offset="0%" stop-color="#fff"/><stop offset="50%" stop-color="#f1c40f"/><stop offset="100%" stop-color="#e67e22"/></radialGradient>
                <filter id="midasGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <circle cx="20" cy="28" r="15" fill="url(#midasGrad)" filter="url(#midasGlow)"/>
            <circle cx="20" cy="28" r="8" fill="none" stroke="#d35400" stroke-width="2"/>
            <rect x="16" y="6" width="8" height="8" rx="2" fill="#d35400"/>
        </svg>`
    },
    {
        id: 'potion_astral',
        get name() { return getPotionName('potion_astral'); },
        get description() { return getPotionDesc('potion_astral'); },
        effect: 'gold_multiplier',
        value: 2.0,
        durationMin: 5,
        icon: `<svg viewBox="0 0 40 48" width="40" height="48">
            <defs>
                <radialGradient id="astralPotGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fd79a8"/><stop offset="50%" stop-color="#a29bfe"/><stop offset="100%" stop-color="#2d134d"/></radialGradient>
                <filter id="astralPotGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <path d="M16 8 L16 20 L8 36 Q6 44 20 44 Q34 44 32 36 L24 20 L24 8 Z" fill="url(#astralPotGrad)" filter="url(#astralPotGlow)"/>
            <polygon points="20,24 22,29 27,29 23,32 25,37 20,34 15,37 17,32 13,29 18,29" fill="#ffeaa7"/>
            <rect x="14" y="4" width="12" height="5" rx="2" fill="#6c5ce7"/>
        </svg>`
    },
    {
        id: 'potion_insight',
        get name() { return getPotionName('potion_insight'); },
        get description() { return getPotionDesc('potion_insight'); },
        effect: 'gold_multiplier',
        value: 1.2,
        durationMin: 8,
        icon: `<svg viewBox="0 0 40 48" width="40" height="48">
            <defs>
                <radialGradient id="insightGrad" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#ffffff"/><stop offset="40%" stop-color="#74b9ff"/><stop offset="100%" stop-color="#0984e3"/></radialGradient>
                <filter id="insightGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <rect x="12" y="14" width="16" height="30" rx="6" fill="url(#insightGrad)" filter="url(#insightGlow)"/>
            <circle cx="20" cy="28" r="4" fill="#ffffff"/>
            <rect x="15" y="6" width="10" height="8" rx="2" fill="#0984e3"/>
        </svg>`
    }
];

export const POTIONS_CATALOGUE = AVAILABLE_POTIONS;



/**
 * Opens a chest and returns the complete ChestResult.
 * Handles ingredients, dynamic gold, potions, crystals cashback, and pet drop.
 * Also handles Pity / Double Resonance.
 */
export function openChest(chestType: ChestType = 'wooden', count: number = 1): ChestResult {
    const validCount = Math.max(1, Math.min(10, count || 1));
    const idle = get(stableIdleIncome) || 0;
    const currentResonance = get(gameStore).chestResonanceProgress || 0;
    const isDoubleResonance = currentResonance >= 100;
    const multiplier = isDoubleResonance ? 2 : 1;

    let baseResonancePerChest = 5;
    if (chestType === 'wooden') baseResonancePerChest = 5;
    else if (chestType === 'alchemist') baseResonancePerChest = 10;
    else if (chestType === 'magical') baseResonancePerChest = 15;
    else if (chestType === 'astral') baseResonancePerChest = 30;
    else if (chestType === 'titan') baseResonancePerChest = 60;

    const drops: ChestDropItem[] = [];
    let totalGold = 0;
    let totalCrystals = 0;

    for (let c = 0; c < validCount; c++) {
        // --- 1. ИНГРЕДИЕНТЫ ---
        const ingDrops: Ingredient[] = [];
        if (chestType === 'wooden') {
            for (let i = 0; i < 3; i++) {
                ingDrops.push(rollIngredient([
                    { rarity: 'common', weight: 85 },
                    { rarity: 'rare',   weight: 15 },
                ]));
            }
        } else if (chestType === 'alchemist') {
            ingDrops.push(rollIngredient([{ rarity: 'rare', weight: 100 }]));
            for (let i = 0; i < 2; i++) {
                ingDrops.push(rollIngredient([
                    { rarity: 'common', weight: 60 },
                    { rarity: 'rare',   weight: 40 },
                ]));
            }
        } else if (chestType === 'magical') {
            ingDrops.push(rollIngredient([{ rarity: 'epic', weight: 100 }]));
            for (let i = 0; i < 4; i++) {
                ingDrops.push(rollIngredient([
                    { rarity: 'common', weight: 55 },
                    { rarity: 'rare',   weight: 40 },
                    { rarity: 'epic',   weight: 5 },
                ]));
            }
        } else if (chestType === 'astral') {
            ingDrops.push(rollIngredient([{ rarity: 'legendary', weight: 100 }]));
            for (let i = 0; i < 3; i++) {
                ingDrops.push(rollIngredient([{ rarity: 'epic', weight: 100 }]));
            }
            for (let i = 0; i < 6; i++) {
                ingDrops.push(rollIngredient([
                    { rarity: 'common',    weight: 35 },
                    { rarity: 'rare',      weight: 40 },
                    { rarity: 'epic',      weight: 20 },
                    { rarity: 'legendary', weight: 5 },
                ]));
            }
        } else if (chestType === 'titan') {
            for (let i = 0; i < 2; i++) {
                ingDrops.push(rollIngredient([{ rarity: 'legendary', weight: 100 }]));
            }
            for (let i = 0; i < 5; i++) {
                ingDrops.push(rollIngredient([{ rarity: 'epic', weight: 100 }]));
            }
            for (let i = 0; i < 9; i++) {
                ingDrops.push(rollIngredient([
                    { rarity: 'common',    weight: 20 },
                    { rarity: 'rare',      weight: 45 },
                    { rarity: 'epic',      weight: 25 },
                    { rarity: 'legendary', weight: 10 },
                ]));
            }
        }

        for (const ing of ingDrops) {
            const finalCount = 1 * multiplier;
            drops.push({
                type: 'ingredient',
                id: ing.id,
                name: ing.name,
                count: finalCount,
                rarity: ing.rarity,
                icon: ing.icon,
                ingredient: ing
            });
        }

        // --- 2. ГОТОВЫЕ ЗЕЛЬЯ ---
        if (chestType === 'alchemist') {
            for (let i = 0; i < 2; i++) {
                const pot = AVAILABLE_POTIONS[Math.floor(Math.random() * AVAILABLE_POTIONS.length)];
                drops.push({
                    type: 'potion',
                    id: pot.id,
                    name: pot.name,
                    count: 1 * multiplier,
                    rarity: 'rare',
                    icon: pot.icon,
                    potion: pot
                });
            }
        } else if (chestType === 'magical') {
            const pot = AVAILABLE_POTIONS[Math.floor(Math.random() * AVAILABLE_POTIONS.length)];
            drops.push({
                type: 'potion',
                id: pot.id,
                name: pot.name,
                count: 1 * multiplier,
                rarity: 'rare',
                icon: pot.icon,
                potion: pot
            });
        } else if (chestType === 'astral') {
            const rarePots = AVAILABLE_POTIONS.filter(p => ['potion_astral', 'potion_wealth', 'potion_time', 'potion_alchemy_frenzy'].includes(p.id));
            const pool = rarePots.length > 0 ? rarePots : AVAILABLE_POTIONS;
            const pot = pool[Math.floor(Math.random() * pool.length)];
            drops.push({
                type: 'potion',
                id: pot.id,
                name: pot.name,
                count: 1 * multiplier,
                rarity: 'epic',
                icon: pot.icon,
                potion: pot
            });
        } else if (chestType === 'titan') {
            for (let i = 0; i < 2; i++) {
                const pot = AVAILABLE_POTIONS[Math.floor(Math.random() * AVAILABLE_POTIONS.length)];
                drops.push({
                    type: 'potion',
                    id: pot.id,
                    name: pot.name,
                    count: 1 * multiplier,
                    rarity: 'epic',
                    icon: pot.icon,
                    potion: pot
                });
            }
        }

        // --- 3. Dynamic Gold Drop ---
        let goldChance = 0;
        let goldSeconds = 0;
        let minGoldFloor = 0;
        let goldKey = 'bagOfGold';

        if (chestType === 'wooden') {
            goldChance = 0.30;
            goldSeconds = 20; // 20 sec (was 180 sec)
            minGoldFloor = 500;
            goldKey = 'vagabondPouch';
        } else if (chestType === 'alchemist') {
            goldChance = 0.35;
            goldSeconds = 45; // 45 sec (was 480 sec)
            minGoldFloor = 2000;
            goldKey = 'alchemistPouch';
        } else if (chestType === 'magical') {
            goldChance = 0.40;
            goldSeconds = 90; // 1.5 min (was 900 sec)
            minGoldFloor = 6000;
            goldKey = 'sorcererSack';
        } else if (chestType === 'astral') {
            goldChance = 0.50;
            goldSeconds = 180; // 3 min (was 1800 sec)
            minGoldFloor = 20000;
            goldKey = 'etherTreasury';
        } else if (chestType === 'titan') {
            goldChance = 0.75;
            goldSeconds = 300; // 5 min (was 3600 sec)
            minGoldFloor = 50000;
            goldKey = 'titanCoffer';
        }

        if (Math.random() < goldChance) {
            const rewardIdle = idle;
            const rawGold = Math.max(minGoldFloor, Math.round(rewardIdle * goldSeconds));
            const goldAward = rawGold * multiplier;
            totalGold += goldAward;
            drops.push({
                type: 'gold',
                id: 'gold_reward',
                get name() { return translate(`chests.${goldKey}`); },
                count: 1,
                rarity: chestType === 'titan' ? 'legendary' : (chestType === 'astral' ? 'epic' : 'rare'),
                goldAmount: goldAward
            });
        }

        // --- 4. Gem Refund ---
        let crystalGain = 0;
        if (chestType === 'magical' && Math.random() < 0.20) {
            crystalGain = 5 * multiplier;
        } else if (chestType === 'astral' && Math.random() < 0.35) {
            crystalGain = 15 * multiplier;
        } else if (chestType === 'titan') {
            crystalGain = 25 * multiplier;
        }

        if (crystalGain > 0) {
            totalCrystals += crystalGain;
            drops.push({
                type: 'crystals',
                id: 'crystal_cashback',
                get name() { return translate('chests.gemRefund'); },
                count: crystalGain,
                rarity: chestType === 'titan' ? 'legendary' : 'epic',
                crystalAmount: crystalGain
            });
        }

        // --- 5. Familiar Egg (Titan chest only, 15% chance) ---
        if (chestType === 'titan' && Math.random() < 0.15) {
            const regularPets = AVAILABLE_PETS.filter(p => !p.isCollectionExclusive);
            if (regularPets.length > 0) {
                const rolledPet = regularPets[Math.floor(Math.random() * regularPets.length)];
                const state = get(gameStore);
                const currentLevel = state.petLevels?.[rolledPet.id] || (state.unlockedPets?.includes(rolledPet.id) ? 1 : 0);
                
                if (currentLevel > 0) {
                    const newLevel = Math.min(10, currentLevel + 1);
                    gameStore.update(s => ({
                        ...s,
                        petLevels: {
                            ...(s.petLevels || {}),
                            [rolledPet.id]: newLevel
                        }
                    }));
                    drops.push({
                        type: 'pet',
                        id: rolledPet.id,
                        get name() { return translate('chests.petUpgrade', { name: rolledPet.name, level: newLevel }); },
                        count: 1,
                        rarity: rolledPet.rarity,
                        icon: rolledPet.icon,
                        pet: rolledPet
                    });
                } else {
                    gameStore.update(s => ({
                        ...s,
                        unlockedPets: [...new Set([...(s.unlockedPets || []), rolledPet.id])],
                        petLevels: {
                            ...(s.petLevels || {}),
                            [rolledPet.id]: 1
                        }
                    }));
                    drops.push({
                        type: 'pet',
                        id: rolledPet.id,
                        get name() { return translate('chests.petNew', { name: rolledPet.name }); },
                        count: 1,
                        rarity: rolledPet.rarity,
                        icon: rolledPet.icon,
                        pet: rolledPet
                    });
                }
            }
        }
    }

    // --- ПРИМЕНЕНИЕ НАГРАД К ХРАНИЛИЩАМ ---
    ingredientsCount.update(counts => {
        const next = { ...counts };
        for (const drop of drops) {
            if (drop.type === 'ingredient' && drop.ingredient) {
                next[drop.ingredient.id] = (next[drop.ingredient.id] ?? 0) + drop.count;
            }
        }
        return next;
    });

    potionsCount.update(counts => {
        const next = { ...counts };
        for (const drop of drops) {
            if (drop.type === 'potion' && drop.potion) {
                next[drop.potion.id] = (next[drop.potion.id] ?? 0) + drop.count;
            }
        }
        return next;
    });

    if (totalGold > 0) {
        gameStore.addGold(totalGold);
    }

    if (totalCrystals > 0) {
        crystals.update(c => c + totalCrystals);
    }

    // --- ОБНОВЛЕНИЕ РЕЗОНАНСА (PITY-МЕТР) ---
    const resonanceGain = baseResonancePerChest * validCount;
    gameStore.update(s => {
        if (isDoubleResonance) {
            return { ...s, chestResonanceProgress: 0 };
        } else {
            return {
                ...s,
                chestResonanceProgress: Math.min(100, (s.chestResonanceProgress || 0) + resonanceGain)
            };
        }
    });

    return {
        chestType,
        drops,
        totalGold,
        totalCrystals,
        isDoubleResonance,
        resonanceGain
    };
}

// ============================================================
// GAME STATE
// ============================================================

const defaultUpgrades: Upgrade[] = [
    // --- Производство (Пассивный доход) ---
    {
        id: 'idle1',
        get name() { return getUpgradeName('idle1'); },
        get description() { return getUpgradeDesc('idle1'); },
        type: 'idle',
        category: 'production',
        baseCost: 15,
        costMultiplier: 1.15,
        baseValue: 1,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><ellipse cx="14" cy="28" rx="8" ry="6" fill="#74b9ff" stroke="#0984e3" stroke-width="2"/><path d="M18 24 L32 8" stroke="#dfe6e9" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="8" r="3" fill="#f1c40f"/><path d="M12 26 Q14 20 18 22" stroke="white" stroke-width="1.5" fill="none"/></svg>`
    },
    {
        id: 'click1',
        get name() { return getUpgradeName('click1'); },
        get description() { return getUpgradeDesc('click1'); },
        type: 'click',
        category: 'click',
        baseCost: 20,
        costMultiplier: 1.15,
        baseValue: 1,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><ellipse cx="14" cy="28" rx="7" ry="5" fill="#f1c40f" stroke="#d4ac0d" stroke-width="2"/><path d="M18 24 L34 8" stroke="#f39c12" stroke-width="3" stroke-linecap="round"/><circle cx="34" cy="8" r="3" fill="#e74c3c"/></svg>`
    },
    {
        id: 'idle_apprentice',
        get name() { return getUpgradeName('idle_apprentice'); },
        get description() { return getUpgradeDesc('idle_apprentice'); },
        type: 'idle',
        category: 'production',
        baseCost: 100,
        costMultiplier: 1.15,
        baseValue: 6,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><circle cx="20" cy="16" r="6" fill="#ffeaa7"/><polygon points="12,12 28,12 20,2" fill="#6c5ce7"/><ellipse cx="20" cy="12" rx="10" ry="2" fill="#a29bfe"/><path d="M14 22 L26 22 L28 36 L12 36 Z" fill="#6c5ce7"/><circle cx="18" cy="16" r="1" fill="#2d3436"/><circle cx="22" cy="16" r="1" fill="#2d3436"/></svg>`
    },
    {
        id: 'click_gloves',
        get name() { return getUpgradeName('click_gloves'); },
        get description() { return getUpgradeDesc('click_gloves'); },
        type: 'click',
        category: 'click',
        baseCost: 200,
        costMultiplier: 1.15,
        baseValue: 5,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><path d="M12 18 C12 14 16 12 20 12 C24 12 28 14 28 18 L28 32 C28 34 26 36 24 36 L16 36 C14 36 12 34 12 32 Z" fill="#e17055" stroke="#d63031" stroke-width="2"/><path d="M12 22 L8 26 C7 27 7 29 8 30 C9 31 11 31 12 30 L15 27" fill="#e17055" stroke="#d63031" stroke-width="2"/><line x1="16" y1="28" x2="24" y2="28" stroke="#f1c40f" stroke-width="2"/><circle cx="20" cy="20" r="3" fill="#f1c40f"/></svg>`
    },
    {
        id: 'idle2',
        get name() { return getUpgradeName('idle2'); },
        get description() { return getUpgradeDesc('idle2'); },
        type: 'idle',
        category: 'production',
        baseCost: 750,
        costMultiplier: 1.16,
        baseValue: 35,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><path d="M10 28 Q15 8 28 8 Q22 18 30 30 Q20 24 10 28Z" fill="#ff7675" stroke="#d63031" stroke-width="2"/><circle cx="26" cy="10" r="2.5" fill="#f1c40f"/><path d="M16 22 Q20 14 24 22" stroke="#ffeaa7" stroke-width="2" fill="none"/></svg>`
    },
    {
        id: 'click2',
        get name() { return getUpgradeName('click2'); },
        get description() { return getUpgradeDesc('click2'); },
        type: 'click',
        category: 'click',
        baseCost: 1500,
        costMultiplier: 1.16,
        baseValue: 25,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><rect x="8" y="10" width="24" height="22" rx="3" fill="#2d3436" stroke="#f1c40f" stroke-width="2"/><path d="M20 10 L20 32" stroke="#f1c40f" stroke-width="2"/><line x1="12" y1="16" x2="16" y2="16" stroke="#e74c3c" stroke-width="1.5"/><line x1="12" y1="22" x2="17" y2="22" stroke="#e74c3c" stroke-width="1.5"/><line x1="24" y1="16" x2="28" y2="16" stroke="#74b9ff" stroke-width="1.5"/><line x1="23" y1="22" x2="28" y2="22" stroke="#74b9ff" stroke-width="1.5"/></svg>`
    },
    {
        id: 'idle_distiller',
        get name() { return getUpgradeName('idle_distiller'); },
        get description() { return getUpgradeDesc('idle_distiller'); },
        type: 'idle',
        category: 'production',
        baseCost: 5000,
        costMultiplier: 1.16,
        baseValue: 220,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><circle cx="16" cy="26" r="10" fill="#d35400" stroke="#e67e22" stroke-width="2"/><rect x="14" y="10" width="4" height="8" fill="#e67e22"/><path d="M16 10 C16 4 28 4 28 14 L28 28 L32 30" stroke="#f39c12" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="16" cy="26" r="4" fill="#f1c40f" opacity="0.8"/></svg>`
    },
    {
        id: 'click_crit',
        get name() { return getUpgradeName('click_crit'); },
        get description() { return getUpgradeDesc('click_crit'); },
        type: 'crit',
        category: 'click',
        baseCost: 8000,
        costMultiplier: 1.20,
        baseValue: 3,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><polygon points="20,2 24,14 36,14 26,22 30,34 20,26 10,34 14,22 4,14 16,14" fill="#f1c40f" stroke="#e67e22" stroke-width="2"/><polygon points="20,8 22,15 30,15 24,20 26,28 20,23 14,28 16,20 10,15 18,15" fill="#e74c3c"/></svg>`
    },
    {
        id: 'idle_greenhouse',
        get name() { return getUpgradeName('idle_greenhouse'); },
        get description() { return getUpgradeDesc('idle_greenhouse'); },
        type: 'idle',
        category: 'production',
        baseCost: 35000,
        costMultiplier: 1.17,
        baseValue: 1400,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><polygon points="20,6 34,16 34,34 6,34 6,16" fill="#81ecec" stroke="#00cec9" stroke-width="2" fill-opacity="0.4"/><line x1="20" y1="6" x2="20" y2="34" stroke="#00cec9" stroke-width="1.5"/><line x1="6" y1="16" x2="34" y2="16" stroke="#00cec9" stroke-width="1.5"/><path d="M16 34 Q16 22 20 22 Q24 22 24 34" fill="#2ecc71"/><circle cx="20" cy="20" r="3" fill="#f1c40f"/></svg>`
    },
    {
        id: 'click_resonance',
        get name() { return getUpgradeName('click_resonance'); },
        get description() { return getUpgradeDesc('click_resonance'); },
        type: 'resonance',
        category: 'click',
        baseCost: 50000,
        costMultiplier: 1.20,
        baseValue: 1,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><polygon points="20,4 28,18 20,36 12,18" fill="#a29bfe" stroke="#6c5ce7" stroke-width="2"/><line x1="20" y1="4" x2="20" y2="36" stroke="white" stroke-width="1.5" opacity="0.6"/><circle cx="6" cy="20" r="3" fill="none" stroke="#fd79a8" stroke-width="1.5"/><circle cx="34" cy="20" r="3" fill="none" stroke="#fd79a8" stroke-width="1.5"/><path d="M8 16 Q10 20 8 24" stroke="#fd79a8" stroke-width="1.5" fill="none"/><path d="M32 16 Q30 20 32 24" stroke="#fd79a8" stroke-width="1.5" fill="none"/></svg>`
    },
    {
        id: 'idle_homunculus',
        get name() { return getUpgradeName('idle_homunculus'); },
        get description() { return getUpgradeDesc('idle_homunculus'); },
        type: 'idle',
        category: 'production',
        baseCost: 250000,
        costMultiplier: 1.17,
        baseValue: 9000,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><rect x="12" y="10" width="16" height="24" rx="8" fill="#a29bfe" stroke="#6c5ce7" stroke-width="2" fill-opacity="0.4"/><circle cx="20" cy="20" r="4" fill="#fd79a8"/><circle cx="18" cy="19" r="1" fill="#2d3436"/><circle cx="22" cy="19" r="1" fill="#2d3436"/><ellipse cx="20" cy="28" rx="5" ry="3" fill="#6c5ce7"/><rect x="16" y="6" width="8" height="4" rx="1" fill="#d63031"/></svg>`
    },
    {
        id: 'idle_rift',
        get name() { return getUpgradeName('idle_rift'); },
        get description() { return getUpgradeDesc('idle_rift'); },
        type: 'idle',
        category: 'production',
        baseCost: 2000000,
        costMultiplier: 1.18,
        baseValue: 60000,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><ellipse cx="20" cy="20" rx="18" ry="8" stroke="#fd79a8" stroke-width="2" transform="rotate(-30 20 20)"/><ellipse cx="20" cy="20" rx="14" ry="6" stroke="#a29bfe" stroke-width="2" transform="rotate(30 20 20)"/><circle cx="20" cy="20" r="5" fill="#2d1b4e" stroke="#ffeaa7" stroke-width="1.5"/><circle cx="20" cy="20" r="2" fill="#ffeaa7"/></svg>`
    },
    {
        id: 'click_rune_blade',
        get name() { return getUpgradeName('click_rune_blade'); },
        get description() { return getUpgradeDesc('click_rune_blade'); },
        type: 'click',
        category: 'click',
        baseCost: 5000000,
        costMultiplier: 1.18,
        baseValue: 120000,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><defs><linearGradient id="runeBladeGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#74b9ff"/><stop offset="50%" stop-color="#0984e3"/><stop offset="100%" stop-color="#00cec9"/></linearGradient></defs><path d="M10 32 L16 32 L34 10 L28 4 L6 26 L6 32 Z" fill="url(#runeBladeGrad)" stroke="#81ecec" stroke-width="1.5"/><line x1="12" y1="28" x2="28" y2="12" stroke="#fff" stroke-width="1.5"/><circle cx="18" cy="22" r="1.5" fill="#ffeaa7"/><circle cx="22" cy="18" r="1.5" fill="#ffeaa7"/><rect x="4" y="32" width="6" height="4" rx="1" fill="#636e72" stroke="#2d3436" stroke-width="1.2"/></svg>`
    },
    {
        id: 'idle_observatory',
        get name() { return getUpgradeName('idle_observatory'); },
        get description() { return getUpgradeDesc('idle_observatory'); },
        type: 'idle',
        category: 'production',
        baseCost: 15000000,
        costMultiplier: 1.18,
        baseValue: 400000,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><defs><linearGradient id="obsDome" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#74b9ff"/><stop offset="100%" stop-color="#0984e3"/></linearGradient></defs><path d="M8 36 L32 36 L30 22 L10 22 Z" fill="#2d3436" stroke="#636e72" stroke-width="1.5"/><path d="M12 22 A8 8 0 0 1 28 22" fill="url(#obsDome)" stroke="#0984e3" stroke-width="1.5"/><rect x="18" y="6" width="6" height="18" rx="2" fill="#ffeaa7" stroke="#f39c12" stroke-width="1.5" transform="rotate(30 20 15)"/><circle cx="28" cy="10" r="2.5" fill="#fff" stroke="#f1c40f" stroke-width="1"/><polygon points="34,6 35,8 37,8 35,10 36,12 34,10 32,12 33,10 31,8 33,8" fill="#ffeaa7"/></svg>`
    },
    {
        id: 'idle_reactor',
        get name() { return getUpgradeName('idle_reactor'); },
        get description() { return getUpgradeDesc('idle_reactor'); },
        type: 'idle',
        category: 'production',
        baseCost: 120000000,
        costMultiplier: 1.18,
        baseValue: 3000000,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><defs><radialGradient id="reactGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffffff"/><stop offset="50%" stop-color="#a29bfe"/><stop offset="100%" stop-color="#6c5ce7"/></radialGradient></defs><circle cx="20" cy="20" r="14" fill="#2d1b4e" stroke="#a29bfe" stroke-width="2"/><ellipse cx="20" cy="20" rx="16" ry="6" stroke="#00cec9" stroke-width="1.5" transform="rotate(-30 20 20)"/><ellipse cx="20" cy="20" rx="16" ry="6" stroke="#fd79a8" stroke-width="1.5" transform="rotate(30 20 20)"/><circle cx="20" cy="20" r="6" fill="url(#reactGlow)"/><line x1="20" y1="2" x2="20" y2="6" stroke="#a29bfe" stroke-width="2"/><line x1="20" y1="34" x2="20" y2="38" stroke="#a29bfe" stroke-width="2"/></svg>`
    },
    {
        id: 'click_hammer',
        get name() { return getUpgradeName('click_hammer'); },
        get description() { return getUpgradeDesc('click_hammer'); },
        type: 'click',
        category: 'click',
        baseCost: 500000000,
        costMultiplier: 1.19,
        baseValue: 350000,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><rect x="18" y="16" width="4" height="20" rx="1" fill="#7f8c8d" stroke="#2c3e50" stroke-width="1.5"/><rect x="10" y="6" width="20" height="12" rx="2.5" fill="#f39c12" stroke="#d35400" stroke-width="2"/><path d="M14 10 L26 14 M14 14 L26 10" stroke="#fff" stroke-width="1.5"/><circle cx="20" cy="12" r="2" fill="#ffeaa7"/></svg>`
    },
    {
        id: 'idle_temple',
        get name() { return getUpgradeName('idle_temple'); },
        get description() { return getUpgradeDesc('idle_temple'); },
        type: 'idle',
        category: 'production',
        baseCost: 1000000000,
        costMultiplier: 1.19,
        baseValue: 25000000,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><path d="M4 36 L36 36 M6 32 L34 32" stroke="#d35400" stroke-width="2" stroke-linecap="round"/><polygon points="20,4 36,16 4,16" fill="#f39c12" stroke="#d35400" stroke-width="1.5"/><rect x="8" y="16" width="4" height="16" fill="#ffeaa7" stroke="#d35400" stroke-width="1.2"/><rect x="18" y="16" width="4" height="16" fill="#ffeaa7" stroke="#d35400" stroke-width="1.2"/><rect x="28" y="16" width="4" height="16" fill="#ffeaa7" stroke="#d35400" stroke-width="1.2"/><circle cx="20" cy="11" r="2.5" fill="#ffffff"/></svg>`
    },
    {
        id: 'idle_chaos_lab',
        get name() { return getUpgradeName('idle_chaos_lab'); },
        get description() { return getUpgradeDesc('idle_chaos_lab'); },
        type: 'idle',
        category: 'production',
        baseCost: 10000000000,
        costMultiplier: 1.19,
        baseValue: 220000000,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><defs><linearGradient id="chaosFlask" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fd79a8"/><stop offset="100%" stop-color="#e84393"/></linearGradient></defs><rect x="18" y="4" width="4" height="8" rx="1" fill="#dfe6e9" stroke="#636e72" stroke-width="1.2"/><path d="M16 12 L24 12 L34 32 A4 4 0 0 1 30 36 L10 36 A4 4 0 0 1 6 32 Z" fill="#2d1b4e" stroke="#fd79a8" stroke-width="1.8"/><path d="M9 30 Q20 22 31 30 L30 34 L10 34 Z" fill="url(#chaosFlask)" opacity="0.85"/><circle cx="16" cy="27" r="2" fill="#fff"/><circle cx="24" cy="24" r="1.5" fill="#fff"/><circle cx="20" cy="18" r="1" fill="#ffeaa7"/></svg>`
    },
    {
        id: 'click_infinity_eye',
        get name() { return getUpgradeName('click_infinity_eye'); },
        get description() { return getUpgradeDesc('click_infinity_eye'); },
        type: 'click',
        category: 'click',
        baseCost: 50000000000,
        costMultiplier: 1.20,
        baseValue: 25000000,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><path d="M4 20 Q20 6 36 20 Q20 34 4 20 Z" fill="#2d1b4e" stroke="#00cec9" stroke-width="2"/><circle cx="20" cy="20" r="7" fill="#6c5ce7" stroke="#ffeaa7" stroke-width="1.5"/><circle cx="20" cy="20" r="3" fill="#fff"/><polygon points="20,8 21,12 20,11 19,12" fill="#00cec9"/></svg>`
    },
    {
        id: 'idle_chronos_gate',
        get name() { return getUpgradeName('idle_chronos_gate'); },
        get description() { return getUpgradeDesc('idle_chronos_gate'); },
        type: 'idle',
        category: 'production',
        baseCost: 120000000000,
        costMultiplier: 1.20,
        baseValue: 2500000000,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><defs><radialGradient id="portalVoid" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#00cec9"/><stop offset="70%" stop-color="#6c5ce7"/><stop offset="100%" stop-color="#0f0c29"/></radialGradient></defs><ellipse cx="20" cy="20" rx="14" ry="18" fill="url(#portalVoid)" stroke="#81ecec" stroke-width="2"/><path d="M6 36 L10 16 C10 8 30 8 30 16 L34 36" stroke="#ffeaa7" stroke-width="2.5" fill="none"/><line x1="20" y1="6" x2="20" y2="12" stroke="#fff" stroke-width="2"/><circle cx="20" cy="20" r="3" fill="#fff"/></svg>`
    },
    {
        id: 'idle_cosmos_heart',
        get name() { return getUpgradeName('idle_cosmos_heart'); },
        get description() { return getUpgradeDesc('idle_cosmos_heart'); },
        type: 'idle',
        category: 'production',
        baseCost: 1500000000000,
        costMultiplier: 1.20,
        baseValue: 30000000000,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><defs><radialGradient id="cosmosSun" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffffff"/><stop offset="35%" stop-color="#ffeaa7"/><stop offset="70%" stop-color="#f1c40f"/><stop offset="100%" stop-color="#d35400"/></radialGradient></defs><ellipse cx="20" cy="20" rx="18" ry="6" stroke="#00cec9" stroke-width="1.8" transform="rotate(-25 20 20)"/><ellipse cx="20" cy="20" rx="18" ry="6" stroke="#a29bfe" stroke-width="1.8" transform="rotate(35 20 20)"/><circle cx="20" cy="20" r="8" fill="url(#cosmosSun)" stroke="#fff" stroke-width="1.5"/><polygon points="20,2 22,10 20,8 18,10" fill="#f1c40f"/><polygon points="20,38 22,30 20,32 18,30" fill="#f1c40f"/><polygon points="2,20 10,22 8,20 10,18" fill="#f1c40f"/><polygon points="38,20 30,22 32,20 30,18" fill="#f1c40f"/></svg>`
    },
    {
        id: 'click_void_hammer',
        get name() { return getUpgradeName('click_void_hammer'); },
        get description() { return getUpgradeDesc('click_void_hammer'); },
        type: 'click',
        category: 'click',
        baseCost: 5000000000000,
        costMultiplier: 1.21,
        baseValue: 1500000000,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><defs><radialGradient id="voidHammerGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#a29bfe"/><stop offset="100%" stop-color="#6c5ce7"/></radialGradient></defs><rect x="18" y="16" width="4" height="20" rx="1.5" fill="#2d3436" stroke="#a29bfe" stroke-width="1.5"/><path d="M8 8 L32 8 L30 20 L10 20 Z" fill="#1e1035" stroke="#a29bfe" stroke-width="2"/><circle cx="20" cy="14" r="4" fill="url(#voidHammerGlow)"/><polygon points="12,14 10,11 14,11" fill="#00cec9"/><polygon points="28,14 26,11 30,11" fill="#00cec9"/></svg>`
    },
    {
        id: 'idle_astral_weaver',
        get name() { return getUpgradeName('idle_astral_weaver'); },
        get description() { return getUpgradeDesc('idle_astral_weaver'); },
        type: 'idle',
        category: 'production',
        baseCost: 25000000000000,
        costMultiplier: 1.20,
        baseValue: 450000000000,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><defs><linearGradient id="astralWeave" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a29bfe"/><stop offset="100%" stop-color="#fd79a8"/></linearGradient></defs><ellipse cx="20" cy="20" rx="16" ry="12" stroke="url(#astralWeave)" stroke-width="2" stroke-dasharray="2 2"/><ellipse cx="20" cy="20" rx="12" ry="16" stroke="#81ecec" stroke-width="1.8" transform="rotate(45 20 20)"/><circle cx="20" cy="20" r="5" fill="#2d1b4e" stroke="#ffeaa7" stroke-width="1.5"/><circle cx="20" cy="20" r="2.5" fill="#ffeaa7"/><line x1="8" y1="12" x2="32" y2="28" stroke="#fd79a8" stroke-width="1.2" opacity="0.8"/><line x1="8" y1="28" x2="32" y2="12" stroke="#81ecec" stroke-width="1.2" opacity="0.8"/></svg>`
    },
    {
        id: 'idle_aether_collider',
        get name() { return getUpgradeName('idle_aether_collider'); },
        get description() { return getUpgradeDesc('idle_aether_collider'); },
        type: 'idle',
        category: 'production',
        baseCost: 500000000000000,
        costMultiplier: 1.21,
        baseValue: 12000000000000,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><defs><radialGradient id="collVoid" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#00cec9"/><stop offset="70%" stop-color="#6c5ce7"/><stop offset="100%" stop-color="#0f0c29"/></radialGradient></defs><circle cx="20" cy="20" r="16" fill="url(#collVoid)" stroke="#00cec9" stroke-width="2"/><circle cx="20" cy="20" r="10" fill="none" stroke="#fd79a8" stroke-width="2" stroke-dasharray="4 2"/><circle cx="20" cy="20" r="4" fill="#fff" stroke="#ffeaa7" stroke-width="1.5"/><circle cx="10" cy="14" r="2" fill="#00cec9"/><circle cx="30" cy="26" r="2" fill="#fd79a8"/></svg>`
    },
    {
        id: 'idle_genesis_tome',
        get name() { return getUpgradeName('idle_genesis_tome'); },
        get description() { return getUpgradeDesc('idle_genesis_tome'); },
        type: 'idle',
        category: 'production',
        baseCost: 15000000000000000,
        costMultiplier: 1.22,
        baseValue: 400000000000000,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><defs><linearGradient id="genesisCover" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6c5ce7"/><stop offset="100%" stop-color="#2d1b4e"/></linearGradient></defs><rect x="8" y="8" width="24" height="26" rx="3" fill="url(#genesisCover)" stroke="#ffeaa7" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="34" stroke="#ffeaa7" stroke-width="2"/><circle cx="22" cy="21" r="5" fill="#2d1b4e" stroke="#f1c40f" stroke-width="1.5"/><polygon points="22,17 23,20 26,21 23,22 22,25 21,22 18,21 21,20" fill="#f1c40f"/><path d="M16 12 L28 12 M16 30 L28 30" stroke="#a29bfe" stroke-width="1.2"/></svg>`
    },
    {
        id: 'click_creator_gauntlet',
        get name() { return getUpgradeName('click_creator_gauntlet'); },
        get description() { return getUpgradeDesc('click_creator_gauntlet'); },
        type: 'click',
        category: 'click',
        baseCost: 100000000000000000,
        costMultiplier: 1.23,
        baseValue: 25000000000000,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><defs><linearGradient id="creatorGlove" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffeaa7"/><stop offset="50%" stop-color="#f1c40f"/><stop offset="100%" stop-color="#d35400"/></linearGradient></defs><path d="M12 14 C12 10 16 8 20 8 C24 8 28 10 28 14 L28 32 C28 35 25 36 20 36 C15 36 12 35 12 32 Z" fill="url(#creatorGlove)" stroke="#b7791f" stroke-width="2"/><circle cx="16" cy="16" r="2" fill="#e74c3c"/><circle cx="20" cy="14" r="2.2" fill="#00cec9"/><circle cx="24" cy="16" r="2" fill="#9b59b6"/><circle cx="20" cy="23" r="3" fill="#2ecc71" stroke="#fff" stroke-width="1"/></svg>`
    },
    {
        id: 'idle_sphere_absolute',
        get name() { return getUpgradeName('idle_sphere_absolute'); },
        get description() { return getUpgradeDesc('idle_sphere_absolute'); },
        type: 'idle',
        category: 'production',
        baseCost: 500000000000000000,
        costMultiplier: 1.23,
        baseValue: 15000000000000000,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><defs><radialGradient id="sphereAbs" cx="40%" cy="40%" r="60%"><stop offset="0%" stop-color="#ffffff"/><stop offset="30%" stop-color="#ffeaa7"/><stop offset="60%" stop-color="#fd79a8"/><stop offset="100%" stop-color="#6c5ce7"/></radialGradient></defs><ellipse cx="20" cy="20" rx="19" ry="7" stroke="#00cec9" stroke-width="1.8" transform="rotate(-30 20 20)"/><ellipse cx="20" cy="20" rx="19" ry="7" stroke="#ffeaa7" stroke-width="1.8" transform="rotate(30 20 20)"/><circle cx="20" cy="20" r="10" fill="url(#sphereAbs)" stroke="#fff" stroke-width="1.5"/><circle cx="20" cy="20" r="4" fill="#fff"/></svg>`
    },
    {
        id: 'idle_hearth',
        get name() { return getUpgradeName('idle_hearth'); },
        get description() { return getUpgradeDesc('idle_hearth'); },
        type: 'hearth',
        category: 'mastery',
        baseCost: 12000,
        costMultiplier: 1.22,
        baseValue: 10,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><rect x="8" y="24" width="24" height="12" rx="3" fill="#636e72" stroke="#2d3436" stroke-width="2"/><path d="M14 24 Q20 12 26 24" fill="#2d3436"/><path d="M16 26 Q20 16 24 26" fill="#e17055"/><circle cx="20" cy="24" r="3" fill="#f1c40f"/><path d="M12 12 Q20 4 28 12" stroke="#e67e22" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`
    },
    {
        id: 'click_heat',
        get name() { return getUpgradeName('click_heat'); },
        get description() { return getUpgradeDesc('click_heat'); },
        type: 'heat',
        category: 'mastery',
        baseCost: 25000,
        costMultiplier: 1.25,
        baseValue: 1,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><path d="M20 4 C16 12 10 16 10 24 C10 30 14 36 20 36 C26 36 30 30 30 24 C30 18 26 12 20 4 Z" fill="#ff7675" stroke="#d63031" stroke-width="2"/><path d="M20 14 C17 19 14 22 14 27 C14 30 17 33 20 33 C23 33 26 30 26 27 C26 23 23 19 20 14 Z" fill="#f1c40f"/><circle cx="20" cy="28" r="3" fill="#fff"/></svg>`
    },
    {
        id: 'mastery_resonance_flow',
        get name() { return getUpgradeName('mastery_resonance_flow'); },
        get description() { return getUpgradeDesc('mastery_resonance_flow'); },
        type: 'resonance_flow',
        category: 'mastery',
        baseCost: 50000000,
        costMultiplier: 1.30,
        baseValue: 1,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><path d="M6 20 C10 12 16 12 20 20 C24 28 30 28 34 20" stroke="#00cec9" stroke-width="3" stroke-linecap="round"/><path d="M6 20 C10 28 16 28 20 20 C24 12 30 12 34 20" stroke="#a29bfe" stroke-width="2" stroke-linecap="round" opacity="0.85"/><circle cx="20" cy="20" r="3.5" fill="#ffeaa7" stroke="#fd79a8" stroke-width="1.5"/><circle cx="8" cy="20" r="2" fill="#00cec9"/><circle cx="32" cy="20" r="2" fill="#a29bfe"/></svg>`
    },
    {
        id: 'mastery_crit_dmg',
        get name() { return getUpgradeName('mastery_crit_dmg'); },
        get description() { return getUpgradeDesc('mastery_crit_dmg'); },
        type: 'crit_dmg',
        category: 'mastery',
        baseCost: 500000000,
        costMultiplier: 1.35,
        baseValue: 0.5,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><polygon points="20,2 23,13 34,7 28,17 38,20 28,23 34,33 23,27 20,38 17,27 6,33 12,23 2,20 12,17 6,7 17,13" fill="#ff7675" stroke="#d63031" stroke-width="1.5"/><circle cx="20" cy="20" r="6" fill="#f1c40f" stroke="#fff" stroke-width="1.5"/><circle cx="20" cy="20" r="2.5" fill="#fff"/></svg>`
    }
];

export const defaultSecretUpgrades: SecretUpgrade[] = [
    { 
        id: 'stardust_extractor', 
        get name() { return getSecretUpgradeName('stardust_extractor'); }, 
        get description() { return getSecretUpgradeDesc('stardust_extractor'); }, 
        category: 'ritual',
        baseCost: 1, 
        costMultiplier: 1.6, 
        level: 0, 
        maxLevel: 5 
    },
    { 
        id: 'essence_mastery', 
        get name() { return getSecretUpgradeName('essence_mastery'); }, 
        get description() { return getSecretUpgradeDesc('essence_mastery'); }, 
        category: 'alchemy',
        baseCost: 2, 
        costMultiplier: 1.6, 
        level: 0, 
        maxLevel: 5 
    },
    { 
        id: 'scout_whisper', 
        get name() { return getSecretUpgradeName('scout_whisper'); }, 
        get description() { return getSecretUpgradeDesc('scout_whisper'); }, 
        category: 'expeditions',
        baseCost: 2, 
        costMultiplier: 1.5, 
        level: 0, 
        maxLevel: 5 
    },
    { 
        id: 'orders', 
        get name() { return getSecretUpgradeName('orders'); }, 
        get description() { return getSecretUpgradeDesc('orders'); }, 
        category: 'orders',
        baseCost: 3, 
        costMultiplier: 1.6, 
        level: 0, 
        maxLevel: 10 
    },
    { 
        id: 'cooldown_mastery', 
        get name() { return getSecretUpgradeName('cooldown_mastery'); }, 
        get description() { return getSecretUpgradeDesc('cooldown_mastery'); }, 
        category: 'alchemy',
        baseCost: 3, 
        costMultiplier: 1.8, 
        level: 0, 
        maxLevel: 5 
    },
    { 
        id: 'crystal_transmute', 
        get name() { return getSecretUpgradeName('crystal_transmute'); }, 
        get description() { return getSecretUpgradeDesc('crystal_transmute'); }, 
        category: 'economy',
        baseCost: 4, 
        costMultiplier: 1.6, 
        level: 0, 
        maxLevel: 5 
    },
    { 
        id: 'archmage_heritage', 
        get name() { return getSecretUpgradeName('archmage_heritage'); }, 
        get description() { return getSecretUpgradeDesc('archmage_heritage'); }, 
        category: 'ritual',
        baseCost: 4, 
        costMultiplier: 1.8, 
        level: 0, 
        maxLevel: 5 
    },
    { 
        id: 'familiar', 
        get name() { return getSecretUpgradeName('familiar'); }, 
        get description() { return getSecretUpgradeDesc('familiar'); }, 
        category: 'economy',
        baseCost: 5, 
        costMultiplier: 1.6, 
        level: 0, 
        maxLevel: 10 
    },
    { 
        id: 'astral_resonance', 
        get name() { return getSecretUpgradeName('astral_resonance'); }, 
        get description() { return getSecretUpgradeDesc('astral_resonance'); }, 
        category: 'ritual',
        baseCost: 10, 
        costMultiplier: 1.40, 
        level: 0, 
        maxLevel: 999999 
    }
];

export const AVAILABLE_ARTIFACTS: Artifact[] = [
    {
        id: 0,
        get name() { return getArtifactName(0); },
        get description() { return getArtifactDesc(0); },
        cost: 3,
        svg: `<svg viewBox="0 0 100 100"><rect x="30" y="10" width="40" height="80" fill="#f1c40f" rx="5"/><line x1="35" y1="20" x2="65" y2="20" stroke="#d35400" stroke-width="4"/><line x1="35" y1="35" x2="65" y2="35" stroke="#d35400" stroke-width="4"/><line x1="35" y1="50" x2="65" y2="50" stroke="#d35400" stroke-width="4"/></svg>`
    },
    {
        id: 1,
        get name() { return getArtifactName(1); },
        get description() { return getArtifactDesc(1); },
        cost: 8,
        svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="#f39c12" stroke-width="10"/><circle cx="50" cy="20" r="12" fill="#e74c3c"/></svg>`
    },
    {
        id: 2,
        get name() { return getArtifactName(2); },
        get description() { return getArtifactDesc(2); },
        cost: 15,
        svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="#34495e" stroke="#ecf0f1" stroke-width="5"/><circle cx="50" cy="50" r="3" fill="#ecf0f1"/><line x1="50" y1="50" x2="50" y2="25" stroke="#ecf0f1" stroke-width="4" stroke-linecap="round"/><line x1="50" y1="50" x2="65" y2="65" stroke="#ecf0f1" stroke-width="4" stroke-linecap="round"/></svg>`
    },
    // --- Archmage Set ---
    {
        id: 3,
        get name() { return getArtifactName(3); },
        get description() { return getArtifactDesc(3); },
        cost: 30,
        svg: `<svg viewBox="0 0 100 100"><path d="M50 10 L80 90 L20 90 Z" fill="#9b59b6" stroke="#8e44ad" stroke-width="3"/><path d="M50 10 L65 90 L35 90 Z" fill="#8e44ad"/><circle cx="50" cy="40" r="8" fill="#f1c40f"/></svg>`
    },
    {
        id: 4,
        get name() { return getArtifactName(4); },
        get description() { return getArtifactDesc(4); },
        cost: 55,
        svg: `<svg viewBox="0 0 100 100"><rect x="45" y="20" width="10" height="70" fill="#7f8c8d" rx="4"/><circle cx="50" cy="15" r="12" fill="#3498db" stroke="#2980b9" stroke-width="4"/><circle cx="50" cy="15" r="5" fill="#ecf0f1"/></svg>`
    },
    {
        id: 5,
        get name() { return getArtifactName(5); },
        get description() { return getArtifactDesc(5); },
        cost: 90,
        svg: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="80" rx="40" ry="10" fill="#2c3e50"/><polygon points="20,75 80,75 50,10" fill="#34495e"/><polygon points="35,75 65,75 50,10" fill="#2c3e50"/><path d="M30 70 Q50 85 70 70" fill="none" stroke="#f1c40f" stroke-width="4"/></svg>`
    },
    {
        id: 6,
        get name() { return getArtifactName(6); },
        get description() { return getArtifactDesc(6); },
        cost: 160,
        svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="#9b59b6" stroke-width="8"/><circle cx="50" cy="20" r="14" fill="#3498db" stroke="#2980b9" stroke-width="3"/><polygon points="50,10 55,20 65,25 55,30 50,40 45,30 35,25 45,20" fill="#ecf0f1" opacity="0.8"/></svg>`
    },
    {
        id: 7,
        get name() { return getArtifactName(7); },
        get description() { return getArtifactDesc(7); },
        cost: 300,
        svg: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="40" ry="25" fill="#ecf0f1" stroke="#f39c12" stroke-width="5"/><circle cx="50" cy="50" r="18" fill="#e74c3c"/><circle cx="50" cy="50" r="6" fill="#c0392b"/><circle cx="55" cy="45" r="4" fill="white"/></svg>`
    },
    // --- Phoenix Flame Set ---
    {
        id: 8,
        get name() { return getArtifactName(8); },
        get description() { return getArtifactDesc(8); },
        cost: 700,
        svg: `<svg viewBox="0 0 100 100"><defs><radialGradient id="phoenixPearlGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff"/><stop offset="35%" stop-color="#f39c12"/><stop offset="70%" stop-color="#e74c3c"/><stop offset="100%" stop-color="#962d22"/></radialGradient><linearGradient id="goldFiligree" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffeaa7"/><stop offset="50%" stop-color="#f1c40f"/><stop offset="100%" stop-color="#d35400"/></linearGradient></defs><path d="M50 12 Q38 30 42 45 Q30 50 35 68 Q40 85 50 90 Q60 85 65 68 Q70 50 58 45 Q62 30 50 12 Z" fill="#e74c3c" opacity="0.35"/><path d="M28 78 C35 70 42 75 50 82 C58 75 65 70 72 78 C65 88 35 88 28 78 Z" fill="url(#goldFiligree)" stroke="#b7791f" stroke-width="1.5"/><path d="M22 60 Q28 68 34 66" stroke="url(#goldFiligree)" stroke-width="3.5" stroke-linecap="round" fill="none"/><path d="M78 60 Q72 68 66 66" stroke="url(#goldFiligree)" stroke-width="3.5" stroke-linecap="round" fill="none"/><path d="M50 84 L50 94 M42 94 L58 94" stroke="url(#goldFiligree)" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="50" r="24" fill="url(#phoenixPearlGlow)"/><ellipse cx="44" cy="42" rx="7" ry="4" fill="#ffffff" opacity="0.75" transform="rotate(-30 44 42)"/><polygon points="50,22 52,28 58,30 52,32 50,38 48,32 42,30 48,28" fill="#ffeaa7"/><circle cx="34" cy="36" r="2" fill="#fdcb6e"/><circle cx="66" cy="38" r="2.5" fill="#fdcb6e"/></svg>`
    },
    {
        id: 9,
        get name() { return getArtifactName(9); },
        get description() { return getArtifactDesc(9); },
        cost: 1200,
        svg: `<svg viewBox="0 0 100 100"><defs><linearGradient id="volcanoStone" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3d3d3d"/><stop offset="50%" stop-color="#1e1e1e"/><stop offset="100%" stop-color="#0a0a0a"/></linearGradient><linearGradient id="magmaFlow" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff9f43"/><stop offset="50%" stop-color="#ee5253"/><stop offset="100%" stop-color="#ff3838"/></linearGradient></defs><polygon points="30,12 70,12 88,30 88,70 70,88 30,88 12,70 12,30" fill="url(#volcanoStone)" stroke="#c0392b" stroke-width="2.5"/><polygon points="33,18 67,18 82,33 82,67 67,82 33,82 18,67 18,33" fill="#151515" stroke="#4a1c17" stroke-width="1.5"/><path d="M22 35 L38 45 L34 56 L46 64 L50 78" stroke="url(#magmaFlow)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M78 35 L62 45 L66 58 L54 65 L50 78" stroke="url(#magmaFlow)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M50 20 L50 36 M38 45 L50 48 L62 45" stroke="url(#magmaFlow)" stroke-width="2" stroke-linecap="round" fill="none"/><circle cx="50" cy="50" r="14" fill="#2d0c0a" stroke="#ff7675" stroke-width="1.8"/><path d="M50 40 L57 56 L43 56 Z" fill="url(#magmaFlow)"/><circle cx="50" cy="50" r="3.5" fill="#fff"/></svg>`
    },
    {
        id: 10,
        get name() { return getArtifactName(10); },
        get description() { return getArtifactDesc(10); },
        cost: 2000,
        svg: `<svg viewBox="0 0 100 100"><defs><linearGradient id="chaliceGold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffeaa7"/><stop offset="60%" stop-color="#fdcb6e"/><stop offset="100%" stop-color="#e17055"/></linearGradient><linearGradient id="fireCore" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#e74c3c"/><stop offset="40%" stop-color="#ff7675"/><stop offset="80%" stop-color="#f1c40f"/><stop offset="100%" stop-color="#ffffff"/></linearGradient></defs><path d="M50 10 Q32 30 42 50 Q28 42 36 28 Q44 20 50 10 Z" fill="#ff7675" opacity="0.6"/><path d="M50 10 Q68 30 58 50 Q72 42 64 28 Q56 20 50 10 Z" fill="#ff7675" opacity="0.6"/><path d="M50 14 Q38 32 44 48 Q50 54 56 48 Q62 32 50 14 Z" fill="url(#fireCore)"/><path d="M50 24 Q44 36 48 45 Q50 48 52 45 Q56 36 50 24 Z" fill="#ffffff"/><path d="M25 46 C25 65 38 72 46 73 L46 84 L36 88 L36 92 L64 92 L64 88 L54 84 L54 73 C62 72 75 65 75 46 Z" fill="url(#chaliceGold)" stroke="#d35400" stroke-width="1.8"/><ellipse cx="50" cy="46" rx="25" ry="5" fill="#f39c12" stroke="#b7791f" stroke-width="1.5"/><circle cx="50" cy="62" r="4.5" fill="#d63031" stroke="#ffeaa7" stroke-width="1"/><circle cx="38" cy="58" r="3" fill="#e74c3c"/><circle cx="62" cy="58" r="3" fill="#e74c3c"/><path d="M25 50 Q14 54 18 64 Q22 70 28 66" fill="none" stroke="url(#chaliceGold)" stroke-width="2.5" stroke-linecap="round"/><path d="M75 50 Q86 54 82 64 Q78 70 72 66" fill="none" stroke="url(#chaliceGold)" stroke-width="2.5" stroke-linecap="round"/></svg>`
    },
    {
        id: 11,
        get name() { return getArtifactName(11); },
        get description() { return getArtifactDesc(11); },
        cost: 3500,
        svg: `<svg viewBox="0 0 100 100"><defs><linearGradient id="featherPlume" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fff200"/><stop offset="35%" stop-color="#ff9f43"/><stop offset="70%" stop-color="#ee5253"/><stop offset="100%" stop-color="#5f27cd"/></linearGradient></defs><path d="M78 14 C70 20 62 18 52 24 C40 32 30 46 26 62 C22 75 25 86 24 90 C26 86 32 82 40 80 C56 75 68 62 74 46 C78 35 84 24 78 14 Z" fill="url(#featherPlume)"/><path d="M52 24 C45 32 38 42 34 50 M44 38 C38 48 32 58 29 66 M58 48 C50 60 42 70 36 78" stroke="#ffeaa7" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.85"/><path d="M78 14 Q52 46 24 90" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" fill="none"/><circle cx="68" cy="20" r="2.5" fill="#f1c40f"/><circle cx="82" cy="35" r="2" fill="#ff7675"/><circle cx="60" cy="12" r="1.5" fill="#feca57"/><polygon points="38,40 40,43 43,44 40,45 38,48 36,45 33,44 36,43" fill="#ffffff" opacity="0.9"/></svg>`
    },
    // --- Titans Chronicle Set ---
    {
        id: 12,
        get name() { return getArtifactName(12); },
        get description() { return getArtifactDesc(12); },
        cost: 6000,
        svg: `<svg viewBox="0 0 100 100"><defs><linearGradient id="astroTitan" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#dfe6e9"/><stop offset="50%" stop-color="#74b9ff"/><stop offset="100%" stop-color="#0984e3"/></linearGradient><radialGradient id="chronoCore" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffffff"/><stop offset="40%" stop-color="#00cec9"/><stop offset="80%" stop-color="#6c5ce7"/><stop offset="100%" stop-color="#2d3436"/></radialGradient></defs><circle cx="50" cy="50" r="40" fill="none" stroke="url(#astroTitan)" stroke-width="3" stroke-dasharray="8 4"/><ellipse cx="50" cy="50" rx="32" ry="18" fill="none" stroke="#81ecec" stroke-width="2.5" transform="rotate(35 50 50)"/><ellipse cx="50" cy="50" rx="32" ry="18" fill="none" stroke="#a29bfe" stroke-width="2.5" transform="rotate(-35 50 50)"/><circle cx="50" cy="10" r="3" fill="#00cec9"/><circle cx="90" cy="50" r="3" fill="#00cec9"/><circle cx="50" cy="90" r="3" fill="#00cec9"/><circle cx="10" cy="50" r="3" fill="#00cec9"/><circle cx="50" cy="50" r="16" fill="url(#chronoCore)" stroke="#dfe6e9" stroke-width="1.8"/><line x1="50" y1="50" x2="50" y2="38" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/><line x1="50" y1="50" x2="60" y2="54" stroke="#81ecec" stroke-width="2" stroke-linecap="round"/><circle cx="50" cy="50" r="3" fill="#ffffff"/></svg>`
    },
    {
        id: 13,
        get name() { return getArtifactName(13); },
        get description() { return getArtifactDesc(13); },
        cost: 10000,
        svg: `<svg viewBox="0 0 100 100"><defs><linearGradient id="monolithGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2c3e50"/><stop offset="60%" stop-color="#1e272e"/><stop offset="100%" stop-color="#0f141d"/></linearGradient><linearGradient id="glyphGlow" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#00cec9"/><stop offset="100%" stop-color="#6c5ce7"/></linearGradient></defs><rect x="22" y="12" width="56" height="76" rx="6" fill="url(#monolithGrad)" stroke="#6c5ce7" stroke-width="2.5"/><rect x="26" y="16" width="48" height="68" rx="4" fill="#121824" stroke="#00cec9" stroke-width="1" stroke-dasharray="6 3"/><circle cx="50" cy="30" r="7" fill="none" stroke="url(#glyphGlow)" stroke-width="2"/><line x1="50" y1="20" x2="50" y2="40" stroke="url(#glyphGlow)" stroke-width="1.8"/><line x1="40" y1="30" x2="60" y2="30" stroke="url(#glyphGlow)" stroke-width="1.8"/><path d="M36 50 L50 44 L64 50 L50 56 Z" fill="none" stroke="url(#glyphGlow)" stroke-width="2"/><circle cx="50" cy="50" r="2" fill="#fff"/><line x1="34" y1="64" x2="66" y2="64" stroke="url(#glyphGlow)" stroke-width="2.5" stroke-linecap="round"/><line x1="38" y1="72" x2="62" y2="72" stroke="url(#glyphGlow)" stroke-width="2.5" stroke-linecap="round"/><polygon points="50,14 52,18 56,20 52,22 50,26 48,22 44,20 48,18" fill="#81ecec"/></svg>`
    },
    {
        id: 14,
        get name() { return getArtifactName(14); },
        get description() { return getArtifactDesc(14); },
        cost: 18000,
        svg: `<svg viewBox="0 0 100 100"><defs><linearGradient id="voidMetal" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4834d4"/><stop offset="50%" stop-color="#24135f"/><stop offset="100%" stop-color="#130838"/></linearGradient><linearGradient id="crystalGlow" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00d2d3"/><stop offset="50%" stop-color="#54a0ff"/><stop offset="100%" stop-color="#5f27cd"/></linearGradient></defs><path d="M15 72 Q50 86 85 72 L82 66 Q50 78 18 66 Z" fill="url(#voidMetal)" stroke="#a29bfe" stroke-width="1.8"/><polygon points="50,16 57,66 43,66" fill="url(#voidMetal)" stroke="#6c5ce7" stroke-width="1.8"/><polygon points="28,30 36,68 22,68" fill="url(#voidMetal)" stroke="#6c5ce7" stroke-width="1.8"/><polygon points="72,30 78,68 64,68" fill="url(#voidMetal)" stroke="#6c5ce7" stroke-width="1.8"/><polygon points="50,22 58,40 50,54 42,40" fill="url(#crystalGlow)" stroke="#ffffff" stroke-width="1.2"/><line x1="50" y1="22" x2="50" y2="54" stroke="#ffffff" stroke-width="1" opacity="0.8"/><polygon points="28,34 34,46 28,56 22,46" fill="url(#crystalGlow)" stroke="#81ecec" stroke-width="1"/><polygon points="72,34 78,46 72,56 66,46" fill="url(#crystalGlow)" stroke="#81ecec" stroke-width="1"/><circle cx="50" cy="74" r="3.5" fill="#00d2d3"/></svg>`
    },
    {
        id: 15,
        get name() { return getArtifactName(15); },
        get description() { return getArtifactDesc(15); },
        cost: 30000,
        svg: `<svg viewBox="0 0 100 100"><defs><radialGradient id="titanHeart" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffffff"/><stop offset="30%" stop-color="#81ecec"/><stop offset="60%" stop-color="#0984e3"/><stop offset="90%" stop-color="#6c5ce7"/><stop offset="100%" stop-color="#2c2c54"/></radialGradient><linearGradient id="orbitRings" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffeaa7"/><stop offset="100%" stop-color="#00cec9"/></linearGradient></defs><ellipse cx="50" cy="50" rx="44" ry="14" fill="none" stroke="url(#orbitRings)" stroke-width="2.5" transform="rotate(-30 50 50)"/><ellipse cx="50" cy="50" rx="44" ry="14" fill="none" stroke="#a29bfe" stroke-width="2" stroke-dasharray="6 3" transform="rotate(45 50 50)"/><circle cx="18" cy="32" r="4" fill="#00d2d3" stroke="#fff" stroke-width="1"/><circle cx="82" cy="68" r="4" fill="#ffeaa7" stroke="#fff" stroke-width="1"/><circle cx="78" cy="26" r="3" fill="#a29bfe"/><polygon points="50,15 75,50 50,85 25,50" fill="url(#titanHeart)" stroke="#ffffff" stroke-width="2"/><polygon points="50,26 67,50 50,74 33,50" fill="#ffffff" opacity="0.4"/><polygon points="50,35 60,50 50,65 40,50" fill="#ffffff"/><line x1="50" y1="6" x2="50" y2="94" stroke="#ffffff" stroke-width="1.5" opacity="0.6"/><line x1="6" y1="50" x2="94" y2="50" stroke="#ffffff" stroke-width="1.5" opacity="0.6"/></svg>`
    },
    // --- Moon Witch Set ---
    {
        id: 16,
        get name() { return getArtifactName(16); },
        get description() { return getArtifactDesc(16); },
        cost: 120,
        svg: `<svg viewBox="0 0 100 100"><defs><linearGradient id="silverBlade" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#dfe6e9"/><stop offset="50%" stop-color="#b2bec3"/><stop offset="100%" stop-color="#636e72"/></linearGradient></defs><path d="M70 20 C40 20 25 45 35 75 C20 55 30 30 65 15 Z" fill="url(#silverBlade)" stroke="#a29bfe" stroke-width="2"/><circle cx="55" cy="45" r="5" fill="#f1c40f"/><circle cx="68" cy="65" r="3" fill="#ffeaa7"/><path d="M35 75 L25 85 L20 80 L30 70 Z" fill="#2d3436" stroke="#d63031" stroke-width="1.5"/></svg>`
    },
    {
        id: 17,
        get name() { return getArtifactName(17); },
        get description() { return getArtifactDesc(17); },
        cost: 220,
        svg: `<svg viewBox="0 0 100 100"><path d="M50 15 L80 85 L20 85 Z" fill="#2c1654" stroke="#a29bfe" stroke-width="2.5"/><circle cx="50" cy="40" r="3" fill="#fff"/><circle cx="40" cy="60" r="2" fill="#ffeaa7"/><circle cx="62" cy="55" r="2.5" fill="#74b9ff"/><path d="M50 15 Q30 50 35 85 M50 15 Q70 50 65 85" stroke="#a29bfe" stroke-width="1.5" fill="none"/></svg>`
    },
    {
        id: 18,
        get name() { return getArtifactName(18); },
        get description() { return getArtifactDesc(18); },
        cost: 400,
        svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="28" fill="#1e1035" stroke="#a29bfe" stroke-width="4"/><path d="M50 25 C40 25 35 35 40 50 C45 65 55 70 65 65 C50 65 42 55 45 42 C48 30 58 28 50 25 Z" fill="#ffeaa7"/><circle cx="60" cy="35" r="2" fill="#fff"/></svg>`
    },
    {
        id: 19,
        get name() { return getArtifactName(19); },
        get description() { return getArtifactDesc(19); },
        cost: 550,
        svg: `<svg viewBox="0 0 100 100"><rect x="25" y="18" width="50" height="64" rx="4" fill="#341f97" stroke="#54a0ff" stroke-width="2"/><path d="M25 82 Q50 78 75 82" stroke="#dfe6e9" stroke-width="3"/><path d="M40 35 Q50 45 60 35 Q50 55 40 35 Z" fill="#54a0ff" opacity="0.7"/><circle cx="50" cy="60" r="4" fill="#ffeaa7"/></svg>`
    }
];

export function getArtifactOverchargeCost(artifactId: number, currentStar: number): number {
    const art = AVAILABLE_ARTIFACTS.find(a => a.id === artifactId);
    if (!art) return 999999;
    const multipliers = [1.5, 2.5, 4.0, 6.5, 10.0];
    const mult = multipliers[Math.min(multipliers.length - 1, Math.max(0, currentStar))];
    return Math.round(art.cost * mult);
}

export const AVAILABLE_COLLECTIONS: Collection[] = [
    {
        id: 'archmage_set',
        get name() { return getCollectionName('archmage_set'); },
        get description() { return getCollectionDesc('archmage_set'); },
        themeColor: '#9b59b6',
        requiredArtifactIds: [3, 4, 5, 6, 7],
        rewardPetId: 'pet_astral_dragon',
        get perks() {
            const raw = getCollectionPerks('archmage_set');
            const colors = ['#f1c40f', '#74b9ff', '#e056fd'];
            return raw.map((text, i) => ({ iconColor: colors[i] || '#f1c40f', text }));
        }
    },
    {
        id: 'moon_witch_set',
        get name() { return getCollectionName('moon_witch_set'); },
        get description() { return getCollectionDesc('moon_witch_set'); },
        themeColor: '#a29bfe',
        requiredArtifactIds: [16, 17, 18, 19],
        rewardPetId: 'pet_moon_cat',
        get perks() {
            const raw = getCollectionPerks('moon_witch_set');
            const colors = ['#a29bfe', '#2ecc71', '#f1c40f', '#ffeaa7'];
            return raw.map((text, i) => ({ iconColor: colors[i] || '#a29bfe', text }));
        }
    },
    {
        id: 'phoenix_set',
        get name() { return getCollectionName('phoenix_set'); },
        get description() { return getCollectionDesc('phoenix_set'); },
        themeColor: '#e17055',
        requiredArtifactIds: [8, 9, 10, 11],
        rewardPetId: 'pet_phoenix',
        get perks() {
            const raw = getCollectionPerks('phoenix_set');
            const colors = ['#ff7675', '#f39c12', '#fdcb6e', '#e17055'];
            return raw.map((text, i) => ({ iconColor: colors[i] || '#ff7675', text }));
        }
    },
    {
        id: 'titan_set',
        get name() { return getCollectionName('titan_set'); },
        get description() { return getCollectionDesc('titan_set'); },
        themeColor: '#00cec9',
        requiredArtifactIds: [12, 13, 14, 15],
        rewardPetId: 'pet_void_titan',
        get perks() {
            const raw = getCollectionPerks('titan_set');
            const colors = ['#00cec9', '#6c5ce7', '#a29bfe', '#81ecec'];
            return raw.map((text, i) => ({ iconColor: colors[i] || '#00cec9', text }));
        }
    }
];

export const AVAILABLE_PETS: Pet[] = [
    {
        id: 'pet_rat',
        get name() { return getPetName('pet_rat'); },
        get description() { return getPetDesc('pet_rat'); },
        rarity: 'common',
        expeditionHours: 1,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><ellipse cx="20" cy="22" rx="12" ry="9" fill="#7f8c8d"/><circle cx="28" cy="17" r="3.5" fill="#bdc3c7"/><ellipse cx="14" cy="14" rx="4" ry="5" fill="#ffb8b8"/><circle cx="26" cy="19" r="1.5" fill="#2d3436"/><path d="M8 22 Q4 20 2 26" stroke="#e17055" stroke-width="1.5" fill="none"/></svg>`
    },
    {
        id: 'pet_slime',
        get name() { return getPetName('pet_slime'); },
        get description() { return getPetDesc('pet_slime'); },
        rarity: 'common',
        expeditionHours: 1,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><path d="M20 10 Q35 15 35 30 Q35 35 20 35 Q5 35 5 30 Q5 15 20 10Z" fill="#55efc4" opacity="0.8"/><circle cx="15" cy="22" r="3" fill="#2d3436"/><circle cx="25" cy="22" r="3" fill="#2d3436"/></svg>`
    },
    {
        id: 'pet_bat',
        get name() { return getPetName('pet_bat'); },
        get description() { return getPetDesc('pet_bat'); },
        rarity: 'common',
        expeditionHours: 2,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><defs><radialGradient id="batWingGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#4834d4"/><stop offset="100%" stop-color="#19102c"/></radialGradient></defs><path d="M20 22 C14 12 4 15 2 24 C8 24 13 28 16 32 C18 28 19 24 20 22 Z" fill="url(#batWingGrad)"/><path d="M20 22 C26 12 36 15 38 24 C32 24 27 28 24 32 C22 28 21 24 20 22 Z" fill="url(#batWingGrad)"/><ellipse cx="20" cy="24" rx="6" ry="8" fill="#2c2c54"/><polygon points="16,18 14,8 19,16" fill="#474787"/><polygon points="24,18 26,8 21,16" fill="#474787"/><circle cx="18" cy="22" r="1.5" fill="#2ed573"/><circle cx="22" cy="22" r="1.5" fill="#2ed573"/><polygon points="18,27 19,25 20,27" fill="#fff"/><polygon points="20,27 21,25 22,27" fill="#fff"/></svg>`
    },
    {
        id: 'pet_frog',
        get name() { return getPetName('pet_frog'); },
        get description() { return getPetDesc('pet_frog'); },
        rarity: 'common',
        expeditionHours: 2,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><defs><radialGradient id="frogGrad" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#2ed573"/><stop offset="70%" stop-color="#26af5f"/><stop offset="100%" stop-color="#145a32"/></radialGradient></defs><ellipse cx="20" cy="25" rx="13" ry="10" fill="url(#frogGrad)"/><circle cx="13" cy="16" r="5.5" fill="#2ed573"/><circle cx="27" cy="16" r="5.5" fill="#2ed573"/><circle cx="13" cy="16" r="3.5" fill="#ffd32a"/><circle cx="27" cy="16" r="3.5" fill="#ffd32a"/><circle cx="13" cy="16" r="1.8" fill="#1e272e"/><circle cx="27" cy="16" r="1.8" fill="#1e272e"/><path d="M15 26 Q20 30 25 26" stroke="#145a32" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="10" cy="25" r="2" fill="#ff7675" opacity="0.6"/><circle cx="30" cy="25" r="2" fill="#ff7675" opacity="0.6"/><polygon points="18,11 20,7 22,11" fill="#f1c40f"/></svg>`
    },
    {
        id: 'pet_hedgehog',
        get name() { return getPetName('pet_hedgehog'); },
        get description() { return getPetDesc('pet_hedgehog'); },
        rarity: 'common',
        expeditionHours: 1.5,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><defs><radialGradient id="hedgeBody" cx="40%" cy="50%" r="60%"><stop offset="0%" stop-color="#f5cd79"/><stop offset="80%" stop-color="#e17055"/><stop offset="100%" stop-color="#8c531b"/></radialGradient></defs><path d="M12 28 Q4 22 8 15 Q14 8 24 10 Q32 12 34 20 Q35 28 26 31 Z" fill="#5c3d2e"/><polygon points="6,18 2,14 8,15" fill="#795548"/><polygon points="10,13 6,8 12,11" fill="#8d6e63"/><polygon points="16,9 14,3 19,8" fill="#795548"/><polygon points="23,8 24,2 26,8" fill="#8d6e63"/><polygon points="29,10 33,5 31,12" fill="#795548"/><polygon points="34,16 38,13 35,19" fill="#8d6e63"/><path d="M16 11 Q19 5 22 11 Z" fill="#e74c3c"/><rect x="18" y="11" width="2" height="3" fill="#f5f6fa" rx="1"/><circle cx="18" cy="8" r="0.8" fill="#fff"/><circle cx="21" cy="9" r="0.6" fill="#fff"/><path d="M25 13 Q27 8 30 13 Z" fill="#e67e22"/><rect x="27" y="13" width="1.6" height="2.5" fill="#f5f6fa" rx="0.8"/><ellipse cx="22" cy="25" rx="11" ry="8" fill="url(#hedgeBody)"/><ellipse cx="29" cy="25" rx="6" ry="4" fill="#f7d794"/><circle cx="34" cy="24" r="1.5" fill="#2d3436"/><circle cx="28" cy="22" r="1.8" fill="#2d3436"/><circle cx="28.5" cy="21.5" r="0.6" fill="#fff"/><ellipse cx="17" cy="32" rx="3" ry="1.5" fill="#e17055"/><ellipse cx="26" cy="32" rx="3" ry="1.5" fill="#e17055"/></svg>`
    },
    {
        id: 'pet_spirit',
        get name() { return getPetName('pet_spirit'); },
        get description() { return getPetDesc('pet_spirit'); },
        rarity: 'rare',
        expeditionHours: 3,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><ellipse cx="20" cy="20" rx="10" ry="15" fill="#74b9ff" opacity="0.7"/><circle cx="16" cy="18" r="2" fill="white"/><circle cx="24" cy="18" r="2" fill="white"/><path d="M20 25 Q20 35 10 38" stroke="#74b9ff" stroke-width="2" fill="none"/></svg>`
    },
    {
        id: 'pet_owl',
        get name() { return getPetName('pet_owl'); },
        get description() { return getPetDesc('pet_owl'); },
        rarity: 'rare',
        expeditionHours: 4,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><defs><radialGradient id="owlGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#686de0"/><stop offset="60%" stop-color="#4834d4"/><stop offset="100%" stop-color="#130f40"/></radialGradient></defs><ellipse cx="20" cy="23" rx="11" ry="13" fill="url(#owlGrad)"/><path d="M9 16 Q6 28 13 32 Q10 24 9 16 Z" fill="#30336b"/><path d="M31 16 Q34 28 27 32 Q30 24 31 16 Z" fill="#30336b"/><circle cx="15" cy="18" r="5" fill="#130f40" stroke="#f0932b" stroke-width="1.4"/><circle cx="25" cy="18" r="5" fill="#130f40" stroke="#f0932b" stroke-width="1.4"/><circle cx="15" cy="18" r="2.5" fill="#ffbe76"/><circle cx="25" cy="18" r="2.5" fill="#ffbe76"/><circle cx="15" cy="18" r="1.2" fill="#130f40"/><circle cx="25" cy="18" r="1.2" fill="#130f40"/><polygon points="18,22 22,22 20,27" fill="#f0932b"/><polygon points="12,13 14,8 16,13" fill="#686de0"/><polygon points="28,13 26,8 24,13" fill="#686de0"/></svg>`
    },
    {
        id: 'pet_fox',
        get name() { return getPetName('pet_fox'); },
        get description() { return getPetDesc('pet_fox'); },
        rarity: 'rare',
        expeditionHours: 5,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><defs><radialGradient id="foxGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffbe76"/><stop offset="40%" stop-color="#f0932b"/><stop offset="100%" stop-color="#eb4d4b"/></radialGradient></defs><path d="M26 28 Q38 28 36 14 Q32 20 26 22 Z" fill="url(#foxGrad)"/><circle cx="36" cy="15" r="3" fill="#ffffff"/><polygon points="12,18 10,7 18,14" fill="#eb4d4b"/><polygon points="28,18 30,7 22,14" fill="#eb4d4b"/><polygon points="12,18 11,10 16,14" fill="#fff"/><polygon points="28,18 29,10 24,14" fill="#fff"/><polygon points="10,17 30,17 20,31" fill="url(#foxGrad)"/><polygon points="14,24 26,24 20,31" fill="#ffffff"/><circle cx="16" cy="20" r="1.8" fill="#2c3e50"/><circle cx="24" cy="20" r="1.8" fill="#2c3e50"/><polygon points="19,29 21,29 20,31" fill="#1e272e"/></svg>`
    },
    {
        id: 'pet_chameleon',
        get name() { return getPetName('pet_chameleon'); },
        get description() { return getPetDesc('pet_chameleon'); },
        rarity: 'rare',
        expeditionHours: 3.5,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><defs><linearGradient id="chamBody" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fd79a8"/><stop offset="35%" stop-color="#a29bfe"/><stop offset="70%" stop-color="#00cec9"/><stop offset="100%" stop-color="#00b894"/></linearGradient></defs><path d="M3 33 Q18 31 37 34" stroke="#795548" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M12 26 C7 26 4 30 5 33 C6 35 9 35 9 33 C9 31 7 31 7 32" stroke="#00b894" stroke-width="2.5" fill="none" stroke-linecap="round"/><ellipse cx="20" cy="23" rx="10" ry="7" fill="url(#chamBody)"/><polygon points="14,18 16,14 18,18" fill="#fd79a8"/><polygon points="18,17 20,13 22,17" fill="#e84393"/><polygon points="22,18 24,14 26,18" fill="#6c5ce7"/><ellipse cx="28" cy="20" rx="7" ry="6" fill="url(#chamBody)"/><circle cx="28" cy="19" r="4.2" fill="#ffeaa7" stroke="#00cec9" stroke-width="1.2"/><circle cx="28" cy="19" r="2.2" fill="#e84393"/><circle cx="28.5" cy="18.5" r="1.2" fill="#2d3436"/><circle cx="29" cy="18" r="0.5" fill="#fff"/><path d="M34 22 Q37 21 38 23" stroke="#e84393" stroke-width="1" fill="none" stroke-linecap="round"/><ellipse cx="17" cy="30" rx="2" ry="3" fill="#00b894"/><ellipse cx="25" cy="30" rx="2" ry="3" fill="#00cec9"/></svg>`
    },
    {
        id: 'pet_axolotl',
        get name() { return getPetName('pet_axolotl'); },
        get description() { return getPetDesc('pet_axolotl'); },
        rarity: 'rare',
        expeditionHours: 4,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><defs><radialGradient id="axoGrad" cx="50%" cy="45%" r="55%"><stop offset="0%" stop-color="#fff0f5"/><stop offset="60%" stop-color="#ffb8d9"/><stop offset="100%" stop-color="#f8a5c2"/></radialGradient></defs><path d="M12 18 Q5 14 3 10 Q8 12 11 16" fill="#e84393"/><path d="M10 20 Q3 19 2 17 Q7 20 10 20" fill="#fd79a8"/><path d="M12 22 Q5 25 4 28 Q8 25 12 22" fill="#e84393"/><path d="M28 18 Q35 14 37 10 Q32 12 29 16" fill="#e84393"/><path d="M30 20 Q37 19 38 17 Q33 20 30 20" fill="#fd79a8"/><path d="M28 22 Q35 25 36 28 Q32 25 28 22" fill="#e84393"/><path d="M20 28 Q20 38 16 38 Q18 33 20 28" fill="#fd79a8" opacity="0.6"/><ellipse cx="20" cy="27" rx="7" ry="9" fill="url(#axoGrad)"/><ellipse cx="20" cy="19" rx="11" ry="8.5" fill="url(#axoGrad)"/><circle cx="13" cy="21" r="2.5" fill="#ff7675" opacity="0.5"/><circle cx="27" cy="21" r="2.5" fill="#ff7675" opacity="0.5"/><circle cx="15" cy="18" r="2" fill="#2d3436"/><circle cx="15.6" cy="17.4" r="0.7" fill="#fff"/><circle cx="25" cy="18" r="2" fill="#2d3436"/><circle cx="25.6" cy="17.4" r="0.7" fill="#fff"/><path d="M17 22 Q20 24.5 23 22" stroke="#c44569" stroke-width="1.2" fill="none" stroke-linecap="round"/><ellipse cx="14" cy="29" rx="2.5" ry="1.5" fill="#ffb8d9"/><ellipse cx="26" cy="29" rx="2.5" ry="1.5" fill="#ffb8d9"/><circle cx="8" cy="8" r="1.5" fill="#81ecec" opacity="0.8"/><circle cx="33" cy="7" r="1" fill="#81ecec" opacity="0.8"/></svg>`
    },
    {
        id: 'pet_gryphon',
        get name() { return getPetName('pet_gryphon'); },
        get description() { return getPetDesc('pet_gryphon'); },
        rarity: 'epic',
        expeditionHours: 6,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><path d="M10 20 L20 10 L30 20 L20 30 Z" fill="#f1c40f"/><circle cx="15" cy="18" r="2" fill="black"/><path d="M20 20 L35 10 L30 25 Z" fill="#e67e22"/></svg>`
    },
    {
        id: 'pet_golem',
        get name() { return getPetName('pet_golem'); },
        get description() { return getPetDesc('pet_golem'); },
        rarity: 'epic',
        expeditionHours: 8,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><defs><linearGradient id="golemRock" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a4b0be"/><stop offset="50%" stop-color="#57606f"/><stop offset="100%" stop-color="#2f3542"/></linearGradient><filter id="golemGlow"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><polygon points="6,24 14,14 26,14 34,24 28,34 12,34" fill="url(#golemRock)" stroke="#2f3542" stroke-width="1.5"/><polygon points="15,14 20,8 25,14" fill="#747d8c" stroke="#2f3542" stroke-width="1"/><circle cx="16" cy="20" r="2.2" fill="#00d2d3" filter="url(#golemGlow)"/><circle cx="24" cy="20" r="2.2" fill="#00d2d3" filter="url(#golemGlow)"/><polygon points="20,24 23,28 20,32 17,28" fill="#00d2d3" filter="url(#golemGlow)"/></svg>`
    },
    {
        id: 'pet_scarab',
        get name() { return getPetName('pet_scarab'); },
        get description() { return getPetDesc('pet_scarab'); },
        rarity: 'epic',
        expeditionHours: 7,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><defs><radialGradient id="scarabShell" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#4bcffa"/><stop offset="40%" stop-color="#0fbcf9"/><stop offset="80%" stop-color="#1e3799"/><stop offset="100%" stop-color="#0c2461"/></radialGradient><linearGradient id="goldLegs" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffeaa7"/><stop offset="60%" stop-color="#f1c40f"/><stop offset="100%" stop-color="#d35400"/></linearGradient><filter id="scarabGemGlow"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M12 16 Q6 12 4 8" stroke="url(#goldLegs)" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M28 16 Q34 12 36 8" stroke="url(#goldLegs)" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M10 22 Q4 22 2 24" stroke="url(#goldLegs)" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M30 22 Q36 22 38 24" stroke="url(#goldLegs)" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M12 28 Q6 34 5 37" stroke="url(#goldLegs)" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M28 28 Q34 34 35 37" stroke="url(#goldLegs)" stroke-width="1.8" fill="none" stroke-linecap="round"/><ellipse cx="20" cy="24" rx="11" ry="12" fill="url(#scarabShell)" stroke="#f1c40f" stroke-width="1"/><line x1="20" y1="13" x2="20" y2="36" stroke="#f1c40f" stroke-width="1.2"/><path d="M12 14 Q20 10 28 14 L26 18 Q20 16 14 18 Z" fill="#1e3799" stroke="#f1c40f" stroke-width="0.8"/><ellipse cx="20" cy="11" rx="5" ry="3.5" fill="#0c2461" stroke="#f1c40f" stroke-width="0.8"/><path d="M18 9 Q17 4 14 3 M22 9 Q23 4 26 3" stroke="#f1c40f" stroke-width="1.5" fill="none" stroke-linecap="round"/><polygon points="20,19 23,23 20,27 17,23" fill="#00d2d3" stroke="#fff" stroke-width="0.8" filter="url(#scarabGemGlow)"/><circle cx="20" cy="23" r="1.2" fill="#fff"/></svg>`
    },
    {
        id: 'pet_pegasus',
        get name() { return getPetName('pet_pegasus'); },
        get description() { return getPetDesc('pet_pegasus'); },
        rarity: 'epic',
        expeditionHours: 8,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><defs><linearGradient id="pegasusWing" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffffff"/><stop offset="50%" stop-color="#74b9ff"/><stop offset="100%" stop-color="#0984e3"/></linearGradient><linearGradient id="lightningMane" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#ffeaa7"/><stop offset="50%" stop-color="#f1c40f"/><stop offset="100%" stop-color="#e17055"/></linearGradient><filter id="pegasusGlow"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M16 16 C10 6 3 8 2 17 C6 17 11 18 16 20 Z" fill="url(#pegasusWing)" opacity="0.7"/><path d="M14 32 C12 25 15 19 18 16 C19 12 20 8 23 6 C26 5 28 8 27 12 C29 13 32 14 31 18 C28 20 25 20 22 21 C20 26 21 30 22 34 Z" fill="#dfe6e9"/><path d="M21 6 L18 11 L22 12 L17 17 L21 18 L16 24" stroke="url(#lightningMane)" stroke-width="2" fill="none" stroke-linecap="round" filter="url(#pegasusGlow)"/><polygon points="26,6 28,2 29,7" fill="#b2bec3"/><circle cx="26" cy="11" r="1.8" fill="#00d2d3" filter="url(#pegasusGlow)"/><circle cx="26.5" cy="10.5" r="0.6" fill="#fff"/><ellipse cx="30" cy="16" rx="1.2" ry="0.8" fill="#636e72"/><path d="M20 20 C14 8 5 9 4 19 C9 19 15 21 20 24 Z" fill="url(#pegasusWing)" stroke="#81ecec" stroke-width="0.8"/><path d="M8 18 Q14 16 19 21" stroke="#fff" stroke-width="1.2" fill="none"/><polygon points="34,8 35,6 36,8 38,9 36,10 35,12 34,10 32,9" fill="#ffeaa7"/></svg>`
    },
    {
        id: 'pet_dragon',
        get name() { return getPetName('pet_dragon'); },
        get description() { return getPetDesc('pet_dragon'); },
        rarity: 'legendary',
        expeditionHours: 12,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><path d="M5 25 Q20 5 35 25 Q20 35 5 25Z" fill="#d63031"/><circle cx="15" cy="20" r="2" fill="#f1c40f"/><circle cx="25" cy="20" r="2" fill="#f1c40f"/><path d="M5 25 L10 10 L15 25 Z" fill="#ff7675"/><path d="M35 25 L30 10 L25 25 Z" fill="#ff7675"/></svg>`
    },
    {
        id: 'pet_manticore',
        get name() { return getPetName('pet_manticore'); },
        get description() { return getPetDesc('pet_manticore'); },
        rarity: 'legendary',
        expeditionHours: 14,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><defs><radialGradient id="manticoreGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ff7675"/><stop offset="60%" stop-color="#d63031"/><stop offset="100%" stop-color="#540808"/></radialGradient><filter id="manticoreGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M20 20 C10 8 2 14 4 26 C10 24 15 22 20 24 Z" fill="#2d3436" stroke="#d63031" stroke-width="1"/><path d="M20 20 C30 8 38 14 36 26 C30 24 25 22 20 24 Z" fill="#2d3436" stroke="#d63031" stroke-width="1"/><path d="M20 30 Q34 38 34 22 Q34 16 30 14" fill="none" stroke="#e17055" stroke-width="2.5" stroke-linecap="round"/><polygon points="30,12 33,16 28,15" fill="#f1c40f" filter="url(#manticoreGlow)"/><circle cx="20" cy="20" r="9" fill="#e67e22"/><ellipse cx="20" cy="22" rx="7" ry="9" fill="url(#manticoreGrad)"/><circle cx="20" cy="16" r="6" fill="#c0392b"/><polygon points="16,13 14,6 18,10" fill="#f1c40f"/><polygon points="24,13 26,6 22,10" fill="#f1c40f"/><circle cx="18" cy="16" r="1.5" fill="#00d2d3"/><circle cx="22" cy="16" r="1.5" fill="#00d2d3"/></svg>`
    },
    {
        id: 'pet_basilisk',
        get name() { return getPetName('pet_basilisk'); },
        get description() { return getPetDesc('pet_basilisk'); },
        rarity: 'legendary',
        expeditionHours: 13,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><defs><radialGradient id="basiliskScale" cx="40%" cy="30%" r="70%"><stop offset="0%" stop-color="#55efc4"/><stop offset="40%" stop-color="#00b894"/><stop offset="80%" stop-color="#006266"/><stop offset="100%" stop-color="#1b1464"/></radialGradient><filter id="basiliskGlow"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M12 33 C4 33 4 23 14 23 C22 23 24 28 30 28 C36 28 37 22 34 18 C30 14 25 16 23 20" stroke="url(#basiliskScale)" stroke-width="5.5" stroke-linecap="round" fill="none"/><polygon points="12,19 14,14 16,19" fill="#f1c40f"/><polygon points="18,19 20,13 22,20" fill="#f1c40f"/><polygon points="26,16 29,11 30,17" fill="#f1c40f"/><path d="M10 34 C7 34 6 26 13 25" stroke="#ffeaa7" stroke-width="1.5" fill="none"/><ellipse cx="20" cy="15" rx="8" ry="6.5" fill="url(#basiliskScale)"/><polygon points="14,11 15,4 17,9 20,3 23,9 25,4 26,11" fill="#f1c40f" stroke="#d35400" stroke-width="0.7"/><ellipse cx="18" cy="15" rx="3" ry="3.5" fill="#f39c12" stroke="#d35400" stroke-width="0.8" filter="url(#basiliskGlow)"/><ellipse cx="18" cy="15" rx="0.8" ry="2.6" fill="#1e272e"/><path d="M26 17 L31 18 L34 16 M31 18 L34 20" stroke="#eb4d4b" stroke-width="1.2" stroke-linecap="round" fill="none"/><circle cx="34" cy="24" r="1.5" fill="#00cec9" filter="url(#basiliskGlow)"/><circle cx="8" cy="14" r="1" fill="#f1c40f" filter="url(#basiliskGlow)"/></svg>`
    },
    {
        id: 'pet_moon_cat',
        get name() { return getPetName('pet_moon_cat'); },
        get description() { return getPetDesc('pet_moon_cat'); },
        rarity: 'legendary',
        isCollectionExclusive: true,
        expeditionHours: 8,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><defs><radialGradient id="moonCatGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#a29bfe"/><stop offset="60%" stop-color="#6c5ce7"/><stop offset="100%" stop-color="#1e1035"/></radialGradient></defs><ellipse cx="20" cy="22" rx="10" ry="12" fill="url(#moonCatGrad)"/><circle cx="20" cy="12" r="7" fill="#2d134d"/><polygon points="14,10 13,3 18,7" fill="#6c5ce7"/><polygon points="26,10 27,3 22,7" fill="#6c5ce7"/><ellipse cx="17" cy="12" rx="1.5" ry="2.2" fill="#ffeaa7"/><ellipse cx="23" cy="12" rx="1.5" ry="2.2" fill="#ffeaa7"/><path d="M20 7 Q23 9 21 12" stroke="#f1c40f" stroke-width="1.2" fill="none"/></svg>`
    },
    {
        id: 'pet_astral_dragon',
        get name() { return getPetName('pet_astral_dragon'); },
        get description() { return getPetDesc('pet_astral_dragon'); },
        rarity: 'legendary',
        isCollectionExclusive: true,
        expeditionHours: 12,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><defs><radialGradient id="astralGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#9b59b6"/><stop offset="100%" stop-color="#2c3e50"/></radialGradient></defs><path d="M5 25 Q20 5 35 25 Q20 35 5 25Z" fill="url(#astralGrad)"/><circle cx="15" cy="20" r="2" fill="#00cec9"/><circle cx="25" cy="20" r="2" fill="#00cec9"/><path d="M5 25 L10 10 L15 25 Z" fill="#6c5ce7"/><path d="M35 25 L30 10 L25 25 Z" fill="#6c5ce7"/></svg>`
    },
    {
        id: 'pet_phoenix',
        get name() { return getPetName('pet_phoenix'); },
        get description() { return getPetDesc('pet_phoenix'); },
        rarity: 'legendary',
        isCollectionExclusive: true,
        expeditionHours: 12,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><defs><radialGradient id="phoenixBodyGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffeaa7"/><stop offset="60%" stop-color="#e17055"/><stop offset="100%" stop-color="#d63031"/></radialGradient></defs><path d="M20 28 Q15 38 8 36 Q18 32 20 28Z" fill="#e74c3c"/><path d="M20 28 Q25 38 32 36 Q22 32 20 28Z" fill="#e74c3c"/><path d="M20 28 Q20 40 20 40 Q20 32 20 28Z" fill="#f1c40f"/><path d="M20 18 C14 8 4 12 6 22 C10 24 16 22 20 24 Z" fill="#ff7675"/><path d="M20 18 C26 8 36 12 34 22 C30 24 24 22 20 24 Z" fill="#ff7675"/><ellipse cx="20" cy="20" rx="6" ry="9" fill="url(#phoenixBodyGrad)"/><circle cx="20" cy="11" r="5" fill="#f1c40f"/><path d="M20 6 L18 10 L22 10 Z" fill="#d63031"/><path d="M16 8 L18 11 L16 12 Z" fill="#e67e22"/><path d="M24 8 L22 11 L24 12 Z" fill="#e67e22"/><circle cx="18" cy="11" r="1.2" fill="#2d3436"/><circle cx="22" cy="11" r="1.2" fill="#2d3436"/><polygon points="19,13 21,13 20,16" fill="#d35400"/></svg>`
    },
    {
        id: 'pet_void_titan',
        get name() { return getPetName('pet_void_titan'); },
        get description() { return getPetDesc('pet_void_titan'); },
        rarity: 'legendary',
        isCollectionExclusive: true,
        expeditionHours: 16,
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><defs><radialGradient id="voidTitanGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#81ecec"/><stop offset="60%" stop-color="#6c5ce7"/><stop offset="100%" stop-color="#1e1347"/></radialGradient></defs><path d="M20 18 C12 6 3 10 5 22 C11 22 16 20 20 22 Z" fill="#6c5ce7" stroke="#81ecec" stroke-width="0.8"/><path d="M20 18 C28 6 37 10 35 22 C29 22 24 20 20 22 Z" fill="#6c5ce7" stroke="#81ecec" stroke-width="0.8"/><ellipse cx="20" cy="22" rx="7" ry="10" fill="url(#voidTitanGrad)"/><path d="M15 28 L14 36 M25 28 L26 36" stroke="#00cec9" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="12" r="6" fill="#4834d4"/><path d="M15 10 L12 4 L17 8 Z" fill="#00d2d3"/><path d="M25 10 L28 4 L23 8 Z" fill="#00d2d3"/><polygon points="18,14 22,14 20,18" fill="#ffeaa7"/><circle cx="17" cy="11" r="1.5" fill="#00ffff"/><circle cx="23" cy="11" r="1.5" fill="#00ffff"/><circle cx="20" cy="22" r="2" fill="#fff"/></svg>`
    }
];

function generateQuests(): Quest[] {
    const clickTarget    = (Math.floor(Math.random() * 2) + 2) * 100; // 200 or 300
    const upgradesTarget = Math.floor(Math.random() * 3) + 3;       // 3 to 5
    const brewTarget     = Math.floor(Math.random() * 2) + 2;       // 2 to 3
    const ordersTarget   = Math.floor(Math.random() * 2) + 2;       // 2 to 3
    const expTarget      = 2;                                       // 2 expeditions
    const adsTarget      = 2;                                       // 2 visions
    const now = Date.now();

    return [
        // Easy Quests (Dynamic Gold)
        { 
            id: 'q_click_' + now, 
            type: 'clicks', 
            difficulty: 'easy', 
            target: clickTarget, 
            current: 0, 
            rewardType: 'gold', 
            rewardAmount: 30, // 30 sec (was 150)
            isCompleted: false, 
            isClaimed: false 
        },
        { 
            id: 'q_upg_' + now, 
            type: 'buy_upgrades', 
            difficulty: 'easy', 
            target: upgradesTarget, 
            current: 0, 
            rewardType: 'gold', 
            rewardAmount: 30, // 30 sec (was 180)
            isCompleted: false, 
            isClaimed: false 
        },
        // Medium Quests (High Gold and Crystals - NO stardust)
        { 
            id: 'q_brew_' + now, 
            type: 'brew_potions', 
            difficulty: 'medium', 
            target: brewTarget, 
            current: 0, 
            rewardType: 'gold', 
            rewardAmount: 45, // 45 sec (was 300)
            isCompleted: false, 
            isClaimed: false 
        },
        { 
            id: 'q_ord_' + now, 
            type: 'complete_orders', 
            difficulty: 'medium', 
            target: ordersTarget, 
            current: 0, 
            rewardType: 'crystals', 
            rewardAmount: Math.floor(Math.random() * 2) + 2, // 2-3 crystals
            isCompleted: false, 
            isClaimed: false 
        },
        { 
            id: 'q_exp_' + now, 
            type: 'send_expeditions', 
            difficulty: 'medium', 
            target: expTarget, 
            current: 0, 
            rewardType: 'gold', 
            rewardAmount: 45, // 45 sec (was 350)
            isCompleted: false, 
            isClaimed: false 
        },
        // Hard Quest (Crystals - 5-7 crystals)
        { 
            id: 'q_ads_' + now, 
            type: 'watch_ads', 
            difficulty: 'hard', 
            target: adsTarget, 
            current: 0, 
            rewardType: 'crystals', 
            rewardAmount: Math.floor(Math.random() * 3) + 5, // 5-7 crystals
            isCompleted: false, 
            isClaimed: false 
        }
    ];
}

export const ORDER_SPAWN_INTERVAL_MS = 3 * 60 * 1000; // 3 минуты

export function createStarterOrders(): CustomerOrder[] {
    const now = Date.now();
    return [
        {
            id: 'ord_starter_1_' + now,
            name: 'Ученик Мага',
            icon: 'mage',
            orderType: 'common',
            requirements: [
                { type: 'ingredient', id: 'herb_mundane', count: 2 }
            ],
            goldSeconds: 30,
            minGold: 100,
            rewardGold: 100,
            rewardCrystals: 0,
            rewardChest: null,
            rewardStardust: 0,
            isVip: false
        },
        {
            id: 'ord_starter_2_' + now,
            name: 'Травница Элина',
            icon: 'mage',
            orderType: 'common',
            requirements: [
                { type: 'ingredient', id: 'mushroom_gray', count: 2 }
            ],
            goldSeconds: 30,
            minGold: 250,
            rewardGold: 250,
            rewardCrystals: 0,
            rewardChest: 'wooden',
            rewardStardust: 0,
            isVip: false
        }
    ];
}

export function sanitizeOrders(orders: CustomerOrder[]): CustomerOrder[] {
    if (!Array.isArray(orders) || orders.length === 0) return createStarterOrders();

    return orders.map(order => {
        if (!order) return generateSingleOrder();

        const fixedReqs: OrderRequirement[] = [];
        const rawReqs = Array.isArray(order.requirements) ? order.requirements : [];

        for (const req of rawReqs) {
            if (!req) continue;
            if (req.type === 'ingredient') {
                if (req.id === 'fire_flower' || req.id === 'herb_fire') {
                    fixedReqs.push({ ...req, id: 'herb_mundane', count: req.count || 2 });
                } else if (req.id === 'water_lily' || req.id === 'herb_water') {
                    fixedReqs.push({ ...req, id: 'mushroom_gray', count: req.count || 2 });
                } else if (AVAILABLE_INGREDIENTS.some(i => i.id === req.id)) {
                    fixedReqs.push(req);
                } else {
                    fixedReqs.push({ type: 'ingredient', id: 'herb_mundane', count: req.count || 2 });
                }
            } else if (req.type === 'potion') {
                if (AVAILABLE_POTIONS.some(p => p.id === req.id)) {
                    fixedReqs.push(req);
                } else {
                    const fallbackPot = AVAILABLE_POTIONS[0]?.id || 'heal_small';
                    fixedReqs.push({ type: 'potion', id: fallbackPot, count: req.count || 1 });
                }
            }
        }

        if (fixedReqs.length === 0) {
            fixedReqs.push({ type: 'ingredient', id: 'herb_mundane', count: 2 });
        }

        return {
            ...order,
            requirements: fixedReqs
        };
    });
}

const defaultState: GameState = {
    gold: 10,
    lastSaveTime: Date.now(),
    stardust: 0,
    artifacts: [],
    upgrades: defaultUpgrades,
    secretUpgrades: defaultSecretUpgrades,
    lastQuestDate: new Date().toISOString().split('T')[0],
    quests: generateQuests(),
    dailyBonusClaimed: false,
    unlockedPets: ['pet_rat'],
    activeExpeditions: [],
    activeOrders: createStarterOrders(),
    lastOrderSpawnTime: Date.now(),
    activeBuffs: [],
    unlockedCollections: [],
    lastFreeChestTime: 0,
    lastDragonGiftTime: 0,
    lastFreeTimeSkipTime: 0,
    vipExpiresAt: 0,
    vipLastDailyClaimDate: '',
    chestResonanceProgress: 0,
    cauldronOverheatUntil: 0,
    recipeAdHintsUsed: {},
    alchemyBrewsCount: 0,
    totalStardustEarned: 0,
    petLevels: { 'pet_rat': 1 },
    activeCompanionId: 'pet_rat',
    showFamiliarOnMain: true,
    viewedGuides: [],
    potionMastery: {},
    potionMasteryXp: {},
    calendarDay: 1,
    calendarLastClaimDate: '',
    calendarSeason: 1,
    hasCreatedShortcut: false,
    artifactOvercharge: {},
    hasRelicEternityEye: false,
    hasNoAds: false,
    hasBoughtStarterPack: false,
    luckyWheel: {
        lastFreeSpinTimestamp: 0,
        adSpinsCount: 0,
        lastAdSpinTimestamp: 0,
        adSpinsDate: '',
        pityProgress: 0,
        totalSpins: 0
    },
    achievements: {},
    totalGoldEarned: 10,
    rebirthCount: 0,
    ordersCompletedCount: 0
};

// --- Premium stores ---
export const crystals = writable<number>(0);
export const vipExpiresAt = writable<number>(0);
export const vipLastDailyClaimDate = writable<string>('');

export const vipDaysLeft = derived(vipExpiresAt, $exp => {
    if (!$exp || $exp <= Date.now()) return 0;
    return Math.ceil(($exp - Date.now()) / (24 * 60 * 60 * 1000));
});

export const vipHoursLeft = derived(vipExpiresAt, $exp => {
    if (!$exp || $exp <= Date.now()) return 0;
    return Math.ceil(($exp - Date.now()) / (60 * 60 * 1000));
});

const _isVipDerived = derived(vipExpiresAt, $exp => ($exp || 0) > Date.now());

export const isVip = {
    subscribe: _isVipDerived.subscribe,
    set: (val: boolean) => {
        if (val) {
            activateVip30Days();
        } else {
            vipExpiresAt.set(0);
        }
    },
    update: (fn: (current: boolean) => boolean) => {
        const current = get(_isVipDerived);
        const next = fn(current);
        if (next) {
            activateVip30Days();
        } else {
            vipExpiresAt.set(0);
        }
    }
};

export const isVipDailyRewardAvailable = derived([_isVipDerived, vipLastDailyClaimDate], ([$isVip, $lastClaim]) => {
    if (!$isVip) return false;
    const today = new Date().toISOString().split('T')[0];
    return $lastClaim !== today;
});

export function activateVip30Days(): void {
    activateVipDays(30, 50);
}

export function activateVipDays(days: number, instantCrystals: number = 0): void {
    const now = Date.now();
    const currentExpiry = get(vipExpiresAt) || 0;
    const base = currentExpiry > now ? currentExpiry : now;
    const newExpiry = base + days * 24 * 60 * 60 * 1000;
    vipExpiresAt.set(newExpiry);
    if (instantCrystals > 0) {
        crystals.update(c => c + instantCrystals);
    }
}

export function applyStarterPackReward(): void {
    // 1. +150 Crystals
    crystals.update(c => c + 150);
    // 2. 3 Days of VIP
    activateVipDays(3);
    // 3. 30 Minutes of idle gold (or minimum 25,000)
    const idle = get(stableIdleIncome) || 0;
    const bonusGold = Math.max(25000, Math.round(idle * 1800));
    gameStore.addGold(bonusGold);
    // 4. Mark as purchased
    gameStore.markStarterPackBought();
}

export function claimVipDailyReward(): boolean {
    const today = new Date().toISOString().split('T')[0];
    const lastClaim = get(vipLastDailyClaimDate);
    const active = get(isVip);
    if (!active || lastClaim === today) return false;

    vipLastDailyClaimDate.set(today);
    crystals.update(c => c + 15);
    return true;
}

/**
 * Dynamic gold reward scaling with stable idle income.
 * @param secondsFactor Number of seconds of passive income to reward (default 30s).
 */
export function calculateQuestGoldReward(secondsFactor: number = 30): number {
    try {
        const factor = (typeof secondsFactor === 'number' && !isNaN(secondsFactor) && secondsFactor > 0) ? Math.min(60, secondsFactor) : 30;
        const idle = get(stableIdleIncome);
        const validIdle = (typeof idle === 'number' && !isNaN(idle) && isFinite(idle)) ? idle : 0;
        return Math.max(1000, Math.round(validIdle * factor));
    } catch {
        return 1000;
    }
}

export function generateSingleOrder(): CustomerOrder {
    const roll = Math.random();
    const reqs: OrderRequirement[] = [];
    const idle = get(stableIdleIncome) || 0;

    if (roll < 0.20) {
        // 1. Королевский VIP-заказ (20% шанс, за просмотр рекламы)
        const isPotion = Math.random() < 0.6 && AVAILABLE_POTIONS.length > 0;
        let potionMasteryMult = 1;
        if (isPotion) {
            const pot = AVAILABLE_POTIONS[Math.floor(Math.random() * AVAILABLE_POTIONS.length)];
            reqs.push({ type: 'potion', id: pot.id, count: 1 });
            const xp = get(gameStore)?.potionMasteryXp?.[pot.id] || 0;
            const masteryLvl = getPotionMasteryLevel(xp);
            potionMasteryMult = 1 + (masteryLvl * 0.05);
        } else {
            for (let i = 0; i < 3; i++) {
                const ing = AVAILABLE_INGREDIENTS[Math.floor(Math.random() * AVAILABLE_INGREDIENTS.length)];
                reqs.push({ type: 'ingredient', id: ing.id, count: Math.floor(Math.random() * 2) + 2 });
            }
        }

        const vipNames = ['Королевский Казначей', 'Архимаг Совета', 'Посланник Принцессы', 'Богатый Вельможа'];
        const goldSeconds = 120; // 2 минуты стабильного дохода
        const minGold = 25000;
        const rewardGold = Math.max(minGold, Math.round(idle * goldSeconds * potionMasteryMult));
        const rewardCrystals = Math.floor(Math.random() * 4) + 5; // 5..8 кристаллов
        const rewardChest: ChestType = Math.random() < 0.20 ? 'astral' : 'magical'; // 100% сундук!

        return {
            id: 'ord_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
            name: vipNames[Math.floor(Math.random() * vipNames.length)],
            icon: 'vip',
            orderType: 'vip',
            requirements: reqs,
            goldSeconds,
            minGold,
            rewardGold,
            rewardCrystals,
            rewardChest,
            rewardStardust: 0,
            isVip: true
        };
    } else if (roll < 0.55 && AVAILABLE_POTIONS.length > 0) {
        // 2. Алхимический заказ чародеев (35% шанс, требует готовое зелье)
        const pot = AVAILABLE_POTIONS[Math.floor(Math.random() * AVAILABLE_POTIONS.length)];
        reqs.push({ type: 'potion', id: pot.id, count: 1 });
        const xp = get(gameStore)?.potionMasteryXp?.[pot.id] || 0;
        const masteryLvl = getPotionMasteryLevel(xp);
        const potionMasteryMult = 1 + (masteryLvl * 0.05);

        const potionNames = ['Боевой Маг', 'Рыцарь Ордена', 'Странствующий Чародей', 'Ведьма Пустошей'];
        const goldSeconds = 60; // 1 минута стабильного дохода
        const minGold = 2000;
        const rewardGold = Math.max(minGold, Math.round(idle * goldSeconds * potionMasteryMult));
        const rewardCrystals = Math.floor(Math.random() * 2) + 1; // 1..2 кристалла
        // 40% шанс на сундук (из них 25% на магический, 75% на деревянный)
        const chestRoll = Math.random();
        const rewardChest: ChestType | null = chestRoll < 0.40 ? (chestRoll < 0.10 ? 'magical' : 'wooden') : null;

        return {
            id: 'ord_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
            name: potionNames[Math.floor(Math.random() * potionNames.length)],
            icon: 'mage',
            orderType: 'potion',
            requirements: reqs,
            goldSeconds,
            minGold,
            rewardGold,
            rewardCrystals,
            rewardChest,
            rewardStardust: 0,
            isVip: false
        };
    } else {
        // 3. Обычный заказ горожан (45% шанс, базовые ингредиенты)
        const countIngs = Math.random() < 0.6 ? 2 : 3;
        for (let i = 0; i < countIngs; i++) {
            const ing = AVAILABLE_INGREDIENTS[Math.floor(Math.random() * AVAILABLE_INGREDIENTS.length)];
            reqs.push({ type: 'ingredient', id: ing.id, count: Math.floor(Math.random() * 2) + 1 });
        }

        const commonNames = ['Ученик Мага', 'Травник', 'Горожанин', 'Страж Ворот'];
        const goldSeconds = 30; // 30 секунд стабильного дохода
        const minGold = 250;
        const rewardGold = Math.max(minGold, Math.round(idle * goldSeconds));
        const rewardCrystals = 0; // 0 кристаллов
        const rewardChest: ChestType | null = Math.random() < 0.15 ? 'wooden' : null; // 15% шанс на деревянный сундук

        return {
            id: 'ord_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
            name: commonNames[Math.floor(Math.random() * commonNames.length)],
            icon: 'mage',
            orderType: 'common',
            requirements: reqs,
            goldSeconds,
            minGold,
            rewardGold,
            rewardCrystals,
            rewardChest,
            rewardStardust: 0,
            isVip: false
        };
    }
}

export const MASTERY_THRESHOLDS = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55];

export function getPotionMasteryLevel(xp: number): number {
    if (!xp || xp <= 0) return 0;
    for (let i = 10; i >= 1; i--) {
        if (xp >= MASTERY_THRESHOLDS[i]) return i;
    }
    return 0;
}

export function getPotionSellGold(potionId: string): number {
    const idle = get(stableIdleIncome) || 0;
    const potion = AVAILABLE_POTIONS.find(p => p.id === potionId);
    if (!potion) return 100;
    let secs = 20;
    if (['potion_luck', 'potion_wealth', 'potion_void', 'potion_focus'].includes(potionId)) {
        secs = 20;
    } else if (['potion_chronos', 'potion_swift', 'potion_astral', 'potion_midas'].includes(potionId)) {
        secs = 35;
    } else {
        secs = 60;
    }
    const state = get(gameStore);
    const xp = state?.potionMasteryXp?.[potionId] || 0;
    const masteryLvl = getPotionMasteryLevel(xp);
    const masteryMult = 1 + (masteryLvl * 0.05);
    return Math.max(500, Math.round(idle * secs * masteryMult));
}

export function getStardustThreshold(rawDust: number): number {
    if (rawDust <= 0) return 0;
    return 1_000_000 * Math.pow(rawDust, 3);
}

export function getRawStardust(gold: number): number {
    if (!gold || gold < 1_000_000) return 0;
    return Math.floor(Math.pow(gold / 1_000_000, 1 / 3));
}

export function calculateEarnedStardust(state: GameState): number {
    if (!state || !state.gold || state.gold < 1_000_000) return 0;
    let stardustMultiplier = 1;
    if (state.unlockedCollections?.includes('titan_set')) stardustMultiplier += 0.15;
    
    // Secret Upgrade: Астральный Экстрактор (+5% stardust per level)
    const extractorLevel = state.secretUpgrades?.find(u => u.id === 'stardust_extractor')?.level || 0;
    const isBoosted = (state.secretKnowledgeBoostUntil || 0) > Date.now();
    stardustMultiplier += extractorLevel * 0.05 * (isBoosted ? 1.5 : 1);

    // Potion Mastery: Astral Elixir (+0.5% stardust per mastery level)
    const astralMastery = state.potionMastery?.['potion_astral'] || 0;
    if (astralMastery > 0) stardustMultiplier += astralMastery * 0.005;

    // Hall of Fame achievement perk: stardust_mult
    const achPerks = calculateAchievementPerks(state);
    stardustMultiplier += achPerks.stardust_mult;

    const rawStardust = getRawStardust(state.gold);
    return Math.floor(rawStardust * stardustMultiplier);
}

function updateUpgradeLevel(upgrade: Upgrade, newLevel: number): Upgrade {
    const u = { ...upgrade, level: newLevel };
    Object.defineProperty(u, 'name', {
        get() { return getUpgradeName(upgrade.id); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(u, 'description', {
        get() { return getUpgradeDesc(upgrade.id); },
        enumerable: true,
        configurable: true
    });
    return u;
}

function updateSecretUpgradeLevel(upgrade: SecretUpgrade, newLevel: number): SecretUpgrade {
    const u = { ...upgrade, level: newLevel };
    Object.defineProperty(u, 'name', {
        get() { return getSecretUpgradeName(upgrade.id); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(u, 'description', {
        get() { return getSecretUpgradeDesc(upgrade.id); },
        enumerable: true,
        configurable: true
    });
    return u;
}

function createGameStore() {
    const { subscribe, set, update } = writable<GameState>(defaultState);

    return {
        subscribe,
        set,
        update,
        addGold: (amount: number) => update(state => {
            const added = Math.max(0, amount);
            return {
                ...state,
                gold: state.gold + added,
                totalGoldEarned: (state.totalGoldEarned || state.gold || 0) + added
            };
        }),
        setLastSaveTime:(time: number)   => update(state => ({ ...state, lastSaveTime: time })),
        recordFreeChest:() => update(state => ({ ...state, lastFreeChestTime: Date.now() })),
        checkDailyQuests: () => update(state => {
            const today = new Date().toISOString().split('T')[0];
            const hasLegacy = state.quests.some(q => !q.rewardType || !q.difficulty);
            if (state.lastQuestDate !== today || hasLegacy || state.quests.length < 6) {
                return { ...state, lastQuestDate: today, quests: generateQuests(), dailyBonusClaimed: false };
            }
            return state;
        }),
        updateQuestProgress: (type: QuestType, amount: number) => update(state => {
            let changed = false;
            const newQuests = state.quests.map(q => {
                if (q.type === type && !q.isCompleted) {
                    changed = true;
                    const nextCurrent = q.current + amount;
                    const isCompleted = nextCurrent >= q.target;
                    return { ...q, current: isCompleted ? q.target : nextCurrent, isCompleted };
                }
                return q;
            });
            return changed ? { ...state, quests: newQuests } : state;
        }),
        claimQuest: (id: string) => update(state => {
            const quest = state.quests.find(q => q.id === id);
            if (quest && quest.isCompleted && !quest.isClaimed) {
                let nextGold = state.gold;

                if (quest.rewardType === 'gold') {
                    nextGold += calculateQuestGoldReward(quest.rewardAmount || 30);
                } else if (quest.rewardType === 'crystals') {
                    crystals.update(c => c + (quest.rewardAmount || 5));
                } else {
                    // Fallback for legacy quests
                    nextGold += calculateQuestGoldReward(45);
                }

                return {
                    ...state,
                    gold: nextGold,
                    quests: state.quests.map(q => q.id === id ? { ...q, isClaimed: true } : q)
                };
            }
            return state;
        }),
        claimDailyBonus: () => update(state => {
            const allClaimed = state.quests.length >= 5 && state.quests.every(q => q.isClaimed);
            if (allClaimed && !state.dailyBonusClaimed) {
                crystals.update(c => c + 15);
                openChest('magical');
                return {
                    ...state,
                    dailyBonusClaimed: true
                };
            }
            return state;
        }),
        performRebirth: () => update(state => {
            const earnedStardust = calculateEarnedStardust(state);
            
            // Secret Upgrade: Наследие Архимага (сохраняет до 0.5% золота за уровень, кап 50 000 * ур.)
            const heritageLevel = state.secretUpgrades?.find(u => u.id === 'archmage_heritage' || (u.id as string) === 'wallet')?.level || 0;
            const isBoosted = (state.secretKnowledgeBoostUntil || 0) > Date.now();
            const boostMult = isBoosted ? 1.5 : 1;

            let startingGold = 10;
            if (heritageLevel > 0) {
                const maxCap = Math.floor(heritageLevel * 50_000 * boostMult);
                const preservedGold = Math.floor((state.gold || 0) * 0.005 * heritageLevel * boostMult);
                startingGold = Math.max(10, Math.min(maxCap, preservedGold));
            }
            // Artifact 11 (Перо Возрождения): сохраняет 10% золота после ритуала (с мягким капом до 2 часов стабильного дохода)
            if (state.artifacts?.includes(11)) {
                const idleSec = get(stableIdleIncome) || 0;
                const maxPreserved = Math.max(100_000, Math.round(idleSec * 7200));
                startingGold += Math.min(Math.floor((state.gold || 0) * 0.10), maxPreserved);
            }

            const newTotalStardustEarned = (state.totalStardustEarned || 0) + earnedStardust;
            // Leaderboard submission and review prompt:
            import('./yandex-sdk').then(sdk => {
                sdk.submitLeaderboardScore(newTotalStardustEarned);
                sdk.canRequestReview().then(can => {
                    if (can) sdk.requestGameReview();
                }).catch(() => {});
            }).catch(() => {});

            // Сброс сваренных зелий согласно правилам Ритуала
            potionsCount.set({});

            return {
                ...state,
                gold: startingGold,
                upgrades: state.upgrades.map(u => updateUpgradeLevel(u, 0)),
                // Тайные знания не сбрасываются!
                stardust: state.stardust + earnedStardust,
                totalStardustEarned: newTotalStardustEarned,
                rebirthCount: (state.rebirthCount || 0) + 1,
                // Сброс квестов и заказов после ритуала
                quests: generateQuests(),
                dailyBonusClaimed: false,
                activeOrders: createStarterOrders(),
                lastOrderSpawnTime: Date.now()
            };
        }),
        buyArtifact: (artifactId: number, cost: number) => {
            update(state => {
                if (state.stardust >= cost && !state.artifacts.includes(artifactId)) {
                    const newState = {
                        ...state,
                        stardust: state.stardust - cost,
                        artifacts: [...state.artifacts, artifactId]
                    };
                    
                    // Check collections
                    AVAILABLE_COLLECTIONS.forEach(col => {
                        if (!newState.unlockedCollections.includes(col.id)) {
                            const hasAll = col.requiredArtifactIds.every(id => newState.artifacts.includes(id));
                            if (hasAll) {
                                newState.unlockedCollections = [...newState.unlockedCollections, col.id];
                                if (!newState.unlockedPets.includes(col.rewardPetId)) {
                                    newState.unlockedPets = [...newState.unlockedPets, col.rewardPetId];
                                }
                            }
                        }
                    });
                    
                    return newState;
                }
                return state;
            });
        },
        overchargeArtifact: (artifactId: number) => {
            update(state => {
                if (!state.artifacts.includes(artifactId)) return state;
                const currentStars = state.artifactOvercharge?.[artifactId] || 0;
                if (currentStars >= 5) return state;
                const cost = getArtifactOverchargeCost(artifactId, currentStars);
                if (state.stardust < cost) return state;

                const nextOvercharge = { ...(state.artifactOvercharge || {}) };
                nextOvercharge[artifactId] = currentStars + 1;

                return {
                    ...state,
                    stardust: state.stardust - cost,
                    artifactOvercharge: nextOvercharge
                };
            });
        },
        buyUpgrade: (id: string) => update(state => {
            const upgradeIndex = state.upgrades.findIndex(u => u.id === id);
            if (upgradeIndex !== -1) {
                const upgrade = state.upgrades[upgradeIndex];
                const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
                if (state.gold >= cost) {
                    const newUpgrades = [...state.upgrades];
                    newUpgrades[upgradeIndex] = updateUpgradeLevel(upgrade, upgrade.level + 1);
                    return { ...state, gold: state.gold - cost, upgrades: newUpgrades };
                }
            }
            return state;
        }),
        buyUpgradeBulk: (id: string, count: number, totalCost: number) => update(state => {
            const upgradeIndex = state.upgrades.findIndex(u => u.id === id);
            if (upgradeIndex !== -1 && count > 0 && state.gold >= totalCost) {
                const upgrade = state.upgrades[upgradeIndex];
                const newUpgrades = [...state.upgrades];
                newUpgrades[upgradeIndex] = updateUpgradeLevel(upgrade, upgrade.level + count);
                return { ...state, gold: state.gold - totalCost, upgrades: newUpgrades };
            }
            return state;
        }),
        buySecretUpgrade: (id: string) => {
            update(state => {
                const upgradeIndex = state.secretUpgrades.findIndex(u => u.id === id);
                if (upgradeIndex !== -1) {
                    const upgrade = state.secretUpgrades[upgradeIndex];
                    if (upgrade.level >= upgrade.maxLevel) return state; // Максимальный уровень
                    const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
                    if (state.stardust >= cost) {
                        const newUpgrades = [...state.secretUpgrades];
                        newUpgrades[upgradeIndex] = updateSecretUpgradeLevel(upgrade, upgrade.level + 1);
                        return { ...state, stardust: state.stardust - cost, secretUpgrades: newUpgrades };
                    }
                }
                return state;
            });
        },
        activateSecretKnowledgeBoost: (durationMs: number = 30 * 60 * 1000) => update(state => ({
            ...state,
            secretKnowledgeBoostUntil: Date.now() + durationMs
        })),
        unlockPet: (petId: string) => update(state => {
            if (!state.unlockedPets.includes(petId)) {
                return { 
                    ...state, 
                    unlockedPets: [...state.unlockedPets, petId],
                    petLevels: {
                        ...(state.petLevels || {}),
                        [petId]: 1
                    }
                };
            }
            return state;
        }),
        upgradePet: (petId: string) => update(state => {
            const currentLevels = state.petLevels || {};
            const currentLvl = currentLevels[petId] || 1;
            const nextLvl = Math.min(10, currentLvl + 1);
            return {
                ...state,
                petLevels: {
                    ...currentLevels,
                    [petId]: nextLvl
                }
            };
        }),
        startExpedition: (petId: string, durationHours: number) => update(state => {
            if (state.activeExpeditions.some(e => e.petId === petId)) return state;

            const newQuests = state.quests.map(q => {
                if (q.type === 'send_expeditions' && !q.isCompleted) {
                    const nextCurrent = q.current + 1;
                    const isCompleted = nextCurrent >= q.target;
                    return { ...q, current: isCompleted ? q.target : nextCurrent, isCompleted };
                }
                return q;
            });

            let effectiveHours = durationHours;
            // Pet level bonus: -4% duration per level above 1 (capped at level 10: -36%)
            const petLevel = (state.petLevels && state.petLevels[petId]) || 1;
            if (petLevel > 1) {
                effectiveHours *= Math.max(0.5, 1 - (petLevel - 1) * 0.04);
            }
            // Artifact 12 (Хронометр Вечности): -20% к времени экспедиций
            if (state.artifacts?.includes(12)) {
                effectiveHours *= 0.8;
            }
            // Secret Upgrade: Тропы Экспедиций (-6% времени за уровень)
            const scoutLevel = state.secretUpgrades.find(u => u.id === 'scout_whisper')?.level || 0;
            const isBoosted = (state.secretKnowledgeBoostUntil || 0) > Date.now();
            if (scoutLevel > 0) {
                effectiveHours *= Math.max(0.4, 1 - (scoutLevel * 0.06 * (isBoosted ? 1.5 : 1)));
            }

            return {
                ...state,
                quests: newQuests,
                activeExpeditions: [
                    ...state.activeExpeditions,
                    { petId, startTime: Date.now(), durationMs: effectiveHours * 3600 * 1000 }
                ]
            };
        }),
        speedUpExpedition: (petId: string, hoursToReduce: number) => update(state => {
            return {
                ...state,
                activeExpeditions: state.activeExpeditions.map(e => 
                    e.petId === petId ? { ...e, startTime: e.startTime - hoursToReduce * 3600 * 1000 } : e
                )
            };
        }),
        completeExpeditionInstantly: (petId: string) => update(state => {
            return {
                ...state,
                activeExpeditions: state.activeExpeditions.map(e => 
                    e.petId === petId ? { ...e, startTime: Date.now() - e.durationMs - 1000 } : e
                )
            };
        }),
        claimExpedition: (petId: string) => update(state => {
            return {
                ...state,
                activeExpeditions: state.activeExpeditions.filter(e => e.petId !== petId)
            };
        }),
        spawnOrder: () => update(state => {
            if (state.activeOrders.length >= 4) return state; // Max 4 orders
            const newOrder = generateSingleOrder();
            return {
                ...state,
                activeOrders: sanitizeOrders([...state.activeOrders, newOrder]),
                lastOrderSpawnTime: Date.now()
            };
        }),
        checkOrderSpawns: () => update(state => {
            const now = Date.now();
            const orders = sanitizeOrders(state.activeOrders || []);

            if (orders.length >= 4) {
                return {
                    ...state,
                    activeOrders: orders
                };
            }

            const lastSpawn = state.lastOrderSpawnTime || now;
            const elapsed = now - lastSpawn;

            if (elapsed >= ORDER_SPAWN_INTERVAL_MS) {
                const countToSpawn = Math.min(4 - orders.length, Math.floor(elapsed / ORDER_SPAWN_INTERVAL_MS));
                if (countToSpawn > 0) {
                    const newOrders: CustomerOrder[] = [];
                    for (let i = 0; i < countToSpawn; i++) {
                        newOrders.push(generateSingleOrder());
                    }
                    const newLastSpawn = lastSpawn + (countToSpawn * ORDER_SPAWN_INTERVAL_MS);
                    return {
                        ...state,
                        activeOrders: sanitizeOrders([...orders, ...newOrders]),
                        lastOrderSpawnTime: newLastSpawn
                    };
                }
            }

            return {
                ...state,
                activeOrders: orders
            };
        }),
        completeOrder: (orderId: string) => update(state => {
            const order = state.activeOrders.find(o => o.id === orderId);
            if (!order) return state;

            // Динамический пересчёт золота по стабильному доходу лавки (без учета временных зелий)
            const idle = get(stableIdleIncome) || 0;
            const goldSecs = order.goldSeconds
                ? Math.min(order.goldSeconds, order.isVip ? 120 : (order.requirements.some(r => r.type === 'potion') ? 60 : 30))
                : (order.isVip ? 120 : (order.requirements.some(r => r.type === 'potion') ? 60 : 30));
            const minFloor = order.minGold
                ? Math.min(order.minGold, order.isVip ? 25000 : (order.requirements.some(r => r.type === 'potion') ? 2000 : 250))
                : (order.isVip ? 25000 : (order.requirements.some(r => r.type === 'potion') ? 2000 : 250));

            // Бонус мастерства зелья к базовой стоимости заказа (+5% за ранг)
            const potionReq = order.requirements.find(r => r.type === 'potion');
            let potionMasteryMult = 1;
            if (potionReq) {
                const xp = state.potionMasteryXp?.[potionReq.id] || 0;
                const masteryLvl = getPotionMasteryLevel(xp);
                potionMasteryMult = 1 + (masteryLvl * 0.05);
            }

            const baseGold = Math.max(minFloor, Math.round(idle * goldSecs * potionMasteryMult));

            // Secret Upgrade: Королевские Контракты (+15% gold per level)
            const ordersLevel = state.secretUpgrades.find(u => u.id === 'orders')?.level || 0;
            const isBoosted = (state.secretKnowledgeBoostUntil || 0) > Date.now();
            const boostMult = isBoosted ? 1.5 : 1;
            let goldMultiplier = 1 + (ordersLevel * 0.15 * boostMult);
            // Artifact 8 (Жемчужина Феникса): +40% золота за заказы
            if (state.artifacts?.includes(8)) goldMultiplier += 0.40;
            // Phoenix Set Grand Bonus: +30% золота за заказы
            if (state.unlockedCollections?.includes('phoenix_set')) goldMultiplier += 0.30;
            // Potion Mastery: Эликсир Бездны (+1.5% золота за заказы за уровень мастерства)
            const voidMastery = state.potionMastery?.['potion_void'] || 0;
            if (voidMastery > 0) {
                goldMultiplier += voidMastery * 0.015;
            }
            // Active Companion Bonus: order gold boost
            if (state.activeCompanionId) {
                const compLvl = state.petLevels?.[state.activeCompanionId] || 1;
                const compBonus = getPetBonusValues(state.activeCompanionId, compLvl);
                if (compBonus.orderBonus > 0) {
                    goldMultiplier += compBonus.orderBonus;
                }
            }

            // Hall of Fame achievement perk: orders_gold
            const achPerks = calculateAchievementPerks(state);
            if (achPerks.orders_gold > 0) {
                goldMultiplier += achPerks.orders_gold;
            }

            const finalGold = Math.floor(baseGold * goldMultiplier);

            const newQuests = state.quests.map(q => {
                if (q.type === 'complete_orders' && !q.isCompleted) {
                    const nextCurrent = q.current + 1;
                    const isCompleted = nextCurrent >= q.target;
                    return { ...q, current: isCompleted ? q.target : nextCurrent, isCompleted };
                }
                return q;
            });

            const remainingOrders = state.activeOrders.filter(o => o.id !== orderId);
            const now = Date.now();
            let lastSpawn = state.lastOrderSpawnTime;
            // Если лавка была полна (4/4) или таймер не был установлен, или все заказы сданы и интервал уже прошел — запускаем новый 3-минутный отсчет от текущего момента
            if (!lastSpawn || state.activeOrders.length >= 4 || (remainingOrders.length === 0 && (now - lastSpawn >= ORDER_SPAWN_INTERVAL_MS))) {
                lastSpawn = now;
            }

            let totalOrderCrystals = order.rewardCrystals || 0;

            // Secret Upgrade: Трансмутация Кристаллов (8% шанс за уровень получить 1–2 кристалла за заказ)
            // Moon Witch Set Grand Bonus: +25% шанс кристаллов за заказы
            const transmuteLevel = state.secretUpgrades.find(u => u.id === 'crystal_transmute' || (u.id as string) === 'magnet')?.level || 0;
            let transmuteChance = transmuteLevel > 0 ? Math.min(0.75, transmuteLevel * 0.08 * boostMult) : 0;
            if (state.unlockedCollections?.includes('moon_witch_set')) {
                transmuteChance += 0.25;
            }
            if (transmuteChance > 0 && Math.random() < transmuteChance) {
                totalOrderCrystals += (Math.random() < 0.25 ? 2 : 1);
            }

            if (totalOrderCrystals > 0) {
                crystals.update(c => c + totalOrderCrystals);
            }

            // Награда за ларец, если он выпал в заказе
            if (order.rewardChest) {
                openChest(order.rewardChest);
            }

            return {
                ...state,
                gold: state.gold + finalGold,
                totalGoldEarned: (state.totalGoldEarned || state.gold || 0) + finalGold,
                ordersCompletedCount: (state.ordersCompletedCount || 0) + 1,
                quests: newQuests,
                activeOrders: remainingOrders,
                lastOrderSpawnTime: lastSpawn
            };
        }),
        dismissOrder: (orderId: string) => update(state => {
            const remainingOrders = state.activeOrders.filter(o => o.id !== orderId);
            const now = Date.now();
            let lastSpawn = state.lastOrderSpawnTime;
            if (!lastSpawn || state.activeOrders.length >= 4 || (remainingOrders.length === 0 && (now - lastSpawn >= ORDER_SPAWN_INTERVAL_MS))) {
                lastSpawn = now;
            }
            return {
                ...state,
                activeOrders: remainingOrders,
                lastOrderSpawnTime: lastSpawn
            };
        }),
        sellPotion: (potionId: string, count: number = 1) => update(state => {
            const counts = get(potionsCount);
            const currentCount = counts[potionId] ?? 0;
            if (currentCount <= 0) return state;
            const validCount = Math.min(currentCount, Math.max(1, count));

            potionsCount.update(c => {
                const next = { ...c };
                next[potionId] = (next[potionId] ?? 0) - validCount;
                if (next[potionId] <= 0) delete next[potionId];
                return next;
            });

            const unitGold = getPotionSellGold(potionId);
            const totalGold = unitGold * validCount;

            // Secret Upgrade: Трансмутация Кристаллов (шанс получить кристаллы за продажу зелий)
            const isBoosted = (state.secretKnowledgeBoostUntil || 0) > Date.now();
            const boostMult = isBoosted ? 1.5 : 1;
            const transmuteLevel = state.secretUpgrades.find(u => u.id === 'crystal_transmute' || (u.id as string) === 'magnet')?.level || 0;
            let transmuteChance = transmuteLevel > 0 ? Math.min(0.75, transmuteLevel * 0.08 * boostMult) : 0;
            let extraCrystals = 0;
            for (let i = 0; i < validCount; i++) {
                if (transmuteChance > 0 && Math.random() < transmuteChance) {
                    extraCrystals += 1;
                }
            }
            if (extraCrystals > 0) {
                crystals.update(c => c + extraCrystals);
            }

            return {
                ...state,
                gold: state.gold + totalGold,
                totalGoldEarned: (state.totalGoldEarned || state.gold || 0) + totalGold
            };
        }),
        usePotion: (potionId: string) => update(state => {
            const potion = AVAILABLE_POTIONS.find(p => p.id === potionId);
            if (!potion) return state;

            const counts = get(potionsCount);
            if ((counts[potionId] ?? 0) <= 0) return state;

            // Deduct potion
            potionsCount.update(c => {
                const next = { ...c };
                next[potionId] = (next[potionId] ?? 0) - 1;
                if (next[potionId] <= 0) delete next[potionId];
                return next;
            });

            // Special effect for Chronos Elixir / Swift Potion: accelerate all active expeditions!
            let updatedExpeditions = state.activeExpeditions;
            if (potionId === 'potion_chronos' && state.activeExpeditions.length > 0) {
                const reductionMs = 2 * 3600 * 1000;
                updatedExpeditions = state.activeExpeditions.map(e => ({
                    ...e,
                    startTime: e.startTime - reductionMs
                }));
            } else if (potionId === 'potion_swift' && state.activeExpeditions.length > 0) {
                const reductionMs = 1 * 3600 * 1000;
                updatedExpeditions = state.activeExpeditions.map(e => ({
                    ...e,
                    startTime: e.startTime - reductionMs
                }));
            }

            // Potion Mastery Progress (+10% duration per level)
            const nextMasteryXp = { ...(state.potionMasteryXp || {}) };
            const nextMastery = { ...(state.potionMastery || {}) };
            nextMasteryXp[potionId] = (nextMasteryXp[potionId] || 0) + 1;
            const masteryLvl = getPotionMasteryLevel(nextMasteryXp[potionId]);
            nextMastery[potionId] = masteryLvl;

            const durationMultiplier = 1 + (masteryLvl * 0.10);
            const durationMs = Math.round(potion.durationMin * durationMultiplier * 60 * 1000);

            const now = Date.now();
            const currentBuffs = state.activeBuffs || [];
            const existingIdx = currentBuffs.findIndex(b => b.potionId === potionId);
            let nextBuffs: ActiveBuff[];
            if (existingIdx >= 0) {
                const existing = currentBuffs[existingIdx];
                const baseTime = existing.expiresAt > now ? existing.expiresAt : now;
                nextBuffs = [...currentBuffs];
                nextBuffs[existingIdx] = {
                    ...existing,
                    expiresAt: baseTime + durationMs,
                    value: potion.value
                };
            } else {
                nextBuffs = [
                    ...currentBuffs,
                    {
                        potionId,
                        expiresAt: now + durationMs,
                        effect: potion.effect,
                        value: potion.value
                    }
                ];
            }

            return {
                ...state,
                activeBuffs: nextBuffs,
                activeExpeditions: updatedExpeditions,
                potionMasteryXp: nextMasteryXp,
                potionMastery: nextMastery
            };
        }),
        removeExpiredBuffs: () => update(state => {
            const now = Date.now();
            const currentBuffs = state.activeBuffs || [];
            const validBuffs = currentBuffs.filter(b => b.expiresAt > now);
            // Consolidate duplicates if any were stored in older saves
            const map = new Map<string, ActiveBuff>();
            for (const b of validBuffs) {
                const existing = map.get(b.potionId);
                if (!existing) {
                    map.set(b.potionId, { ...b });
                } else {
                    existing.expiresAt = Math.max(existing.expiresAt, b.expiresAt);
                }
            }
            const deduped = Array.from(map.values());
            if (deduped.length !== currentBuffs.length) {
                return { ...state, activeBuffs: deduped };
            }
            return state;
        }),
        claimDragonGift: () => update(state => ({ ...state, lastDragonGiftTime: Date.now() })),
        claimFreeTimeSkip: () => update(state => ({ ...state, lastFreeTimeSkipTime: Date.now() })),
        setActiveCompanion: (petId: string) => update(state => ({ ...state, activeCompanionId: petId })),
        setShowFamiliarOnMain: (show: boolean) => update(state => ({ ...state, showFamiliarOnMain: show })),
        toggleShowFamiliarOnMain: () => update(state => ({ ...state, showFamiliarOnMain: state.showFamiliarOnMain === false })),
        markStarterPackBought: () => update(state => ({ ...state, hasBoughtStarterPack: true })),
        markGuideAsViewed: (guideId: string) => update(state => {
            const existing = state.viewedGuides || [];
            if (existing.includes(guideId)) return state;
            return { ...state, viewedGuides: [...existing, guideId] };
        }),
        claimAchievement: (achievementId: AchievementId) => {
            const def = ACHIEVEMENTS.find(a => a.id === achievementId);
            if (!def) return;
            let claimed = false;
            update(state => {
                const status = getAchievementStatus(def, state);
                if (!status.canClaim) return state;

                const nextTier = status.nextTier;
                const nextTierNum = status.claimedTier + 1;
                const newAchievements = { ...(state.achievements || {}) };
                newAchievements[achievementId] = nextTierNum;

                crystals.update(c => c + nextTier.crystalsReward);
                claimed = true;

                return {
                    ...state,
                    stardust: state.stardust + nextTier.stardustReward,
                    achievements: newAchievements
                };
            });
            if (claimed) {
                import('./audio').then(a => a.playAchievementSound()).catch(() => {});
                import('./yandex-sdk').then(sdk => sdk.saveGame()).catch(() => {});
            }
        },
        claimAllAchievements: () => {
            let totalCrystals = 0;
            let totalStardust = 0;
            let anyClaimed = false;

            update(state => {
                const newAchievements = { ...(state.achievements || {}) };

                ACHIEVEMENTS.forEach(def => {
                    let currentTier = newAchievements[def.id] || 0;
                    const currentProg = getAchievementCurrentProgress(def.id, state);

                    while (currentTier < def.tiers.length) {
                        const target = def.tiers[currentTier].target;
                        if (currentProg >= target) {
                            totalCrystals += def.tiers[currentTier].crystalsReward;
                            totalStardust += def.tiers[currentTier].stardustReward;
                            currentTier++;
                            anyClaimed = true;
                        } else {
                            break;
                        }
                    }
                    newAchievements[def.id] = currentTier;
                });

                if (!anyClaimed) return state;

                if (totalCrystals > 0) {
                    crystals.update(c => c + totalCrystals);
                }

                return {
                    ...state,
                    stardust: state.stardust + totalStardust,
                    achievements: newAchievements
                };
            });

            if (anyClaimed) {
                import('./audio').then(a => a.playAchievementSound()).catch(() => {});
                import('./yandex-sdk').then(sdk => sdk.saveGame()).catch(() => {});
            }
        }
    };
}

export const gameStore = createGameStore();

export const unclaimedAchievementsCount = derived(gameStore, $state => {
    if (!$state) return 0;
    let count = 0;
    ACHIEVEMENTS.forEach(def => {
        const status = getAchievementStatus(def, $state);
        if (status.canClaim) {
            count++;
        }
    });
    return count;
});

// --- Active Guide Modal Store & Handlers ---
export const activeGuideModalId = writable<string | null>(null);

export function openGuide(guideId: string): void {
    activeGuideModalId.set(guideId);
    gameStore.markGuideAsViewed(guideId);
}

export function closeGuide(): void {
    activeGuideModalId.set(null);
}

// ============================================================
// DERIVED STORES
// ============================================================

export const totalUpgradeLevels = derived(gameStore, $gameStore => {
    return $gameStore.upgrades.reduce((sum, u) => sum + u.level, 0);
});

export const RANK_THRESHOLDS: number[] = [
    0,     // Rank 1 (Tier 0): Apprentice
    25,    // Rank 2 (Tier 1): Novice (+25)
    60,    // Rank 3 (Tier 2): Adept (+35)
    110,   // Rank 4 (Tier 3): Practitioner (+50)
    175,   // Rank 5 (Tier 4): Alchemist (+65)
    255,   // Rank 6 (Tier 5): Master (+80)
    350,   // Rank 7 (Tier 6): Senior Master (+95)
    465,   // Rank 8 (Tier 7): Magister (+115)
    600,   // Rank 9 (Tier 8): High Magister (+135)
    760,   // Rank 10 (Tier 9): Lorekeeper (+160)
    950,   // Rank 11 (Tier 10): Archmage (+190)
    1175,  // Rank 12 (Tier 11): Ether Sorcerer (+225)
    1435,  // Rank 13 (Tier 12): Rune Lord (+260)
    1735,  // Rank 14 (Tier 13): Astral Sage (+300)
    2080,  // Rank 15 (Tier 14): Titan of Alchemy (+345)
    2480,  // Rank 16 (Tier 15): World Shaper (+400)
    2940,  // Rank 17 (Tier 16): Demiurge (+460)
    3460,  // Rank 18 (Tier 17): Eternal Alchemist (+520)
    4050,  // Rank 19 (Tier 18): Elemental Sovereign (+590)
    4715,  // Rank 20 (Tier 19): Absolute Magus (+665)
    5460,  // Rank 21 (Tier 20): Living Legend (+745)
    6300,  // Rank 22 (Tier 21): Ether Sovereign (+840)
    7240,  // Rank 23 (Tier 22): Sphere Architect (+940)
    8280,  // Rank 24 (Tier 23): Time Warden (+1040)
    9420,  // Rank 25 (Tier 24): Astral Emperor (+1140)
    10660, // Rank 26 (Tier 25): Rune Overlord (+1240)
    12000, // Rank 27 (Tier 26): Void Demiurge (+1340)
    13440, // Rank 28 (Tier 27): Reality Forger (+1440)
    14980, // Rank 29 (Tier 28): Eternal Alchemist (+1540)
    16620, // Rank 30 (Tier 29): Cosmic Sovereign (+1640)
    18360, // Rank 31 (Tier 30): God of Alchemy (+1740)
    20200, // Rank 32 (Tier 31): Timeless One (+1840)
    22140, // Rank 33 (Tier 32): Font of Magic (+1940)
    24180, // Rank 34 (Tier 33): Primal Mind (+2040)
    26320  // Rank 35 (Tier 34): The Absolute (+2140)
];

export function getRankTier(totalLevels: number): number {
    if (totalLevels <= 0) return 0;
    const maxKnown = RANK_THRESHOLDS.length - 1;
    const maxThreshold = RANK_THRESHOLDS[maxKnown];
    if (totalLevels >= maxThreshold) {
        return maxKnown + Math.floor((totalLevels - maxThreshold) / 800);
    }
    for (let i = maxKnown; i >= 0; i--) {
        if (totalLevels >= RANK_THRESHOLDS[i]) {
            return i;
        }
    }
    return 0;
}

export function getRankThreshold(tier: number): number {
    if (tier <= 0) return 0;
    const maxKnown = RANK_THRESHOLDS.length - 1;
    if (tier <= maxKnown) {
        return RANK_THRESHOLDS[tier];
    }
    return RANK_THRESHOLDS[maxKnown] + (tier - maxKnown) * 800;
}

export const milestoneInfo = derived(totalUpgradeLevels, $totalLevels => {
    const total = Math.max(0, $totalLevels || 0);
    const tier = getRankTier(total);
    const currentFloor = getRankThreshold(tier);
    const nextTarget = getRankThreshold(tier + 1);
    const stepTarget = Math.max(1, nextTarget - currentFloor);
    const progress = Math.max(0, total - currentFloor);
    // Option A: Additive +10% per tier to smoothly enhance without exponential inflation
    const multiplier = Number((1 + tier * 0.10).toFixed(2));
    const percent = Math.min(100, Math.max(0, (progress / stepTarget) * 100));

    return {
        tier,
        rankLevel: tier + 1,
        multiplier,
        progress,
        stepTarget,
        nextTarget,
        currentFloor,
        percent,
        totalLevels: total
    };
});

export const heatBonusLevel = derived(gameStore, $gameStore => {
    return $gameStore.upgrades.find(u => u.id === 'click_heat')?.level || 0;
});

export const activeCompanionBonus = derived(gameStore, $gameStore => {
    if (!$gameStore?.activeCompanionId) return null;
    const lvl = $gameStore.petLevels?.[$gameStore.activeCompanionId] || 1;
    return {
        petId: $gameStore.activeCompanionId,
        level: lvl,
        bonuses: getPetBonusValues($gameStore.activeCompanionId, lvl)
    };
});

export const stableIdleMultiplier = derived([gameStore, isVip, milestoneInfo], ([$gameStore, $isVip, $milestone]) => {
    let multiplier = 1 * ($milestone?.multiplier || 1);
    const arts = $gameStore?.artifacts || [];
    const colls = $gameStore?.unlockedCollections || [];
    const overcharges = $gameStore?.artifactOvercharge || {};
    const getArtBonus = (id: number, base: number) => {
        if (!arts.includes(id)) return 0;
        const star = overcharges[id] || 0;
        return base * (1 + star * 0.20);
    };
    
    // Original artifacts
    multiplier += getArtBonus(0, 0.20); // Scroll of Greed
    // Archmage set artifacts
    multiplier += getArtBonus(3, 0.35); // Archmage Robe
    multiplier += getArtBonus(6, 0.35); // Archmage Ring
    multiplier += getArtBonus(7, 1.00); // Archmage Eye
    // Phoenix set artifacts
    multiplier += getArtBonus(10, 1.20); // Chalice of Eternal Flame
    // Titan set artifacts
    multiplier += getArtBonus(13, 2.00); // Tablet of Creation
    multiplier += getArtBonus(15, 3.00); // Titan's Core
    
    // Set Completion Bonuses
    if (colls.includes('archmage_set')) multiplier += 1.50;
    if (colls.includes('moon_witch_set')) multiplier += 1.00;
    if (colls.includes('phoenix_set')) multiplier += 2.50;
    if (colls.includes('titan_set')) multiplier += 4.00;
    
    // VIP Bonus: +50% passive income
    if ($isVip) multiplier += 0.50;

    // Active Companion Bonus (Idle Income Aura)
    if ($gameStore?.activeCompanionId) {
        const compLvl = $gameStore.petLevels?.[$gameStore.activeCompanionId] || 1;
        const compBonus = getPetBonusValues($gameStore.activeCompanionId, compLvl);
        if (compBonus.idleBonus > 0) multiplier += compBonus.idleBonus;
    }

    // Potion Mastery Idle Boosts
    const mastery = $gameStore?.potionMastery || {};
    const wealthLvl = mastery['potion_wealth'] || 0;
    if (wealthLvl > 0) multiplier += wealthLvl * 0.01;
    const midasLvl = mastery['potion_midas'] || 0;
    if (midasLvl > 0) multiplier += midasLvl * 0.02;
    const harmonyLvl = mastery['potion_harmony'] || 0;
    if (harmonyLvl > 0) multiplier += harmonyLvl * 0.015;
    const miracleLvl = mastery['potion_miracle'] || 0;
    if (miracleLvl > 0) multiplier += miracleLvl * 0.03;

    // Secret Upgrade: Астральный Резонанс (+0.5% passive income per level, unlimited)
    const secUpgs = $gameStore?.secretUpgrades || [];
    const astralLvl = secUpgs.find(u => u.id === 'astral_resonance')?.level || 0;
    if (astralLvl > 0) multiplier += astralLvl * 0.005;

    // Legendary Relic: Око Вечности (+50% passive income)
    if ($gameStore?.hasRelicEternityEye) multiplier += 0.50;
    
    // Apply stardust prestige multiplier (+1% per stardust)
    multiplier += ($gameStore?.stardust || 0) * 0.01;

    // Hall of Fame achievement perk: gold_mult
    const achPerks = calculateAchievementPerks($gameStore);
    multiplier += achPerks.gold_mult;
    
    return Math.max(1, multiplier);
});

export const globalIdleMultiplier = derived([stableIdleMultiplier, gameStore], ([$stableMult, $gameStore]) => {
    let totalMultiplier = (typeof $stableMult === 'number' && !isNaN($stableMult)) ? $stableMult : 1;
    const buffs = $gameStore?.activeBuffs || [];

    // Apply active buffs
    for (const buff of buffs) {
        if (buff.effect === 'idle_multiplier') totalMultiplier += buff.value;
        if (buff.effect === 'gold_multiplier') totalMultiplier += buff.value;
    }

    return Math.max(1, totalMultiplier);
});

export const stableIdleIncome = derived([gameStore, stableIdleMultiplier], ([$gameStore, $stableMult]) => {
    let totalIdle = 0;
    const upgs = $gameStore?.upgrades || [];
    const secUpgs = $gameStore?.secretUpgrades || [];

    upgs.forEach(u => {
        if (u.type === 'idle') totalIdle += (u.baseValue || 0) * (u.level || 0);
    });

    // Secret Upgrade: Аура Фамильяра (+15% passive income per level)
    const familiarLevel = secUpgs.find(u => u.id === 'familiar')?.level || 0;
    const familiarMultiplier = 1 + (familiarLevel * 0.15);
    const mult = (typeof $stableMult === 'number' && !isNaN($stableMult)) ? $stableMult : 1;

    return Math.max(0, totalIdle * mult * familiarMultiplier);
});

export const globalClickMultiplier = derived([gameStore, isVip, milestoneInfo], ([$gameStore, $isVip, $milestone]) => {
    let multiplier = 1 * ($milestone?.multiplier || 1);
    const arts = $gameStore?.artifacts || [];
    const colls = $gameStore?.unlockedCollections || [];
    const buffs = $gameStore?.activeBuffs || [];
    const overcharges = $gameStore?.artifactOvercharge || {};
    const getArtBonus = (id: number, base: number) => {
        if (!arts.includes(id)) return 0;
        const star = overcharges[id] || 0;
        return base * (1 + star * 0.20);
    };
    
    // Original artifacts
    multiplier += getArtBonus(1, 0.20); // Ring of Power
    // Archmage set artifacts
    multiplier += getArtBonus(4, 0.60); // Archmage Staff
    // Phoenix set artifacts
    multiplier += getArtBonus(9, 0.80); // Volcanic Seal
    // Titan set artifacts
    multiplier += getArtBonus(14, 2.50); // Void Crown

    // Set Completion Bonuses
    if (colls.includes('archmage_set')) multiplier += 1.00;
    if (colls.includes('phoenix_set')) multiplier += 1.50;
    if (colls.includes('titan_set')) multiplier += 3.00;
    
    // VIP Bonus: +50% click power
    if ($isVip) multiplier += 0.50;

    // Active Companion Bonus (Click Power Aura)
    if ($gameStore?.activeCompanionId) {
        const compLvl = $gameStore.petLevels?.[$gameStore.activeCompanionId] || 1;
        const compBonus = getPetBonusValues($gameStore.activeCompanionId, compLvl);
        if (compBonus.clickBonus > 0) multiplier += compBonus.clickBonus;
    }

    // Potion Mastery Click Boosts
    const mastery = $gameStore?.potionMastery || {};
    const luckLvl = mastery['potion_luck'] || 0;
    if (luckLvl > 0) multiplier += luckLvl * 0.01;
    const harmonyLvl = mastery['potion_harmony'] || 0;
    if (harmonyLvl > 0) multiplier += harmonyLvl * 0.015;
    const miracleLvl = mastery['potion_miracle'] || 0;
    if (miracleLvl > 0) multiplier += miracleLvl * 0.03;

    // Legendary Relic: Око Вечности (+50% click power)
    if ($gameStore?.hasRelicEternityEye) multiplier += 0.50;

    // Apply active buffs
    for (const buff of buffs) {
        if (buff.effect === 'click_multiplier') multiplier += buff.value;
        if (buff.effect === 'gold_multiplier') multiplier += buff.value;
    }

    // Apply stardust prestige multiplier (+1% per stardust)
    multiplier += ($gameStore?.stardust || 0) * 0.01;

    // Hall of Fame achievement perks: gold_mult and click_power
    const achPerks = calculateAchievementPerks($gameStore);
    multiplier += achPerks.gold_mult + achPerks.click_power;

    return Math.max(1, multiplier);
});

// Update max offline time to account for new artifacts, hearth upgrade, companion bonus, VIP (+5 hours), and Chronos mastery
export const maxOfflineTimeHours = derived([gameStore, isVip], ([$gameStore, $isVip]) => {
    let hours = 2; // base
    const upgs = $gameStore?.upgrades || [];
    const arts = $gameStore?.artifacts || [];
    const overcharges = $gameStore?.artifactOvercharge || {};
    const getArtHours = (id: number, base: number) => {
        if (!arts.includes(id)) return 0;
        const star = overcharges[id] || 0;
        return base * (1 + star * 0.20);
    };

    const hearthUpgrade = upgs.find(u => u.id === 'idle_hearth');
    if (hearthUpgrade && hearthUpgrade.level > 0) {
        hours += hearthUpgrade.level * (10 / 60); // +10 minutes per level
    }
    if (arts.includes(2)) hours = Math.max(hours, 12 + (overcharges[2] || 0) * 1.5); // Time Amulet
    hours += getArtHours(5, 2); // Archmage Hat (+2..+4 hours)
    hours += getArtHours(11, 3); // Plume of Rebirth (+3..+6 hours)
    hours += getArtHours(12, 4); // Chronometer of Eternity (+4..+8 hours)
    if ($isVip) hours += 5; // VIP Bonus: +5 hours offline limit

    // Active Companion Bonus (e.g. Void Titan offline hours aura)
    if ($gameStore?.activeCompanionId) {
        const compLvl = $gameStore.petLevels?.[$gameStore.activeCompanionId] || 1;
        const compBonus = getPetBonusValues($gameStore.activeCompanionId, compLvl);
        if (compBonus.offlineHoursBonus > 0) hours += compBonus.offlineHoursBonus;
    }

    // Potion Mastery: Зелье Хроноса (+10 мин оффлайн лимита за уровень)
    const chronosLvl = $gameStore?.potionMastery?.['potion_chronos'] || 0;
    if (chronosLvl > 0) {
        hours += chronosLvl * (10 / 60);
    }

    return hours;
});

export const currentIdleIncome = derived([gameStore, globalIdleMultiplier], ([$gameStore, $idleMult]) => {
    let totalIdle = 0;
    const upgs = $gameStore?.upgrades || [];
    const secUpgs = $gameStore?.secretUpgrades || [];

    upgs.forEach(u => {
        if (u.type === 'idle') totalIdle += (u.baseValue || 0) * (u.level || 0);
    });

    // Secret Upgrade: Аура Фамильяра (+15% passive income per level)
    const familiarLevel = secUpgs.find(u => u.id === 'familiar')?.level || 0;
    const familiarMultiplier = 1 + (familiarLevel * 0.15);
    const mult = (typeof $idleMult === 'number' && !isNaN($idleMult)) ? $idleMult : 1;

    return Math.max(0, totalIdle * mult * familiarMultiplier);
});

export const critChance = derived(gameStore, ($gameStore) => {
    let chance = 0;
    const critUpgrade = $gameStore.upgrades.find(u => u.id === 'click_crit');
    if (critUpgrade && critUpgrade.level > 0) {
        // 3% chance per level
        chance += critUpgrade.level * 0.03;
    }
    // Active Companion Bonus (e.g. Manticore crit aura)
    if ($gameStore?.activeCompanionId) {
        const compLvl = $gameStore.petLevels?.[$gameStore.activeCompanionId] || 1;
        const compBonus = getPetBonusValues($gameStore.activeCompanionId, compLvl);
        if (compBonus.critBonus > 0) chance += compBonus.critBonus;
    }
    // Potion Mastery: Зелье Концентрации (+0.5% шанс крита за уровень)
    const focusLvl = $gameStore?.potionMastery?.['potion_focus'] || 0;
    if (focusLvl > 0) {
        chance += focusLvl * 0.005;
    }
    return Math.min(0.75, chance);
});

export const critMultiplier = derived(gameStore, ($gameStore) => {
    let mult = 5.0;
    const critDmgUpgrade = $gameStore?.upgrades?.find(u => u.id === 'mastery_crit_dmg');
    if (critDmgUpgrade && critDmgUpgrade.level > 0) {
        mult += critDmgUpgrade.level * 0.5;
    }
    // Potion Mastery: Зелье Берсерка (+0.10 множитель крита за уровень)
    const berserkLvl = $gameStore?.potionMastery?.['potion_berserk'] || 0;
    if (berserkLvl > 0) {
        mult += berserkLvl * 0.10;
    }
    return mult;
});

export const resonanceBonus = derived([gameStore, currentIdleIncome], ([$gameStore, $idleIncome]) => {
    const resUpgrade = $gameStore.upgrades.find(u => u.id === 'click_resonance');
    const flowUpgrade = $gameStore.upgrades.find(u => u.id === 'mastery_resonance_flow');
    
    const baseLvl = resUpgrade?.level || 0;
    const flowLvl = flowUpgrade?.level || 0;
    if (baseLvl <= 0 && flowLvl <= 0) return 0;

    // +0.2% per level capped at 10% from basic resonance
    const basePct = Math.min(0.10, baseLvl * 0.002);
    // +0.5% per level without hardcap from mastery resonance flow
    const flowPct = flowLvl * 0.005;

    return Math.floor($idleIncome * (basePct + flowPct));
});

export const currentClickPower = derived([gameStore, globalClickMultiplier, resonanceBonus], ([$gameStore, $clickMult, $resonanceBonus]) => {
    let totalClick = 1;
    $gameStore.upgrades.forEach(u => {
        if (u.type === 'click') totalClick += u.baseValue * u.level;
    });
    return Math.max(1, Math.floor((totalClick + $resonanceBonus) * $clickMult));
});

export const effectiveOfflineRate = derived([currentIdleIncome, currentClickPower], ([$idleIncome, $clickPower]) => {
    const idle = $idleIncome || 0;
    const click = $clickPower || 1;
    // Гибридный расчет оффлайн-дохода лавки:
    // берем максимум между чистым секундным пассивным доходом лавки
    // и активной силой клика (~1.0 клик/сек автономного тления котла в оффлайне),
    // чтобы игроки с упором в клики получали соразмерную оффлайн-награду
    return Math.max(idle, Math.round(click * 1.0));
});

export const readyOrdersCount = derived(
    [gameStore, ingredientsCount, potionsCount],
    ([$gameStore, $ingCounts, $potCounts]) => {
        let count = 0;
        for (const order of $gameStore.activeOrders) {
            let canFulfill = true;
            for (const req of order.requirements) {
                if (req.type === 'ingredient') {
                    if (($ingCounts[req.id] || 0) < req.count) { canFulfill = false; break; }
                } else {
                    if (($potCounts[req.id] || 0) < req.count) { canFulfill = false; break; }
                }
            }
            if (canFulfill) count++;
        }
        return count;
    }
);

export const unclaimedQuestsCount = derived(gameStore, $gameStore => {
    const unclaimed = $gameStore.quests.filter(q => q.isCompleted && !q.isClaimed).length;
    const bonusReady = $gameStore.quests.length >= 5 && $gameStore.quests.every(q => q.isClaimed) && !$gameStore.dailyBonusClaimed ? 1 : 0;
    return unclaimed + bonusReady;
});

export const freeChestCooldownRemaining = derived(gameStore, $state => {
    const last = $state.lastFreeChestTime || 0;
    const cooldown = 10 * 60 * 1000;
    const elapsed = Date.now() - last;
    return Math.max(0, cooldown - elapsed);
});

export const isFreeChestReady = derived(freeChestCooldownRemaining, $rem => $rem === 0);

export const finishedExpeditionsCount = derived(gameStore, $state => {
    const now = Date.now();
    return ($state.activeExpeditions || []).filter(e => now >= e.startTime + e.durationMs).length;
});

export const totalInventoryCount = derived([ingredientsCount, potionsCount], ([$ings, $pots]) => {
    const ingTotal = Object.values($ings || {}).reduce((s, v) => s + v, 0);
    const potTotal = Object.values($pots || {}).reduce((s, v) => s + v, 0);
    return ingTotal + potTotal;
});

export const archmageProgress = derived(gameStore, $state => {
    const required = [3, 4, 5, 6, 7];
    const owned = required.filter(id => ($state.artifacts || []).includes(id)).length;
    return {
        owned,
        total: required.length,
        isCompleted: owned === required.length
    };
});

export interface BulkBuyInfo {
    count: number;
    totalCost: number;
    canAfford: boolean;
}

export function calculateBulkBuy(
    upgrade: Upgrade,
    countMode: '1' | '10' | 'max',
    availableGold: number
): BulkBuyInfo {
    const r = upgrade.costMultiplier;
    const base = upgrade.baseCost;
    const level = upgrade.level;

    if (countMode === '1') {
        const cost = Math.floor(base * Math.pow(r, level));
        return {
            count: 1,
            totalCost: cost,
            canAfford: availableGold >= cost
        };
    }

    if (countMode === '10') {
        let totalCost = 0;
        for (let i = 0; i < 10; i++) {
            totalCost += Math.floor(base * Math.pow(r, level + i));
        }
        return {
            count: 10,
            totalCost,
            canAfford: availableGold >= totalCost
        };
    }

    // 'max' mode: buy as many as possible
    const singleCost = Math.floor(base * Math.pow(r, level));
    if (availableGold < singleCost) {
        return {
            count: 1,
            totalCost: singleCost,
            canAfford: false
        };
    }

    // Estimate k with geometric series
    let k = Math.floor(
        Math.log(1 + (availableGold * (r - 1)) / (base * Math.pow(r, level))) / Math.log(r)
    );
    k = Math.max(1, Math.min(k, 1000));

    // Compute exact cost for k
    let totalCost = 0;
    for (let i = 0; i < k; i++) {
        totalCost += Math.floor(base * Math.pow(r, level + i));
    }

    // Adjust if overshot due to floor differences
    while (totalCost > availableGold && k > 1) {
        totalCost -= Math.floor(base * Math.pow(r, level + k - 1));
        k--;
    }

    // Adjust if undershot and can afford one more
    while (k < 1000) {
        const nextCost = Math.floor(base * Math.pow(r, level + k));
        if (totalCost + nextCost <= availableGold) {
            totalCost += nextCost;
            k++;
        } else {
            break;
        }
    }

    return {
        count: k,
        totalCost,
        canAfford: true
    };
}

// ============================================================
// TIME-SKIP
// ============================================================

/**
 * Spends crystals to instantly earn passive income.
 * @returns gold earned, or 0 if not enough crystals.
 */
export function useTimeSkip(hours: number, crystalCost: number): number {
    const currentCrystals = get(crystals);
    if (currentCrystals < crystalCost) return 0;

    const idlePerSecond = get(currentIdleIncome);
    const goldEarned = Math.floor(idlePerSecond * hours * 3600);

    crystals.update(n => n - crystalCost);
    gameStore.addGold(goldEarned);

    return goldEarned;
}

export function useFreeTimeSkip(hours: number): number {
    const idlePerSecond = get(currentIdleIncome);
    const goldEarned = Math.floor(idlePerSecond * hours * 3600);
    gameStore.addGold(goldEarned);
    gameStore.claimFreeTimeSkip();
    return goldEarned;
}

// ============================================================
// ALCHEMY TABLE: RECIPES & BREWING
// ============================================================

export interface AlchemyRecipe {
    id: string;
    ingredients: [string, string, string]; // exactly 3 ingredient IDs
    resultPotionId: string;
    rarity: Rarity;
}

/** 3-slot alchemy table recipes (order-independent matching) */
export const RECIPES: AlchemyRecipe[] = [
    {
        id: 'recipe_luck',
        ingredients: ['herb_mundane', 'moonpetal', 'toadstone'],
        resultPotionId: 'potion_luck',
        rarity: 'common',
    },
    {
        id: 'recipe_fire',
        ingredients: ['fire_salamander', 'herb_mundane', 'mushroom_gray'],
        resultPotionId: 'potion_fire',
        rarity: 'common',
    },
    {
        id: 'recipe_wealth',
        ingredients: ['mushroom_gray', 'stardew', 'toadstone'],
        resultPotionId: 'potion_wealth',
        rarity: 'rare',
    },
    {
        id: 'recipe_focus',
        ingredients: ['fairy_breath', 'herb_mundane', 'stardew'],
        resultPotionId: 'potion_focus',
        rarity: 'rare',
    },
    {
        id: 'recipe_berserk',
        ingredients: ['fire_salamander', 'troll_blood', 'toadstone'],
        resultPotionId: 'potion_berserk',
        rarity: 'rare',
    },
    {
        id: 'recipe_giant',
        ingredients: ['troll_blood', 'mushroom_gray', 'moonpetal'],
        resultPotionId: 'potion_giant',
        rarity: 'rare',
    },
    {
        id: 'recipe_sage',
        ingredients: ['dragon_scale', 'moonpetal', 'stardew'],
        resultPotionId: 'potion_sage',
        rarity: 'epic',
    },
    {
        id: 'recipe_void',
        ingredients: ['void_essence', 'fairy_breath', 'dragon_scale'],
        resultPotionId: 'potion_void',
        rarity: 'epic',
    },
    {
        id: 'recipe_immortal',
        ingredients: ['philosophers_tear', 'dragon_scale', 'troll_blood'],
        resultPotionId: 'potion_immortal',
        rarity: 'legendary',
    },
    {
        id: 'recipe_chronos',
        ingredients: ['time_crystal', 'philosophers_tear', 'void_essence'],
        resultPotionId: 'potion_chronos',
        rarity: 'legendary',
    },
    {
        id: 'recipe_swift',
        ingredients: ['fairy_breath', 'moonpetal', 'toadstone'],
        resultPotionId: 'potion_swift',
        rarity: 'rare',
    },
    {
        id: 'recipe_midas',
        ingredients: ['fire_salamander', 'stardew', 'troll_blood'],
        resultPotionId: 'potion_midas',
        rarity: 'epic',
    },
    {
        id: 'recipe_astral',
        ingredients: ['void_essence', 'stardew', 'time_crystal'],
        resultPotionId: 'potion_astral',
        rarity: 'legendary',
    },
    {
        id: 'recipe_insight',
        ingredients: ['dragon_scale', 'philosophers_tear', 'fairy_breath'],
        resultPotionId: 'potion_insight',
        rarity: 'legendary',
    },
];

/** Crystal costs to reveal each successive hint (0→1, 1→2, 2→3) */
export const HINT_COSTS = [10, 20, 35] as const;

/**
 * unlockedRecipes: Record<recipeId, hintLevel>
 *   0 = fully locked (all ???)
 *   1 = first ingredient revealed
 *   2 = first two revealed
 *   3 = fully unlocked
 */
export const unlockedRecipes = writable<Record<string, number>>({});

/** How many consecutive wrong brews have been made (resets on success or overheat) */
export const failedBrewAttempts = writable<number>(0);

/**
 * Dynamic calculation of max failed brew attempts allowed before cauldron overheats:
 * Base: 3 attempts
 * +1 per level of Secret Upgrade 'Повелитель Котлов' (up to +2)
 * +1 if VIP status is active
 */
export function getMaxBrewAttempts(state: GameState, vipActive: boolean): number {
    const alchemyLevel = state.secretUpgrades?.find(u => u.id === 'alchemy')?.level || 0;
    const vipBonus = vipActive ? 1 : 0;
    return Math.max(3, 3 + alchemyLevel + vipBonus);
}

export const maxBrewAttempts = derived(
    [gameStore, isVip],
    ([$game, $vip]) => getMaxBrewAttempts($game, $vip)
);

export const brewAttemptsLeft = derived(
    [failedBrewAttempts, maxBrewAttempts],
    ([$failed, $max]) => Math.max(0, $max - Math.max(0, $failed))
);

export const CAULDRON_COOLDOWN_MS = 2 * 60 * 1000; // 2 минуты остывания (120 сек)

export interface BrewResult {
    status: 'success' | 'warning' | 'overheat' | 'blocked';
    matches?: number; // 0, 1, or 2 matching ingredients in any unknown recipe
    attemptsLeft?: number;
    potionId?: string;
    recipeName?: string;
    isDouble?: boolean;
    cooldownSeconds?: number;
}

/**
 * Attempt to brew a potion from exactly 3 ingredient slots.
 * Returns: BrewResult
 *   - success:  correct recipe → ingredients consumed, potion added, recipe unlocked to level 3 (chance for double)
 *   - warning:  wrong recipe → ingredients NOT consumed, calculates alchemical resonance (0, 1, 2)
 *   - overheat: wrong recipe (reached max attempts) → ingredients SAVED, cauldron enters 2-minute cooldown
 *   - blocked:  cauldron currently overheated → brewing forbidden until cooldown finishes
 */
export function brewPotion(slots: [string, string, string]): BrewResult {
    const state = get(gameStore);
    const now = Date.now();
    const overheatUntil = state.cauldronOverheatUntil || 0;
    if (overheatUntil > now) {
        return {
            status: 'blocked',
            cooldownSeconds: Math.ceil((overheatUntil - now) / 1000)
        };
    }

    const sorted = [...slots].sort();
    const recipe = RECIPES.find(r => {
        const rs = [...r.ingredients].sort();
        return rs.every((ing, i) => ing === sorted[i]);
    });

    if (recipe) {
        // Correct recipe - consume and reward
        const masteryLevel = Math.floor((state.alchemyBrewsCount || 0) / 5);
        let doubleChance = Math.min(0.20, masteryLevel * 0.05); // up to +20% chance
        
        // Secret Upgrade: Эссенция Мастерства (+6% шанс удвоенного зелья за уровень)
        const essenceLvl = state.secretUpgrades?.find(u => u.id === 'essence_mastery')?.level || 0;
        const isBoosted = (state.secretKnowledgeBoostUntil || 0) > Date.now();
        if (essenceLvl > 0) {
            doubleChance = Math.min(0.70, doubleChance + (essenceLvl * 0.06 * (isBoosted ? 1.5 : 1)));
        }

        // Moon Witch Set Grand Bonus: +30% шанс удвоения зелий
        if (state.unlockedCollections?.includes('moon_witch_set')) {
            doubleChance += 0.30;
        }

        // Active Companion Bonus (e.g. Moon Cat: +20%..+38%)
        if (state.activeCompanionId) {
            const compLvl = state.petLevels?.[state.activeCompanionId] || 1;
            const compBonus = getPetBonusValues(state.activeCompanionId, compLvl);
            if (compBonus.doubleBrewBonus > 0) {
                doubleChance += compBonus.doubleBrewBonus;
            }
        }

        // Hall of Fame achievement perk: double_brew
        const achPerks = calculateAchievementPerks(state);
        if (achPerks.double_brew > 0) {
            doubleChance += achPerks.double_brew;
        }
        doubleChance = Math.min(0.85, doubleChance);

        const isDouble = Math.random() < doubleChance;
        const yieldCount = isDouble ? 2 : 1;

        ingredientsCount.update(c => {
            const next = { ...c };
            for (const ing of slots) {
                next[ing] = (next[ing] ?? 0) - 1;
                if (next[ing] <= 0) delete next[ing];
            }
            return next;
        });

        potionsCount.update(c => ({
            ...c,
            [recipe.resultPotionId]: (c[recipe.resultPotionId] ?? 0) + yieldCount,
        }));

        failedBrewAttempts.set(0);
        unlockedRecipes.update(r => ({ ...r, [recipe.id]: 3 }));
        gameStore.update(s => ({
            ...s,
            alchemyBrewsCount: (s.alchemyBrewsCount || 0) + 1
        }));
        gameStore.updateQuestProgress('brew_potions', 1);
        
        const pot = AVAILABLE_POTIONS.find(p => p.id === recipe.resultPotionId);
        return { 
            status: 'success', 
            potionId: recipe.resultPotionId,
            recipeName: pot?.name ?? translate('common.potion'),
            isDouble
        };
    }

    // Wrong recipe - calculate Alchemical Resonance
    let maxMatches = 0;
    let closestRecipe: AlchemyRecipe | null = null;
    for (const r of RECIPES) {
        let matches = 0;
        const targetIngs = [...r.ingredients];
        for (const s of slots) {
            const idx = targetIngs.indexOf(s);
            if (idx !== -1) {
                matches++;
                targetIngs.splice(idx, 1);
            }
        }
        if (matches > maxMatches) {
            maxMatches = matches;
            closestRecipe = r;
        }
    }

    // Alchemical Discovery: if player discovered 2 out of 3 ingredients of an unknown recipe,
    // automatically register the first hint in the Grimoire!
    if (maxMatches === 2 && closestRecipe) {
        unlockedRecipes.update(r => {
            const currentLevel = r[closestRecipe!.id] || 0;
            if (currentLevel < 1) {
                return { ...r, [closestRecipe!.id]: 1 };
            }
            return r;
        });
    }

    const current = Math.max(0, get(failedBrewAttempts));
    const next = current + 1;
    
    // Secret Upgrade: Повелитель Котлов / VIP
    const maxFailures = getMaxBrewAttempts(state, get(isVip));

    if (next >= maxFailures || current >= maxFailures) {
        // Secret Upgrade: Остывание Эфира (-15 сек перегрева за уровень)
        const cooldownLvl = state.secretUpgrades?.find(u => u.id === 'cooldown_mastery')?.level || 0;
        const isBoosted = (state.secretKnowledgeBoostUntil || 0) > Date.now();
        const effectiveCooldownMs = Math.max(30 * 1000, CAULDRON_COOLDOWN_MS - Math.floor(cooldownLvl * 15 * 1000 * (isBoosted ? 1.5 : 1)));

        failedBrewAttempts.set(0);
        gameStore.update(s => ({
            ...s,
            cauldronOverheatUntil: Date.now() + effectiveCooldownMs
        }));
        return { 
            status: 'overheat', 
            cooldownSeconds: Math.round(effectiveCooldownMs / 1000) 
        };
    }

    failedBrewAttempts.set(next);
    const left = Math.max(0, maxFailures - next);
    return { 
        status: 'warning', 
        matches: maxMatches, 
        attemptsLeft: left 
    };
}

/**
 * Instantly brew a known recipe in 1 click directly from the Recipe Book.
 */
export function quickBrewRecipe(recipeId: string): { success: boolean; reason?: string; isDouble?: boolean } {
    const state = get(gameStore);
    const now = Date.now();
    const overheatUntil = state.cauldronOverheatUntil || 0;
    if (overheatUntil > now) {
        const sec = Math.ceil((overheatUntil - now) / 1000);
        return { success: false, reason: translate('alchemy.coolingWaitSec', { sec }) };
    }

    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe) return { success: false, reason: translate('alchemy.recipeNotFound') };

    const counts = get(ingredientsCount);
    // Count needed ingredients
    const needed: Record<string, number> = {};
    for (const ing of recipe.ingredients) {
        needed[ing] = (needed[ing] ?? 0) + 1;
    }

    // Verify player has all ingredients
    for (const [ing, cnt] of Object.entries(needed)) {
        if ((counts[ing] ?? 0) < cnt) {
            const ingObj = AVAILABLE_INGREDIENTS.find(i => i.id === ing);
            return { success: false, reason: translate('alchemy.needIngredientsNamed', { name: ingObj?.name ?? ing }) };
        }
    }

    const masteryLevel = Math.floor((state.alchemyBrewsCount || 0) / 5);
    let doubleChance = Math.min(0.20, masteryLevel * 0.05);
    const essenceLvl = state.secretUpgrades?.find(u => u.id === 'essence_mastery')?.level || 0;
    const isBoosted = (state.secretKnowledgeBoostUntil || 0) > Date.now();
    if (essenceLvl > 0) {
        doubleChance = Math.min(0.70, doubleChance + (essenceLvl * 0.06 * (isBoosted ? 1.5 : 1)));
    }

    // Moon Witch Set Grand Bonus: +30% шанс удвоения зелий
    if (state.unlockedCollections?.includes('moon_witch_set')) {
        doubleChance += 0.30;
    }

    // Active Companion Bonus (e.g. Moon Cat: +20%..+38%)
    if (state.activeCompanionId) {
        const compLvl = state.petLevels?.[state.activeCompanionId] || 1;
        const compBonus = getPetBonusValues(state.activeCompanionId, compLvl);
        if (compBonus.doubleBrewBonus > 0) {
            doubleChance += compBonus.doubleBrewBonus;
        }
    }

    // Hall of Fame achievement perk: double_brew
    const achPerks = calculateAchievementPerks(state);
    if (achPerks.double_brew > 0) {
        doubleChance += achPerks.double_brew;
    }
    doubleChance = Math.min(0.85, doubleChance);

    const isDouble = Math.random() < doubleChance;
    const yieldCount = isDouble ? 2 : 1;

    // Deduct ingredients
    ingredientsCount.update(c => {
        const next = { ...c };
        for (const [ing, cnt] of Object.entries(needed)) {
            next[ing] = (next[ing] ?? 0) - cnt;
            if (next[ing] <= 0) delete next[ing];
        }
        return next;
    });

    // Add potion
    potionsCount.update(c => ({
        ...c,
        [recipe.resultPotionId]: (c[recipe.resultPotionId] ?? 0) + yieldCount
    }));

    // Ensure fully unlocked in book
    unlockedRecipes.update(r => ({ ...r, [recipe.id]: 3 }));
    failedBrewAttempts.set(0);
    gameStore.update(s => ({
        ...s,
        alchemyBrewsCount: (s.alchemyBrewsCount || 0) + 1
    }));
    gameStore.updateQuestProgress('brew_potions', 1);

    return { success: true, isDouble };
}

/**
 * Cooldown the cauldron temperature back to 0.
 */
export function coolDownCauldron(): void {
    failedBrewAttempts.set(0);
    gameStore.update(s => ({ ...s, cauldronOverheatUntil: 0 }));
}

export function coolDownCauldronAd(): void {
    coolDownCauldron();
}

export function coolDownCauldronCrystals(cost = 8): boolean {
    if (get(crystals) < cost) return false;
    crystals.update(c => c - cost);
    coolDownCauldron();
    return true;
}

/**
 * Buy one hint for a recipe.
 * Returns true on success, false if not enough crystals or already fully unlocked.
 */
export function buyRecipeHint(recipeId: string): boolean {
    const hints = get(unlockedRecipes);
    const level = hints[recipeId] ?? 0;
    if (level >= 3) return false;

    const cost = HINT_COSTS[level];
    if (get(crystals) < cost) return false;

    crystals.update(n => n - cost);
    unlockedRecipes.update(r => ({ ...r, [recipeId]: level + 1 }));
    return true;
}

/**
 * Unlock one recipe hint for free (via rewarded ad).
 * RESTRICTION: Only 1 ingredient per recipe can be unlocked by ad!
 * Further hints must be unlocked via crystals.
 */
export function unlockRecipeHintFree(recipeId: string): boolean {
    const hints = get(unlockedRecipes);
    const level = hints[recipeId] ?? 0;
    if (level >= 1) return false; // За рекламу можно открыть ТОЛЬКО первый ингредиент

    const state = get(gameStore);
    if (state.recipeAdHintsUsed?.[recipeId]) return false; // Реклама уже была использована для этого рецепта

    gameStore.update(s => ({
        ...s,
        recipeAdHintsUsed: { ...(s.recipeAdHintsUsed || {}), [recipeId]: true }
    }));
    unlockedRecipes.update(r => ({ ...r, [recipeId]: 1 }));
    return true;
}

/**
 * Calculate dynamic crystal cost to instantly complete an expedition based on remaining time.
 * Formula: 1 crystal per 12 minutes (720,000 ms), minimum 1 crystal.
 */
export function getExpeditionSkipCost(timeRemainingMs: number): number {
    if (timeRemainingMs <= 0) return 0;
    return Math.max(1, Math.ceil(timeRemainingMs / (12 * 60 * 1000)));
}

/**
 * Unlock a random recipe (for scrolls/folios).
 * preferRarity: try to pick a recipe of that rarity first.
 * Returns the recipe id that was unlocked, or null if all already unlocked.
 */
export function unlockRandomRecipe(preferRarity?: Rarity): string | null {
    const hints = get(unlockedRecipes);
    let candidates = RECIPES.filter(r => (hints[r.id] ?? 0) < 3);
    if (candidates.length === 0) return null;

    if (preferRarity) {
        const preferred = candidates.filter(r => r.rarity === preferRarity);
        if (preferred.length > 0) candidates = preferred;
    }

    const recipe = pickRandom(candidates);
    unlockedRecipes.update(r => ({ ...r, [recipe.id]: 3 }));
    return recipe.id;
}

// ============================================================
// MONETIZATION: ARCHMAGE LUCKY WHEEL (КОЛЕСО ФОРТУНЫ АРХИМАГА)
// ============================================================

export interface LuckyWheelSector {
    index: number;
    titleKey: string;
    descriptionKey: string;
    type: 'gold' | 'crystals' | 'frenzy' | 'chest' | 'reagents' | 'timewarp' | 'jackpot';
    weight: number;
    badgeKey: string;
    badge: string;
    amount?: number;
    chestType?: ChestType;
    iconSvg: string;
}

export interface LuckyWheelReward {
    sectorIndex: number;
    title: string;
    description: string;
    type: 'gold' | 'crystals' | 'frenzy' | 'chest' | 'reagents' | 'timewarp' | 'jackpot';
    goldAmount?: number;
    crystalAmount?: number;
    chestResult?: ChestResult;
    reagentsCount?: number;
    isPityBonus?: boolean;
    pityChestResult?: ChestResult;
}

export const LUCKY_WHEEL_SECTORS: LuckyWheelSector[] = [
    {
        index: 0,
        titleKey: 'luckyWheel.sectorGoldTitle',
        descriptionKey: 'luckyWheel.sectorGoldDesc',
        type: 'gold',
        weight: 250, // 25%
        badgeKey: 'luckyWheel.sectorBadgeGold',
        badge: '30m',
        iconSvg: `<svg viewBox="0 0 40 40" width="32" height="32" fill="none">
            <circle cx="20" cy="22" r="14" fill="#f59e0b" stroke="#d97706" stroke-width="2"/>
            <circle cx="20" cy="22" r="10" stroke="#fef3c7" stroke-width="1.5" stroke-dasharray="3 2"/>
            <text x="20" y="27" text-anchor="middle" fill="#fff" font-size="14" font-weight="bold">G</text>
            <polygon points="12,10 14,14 18,15 14,17 12,21 10,17 6,15 10,14" fill="#fef08a"/>
            <polygon points="28,8 29,11 32,12 29,13 28,16 27,13 24,12 27,11" fill="#fef08a"/>
        </svg>`
    },
    {
        index: 1,
        titleKey: 'luckyWheel.sectorCrystals3Title',
        descriptionKey: 'luckyWheel.sectorCrystals3Desc',
        type: 'crystals',
        weight: 200, // 20%
        badgeKey: 'luckyWheel.sectorBadgeCrystals3',
        badge: '+3 💎',
        amount: 3,
        iconSvg: `<svg viewBox="0 0 40 40" width="32" height="32" fill="none">
            <polygon points="20,6 30,16 20,34 10,16" fill="#38bdf8" stroke="#0284c7" stroke-width="1.8"/>
            <polygon points="20,6 30,16 20,22" fill="#7dd3fc"/>
            <polygon points="20,6 10,16 20,22" fill="#bae6fd"/>
            <circle cx="20" cy="18" r="3" fill="#fff" opacity="0.8"/>
        </svg>`
    },
    {
        index: 2,
        titleKey: 'luckyWheel.sectorFrenzyTitle',
        descriptionKey: 'luckyWheel.sectorFrenzyDesc',
        type: 'frenzy',
        weight: 180, // 18%
        badgeKey: 'luckyWheel.sectorBadgeFrenzy',
        badge: 'x3 (3m)',
        iconSvg: `<svg viewBox="0 0 40 40" width="32" height="32" fill="none">
            <path d="M16 8 L24 8 L26 16 L31 28 Q33 34 20 34 Q7 34 9 28 L14 16 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>
            <rect x="14" y="4" width="12" height="4" rx="1.5" fill="#f97316"/>
            <path d="M18 20 Q20 14 24 22 Q22 28 18 20 Z" fill="#fef08a"/>
            <circle cx="20" cy="27" r="2" fill="#fff"/>
        </svg>`
    },
    {
        index: 3,
        titleKey: 'luckyWheel.sectorChestTitle',
        descriptionKey: 'luckyWheel.sectorChestDesc',
        type: 'chest',
        weight: 140, // 14%
        badgeKey: 'luckyWheel.sectorBadgeChest',
        badge: 'Сундук',
        chestType: 'alchemist',
        iconSvg: `<svg viewBox="0 0 40 40" width="32" height="32" fill="none">
            <rect x="6" y="16" width="28" height="18" rx="3" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
            <path d="M6 16 Q20 8 34 16 Z" fill="#0369a1" stroke="#38bdf8" stroke-width="1.8"/>
            <circle cx="20" cy="24" r="4" fill="#f59e0b" stroke="#fff" stroke-width="1"/>
            <line x1="6" y1="16" x2="34" y2="16" stroke="#fef08a" stroke-width="1.5"/>
        </svg>`
    },
    {
        index: 4,
        titleKey: 'luckyWheel.sectorReagentsTitle',
        descriptionKey: 'luckyWheel.sectorReagentsDesc',
        type: 'reagents',
        weight: 100, // 10%
        badgeKey: 'luckyWheel.sectorBadgeReagents',
        badge: '+5 трав',
        amount: 5,
        iconSvg: `<svg viewBox="0 0 40 40" width="32" height="32" fill="none">
            <path d="M20 34 Q8 26 14 12 Q20 8 20 8 Q20 8 20 12 Q26 26 20 34 Z" fill="#10b981" stroke="#047857" stroke-width="1.8"/>
            <path d="M20 34 L20 14" stroke="#a7f3d0" stroke-width="1.5"/>
            <path d="M20 22 Q24 18 26 20" stroke="#a7f3d0" stroke-width="1.2"/>
            <path d="M20 26 Q16 22 14 24" stroke="#a7f3d0" stroke-width="1.2"/>
        </svg>`
    },
    {
        index: 5,
        titleKey: 'luckyWheel.sectorTimeWarpTitle',
        descriptionKey: 'luckyWheel.sectorTimeWarpDesc',
        type: 'timewarp',
        weight: 70, // 7%
        badgeKey: 'luckyWheel.sectorBadgeTimeWarp',
        badge: '1 час',
        amount: 1,
        iconSvg: `<svg viewBox="0 0 40 40" width="32" height="32" fill="none">
            <circle cx="20" cy="20" r="14" fill="#6366f1" stroke="#4338ca" stroke-width="2"/>
            <circle cx="20" cy="20" r="11" fill="#1e1b4b"/>
            <line x1="20" y1="20" x2="20" y2="13" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
            <line x1="20" y1="20" x2="25" y2="20" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
            <circle cx="20" cy="20" r="2.5" fill="#fef08a"/>
        </svg>`
    },
    {
        index: 6,
        titleKey: 'luckyWheel.sectorCrystals10Title',
        descriptionKey: 'luckyWheel.sectorCrystals10Desc',
        type: 'crystals',
        weight: 45, // 4.5%
        badgeKey: 'luckyWheel.sectorBadgeCrystals10',
        badge: '+10 💎',
        amount: 10,
        iconSvg: `<svg viewBox="0 0 40 40" width="32" height="32" fill="none">
            <polygon points="12,18 20,4 28,18 20,36" fill="#a855f7" stroke="#7e22ce" stroke-width="1.8"/>
            <polygon points="20,4 28,18 20,24" fill="#c084fc"/>
            <polygon points="20,4 12,18 20,24" fill="#e9d5ff"/>
            <polygon points="6,20 12,10 18,20 12,30" fill="#38bdf8" opacity="0.8"/>
            <polygon points="22,20 28,10 34,20 28,30" fill="#f59e0b" opacity="0.8"/>
        </svg>`
    },
    {
        index: 7,
        titleKey: 'luckyWheel.sectorJackpotTitle',
        descriptionKey: 'luckyWheel.sectorJackpotDesc',
        type: 'jackpot',
        weight: 15, // 1.5%
        badgeKey: 'luckyWheel.sectorBadgeJackpot',
        badge: 'ДЖЕКПОТ',
        amount: 50,
        chestType: 'astral',
        iconSvg: `<svg viewBox="0 0 40 40" width="32" height="32" fill="none">
            <circle cx="20" cy="20" r="16" fill="url(#jackpotAura)" stroke="#f59e0b" stroke-width="2"/>
            <polygon points="20,5 24,14 34,15 26,22 29,32 20,26 11,32 14,22 6,15 16,14" fill="#fef08a" stroke="#d97706" stroke-width="1.2"/>
            <circle cx="20" cy="20" r="4" fill="#fff"/>
        </svg>`
    }
];

/**
 * Weighted random selector for Lucky Wheel sectors (Total Weight = 1000)
 */
export function rollLuckyWheelSectorIndex(): number {
    const roll = Math.random() * 1000;
    let accumulated = 0;
    for (const sector of LUCKY_WHEEL_SECTORS) {
        accumulated += sector.weight;
        if (roll < accumulated) {
            return sector.index;
        }
    }
    return 0;
}

/**
 * Check whether the daily free spin is available (24h cooldown)
 */
export function canLuckyWheelFreeSpin(): boolean {
    const lw = get(gameStore).luckyWheel;
    if (!lw || !lw.lastFreeSpinTimestamp) return true;
    return Date.now() - lw.lastFreeSpinTimestamp >= 24 * 60 * 60 * 1000;
}

/**
 * Get remaining cooldown in seconds for the free spin
 */
export function timeUntilLuckyWheelFreeSpinSec(): number {
    const lw = get(gameStore).luckyWheel;
    if (!lw || !lw.lastFreeSpinTimestamp) return 0;
    const elapsed = Date.now() - lw.lastFreeSpinTimestamp;
    const cooldownMs = 24 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((cooldownMs - elapsed) / 1000));
}

/**
 * Check whether a rewarded ad spin is available (max 5 per day, 30 min cooldown)
 */
export function canLuckyWheelAdSpin(): { allowed: boolean; remainingSec: number; spinsLeftToday: number } {
    const lw = get(gameStore).luckyWheel || {
        lastFreeSpinTimestamp: 0,
        adSpinsCount: 0,
        lastAdSpinTimestamp: 0,
        adSpinsDate: '',
        pityProgress: 0,
        totalSpins: 0
    };
    const today = new Date().toISOString().split('T')[0];
    const adCount = lw.adSpinsDate === today ? (lw.adSpinsCount || 0) : 0;
    const spinsLeftToday = Math.max(0, 5 - adCount);
    const elapsedSinceLastAd = Date.now() - (lw.lastAdSpinTimestamp || 0);
    const cooldownMs = 30 * 60 * 1000;
    const remainingSec = Math.max(0, Math.ceil((cooldownMs - elapsedSinceLastAd) / 1000));
    const allowed = spinsLeftToday > 0 && remainingSec === 0;
    return { allowed, remainingSec, spinsLeftToday };
}

/**
 * Derived store: whether a free spin or ad spin is currently available (for HUD notification badge)
 */
export const isLuckyWheelReady = derived(gameStore, $state => {
    const lw = $state?.luckyWheel;
    if (!lw || !lw.lastFreeSpinTimestamp) return true;
    const now = Date.now();
    // 1. Free spin ready?
    if (now - lw.lastFreeSpinTimestamp >= 24 * 3600 * 1000) return true;
    // 2. Ad spin ready?
    const today = new Date().toISOString().split('T')[0];
    const adCount = lw.adSpinsDate === today ? (lw.adSpinsCount || 0) : 0;
    if (adCount < 5 && now - (lw.lastAdSpinTimestamp || 0) >= 30 * 60 * 1000) return true;
    return false;
});

/**
 * Distribute reward for a given sector
 */
function applySectorReward(sector: LuckyWheelSector): {
    goldWon?: number;
    crystalsWon?: number;
    chestRes?: ChestResult;
    reagentsCount?: number;
} {
    if (sector.type === 'gold') {
        const idle = get(stableIdleIncome) || 0;
        const goldWon = Math.max(5000, Math.round(idle * 1800)); // 30 min of idle income
        gameStore.addGold(goldWon);
        return { goldWon };
    }
    if (sector.type === 'crystals') {
        const amt = sector.amount || 3;
        crystals.update(c => c + amt);
        return { crystalsWon: amt };
    }
    if (sector.type === 'frenzy') {
        // Frenzy: +200% gold for 3 minutes (x3 profit). Stacks duration if already active.
        const now = Date.now();
        const duration = 3 * 60 * 1000;
        gameStore.update(s => {
            const currentBuffs = s.activeBuffs || [];
            const existingIdx = currentBuffs.findIndex(b => b.potionId === 'frenzy_lucky_wheel');
            let nextBuffs: ActiveBuff[];
            if (existingIdx >= 0) {
                const existing = currentBuffs[existingIdx];
                const baseTime = existing.expiresAt > now ? existing.expiresAt : now;
                nextBuffs = [...currentBuffs];
                nextBuffs[existingIdx] = {
                    ...existing,
                    expiresAt: baseTime + duration,
                    value: 2.0
                };
            } else {
                nextBuffs = [
                    ...currentBuffs,
                    {
                        potionId: 'frenzy_lucky_wheel',
                        expiresAt: now + duration,
                        effect: 'gold_multiplier',
                        value: 2.0
                    }
                ];
            }
            return {
                ...s,
                activeBuffs: nextBuffs
            };
        });
        return {};
    }
    if (sector.type === 'chest') {
        const chestRes = openChest(sector.chestType || 'alchemist');
        return { chestRes };
    }
    if (sector.type === 'reagents') {
        const addCount = sector.amount || 5;
        ingredientsCount.update(counts => {
            const next = { ...counts };
            for (const ing of AVAILABLE_INGREDIENTS) {
                next[ing.id] = (next[ing.id] ?? 0) + addCount;
            }
            return next;
        });
        return { reagentsCount: addCount };
    }
    if (sector.type === 'timewarp') {
        useFreeTimeSkip(1);
        return {};
    }
    if (sector.type === 'jackpot') {
        crystals.update(c => c + 50);
        const chestRes = openChest('astral');
        return { crystalsWon: 50, chestRes };
    }
    return {};
}

/**
 * Execute a Lucky Wheel spin session.
 * Handles single spins ('free', 'ad', 'crystal') and batch spins ('crystal10').
 * Advances the Pity Meter (0/10) and triggers the guaranteed Archmage bonus chest on 10/10.
 */
export function executeLuckyWheelSpin(
    mode: 'free' | 'ad' | 'crystal' | 'crystal10',
    preRolledSectorIndex?: number
): { success: boolean; rewards: LuckyWheelReward[]; reason?: string } {
    const state = get(gameStore);
    const lw = state.luckyWheel || {
        lastFreeSpinTimestamp: 0,
        adSpinsCount: 0,
        lastAdSpinTimestamp: 0,
        adSpinsDate: '',
        pityProgress: 0,
        totalSpins: 0
    };
    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();

    // 1. Validation & Payment
    if (mode === 'free') {
        if (!canLuckyWheelFreeSpin()) {
            return { success: false, rewards: [], reason: translate('luckyWheel.freeCooldownWait') };
        }
    } else if (mode === 'ad') {
        const adCheck = canLuckyWheelAdSpin();
        if (!adCheck.allowed) {
            return { success: false, rewards: [], reason: translate('luckyWheel.adCooldownWait') };
        }
    } else if (mode === 'crystal') {
        if (get(crystals) < 10) {
            return { success: false, rewards: [], reason: translate('common.notEnoughCrystals') };
        }
        crystals.update(c => c - 10);
    } else if (mode === 'crystal10') {
        if (get(crystals) < 90) {
            return { success: false, rewards: [], reason: translate('common.notEnoughCrystals') };
        }
        crystals.update(c => c - 90);
    }

    const spinCount = mode === 'crystal10' ? 10 : 1;
    const rewards: LuckyWheelReward[] = [];
    let currentPity = lw.pityProgress || 0;

    for (let i = 0; i < spinCount; i++) {
        // Roll sector (or use pre-rolled on single spin if provided)
        const sectorIndex = (i === 0 && typeof preRolledSectorIndex === 'number') 
            ? preRolledSectorIndex 
            : rollLuckyWheelSectorIndex();
        const sector = LUCKY_WHEEL_SECTORS[sectorIndex];

        // Apply primary reward
        const outcome = applySectorReward(sector);

        currentPity += 1;
        let isPityBonus = false;
        let pityChestResult: ChestResult | undefined;

        // Pity guarantee trigger at 10 spins:
        if (currentPity >= 10) {
            isPityBonus = true;
            pityChestResult = openChest('astral'); // Bonus Astral / Archmage chest!
            currentPity = 0;
        }

        rewards.push({
            sectorIndex,
            title: translate(sector.titleKey),
            description: translate(sector.descriptionKey),
            type: sector.type,
            goldAmount: outcome.goldWon,
            crystalAmount: outcome.crystalsWon,
            chestResult: outcome.chestRes,
            reagentsCount: outcome.reagentsCount,
            isPityBonus,
            pityChestResult
        });
    }

    // 2. Update state in store
    gameStore.update(s => {
        const prevLw = s.luckyWheel || lw;
        const nextAdCount = mode === 'ad'
            ? (prevLw.adSpinsDate === today ? (prevLw.adSpinsCount || 0) + 1 : 1)
            : (prevLw.adSpinsDate === today ? (prevLw.adSpinsCount || 0) : 0);

        return {
            ...s,
            luckyWheel: {
                lastFreeSpinTimestamp: mode === 'free' ? now : (prevLw.lastFreeSpinTimestamp || 0),
                adSpinsCount: nextAdCount,
                lastAdSpinTimestamp: mode === 'ad' ? now : (prevLw.lastAdSpinTimestamp || 0),
                adSpinsDate: today,
                pityProgress: currentPity,
                totalSpins: (prevLw.totalSpins || 0) + spinCount
            }
        };
    });

    return { success: true, rewards };
}
