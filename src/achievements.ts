// ============================================================
// MAGIC SHOP TYCOON — HALL OF FAME & ACHIEVEMENTS SYSTEM
// Pure SVG Icons, Tier 1..5 Progression, Passive Perks & Titles
// ============================================================

import type { GameState } from './store';

export type AchievementId = 
    | 'brew_master'       // Сварено зелий
    | 'gold_hoarder'      // Всего заработано золота
    | 'relic_seeker'      // Открыто артефактов/реликвий
    | 'grand_ritual'      // Совершено ритуалов возрождения
    | 'order_supplier'    // Выполнено заказов жителей
    | 'beast_whisperer'   // Открыто питомцев
    | 'wheel_of_fate'     // Вращений Колеса Фортуны
    | 'upgrade_master';   // Уровней улучшений куплено

export type PerkType = 'gold_mult' | 'stardust_mult' | 'double_brew' | 'orders_gold' | 'click_power';

export interface AchievementTier {
    tier: number;            // 1..5
    target: number;          // Порог прогресса
    stardustReward: number;  // Награда пылью
    crystalsReward: number;  // Награда кристаллами
    perkType: PerkType;      // Тип пассивного бонуса
    perkValue: number;       // Величина бонуса (+0.02 = +2%)
}

export interface AchievementDef {
    id: AchievementId;
    iconSvg: string;
    tiers: AchievementTier[];
}

export interface ArchmageTitle {
    minStars: number;
    titleKey: string;
    badgeColor: string;
    glowColor: string;
}

// 6 Титулов Архимага по сумме собранных звёзд (всего 8 * 5 = 40 звёзд)
export const ARCHMAGE_TITLES: ArchmageTitle[] = [
    { minStars: 0,  titleKey: 'apprentice', badgeColor: '#a5b1c2', glowColor: 'rgba(165, 177, 194, 0.4)' },
    { minStars: 6,  titleKey: 'adept',      badgeColor: '#45aaf2', glowColor: 'rgba(69, 170, 242, 0.5)' },
    { minStars: 13, titleKey: 'master',     badgeColor: '#a55eea', glowColor: 'rgba(165, 94, 234, 0.5)' },
    { minStars: 21, titleKey: 'high_alchemist', badgeColor: '#fa8231', glowColor: 'rgba(250, 130, 49, 0.5)' },
    { minStars: 29, titleKey: 'dimension_keeper', badgeColor: '#2bcbba', glowColor: 'rgba(43, 203, 186, 0.5)' },
    { minStars: 37, titleKey: 'grand_archmage', badgeColor: '#fed330', glowColor: 'rgba(254, 211, 48, 0.6)' }
];

export const ACHIEVEMENTS: AchievementDef[] = [
    // 1. Мастер Котла (Сварено зелий)
    {
        id: 'brew_master',
        iconSvg: `<svg viewBox="0 0 32 32" width="28" height="28" fill="none">
            <path d="M7 13 C7 25 25 25 25 13 L27 10 H5 L7 13 Z" fill="#2d134d" stroke="#a29bfe" stroke-width="1.5"/>
            <path d="M10 13 Q16 10 22 13 Q16 16 10 13 Z" fill="#00cec9"/>
            <circle cx="13" cy="8" r="1.5" fill="#55efc4"/>
            <circle cx="18" cy="6" r="2" fill="#81ecec"/>
            <circle cx="15" cy="4" r="1" fill="#fff"/>
            <path d="M9 22 L6 26 M23 22 L26 26" stroke="#fdcb6e" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
        tiers: [
            { tier: 1, target: 10,    stardustReward: 5,   crystalsReward: 15,  perkType: 'double_brew', perkValue: 0.02 },
            { tier: 2, target: 50,    stardustReward: 15,  crystalsReward: 35,  perkType: 'double_brew', perkValue: 0.02 },
            { tier: 3, target: 250,   stardustReward: 40,  crystalsReward: 80,  perkType: 'double_brew', perkValue: 0.02 },
            { tier: 4, target: 1000,  stardustReward: 100, crystalsReward: 180, perkType: 'double_brew', perkValue: 0.02 },
            { tier: 5, target: 5000,  stardustReward: 250, crystalsReward: 400, perkType: 'double_brew', perkValue: 0.02 }
        ]
    },
    // 2. Златой Алхимик (Всего заработано золота)
    {
        id: 'gold_hoarder',
        iconSvg: `<svg viewBox="0 0 32 32" width="28" height="28" fill="none">
            <path d="M16 4 L22 10 L27 8 L24 16 L29 20 L22 23 L20 29 L16 24 L12 29 L10 23 L3 20 L8 16 L5 8 L10 10 Z" fill="#f39c12" stroke="#f1c40f" stroke-width="1.2"/>
            <circle cx="16" cy="16" r="6" fill="#f1c40f" stroke="#fff" stroke-width="1"/>
            <text x="16" y="20" font-size="10" font-weight="bold" fill="#795548" text-anchor="middle">G</text>
        </svg>`,
        tiers: [
            { tier: 1, target: 10_000,          stardustReward: 5,   crystalsReward: 15,  perkType: 'gold_mult', perkValue: 0.01 },
            { tier: 2, target: 500_000,         stardustReward: 15,  crystalsReward: 35,  perkType: 'gold_mult', perkValue: 0.01 },
            { tier: 3, target: 25_000_000,      stardustReward: 40,  crystalsReward: 80,  perkType: 'gold_mult', perkValue: 0.01 },
            { tier: 4, target: 1_000_000_000,   stardustReward: 100, crystalsReward: 200, perkType: 'gold_mult', perkValue: 0.01 },
            { tier: 5, target: 100_000_000_000, stardustReward: 300, crystalsReward: 500, perkType: 'gold_mult', perkValue: 0.01 }
        ]
    },
    // 3. Хранитель Древностей (Открыто реликвий за пыль)
    {
        id: 'relic_seeker',
        iconSvg: `<svg viewBox="0 0 32 32" width="28" height="28" fill="none">
            <polygon points="16,3 27,9 27,23 16,29 5,23 5,9" fill="#1e272e" stroke="#00d2d3" stroke-width="1.5"/>
            <circle cx="16" cy="16" r="6" fill="#01a3a4" stroke="#54a0ff" stroke-width="1.2"/>
            <polygon points="16,12 19,16 16,20 13,16" fill="#fff"/>
            <line x1="16" y1="3" x2="16" y2="10" stroke="#00d2d3" stroke-width="1"/>
            <line x1="16" y1="22" x2="16" y2="29" stroke="#00d2d3" stroke-width="1"/>
        </svg>`,
        tiers: [
            { tier: 1, target: 1,  stardustReward: 10,  crystalsReward: 20,  perkType: 'gold_mult', perkValue: 0.02 },
            { tier: 2, target: 3,  stardustReward: 25,  crystalsReward: 45,  perkType: 'gold_mult', perkValue: 0.02 },
            { tier: 3, target: 6,  stardustReward: 60,  crystalsReward: 100, perkType: 'gold_mult', perkValue: 0.02 },
            { tier: 4, target: 10, stardustReward: 120, crystalsReward: 220, perkType: 'gold_mult', perkValue: 0.02 },
            { tier: 5, target: 15, stardustReward: 300, crystalsReward: 500, perkType: 'gold_mult', perkValue: 0.02 }
        ]
    },
    // 4. Вечный Архимаг (Совершено ритуалов возрождения)
    {
        id: 'grand_ritual',
        iconSvg: `<svg viewBox="0 0 32 32" width="28" height="28" fill="none">
            <circle cx="16" cy="16" r="13" stroke="#e056fd" stroke-width="1.5" stroke-dasharray="3 2"/>
            <polygon points="16,5 25,22 7,22" stroke="#be2edd" stroke-width="1.5" fill="rgba(190, 46, 221, 0.15)"/>
            <polygon points="16,27 7,10 25,10" stroke="#f0932b" stroke-width="1.5" fill="rgba(240, 147, 43, 0.15)"/>
            <circle cx="16" cy="16" r="3" fill="#ffbe76" stroke="#fff" stroke-width="0.8"/>
        </svg>`,
        tiers: [
            { tier: 1, target: 1,  stardustReward: 20,  crystalsReward: 30,  perkType: 'stardust_mult', perkValue: 0.03 },
            { tier: 2, target: 3,  stardustReward: 50,  crystalsReward: 70,  perkType: 'stardust_mult', perkValue: 0.03 },
            { tier: 3, target: 6,  stardustReward: 120, crystalsReward: 150, perkType: 'stardust_mult', perkValue: 0.03 },
            { tier: 4, target: 12, stardustReward: 250, crystalsReward: 300, perkType: 'stardust_mult', perkValue: 0.03 },
            { tier: 5, target: 25, stardustReward: 600, crystalsReward: 650, perkType: 'stardust_mult', perkValue: 0.03 }
        ]
    },
    // 5. Купец Арканума (Выполнено заказов жителей)
    {
        id: 'order_supplier',
        iconSvg: `<svg viewBox="0 0 32 32" width="28" height="28" fill="none">
            <rect x="6" y="5" width="20" height="22" rx="3" fill="#2c3e50" stroke="#f1c40f" stroke-width="1.5"/>
            <line x1="10" y1="10" x2="22" y2="10" stroke="#f1c40f" stroke-width="1.5"/>
            <line x1="10" y1="15" x2="19" y2="15" stroke="#ecf0f1" stroke-width="1.2"/>
            <line x1="10" y1="19" x2="17" y2="19" stroke="#ecf0f1" stroke-width="1.2"/>
            <circle cx="21" cy="22" r="3.5" fill="#e74c3c" stroke="#fff" stroke-width="0.8"/>
            <path d="M19.5 22 L20.5 23 L22.5 21" stroke="#fff" stroke-width="1" stroke-linecap="round"/>
        </svg>`,
        tiers: [
            { tier: 1, target: 5,   stardustReward: 5,   crystalsReward: 15,  perkType: 'orders_gold', perkValue: 0.03 },
            { tier: 2, target: 25,  stardustReward: 15,  crystalsReward: 40,  perkType: 'orders_gold', perkValue: 0.03 },
            { tier: 3, target: 75,  stardustReward: 40,  crystalsReward: 90,  perkType: 'orders_gold', perkValue: 0.03 },
            { tier: 4, target: 200, stardustReward: 100, crystalsReward: 200, perkType: 'orders_gold', perkValue: 0.03 },
            { tier: 5, target: 500, stardustReward: 250, crystalsReward: 450, perkType: 'orders_gold', perkValue: 0.03 }
        ]
    },
    // 6. Повелитель Зверей (Открыто питомцев)
    {
        id: 'beast_whisperer',
        iconSvg: `<svg viewBox="0 0 32 32" width="28" height="28" fill="none">
            <ellipse cx="16" cy="20" rx="7" ry="6" fill="#f39c12" stroke="#e67e22" stroke-width="1.2"/>
            <circle cx="9" cy="11" r="3.5" fill="#f39c12"/>
            <circle cx="14" cy="9" r="3" fill="#f39c12"/>
            <circle cx="18" cy="9" r="3" fill="#f39c12"/>
            <circle cx="23" cy="11" r="3.5" fill="#f39c12"/>
            <path d="M12 21 Q16 24 20 21" stroke="#795548" stroke-width="1" stroke-linecap="round"/>
        </svg>`,
        tiers: [
            { tier: 1, target: 1, stardustReward: 5,   crystalsReward: 20,  perkType: 'click_power', perkValue: 0.02 },
            { tier: 2, target: 2, stardustReward: 15,  crystalsReward: 45,  perkType: 'click_power', perkValue: 0.02 },
            { tier: 3, target: 4, stardustReward: 40,  crystalsReward: 100, perkType: 'click_power', perkValue: 0.02 },
            { tier: 4, target: 6, stardustReward: 100, crystalsReward: 220, perkType: 'click_power', perkValue: 0.02 },
            { tier: 5, target: 8, stardustReward: 250, crystalsReward: 500, perkType: 'click_power', perkValue: 0.02 }
        ]
    },
    // 7. Любимец Судьбы (Вращений Колеса Фортуны)
    {
        id: 'wheel_of_fate',
        iconSvg: `<svg viewBox="0 0 32 32" width="28" height="28" fill="none">
            <circle cx="16" cy="16" r="13" fill="#2c1a4d" stroke="#f1c40f" stroke-width="1.5"/>
            <path d="M16 16 L16 3 A13 13 0 0 1 25.19 6.81 Z" fill="#e74c3c"/>
            <path d="M16 16 L25.19 6.81 A13 13 0 0 1 29 16 Z" fill="#3498db"/>
            <path d="M16 16 L29 16 A13 13 0 0 1 25.19 25.19 Z" fill="#2ecc71"/>
            <path d="M16 16 L25.19 25.19 A13 13 0 0 1 16 29 Z" fill="#f1c40f"/>
            <circle cx="16" cy="16" r="4" fill="#1a1130" stroke="#fff" stroke-width="1"/>
            <polygon points="16,1 18,5 14,5" fill="#f1c40f"/>
        </svg>`,
        tiers: [
            { tier: 1, target: 3,   stardustReward: 5,   crystalsReward: 15,  perkType: 'gold_mult', perkValue: 0.01 },
            { tier: 2, target: 15,  stardustReward: 15,  crystalsReward: 35,  perkType: 'gold_mult', perkValue: 0.01 },
            { tier: 3, target: 50,  stardustReward: 40,  crystalsReward: 80,  perkType: 'gold_mult', perkValue: 0.01 },
            { tier: 4, target: 150, stardustReward: 100, crystalsReward: 180, perkType: 'gold_mult', perkValue: 0.01 },
            { tier: 5, target: 350, stardustReward: 250, crystalsReward: 400, perkType: 'gold_mult', perkValue: 0.01 }
        ]
    },
    // 8. Техно-Маг (Суммарный уровень улучшений лавки)
    {
        id: 'upgrade_master',
        iconSvg: `<svg viewBox="0 0 32 32" width="28" height="28" fill="none">
            <path d="M16 3 L20 11 L29 12 L22 19 L24 28 L16 23 L8 28 L10 19 L3 12 L12 11 Z" fill="#9b59b6" stroke="#8e44ad" stroke-width="1.2"/>
            <polygon points="16,8 18,13 23,14 19,18 20,23 16,20 12,23 13,18 9,14 14,13" fill="#f1c40f"/>
        </svg>`,
        tiers: [
            { tier: 1, target: 25,   stardustReward: 5,   crystalsReward: 15,  perkType: 'click_power', perkValue: 0.02 },
            { tier: 2, target: 100,  stardustReward: 15,  crystalsReward: 35,  perkType: 'click_power', perkValue: 0.02 },
            { tier: 3, target: 300,  stardustReward: 40,  crystalsReward: 80,  perkType: 'click_power', perkValue: 0.02 },
            { tier: 4, target: 750,  stardustReward: 100, crystalsReward: 180, perkType: 'click_power', perkValue: 0.02 },
            { tier: 5, target: 1500, stardustReward: 250, crystalsReward: 400, perkType: 'click_power', perkValue: 0.02 }
        ]
    }
];

/**
 * Получение текущего числового прогресса для достижения
 */
export function getAchievementCurrentProgress(id: AchievementId, state: GameState): number {
    if (!state) return 0;
    switch (id) {
        case 'brew_master':
            return state.alchemyBrewsCount || 0;
        case 'gold_hoarder':
            return Math.max(state.totalGoldEarned || 0, state.gold || 0);
        case 'relic_seeker':
            return state.artifacts?.length || 0;
        case 'grand_ritual':
            return state.rebirthCount || (state.totalStardustEarned && state.totalStardustEarned > 0 ? 1 : 0);
        case 'order_supplier':
            return state.ordersCompletedCount || 0;
        case 'beast_whisperer':
            return state.unlockedPets?.length || 1;
        case 'wheel_of_fate':
            return state.luckyWheel?.totalSpins || 0;
        case 'upgrade_master': {
            const upgs = state.upgrades || [];
            return upgs.reduce((sum, u) => sum + (u.level || 0), 0);
        }
        default:
            return 0;
    }
}

/**
 * Получение статуса достижения: текущий уровень, можно ли забрать, целевой порог
 */
export function getAchievementStatus(def: AchievementDef, state: GameState) {
    const claimedTier = state?.achievements?.[def.id] || 0; // 0..5
    const currentProgress = getAchievementCurrentProgress(def.id, state);
    const nextTierIndex = claimedTier; // 0..4
    const isMax = claimedTier >= def.tiers.length;
    const nextTier = !isMax ? def.tiers[nextTierIndex] : def.tiers[def.tiers.length - 1];
    const canClaim = !isMax && currentProgress >= nextTier.target;
    
    // Процент прогресса к текущей цели
    const prevTarget = nextTierIndex > 0 ? def.tiers[nextTierIndex - 1].target : 0;
    const progressSpan = nextTier.target - prevTarget;
    const currentSpan = Math.max(0, currentProgress - prevTarget);
    const progressPercent = isMax ? 100 : Math.min(100, Math.max(0, (currentSpan / progressSpan) * 100));

    return {
        claimedTier,
        isMax,
        currentProgress,
        nextTier,
        canClaim,
        progressPercent
    };
}

/**
 * Подсчет суммарных пассивных бонусов ото всех собранных тиров достижений
 */
export function calculateAchievementPerks(state: GameState): Record<PerkType, number> {
    const perks: Record<PerkType, number> = {
        gold_mult: 0,
        stardust_mult: 0,
        double_brew: 0,
        orders_gold: 0,
        click_power: 0
    };

    if (!state || !state.achievements) return perks;

    ACHIEVEMENTS.forEach(def => {
        const claimed = state.achievements?.[def.id] || 0;
        for (let i = 0; i < claimed && i < def.tiers.length; i++) {
            const t = def.tiers[i];
            perks[t.perkType] = (perks[t.perkType] || 0) + t.perkValue;
        }
    });

    return perks;
}

/**
 * Общее количество собранных звёзд
 */
export function getTotalClaimedStars(state: GameState): number {
    if (!state?.achievements) return 0;
    return Object.values(state.achievements).reduce((sum, val) => sum + (val || 0), 0);
}

/**
 * Текущий титул Архимага на основе собранных звёзд
 */
export function getCurrentArchmageTitle(stars: number): { current: ArchmageTitle; next: ArchmageTitle | null; starsToNext: number } {
    let current = ARCHMAGE_TITLES[0];
    let next: ArchmageTitle | null = null;

    for (let i = 0; i < ARCHMAGE_TITLES.length; i++) {
        if (stars >= ARCHMAGE_TITLES[i].minStars) {
            current = ARCHMAGE_TITLES[i];
            next = i + 1 < ARCHMAGE_TITLES.length ? ARCHMAGE_TITLES[i + 1] : null;
        }
    }

    const starsToNext = next ? next.minStars - stars : 0;
    return { current, next, starsToNext };
}
