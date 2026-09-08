<script lang="ts">
    import gsap from 'gsap';
    import { crystals, gameStore, currentIdleIncome, useTimeSkip, maxOfflineTimeHours, formatNumber } from '../store';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void;

    let overlayEl: HTMLElement;
    let modalEl: HTMLElement;

    function close() {
        onClose();
    }

    // GSAP button refs
    let btnRefs: Record<string, HTMLElement> = {};
    let resultMessages: Record<string, { text: string, visible: boolean }> = {
        skip4: { text: '', visible: false },
        skip8: { text: '', visible: false },
        skip24: { text: '', visible: false }
    };

    const skips = [
        {
            id: 'skip4',
            label: 'Малый прыжок',
            hours: 4,
            cost: 20,
            desc: '4 часа пассивного дохода',
            color: '#74b9ff',
            glow: 'rgba(116, 185, 255, 0.5)',
        },
        {
            id: 'skip8',
            label: 'Средний прыжок',
            hours: 8,
            cost: 35,
            desc: '8 часов пассивного дохода',
            color: '#a29bfe',
            glow: 'rgba(162, 155, 254, 0.5)',
        },
        {
            id: 'skip24',
            label: 'Временной Разлом',
            hours: 24,
            cost: 90,
            desc: '24 часа пассивного дохода',
            color: '#fd79a8',
            glow: 'rgba(253, 121, 168, 0.6)',
        }
    ];

    function handleSkip(skip: typeof skips[number]) {
        const btn = btnRefs[skip.id];

        const earned = useTimeSkip(skip.hours, skip.cost);

        if (earned === 0) {
            // Not enough crystals — shake
            if (btn) {
                gsap.to(btn, {
                    keyframes: [
                        { x: -8, duration: 0.06 },
                        { x:  8, duration: 0.06 },
                        { x: -6, duration: 0.06 },
                        { x:  6, duration: 0.06 },
                        { x:  0, duration: 0.06 },
                    ],
                    ease: 'none'
                });
            }
        } else {
            // Success — flash green + show earned amount
            if (btn) {
                gsap.fromTo(btn,
                    { backgroundColor: skip.color },
                    { backgroundColor: '#2ecc71', yoyo: true, repeat: 1, duration: 0.25, ease: 'power1.inOut',
                      onComplete: () => { if (btn) gsap.set(btn, { clearProps: 'backgroundColor' }); } }
                );
            }

            const formatted = `+${formatNumber(earned)} G`;

            resultMessages[skip.id] = { text: formatted, visible: true };

            // Animate the result label
            setTimeout(() => {
                const el = document.getElementById(`result-${skip.id}`);
                if (el) {
                    gsap.fromTo(el,
                        { opacity: 1, y: 0 },
                        { opacity: 0, y: -30, duration: 1.2, ease: 'power2.out',
                          onComplete: () => { resultMessages[skip.id] = { text: '', visible: false }; } }
                    );
                }
            }, 50);
        }
    }

    // Estimated gold for a skip (live derived)
    function estimateGold(hours: number): string {
        const perSec = $currentIdleIncome;
        if (perSec === 0) return '—';
        const total = Math.floor(perSec * hours * 3600);
        return formatNumber(total);
    }
</script>

{#if isOpen}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="overlay" class:embedded={isEmbedded} bind:this={overlayEl} on:click={close}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal" class:embedded-modal={isEmbedded} bind:this={modalEl} on:click|stopPropagation>

        <!-- Header -->
        <div class="tab-header">
            <div class="tab-title-row">
                <div class="header-icon">
                    <svg viewBox="0 0 48 60" width="32" height="40">
                        <!-- Hourglass body -->
                        <path d="M6,4 L42,4 L42,8 Q42,30 24,30 Q6,30 6,8 Z" fill="#a29bfe" opacity="0.9"/>
                        <path d="M6,56 L42,56 L42,52 Q42,30 24,30 Q6,30 6,52 Z" fill="#74b9ff" opacity="0.9"/>
                        <!-- Frames -->
                        <rect x="4" y="2" width="40" height="6" rx="3" fill="#6c5ce7"/>
                        <rect x="4" y="52" width="40" height="6" rx="3" fill="#0984e3"/>
                        <!-- Sand flow -->
                        <circle cx="24" cy="30" r="3" fill="#f1c40f" opacity="0.8"/>
                        <line x1="24" y1="33" x2="24" y2="45" stroke="#f1c40f" stroke-width="2" opacity="0.6"/>
                    </svg>
                </div>
                <h2 class="tab-title">Машина Времени</h2>
            </div>
            <p class="header-sub">Потрать кристаллы — получи мгновенный доход</p>

            <!-- Crystal Balance -->
            <div class="balance-row">
                <div class="balance-chip crystal">
                    <span class="icon">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="#74b9ff">
                            <polygon points="12,2 21,9 12,22 3,9"/>
                        </svg>
                    </span>
                    <span>{formatNumber($crystals)} кристаллов</span>
                </div>
                {#if $currentIdleIncome === 0}
                    <span class="no-idle-hint">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#f1c40f" stroke-width="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        Нужен пассивный доход
                    </span>
                {/if}
            </div>

            {#if !isEmbedded}
                <button class="close-btn" on:click={onClose}>✕</button>
            {/if}
        </div>

        <!-- Skip Cards -->
        <div class="skip-grid">
            {#each skips as skip}
                <div class="skip-card" style="--accent: {skip.color}; --glow: {skip.glow}">
                    <!-- SVG Icon per card -->
                    <div class="card-visual">
                        {#if skip.hours === 4}
                            <!-- Small: simple hourglass -->
                            <svg viewBox="0 0 60 80" width="52" height="70">
                                <defs><filter id="glow4" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
                                <rect x="8" y="4" width="44" height="8" rx="4" fill="#74b9ff" filter="url(#glow4)"/>
                                <rect x="8" y="68" width="44" height="8" rx="4" fill="#74b9ff" filter="url(#glow4)"/>
                                <path d="M10,12 L50,12 Q50,42 30,42 Q10,42 10,12 Z" fill="#74b9ff" opacity="0.7"/>
                                <path d="M10,68 L50,68 Q50,42 30,42 Q10,42 10,68 Z" fill="#74b9ff" opacity="0.4"/>
                                <circle cx="30" cy="42" r="5" fill="#f1c40f" filter="url(#glow4)"/>
                            </svg>
                        {:else if skip.hours === 8}
                            <!-- Medium: clock face -->
                            <svg viewBox="0 0 80 80" width="70" height="70">
                                <defs><filter id="glow8" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
                                <circle cx="40" cy="40" r="34" fill="#2d1b4e" stroke="#a29bfe" stroke-width="3" filter="url(#glow8)"/>
                                <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(162,155,254,0.2)" stroke-width="1"/>
                                <!-- Hour markers -->
                                {#each [0,30,60,90,120,150,180,210,240,270,300,330] as angle}
                                    <line 
                                        x1={40 + 24 * Math.sin(angle * Math.PI / 180)}
                                        y1={40 - 24 * Math.cos(angle * Math.PI / 180)}
                                        x2={40 + 29 * Math.sin(angle * Math.PI / 180)}
                                        y2={40 - 29 * Math.cos(angle * Math.PI / 180)}
                                        stroke="rgba(162,155,254,0.5)" stroke-width="2"
                                    />
                                {/each}
                                <!-- Hands -->
                                <line x1="40" y1="40" x2="40" y2="20" stroke="#f1c40f" stroke-width="3" stroke-linecap="round"/>
                                <line x1="40" y1="40" x2="52" y2="40" stroke="#f1c40f" stroke-width="3" stroke-linecap="round"/>
                                <circle cx="40" cy="40" r="3" fill="#f1c40f"/>
                            </svg>
                        {:else}
                            <!-- Large: portal/galaxy -->
                            <svg viewBox="0 0 100 60" width="80" height="48">
                                <defs><filter id="glow24" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
                                <ellipse cx="50" cy="30" rx="40" ry="15" fill="none" stroke="#fd79a8" stroke-width="2" opacity="0.6"/>
                                <ellipse cx="50" cy="30" rx="30" ry="10" fill="none" stroke="#a29bfe" stroke-width="2" filter="url(#glow24)"/>
                                <ellipse cx="50" cy="30" rx="20" ry="6" fill="#2d1b4e"/>
                                <circle cx="50" cy="30" r="4" fill="#fd79a8" filter="url(#glow24)"/>
                                <circle cx="15" cy="20" r="2" fill="#fff" opacity="0.8"/>
                                <circle cx="85" cy="40" r="2" fill="#fff" opacity="0.6"/>
                                <circle cx="25" cy="45" r="1.5" fill="#a29bfe" opacity="0.7"/>
                                <circle cx="75" cy="15" r="1.5" fill="#a29bfe" opacity="0.9"/>
                            </svg>
                        {/if}
                    </div>

                    <div class="card-content">
                        <h3>{skip.label}</h3>
                        <p class="card-desc">{skip.desc}</p>
                        <p class="card-reward">
                            ≈ <strong>{estimateGold(skip.hours)}</strong>
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" style="vertical-align: middle; display: inline-block;">
                                <circle cx="12" cy="12" r="9" fill="#f1c40f" stroke="#d4ac0d" stroke-width="2"/>
                                <circle cx="12" cy="12" r="5" fill="#f39c12"/>
                            </svg>
                        </p>
                    </div>

                    <div class="card-action">
                        <button class="buy-btn" on:click={() => handleSkip(skip)} bind:this={btnRefs[skip.id]} disabled={$crystals < skip.cost}>
                            <span class="btn-cost">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="#74b9ff" style="vertical-align: middle; display: inline-block;">
                                    <polygon points="12,2 21,9 12,22 3,9"/>
                                </svg>
                                {skip.cost}
                            </span>
                            <span class="btn-label">Купить</span>
                        </button>
                    </div>

                    <!-- Result popup overlay for this specific card -->
                    {#if resultMessages[skip.id].visible}
                        <div class="skip-result-overlay">
                            <span class="result-text">{resultMessages[skip.id].text}</span>
                        </div>
                    {/if}
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
        background: linear-gradient(145deg, #0d0720, #1a0a2e);
        border: 2px solid rgba(162, 155, 254, 0.3);
        border-radius: 24px;
        box-shadow:
            0 0 60px rgba(108, 92, 231, 0.3),
            0 25px 60px rgba(0, 0, 0, 0.7),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        width: 92%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        color: white;
        padding: 22px;
        animation: modalIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .embedded {
        position: relative;
        background: transparent;
        backdrop-filter: none;
        z-index: 1;
        padding: 0;
        inset: auto;
    }

    .embedded-modal {
        box-shadow: none;
        border: none;
        border-radius: 0;
        width: 100%;
        max-width: none;
        max-height: none;
        height: 100%;
        background: transparent;
        animation: none;
    }

    @keyframes modalIn {
        from { opacity: 0; transform: scale(0.85) translateY(20px); }
        to   { opacity: 1; transform: scale(1)   translateY(0); }
    }

    .close-btn {
        position: absolute;
        right: 0;
        top: 0;
        background: none;
        border: none;
        color: #bdc3c7;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 4px;
        transition: transform 0.2s, color 0.2s;
    }

    .close-btn:hover {
        transform: scale(1.1);
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }


    .no-idle-hint {
        font-size: 0.78rem;
        color: rgba(255, 200, 100, 0.7);
    }

    /* Cards */
    .skip-grid {
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    .skip-card {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 16px;
        padding: 16px;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 16px;
        transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    }

    .skip-card:hover {
        border-color: var(--accent);
        box-shadow: 0 0 20px var(--glow);
    }

    .card-visual {
        display: flex;
        justify-content: center;
        align-items: center;
        filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));
    }

    .card-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .card-content h3 {
        margin: 0 0 4px;
        font-size: 1.2rem;
        color: var(--accent);
        text-shadow: 0 0 10px var(--glow);
    }

    .card-desc {
        margin: 0 0 6px;
        font-size: 0.85rem;
        color: rgba(255,255,255,0.5);
    }

    .card-reward {
        margin: 0;
        font-size: 1.05rem;
        color: #f1c40f;
    }

    .card-action {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: flex-end;
    }

    .buy-btn {
        background: transparent;
        border: 1px solid var(--accent);
        color: white;
        border-radius: 12px;
        padding: 12px 18px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        min-width: 100px;
    }

    .btn-cost {
        color: #74b9ff;
        font-size: 1.15rem;
        text-shadow: 0 0 5px rgba(116, 185, 255, 0.5);
    }
    
    .btn-label {
        font-size: 0.9rem;
        color: var(--accent);
    }

    .buy-btn:hover:not(:disabled) {
        background: var(--accent);
        box-shadow: 0 0 15px var(--glow);
    }
    .buy-btn:hover:not(:disabled) .btn-label, .buy-btn:hover:not(:disabled) .btn-cost {
        color: #000;
        text-shadow: none;
    }

    .buy-btn:active:not(:disabled) {
        transform: scale(0.95);
    }

    .buy-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        border-color: rgba(255,255,255,0.2);
        filter: grayscale(0.8);
    }

    .skip-result-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(2px);
        border-radius: 16px;
    }

    .result-text {
        font-size: 1.3rem;
        font-weight: bold;
        color: #f1c40f;
        text-shadow: 0 2px 10px #d35400;
        animation: popUp 0.3s ease-out;
    }

    @keyframes popUp {
        0% { transform: scale(0.5); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
    }
</style>
