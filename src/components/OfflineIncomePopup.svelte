<script lang="ts">
    import { onMount } from 'svelte';
    import { gameStore } from '../store';
    import { showRewardedAd } from '../yandex-sdk';

    export let isOpen = false;
    export let offlineGold = 0;
    export let onClose: () => void;

    function handleClaim() {
        gameStore.addGold(offlineGold);
        onClose();
    }

    function handleDoubleClaim() {
        showRewardedAd(() => {
            gameStore.addGold(offlineGold * 2);
            gameStore.updateQuestProgress('watch_ads', 1);
        }, () => {
            onClose();
        });
    }

    import { formatNumber } from '../store';
</script>

{#if isOpen}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="overlay">
    <!-- Magical background particles/glow effect -->
    <div class="magical-glow"></div>

    <div class="modal">
        <h2 class="title">С возвращением!</h2>
        <p class="subtitle">Ваша лавка заработала пока вас не было:</p>
        
        <div class="reward-box">
            <div class="money-bag">
                <svg viewBox="0 0 64 64" width="60" height="60">
                    <defs>
                        <filter id="bagGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <path d="M32 10 C20 10 15 25 15 40 C15 55 22 60 32 60 C42 60 49 55 49 40 C49 25 44 10 32 10 Z" fill="#f1c40f" filter="url(#bagGlow)" />
                    <path d="M25 10 L39 10 L35 4 L29 4 Z" fill="#d4ac0d" />
                    <!-- Dollar sign -->
                    <text x="32" y="44" font-family="sans-serif" font-size="22" font-weight="bold" fill="#2c3e50" text-anchor="middle">$</text>
                </svg>
            </div>
            <div class="reward-text">
                <span class="plus">+</span>{formatNumber(offlineGold)}
                <span class="gold-icon">
                    <svg viewBox="0 0 24 24" width="28" height="28">
                        <circle cx="12" cy="12" r="10" fill="#f1c40f" stroke="#d35400" stroke-width="2"/>
                        <circle cx="12" cy="12" r="7" fill="none" stroke="#f39c12" stroke-width="1"/>
                        <rect x="11" y="7" width="2" height="10" fill="#d35400"/>
                    </svg>
                </span>
            </div>
        </div>
        
        <div class="actions">
            <button class="btn-double" on:click={handleDoubleClaim}>
                <span class="btn-glow"></span>
                Удвоить (Реклама)
                <span class="video-icon">▶</span>
            </button>
            <button class="btn-claim" on:click={handleClaim}>
                Просто забрать
            </button>
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
        z-index: 1000;
        backdrop-filter: blur(8px);
        overflow: hidden;
    }

    .magical-glow {
        position: absolute;
        width: 150vw;
        height: 150vh;
        background: radial-gradient(circle at center, rgba(162, 155, 254, 0.15) 0%, rgba(0, 0, 0, 0) 60%);
        pointer-events: none;
        animation: pulseGlow 4s infinite alternate ease-in-out;
    }

    @keyframes pulseGlow {
        0% { transform: scale(1); opacity: 0.8; }
        100% { transform: scale(1.1); opacity: 1; }
    }

    .modal {
        background: linear-gradient(160deg, #1a0a2e 0%, #2d1b4e 100%);
        padding: 2.5rem;
        border-radius: 24px;
        border: 2px solid rgba(162, 155, 254, 0.5);
        box-shadow: 
            0 0 40px rgba(162, 155, 254, 0.3), 
            inset 0 0 30px rgba(0,0,0,0.8),
            inset 0 2px 10px rgba(255,255,255,0.1);
        text-align: center;
        color: white;
        max-width: 90%;
        width: 420px;
        position: relative;
        z-index: 10;
        animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes popIn {
        0% { opacity: 0; transform: scale(0.8) translateY(20px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
    }

    .title {
        margin-top: 0;
        margin-bottom: 8px;
        font-size: 2.2rem;
        background: linear-gradient(90deg, #f1c40f, #f39c12);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 0 4px 15px rgba(241, 196, 15, 0.4);
        letter-spacing: 1px;
    }

    .subtitle {
        color: rgba(255, 255, 255, 0.7);
        font-size: 1rem;
        margin-bottom: 24px;
    }

    .reward-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.4);
        padding: 24px;
        border-radius: 20px;
        border: 1px solid rgba(241, 196, 15, 0.2);
        box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
        margin-bottom: 30px;
        position: relative;
    }

    .money-bag {
        margin-bottom: 12px;
        animation: floatBag 3s ease-in-out infinite;
    }

    @keyframes floatBag {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-8px) scale(1.05); }
    }

    .reward-text {
        font-size: 2.8rem;
        font-weight: bold;
        color: #f1c40f;
        text-shadow: 
            0 0 10px rgba(241, 196, 15, 0.5),
            0 0 20px rgba(241, 196, 15, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        line-height: 1;
    }

    .plus {
        font-size: 2rem;
        opacity: 0.8;
    }

    .gold-icon {
        display: flex;
        align-items: center;
        filter: drop-shadow(0 0 8px rgba(241, 196, 15, 0.8));
    }

    .actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    button {
        border: none;
        border-radius: 16px;
        font-size: 1.15rem;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
        position: relative;
        overflow: hidden;
    }

    button:active {
        transform: scale(0.96);
    }

    .btn-double {
        background: linear-gradient(135deg, #fd79a8, #e84393);
        color: white;
        padding: 18px 24px;
        box-shadow: 0 6px 20px rgba(232, 67, 147, 0.5);
        border: 2px solid rgba(255, 255, 255, 0.2);
        animation: pulseButton 2s infinite;
    }

    .btn-double:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(253, 121, 168, 0.7);
        filter: brightness(1.1);
    }

    .btn-glow {
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
        transform: rotate(45deg);
        animation: sweep 3s infinite linear;
    }

    @keyframes sweep {
        0% { left: -100%; }
        50%, 100% { left: 100%; }
    }

    @keyframes pulseButton {
        0% { box-shadow: 0 0 0 0 rgba(253, 121, 168, 0.6); }
        70% { box-shadow: 0 0 0 15px rgba(253, 121, 168, 0); }
        100% { box-shadow: 0 0 0 0 rgba(253, 121, 168, 0); }
    }

    .video-icon {
        font-size: 1.1rem;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }

    .btn-claim {
        background: transparent;
        color: rgba(255, 255, 255, 0.5);
        padding: 14px 20px;
        border: 2px solid transparent;
        font-size: 0.95rem;
    }

    .btn-claim:hover {
        color: white;
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
    }
</style>
