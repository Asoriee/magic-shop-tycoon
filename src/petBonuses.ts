import { get } from 'svelte/store';
import { currentLang } from './i18n';
import type { SupportedLang } from './i18n/types';

export interface PetBonusData {
    idleBonus: number;
    clickBonus: number;
    critBonus: number;
    orderBonus: number;
    doubleBrewBonus: number;
    offlineHoursBonus: number;
}

export interface PetAuraInfo {
    petId: string;
    title: string;
    description: string;
    nextLevelDescription?: string;
    badge: string;
    isLegendary: boolean;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    bonuses: PetBonusData;
    nextBonuses?: PetBonusData;
}

export function getPetBonusValues(petId: string, level: number = 1): PetBonusData {
    const lvl = Math.max(1, Math.min(10, Math.floor(level || 1)));
    const step = lvl - 1;

    switch (petId) {
        // Legendary Familiars (Massive companion auras)
        case 'pet_dragon':
            return {
                idleBonus: 0.35 + step * 0.04, // +35% .. +71%
                clickBonus: 0.20 + step * 0.02, // +20% .. +38%
                critBonus: 0,
                orderBonus: 0,
                doubleBrewBonus: 0,
                offlineHoursBonus: 0
            };
        case 'pet_manticore':
            return {
                idleBonus: 0,
                clickBonus: 0.30 + step * 0.03, // +30% .. +57%
                critBonus: 0.08 + step * 0.01,  // +8% .. +17% crit chance
                orderBonus: 0,
                doubleBrewBonus: 0,
                offlineHoursBonus: 0
            };
        case 'pet_astral_dragon':
            return {
                idleBonus: 0.45 + step * 0.05, // +45% .. +90%
                clickBonus: 0.30 + step * 0.03, // +30% .. +57%
                critBonus: 0,
                orderBonus: 0,
                doubleBrewBonus: 0,
                offlineHoursBonus: 0
            };
        case 'pet_phoenix':
            return {
                idleBonus: 0.30 + step * 0.03, // +30% .. +57%
                clickBonus: 0,
                critBonus: 0,
                orderBonus: 0.35 + step * 0.035, // +35% .. +66.5% order gold
                doubleBrewBonus: 0,
                offlineHoursBonus: 0
            };
        case 'pet_moon_cat':
            return {
                idleBonus: 0,
                clickBonus: 0,
                critBonus: 0,
                orderBonus: 0.25 + step * 0.025, // +25% .. +47.5% order gold
                doubleBrewBonus: 0.20 + step * 0.02, // +20% .. +38% double potion chance
                offlineHoursBonus: 0
            };
        case 'pet_void_titan':
            return {
                idleBonus: 0.50 + step * 0.05, // +50% .. +95%
                clickBonus: 0.35 + step * 0.035, // +35% .. +66.5%
                critBonus: 0,
                orderBonus: 0,
                doubleBrewBonus: 0,
                offlineHoursBonus: 2 + Math.floor(step / 3) // +2 to +5 hours offline cap
            };

        // Epic Familiars
        case 'pet_gryphon':
            return {
                idleBonus: 0.20 + step * 0.02, // +20% .. +38%
                clickBonus: 0.10 + step * 0.01, // +10% .. +19%
                critBonus: 0,
                orderBonus: 0,
                doubleBrewBonus: 0,
                offlineHoursBonus: 0
            };
        case 'pet_golem':
            return {
                idleBonus: 0.10 + step * 0.01, // +10% .. +19%
                clickBonus: 0.20 + step * 0.02, // +20% .. +38%
                critBonus: 0,
                orderBonus: 0,
                doubleBrewBonus: 0,
                offlineHoursBonus: 0
            };

        // Rare Familiars
        case 'pet_spirit':
            return {
                idleBonus: 0.10 + step * 0.01, // +10% .. +19%
                clickBonus: 0,
                critBonus: 0,
                orderBonus: 0,
                doubleBrewBonus: 0,
                offlineHoursBonus: 0
            };
        case 'pet_owl':
            return {
                idleBonus: 0,
                clickBonus: 0.10 + step * 0.01, // +10% .. +19%
                critBonus: 0,
                orderBonus: 0,
                doubleBrewBonus: 0,
                offlineHoursBonus: 0
            };
        case 'pet_fox':
            return {
                idleBonus: 0,
                clickBonus: 0,
                critBonus: 0,
                orderBonus: 0.10 + step * 0.01, // +10% .. +19% order gold
                doubleBrewBonus: 0,
                offlineHoursBonus: 0
            };

        // Common Familiars
        case 'pet_rat':
            return {
                idleBonus: 0.04 + step * 0.005, // +4% .. +8.5%
                clickBonus: 0,
                critBonus: 0,
                orderBonus: 0,
                doubleBrewBonus: 0,
                offlineHoursBonus: 0
            };
        case 'pet_slime':
            return {
                idleBonus: 0,
                clickBonus: 0.04 + step * 0.005, // +4% .. +8.5%
                critBonus: 0,
                orderBonus: 0,
                doubleBrewBonus: 0,
                offlineHoursBonus: 0
            };
        case 'pet_bat':
            return {
                idleBonus: 0.06 + step * 0.005, // +6% .. +10.5%
                clickBonus: 0,
                critBonus: 0,
                orderBonus: 0,
                doubleBrewBonus: 0,
                offlineHoursBonus: 0
            };
        case 'pet_frog':
            return {
                idleBonus: 0,
                clickBonus: 0.06 + step * 0.005, // +6% .. +10.5%
                critBonus: 0,
                orderBonus: 0,
                doubleBrewBonus: 0,
                offlineHoursBonus: 0
            };

        default:
            return {
                idleBonus: 0,
                clickBonus: 0,
                critBonus: 0,
                orderBonus: 0,
                doubleBrewBonus: 0,
                offlineHoursBonus: 0
            };
    }
}

const LEGENDARY_PETS = new Set([
    'pet_dragon',
    'pet_manticore',
    'pet_astral_dragon',
    'pet_phoenix',
    'pet_moon_cat',
    'pet_void_titan'
]);

const EPIC_PETS = new Set(['pet_gryphon', 'pet_golem']);
const RARE_PETS = new Set(['pet_spirit', 'pet_owl', 'pet_fox']);

function getPetRarity(petId: string): 'common' | 'rare' | 'epic' | 'legendary' {
    if (LEGENDARY_PETS.has(petId)) return 'legendary';
    if (EPIC_PETS.has(petId)) return 'epic';
    if (RARE_PETS.has(petId)) return 'rare';
    return 'common';
}

interface AuraLocaleTemplate {
    title: string;
    desc: (b: PetBonusData) => string;
    badge: (b: PetBonusData) => string;
}

const AURA_LOCALES: Record<SupportedLang, Record<string, AuraLocaleTemplate>> = {
    ru: {
        pet_rat: {
            title: 'Чутьё на Золото',
            desc: b => `+${(b.idleBonus * 100).toFixed(1)}% к пассивному доходу лавки`,
            badge: b => `+${(b.idleBonus * 100).toFixed(1)}% дохода`
        },
        pet_slime: {
            title: 'Липкое Касание',
            desc: b => `+${(b.clickBonus * 100).toFixed(1)}% к силе клика по котлу`,
            badge: b => `+${(b.clickBonus * 100).toFixed(1)}% клика`
        },
        pet_bat: {
            title: 'Ночной Эхолокатор',
            desc: b => `+${(b.idleBonus * 100).toFixed(1)}% к пассивному доходу лавки`,
            badge: b => `+${(b.idleBonus * 100).toFixed(1)}% дохода`
        },
        pet_frog: {
            title: 'Болотный Импульс',
            desc: b => `+${(b.clickBonus * 100).toFixed(1)}% к силе клика по котлу`,
            badge: b => `+${(b.clickBonus * 100).toFixed(1)}% клика`
        },
        pet_spirit: {
            title: 'Эфирный Поток',
            desc: b => `+${Math.round(b.idleBonus * 100)}% к пассивному доходу лавки`,
            badge: b => `+${Math.round(b.idleBonus * 100)}% дохода`
        },
        pet_owl: {
            title: 'Мудрость Ночи',
            desc: b => `+${Math.round(b.clickBonus * 100)}% к силе клика по котлу`,
            badge: b => `+${Math.round(b.clickBonus * 100)}% клика`
        },
        pet_fox: {
            title: 'Купеческая Хитрость',
            desc: b => `+${Math.round(b.orderBonus * 100)}% к золоту за выполнение городских заказов`,
            badge: b => `+${Math.round(b.orderBonus * 100)}% заказы`
        },
        pet_gryphon: {
            title: 'Гордость Высот',
            desc: b => `+${Math.round(b.idleBonus * 100)}% к пассивному доходу и +${Math.round(b.clickBonus * 100)}% к силе клика`,
            badge: b => `+${Math.round(b.idleBonus * 100)}% дох. / +${Math.round(b.clickBonus * 100)}% клик`
        },
        pet_golem: {
            title: 'Кристальный Резонанс',
            desc: b => `+${Math.round(b.clickBonus * 100)}% к силе клика и +${Math.round(b.idleBonus * 100)}% к пассивному доходу`,
            badge: b => `+${Math.round(b.clickBonus * 100)}% клик / +${Math.round(b.idleBonus * 100)}% дох.`
        },
        pet_dragon: {
            title: 'Драконье Изобилие',
            desc: b => `+${Math.round(b.idleBonus * 100)}% к пассивному доходу и +${Math.round(b.clickBonus * 100)}% к силе клика`,
            badge: b => `+${Math.round(b.idleBonus * 100)}% дох. / +${Math.round(b.clickBonus * 100)}% клик`
        },
        pet_manticore: {
            title: 'Сокрушительный Хищник',
            desc: b => `+${Math.round(b.clickBonus * 100)}% к силе клика и +${Math.round(b.critBonus * 100)}% к шансу крит. клика (x5)`,
            badge: b => `+${Math.round(b.clickBonus * 100)}% клик / +${Math.round(b.critBonus * 100)}% крит`
        },
        pet_moon_cat: {
            title: 'Благословение Лунной Пантеры',
            desc: b => `+${Math.round(b.doubleBrewBonus * 100)}% к шансу удвоения зелий и +${Math.round(b.orderBonus * 100)}% золота за заказы`,
            badge: b => `+${Math.round(b.doubleBrewBonus * 100)}% зелья / +${Math.round(b.orderBonus * 100)}% заказы`
        },
        pet_astral_dragon: {
            title: 'Свет Пустоты',
            desc: b => `+${Math.round(b.idleBonus * 100)}% к пассивному доходу и +${Math.round(b.clickBonus * 100)}% к силе клика`,
            badge: b => `+${Math.round(b.idleBonus * 100)}% дох. / +${Math.round(b.clickBonus * 100)}% клик`
        },
        pet_phoenix: {
            title: 'Благословение Солнца',
            desc: b => `+${Math.round(b.orderBonus * 100)}% золота за городские заказы и +${Math.round(b.idleBonus * 100)}% к доходу лавки`,
            badge: b => `+${Math.round(b.orderBonus * 100)}% заказы / +${Math.round(b.idleBonus * 100)}% дох.`
        },
        pet_void_titan: {
            title: 'Владыка Вечности',
            desc: b => `+${Math.round(b.idleBonus * 100)}% к доходу, +${Math.round(b.clickBonus * 100)}% к клику и +${b.offlineHoursBonus} ч оффлайн-лимита`,
            badge: b => `+${Math.round(b.idleBonus * 100)}% дох. / +${b.offlineHoursBonus} ч оффл.`
        }
    },
    en: {
        pet_rat: {
            title: 'Gold Scent',
            desc: b => `+${(b.idleBonus * 100).toFixed(1)}% passive shop income`,
            badge: b => `+${(b.idleBonus * 100).toFixed(1)}% income`
        },
        pet_slime: {
            title: 'Sticky Touch',
            desc: b => `+${(b.clickBonus * 100).toFixed(1)}% click power on cauldron`,
            badge: b => `+${(b.clickBonus * 100).toFixed(1)}% click`
        },
        pet_bat: {
            title: 'Night Sonar',
            desc: b => `+${(b.idleBonus * 100).toFixed(1)}% passive shop income`,
            badge: b => `+${(b.idleBonus * 100).toFixed(1)}% income`
        },
        pet_frog: {
            title: 'Swamp Pulse',
            desc: b => `+${(b.clickBonus * 100).toFixed(1)}% click power on cauldron`,
            badge: b => `+${(b.clickBonus * 100).toFixed(1)}% click`
        },
        pet_spirit: {
            title: 'Aetherial Flow',
            desc: b => `+${Math.round(b.idleBonus * 100)}% passive shop income`,
            badge: b => `+${Math.round(b.idleBonus * 100)}% income`
        },
        pet_owl: {
            title: 'Nocturnal Wisdom',
            desc: b => `+${Math.round(b.clickBonus * 100)}% click power on cauldron`,
            badge: b => `+${Math.round(b.clickBonus * 100)}% click`
        },
        pet_fox: {
            title: "Merchant's Cunning",
            desc: b => `+${Math.round(b.orderBonus * 100)}% gold from city orders`,
            badge: b => `+${Math.round(b.orderBonus * 100)}% orders`
        },
        pet_gryphon: {
            title: 'Pride of the Peaks',
            desc: b => `+${Math.round(b.idleBonus * 100)}% passive income & +${Math.round(b.clickBonus * 100)}% click power`,
            badge: b => `+${Math.round(b.idleBonus * 100)}% inc. / +${Math.round(b.clickBonus * 100)}% click`
        },
        pet_golem: {
            title: 'Crystal Resonance',
            desc: b => `+${Math.round(b.clickBonus * 100)}% click power & +${Math.round(b.idleBonus * 100)}% passive income`,
            badge: b => `+${Math.round(b.clickBonus * 100)}% click / +${Math.round(b.idleBonus * 100)}% inc.`
        },
        pet_dragon: {
            title: "Dragon's Hoard",
            desc: b => `+${Math.round(b.idleBonus * 100)}% passive income & +${Math.round(b.clickBonus * 100)}% click power`,
            badge: b => `+${Math.round(b.idleBonus * 100)}% inc. / +${Math.round(b.clickBonus * 100)}% click`
        },
        pet_manticore: {
            title: 'Lethal Predator',
            desc: b => `+${Math.round(b.clickBonus * 100)}% click power & +${Math.round(b.critBonus * 100)}% crit chance (x5)`,
            badge: b => `+${Math.round(b.clickBonus * 100)}% click / +${Math.round(b.critBonus * 100)}% crit`
        },
        pet_moon_cat: {
            title: "Moon Panther's Grace",
            desc: b => `+${Math.round(b.doubleBrewBonus * 100)}% double potion chance & +${Math.round(b.orderBonus * 100)}% order gold`,
            badge: b => `+${Math.round(b.doubleBrewBonus * 100)}% potion / +${Math.round(b.orderBonus * 100)}% orders`
        },
        pet_astral_dragon: {
            title: 'Void Brilliance',
            desc: b => `+${Math.round(b.idleBonus * 100)}% passive income & +${Math.round(b.clickBonus * 100)}% click power`,
            badge: b => `+${Math.round(b.idleBonus * 100)}% inc. / +${Math.round(b.clickBonus * 100)}% click`
        },
        pet_phoenix: {
            title: 'Solar Radiance',
            desc: b => `+${Math.round(b.orderBonus * 100)}% gold from city orders & +${Math.round(b.idleBonus * 100)}% passive income`,
            badge: b => `+${Math.round(b.orderBonus * 100)}% orders / +${Math.round(b.idleBonus * 100)}% inc.`
        },
        pet_void_titan: {
            title: 'Lord of Eternity',
            desc: b => `+${Math.round(b.idleBonus * 100)}% income, +${Math.round(b.clickBonus * 100)}% click & +${b.offlineHoursBonus}h offline limit`,
            badge: b => `+${Math.round(b.idleBonus * 100)}% inc. / +${b.offlineHoursBonus}h offline`
        }
    },
    tr: {
        pet_rat: {
            title: 'Altın Kokusu',
            desc: b => `Dükkan pasif gelirine +%${(b.idleBonus * 100).toFixed(1)}`,
            badge: b => `+%${(b.idleBonus * 100).toFixed(1)} Gelir`
        },
        pet_slime: {
            title: 'Yapışkan Dokunuş',
            desc: b => `Kazan tıklama gücüne +%${(b.clickBonus * 100).toFixed(1)}`,
            badge: b => `+%${(b.clickBonus * 100).toFixed(1)} Tık`
        },
        pet_bat: {
            title: 'Gece Sonarı',
            desc: b => `Dükkan pasif gelirine +%${(b.idleBonus * 100).toFixed(1)}`,
            badge: b => `+%${(b.idleBonus * 100).toFixed(1)} Gelir`
        },
        pet_frog: {
            title: 'Bataklık Dürtüsü',
            desc: b => `Kazan tıklama gücüne +%${(b.clickBonus * 100).toFixed(1)}`,
            badge: b => `+%${(b.clickBonus * 100).toFixed(1)} Tık`
        },
        pet_spirit: {
            title: 'Eter Akışı',
            desc: b => `Dükkan pasif gelirine +%${Math.round(b.idleBonus * 100)}`,
            badge: b => `+%${Math.round(b.idleBonus * 100)} Gelir`
        },
        pet_owl: {
            title: 'Gece Bilgeliği',
            desc: b => `Kazan tıklama gücüne +%${Math.round(b.clickBonus * 100)}`,
            badge: b => `+%${Math.round(b.clickBonus * 100)} Tık`
        },
        pet_fox: {
            title: 'Tüccar Kurnazlığı',
            desc: b => `Şehir sipariş altınlarına +%${Math.round(b.orderBonus * 100)}`,
            badge: b => `+%${Math.round(b.orderBonus * 100)} Sipariş`
        },
        pet_gryphon: {
            title: 'Zirvelerin Gururu',
            desc: b => `+%${Math.round(b.idleBonus * 100)} pasif gelir ve +%${Math.round(b.clickBonus * 100)} tıklama gücü`,
            badge: b => `+%${Math.round(b.idleBonus * 100)} Gel. / +%${Math.round(b.clickBonus * 100)} Tık`
        },
        pet_golem: {
            title: 'Kristal Rezonansı',
            desc: b => `+%${Math.round(b.clickBonus * 100)} tıklama gücü ve +%${Math.round(b.idleBonus * 100)} pasif gelir`,
            badge: b => `+%${Math.round(b.clickBonus * 100)} Tık / +%${Math.round(b.idleBonus * 100)} Gel.`
        },
        pet_dragon: {
            title: 'Ejderha Hazinesi',
            desc: b => `+%${Math.round(b.idleBonus * 100)} pasif gelir ve +%${Math.round(b.clickBonus * 100)} tıklama gücü`,
            badge: b => `+%${Math.round(b.idleBonus * 100)} Gel. / +%${Math.round(b.clickBonus * 100)} Tık`
        },
        pet_manticore: {
            title: 'Ölümcül Avcı',
            desc: b => `+%${Math.round(b.clickBonus * 100)} tıklama gücü ve +%${Math.round(b.critBonus * 100)} kritik şansı (x5)`,
            badge: b => `+%${Math.round(b.clickBonus * 100)} Tık / +%${Math.round(b.critBonus * 100)} Kritik`
        },
        pet_moon_cat: {
            title: 'Ay Parsı Lütfu',
            desc: b => `+%${Math.round(b.doubleBrewBonus * 100)} çift iksir şansı ve +%${Math.round(b.orderBonus * 100)} sipariş altını`,
            badge: b => `+%${Math.round(b.doubleBrewBonus * 100)} İksir / +%${Math.round(b.orderBonus * 100)} Sipariş`
        },
        pet_astral_dragon: {
            title: 'Boşluk Parıltısı',
            desc: b => `+%${Math.round(b.idleBonus * 100)} pasif gelir ve +%${Math.round(b.clickBonus * 100)} tıklama gücü`,
            badge: b => `+%${Math.round(b.idleBonus * 100)} Gel. / +%${Math.round(b.clickBonus * 100)} Tık`
        },
        pet_phoenix: {
            title: 'Güneş Işıltısı',
            desc: b => `+%${Math.round(b.orderBonus * 100)} şehir sipariş altını ve +%${Math.round(b.idleBonus * 100)} dükkan geliri`,
            badge: b => `+%${Math.round(b.orderBonus * 100)} Sipariş / +%${Math.round(b.idleBonus * 100)} Gel.`
        },
        pet_void_titan: {
            title: 'Sonsuzluk Hükümdarı',
            desc: b => `+%${Math.round(b.idleBonus * 100)} gelir, +%${Math.round(b.clickBonus * 100)} tık ve +${b.offlineHoursBonus} saat çevrimdışı limit`,
            badge: b => `+%${Math.round(b.idleBonus * 100)} Gel. / +${b.offlineHoursBonus}s Çevrimdışı`
        }
    }
};

export function getPetAuraDetails(petId: string, level: number = 1, lang?: SupportedLang): PetAuraInfo {
    const l = lang || get(currentLang) || 'ru';
    const cleanLang: SupportedLang = (l === 'ru' || l === 'en' || l === 'tr') ? l : 'ru';
    const lvl = Math.max(1, Math.min(10, Math.floor(level || 1)));
    const bonuses = getPetBonusValues(petId, lvl);
    const isLegendary = LEGENDARY_PETS.has(petId);
    const rarity = getPetRarity(petId);

    const localeData = AURA_LOCALES[cleanLang]?.[petId] || AURA_LOCALES.ru[petId] || {
        title: 'Аура Спутника',
        desc: () => 'Дарует особые благословения в лавке',
        badge: () => 'Аура'
    };

    const title = localeData.title;
    const description = localeData.desc(bonuses);
    const badge = localeData.badge(bonuses);

    let nextLevelDescription: string | undefined;
    let nextBonuses: PetBonusData | undefined;

    if (lvl < 10) {
        nextBonuses = getPetBonusValues(petId, lvl + 1);
        nextLevelDescription = localeData.desc(nextBonuses);
    }

    return {
        petId,
        title,
        description,
        nextLevelDescription,
        badge,
        isLegendary,
        rarity,
        bonuses,
        nextBonuses
    };
}
