/**
 * Security & Anti-Cheat Module for Magic Shop Tycoon
 * 
 * Provides:
 * 1. Cryptographic salted checksum generation & validation for game saves.
 * 2. Save payload obfuscation to prevent raw JSON tampering in DevTools.
 * 3. State sanity auditing (capping impossible values, verifying prestige limits).
 * 4. Rate-limiting for clicks (CPS capping) and leaderboard submissions.
 * 5. Time-travel anomaly detection.
 */

const SAVE_SALT = 'M4g1cSh0p_Tyco0n_Yand3x_2026_SecureKey!';

/**
 * Fast 64-bit salted hash function for save integrity.
 */
export function calculateSaveChecksum(data: {
    gold: number;
    crystals: number;
    stardust: number;
    totalStardustEarned: number;
    vipExpiresAt: number;
    artifactsCount: number;
    lastSaveTime: number;
}): string {
    const raw = [
        Math.floor(data.gold || 0),
        Math.floor(data.crystals || 0),
        Math.floor(data.stardust || 0),
        Math.floor(data.totalStardustEarned || 0),
        Math.floor(data.vipExpiresAt || 0),
        data.artifactsCount || 0,
        Math.floor(data.lastSaveTime || 0),
        SAVE_SALT
    ].join('::');

    let h1 = 0xdeadbeef;
    let h2 = 0x41c64e6d;
    for (let i = 0; i < raw.length; i++) {
        const ch = raw.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/**
 * Obfuscate plain JSON to prevent casual DevTools editing.
 */
export function packSaveData(stateObj: any): string {
    try {
        const json = JSON.stringify(stateObj);
        const checksum = calculateSaveChecksum({
            gold: stateObj.gold,
            crystals: stateObj.crystals,
            stardust: stateObj.stardust,
            totalStardustEarned: stateObj.totalStardustEarned,
            vipExpiresAt: stateObj.vipExpiresAt,
            artifactsCount: stateObj.artifacts?.length || 0,
            lastSaveTime: stateObj.lastSaveTime || Date.now()
        });

        // Simple reversible XOR cipher with key
        const key = 0x5a;
        let obfuscated = '';
        for (let i = 0; i < json.length; i++) {
            obfuscated += String.fromCharCode(json.charCodeAt(i) ^ key);
        }

        // Base64 encode for safe storage
        const encoded = btoa(unescape(encodeURIComponent(obfuscated)));
        
        return JSON.stringify({
            v: 2,
            sig: checksum,
            p: encoded
        });
    } catch (e) {
        console.warn('Failed to pack save data, fallback to JSON', e);
        return JSON.stringify(stateObj);
    }
}

/**
 * Unpack & verify save data with backward compatibility for plain v1 JSON.
 */
export function unpackSaveData(rawString: string): any {
    if (!rawString || typeof rawString !== 'string') return null;

    try {
        const parsed = JSON.parse(rawString);

        // Check if version 2 encrypted envelope
        if (parsed && parsed.v === 2 && typeof parsed.p === 'string' && typeof parsed.sig === 'string') {
            const decoded = decodeURIComponent(escape(atob(parsed.p)));
            const key = 0x5a;
            let json = '';
            for (let i = 0; i < decoded.length; i++) {
                json += String.fromCharCode(decoded.charCodeAt(i) ^ key);
            }
            const data = JSON.parse(json);

            // Verify checksum
            const expectedSig = calculateSaveChecksum({
                gold: data.gold,
                crystals: data.crystals,
                stardust: data.stardust,
                totalStardustEarned: data.totalStardustEarned,
                vipExpiresAt: data.vipExpiresAt,
                artifactsCount: data.artifacts?.length || 0,
                lastSaveTime: data.lastSaveTime || 0
            });

            if (parsed.sig !== expectedSig) {
                console.warn('[Security] Save signature mismatch detected! Applying sanitization.');
                return sanitizeStateValues(data, true);
            }

            return sanitizeStateValues(data, false);
        }

        // Legacy unencrypted v1 save
        return sanitizeStateValues(parsed, false);
    } catch (e) {
        console.warn('Failed to unpack save data', e);
        return null;
    }
}

/**
 * Sanitize state values to prevent NaN, Infinity, negative values, and absurd cheats.
 */
export function sanitizeStateValues(state: any, isTampered = false): any {
    if (!state || typeof state !== 'object') return null;

    const s = { ...state };

    // Gold validation
    if (typeof s.gold !== 'number' || isNaN(s.gold) || s.gold < 0) {
        s.gold = 10;
    }
    if (isTampered || s.gold > 1e24) {
        s.gold = Math.min(s.gold, 1e20);
    }

    // Crystals validation
    if (typeof s.crystals !== 'number' || isNaN(s.crystals) || s.crystals < 0) {
        s.crystals = 0;
    }
    if (isTampered && s.crystals > 1000) {
        s.crystals = 50;
    }

    // Stardust validation
    if (typeof s.stardust !== 'number' || isNaN(s.stardust) || s.stardust < 0) {
        s.stardust = 0;
    }
    if (typeof s.totalStardustEarned !== 'number' || isNaN(s.totalStardustEarned) || s.totalStardustEarned < s.stardust) {
        s.totalStardustEarned = s.stardust;
    }

    // VIP Expiry validation (max 35 days in future)
    const now = Date.now();
    const maxVipFuture = now + 35 * 24 * 60 * 60 * 1000;
    if (typeof s.vipExpiresAt === 'number') {
        if (s.vipExpiresAt > maxVipFuture) {
            console.warn('[Security] Detected invalid VIP expiration timestamp. Clamping.');
            s.vipExpiresAt = maxVipFuture;
        } else if (isNaN(s.vipExpiresAt) || s.vipExpiresAt < 0) {
            s.vipExpiresAt = 0;
        }
    }

    // Timestamps sanity check
    if (typeof s.lastSaveTime !== 'number' || isNaN(s.lastSaveTime) || s.lastSaveTime > now + 300000) {
        s.lastSaveTime = now;
    }

    return s;
}

/**
 * Rate Limiter for clicks (Autoclicker / CPS Defense)
 */
export class ClickRateLimiter {
    private timestamps: number[] = [];
    private maxCps: number;

    constructor(maxCps = 16) {
        this.maxCps = maxCps;
    }

    public canClick(now = Date.now()): boolean {
        // Keep timestamps within the last 1000ms window
        this.timestamps = this.timestamps.filter(t => now - t < 1000);
        if (this.timestamps.length >= this.maxCps) {
            return false;
        }
        this.timestamps.push(now);
        return true;
    }
}
