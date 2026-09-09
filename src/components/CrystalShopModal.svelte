<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import gsap from 'gsap';
    import { 
        crystals, 
        gameStore, 
        currentIdleIncome, 
        useTimeSkip, 
        useFreeTimeSkip, 
        formatNumber 
    } from '../store';
    import { showRewardedAd, saveGame } from '../yandex-sdk';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void;

    function close() {
        onClose();
    }

    // Cooldown for free 1h skip: 45 minutes (2700 seconds)
    const FREE_SKIP_COOLDOWN_MS = 45 * 60 * 1000;
    let secondsToFreeSkip = 0;
    let freeSkipTimerInterval: any;

    function updateFreeSkipTimer() {
        const lastTime = $gameStore?.lastFreeTimeSkipTime || 0;
        const diff = Date.now() - lastTime;
        if (diff >= FREE_SKIP_COOLDOWN_MS) {
            secondsToFreeSkip = 0;
        } else {
            secondsToFreeSkip = Math.ceil((FREE_SKIP_COOLDOWN_MS - diff) / 1000);
        }
    }

    onMount(() => {
        updateFreeSkipTimer();
        freeSkipTimerInterval = setInterval(updateFreeSkipTimer, 1000);
    });

    onDestroy(() => {
        if (freeSkipTimerInterval) clearInterval(freeSkipTimerInterval);
    });

    function formatTime(secs: number): string {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    // GSAP button refs
    let btnRefs: Record<string, HTMLElement> = {};
    let resultMessages: Record<string, { text: string, visible: boolean }> = {
        free1: { text: '', visible: false },
        skip4: { text: '', visible: false },
        skip8: { text: '', visible: false },
        skip24: { text: '', visible: false }
    };

    const skips = [
        {
            id: 'skip4',
            label: 'Малый Скачок',
            hours: 4,
            cost: 15,
            desc: '4 часа пассивного дохода',
            color: '#74b9ff',
            glow: 'rgba(116, 185, 255, 0.4)'
        },
        {
            id: 'skip8',
            label: 'Сдвиг Эпохи',
            hours: 8,
            cost: 25,
            desc: '8 часов пассивного дохода',
            color: '#a29bfe',
            glow: 'rgba(162, 155, 254, 0.4)'
        },
        {
            id: 'skip24',
            label: 'Временной Разлом',
            hours: 24,
            cost: 60,
            desc: '24 часа пассивного дохода',
            color: '#fd79a8',
            glow: 'rgba(253, 121, 168, 0.5)'
        }
    ];

    function estimateGold(hours: number): string {
        const perSec = $currentIdleIncome || 0;
        if (perSec === 0) return '0';
        const total = Math.floor(perSec * hours * 3600);
        return formatNumber(total);
    }

    function triggerResultAnimation(id: string, earned: number) {
        const formatted = `+${formatNumber(earned)} G`;
        resultMessages[id] = { text: formatted, visible: true };

        setTimeout(() => {
            const el = document.getElementById(`result-${id}`);
            if (el) {
                gsap.fromTo(el,
                    { opacity: 1, y: 0 },
                    { opacity: 0, y: -28, duration: 1.2, ease: 'power2.out',
                      onComplete: () => { resultMessages[id] = { text: '', visible: false }; } }
                );
            }
        }, 30);
    }

    function handleFreeSkip() {
        if (secondsToFreeSkip > 0) return;
        showRewardedAd(
            () => {
                const earned = useFreeTimeSkip(1);
                saveGame();
                updateFreeSkipTimer();
                triggerResultAnimation('free1', earned);
            },
            () => {}
        );
    }

    function handleSkip(skip: typeof skips[number]) {
        const btn = btnRefs[skip.id];
        const earned = useTimeSkip(skip.hours, skip.cost);

        if (earned === 0) {
            // Not enough crystals — shake button
            if (btn) {
                gsap.to(btn, {
                    keyframes: [
                        { x: -6, duration: 0.05 },
                        { x:  6, duration: 0.05 },
                        { x: -4, duration: 0.05 },
                        { x:  4, duration: 0.05 },
                        { x:  0, duration: 0.05 },
                    ],
                    ease: 'none'
                });
            }
        } else {
            saveGame();
            // Success — green flash
            if (btn) {
                gsap.fromTo(btn,
                    { backgroundColor: skip.color },
                    { backgroundColor: '#2ecc71', yoyo: true, repeat: 1, duration: 0.25,
                      onComplete: () => { if (btn) gsap.set(btn, { clearProps: 'backgroundColor' }); } }
                );
            }
            triggerResultAnimation(skip.id, earned);
        }
    }
</script>

{#if isOpen}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="overlay" class:embedded={isEmbedded} on:click={close}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal" class:embedded-modal={isEmbedded} on:click|stopPropagation>

        {#if !isEmbedded}
            <div class="tab-header">
                <div class="tab-title-row">
                    <div class="header-icon">
                        <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
                            <circle cx="20" cy="20" r="18" fill="#1b1236" stroke="#74b9ff" stroke-width="1.5"/>
                            <path d="M20 8 V20 L26 26" stroke="#f1c40f" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <h2 class="tab-title">Хрономантия</h2>
                </div>
                <button class="close-btn" on:click={onClose} aria-label="Закрыть">✕</button>
            </div>
        {/if}

        {#if $currentIdleIncome === 0}
            <div class="no-income-warning">
                <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                    <circle cx="10" cy="10" r="9" stroke="#f39c12" stroke-width="1.5"/>
                    <line x1="10" y1="6" x2="10" y2="10" stroke="#f39c12" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="10" cy="14" r="1.2" fill="#f39c12"/>
                </svg>
                <span>У вас пока нет пассивного дохода. Улучшайте лавку, чтобы временные скачки приносили золото!</span>
            </div>
        {/if}

        <div class="chrono-list">

            <!-- 1. Free 1-Hour Impulse (Rewarded Ad) -->
            <div class="skip-card free-card" style="--accent: #2ecc71; --glow: rgba(46, 204, 113, 0.3)">
                <div class="card-visual">
                    <svg viewBox="0 0 50 60" width="44" height="52" fill="none">
                        <defs>
                            <radialGradient id="freePulseAura" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#2ecc71"/>
                                <stop offset="100%" stop-color="#27ae60" stop-opacity="0"/>
                            </radialGradient>
                        </defs>
                        <circle cx="25" cy="30" r="22" fill="url(#freePulseAura)" opacity="0.2"/>
                        <!-- Small Hourglass -->
                        <rect x="10" y="8" width="30" height="4" rx="2" fill="#2ecc71"/>
                        <rect x="10" y="48" width="30" height="4" rx="2" fill="#2ecc71"/>
                        <path d="M12 12 L38 12 Q38 30 25 30 Q12 30 12 12 Z" fill="#2ecc71" opacity="0.7"/>
                        <path d="M12 48 L38 48 Q38 30 25 30 Q12 30 12 48 Z" fill="#2ecc71" opacity="0.4"/>
                        <circle cx="25" cy="30" r="3" fill="#ffeaa7"/>
                    </svg>
                </div>

                <div class="card-content">
                    <div class="card-title-row">
                        <h4 class="card-label">Малый Хроно-Импульс</h4>
                        <span class="free-pill">БЕСПЛАТНО</span>
                    </div>
                    <p class="card-desc">1 час пассивного дохода за рекламу</p>
                    <div class="card-estimate">
                        <svg viewBox="0 0 20 20" width="13" height="13" fill="none">
                            <circle cx="10" cy="10" r="8" fill="#f1c40f" stroke="#d4ac0d" stroke-width="1.5"/>
                            <circle cx="10" cy="10" r="4" fill="#f39c12"/>
                        </svg>
                        <span>≈ +{estimateGold(1)} золота</span>
                    </div>
                </div>

                <div class="card-action">
                    {#if secondsToFreeSkip === 0}
                        <button 
                            type="button" 
                            class="action-btn free-btn" 
                            on:click={handleFreeSkip} 
                            bind:this={btnRefs['free1']}
                        >
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                            <span>Смотреть</span>
                        </button>
                    {:else}
                        <div class="cooldown-badge">
                            <svg viewBox="0 0 20 20" width="12" height="12" fill="none">
                                <circle cx="10" cy="10" r="8" stroke="#b2bec3" stroke-width="1.5"/>
                                <path d="M10 6 V10 L13 12" stroke="#b2bec3" stroke-width="1.5"/>
                            </svg>
                            <span>{formatTime(secondsToFreeSkip)}</span>
                        </div>
                    {/if}

                    {#if resultMessages['free1'].visible}
                        <div class="result-flyout" id="result-free1">
                            {resultMessages['free1'].text}
                        </div>
                    {/if}
                </div>
            </div>

            <!-- 2. Premium Skips Grid -->
            {#each skips as skip}
                <div class="skip-card" style="--accent: {skip.color}; --glow: {skip.glow}">
                    
                    <div class="card-visual">
                        {#if skip.hours === 4}
                            <!-- 4h Hourglass -->
                            <svg viewBox="0 0 50 60" width="44" height="52" fill="none">
                                <rect x="8" y="6" width="34" height="5" rx="2" fill="#74b9ff"/>
                                <rect x="8" y="49" width="34" height="5" rx="2" fill="#74b9ff"/>
                                <path d="M10 11 L40 11 Q40 30 25 30 Q10 30 10 11 Z" fill="#74b9ff" opacity="0.6"/>
                                <path d="M10 49 L40 49 Q40 30 25 30 Q10 30 10 49 Z" fill="#74b9ff" opacity="0.3"/>
                                <circle cx="25" cy="30" r="3.5" fill="#ffeaa7"/>
                            </svg>
                        {:else if skip.hours === 8}
                            <!-- 8h Arcane Astrolabe -->
                            <svg viewBox="0 0 54 54" width="46" height="46" fill="none">
                                <circle cx="27" cy="27" r="23" fill="#1e1035" stroke="#a29bfe" stroke-width="1.8"/>
                                <circle cx="27" cy="27" r="18" fill="none" stroke="rgba(162, 155, 254, 0.3)" stroke-dasharray="3 3"/>
                                <line x1="27" y1="27" x2="27" y2="12" stroke="#f1c40f" stroke-width="2.5" stroke-linecap="round"/>
                                <line x1="27" y1="27" x2="36" y2="27" stroke="#f1c40f" stroke-width="2.5" stroke-linecap="round"/>
                                <circle cx="27" cy="27" r="3" fill="#f1c40f"/>
                            </svg>
                        {:else}
                            <!-- 24h Temporal Vortex -->
                            <svg viewBox="0 0 60 50" width="50" height="42" fill="none">
                                <defs>
                                    <radialGradient id="vortexGlow" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" stop-color="#fd79a8"/>
                                        <stop offset="70%" stop-color="#6c5ce7"/>
                                        <stop offset="100%" stop-color="#0984e3" stop-opacity="0"/>
                                    </radialGradient>
                                </defs>
                                <ellipse cx="30" cy="25" rx="26" ry="18" fill="url(#vortexGlow)" opacity="0.4"/>
                                <ellipse cx="30" cy="25" rx="22" ry="12" fill="none" stroke="#fd79a8" stroke-width="1.8"/>
                                <ellipse cx="30" cy="25" rx="14" ry="7" fill="none" stroke="#a29bfe" stroke-width="1.5"/>
                                <circle cx="30" cy="25" r="3.5" fill="#fff"/>
                            </svg>
                        {/if}
                    </div>

                    <div class="card-content">
                        <h4 class="card-label">{skip.label}</h4>
                        <p class="card-desc">{skip.desc}</p>
                        <div class="card-estimate">
                            <svg viewBox="0 0 20 20" width="13" height="13" fill="none">
                                <circle cx="10" cy="10" r="8" fill="#f1c40f" stroke="#d4ac0d" stroke-width="1.5"/>
                                <circle cx="10" cy="10" r="4" fill="#f39c12"/>
                            </svg>
                            <span>≈ +{estimateGold(skip.hours)} золота</span>
                        </div>
                    </div>

                    <div class="card-action">
                        <button 
                            type="button"
                            class="action-btn crystal-btn" 
                            on:click={() => handleSkip(skip)} 
                            bind:this={btnRefs[skip.id]} 
                            disabled={$crystals < skip.cost}
                        >
                            <span class="btn-cost">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="#74b9ff">
                                    <polygon points="12,2 20,7 16,21 8,21 4,7"/>
                                </svg>
                                {skip.cost}
                            </span>
                            <span class="btn-sub">Купить</span>
                        </button>

                        {#if resultMessages[skip.id].visible}
                            <div class="result-flyout" id="result-{skip.id}">
                                {resultMessages[skip.id].text}
                            </div>
                        {/if}
                    </div>

                </div>
            {/each}

        </div>

    </div>
</div>
{/if}

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 200;
        backdrop-filter: blur(8px);
    }

    .modal {
        background: linear-gradient(150deg, #1b0a33 0%, #100620 100%);
        border: 2px solid rgba(162, 155, 254, 0.4);
        border-radius: 20px;
        box-shadow: 0 0 40px rgba(0,0,0,0.8);
        width: 95%;
        max-width: 580px;
        max-height: 88vh;
        overflow-y: auto;
        color: white;
        padding: 20px;
        box-sizing: border-box;
    }

    .embedded {
        position: relative;
        background: transparent;
        backdrop-filter: none;
        z-index: 1;
        padding: 0;
        inset: auto;
        display: block;
    }

    .embedded-modal {
        box-shadow: none;
        border: none;
        border-radius: 0;
        width: 100%;
        max-width: none;
        max-height: none;
        background: transparent;
        padding: 4px 0 16px;
    }

    .tab-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        border-bottom: 1px solid rgba(162, 155, 254, 0.2);
        padding-bottom: 12px;
    }

    .tab-title-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .tab-title {
        font-size: 1.3rem;
        color: #74b9ff;
        margin: 0;
    }

    .close-btn {
        background: none;
        border: none;
        color: #b2bec3;
        font-size: 1.4rem;
        cursor: pointer;
    }

    .no-income-warning {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(243, 156, 18, 0.15);
        border: 1px solid rgba(243, 156, 18, 0.4);
        border-radius: 10px;
        padding: 10px 14px;
        color: #f39c12;
        font-size: 0.82rem;
        margin-bottom: 14px;
    }

    .chrono-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .skip-card {
        position: relative;
        background: rgba(255, 255, 255, 0.03);
        border: 1.5px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 14px 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    }

    .skip-card:hover {
        border-color: var(--accent);
        box-shadow: 0 4px 16px var(--glow);
    }

    .free-card {
        background: linear-gradient(135deg, rgba(46, 204, 113, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
        border-color: rgba(46, 204, 113, 0.35);
    }

    .card-visual {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .card-content {
        flex: 1;
        min-width: 0;
    }

    .card-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 2px;
    }

    .card-label {
        margin: 0;
        font-size: 1rem;
        font-weight: 800;
        color: #fff;
    }

    .free-pill {
        background: #27ae60;
        color: #fff;
        font-size: 0.65rem;
        font-weight: 800;
        padding: 1px 6px;
        border-radius: 4px;
    }

    .card-desc {
        margin: 0 0 6px;
        font-size: 0.8rem;
        color: #b2bec3;
    }

    .card-estimate {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.85rem;
        font-weight: 700;
        color: #f1c40f;
    }

    .card-action {
        flex-shrink: 0;
        position: relative;
    }

    .action-btn {
        border: none;
        border-radius: 10px;
        padding: 8px 14px;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 90px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: transform 0.15s, filter 0.15s;
    }

    .action-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        filter: brightness(1.1);
    }

    .action-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }

    .free-btn {
        background: linear-gradient(135deg, #27ae60, #2ecc71);
        color: #fff;
        flex-direction: row;
        gap: 6px;
        padding: 10px 14px;
        font-size: 0.85rem;
    }

    .crystal-btn {
        background: linear-gradient(135deg, #0984e3, #74b9ff);
        color: #fff;
    }

    .btn-cost {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 1rem;
        font-weight: 900;
    }

    .btn-sub {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        opacity: 0.9;
    }

    .cooldown-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 8px 12px;
        border-radius: 10px;
        color: #b2bec3;
        font-size: 0.85rem;
        font-weight: 700;
    }

    .result-flyout {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #2ecc71;
        color: #fff;
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 0.82rem;
        font-weight: 900;
        white-space: nowrap;
        pointer-events: none;
        box-shadow: 0 4px 10px rgba(0,0,0,0.4);
    }

    @media (max-width: 480px) {
        .skip-card {
            flex-direction: column;
            text-align: center;
        }
        .card-title-row {
            justify-content: center;
        }
        .card-estimate {
            justify-content: center;
        }
        .action-btn {
            width: 100%;
            min-width: 140px;
        }
    }
</style>
