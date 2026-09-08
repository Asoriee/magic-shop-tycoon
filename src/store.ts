import { writable, get, derived } from 'svelte/store';

// ============================================================
// UTILS
// ============================================================

export function formatNumber(num: number): string {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    if (num % 1 !== 0) return num.toFixed(1);
    return Math.floor(num).toString();
}

// ============================================================
// TYPES
// ============================================================

export type QuestType = 'clicks' | 'buy_upgrades' | 'watch_ads';

export interface Quest {
    id: string;
    type: QuestType;
    target: number;
    current: number;
    reward: number;
    isCompleted: boolean;
    isClaimed: boolean;
}

export type UpgradeType = 'click' | 'idle' | 'crit' | 'resonance' | 'heat' | 'hearth';
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

export interface SecretUpgrade {
    id: 'magnet' | 'alchemy' | 'orders' | 'wallet' | 'familiar';
    name: string;
    description: string;
    baseCost: number;
    costMultiplier: number;
    level: number;
    maxLevel: number;
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ChestType = 'wooden' | 'magical' | 'astral';

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
    requirements: OrderRequirement[];
    rewardGold: number;
    rewardStardust: number;
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

export interface Collection {
    id: string;
    name: string;
    requiredArtifactIds: number[];
    rewardPetId: string;
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
    unlockedPets: string[];
    activeExpeditions: ActiveExpedition[];
    activeOrders: CustomerOrder[];
    lastOrderSpawnTime: number;
    activeBuffs: ActiveBuff[];
    unlockedCollections: string[];
    lastFreeChestTime?: number;
}

// ============================================================
// ALCHEMY: INGREDIENTS CATALOGUE
// ============================================================

export const AVAILABLE_INGREDIENTS: Ingredient[] = [
    // --- Common ---
    {
        id: 'herb_mundane',
        name: 'Мирная трава',
        rarity: 'common',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40">
            <path d="M20 35 Q10 20 12 8 Q16 15 20 12 Q24 15 28 8 Q30 20 20 35Z" fill="#55efc4" stroke="#00b894" stroke-width="1.5"/>
            <line x1="20" y1="35" x2="20" y2="20" stroke="#00b894" stroke-width="1.5"/>
        </svg>`
    },
    {
        id: 'mushroom_gray',
        name: 'Серый гриб',
        rarity: 'common',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40">
            <ellipse cx="20" cy="18" rx="14" ry="9" fill="#b2bec3"/>
            <rect x="17" y="18" width="6" height="12" rx="2" fill="#dfe6e9"/>
            <ellipse cx="20" cy="18" rx="8" ry="4" fill="#636e72" opacity="0.3"/>
        </svg>`
    },
    {
        id: 'toadstone',
        name: 'Жабий камень',
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
        name: 'Лунный лепесток',
        rarity: 'rare',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40">
            <defs><filter id="rareGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
            <path d="M20 5 Q28 14 28 22 Q28 32 20 35 Q12 32 12 22 Q12 14 20 5Z" fill="#74b9ff" filter="url(#rareGlow)" opacity="0.9"/>
            <path d="M20 10 Q25 17 25 22 Q25 30 20 32" fill="none" stroke="white" stroke-width="1" opacity="0.5"/>
        </svg>`
    },
    {
        id: 'fairy_breath',
        name: 'Дыхание феи',
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
        name: 'Хвост саламандры',
        rarity: 'rare',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40">
            <defs><filter id="rareGlow2"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
            <path d="M8 30 Q15 10 28 8 Q22 20 30 32 Q20 25 8 30Z" fill="#fd79a8" filter="url(#rareGlow2)"/>
            <circle cx="27" cy="10" r="3" fill="#e17055"/>
        </svg>`
    },
    {
        id: 'stardew',
        name: 'Звёздная роса',
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
        name: 'Эссенция Пустоты',
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
        name: 'Кровь тролля',
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
        name: 'Чешуя дракона',
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
        name: 'Слеза Алхимика',
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
        name: 'Кристалл Времени',
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

const RARITY_POOLS: Record<ChestType, Ingredient[][]> = {
    wooden: [
        AVAILABLE_INGREDIENTS.filter(i => i.rarity === 'common'),
        AVAILABLE_INGREDIENTS.filter(i => i.rarity === 'common'),
        AVAILABLE_INGREDIENTS.filter(i => ['common', 'rare'].includes(i.rarity)),
    ],
    magical: [
        AVAILABLE_INGREDIENTS.filter(i => i.rarity === 'epic'),
        AVAILABLE_INGREDIENTS.filter(i => ['common', 'rare'].includes(i.rarity)),
        AVAILABLE_INGREDIENTS.filter(i => ['common', 'rare'].includes(i.rarity)),
        AVAILABLE_INGREDIENTS.filter(i => ['rare', 'epic'].includes(i.rarity)),
        AVAILABLE_INGREDIENTS.filter(i => ['common', 'rare'].includes(i.rarity)),
    ],
    astral: [
        AVAILABLE_INGREDIENTS.filter(i => i.rarity === 'legendary'),
        AVAILABLE_INGREDIENTS.filter(i => ['rare', 'epic', 'legendary'].includes(i.rarity)),
        AVAILABLE_INGREDIENTS.filter(i => ['rare', 'epic'].includes(i.rarity)),
        AVAILABLE_INGREDIENTS.filter(i => ['common', 'rare'].includes(i.rarity)),
        AVAILABLE_INGREDIENTS.filter(i => i.rarity === 'epic'),
    ],
};

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
export const potionsCount     = writable<Record<string, number>>({});

// ============================================================
// ALCHEMY: POTIONS CATALOGUE & RECIPES
// ============================================================

export const AVAILABLE_POTIONS: Potion[] = [
    {
        id: 'potion_luck',
        name: 'Зелье Удачи',
        description: '+25% к золоту от кликов на 5 мин',
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
        name: 'Зелье Богатства',
        description: '+50% пассивного дохода на 5 мин',
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
        name: 'Зелье Пустоты',
        description: '+100% ко всему золоту на 3 мин',
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
        name: 'Зелье Фокуса',
        description: '+50% к кликам на 2 мин',
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
        name: 'Эликсир Мудреца',
        description: '+150% к пассивному доходу на 10 мин',
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
    }
];



/**
 * Opens a chest and returns the array of dropped ingredients.
 * Also updates ingredientsCount store.
 */
export function openChest(chestType: ChestType): Ingredient[] {
    let drops: Ingredient[] = [];

    if (chestType === 'wooden') {
        // 3 items: 90% common / 10% rare each
        for (let i = 0; i < 3; i++) {
            drops.push(rollIngredient([
                { rarity: 'common', weight: 90 },
                { rarity: 'rare',   weight: 10 },
            ]));
        }
    } else if (chestType === 'magical') {
        // 5 items: guaranteed 1 epic + 4 common/rare
        drops.push(rollIngredient([{ rarity: 'epic', weight: 100 }]));
        for (let i = 0; i < 4; i++) {
            drops.push(rollIngredient([
                { rarity: 'common', weight: 60 },
                { rarity: 'rare',   weight: 40 },
            ]));
        }
    } else if (chestType === 'astral') {
        // 10 items: guaranteed 1 legendary + 9 mixed
        drops.push(rollIngredient([{ rarity: 'legendary', weight: 100 }]));
        for (let i = 0; i < 9; i++) {
            drops.push(rollIngredient([
                { rarity: 'common',    weight: 40 },
                { rarity: 'rare',      weight: 35 },
                { rarity: 'epic',      weight: 20 },
                { rarity: 'legendary', weight: 5 },
            ]));
        }
    }

    // Shuffle so guaranteed item isn't always first
    drops = drops.sort(() => Math.random() - 0.5);

    // Update store
    ingredientsCount.update(counts => {
        const next = { ...counts };
        for (const ing of drops) {
            next[ing.id] = (next[ing.id] ?? 0) + 1;
        }
        return next;
    });

    return drops;
}

// ============================================================
// GAME STATE
// ============================================================

const defaultUpgrades: Upgrade[] = [
    // --- Производство (Пассивный доход) ---
    {
        id: 'idle1',
        name: 'Чародейский половник',
        description: 'Автоматически помешивает зелье в котле без перерыва.',
        type: 'idle',
        category: 'production',
        baseCost: 15,
        costMultiplier: 1.30,
        baseValue: 1,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><ellipse cx="14" cy="28" rx="8" ry="6" fill="#74b9ff" stroke="#0984e3" stroke-width="2"/><path d="M18 24 L32 8" stroke="#dfe6e9" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="8" r="3" fill="#f1c40f"/><path d="M12 26 Q14 20 18 22" stroke="white" stroke-width="1.5" fill="none"/></svg>`
    },
    {
        id: 'click1',
        name: 'Магическая ложка',
        description: 'Увеличивает силу каждого ручного клика по котлу.',
        type: 'click',
        category: 'click',
        baseCost: 20,
        costMultiplier: 1.30,
        baseValue: 1,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><ellipse cx="14" cy="28" rx="7" ry="5" fill="#f1c40f" stroke="#d4ac0d" stroke-width="2"/><path d="M18 24 L34 8" stroke="#f39c12" stroke-width="3" stroke-linecap="round"/><circle cx="34" cy="8" r="3" fill="#e74c3c"/></svg>`
    },
    {
        id: 'idle_apprentice',
        name: 'Младший Ученик',
        description: 'Прилежный ассистент фасует порошки и убирает лавку.',
        type: 'idle',
        category: 'production',
        baseCost: 100,
        costMultiplier: 1.30,
        baseValue: 6,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><circle cx="20" cy="16" r="6" fill="#ffeaa7"/><polygon points="12,12 28,12 20,2" fill="#6c5ce7"/><ellipse cx="20" cy="12" rx="10" ry="2" fill="#a29bfe"/><path d="M14 22 L26 22 L28 36 L12 36 Z" fill="#6c5ce7"/><circle cx="18" cy="16" r="1" fill="#2d3436"/><circle cx="22" cy="16" r="1" fill="#2d3436"/></svg>`
    },
    {
        id: 'click_gloves',
        name: 'Перчатки Алхимика',
        description: 'Руническая кожа защищает руки и ускоряет процесс.',
        type: 'click',
        category: 'click',
        baseCost: 200,
        costMultiplier: 1.30,
        baseValue: 5,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><path d="M12 18 C12 14 16 12 20 12 C24 12 28 14 28 18 L28 32 C28 34 26 36 24 36 L16 36 C14 36 12 34 12 32 Z" fill="#e17055" stroke="#d63031" stroke-width="2"/><path d="M12 22 L8 26 C7 27 7 29 8 30 C9 31 11 31 12 30 L15 27" fill="#e17055" stroke="#d63031" stroke-width="2"/><line x1="16" y1="28" x2="24" y2="28" stroke="#f1c40f" stroke-width="2"/><circle cx="20" cy="20" r="3" fill="#f1c40f"/></svg>`
    },
    {
        id: 'idle2',
        name: 'Огненный Саламандр',
        description: 'Дух пламени поддерживает идеальную температуру варки.',
        type: 'idle',
        category: 'production',
        baseCost: 750,
        costMultiplier: 1.30,
        baseValue: 35,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><path d="M10 28 Q15 8 28 8 Q22 18 30 30 Q20 24 10 28Z" fill="#ff7675" stroke="#d63031" stroke-width="2"/><circle cx="26" cy="10" r="2.5" fill="#f1c40f"/><path d="M16 22 Q20 14 24 22" stroke="#ffeaa7" stroke-width="2" fill="none"/></svg>`
    },
    {
        id: 'click2',
        name: 'Слова Силы',
        description: 'Древние рунические заклинания резонируют с кипящим котлом.',
        type: 'click',
        category: 'click',
        baseCost: 1500,
        costMultiplier: 1.30,
        baseValue: 25,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><rect x="8" y="10" width="24" height="22" rx="3" fill="#2d3436" stroke="#f1c40f" stroke-width="2"/><path d="M20 10 L20 32" stroke="#f1c40f" stroke-width="2"/><line x1="12" y1="16" x2="16" y2="16" stroke="#e74c3c" stroke-width="1.5"/><line x1="12" y1="22" x2="17" y2="22" stroke="#e74c3c" stroke-width="1.5"/><line x1="24" y1="16" x2="28" y2="16" stroke="#74b9ff" stroke-width="1.5"/><line x1="23" y1="22" x2="28" y2="22" stroke="#74b9ff" stroke-width="1.5"/></svg>`
    },
    {
        id: 'idle_distiller',
        name: 'Алхимический Дистиллятор',
        description: 'Медные змеевики очищают эликсиры до безупречной чистоты.',
        type: 'idle',
        category: 'production',
        baseCost: 5000,
        costMultiplier: 1.30,
        baseValue: 220,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><circle cx="16" cy="26" r="10" fill="#d35400" stroke="#e67e22" stroke-width="2"/><rect x="14" y="10" width="4" height="8" fill="#e67e22"/><path d="M16 10 C16 4 28 4 28 14 L28 28 L32 30" stroke="#f39c12" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="16" cy="26" r="4" fill="#f1c40f" opacity="0.8"/></svg>`
    },
    {
        id: 'click_crit',
        name: 'Критический Всплеск',
        description: '+3% шанс нанести сокрушительный критический клик с множителем x5!',
        type: 'crit',
        category: 'click',
        baseCost: 8000,
        costMultiplier: 1.30,
        baseValue: 3,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><polygon points="20,2 24,14 36,14 26,22 30,34 20,26 10,34 14,22 4,14 16,14" fill="#f1c40f" stroke="#e67e22" stroke-width="2"/><polygon points="20,8 22,15 30,15 24,20 26,28 20,23 14,28 16,20 10,15 18,15" fill="#e74c3c"/></svg>`
    },
    {
        id: 'idle_greenhouse',
        name: 'Зачарованная Теплица',
        description: 'Волшебный свет ускоряет созревание мандрагор и редких трав.',
        type: 'idle',
        category: 'production',
        baseCost: 35000,
        costMultiplier: 1.30,
        baseValue: 1400,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><polygon points="20,6 34,16 34,34 6,34 6,16" fill="#81ecec" stroke="#00cec9" stroke-width="2" fill-opacity="0.4"/><line x1="20" y1="6" x2="20" y2="34" stroke="#00cec9" stroke-width="1.5"/><line x1="6" y1="16" x2="34" y2="16" stroke="#00cec9" stroke-width="1.5"/><path d="M16 34 Q16 22 20 22 Q24 22 24 34" fill="#2ecc71"/><circle cx="20" cy="20" r="3" fill="#f1c40f"/></svg>`
    },
    {
        id: 'click_resonance',
        name: 'Катализатор Резонанса',
        description: 'Прибавляет +1% от текущего дохода в сек. к каждому клику!',
        type: 'resonance',
        category: 'click',
        baseCost: 50000,
        costMultiplier: 1.30,
        baseValue: 1,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><polygon points="20,4 28,18 20,36 12,18" fill="#a29bfe" stroke="#6c5ce7" stroke-width="2"/><line x1="20" y1="4" x2="20" y2="36" stroke="white" stroke-width="1.5" opacity="0.6"/><circle cx="6" cy="20" r="3" fill="none" stroke="#fd79a8" stroke-width="1.5"/><circle cx="34" cy="20" r="3" fill="none" stroke="#fd79a8" stroke-width="1.5"/><path d="M8 16 Q10 20 8 24" stroke="#fd79a8" stroke-width="1.5" fill="none"/><path d="M32 16 Q30 20 32 24" stroke="#fd79a8" stroke-width="1.5" fill="none"/></svg>`
    },
    {
        id: 'idle_homunculus',
        name: 'Цех Гомункулов',
        description: 'Искусственные алхимические рабочие варят оптовые партии зелий.',
        type: 'idle',
        category: 'production',
        baseCost: 250000,
        costMultiplier: 1.30,
        baseValue: 9000,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><rect x="12" y="10" width="16" height="24" rx="8" fill="#a29bfe" stroke="#6c5ce7" stroke-width="2" fill-opacity="0.4"/><circle cx="20" cy="20" r="4" fill="#fd79a8"/><circle cx="18" cy="19" r="1" fill="#2d3436"/><circle cx="22" cy="19" r="1" fill="#2d3436"/><ellipse cx="20" cy="28" rx="5" ry="3" fill="#6c5ce7"/><rect x="16" y="6" width="8" height="4" rx="1" fill="#d63031"/></svg>`
    },
    {
        id: 'idle_rift',
        name: 'Астральный Разлом',
        description: 'Портал напрямую выкачивает чистую ману эфира в вашу казну.',
        type: 'idle',
        category: 'production',
        baseCost: 2000000,
        costMultiplier: 1.30,
        baseValue: 60000,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><ellipse cx="20" cy="20" rx="18" ry="8" stroke="#fd79a8" stroke-width="2" transform="rotate(-30 20 20)"/><ellipse cx="20" cy="20" rx="14" ry="6" stroke="#a29bfe" stroke-width="2" transform="rotate(30 20 20)"/><circle cx="20" cy="20" r="5" fill="#2d1b4e" stroke="#ffeaa7" stroke-width="1.5"/><circle cx="20" cy="20" r="2" fill="#ffeaa7"/></svg>`
    },
    {
        id: 'idle_hearth',
        name: 'Укрепленный Очаг',
        description: 'Магический очаг удерживает жар: увеличивает максимальное время офлайн-дохода (+1 час за уровень).',
        type: 'hearth',
        category: 'mastery',
        baseCost: 12000,
        costMultiplier: 1.30,
        baseValue: 1,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><rect x="8" y="24" width="24" height="12" rx="3" fill="#636e72" stroke="#2d3436" stroke-width="2"/><path d="M14 24 Q20 12 26 24" fill="#2d3436"/><path d="M16 26 Q20 16 24 26" fill="#e17055"/><circle cx="20" cy="24" r="3" fill="#f1c40f"/><path d="M12 12 Q20 4 28 12" stroke="#e67e22" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`
    },
    {
        id: 'click_heat',
        name: 'Магический Разогрев',
        description: 'Серия быстрых кликов разжигает котёл: ускоряет нагрев, замедляет остывание и даёт до +150% к комбо-множителю!',
        type: 'heat',
        category: 'mastery',
        baseCost: 25000,
        costMultiplier: 1.30,
        baseValue: 1,
        level: 0,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36" fill="none"><path d="M20 4 C16 12 10 16 10 24 C10 30 14 36 20 36 C26 36 30 30 30 24 C30 18 26 12 20 4 Z" fill="#ff7675" stroke="#d63031" stroke-width="2"/><path d="M20 14 C17 19 14 22 14 27 C14 30 17 33 20 33 C23 33 26 30 26 27 C26 23 23 19 20 14 Z" fill="#f1c40f"/><circle cx="20" cy="28" r="3" fill="#fff"/></svg>`
    }
];

const defaultSecretUpgrades: SecretUpgrade[] = [
    { id: 'magnet', name: 'Магический Магнит', description: '+2% шанс кристалла за клик', baseCost: 10, costMultiplier: 1.5, level: 0, maxLevel: 5 },
    { id: 'alchemy', name: 'Повелитель Котлов', description: '+1 право на ошибку при варке', baseCost: 15, costMultiplier: 2.0, level: 0, maxLevel: 2 },
    { id: 'orders', name: 'Щедрые Клиенты', description: '+20% золота за заказы', baseCost: 20, costMultiplier: 1.8, level: 0, maxLevel: 10 },
    { id: 'wallet', name: 'Тяжелый Кошелек', description: '+100 золота после ритуала', baseCost: 5, costMultiplier: 2.0, level: 0, maxLevel: 5 },
    { id: 'familiar', name: 'Аура Фамильяра', description: '+15% пассивного дохода', baseCost: 30, costMultiplier: 1.7, level: 0, maxLevel: 10 }
];

export const AVAILABLE_ARTIFACTS: Artifact[] = [
    {
        id: 0,
        name: 'Свиток жадности',
        description: '+20% к пассивному доходу',
        cost: 50,
        svg: `<svg viewBox="0 0 100 100"><rect x="30" y="10" width="40" height="80" fill="#f1c40f" rx="5"/><line x1="35" y1="20" x2="65" y2="20" stroke="#d35400" stroke-width="4"/><line x1="35" y1="35" x2="65" y2="35" stroke="#d35400" stroke-width="4"/><line x1="35" y1="50" x2="65" y2="50" stroke="#d35400" stroke-width="4"/></svg>`
    },
    {
        id: 1,
        name: 'Кольцо мощи',
        description: '+20% к силе клика',
        cost: 150,
        svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="#f39c12" stroke-width="10"/><circle cx="50" cy="20" r="12" fill="#e74c3c"/></svg>`
    },
    {
        id: 2,
        name: 'Амулет времени',
        description: 'Увеличивает макс. время офлайн-дохода до 12 ч',
        cost: 500,
        svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="#34495e" stroke="#ecf0f1" stroke-width="5"/><circle cx="50" cy="50" r="3" fill="#ecf0f1"/><line x1="50" y1="50" x2="50" y2="25" stroke="#ecf0f1" stroke-width="4" stroke-linecap="round"/><line x1="50" y1="50" x2="65" y2="65" stroke="#ecf0f1" stroke-width="4" stroke-linecap="round"/></svg>`
    },
    // Archmage Set
    {
        id: 3,
        name: 'Мантия Архимага',
        description: '+35% к пассивному доходу',
        cost: 1500,
        svg: `<svg viewBox="0 0 100 100"><path d="M50 10 L80 90 L20 90 Z" fill="#9b59b6" stroke="#8e44ad" stroke-width="3"/><path d="M50 10 L65 90 L35 90 Z" fill="#8e44ad"/><circle cx="50" cy="40" r="8" fill="#f1c40f"/></svg>`
    },
    {
        id: 4,
        name: 'Посох Архимага',
        description: '+60% к силе клика',
        cost: 3000,
        svg: `<svg viewBox="0 0 100 100"><rect x="45" y="20" width="10" height="70" fill="#7f8c8d" rx="4"/><circle cx="50" cy="15" r="12" fill="#3498db" stroke="#2980b9" stroke-width="4"/><circle cx="50" cy="15" r="5" fill="#ecf0f1"/></svg>`
    },
    {
        id: 5,
        name: 'Шляпа Архимага',
        description: '+2 часа к макс. офлайн-времени',
        cost: 5000,
        svg: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="80" rx="40" ry="10" fill="#2c3e50"/><polygon points="20,75 80,75 50,10" fill="#34495e"/><polygon points="35,75 65,75 50,10" fill="#2c3e50"/><path d="M30 70 Q50 85 70 70" fill="none" stroke="#f1c40f" stroke-width="4"/></svg>`
    },
    {
        id: 6,
        name: 'Кольцо Архимага',
        description: '+35% к пассивному доходу',
        cost: 8000,
        svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="#9b59b6" stroke-width="8"/><circle cx="50" cy="20" r="14" fill="#3498db" stroke="#2980b9" stroke-width="3"/><polygon points="50,10 55,20 65,25 55,30 50,40 45,30 35,25 45,20" fill="#ecf0f1" opacity="0.8"/></svg>`
    },
    {
        id: 7,
        name: 'Око Архимага',
        description: '+100% к пассивному доходу',
        cost: 15000,
        svg: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="40" ry="25" fill="#ecf0f1" stroke="#f39c12" stroke-width="5"/><circle cx="50" cy="50" r="18" fill="#e74c3c"/><circle cx="50" cy="50" r="6" fill="#c0392b"/><circle cx="55" cy="45" r="4" fill="white"/></svg>`
    }
];

export const AVAILABLE_COLLECTIONS: Collection[] = [
    {
        id: 'archmage_set',
        name: 'Наследие Архимага',
        requiredArtifactIds: [3, 4, 5, 6, 7],
        rewardPetId: 'pet_astral_dragon'
    }
];

export const AVAILABLE_PETS: Pet[] = [
    {
        id: 'pet_slime',
        name: 'Слайм',
        rarity: 'common',
        description: 'Приносит немного базовых ингредиентов (1 час).',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><path d="M20 10 Q35 15 35 30 Q35 35 20 35 Q5 35 5 30 Q5 15 20 10Z" fill="#55efc4" opacity="0.8"/><circle cx="15" cy="22" r="3" fill="#2d3436"/><circle cx="25" cy="22" r="3" fill="#2d3436"/></svg>`
    },
    {
        id: 'pet_spirit',
        name: 'Лесной Дух',
        rarity: 'rare',
        description: 'Может найти редкие травы (3 часа).',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><ellipse cx="20" cy="20" rx="10" ry="15" fill="#74b9ff" opacity="0.7"/><circle cx="16" cy="18" r="2" fill="white"/><circle cx="24" cy="18" r="2" fill="white"/><path d="M20 25 Q20 35 10 38" stroke="#74b9ff" stroke-width="2" fill="none"/></svg>`
    },
    {
        id: 'pet_gryphon',
        name: 'Мини-Грифон',
        rarity: 'epic',
        description: 'Приносит ценные артефакты с гор (6 часов).',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><path d="M10 20 L20 10 L30 20 L20 30 Z" fill="#f1c40f"/><circle cx="15" cy="18" r="2" fill="black"/><path d="M20 20 L35 10 L30 25 Z" fill="#e67e22"/></svg>`
    },
    {
        id: 'pet_dragon',
        name: 'Дракончик',
        rarity: 'legendary',
        description: 'Легендарные сокровища и пыльца (12 часов)!',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><path d="M5 25 Q20 5 35 25 Q20 35 5 25Z" fill="#d63031"/><circle cx="15" cy="20" r="2" fill="#f1c40f"/><circle cx="25" cy="20" r="2" fill="#f1c40f"/><path d="M5 25 L10 10 L15 25 Z" fill="#ff7675"/><path d="M35 25 L30 10 L25 25 Z" fill="#ff7675"/></svg>`
    },
    {
        id: 'pet_astral_dragon',
        name: 'Астральный Дракончик',
        rarity: 'legendary',
        description: 'Уникальный питомец Сета Архимага. Находит редчайшие материалы из пустоты.',
        icon: `<svg viewBox="0 0 40 40" width="40" height="40"><defs><radialGradient id="astralGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#9b59b6"/><stop offset="100%" stop-color="#2c3e50"/></radialGradient></defs><path d="M5 25 Q20 5 35 25 Q20 35 5 25Z" fill="url(#astralGrad)"/><circle cx="15" cy="20" r="2" fill="#00cec9"/><circle cx="25" cy="20" r="2" fill="#00cec9"/><path d="M5 25 L10 10 L15 25 Z" fill="#6c5ce7"/><path d="M35 25 L30 10 L25 25 Z" fill="#6c5ce7"/></svg>`
    }
];

const defaultState: GameState = {
    gold: 10,
    lastSaveTime: Date.now(),
    stardust: 0,
    artifacts: [],
    upgrades: defaultUpgrades,
    secretUpgrades: defaultSecretUpgrades,
    lastQuestDate: new Date().toDateString(),
    quests: [],
    unlockedPets: ['pet_rat'],
    activeExpeditions: [],
    activeOrders: [],
    lastOrderSpawnTime: Date.now(),
    activeBuffs: [],
    unlockedCollections: [],
    lastFreeChestTime: 0
};

// --- Premium stores ---
export const crystals = writable<number>(0);
export const isVip    = writable<boolean>(false);

function generateQuests(): Quest[] {
    const clickTarget    = Math.floor(Math.random() * 3 + 2) * 100;
    const upgradesTarget = Math.floor(Math.random() * 3 + 2);
    const adsTarget      = Math.floor(Math.random() * 2 + 1);
    return [
        { id: 'q1_' + Date.now(), type: 'clicks',        target: clickTarget,    current: 0, reward: Math.floor(clickTarget / 100), isCompleted: false, isClaimed: false },
        { id: 'q2_' + Date.now(), type: 'buy_upgrades',  target: upgradesTarget, current: 0, reward: upgradesTarget * 2,            isCompleted: false, isClaimed: false },
        { id: 'q3_' + Date.now(), type: 'watch_ads',     target: adsTarget,      current: 0, reward: adsTarget * 5,                isCompleted: false, isClaimed: false },
    ];
}

function createGameStore() {
    const { subscribe, set, update } = writable<GameState>(defaultState);

    return {
        subscribe,
        set,
        update,
        addGold:        (amount: number) => update(state => ({ ...state, gold: state.gold + amount })),
        setLastSaveTime:(time: number)   => update(state => ({ ...state, lastSaveTime: time })),
        recordFreeChest:() => update(state => ({ ...state, lastFreeChestTime: Date.now() })),
        checkDailyQuests: () => update(state => {
            const today = new Date().toISOString().split('T')[0];
            if (state.lastQuestDate !== today) {
                return { ...state, lastQuestDate: today, quests: generateQuests() };
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
                return {
                    ...state,
                    stardust: state.stardust + quest.reward,
                    quests: state.quests.map(q => q.id === id ? { ...q, isClaimed: true } : q)
                };
            }
            return state;
        }),
        performRebirth: () => update(state => {
            const earnedStardust = Math.floor(state.gold / 1_000_000);
            
            // Secret Upgrade: Тяжелый Кошелек (+100 start gold per level)
            const walletLevel = state.secretUpgrades.find(u => u.id === 'wallet')?.level || 0;
            const startingGold = walletLevel * 100;

            return {
                ...state,
                gold: startingGold,
                upgrades: state.upgrades.map(u => ({ ...u, level: 0 })),
                // Тайные знания не сбрасываются!
                stardust: state.stardust + earnedStardust
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
        buyUpgrade: (id: string) => update(state => {
            const upgradeIndex = state.upgrades.findIndex(u => u.id === id);
            if (upgradeIndex !== -1) {
                const upgrade = state.upgrades[upgradeIndex];
                const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
                if (state.gold >= cost) {
                    const newUpgrades = [...state.upgrades];
                    newUpgrades[upgradeIndex] = { ...upgrade, level: upgrade.level + 1 };
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
                newUpgrades[upgradeIndex] = { ...upgrade, level: upgrade.level + count };
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
                    newUpgrades[upgradeIndex] = { ...upgrade, level: upgrade.level + 1 };
                    return { ...state, stardust: state.stardust - cost, secretUpgrades: newUpgrades };
                }
            }
            return state;
        });
    },
        unlockPet: (petId: string) => update(state => {
            if (!state.unlockedPets.includes(petId)) {
                return { ...state, unlockedPets: [...state.unlockedPets, petId] };
            }
            return state;
        }),
        startExpedition: (petId: string, durationHours: number) => update(state => {
            if (state.activeExpeditions.some(e => e.petId === petId)) return state;
            return {
                ...state,
                activeExpeditions: [
                    ...state.activeExpeditions,
                    { petId, startTime: Date.now(), durationMs: durationHours * 3600 * 1000 }
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
        claimExpedition: (petId: string) => update(state => {
            return {
                ...state,
                activeExpeditions: state.activeExpeditions.filter(e => e.petId !== petId)
            };
        }),
        spawnOrder: () => update(state => {
            if (state.activeOrders.length >= 4) return state; // Max 4 orders
            
            const isVip = Math.random() < 0.2; // 20% chance for VIP
            const isPotionReq = Math.random() < 0.5;
            const reqs: OrderRequirement[] = [];
            
            let rewardGold = Math.floor(Math.random() * 100) + 50;
            let rewardStardust = 0;

            if (isPotionReq) {
                // Pick a random potion
                const potionId = AVAILABLE_POTIONS[Math.floor(Math.random() * AVAILABLE_POTIONS.length)].id;
                reqs.push({ type: 'potion', id: potionId, count: 1 });
                rewardGold += 300;
                if (isVip) rewardStardust += 2;
            } else {
                // Pick random ingredients
                for (let i = 0; i < 2; i++) {
                    const ing = AVAILABLE_INGREDIENTS[Math.floor(Math.random() * AVAILABLE_INGREDIENTS.length)];
                    reqs.push({ type: 'ingredient', id: ing.id, count: Math.floor(Math.random() * 3) + 1 });
                    rewardGold += 50;
                }
            }

            if (isVip) {
                rewardGold *= 3; // VIP pays 3x
                rewardStardust += 5;
            }

            const names = ['Странствующий Маг', 'Алхимик-ученик', 'Рыцарь', 'Местный Житель'];
            const vipNames = ['Королевский Посланник', 'Архимаг', 'Герой', 'Богатый Торговец'];

            const newOrder: CustomerOrder = {
                id: 'ord_' + Date.now() + Math.floor(Math.random() * 1000),
                name: isVip ? vipNames[Math.floor(Math.random() * vipNames.length)] : names[Math.floor(Math.random() * names.length)],
                icon: isVip ? 'vip' : 'mage',
                requirements: reqs,
                rewardGold,
                rewardStardust,
                isVip
            };

            return {
                ...state,
                activeOrders: [...state.activeOrders, newOrder],
                lastOrderSpawnTime: Date.now()
            };
        }),
        completeOrder: (orderId: string) => update(state => {
            const order = state.activeOrders.find(o => o.id === orderId);
            if (!order) return state;

            // Secret Upgrade: Щедрые Клиенты (+20% gold per level)
            const ordersLevel = state.secretUpgrades.find(u => u.id === 'orders')?.level || 0;
            const goldMultiplier = 1 + (ordersLevel * 0.20);
            const finalGold = Math.floor(order.rewardGold * goldMultiplier);

            // Give rewards
            return {
                ...state,
                gold: state.gold + finalGold,
                stardust: state.stardust + order.rewardStardust,
                activeOrders: state.activeOrders.filter(o => o.id !== orderId)
            };
        }),
        dismissOrder: (orderId: string) => update(state => {
            return {
                ...state,
                activeOrders: state.activeOrders.filter(o => o.id !== orderId)
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

            const newBuff: ActiveBuff = {
                potionId,
                expiresAt: Date.now() + potion.durationMin * 60 * 1000,
                effect: potion.effect,
                value: potion.value
            };

            return {
                ...state,
                activeBuffs: [...state.activeBuffs, newBuff]
            };
        }),
        removeExpiredBuffs: () => update(state => {
            const now = Date.now();
            const validBuffs = state.activeBuffs.filter(b => b.expiresAt > now);
            if (validBuffs.length !== state.activeBuffs.length) {
                return { ...state, activeBuffs: validBuffs };
            }
            return state;
        })
    };
}

export const gameStore = createGameStore();

// ============================================================
// DERIVED STORES
// ============================================================

export const totalUpgradeLevels = derived(gameStore, $gameStore => {
    return $gameStore.upgrades.reduce((sum, u) => sum + u.level, 0);
});

export const milestoneInfo = derived(totalUpgradeLevels, $totalLevels => {
    const tier = Math.floor($totalLevels / 25);
    const multiplier = Math.pow(1.25, tier);
    const progress = $totalLevels % 25;
    const nextTarget = (tier + 1) * 25;
    return {
        tier,
        multiplier,
        progress,
        nextTarget,
        totalLevels: $totalLevels
    };
});

export const heatBonusLevel = derived(gameStore, $gameStore => {
    return $gameStore.upgrades.find(u => u.id === 'click_heat')?.level || 0;
});

export const globalIdleMultiplier = derived([gameStore, isVip, milestoneInfo], ([$gameStore, $isVip, $milestone]) => {
    let multiplier = 1 * $milestone.multiplier;
    
    // Original artifacts
    if ($gameStore.artifacts.includes(0)) multiplier += 0.20; // Scroll of Greed
    // Archmage set artifacts
    if ($gameStore.artifacts.includes(3)) multiplier += 0.35; // Archmage Robe
    if ($gameStore.artifacts.includes(6)) multiplier += 0.35; // Archmage Ring
    if ($gameStore.artifacts.includes(7)) multiplier += 1.00; // Archmage Eye
    // Archmage Set Completion Bonus
    if ($gameStore.unlockedCollections.includes('archmage_set')) multiplier += 1.50;
    
    if ($isVip) multiplier *= 2;
    
    // Apply active buffs
    for (const buff of $gameStore.activeBuffs) {
        if (buff.effect === 'idle_multiplier') multiplier += buff.value;
        if (buff.effect === 'gold_multiplier') multiplier += buff.value;
    }
    
    // Apply stardust prestige multiplier (+2% per stardust)
    multiplier += $gameStore.stardust * 0.02;
    
    return multiplier;
});

export const globalClickMultiplier = derived([gameStore, isVip, milestoneInfo], ([$gameStore, $isVip, $milestone]) => {
    let multiplier = 1 * $milestone.multiplier;
    
    // Original artifacts
    if ($gameStore.artifacts.includes(1)) multiplier += 0.20; // Ring of Power
    // Archmage set artifacts
    if ($gameStore.artifacts.includes(4)) multiplier += 0.60; // Archmage Staff
    // Archmage Set Completion Bonus
    if ($gameStore.unlockedCollections.includes('archmage_set')) multiplier += 1.00;
    
    if ($isVip) multiplier *= 2;

    // Apply active buffs
    for (const buff of $gameStore.activeBuffs) {
        if (buff.effect === 'click_multiplier') multiplier += buff.value;
        if (buff.effect === 'gold_multiplier') multiplier += buff.value;
    }

    // Apply stardust prestige multiplier (+2% per stardust)
    multiplier += $gameStore.stardust * 0.02;

    return multiplier;
});

// Update max offline time to account for new artifacts and hearth upgrade
export const maxOfflineTimeHours = derived(gameStore, $gameStore => {
    let hours = 2; // base
    const hearthUpgrade = $gameStore.upgrades.find(u => u.id === 'idle_hearth');
    if (hearthUpgrade && hearthUpgrade.level > 0) {
        hours += hearthUpgrade.level; // +1 hour per level
    }
    if ($gameStore.artifacts.includes(2)) hours = Math.max(hours, 12); // Time Amulet
    if ($gameStore.artifacts.includes(5)) hours += 2; // Archmage Hat (+2 hours)
    return hours;
});

export const currentIdleIncome = derived([gameStore, globalIdleMultiplier], ([$gameStore, $idleMult]) => {
    let totalIdle = 0;
    $gameStore.upgrades.forEach(u => {
        if (u.type === 'idle') totalIdle += u.baseValue * u.level;
    });

    // Secret Upgrade: Аура Фамильяра (+15% passive income per level)
    const familiarLevel = $gameStore.secretUpgrades.find(u => u.id === 'familiar')?.level || 0;
    const familiarMultiplier = 1 + (familiarLevel * 0.15);

    return totalIdle * $idleMult * familiarMultiplier;
});

export const critChance = derived(gameStore, ($gameStore) => {
    const critUpgrade = $gameStore.upgrades.find(u => u.id === 'click_crit');
    if (!critUpgrade || critUpgrade.level <= 0) return 0;
    // 3% chance per level, capped at 50%
    return Math.min(0.50, critUpgrade.level * 0.03);
});

export const resonanceBonus = derived([gameStore, currentIdleIncome], ([$gameStore, $idleIncome]) => {
    const resUpgrade = $gameStore.upgrades.find(u => u.id === 'click_resonance');
    if (!resUpgrade || resUpgrade.level <= 0) return 0;
    // +1% of current idle income per level
    return Math.floor($idleIncome * (resUpgrade.level * 0.01));
});

export const currentClickPower = derived([gameStore, globalClickMultiplier, resonanceBonus], ([$gameStore, $clickMult, $resonanceBonus]) => {
    let totalClick = 1;
    $gameStore.upgrades.forEach(u => {
        if (u.type === 'click') totalClick += u.baseValue * u.level;
    });
    return Math.max(1, Math.floor((totalClick + $resonanceBonus) * $clickMult));
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
    return $gameStore.quests.filter(q => q.isCompleted && !q.isClaimed).length;
});

export const freeChestCooldownRemaining = derived(gameStore, $state => {
    const last = $state.lastFreeChestTime || 0;
    const cooldown = 20 * 60 * 1000;
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
        id: 'recipe_wealth',
        ingredients: ['mushroom_gray', 'stardew', 'dragon_scale'],
        resultPotionId: 'potion_wealth',
        rarity: 'rare',
    },
    {
        id: 'recipe_void',
        ingredients: ['void_essence', 'philosophers_tear', 'time_crystal'],
        resultPotionId: 'potion_void',
        rarity: 'epic',
    },
];

/** Crystal costs to reveal each successive hint (0→1, 1→2, 2→3) */
export const HINT_COSTS = [10, 30, 75] as const;

/**
 * unlockedRecipes: Record<recipeId, hintLevel>
 *   0 = fully locked (all ???)
 *   1 = first ingredient revealed
 *   2 = first two revealed
 *   3 = fully unlocked
 */
export const unlockedRecipes = writable<Record<string, number>>({});

/** How many consecutive wrong brews have been made (resets on success or burn) */
export const failedBrewAttempts = writable<number>(0);

/**
 * Attempt to brew a potion from exactly 3 ingredient slots.
 * Returns: 'success' | 'warning' | 'burn'
 *   - success: correct recipe → ingredients consumed, potion added
 *   - warning: wrong recipe, attempts 1–2 → ingredients NOT consumed, counter incremented
 *   - burn:    wrong recipe, attempt 3 → ingredients consumed/burned, counter resets
 */
export function brewPotion(slots: [string, string, string]): 'success' | 'warning' | 'burn' {
    const sorted = [...slots].sort();
    const recipe = RECIPES.find(r => {
        const rs = [...r.ingredients].sort();
        return rs.every((ing, i) => ing === sorted[i]);
    });

    if (recipe) {
        // ✅ Correct recipe — consume and reward
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
            [recipe.resultPotionId]: (c[recipe.resultPotionId] ?? 0) + 1,
        }));
        failedBrewAttempts.set(0);
        unlockedRecipes.update(r => ({ ...r, [recipe.id]: 3 }));
        return 'success';
    }

    // ❌ Wrong recipe
    const current = get(failedBrewAttempts);
    const next = current + 1;
    
    // Secret Upgrade: Повелитель Котлов (+1 max attempt per level, max 2)
    const alchemyLevel = get(gameStore).secretUpgrades.find(u => u.id === 'alchemy')?.level || 0;
    const maxFailures = 3 + alchemyLevel;

    if (next >= maxFailures) {
        // 🔥 Burn ingredients
        ingredientsCount.update(c => {
            const nextC = { ...c };
            for (const ing of slots) {
                nextC[ing] = (nextC[ing] ?? 0) - 1;
                if (nextC[ing] <= 0) delete nextC[ing];
            }
            return nextC;
        });
        failedBrewAttempts.set(0);
        return 'burn';
    }

    failedBrewAttempts.set(next);
    return 'warning';
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
