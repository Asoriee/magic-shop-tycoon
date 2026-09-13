import { writable, get } from 'svelte/store';

// Check saved sound preferences
const savedMute = typeof localStorage !== 'undefined' ? localStorage.getItem('mst_sound_muted') === 'true' : false;
export const isSoundMuted = writable<boolean>(savedMute);

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

export function toggleSound(): boolean {
    const next = !get(isSoundMuted);
    isSoundMuted.set(next);
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mst_sound_muted', next ? 'true' : 'false');
    }
    if (!next) {
        playCoinSound();
    }
    return next;
}

/**
 * Bubble sound for cauldron click
 */
export function playCauldronBubble(): void {
    if (get(isSoundMuted)) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const baseFreq = 260 + Math.random() * 120;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
}

/**
 * Crisp metallic coin chime
 */
export function playCoinSound(): void {
    if (get(isSoundMuted)) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';

        osc1.frequency.setValueAtTime(987.77, now); // B5
        osc1.frequency.setValueAtTime(1318.51, now + 0.06); // E6

        osc2.frequency.setValueAtTime(1975.53, now); // B6
        osc2.frequency.setValueAtTime(2637.02, now + 0.06); // E7

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.36);
        osc2.stop(now + 0.36);
    } catch (e) {}
}

/**
 * Melodic triumph chime for order complete / chest open
 */
export function playSuccessSound(): void {
    if (get(isSoundMuted)) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = ctx.currentTime + (i * 0.07);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.18, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(start);
            osc.stop(start + 0.32);
        });
    } catch (e) {}
}

/**
 * Level up / High tier reward arpeggio
 */
export function playLevelUpSound(): void {
    if (get(isSoundMuted)) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51]; // A major arpeggio
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = ctx.currentTime + (i * 0.05);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.22, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(start);
            osc.stop(start + 0.36);
        });
    } catch (e) {}
}

/**
 * Sizzle / Overheat sound
 */
export function playOverheatSizzle(): void {
    if (get(isSoundMuted)) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const bufferSize = ctx.sampleRate * 0.4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
        filter.Q.setValueAtTime(2, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
        noise.stop(ctx.currentTime + 0.4);
    } catch (e) {}
}
