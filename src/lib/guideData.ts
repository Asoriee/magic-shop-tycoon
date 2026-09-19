export interface GuideMetadata {
    id: string;
    section: 'shop' | 'city' | 'grimoire' | 'premium';
    themeColor: string;
    accentColor: string;
    iconSvg: string;
}

export const ALL_GUIDES: GuideMetadata[] = [
    // --- 1. SHOP ---
    {
        id: 'shop_production',
        section: 'shop',
        themeColor: '#f1c40f',
        accentColor: '#d35400',
        iconSvg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
            <circle cx="24" cy="24" r="22" fill="#1e1533" stroke="#f1c40f" stroke-width="2"/>
            <path d="M12 34 L12 22 L24 14 L36 22 L36 34 Z" fill="#2d134d" stroke="#f1c40f" stroke-width="1.8"/>
            <rect x="20" y="26" width="8" height="8" fill="#f39c12"/>
            <circle cx="24" cy="18" r="3" fill="#ffeaa7"/>
            <path d="M16 18 L16 10 L20 10 L20 15" stroke="#ffeaa7" stroke-width="1.5"/>
            <circle cx="18" cy="8" r="2" fill="#e67e22"/>
        </svg>`
    },
    {
        id: 'shop_click',
        section: 'shop',
        themeColor: '#e74c3c',
        accentColor: '#f39c12',
        iconSvg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
            <circle cx="24" cy="24" r="22" fill="#221124" stroke="#e74c3c" stroke-width="2"/>
            <polygon points="26,6 12,24 22,24 20,40 36,20 26,20" fill="#f1c40f" stroke="#e74c3c" stroke-width="1.8" stroke-linejoin="round"/>
            <circle cx="24" cy="24" r="14" stroke="#ffeaa7" stroke-width="1" stroke-dasharray="3 3"/>
        </svg>`
    },
    {
        id: 'shop_mastery',
        section: 'shop',
        themeColor: '#a29bfe',
        accentColor: '#6c5ce7',
        iconSvg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
            <circle cx="24" cy="24" r="22" fill="#1a1138" stroke="#a29bfe" stroke-width="2"/>
            <circle cx="24" cy="24" r="16" stroke="#fdcb6e" stroke-width="1.6"/>
            <polygon points="24,10 28,19 38,19 30,26 33,36 24,30 15,36 18,26 10,19 20,19" fill="#9b59b6" stroke="#ffeaa7" stroke-width="1.4"/>
            <circle cx="24" cy="24" r="4" fill="#ffeaa7"/>
        </svg>`
    },
    {
        id: 'shop_milestones',
        section: 'shop',
        themeColor: '#ffd32a',
        accentColor: '#ff9f1a',
        iconSvg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
            <circle cx="24" cy="24" r="22" fill="#24190e" stroke="#ffd32a" stroke-width="2"/>
            <path d="M14 12 L34 12 L30 28 Q24 34 24 38 Q24 34 18 28 Z" fill="#f39c12" stroke="#ffd32a" stroke-width="1.8"/>
            <path d="M10 16 H14 V22 H10 Z M34 16 H38 V22 H34 Z" fill="#e67e22"/>
            <circle cx="24" cy="22" r="5" fill="#ffeaa7" stroke="#d35400" stroke-width="1"/>
        </svg>`
    },

    // --- 2. CITY ---
    {
        id: 'city_orders',
        section: 'city',
        themeColor: '#f39c12',
        accentColor: '#e67e22',
        iconSvg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
            <circle cx="24" cy="24" r="22" fill="#25160c" stroke="#f39c12" stroke-width="2"/>
            <path d="M14 10 C14 8 18 8 18 10 L18 36 C18 38 14 38 14 36 Z" fill="#d35400" stroke="#f39c12" stroke-width="1.4"/>
            <path d="M18 9 L34 9 C37 9 38 10 38 13 L38 33 C38 36 36 37 33 37 L18 37 Z" fill="#f5cd79" stroke="#d35400" stroke-width="1.5"/>
            <line x1="22" y1="16" x2="33" y2="16" stroke="#b7791f" stroke-width="2" stroke-linecap="round"/>
            <line x1="22" y1="22" x2="33" y2="22" stroke="#b7791f" stroke-width="2" stroke-linecap="round"/>
            <line x1="22" y1="28" x2="28" y2="28" stroke="#b7791f" stroke-width="2" stroke-linecap="round"/>
        </svg>`
    },
    {
        id: 'city_quests',
        section: 'city',
        themeColor: '#3498db',
        accentColor: '#2980b9',
        iconSvg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
            <circle cx="24" cy="24" r="22" fill="#0d1b2a" stroke="#3498db" stroke-width="2"/>
            <path d="M24 6 L38 12 L38 24 C38 33 24 42 24 42 C24 42 10 33 10 24 L10 12 Z" fill="#1b263b" stroke="#74b9ff" stroke-width="2"/>
            <line x1="17" y1="18" x2="31" y2="30" stroke="#f1c40f" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="31" y1="18" x2="17" y2="30" stroke="#f1c40f" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="24" cy="24" r="4.5" fill="#e74c3c" stroke="#fff" stroke-width="1"/>
        </svg>`
    },
    {
        id: 'city_chests',
        section: 'city',
        themeColor: '#e67e22',
        accentColor: '#f1c40f',
        iconSvg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
            <circle cx="24" cy="24" r="22" fill="#241407" stroke="#e67e22" stroke-width="2"/>
            <rect x="8" y="20" width="32" height="20" rx="3" fill="#8B4513" stroke="#f1c40f" stroke-width="1.8"/>
            <path d="M8 20 C8 12 16 8 24 8 C32 8 40 12 40 20 Z" fill="#a0522d" stroke="#f1c40f" stroke-width="1.8"/>
            <rect x="20" y="18" width="8" height="8" rx="2" fill="#f1c40f" stroke="#b7791f" stroke-width="1.5"/>
            <circle cx="24" cy="22" r="2" fill="#2c3e50"/>
        </svg>`
    },
    {
        id: 'city_artifacts',
        section: 'city',
        themeColor: '#9b59b6',
        accentColor: '#ffeaa7',
        iconSvg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
            <circle cx="24" cy="24" r="22" fill="#1f112e" stroke="#9b59b6" stroke-width="2"/>
            <path d="M24 6 L36 16 L30 36 L18 36 L12 16 Z" fill="#2d1b4e" stroke="#a29bfe" stroke-width="2"/>
            <circle cx="24" cy="23" r="7" fill="#8e44ad" stroke="#ffeaa7" stroke-width="1.5"/>
            <polygon points="24,18 26,22 30,23 27,26 28,30 24,28 20,30 21,26 18,23 22,22" fill="#ffeaa7"/>
        </svg>`
    },

    // --- 3. GRIMOIRE ---
    {
        id: 'grimoire_inventory',
        section: 'grimoire',
        themeColor: '#1abc9c',
        accentColor: '#16a085',
        iconSvg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
            <circle cx="24" cy="24" r="22" fill="#08201a" stroke="#1abc9c" stroke-width="2"/>
            <path d="M15 16 V12 C15 7 33 7 33 12 V16" stroke="#1abc9c" stroke-width="2.5" stroke-linecap="round"/>
            <rect x="9" y="16" width="30" height="24" rx="5" fill="#133d34" stroke="#2ecc71" stroke-width="2"/>
            <path d="M9 25 H39" stroke="#1abc9c" stroke-width="1.8"/>
            <circle cx="24" cy="25" r="3.5" fill="#f1c40f" stroke="#d4ac0d" stroke-width="1.2"/>
        </svg>`
    },
    {
        id: 'grimoire_alchemy',
        section: 'grimoire',
        themeColor: '#e056fd',
        accentColor: '#be2edd',
        iconSvg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
            <circle cx="24" cy="24" r="22" fill="#230d2e" stroke="#e056fd" stroke-width="2"/>
            <path d="M20 8 H28 M24 8 V18 L12 36 C10 39 12 42 16 42 H32 C36 42 38 39 36 36 L24 18" stroke="#e056fd" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M16 32 H32" stroke="#ffeaa7" stroke-width="1.8" stroke-linecap="round"/>
            <circle cx="24" cy="35" r="2.5" fill="#f1c40f"/>
            <circle cx="20" cy="28" r="1.8" fill="#686de0"/>
            <circle cx="28" cy="29" r="1.8" fill="#badc58"/>
        </svg>`
    },
    {
        id: 'grimoire_familiars',
        section: 'grimoire',
        themeColor: '#ff7979',
        accentColor: '#eb4d4b',
        iconSvg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
            <circle cx="24" cy="24" r="22" fill="#280f14" stroke="#ff7979" stroke-width="2"/>
            <path d="M24 10 C18 10 13 14 11 20 C8 26 10 33 16 37 C18 39 22 40 24 37 C26 40 30 39 32 37 C38 33 40 26 37 20 C35 14 30 10 24 10 Z" fill="#eb4d4b" stroke="#ffeaa7" stroke-width="1.8"/>
            <circle cx="19" cy="23" r="2.5" fill="#fff"/>
            <circle cx="19" cy="23" r="1.2" fill="#1e272e"/>
            <circle cx="29" cy="23" r="2.5" fill="#fff"/>
            <circle cx="29" cy="23" r="1.2" fill="#1e272e"/>
            <path d="M24 28 L22 31 H26 Z" fill="#ffeaa7"/>
        </svg>`
    },
    {
        id: 'grimoire_collections',
        section: 'grimoire',
        themeColor: '#686de0',
        accentColor: '#4834d4',
        iconSvg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
            <circle cx="24" cy="24" r="22" fill="#12132e" stroke="#686de0" stroke-width="2"/>
            <path d="M12 36 C12 36 17 33 24 33 C31 33 36 36 36 36 V12 C36 12 31 9 24 9 C17 9 12 12 12 12 Z" fill="#30336b" stroke="#a29bfe" stroke-width="2"/>
            <line x1="24" y1="9" x2="24" y2="33" stroke="#ffeaa7" stroke-width="1.8"/>
            <path d="M24 14 Q29 18 24 24 Q19 18 24 14 Z" fill="#f1c40f"/>
        </svg>`
    },

    // --- 4. PREMIUM ---
    {
        id: 'premium_bank',
        section: 'premium',
        themeColor: '#f1c40f',
        accentColor: '#e67e22',
        iconSvg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
            <circle cx="24" cy="24" r="22" fill="#241a06" stroke="#f1c40f" stroke-width="2"/>
            <path d="M8 34 L40 34 L38 40 L10 40 Z" fill="#b7791f"/>
            <path d="M8 34 L40 34 L44 18 L32 26 L24 8 L16 26 L4 18 Z" fill="#f1c40f" stroke="#ffeaa7" stroke-width="2"/>
            <circle cx="24" cy="8" r="3.5" fill="#e74c3c" stroke="#fff" stroke-width="1"/>
            <circle cx="4" cy="18" r="2.5" fill="#3498db"/>
            <circle cx="44" cy="18" r="2.5" fill="#3498db"/>
            <circle cx="24" cy="27" r="3" fill="#2ecc71"/>
        </svg>`
    },
    {
        id: 'premium_timeskip',
        section: 'premium',
        themeColor: '#00d2d3',
        accentColor: '#01a3a4',
        iconSvg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
            <circle cx="24" cy="24" r="22" fill="#041f22" stroke="#00d2d3" stroke-width="2"/>
            <rect x="12" y="6" width="24" height="5" rx="2" fill="#00d2d3"/>
            <rect x="12" y="37" width="24" height="5" rx="2" fill="#00d2d3"/>
            <path d="M14 11 L34 11 Q34 24 24 24 Q14 24 14 11 Z" fill="#48dbfb" opacity="0.6"/>
            <path d="M14 37 L34 37 Q34 24 24 24 Q14 24 14 37 Z" fill="#48dbfb" opacity="0.4"/>
            <circle cx="24" cy="24" r="3" fill="#f1c40f"/>
        </svg>`
    },
    {
        id: 'premium_secret',
        section: 'premium',
        themeColor: '#a55eea',
        accentColor: '#8854d0',
        iconSvg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
            <circle cx="24" cy="24" r="22" fill="#1b0e2b" stroke="#a55eea" stroke-width="2"/>
            <circle cx="24" cy="24" r="14" fill="#3b1d5a" stroke="#d1d8e0" stroke-width="1.8"/>
            <polygon points="24,12 27,20 36,24 27,28 24,36 21,28 12,24 21,20" fill="#a55eea" stroke="#ffeaa7" stroke-width="1.2"/>
            <circle cx="24" cy="24" r="2.5" fill="#ffeaa7"/>
        </svg>`
    },
    {
        id: 'premium_rebirth',
        section: 'premium',
        themeColor: '#ff6b6b',
        accentColor: '#ee5253',
        iconSvg: `<svg viewBox="0 0 48 48" width="40" height="40" fill="none">
            <circle cx="24" cy="24" r="22" fill="#240c0e" stroke="#ff6b6b" stroke-width="2"/>
            <circle cx="24" cy="24" r="16" stroke="#ff9f43" stroke-width="1.8" stroke-dasharray="6 4"/>
            <polygon points="24,10 36,32 12,32" stroke="#f1c40f" stroke-width="2" fill="none"/>
            <circle cx="24" cy="24" r="5" fill="#ee5253" stroke="#ffeaa7" stroke-width="1.5"/>
        </svg>`
    }
];

export const ALL_GUIDE_IDS: string[] = ALL_GUIDES.map(g => g.id);

export function getGuideMetadata(id: string): GuideMetadata {
    return ALL_GUIDES.find(g => g.id === id) || ALL_GUIDES[0];
}

export function getNextGuideId(currentId: string): string {
    const idx = ALL_GUIDES.findIndex(g => g.id === currentId);
    if (idx === -1) return ALL_GUIDES[0].id;
    return ALL_GUIDES[(idx + 1) % ALL_GUIDES.length].id;
}

export function getPrevGuideId(currentId: string): string {
    const idx = ALL_GUIDES.findIndex(g => g.id === currentId);
    if (idx === -1) return ALL_GUIDES[ALL_GUIDES.length - 1].id;
    return ALL_GUIDES[(idx - 1 + ALL_GUIDES.length) % ALL_GUIDES.length].id;
}

export function getGuidesBySection(section: 'shop' | 'city' | 'grimoire' | 'premium'): GuideMetadata[] {
    return ALL_GUIDES.filter(g => g.section === section);
}
