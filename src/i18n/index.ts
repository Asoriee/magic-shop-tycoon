import { writable, derived, get } from 'svelte/store';
import type { SupportedLang, Translations } from './types';
import { ru } from './locales/ru';
import { en } from './locales/en';
import { tr } from './locales/tr';

export * from './types';

export const SUPPORTED_LANGS: SupportedLang[] = ['ru', 'en', 'tr'];
export const DEFAULT_LANG: SupportedLang = 'ru';

export const locales: Record<SupportedLang, Translations> = {
    ru,
    en,
    tr
};

const STORAGE_LANG_KEY = 'magicShopTycoon_lang';

/**
 * Detects the language according to Yandex Games requirements:
 * 1. URL Query Param: ?lang=en (used by Yandex testers and dev tools)
 * 2. Yandex Games SDK environment: ysdk.environment.i18n.lang
 * 3. User manual selection from localStorage
 * 4. Browser navigator fallback
 */
export function detectInitialLanguage(ysdkLang?: string | null): SupportedLang {
    try {
        // 1. URL search param (for Yandex moderation & dev testing)
        if (typeof window !== 'undefined' && window.location?.search) {
            const params = new URLSearchParams(window.location.search);
            const queryLang = params.get('lang')?.toLowerCase();
            if (queryLang && isSupportedLang(queryLang)) {
                return queryLang;
            }
        }

        // 2. Yandex SDK environment
        if (ysdkLang) {
            const cleanYsdkLang = ysdkLang.toLowerCase().slice(0, 2);
            if (cleanYsdkLang === 'ru' || cleanYsdkLang === 'be' || cleanYsdkLang === 'kk' || cleanYsdkLang === 'uk' || cleanYsdkLang === 'uz') {
                return 'ru';
            }
            if (cleanYsdkLang === 'tr') {
                return 'tr';
            }
            if (isSupportedLang(cleanYsdkLang)) {
                return cleanYsdkLang;
            }
            return 'en'; // Default international fallback for Yandex players outside CIS/Turkey
        }

        // 3. User manual selection in localStorage
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_LANG_KEY)?.toLowerCase();
            if (saved && isSupportedLang(saved)) {
                return saved;
            }
        }

        // 4. Browser fallback
        if (typeof navigator !== 'undefined' && navigator.language) {
            const nav = navigator.language.toLowerCase().slice(0, 2);
            if (nav === 'ru' || nav === 'be' || nav === 'kk' || nav === 'uk') return 'ru';
            if (nav === 'tr') return 'tr';
            return 'en';
        }
    } catch (e) {
        console.warn('Language detection error:', e);
    }

    return DEFAULT_LANG;
}

export function isSupportedLang(lang: string): lang is SupportedLang {
    return (SUPPORTED_LANGS as string[]).includes(lang);
}

// Global reactive store for current language
export const currentLang = writable<SupportedLang>(detectInitialLanguage());

/**
 * Set the current language, update localStorage, and sync document metadata.
 */
export function setLanguage(lang: SupportedLang): void {
    if (!isSupportedLang(lang)) return;
    currentLang.set(lang);

    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_LANG_KEY, lang);
        }
        if (typeof document !== 'undefined') {
            document.documentElement.lang = lang;
            const title = locales[lang]?.meta?.gameTitle;
            if (title) {
                document.title = title;
            }
        }
    } catch (e) {
        console.warn('Failed to persist language selection:', e);
    }
}

/**
 * Reactive translation helper for Svelte templates:
 * Usage in Svelte: `{$t('common.gold')}` or `{$t('header.vipDays', { days: 10 })}`
 */
export const t = derived(currentLang, ($lang) => {
    return (key: string, params?: Record<string, string | number>): string => {
        return translateKey($lang, key, params);
    };
});

/**
 * Synchronous non-reactive translation helper.
 */
export function translate(key: string, params?: Record<string, string | number>): string {
    const lang = get(currentLang);
    return translateKey(lang, key, params);
}

function translateKey(lang: SupportedLang, key: string, params?: Record<string, string | number>): string {
    const dict = locales[lang] || locales[DEFAULT_LANG];
    const parts = key.split('.');
    let cur: any = dict;

    for (const part of parts) {
        if (cur && typeof cur === 'object' && part in cur) {
            cur = cur[part];
        } else {
            // Fallback to Russian
            let fb: any = locales[DEFAULT_LANG];
            for (const p of parts) {
                if (fb && typeof fb === 'object' && p in fb) {
                    fb = fb[p];
                } else {
                    return key; // return key if missing in both
                }
            }
            cur = fb;
            break;
        }
    }

    if (typeof cur !== 'string') {
        return key;
    }

    if (!params) return cur;

    return cur.replace(/\{(\w+)\}/g, (_, k) => {
        return params[k] !== undefined ? String(params[k]) : `{${k}}`;
    });
}

/**
 * Localized Number Formatter.
 */
export function formatNumberLocalized(num: number | undefined | null, lang?: SupportedLang): string {
    if (num === undefined || num === null) return '0';
    const n = Number(num);
    if (isNaN(n) || !isFinite(n)) return '0';

    const activeLang = lang || get(currentLang);
    const units = locales[activeLang]?.numberUnits || locales.ru.numberUnits;

    if (n >= 1_000_000_000_000_000_000) return (n / 1_000_000_000_000_000_000).toFixed(2) + units.quintillion;
    if (n >= 1_000_000_000_000_000) return (n / 1_000_000_000_000_000).toFixed(2) + units.quadrillion;
    if (n >= 1_000_000_000_000) return (n / 1_000_000_000_000).toFixed(2) + units.trillion;
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + units.billion;
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + units.million;
    if (n >= 1_000) return (n / 1_000).toFixed(1) + units.thousand;
    if (n % 1 !== 0) return n.toFixed(1);
    return Math.floor(n).toString();
}

// --- Dynamic Entity Getters ---

export function getIngredientName(id: string, lang?: SupportedLang): string {
    const l = lang || get(currentLang);
    return locales[l]?.ingredients?.[id]?.name || locales.ru.ingredients?.[id]?.name || id;
}

export function getPotionName(id: string, lang?: SupportedLang): string {
    const l = lang || get(currentLang);
    return locales[l]?.potions?.[id]?.name || locales.ru.potions?.[id]?.name || id;
}

export function getPotionDesc(id: string, lang?: SupportedLang): string {
    const l = lang || get(currentLang);
    return locales[l]?.potions?.[id]?.description || locales.ru.potions?.[id]?.description || '';
}

export function getPetName(id: string, lang?: SupportedLang): string {
    const l = lang || get(currentLang);
    return locales[l]?.pets?.[id]?.name || locales.ru.pets?.[id]?.name || id;
}

export function getPetDesc(id: string, lang?: SupportedLang): string {
    const l = lang || get(currentLang);
    return locales[l]?.pets?.[id]?.description || locales.ru.pets?.[id]?.description || '';
}

export function getUpgradeName(id: string, lang?: SupportedLang): string {
    const l = lang || get(currentLang);
    return locales[l]?.upgrades?.[id]?.name || locales.ru.upgrades?.[id]?.name || id;
}

export function getUpgradeDesc(id: string, lang?: SupportedLang): string {
    const l = lang || get(currentLang);
    return locales[l]?.upgrades?.[id]?.description || locales.ru.upgrades?.[id]?.description || '';
}

export function getSecretUpgradeName(id: string, lang?: SupportedLang): string {
    const l = lang || get(currentLang);
    return locales[l]?.secretUpgrades?.[id]?.name || locales.ru.secretUpgrades?.[id]?.name || id;
}

export function getSecretUpgradeDesc(id: string, lang?: SupportedLang): string {
    const l = lang || get(currentLang);
    return locales[l]?.secretUpgrades?.[id]?.description || locales.ru.secretUpgrades?.[id]?.description || '';
}

export function getArtifactName(id: number, lang?: SupportedLang): string {
    const l = lang || get(currentLang);
    return locales[l]?.artifacts?.[id]?.name || locales.ru.artifacts?.[id]?.name || `Artifact #${id}`;
}

export function getArtifactDesc(id: number, lang?: SupportedLang): string {
    const l = lang || get(currentLang);
    return locales[l]?.artifacts?.[id]?.description || locales.ru.artifacts?.[id]?.description || '';
}

export function getCollectionName(id: string, lang?: SupportedLang): string {
    const l = lang || get(currentLang);
    return locales[l]?.collections?.[id]?.name || locales.ru.collections?.[id]?.name || id;
}

export function getCollectionDesc(id: string, lang?: SupportedLang): string {
    const l = lang || get(currentLang);
    return locales[l]?.collections?.[id]?.description || locales.ru.collections?.[id]?.description || '';
}

export function getCollectionPerks(id: string, lang?: SupportedLang): string[] {
    const l = lang || get(currentLang);
    return locales[l]?.collections?.[id]?.perks || locales.ru.collections?.[id]?.perks || [];
}

export function getCustomerName(rawName: string, lang?: SupportedLang): string {
    const l = lang || get(currentLang);
    return locales[l]?.customers?.[rawName] || locales.ru.customers?.[rawName] || rawName;
}

export function getCustomerArchetype(name: string, isVip?: boolean, orderType?: string): 'vip' | 'mage' | 'knight' | 'citizen' {
    if (isVip) return 'vip';
    if (orderType === 'potion') return 'mage';
    if (name === 'Рыцарь Ордена' || name === 'Страж Ворот' || name.includes('Knight') || name.includes('Guard') || name.includes('Şövalye') || name.includes('Muhafız')) return 'knight';
    if (name === 'Боевой Маг' || name === 'Странствующий Чародей' || name === 'Ведьма Пустошей' || name.includes('Mage') || name.includes('Wizard') || name.includes('Witch') || name.includes('Büyücü') || name.includes('Sihirbaz') || name.includes('Cadı')) return 'mage';
    return 'citizen';
}

