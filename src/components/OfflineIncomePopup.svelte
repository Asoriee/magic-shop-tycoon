<script lang="ts">
    import { tick } from 'svelte';
    import gsap from 'gsap';
    import { gameStore, isVip, formatNumber } from '../store';
    import { showRewardedAd, saveGame } from '../yandex-sdk';
    import ResourceIcon from './ResourceIcon.svelte';

    export let isOpen = false;
    export let offlineGold = 0;
    export let offlineSeconds = 0;
    export let maxOfflineSeconds = 0;
    export let currentRate = 0;
    export let onClose: () => void;

    let overlayEl: HTMLElement;
    let modalEl: HTMLElement;
    let isClaiming = false;

    $: isCapped = maxOfflineSeconds > 0 && offlineSeconds >= maxOfflineSeconds;
    $: progressPercent = maxOfflineSeconds > 0 
        ? Math.min(100, Math.max(2, Math.round((Math.min(offlineSeconds, maxOfflineSeconds) / maxOfflineSeconds) * 100))) 
        : 100;

    $: if (isOpen) {
        tick().then(() => {
            if (overlayEl && modalEl) {
                gsap.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.25 });
                gsap.fromTo(modalEl, 
                    { y: 35, opacity: 0, scale: 0.92 }, 
                    { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.2)' }
                );
            }
        });
    }

    function formatDuration(totalSecs: number): string {
        const s = Math.max(0, Math.floor(totalSecs || 0));
        const hours = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;

        if (hours > 0) {
            return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
        }
        if (mins > 0) {
            return secs > 0 ? `${mins} мин ${secs} с` : `${mins} мин`;
        }
        return `${secs} сек`;
    }

    function formatCapacity(totalSecs: number): string {
        const h = Math.round(((totalSecs || 0) / 3600) * 10) / 10;
        return `${h} ч`;
    }

    function handleClaimRegular() {
        if (isClaiming) return;
        isClaiming = true;
        gameStore.addGold(offlineGold);
        saveGame();
        closeModal();
    }

    function handleClaimDouble() {
        if (isClaiming) return;
        isClaiming = true;

        showRewardedAd(() => {
            gameStore.addGold(offlineGold * 2);
            gameStore.updateQuestProgress('watch_ads', 1);
            saveGame();
            closeModal();
        }, () => {
            isClaiming = false;
        });
    }

    function closeModal() {
        if (overlayEl && modalEl) {
            gsap.to(overlayEl, { opacity: 0, duration: 0.2 });
            gsap.to(modalEl, { 
                y: 25, 
                opacity: 0, 
                scale: 0.94, 
                duration: 0.2, 
                ease: 'power2.in', 
                onComplete: () => {
                    isClaiming = false;
                    onClose();
                }
            });
        } else {
            isClaiming = false;
            onClose();
        }
    }
</script>

{#if isOpen}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="overlay" bind:this={overlayEl} on:click={handleClaimRegular}>
    <div class="magical-ambient-glow"></div>

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal" bind:this={modalEl} on:click|stopPropagation>

        <!-- Close Button (safely claims base reward so user never loses earnings) -->
        <button class="close-btn" on:click={handleClaimRegular} title="Забрать и закрыть" aria-label="Закрыть">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>

        <!-- Arcane Vault Chest (Pure SVG) -->
        <div class="chest-visual-wrap">
            <svg viewBox="0 0 80 72" width="76" height="68" class="vault-chest-svg">
                <defs>
                    <radialGradient id="chestGlowAura" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#ffd700" stop-opacity="0.8"/>
                        <stop offset="60%" stop-color="#9b59b6" stop-opacity="0.4"/>
                        <stop offset="100%" stop-color="#8e44ad" stop-opacity="0"/>
                    </radialGradient>
                    <linearGradient id="chestWoodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#4a2478"/>
                        <stop offset="50%" stop-color="#2c144d"/>
                        <stop offset="100%" stop-color="#160829"/>
                    </linearGradient>
                    <linearGradient id="chestGoldRim" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#ffeaa7"/>
                        <stop offset="50%" stop-color="#f1c40f"/>
                        <stop offset="100%" stop-color="#d35400"/>
                    </linearGradient>
                    <filter id="chestSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2.5" result="b"/>
                        <feMerge>
                            <feMergeNode in="b"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                <!-- Ambient glowing circle -->
                <circle cx="40" cy="38" r="32" fill="url(#chestGlowAura)"/>

                <!-- Chest base shadow -->
                <ellipse cx="40" cy="64" rx="28" ry="6" fill="rgba(0,0,0,0.6)"/>

                <!-- Chest Lower Body -->
                <path d="M14 36 L66 36 L62 62 L18 62 Z" fill="url(#chestWoodGrad)" stroke="url(#chestGoldRim)" stroke-width="1.8"/>

                <!-- Gold Vertical Straps on Base -->
                <rect x="24" y="36" width="6" height="25" fill="url(#chestGoldRim)"/>
                <rect x="50" y="36" width="6" height="25" fill="url(#chestGoldRim)"/>
                <circle cx="27" cy="48" r="1.2" fill="#fff"/>
                <circle cx="53" cy="48" r="1.2" fill="#fff"/>

                <!-- Chest Lid (Slightly Ajar with golden treasure glow bursting) -->
                <polygon points="18,36 62,36 64,28 16,28" fill="#f39c12" opacity="0.9" filter="url(#chestSoftGlow)"/>

                <!-- Upper Curved Lid -->
                <path d="M12 28 Q40 10 68 28 L64 34 Q40 18 16 34 Z" fill="url(#chestWoodGrad)" stroke="url(#chestGoldRim)" stroke-width="1.8"/>

                <!-- Gold Filigree on Lid -->
                <rect x="24" y="16" width="6" height="15" fill="url(#chestGoldRim)"/>
                <rect x="50" y="16" width="6" height="15" fill="url(#chestGoldRim)"/>

                <!-- Arcane Lock with Cyan Gem -->
                <rect x="35" y="32" width="10" height="12" rx="2" fill="url(#chestGoldRim)" stroke="#b7791f" stroke-width="1"/>
                <circle cx="40" cy="38" r="2.8" fill="#00cec9" stroke="#fff" stroke-width="1" filter="url(#chestSoftGlow)"/>

                <!-- Overflowing Coins & Sparkles -->
                <ellipse cx="26" cy="31" rx="5" ry="3" fill="#f1c40f" stroke="#d4ac0d" stroke-width="0.8"/>
                <ellipse cx="54" cy="31" rx="5" ry="3" fill="#f1c40f" stroke="#d4ac0d" stroke-width="0.8"/>
                <circle cx="34" cy="27" r="2.5" fill="#e74c3c" stroke="#fff" stroke-width="0.6"/>
                <circle cx="46" cy="27" r="2.5" fill="#3498db" stroke="#fff" stroke-width="0.6"/>

                <!-- Floating magical sparkle stars -->
                <polygon points="12,18 14,22 18,24 14,26 12,30 10,26 6,24 10,22" fill="#ffeaa7" opacity="0.9"/>
                <polygon points="68,14 69.5,17 73,18 69.5,19 68,22 66.5,19 63,18 66.5,17" fill="#ffeaa7" opacity="0.9"/>
            </svg>
        </div>

        <!-- Header Texts -->
        <h2 class="popup-title">С ВОЗВРАЩЕНИЕМ!</h2>
        <p class="popup-subtitle">Пока вас не было, чародейская лавка продолжала работать и приносить доход</p>

        <!-- Detailed Analytics & Storage Card -->
        <div class="offline-report-card">
            
            <!-- Time Away & Cap Status Row -->
            <div class="time-stat-row">
                <div class="time-chip">
                    <ResourceIcon type="time" size={16} class="time-icon" />
                    <span>Отсутствовали: <strong>{formatDuration(offlineSeconds)}</strong></span>
                </div>

                {#if isCapped}
                    <span class="cap-badge capped">ПРЕДЕЛ</span>
                {:else}
                    <span class="cap-badge">Заполнено {progressPercent}%</span>
                {/if}
            </div>

            <!-- Capacity Progress Bar -->
            <div class="storage-bar-container">
                <div class="storage-labels">
                    <span class="storage-name">Вместимость хранилища</span>
                    <span class="storage-values">
                        {formatDuration(Math.min(offlineSeconds, maxOfflineSeconds))} из {formatCapacity(maxOfflineSeconds)}
                        {#if $isVip}
                            <span class="vip-capacity-chip">+5ч VIP</span>
                        {/if}
                    </span>
                </div>
                <div class="progress-track">
                    <div 
                        class="progress-fill" 
                        class:is-full={isCapped} 
                        style="width: {progressPercent}%;"
                    ></div>
                </div>
            </div>

            <!-- Earned Gold Highlight Block -->
            <div class="earned-gold-block">
                <div class="gold-sum-row">
                    <span class="plus-sign">+</span>
                    <span class="gold-amount">{formatNumber(offlineGold)}</span>
                    <div class="gold-coin-badge">
                        <ResourceIcon type="gold" size={28} />
                    </div>
                </div>
                {#if currentRate > 0}
                    <div class="rate-subtext">
                        <span>Скорость лавки: +{formatNumber(currentRate)}/сек</span>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Cap Advice Banner (Displayed when storage is full) -->
        {#if isCapped}
            <div class="cap-advice-box">
                <svg viewBox="0 0 20 20" width="16" height="16" fill="none" class="advice-svg">
                    <circle cx="10" cy="10" r="8.5" stroke="#f1c40f" stroke-width="1.5"/>
                    <line x1="10" y1="6" x2="10" y2="11" stroke="#f1c40f" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="10" cy="14" r="1" fill="#f1c40f"/>
                </svg>
                <span>Хранилище заполнено. Увеличьте «Очаг» в Лавке или оформите VIP, чтобы накапливать больше!</span>
            </div>
        {/if}

        <!-- Interactive Actions -->
        <div class="popup-actions">
            <!-- 1. Double Gold Button (Reward Video or Instant VIP) -->
            <button 
                type="button" 
                class="btn-double" 
                on:click={handleClaimDouble} 
                disabled={isClaiming}
            >
                <div class="btn-shine"></div>
                <div class="btn-double-content">
                    {#if $isVip}
                        <div class="btn-main-label">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" class="btn-crown-svg">
                                <path d="M4 18 L20 18 L22 8 L17 12 L12 4 L7 12 L2 8 Z" fill="#ffeaa7" stroke="#fff" stroke-width="1.5"/>
                            </svg>
                            <span>УДВОИТЬ (VIP БОНУС)</span>
                        </div>
                        <span class="btn-sub-label">Мгновенно без рекламы: +{formatNumber(offlineGold * 2)}</span>
                    {:else}
                        <div class="btn-main-label">
                            <svg viewBox="0 0 20 20" width="18" height="18" fill="none" class="btn-video-svg">
                                <rect x="2" y="4" width="11" height="12" rx="2" fill="#ffffff" opacity="0.9"/>
                                <polygon points="14,8 19,5 19,15 14,12" fill="#ffffff" opacity="0.9"/>
                            </svg>
                            <span>УДВОИТЬ х2 (РЕКЛАМА)</span>
                        </div>
                        <span class="btn-sub-label">Получить +{formatNumber(offlineGold * 2)} золота</span>
                    {/if}
                </div>
            </button>

            <!-- 2. Regular Claim Button -->
            <button 
                type="button" 
                class="btn-claim" 
                on:click={handleClaimRegular} 
                disabled={isClaiming}
            >
                <span>Забрать +{formatNumber(offlineGold)}</span>
            </button>
        </div>

    </div>
</div>
{/if}

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(8, 3, 18, 0.86);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        padding: 16px;
        overflow: hidden;
    }

    .magical-ambient-glow {
        position: absolute;
        width: 140vw;
        height: 140vh;
        background: radial-gradient(circle at 50% 45%, rgba(155, 89, 182, 0.18) 0%, rgba(241, 196, 15, 0.08) 35%, rgba(0, 0, 0, 0) 70%);
        pointer-events: none;
        animation: pulseAmbient 4.5s infinite alternate ease-in-out;
    }

    @keyframes pulseAmbient {
        0% { transform: scale(1); opacity: 0.8; }
        100% { transform: scale(1.1); opacity: 1; }
    }

    .modal {
        position: relative;
        background: linear-gradient(165deg, #1d0f38 0%, #120726 55%, #0a0317 100%);
        border: 1.5px solid rgba(241, 196, 15, 0.45);
        border-radius: 22px;
        padding: 26px 24px 22px;
        max-width: 440px;
        width: 100%;
        color: #ffffff;
        text-align: center;
        box-shadow: 
            0 16px 50px rgba(0, 0, 0, 0.85),
            0 0 30px rgba(162, 155, 254, 0.18),
            inset 0 1px 6px rgba(255, 255, 255, 0.15);
        z-index: 10;
        box-sizing: border-box;
    }

    /* Close Button */
    .close-btn {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #dfe6e9;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.15s ease;
        z-index: 5;
    }

    .close-btn:hover {
        background: rgba(231, 76, 60, 0.25);
        border-color: #e74c3c;
        color: #ff7675;
        transform: scale(1.08);
    }

    /* Chest Visual */
    .chest-visual-wrap {
        display: flex;
        justify-content: center;
        margin-bottom: 6px;
    }

    .vault-chest-svg {
        animation: floatChest 3.6s infinite ease-in-out;
        filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.6));
    }

    @keyframes floatChest {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-7px) scale(1.03); }
    }

    /* Titles */
    .popup-title {
        margin: 0 0 4px;
        font-size: 1.55rem;
        font-weight: 900;
        background: linear-gradient(135deg, #ffeaa7 0%, #f1c40f 50%, #e67e22 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: 0.8px;
        text-shadow: 0 2px 10px rgba(241, 196, 15, 0.3);
    }

    .popup-subtitle {
        margin: 0 0 16px;
        font-size: 0.82rem;
        color: rgba(223, 230, 233, 0.75);
        line-height: 1.35;
        padding: 0 10px;
    }

    /* Report Card */
    .offline-report-card {
        background: rgba(10, 4, 22, 0.55);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 14px;
        margin-bottom: 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
    }

    .time-stat-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
    }

    .time-chip {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.82rem;
        color: #dfe6e9;
    }

    .time-chip strong {
        color: #74b9ff;
    }

    .cap-badge {
        font-size: 0.7rem;
        font-weight: 800;
        padding: 2px 8px;
        border-radius: 6px;
        background: rgba(52, 152, 219, 0.2);
        border: 1px solid rgba(52, 152, 219, 0.4);
        color: #74b9ff;
        text-transform: uppercase;
        letter-spacing: 0.4px;
    }

    .cap-badge.capped {
        background: rgba(231, 76, 60, 0.25);
        border-color: #e74c3c;
        color: #ff7675;
        animation: pulseCapped 2s infinite ease-in-out;
    }

    @keyframes pulseCapped {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }

    /* Storage Progress Bar */
    .storage-bar-container {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .storage-labels {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.75rem;
        color: rgba(223, 230, 233, 0.7);
    }

    .storage-values {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #dfe6e9;
        font-weight: 700;
    }

    .vip-capacity-chip {
        background: linear-gradient(90deg, #f39c12, #d35400);
        color: #fff;
        font-size: 0.65rem;
        font-weight: 800;
        padding: 1px 5px;
        border-radius: 4px;
    }

    .progress-track {
        height: 7px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #3498db 0%, #2ecc71 60%, #f1c40f 100%);
        border-radius: 4px;
        transition: width 0.3s ease;
    }

    .progress-fill.is-full {
        background: linear-gradient(90deg, #f39c12 0%, #e74c3c 100%);
    }

    /* Earned Gold Highlight */
    .earned-gold-block {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 6px 0;
    }

    .gold-sum-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        line-height: 1;
    }

    .plus-sign {
        font-size: 1.8rem;
        font-weight: 900;
        color: #f1c40f;
    }

    .gold-amount {
        font-size: 2.35rem;
        font-weight: 900;
        color: #f1c40f;
        text-shadow: 0 0 16px rgba(241, 196, 15, 0.45);
        letter-spacing: 0.5px;
    }

    .gold-coin-badge {
        display: flex;
        align-items: center;
        filter: drop-shadow(0 0 8px rgba(241, 196, 15, 0.6));
    }

    .rate-subtext {
        font-size: 0.74rem;
        color: #2ecc71;
        font-weight: 700;
        margin-top: 5px;
    }

    /* Cap Advice Box */
    .cap-advice-box {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(243, 156, 18, 0.12);
        border: 1px dashed rgba(241, 196, 15, 0.45);
        border-radius: 10px;
        padding: 8px 10px;
        margin-bottom: 14px;
        text-align: left;
        font-size: 0.72rem;
        color: #ffeaa7;
        line-height: 1.3;
    }

    .advice-svg {
        flex-shrink: 0;
    }

    /* Buttons */
    .popup-actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .btn-double {
        position: relative;
        background: linear-gradient(135deg, #e84393 0%, #d63031 50%, #f39c12 100%);
        border: 1.5px solid rgba(255, 255, 255, 0.35);
        border-radius: 14px;
        padding: 13px 18px;
        color: #ffffff;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 20px rgba(214, 48, 49, 0.45);
        overflow: hidden;
        transition: transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease;
        animation: pulseDoubleBtn 2.2s infinite ease-in-out;
    }

    .btn-double:hover:not(:disabled) {
        transform: translateY(-2px);
        filter: brightness(1.12);
        box-shadow: 0 8px 25px rgba(214, 48, 49, 0.65);
    }

    .btn-double:active:not(:disabled) {
        transform: scale(0.98);
    }

    @keyframes pulseDoubleBtn {
        0%, 100% {
            box-shadow: 0 6px 20px rgba(214, 48, 49, 0.45);
        }
        50% {
            box-shadow: 0 6px 26px rgba(241, 196, 15, 0.6);
        }
    }

    .btn-shine {
        position: absolute;
        top: -60%;
        left: -60%;
        width: 220%;
        height: 220%;
        background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%);
        transform: rotate(45deg);
        animation: sweepShine 3.2s infinite linear;
        pointer-events: none;
    }

    @keyframes sweepShine {
        0% { left: -100%; }
        45%, 100% { left: 100%; }
    }

    .btn-double-content {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
    }

    .btn-main-label {
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 1.05rem;
        font-weight: 900;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    }

    .btn-crown-svg,
    .btn-video-svg {
        flex-shrink: 0;
        filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5));
    }

    .btn-sub-label {
        font-size: 0.72rem;
        color: #ffeaa7;
        font-weight: 700;
        opacity: 0.95;
    }

    .btn-claim {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        padding: 10px 16px;
        color: rgba(223, 230, 233, 0.75);
        font-size: 0.88rem;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .btn-claim:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(241, 196, 15, 0.4);
        color: #ffffff;
        transform: translateY(-1px);
    }

    .btn-claim:active:not(:disabled) {
        transform: scale(0.98);
    }

    /* Mobile Adaptations */
    @media (max-width: 480px) {
        .modal {
            padding: 22px 18px 18px;
            border-radius: 18px;
        }
        .popup-title {
            font-size: 1.35rem;
        }
        .popup-subtitle {
            font-size: 0.76rem;
            margin-bottom: 12px;
        }
        .gold-amount {
            font-size: 2rem;
        }
        .btn-main-label {
            font-size: 0.95rem;
        }
    }
</style>
