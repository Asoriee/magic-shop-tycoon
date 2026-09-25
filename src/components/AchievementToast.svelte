<script lang="ts">
    import { onMount } from 'svelte';
    import { t } from '../i18n';

    export let title: string = '';
    export let tierNum: number = 1;
    export let iconSvg: string = '';
    export let onOpenHall: () => void = () => {};
    export let onDismiss: () => void = () => {};

    const romanNumerals = ['I', 'II', 'III', 'IV', 'V'];
    let isLeaving = false;
    let timer: number | null = null;

    function handleDismiss() {
        if (isLeaving) return;
        isLeaving = true;
        setTimeout(() => {
            onDismiss();
        }, 300);
    }

    function handleClick() {
        onOpenHall();
        handleDismiss();
    }

    onMount(() => {
        timer = window.setTimeout(() => {
            handleDismiss();
        }, 4500);

        return () => {
            if (timer) clearTimeout(timer);
        };
    });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div 
    class="achievement-toast-container" 
    class:leaving={isLeaving} 
    on:click={handleClick}
    role="button"
    tabindex="0"
>
    <div class="toast-shimmer-sweep"></div>
    <div class="toast-content">
        <div class="toast-icon-wrap">
            {#if iconSvg}
                {@html iconSvg}
            {:else}
                <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                    <path d="M7 6 H25 V14 C25 20 16 23 16 23 C16 23 7 20 7 14 Z" fill="#f1c40f" stroke="#d4ac0d" stroke-width="1.5"/>
                    <circle cx="16" cy="12" r="3.5" fill="#f39c12"/>
                    <path d="M13 23 L10 28 H22 L19 23" fill="#e67e22"/>
                </svg>
            {/if}
        </div>
        <div class="toast-text-box">
            <div class="toast-badge-row">
                <span class="toast-badge-tag">{$t('achievements.unlockedToast')}</span>
                <span class="toast-tier-pill">{romanNumerals[tierNum - 1] || tierNum}</span>
            </div>
            <div class="toast-name">{title}</div>
            <div class="toast-hint">{$t('achievements.toastRewardReady')}</div>
        </div>
        <div class="toast-arrow-btn" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        </div>
    </div>
</div>

<style>
    .achievement-toast-container {
        position: fixed;
        top: max(14px, env(safe-area-inset-top));
        left: 50%;
        transform: translate3d(-50%, 0, 0);
        width: calc(100% - 24px);
        max-width: 400px;
        background: linear-gradient(135deg, rgba(32, 14, 58, 0.96) 0%, rgba(16, 7, 34, 0.98) 100%);
        border: 1.5px solid rgba(241, 196, 15, 0.7);
        border-radius: 16px;
        box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.8),
            0 0 20px rgba(241, 196, 15, 0.25),
            inset 0 1px 2px rgba(255, 255, 255, 0.25);
        z-index: 9999;
        cursor: pointer;
        user-select: none;
        overflow: hidden;
        animation: toastSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        touch-action: manipulation;
        box-sizing: border-box;
    }

    .achievement-toast-container.leaving {
        animation: toastSlideUp 0.3s ease-in forwards;
    }

    @keyframes toastSlideDown {
        0% {
            transform: translate3d(-50%, -40px, 0) scale(0.92);
            opacity: 0;
        }
        100% {
            transform: translate3d(-50%, 0, 0) scale(1);
            opacity: 1;
        }
    }

    @keyframes toastSlideUp {
        0% {
            transform: translate3d(-50%, 0, 0) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate3d(-50%, -30px, 0) scale(0.92);
            opacity: 0;
        }
    }

    .toast-shimmer-sweep {
        position: absolute;
        top: 0;
        left: -100%;
        width: 60%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(241, 196, 15, 0.2), transparent);
        transform: skewX(-20deg);
        animation: toastShimmer 2.5s infinite;
        pointer-events: none;
    }

    @keyframes toastShimmer {
        0% { left: -80%; }
        40%, 100% { left: 160%; }
    }

    .toast-content {
        position: relative;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        z-index: 2;
    }

    .toast-icon-wrap {
        flex-shrink: 0;
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.2) 0%, rgba(230, 126, 34, 0.15) 100%);
        border: 1px solid rgba(241, 196, 15, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 10px rgba(241, 196, 15, 0.3);
    }

    .toast-text-box {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .toast-badge-row {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .toast-badge-tag {
        font-size: 0.70rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #f1c40f;
        text-shadow: 0 0 6px rgba(241, 196, 15, 0.5);
    }

    .toast-tier-pill {
        background: linear-gradient(135deg, #f39c12, #e67e22);
        color: #ffffff;
        font-size: 0.65rem;
        font-weight: 800;
        padding: 1px 5px;
        border-radius: 6px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    }

    .toast-name {
        font-size: 0.88rem;
        font-weight: 700;
        color: #ffffff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .toast-hint {
        font-size: 0.70rem;
        color: #a29bfe;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .toast-arrow-btn {
        flex-shrink: 0;
        color: #f1c40f;
        opacity: 0.85;
        transition: transform 0.15s ease;
    }

    .achievement-toast-container:active .toast-arrow-btn {
        transform: translateX(3px);
    }

    @media (max-width: 680px) {
        .achievement-toast-container {
            width: calc(100% - 16px);
            max-width: 380px;
        }

        .toast-content {
            padding: 8px 10px;
            gap: 10px;
        }

        .toast-icon-wrap {
            width: 34px;
            height: 34px;
        }

        .toast-name {
            font-size: 0.82rem;
        }

        .toast-hint {
            font-size: 0.66rem;
        }
    }
</style>
