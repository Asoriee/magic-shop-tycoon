import { get } from 'svelte/store';
import { 
    gameStore, 
    crystals, 
    isVip, 
    stableIdleIncome, 
    openChest, 
    formatNumber,
    type ChestType,
    type GameState 
} from './store';
import { saveGame } from './yandex-sdk';
import { playSuccessSound } from './audio';
import { translate } from './i18n';

export interface CalendarRewardItem {
    day: number;
    titleKey: string;
    type: 'gold_seconds' | 'crystals' | 'chest' | 'stardust' | 'pet' | 'relic';
    amount?: number;
    chestType?: ChestType;
    petId?: string;
    isMilestone?: boolean;
    milestoneLabelKey?: string;
    iconSvg: string;
}

export const CALENDAR_REWARDS: CalendarRewardItem[] = [
    // --- Неделя 1: Врата Ученика ---
    {
        day: 1,
        titleKey: 'calendar.d1Title',
        type: 'crystals',
        amount: 5,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><polygon points="20,4 34,14 28,34 12,34 6,14" fill="#00d2d3" stroke="#81ecec" stroke-width="2"/><polygon points="20,8 30,15 25,30 15,30 10,15" fill="#54a0ff"/><circle cx="20" cy="18" r="3" fill="#fff" opacity="0.8"/></svg>`
    },
    {
        day: 2,
        titleKey: 'calendar.d2Title',
        type: 'chest',
        chestType: 'wooden',
        amount: 1,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><rect x="6" y="14" width="28" height="20" rx="3" fill="#8c531b" stroke="#5c3d2e" stroke-width="2"/><path d="M6 14 Q20 8 34 14 Z" fill="#b07d4b" stroke="#5c3d2e" stroke-width="2"/><rect x="18" y="18" width="4" height="6" rx="1" fill="#ffd32a" stroke="#d4ac0d" stroke-width="1"/></svg>`
    },
    {
        day: 3,
        titleKey: 'calendar.d3Title',
        type: 'gold_seconds',
        amount: 90, // 90 sec gold
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><circle cx="20" cy="20" r="14" fill="#f1c40f" stroke="#d4ac0d" stroke-width="2.5"/><text x="20" y="25" text-anchor="middle" font-size="14" font-weight="900" fill="#b7791f">G</text></svg>`
    },
    {
        day: 4,
        titleKey: 'calendar.d4Title',
        type: 'crystals',
        amount: 8,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><polygon points="20,4 34,14 28,34 12,34 6,14" fill="#00d2d3" stroke="#81ecec" stroke-width="2"/><circle cx="20" cy="18" r="3" fill="#fff" opacity="0.8"/></svg>`
    },
    {
        day: 5,
        titleKey: 'calendar.d5Title',
        type: 'gold_seconds',
        amount: 150,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><circle cx="20" cy="20" r="14" fill="#f1c40f" stroke="#d4ac0d" stroke-width="2.5"/><text x="20" y="25" text-anchor="middle" font-size="14" font-weight="900" fill="#b7791f">G</text></svg>`
    },
    {
        day: 6,
        titleKey: 'calendar.d6Title',
        type: 'chest',
        chestType: 'magical',
        amount: 1,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><rect x="6" y="14" width="28" height="20" rx="3" fill="#6c5ce7" stroke="#4834d4" stroke-width="2"/><path d="M6 14 Q20 7 34 14 Z" fill="#a29bfe" stroke="#4834d4" stroke-width="2"/><circle cx="20" cy="21" r="3.5" fill="#00cec9" stroke="#fff" stroke-width="1"/></svg>`
    },
    {
        day: 7,
        titleKey: 'calendar.d7Title',
        type: 'pet',
        petId: 'pet_owl',
        amount: 1,
        isMilestone: true,
        milestoneLabelKey: 'calendar.week1Milestone',
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><defs><radialGradient id="calOwl" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#686de0"/><stop offset="100%" stop-color="#130f40"/></radialGradient></defs><ellipse cx="20" cy="22" rx="12" ry="14" fill="url(#calOwl)" stroke="#ffd700" stroke-width="1.8"/><circle cx="15" cy="18" r="4.5" fill="#ffd32a"/><circle cx="25" cy="18" r="4.5" fill="#ffd32a"/><circle cx="15" cy="18" r="2" fill="#130f40"/><circle cx="25" cy="18" r="2" fill="#130f40"/><polygon points="18,22 22,22 20,26" fill="#f0932b"/></svg>`
    },

    // --- Неделя 2: Тропа Магистра ---
    {
        day: 8,
        titleKey: 'calendar.d8Title',
        type: 'crystals',
        amount: 12,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><polygon points="20,4 34,14 28,34 12,34 6,14" fill="#00d2d3" stroke="#81ecec" stroke-width="2"/></svg>`
    },
    {
        day: 9,
        titleKey: 'calendar.d9Title',
        type: 'chest',
        chestType: 'alchemist',
        amount: 1,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><rect x="6" y="14" width="28" height="20" rx="3" fill="#2ed573" stroke="#26af5f" stroke-width="2"/><path d="M6 14 Q20 8 34 14 Z" fill="#7bed9f" stroke="#26af5f" stroke-width="2"/><rect x="18" y="18" width="4" height="6" rx="1" fill="#fff"/></svg>`
    },
    {
        day: 10,
        titleKey: 'calendar.d10Title',
        type: 'gold_seconds',
        amount: 200,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><circle cx="20" cy="20" r="14" fill="#f1c40f" stroke="#d4ac0d" stroke-width="2.5"/><text x="20" y="25" text-anchor="middle" font-size="14" font-weight="900" fill="#b7791f">G</text></svg>`
    },
    {
        day: 11,
        titleKey: 'calendar.d11Title',
        type: 'stardust',
        amount: 10,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><polygon points="20,4 23,15 34,12 25,20 30,30 20,24 10,30 15,20 6,12 17,15" fill="#a29bfe" stroke="#6c5ce7" stroke-width="1.8"/><circle cx="20" cy="19" r="3" fill="#fff"/></svg>`
    },
    {
        day: 12,
        titleKey: 'calendar.d12Title',
        type: 'chest',
        chestType: 'magical',
        amount: 1,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><rect x="6" y="14" width="28" height="20" rx="3" fill="#6c5ce7" stroke="#4834d4" stroke-width="2"/><circle cx="20" cy="21" r="3.5" fill="#00cec9" stroke="#fff" stroke-width="1"/></svg>`
    },
    {
        day: 13,
        titleKey: 'calendar.d13Title',
        type: 'crystals',
        amount: 15,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><polygon points="20,4 34,14 28,34 12,34 6,14" fill="#00d2d3" stroke="#81ecec" stroke-width="2"/></svg>`
    },
    {
        day: 14,
        titleKey: 'calendar.d14Title',
        type: 'chest',
        chestType: 'astral',
        amount: 1,
        isMilestone: true,
        milestoneLabelKey: 'calendar.week2Milestone',
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><rect x="6" y="14" width="28" height="20" rx="3" fill="#fd79a8" stroke="#e84393" stroke-width="2"/><path d="M6 14 Q20 6 34 14 Z" fill="#e84393" stroke="#d63031" stroke-width="2"/><circle cx="20" cy="21" r="4" fill="#fff" stroke="#ffeaa7" stroke-width="1.5"/></svg>`
    },

    // --- Неделя 3: Сияние Эфира ---
    {
        day: 15,
        titleKey: 'calendar.d15Title',
        type: 'gold_seconds',
        amount: 300,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><circle cx="20" cy="20" r="14" fill="#f1c40f" stroke="#d4ac0d" stroke-width="2.5"/><text x="20" y="25" text-anchor="middle" font-size="14" font-weight="900" fill="#b7791f">G</text></svg>`
    },
    {
        day: 16,
        titleKey: 'calendar.d16Title',
        type: 'crystals',
        amount: 18,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><polygon points="20,4 34,14 28,34 12,34 6,14" fill="#00d2d3" stroke="#81ecec" stroke-width="2"/></svg>`
    },
    {
        day: 17,
        titleKey: 'calendar.d17Title',
        type: 'stardust',
        amount: 25,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><polygon points="20,4 23,15 34,12 25,20 30,30 20,24 10,30 15,20 6,12 17,15" fill="#a29bfe" stroke="#6c5ce7" stroke-width="1.8"/><circle cx="20" cy="19" r="3" fill="#fff"/></svg>`
    },
    {
        day: 18,
        titleKey: 'calendar.d18Title',
        type: 'chest',
        chestType: 'astral',
        amount: 1,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><rect x="6" y="14" width="28" height="20" rx="3" fill="#fd79a8" stroke="#e84393" stroke-width="2"/><circle cx="20" cy="21" r="4" fill="#fff" stroke="#ffeaa7" stroke-width="1.5"/></svg>`
    },
    {
        day: 19,
        titleKey: 'calendar.d19Title',
        type: 'crystals',
        amount: 22,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><polygon points="20,4 34,14 28,34 12,34 6,14" fill="#00d2d3" stroke="#81ecec" stroke-width="2"/></svg>`
    },
    {
        day: 20,
        titleKey: 'calendar.d20Title',
        type: 'stardust',
        amount: 40,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><polygon points="20,4 23,15 34,12 25,20 30,30 20,24 10,30 15,20 6,12 17,15" fill="#a29bfe" stroke="#6c5ce7" stroke-width="1.8"/><circle cx="20" cy="19" r="3" fill="#fff"/></svg>`
    },
    {
        day: 21,
        titleKey: 'calendar.d21Title',
        type: 'pet',
        petId: 'pet_pegasus',
        amount: 1,
        isMilestone: true,
        milestoneLabelKey: 'calendar.week3Milestone',
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><path d="M16 16 C10 6 3 8 2 17 C6 17 11 18 16 20 Z" fill="#74b9ff"/><path d="M14 32 C12 25 15 19 18 16 C19 12 20 8 23 6 C26 5 28 8 27 12 C29 13 32 14 31 18 C28 20 25 20 22 21 C20 26 21 30 22 34 Z" fill="#dfe6e9"/><circle cx="26" cy="11" r="2" fill="#00d2d3"/></svg>`
    },

    // --- Неделя 4: Владычество Титанов ---
    {
        day: 22,
        titleKey: 'calendar.d22Title',
        type: 'crystals',
        amount: 25,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><polygon points="20,4 34,14 28,34 12,34 6,14" fill="#00d2d3" stroke="#81ecec" stroke-width="2"/></svg>`
    },
    {
        day: 23,
        titleKey: 'calendar.d23Title',
        type: 'stardust',
        amount: 50,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><polygon points="20,4 23,15 34,12 25,20 30,30 20,24 10,30 15,20 6,12 17,15" fill="#a29bfe" stroke="#6c5ce7" stroke-width="1.8"/><circle cx="20" cy="19" r="3" fill="#fff"/></svg>`
    },
    {
        day: 24,
        titleKey: 'calendar.d24Title',
        type: 'chest',
        chestType: 'titan',
        amount: 1,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><rect x="6" y="14" width="28" height="20" rx="3" fill="#2d3436" stroke="#00cec9" stroke-width="2.2"/><path d="M6 14 Q20 5 34 14 Z" fill="#6c5ce7" stroke="#00cec9" stroke-width="2.2"/><circle cx="20" cy="22" r="4.5" fill="#ffeaa7" stroke="#fff" stroke-width="1.5"/></svg>`
    },
    {
        day: 25,
        titleKey: 'calendar.d25Title',
        type: 'crystals',
        amount: 30,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><polygon points="20,4 34,14 28,34 12,34 6,14" fill="#00d2d3" stroke="#81ecec" stroke-width="2"/></svg>`
    },
    {
        day: 26,
        titleKey: 'calendar.d26Title',
        type: 'stardust',
        amount: 75,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><polygon points="20,4 23,15 34,12 25,20 30,30 20,24 10,30 15,20 6,12 17,15" fill="#a29bfe" stroke="#6c5ce7" stroke-width="1.8"/><circle cx="20" cy="19" r="3" fill="#fff"/></svg>`
    },
    {
        day: 27,
        titleKey: 'calendar.d27Title',
        type: 'chest',
        chestType: 'titan',
        amount: 1,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><rect x="6" y="14" width="28" height="20" rx="3" fill="#2d3436" stroke="#00cec9" stroke-width="2.2"/><circle cx="20" cy="22" r="4.5" fill="#ffeaa7" stroke="#fff" stroke-width="1.5"/></svg>`
    },
    {
        day: 28,
        titleKey: 'calendar.d28Title',
        type: 'stardust',
        amount: 100,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><polygon points="20,4 23,15 34,12 25,20 30,30 20,24 10,30 15,20 6,12 17,15" fill="#a29bfe" stroke="#6c5ce7" stroke-width="1.8"/><circle cx="20" cy="19" r="3" fill="#fff"/></svg>`
    },
    {
        day: 29,
        titleKey: 'calendar.d29Title',
        type: 'crystals',
        amount: 50,
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><polygon points="20,4 34,14 28,34 12,34 6,14" fill="#00d2d3" stroke="#81ecec" stroke-width="2"/></svg>`
    },
    {
        day: 30,
        titleKey: 'calendar.d30Title',
        type: 'relic',
        amount: 1,
        isMilestone: true,
        milestoneLabelKey: 'calendar.grandFinale',
        iconSvg: `<svg viewBox="0 0 40 40" width="36" height="36"><defs><radialGradient id="relicGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff"/><stop offset="40%" stop-color="#ffd700"/><stop offset="80%" stop-color="#e17055"/><stop offset="100%" stop-color="#2d1b4e"/></radialGradient></defs><circle cx="20" cy="20" r="15" fill="url(#relicGrad)" stroke="#ffd700" stroke-width="2.5"/><circle cx="20" cy="20" r="8" fill="#2d1b4e" stroke="#00cec9" stroke-width="1.5"/><circle cx="20" cy="20" r="3.5" fill="#fff"/></svg>`
    }
];

export function getCalendarReward(day: number): CalendarRewardItem {
    const validDay = Math.max(1, Math.min(30, day || 1));
    return CALENDAR_REWARDS[validDay - 1];
}

export function isCalendarRewardReady(state: GameState): boolean {
    const today = new Date().toISOString().split('T')[0];
    return state.calendarLastClaimDate !== today;
}

export function claimCalendarReward(): { success: boolean; rewardDesc?: string } {
    let claimed = false;
    let desc = '';
    const today = new Date().toISOString().split('T')[0];

    gameStore.update(state => {
        if (state.calendarLastClaimDate === today) {
            return state;
        }

        let currentDay = state.calendarDay || 1;
        let currentSeason = state.calendarSeason || 1;
        if (currentDay > 30) {
            currentDay = 1;
            currentSeason += 1;
        }
        currentDay = Math.max(1, Math.min(30, currentDay));

        const seasonMultiplier = 1 + (currentSeason - 1) * 0.15;
        const reward = getCalendarReward(currentDay);
        const vipActive = get(isVip);
        const mult = vipActive ? 2 : 1;

        let nextGold = state.gold;
        let nextStardust = state.stardust;
        let nextTotalDust = state.totalStardustEarned || 0;
        let nextUnlockedPets = [...state.unlockedPets];
        let nextPetLevels = { ...(state.petLevels || {}) };
        let nextHasRelic = state.hasRelicEternityEye || false;

        const baseAmt = reward.amount || 1;
        const finalAmt = baseAmt * mult;

        if (reward.type === 'crystals') {
            const seasonAmt = Math.round(finalAmt * seasonMultiplier);
            crystals.update(c => c + seasonAmt);
            desc = translate('calendar.rewardCrystals', { amount: seasonAmt });
        } else if (reward.type === 'gold_seconds') {
            const idle = get(stableIdleIncome) || 0;
            const goldEarned = Math.max(1000, Math.round(idle * finalAmt * seasonMultiplier));
            nextGold += goldEarned;
            desc = translate('calendar.rewardGold', { amount: formatNumber(goldEarned) });
        } else if (reward.type === 'chest' && reward.chestType) {
            for (let i = 0; i < mult; i++) {
                openChest(reward.chestType);
            }
            const cName = translate(`chests.${reward.chestType}`) || reward.chestType;
            desc = translate('calendar.rewardChest', { mult, chest: cName });
        } else if (reward.type === 'stardust') {
            const dustAmt = Math.round(finalAmt * seasonMultiplier);
            nextStardust += dustAmt;
            nextTotalDust += dustAmt;
            desc = translate('calendar.rewardDust', { amount: dustAmt });
        } else if (reward.type === 'pet' && reward.petId) {
            if (!nextUnlockedPets.includes(reward.petId)) {
                nextUnlockedPets.push(reward.petId);
                nextPetLevels[reward.petId] = 1 + (vipActive ? 1 : 0);
            } else {
                nextPetLevels[reward.petId] = (nextPetLevels[reward.petId] || 1) + (1 * mult);
            }
            const cryAmt = Math.round((vipActive ? 40 : 20) * seasonMultiplier);
            crystals.update(c => c + cryAmt);
            desc = translate('calendar.rewardOwlDesc', { crystals: cryAmt });
        } else if (reward.type === 'relic') {
            nextHasRelic = true;
            const relicDust = Math.round(150 * mult * seasonMultiplier);
            const relicCry = Math.round(150 * mult * seasonMultiplier);
            nextStardust += relicDust;
            nextTotalDust += relicDust;
            crystals.update(c => c + relicCry);
            desc = translate('calendar.rewardRelicDesc');
        }

        playSuccessSound();
        claimed = true;

        if (currentDay === 7) {
            import('./yandex-sdk').then(sdk => {
                sdk.canRequestReview().then(can => {
                    if (can) sdk.requestGameReview();
                }).catch(() => {});
            }).catch(() => {});
        }

        const nextDay = currentDay >= 30 ? 31 : currentDay + 1;

        return {
            ...state,
            gold: nextGold,
            stardust: nextStardust,
            totalStardustEarned: nextTotalDust,
            unlockedPets: nextUnlockedPets,
            petLevels: nextPetLevels,
            hasRelicEternityEye: nextHasRelic,
            calendarDay: nextDay,
            calendarSeason: currentSeason,
            calendarLastClaimDate: today
        };
    });

    if (claimed) {
        saveGame();
        return { success: true, rewardDesc: desc };
    }
    return { success: false };
}
