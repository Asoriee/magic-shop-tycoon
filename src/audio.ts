import { writable, get } from 'svelte/store';

// Stored sound preferences
const savedSfxMute = typeof localStorage !== 'undefined' 
    ? (localStorage.getItem('mst_sfx_muted') ?? localStorage.getItem('mst_sound_muted')) === 'true' 
    : false;
const savedSfxVol = typeof localStorage !== 'undefined' 
    ? parseFloat(localStorage.getItem('mst_sfx_volume') || '0.8') 
    : 0.8;

const savedAmbientMute = typeof localStorage !== 'undefined' 
    ? localStorage.getItem('mst_ambient_muted') === 'true' 
    : false;
const savedAmbientVol = typeof localStorage !== 'undefined' 
    ? parseFloat(localStorage.getItem('mst_ambient_volume') || '0.35') 
    : 0.35;

export const isSfxMuted = writable<boolean>(savedSfxMute);
export const sfxVolume = writable<number>(isNaN(savedSfxVol) ? 0.8 : savedSfxVol);

export const isAmbientMuted = writable<boolean>(savedAmbientMute);
export const ambientVolume = writable<number>(isNaN(savedAmbientVol) ? 0.35 : savedAmbientVol);

// Backwards-compatible alias for existing code
export const isSoundMuted = isSfxMuted;

let audioCtx: AudioContext | null = null;
let sfxGainNode: GainNode | null = null;
let isAdAudioSuppressed = false;

// Ambient Web Audio Nodes & State
interface AmbientNodes {
    masterGain: GainNode;
    droneOsc1: OscillatorNode;
    droneOsc2: OscillatorNode;
    droneFilter: BiquadFilterNode;
    lfoOsc: OscillatorNode;
    lfoGain: GainNode;
    shimmerOsc: OscillatorNode;
    shimmerFilter: BiquadFilterNode;
    shimmerGain: GainNode;
    bubbleTimer: any;
}
let ambientNodes: AmbientNodes | null = null;
let isAmbientStarted = false;

export function suspendAudio(): void {
    if (audioCtx && audioCtx.state === 'running') {
        try {
            audioCtx.suspend();
        } catch (e) {}
    }
}

export function resumeAudio(): void {
    if (isAdAudioSuppressed || (typeof document !== 'undefined' && document.hidden)) return;
    if (audioCtx && audioCtx.state === 'suspended') {
        try {
            audioCtx.resume();
        } catch (e) {}
    }
    updateAmbientState();
}

export function setAdAudioMute(muted: boolean): void {
    isAdAudioSuppressed = muted;
    if (muted) {
        suspendAudio();
    } else {
        resumeAudio();
    }
}

if (typeof window !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            suspendAudio();
        } else {
            resumeAudio();
        }
    });

    window.addEventListener('blur', () => {
        suspendAudio();
    });

    window.addEventListener('focus', () => {
        resumeAudio();
    });

    // Auto-init audio & ambient on first user interaction
    const initOnFirstGesture = () => {
        ensureAudioContext();
        startAmbientEngine();
        window.removeEventListener('pointerdown', initOnFirstGesture);
        window.removeEventListener('keydown', initOnFirstGesture);
    };
    window.addEventListener('pointerdown', initOnFirstGesture, { once: true });
    window.addEventListener('keydown', initOnFirstGesture, { once: true });
}

function ensureAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
            sfxGainNode = audioCtx.createGain();
            sfxGainNode.connect(audioCtx.destination);
            updateSfxGain();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
    return audioCtx;
}

function getAudioContext(): AudioContext | null {
    if (isAdAudioSuppressed || (typeof document !== 'undefined' && document.hidden)) return null;
    return ensureAudioContext();
}

function updateSfxGain(): void {
    if (!sfxGainNode || !audioCtx) return;
    const muted = get(isSfxMuted);
    const vol = Math.max(0, Math.min(1, get(sfxVolume)));
    const target = muted ? 0.0001 : vol;
    try {
        sfxGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        sfxGainNode.gain.setTargetAtTime(target, audioCtx.currentTime, 0.04);
    } catch (e) {}
}

export function toggleSfx(): boolean {
    const next = !get(isSfxMuted);
    isSfxMuted.set(next);
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mst_sfx_muted', next ? 'true' : 'false');
        localStorage.setItem('mst_sound_muted', next ? 'true' : 'false');
    }
    updateSfxGain();
    if (!next) {
        playCoinSound();
    }
    return next;
}

export function setSfxVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    sfxVolume.set(clamped);
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mst_sfx_volume', clamped.toFixed(2));
    }
    updateSfxGain();
}

export function toggleAmbient(): boolean {
    const next = !get(isAmbientMuted);
    isAmbientMuted.set(next);
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mst_ambient_muted', next ? 'true' : 'false');
    }
    updateAmbientState();
    return next;
}

export function setAmbientVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    ambientVolume.set(clamped);
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mst_ambient_volume', clamped.toFixed(2));
    }
    updateAmbientState();
}

// Master sound toggle
export function toggleSound(): boolean {
    return toggleSfx();
}

// -------------------------------------------------------------
// Procedural Ambient Engine: Cauldron Drone + Shimmer + Bubbles
// -------------------------------------------------------------
function startAmbientEngine(): void {
    if (isAmbientStarted || typeof window === 'undefined') return;
    const ctx = ensureAudioContext();
    if (!ctx) return;

    try {
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
        masterGain.connect(ctx.destination);

        // 1. Warm Cauldron Drone (Low frequency warmth)
        const droneOsc1 = ctx.createOscillator();
        const droneOsc2 = ctx.createOscillator();
        const droneFilter = ctx.createBiquadFilter();

        droneOsc1.type = 'sine';
        droneOsc1.frequency.setValueAtTime(65.4, ctx.currentTime); // C2

        droneOsc2.type = 'triangle';
        droneOsc2.frequency.setValueAtTime(130.8, ctx.currentTime); // C3
        droneOsc2.detune.setValueAtTime(4, ctx.currentTime); // Gentle organic chorus

        droneFilter.type = 'lowpass';
        droneFilter.frequency.setValueAtTime(140, ctx.currentTime);
        droneFilter.Q.setValueAtTime(2.2, ctx.currentTime);

        // Slow LFO for subtle "hearth flame breathing"
        const lfoOsc = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfoOsc.type = 'sine';
        lfoOsc.frequency.setValueAtTime(0.07, ctx.currentTime); // 14-second cycle
        lfoGain.gain.setValueAtTime(35, ctx.currentTime); // Modulate cutoff by +-35Hz

        lfoOsc.connect(lfoGain);
        lfoGain.connect(droneFilter.frequency);

        droneOsc1.connect(droneFilter);
        droneOsc2.connect(droneFilter);
        droneFilter.connect(masterGain);

        // 2. Mystic Shimmer (Ethereal overtone)
        const shimmerOsc = ctx.createOscillator();
        const shimmerFilter = ctx.createBiquadFilter();
        const shimmerGain = ctx.createGain();

        shimmerOsc.type = 'sine';
        shimmerOsc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5

        shimmerFilter.type = 'bandpass';
        shimmerFilter.frequency.setValueAtTime(520, ctx.currentTime);
        shimmerFilter.Q.setValueAtTime(4.0, ctx.currentTime);

        shimmerGain.gain.setValueAtTime(0.04, ctx.currentTime);

        shimmerOsc.connect(shimmerFilter);
        shimmerFilter.connect(shimmerGain);
        shimmerGain.connect(masterGain);

        // Start continuous generators
        const now = ctx.currentTime;
        droneOsc1.start(now);
        droneOsc2.start(now);
        lfoOsc.start(now);
        shimmerOsc.start(now);

        // 3. Occasional subtle ambient cauldron bubbles
        const scheduleBubble = () => {
            const delay = 4000 + Math.random() * 6000;
            const timer = setTimeout(() => {
                playMicroAmbientBubble(ctx, masterGain);
                if (ambientNodes) {
                    ambientNodes.bubbleTimer = scheduleBubble();
                }
            }, delay);
            return timer;
        };

        ambientNodes = {
            masterGain,
            droneOsc1,
            droneOsc2,
            droneFilter,
            lfoOsc,
            lfoGain,
            shimmerOsc,
            shimmerFilter,
            shimmerGain,
            bubbleTimer: scheduleBubble()
        };

        isAmbientStarted = true;
        updateAmbientState();
    } catch (e) {
        console.warn('Ambient engine failed to initialize', e);
    }
}

function playMicroAmbientBubble(ctx: AudioContext, destination: GainNode): void {
    if (!ctx || ctx.state !== 'running' || get(isAmbientMuted) || isAdAudioSuppressed) return;
    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime;

        const startFreq = 220 + Math.random() * 80;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 1.5, now + 0.08);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(destination);

        osc.start(now);
        osc.stop(now + 0.1);
    } catch (e) {}
}

function updateAmbientState(): void {
    if (!ambientNodes || !audioCtx) {
        if (!isAmbientStarted && !get(isAmbientMuted)) {
            startAmbientEngine();
        }
        return;
    }

    const muted = get(isAmbientMuted) || isAdAudioSuppressed || (typeof document !== 'undefined' && document.hidden);
    const vol = Math.max(0, Math.min(1, get(ambientVolume)));
    // Max ambient master gain is ~0.15 to remain non-intrusive and soothing
    const target = muted ? 0.0001 : vol * 0.15;

    try {
        ambientNodes.masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
        ambientNodes.masterGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.4);
    } catch (e) {}
}

// -------------------------------------------------------------
// Sound Effects (Routed through sfxGainNode)
// -------------------------------------------------------------

function getSfxDestination(ctx: AudioContext): AudioNode {
    if (!sfxGainNode) {
        sfxGainNode = ctx.createGain();
        sfxGainNode.connect(ctx.destination);
        updateSfxGain();
    }
    return sfxGainNode;
}

/**
 * Bubble sound for cauldron click
 */
export function playCauldronBubble(): void {
    if (get(isSfxMuted)) return;
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
        gain.connect(getSfxDestination(ctx));

        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
}

/**
 * Crisp metallic coin chime
 */
export function playCoinSound(): void {
    if (get(isSfxMuted)) return;
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
        gain.connect(getSfxDestination(ctx));

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
    if (get(isSfxMuted)) return;
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
            gain.connect(getSfxDestination(ctx));

            osc.start(start);
            osc.stop(start + 0.32);
        });
    } catch (e) {}
}

/**
 * Level up / High tier reward arpeggio
 */
export function playLevelUpSound(): void {
    if (get(isSfxMuted)) return;
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
            gain.connect(getSfxDestination(ctx));

            osc.start(start);
            osc.stop(start + 0.36);
        });
    } catch (e) {}
}

/**
 * Sizzle / Overheat sound
 */
export function playOverheatSizzle(): void {
    if (get(isSfxMuted)) return;
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
        gain.connect(getSfxDestination(ctx));

        noise.start();
        noise.stop(ctx.currentTime + 0.4);
    } catch (e) {}
}

/**
 * Procedural mechanical/runic tick sound when sector boundary passes pointer
 */
export function playWheelTickSound(pitchFactor = 1.0): void {
    if (get(isSfxMuted)) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime;

        const freq = (520 + Math.random() * 30) * pitchFactor;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(gain);
        gain.connect(getSfxDestination(ctx));

        osc.start(now);
        osc.stop(now + 0.04);
    } catch (e) {}
}

/**
 * Grand fanfare when hitting Jackpot or Epic Pity chest
 */
export function playJackpotFanfare(): void {
    if (get(isSfxMuted)) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = ctx.currentTime + (i * 0.07);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.24, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);

            osc.connect(gain);
            gain.connect(getSfxDestination(ctx));

            osc.start(start);
            osc.stop(start + 0.58);
        });
    } catch (e) {}
}

/**
 * Procedural Grimoire parchment page turn sound
 */
export function playPageTurnSound(): void {
    if (get(isSfxMuted)) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const duration = 0.14;
        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.7;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Bandpass filter with sweep downwards (simulating parchment friction)
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        const now = ctx.currentTime;
        filter.frequency.setValueAtTime(950, now);
        filter.frequency.exponentialRampToValueAtTime(320, now + duration);
        filter.Q.setValueAtTime(2.0, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.16, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(getSfxDestination(ctx));

        noise.start(now);
        noise.stop(now + duration + 0.02);
    } catch (e) {}
}

/**
 * Procedural celestial Stardust crystal resonance chime (used in Arcanum & Ritual)
 */
export function playStardustSound(): void {
    if (get(isSfxMuted)) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        // High ethereal pentatonic bell cluster (F#6, A6, C#7, E7)
        const freqs = [1479.98, 1760.00, 2217.46, 2637.02];
        const now = ctx.currentTime;

        freqs.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + (idx * 0.035);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);
            // Slight sparkling micro-vibrato
            osc.frequency.linearRampToValueAtTime(freq + (Math.random() * 8 - 4), start + 0.5);

            gain.gain.setValueAtTime(0.14, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);

            osc.connect(gain);
            gain.connect(getSfxDestination(ctx));

            osc.start(start);
            osc.stop(start + 0.58);
        });
    } catch (e) {}
}
