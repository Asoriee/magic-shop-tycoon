<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { gameStore, formatNumber } from '../store';
    import gsap from 'gsap';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void;

    let modalContent: HTMLElement;
    let modalEl: HTMLElement;
    let overlayEl: HTMLElement;

    $: earnedStardust = Math.floor($gameStore.gold / 1_000_000);

    $: if (isOpen) {
        tick().then(() => {
            if (overlayEl && modalEl && !isEmbedded) {
                gsap.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.3 });
                gsap.fromTo(modalEl, { y: 50, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.2)' });
            }
        });
    }

    function close() {
        if (overlayEl && modalEl && !isEmbedded) {
            gsap.to(overlayEl, { opacity: 0, duration: 0.2 });
            gsap.to(modalEl, { y: 30, opacity: 0, scale: 0.9, duration: 0.25, ease: 'power2.in', onComplete: onClose });
        } else {
            onClose();
        }
    }

    function performRebirth() {
        if (earnedStardust > 0) {
            gameStore.performRebirth();
            close();
        }
    }
</script>

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" class:embedded={isEmbedded} bind:this={overlayEl} on:click={close}>
    <div class="modal" class:embedded-modal={isEmbedded} bind:this={modalEl} on:click|stopPropagation>
        <div class="tab-header">
            <div class="tab-title-row">
                <div class="header-icon">
                    <svg viewBox="0 0 100 100" width="32" height="32">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#e74c3c" stroke-width="6" stroke-dasharray="10 5" />
                        <path d="M50 20 Q70 20 70 45 Q70 60 60 70 L60 80 L40 80 L40 70 Q30 60 30 45 Q30 20 50 20 Z" fill="#ecf0f1" />
                        <circle cx="40" cy="45" r="8" fill="#2c3e50" />
                        <circle cx="60" cy="45" r="8" fill="#2c3e50" />
                        <path d="M45 75 L55 75 M48 70 L52 70" stroke="#2c3e50" stroke-width="3" />
                    </svg>
                </div>
                <h2 class="tab-title">Тёмный Ритуал</h2>
            </div>
            <p class="header-sub">Сброс прогресса ради могущества</p>
            {#if !isEmbedded}
                <button class="close-btn" on:click={close}>✕</button>
            {/if}
        </div>

        <div class="ritual-content">
            <div class="ritual-split">
                <div class="ritual-left">
                    <div class="svg-container">
                        <svg viewBox="0 0 100 100" width="160" height="160">
                            <defs>
                                <radialGradient id="ritualGlow" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stop-color="rgba(142, 68, 173, 0.4)" />
                                    <stop offset="100%" stop-color="rgba(0, 0, 0, 0)" />
                                </radialGradient>
                            </defs>
                            <circle cx="50" cy="50" r="50" fill="url(#ritualGlow)" />
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#9b59b6" stroke-width="4" stroke-dasharray="10 5">
                                <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="15s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="50" cy="50" r="35" fill="none" stroke="#e74c3c" stroke-width="2" stroke-dasharray="5 5">
                                <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="8s" repeatCount="indefinite" />
                            </circle>
                            <polygon points="50,15 80,80 20,80" fill="none" stroke="#f1c40f" stroke-width="3" />
                            <polygon points="50,85 20,20 80,20" fill="none" stroke="#f1c40f" stroke-width="3" />
                            <circle cx="50" cy="50" r="8" fill="#e74c3c">
                                <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
                            </circle>
                        </svg>
                    </div>
                </div>

                <div class="ritual-right">
                    <div class="sacrifice-box">
                        <h4 class="box-title">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                                <circle cx="12" cy="12" r="8" fill="#e74c3c" stroke="#c0392b" stroke-width="1.5"/>
                                <line x1="8" y1="12" x2="16" y2="12" stroke="white" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            <span>Вы принесете в жертву:</span>
                        </h4>
                        <ul>
                            <li>Всё накопленное Золото</li>
                            <li>Все уровни улучшений</li>
                        </ul>
                    </div>

                    <div class="reward-box">
                        <h4 class="box-title">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                                <path d="M12 2 L14 8 L20 10 L15 14 L17 21 L12 17 L7 21 L9 14 L4 10 L10 8 Z" fill="#f1c40f" stroke="#d4ac0d" stroke-width="1.5"/>
                            </svg>
                            <span>Вы обретете навсегда:</span>
                        </h4>
                        <div class="reward">
                            <span class="stardust-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                                    <path d="M12 2 L14 8 L20 10 L15 14 L17 21 L12 17 L7 21 L9 14 L4 10 L10 8 Z" fill="#e056fd" stroke="#be2edd" stroke-width="1.5"/>
                                </svg>
                            </span>
                            <span class="stardust-amount">+{formatNumber(earnedStardust)}</span> Звездной пыли
                        </div>
                        <p class="reward-desc">Даст вечный бонус <strong>+{formatNumber(earnedStardust * 2)}%</strong> ко всем доходам!</p>
                        <p class="exchange-rate">Курс: 1 Пыль = 1,000,000 Золота</p>
                    </div>
                </div>
            </div>
            
            <div class="actions">
                <button class="btn-confirm" disabled={earnedStardust === 0} on:click={performRebirth}>
                    <span class="btn-text">Провести Тёмный Ритуал</span>
                </button>
            </div>
        </div>
    </div>
</div>
{/if}

<style>
    .overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        overflow-y: auto;
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

    .close-btn {
        position: absolute;
        right: 16px;
        top: 16px;
        margin-left: auto;
        background: none;
        border: none;
        color: #bdc3c7;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 8px;
        transition: all 0.2s;
    }

    .close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }

    .embedded .close-btn {
        display: none;
    }

    .ritual-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        padding: 24px;
        background: linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.4));
        border-radius: 16px;
        border: 1px solid rgba(155, 89, 182, 0.2);
    }

    .ritual-split {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 20px;
        margin-bottom: 30px;
    }

    @media (min-width: 480px) {
        .ritual-split {
            flex-direction: row;
            align-items: center;
        }
        .ritual-left {
            flex: 0 0 auto;
        }
        .ritual-right {
            flex: 1;
        }
    }

    .svg-container {
        display: flex;
        justify-content: center;
        filter: drop-shadow(0 0 20px rgba(155, 89, 182, 0.6));
    }

    .sacrifice-box, .reward-box {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .sacrifice-box {
        border-left: 4px solid #e74c3c;
    }

    .reward-box {
        border-left: 4px solid #f1c40f;
        background: linear-gradient(90deg, rgba(241, 196, 15, 0.1), rgba(0,0,0,0.3));
    }

    .box-title {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0 0 10px 0;
        font-size: 1.1rem;
        color: #ecf0f1;
    }

    h4 {
        margin: 0 0 10px 0;
        font-size: 1.1rem;
        color: #ecf0f1;
    }

    ul {
        margin: 0;
        padding-left: 20px;
        color: #bdc3c7;
        font-size: 0.95rem;
    }
    
    li {
        margin-bottom: 4px;
    }

    .reward {
        font-size: 1.8rem;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
    }

    .stardust-icon {
        filter: drop-shadow(0 0 8px #f1c40f);
    }
    .stardust-amount {
        color: #3498db;
        text-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
    }

    .reward-desc {
        margin: 0;
        color: #bdc3c7;
        font-size: 0.95rem;
    }
    
    .reward-desc strong {
        color: #f1c40f;
    }

    .exchange-rate {
        margin: 10px 0 0 0;
        font-size: 0.85rem;
        color: #7f8c8d;
        font-style: italic;
    }

    .actions {
        display: flex;
        flex-direction: column;
        gap: 15px;
        align-items: center;
        width: 100%;
        max-width: 320px;
        margin: 0 auto;
    }

    button {
        border: none;
        cursor: pointer;
        font-weight: bold;
        transition: transform 0.1s, opacity 0.2s, filter 0.2s, box-shadow 0.2s;
        width: 100%;
    }

    button:active {
        transform: scale(0.95);
    }

    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        filter: grayscale(1);
    }

    .btn-confirm {
        padding: 16px 24px;
        font-size: 1.2rem;
        border-radius: 12px;
        background: linear-gradient(135deg, #9b59b6, #e74c3c);
        color: white;
        box-shadow: 0 0 25px rgba(155, 89, 182, 0.6);
        position: relative;
        overflow: hidden;
        animation: pulseButton 2s infinite;
    }

    @keyframes pulseButton {
        0% { box-shadow: 0 0 20px rgba(155, 89, 182, 0.5); }
        50% { box-shadow: 0 0 40px rgba(231, 76, 60, 0.8); }
        100% { box-shadow: 0 0 20px rgba(155, 89, 182, 0.5); }
    }

    .btn-confirm::after {
        content: '';
        position: absolute;
        top: -50%; left: -50%;
        width: 200%; height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 60%);
        opacity: 0;
        transition: opacity 0.3s;
    }

    .btn-confirm:not(:disabled):hover::after {
        opacity: 1;
    }
    
    .btn-text {
        position: relative;
        z-index: 2;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }
</style>
