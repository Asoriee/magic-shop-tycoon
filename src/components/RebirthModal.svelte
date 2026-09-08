<script lang="ts">
    import { tick } from 'svelte';
    import { gameStore, formatNumber } from '../store';
    import { saveGame } from '../yandex-sdk';
    import gsap from 'gsap';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void;

    let overlayEl: HTMLElement;
    let modalEl: HTMLElement;
    let showConfirm = false;

    $: earnedStardust = Math.floor(($gameStore?.gold || 0) / 1_000_000);
    $: goldRemainder = ($gameStore?.gold || 0) % 1_000_000;
    $: goldNeededForNext = 1_000_000 - goldRemainder;
    $: progressToNext = Math.min(100, Math.max(0, (goldRemainder / 1_000_000) * 100));

    $: if (isOpen) {
        tick().then(() => {
            if (overlayEl && modalEl && !isEmbedded) {
                gsap.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.25 });
                gsap.fromTo(modalEl, { y: 35, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.2)' });
            }
        });
    }

    function close() {
        if (overlayEl && modalEl && !isEmbedded) {
            gsap.to(overlayEl, { opacity: 0, duration: 0.2 });
            gsap.to(modalEl, { y: 25, opacity: 0, scale: 0.94, duration: 0.2, ease: 'power2.in', onComplete: onClose });
        } else {
            onClose();
        }
    }

    function handleStartRitual() {
        if (earnedStardust > 0) {
            showConfirm = true;
        }
    }

    function confirmRebirth() {
        if (earnedStardust > 0) {
            gameStore.performRebirth();
            saveGame();
            showConfirm = false;
            close();
        }
    }
</script>

{#if isOpen}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="overlay" class:embedded={isEmbedded} bind:this={overlayEl} on:click={close}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal" class:embedded-modal={isEmbedded} bind:this={modalEl} on:click|stopPropagation>

        {#if !isEmbedded}
            <div class="tab-header">
                <div class="tab-title-row">
                    <div class="header-icon">
                        <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
                            <circle cx="20" cy="20" r="18" stroke="#e74c3c" stroke-width="1.5"/>
                            <polygon points="20,6 32,28 8,28" stroke="#f1c40f" stroke-width="1.5" fill="none"/>
                        </svg>
                    </div>
                    <h2 class="tab-title">Тёмный Ритуал</h2>
                </div>
                <button class="close-btn" on:click={close} aria-label="Закрыть">✕</button>
            </div>
        {/if}

        <div class="ritual-layout">

            <!-- Seal & Stardust Showcase -->
            <div class="seal-section">
                <div class="seal-visual">
                    <svg viewBox="0 0 160 160" width="140" height="140" class="ritual-seal-svg">
                        <defs>
                            <radialGradient id="sealCoreGlow" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#e74c3c" stop-opacity="0.8"/>
                                <stop offset="60%" stop-color="#8e44ad" stop-opacity="0.3"/>
                                <stop offset="100%" stop-color="#1b0a33" stop-opacity="0"/>
                            </radialGradient>
                            <filter id="sealGlow" x="-30%" y="-30%" width="160%" height="160%">
                                <feGaussianBlur stdDeviation="4" result="blur"/>
                                <feMerge>
                                    <feMergeNode in="blur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>

                        <!-- Outer Aura -->
                        <circle cx="80" cy="80" r="76" fill="url(#sealCoreGlow)"/>

                        <!-- Rotating Ring 1 (Clockwise) -->
                        <g>
                            <animateTransform attributeName="transform" type="rotate" from="0 80 80" to="360 80 80" dur="20s" repeatCount="indefinite"/>
                            <circle cx="80" cy="80" r="70" fill="none" stroke="#9b59b6" stroke-width="2" stroke-dasharray="8 6"/>
                            <circle cx="80" cy="10" r="3" fill="#f1c40f"/>
                            <circle cx="80" cy="150" r="3" fill="#f1c40f"/>
                            <circle cx="10" cy="80" r="3" fill="#f1c40f"/>
                            <circle cx="150" cy="80" r="3" fill="#f1c40f"/>
                        </g>

                        <!-- Rotating Ring 2 (Counter-Clockwise) -->
                        <g>
                            <animateTransform attributeName="transform" type="rotate" from="360 80 80" to="0 80 80" dur="12s" repeatCount="indefinite"/>
                            <circle cx="80" cy="80" r="54" fill="none" stroke="#e74c3c" stroke-width="1.8" stroke-dasharray="14 4"/>
                            <!-- Inscribed hexagram/triangles -->
                            <polygon points="80,30 120,105 40,105" fill="none" stroke="#f1c40f" stroke-width="1.5"/>
                            <polygon points="80,130 40,55 120,55" fill="none" stroke="#f1c40f" stroke-width="1.5"/>
                        </g>

                        <!-- Center Core Rune -->
                        <circle cx="80" cy="80" r="18" fill="#1b0a33" stroke="#e74c3c" stroke-width="2" filter="url(#sealGlow)"/>
                        <circle cx="80" cy="80" r="10" fill="#e74c3c">
                            <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
                        </circle>
                    </svg>
                </div>

                <div class="reward-highlight">
                    <span class="reward-title">Вы получите после Ритуала:</span>
                    <div class="stardust-gain">
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
                            <path d="M12 2 L14 8 L20 10 L15 14 L17 21 L12 17 L7 21 L9 14 L4 10 L10 8 Z" fill="#e056fd" stroke="#be2edd" stroke-width="1.5"/>
                        </svg>
                        <span class="gain-value">+{formatNumber(earnedStardust)}</span>
                        <span class="gain-label">Звёздной Пыли</span>
                    </div>

                    <div class="stardust-progress-box">
                        <div class="progress-info-row">
                            <span class="prog-label">До следующей +1 пыли:</span>
                            <span class="prog-val">{formatNumber(goldNeededForNext)} G</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" style="width: {progressToNext}%"></div>
                        </div>
                        <span class="exchange-rate-hint">Курс: 1 Пыль = 1,000,000 Золота (бонус +2% ко всему доходу за каждую пыль)</span>
                    </div>
                </div>
            </div>

            <!-- Comparison Cards: Sacrifice vs Kept -->
            <div class="comparison-grid">

                <!-- 1. What Resets -->
                <div class="comparison-card sacrifice-card">
                    <div class="card-header-row red-header">
                        <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                            <circle cx="10" cy="10" r="8" fill="#c0392b" stroke="#e74c3c" stroke-width="1.2"/>
                            <line x1="6" y1="10" x2="14" y2="10" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <h4>Приносится в Жертву</h4>
                    </div>
                    <ul class="comp-list">
                        <li>Всё текущее золото</li>
                        <li>Обычные улучшения лавки</li>
                        <li>Сваренные зелья в инвентаре</li>
                    </ul>
                </div>

                <!-- 2. What Stays Forever -->
                <div class="comparison-card kept-card">
                    <div class="card-header-row green-header">
                        <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                            <circle cx="10" cy="10" r="8" fill="#27ae60" stroke="#2ecc71" stroke-width="1.2"/>
                            <path d="M6 10 L9 13 L14 7" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <h4>Сохраняется Навсегда</h4>
                    </div>
                    <ul class="comp-list">
                        <li><strong>VIP-статус</strong> и все Кристаллы</li>
                        <li><strong>Звёздная Пыль</strong> и Тайные Знания</li>
                        <li>Все открытые <strong>Питомцы и Артефакты</strong></li>
                    </ul>
                </div>

            </div>

            <!-- Ritual Execution or Confirmation View -->
            {#if showConfirm}
                <div class="confirm-prompt-box">
                    <div class="confirm-title">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                            <polygon points="12,2 22,20 2,20" fill="#e74c3c" stroke="#c0392b" stroke-width="1.5"/>
                            <line x1="12" y1="9" x2="12" y2="13" stroke="#fff" stroke-width="2"/>
                            <circle cx="12" cy="16" r="1.2" fill="#fff"/>
                        </svg>
                        <span>Подтверждение Тёмного Ритуала</span>
                    </div>
                    <p class="confirm-desc">
                        Вы уверены? Золото лавки будет сброшено, но вы навсегда обретете <strong>+{formatNumber(earnedStardust)}</strong> Звёздной Пыли!
                    </p>
                    <div class="confirm-buttons-row">
                        <button type="button" class="btn-confirm-yes" on:click={confirmRebirth}>
                            Да, Совершить Ритуал!
                        </button>
                        <button type="button" class="btn-confirm-cancel" on:click={() => showConfirm = false}>
                            Отмена
                        </button>
                    </div>
                </div>
            {:else}
                <button 
                    type="button"
                    class="perform-ritual-btn" 
                    disabled={earnedStardust === 0} 
                    on:click={handleStartRitual}
                >
                    {#if earnedStardust === 0}
                        <span>Накопите 1,000,000 Золота для Ритуала</span>
                    {:else}
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                            <polygon points="12,2 20,7 16,21 8,21 4,7" fill="#f1c40f"/>
                        </svg>
                        <span>Совершить Тёмный Ритуал (+{formatNumber(earnedStardust)} ✦)</span>
                    {/if}
                </button>
            {/if}

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
        border: 2px solid rgba(231, 76, 60, 0.4);
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
        border-bottom: 1px solid rgba(231, 76, 60, 0.3);
        padding-bottom: 12px;
    }

    .tab-title-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .tab-title {
        font-size: 1.3rem;
        color: #ff7675;
        margin: 0;
    }

    .close-btn {
        background: none;
        border: none;
        color: #b2bec3;
        font-size: 1.4rem;
        cursor: pointer;
    }

    .ritual-layout {
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    /* Seal & Stardust Showcase */
    .seal-section {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(231, 76, 60, 0.25);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 18px;
    }

    .seal-visual {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .reward-highlight {
        flex: 1;
        min-width: 0;
    }

    .reward-title {
        display: block;
        font-size: 0.85rem;
        color: #dfe6e9;
        margin-bottom: 4px;
    }

    .stardust-gain {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }

    .gain-value {
        font-size: 1.6rem;
        font-weight: 900;
        color: #e056fd;
        text-shadow: 0 0 15px rgba(224, 86, 253, 0.6);
    }

    .gain-label {
        font-size: 0.9rem;
        font-weight: 800;
        color: #a29bfe;
    }

    .stardust-progress-box {
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 8px 10px;
    }

    .progress-info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.76rem;
        margin-bottom: 4px;
    }

    .prog-label {
        color: #b2bec3;
    }

    .prog-val {
        color: #f1c40f;
        font-weight: 700;
    }

    .progress-track {
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 4px;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #9b59b6, #e056fd);
        border-radius: 3px;
        transition: width 0.3s ease;
    }

    .exchange-rate-hint {
        display: block;
        font-size: 0.68rem;
        color: #636e72;
    }

    /* Comparison Grid */
    .comparison-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }

    .comparison-card {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;
        padding: 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .sacrifice-card {
        border-left: 3px solid #e74c3c;
    }

    .kept-card {
        border-left: 3px solid #2ecc71;
    }

    .card-header-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
    }

    .card-header-row h4 {
        margin: 0;
        font-size: 0.85rem;
        font-weight: 800;
    }

    .red-header h4 {
        color: #ff7675;
    }

    .green-header h4 {
        color: #2ecc71;
    }

    .comp-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .comp-list li {
        font-size: 0.78rem;
        color: #dfe6e9;
        line-height: 1.2;
    }

    /* Buttons */
    .perform-ritual-btn {
        width: 100%;
        background: linear-gradient(135deg, #c0392b, #8e44ad);
        border: 1.5px solid rgba(241, 196, 15, 0.4);
        border-radius: 14px;
        padding: 14px;
        color: #fff;
        font-size: 1rem;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        box-shadow: 0 4px 20px rgba(192, 57, 43, 0.4);
        transition: transform 0.15s, filter 0.15s;
    }

    .perform-ritual-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        filter: brightness(1.15);
    }

    .perform-ritual-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        box-shadow: none;
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.15);
        color: #b2bec3;
    }

    /* Confirmation Modal/Box */
    .confirm-prompt-box {
        background: rgba(192, 57, 43, 0.15);
        border: 1.5px solid #e74c3c;
        border-radius: 14px;
        padding: 14px 16px;
        text-align: center;
        animation: fadeIn 0.2s ease-out;
    }

    .confirm-title {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 1rem;
        font-weight: 800;
        color: #ff7675;
        margin-bottom: 6px;
    }

    .confirm-desc {
        margin: 0 0 12px;
        font-size: 0.85rem;
        color: #dfe6e9;
    }

    .confirm-buttons-row {
        display: flex;
        gap: 10px;
        justify-content: center;
    }

    .btn-confirm-yes {
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        border: none;
        border-radius: 10px;
        padding: 10px 18px;
        color: #fff;
        font-size: 0.9rem;
        font-weight: 800;
        cursor: pointer;
        transition: transform 0.15s;
    }

    .btn-confirm-yes:hover {
        transform: translateY(-2px);
    }

    .btn-confirm-cancel {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        padding: 10px 18px;
        color: #fff;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.96); }
        to { opacity: 1; transform: scale(1); }
    }

    @media (max-width: 480px) {
        .seal-section {
            flex-direction: column;
            text-align: center;
        }
        .comparison-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
