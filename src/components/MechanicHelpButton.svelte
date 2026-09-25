<script lang="ts">
    import { gameStore, openGuide } from '../store';
    import { t } from '../i18n';

    export let guideId: string;
    export let compact: boolean = false;
    export let customClass: string = '';

    $: isViewed = ($gameStore?.viewedGuides || []).includes(guideId);
    $: guideTitle = $t(`guides.${guideId}.title`) || $t('guidesUi.modalTitle');

    function handleClick(e: MouseEvent) {
        e.stopPropagation();
        openGuide(guideId);
    }
</script>

<button 
    type="button" 
    class="mechanic-help-btn {customClass}" 
    class:compact 
    class:unread={!isViewed}
    title="{$t('guidesUi.modalTitle')}: {guideTitle}" 
    aria-label="{$t('guidesUi.modalTitle')}: {guideTitle}"
    on:click={handleClick}
>
    <!-- Arcane Pulsing Glow for Unread -->
    {#if !isViewed}
        <span class="unread-pulse-ring"></span>
        <span class="unread-spark-dot" title={$t('guidesUi.unreadBadge')}></span>
    {/if}

    <svg viewBox="0 0 24 24" width={compact ? 16 : 18} height={compact ? 16 : 18} fill="none" class="help-svg-glyph">
        <circle cx="12" cy="12" r="10" class="glyph-circle"/>
        <path d="M9.5 8.8 C9.5 7.4 10.6 6.3 12 6.3 C13.4 6.3 14.5 7.4 14.5 8.8 C14.5 10.1 13.6 10.8 12.6 11.4 C12 11.7 12 12.2 12 12.8" class="glyph-arc"/>
        <circle cx="12" cy="16" r="1.3" class="glyph-dot"/>
    </svg>
</button>

<style>
    .mechanic-help-btn {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        min-width: 36px;
        min-height: 36px;
        padding: 0;
        background: linear-gradient(135deg, rgba(30, 20, 50, 0.85), rgba(15, 10, 30, 0.95));
        border: 1.5px solid rgba(241, 196, 15, 0.45);
        border-radius: 50%;
        color: #ffeaa7;
        cursor: pointer;
        outline: none;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), 
                    border-color 0.25s ease, 
                    box-shadow 0.25s ease, 
                    background 0.25s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.15);
        user-select: none;
        flex-shrink: 0;
        z-index: 2;
    }

    .mechanic-help-btn.compact {
        width: 30px;
        height: 30px;
        min-width: 30px;
        min-height: 30px;
    }

    .mechanic-help-btn:hover {
        transform: scale(1.1);
        border-color: #f1c40f;
        background: linear-gradient(135deg, rgba(45, 25, 80, 0.9), rgba(25, 15, 50, 0.98));
        box-shadow: 0 0 14px rgba(241, 196, 15, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.3);
        color: #fff;
    }

    .mechanic-help-btn:active {
        transform: scale(0.94);
    }

    .help-svg-glyph {
        display: block;
        transition: transform 0.2s ease;
    }

    .glyph-circle {
        stroke: currentColor;
        stroke-width: 1.6;
        fill: rgba(241, 196, 15, 0.08);
        transition: fill 0.2s ease;
    }

    .glyph-arc {
        stroke: currentColor;
        stroke-width: 2.1;
        stroke-linecap: round;
    }

    .glyph-dot {
        fill: currentColor;
    }

    .mechanic-help-btn:hover .glyph-circle {
        fill: rgba(241, 196, 15, 0.2);
    }

    /* Unread Golden Glow Animation */
    .mechanic-help-btn.unread {
        border-color: #ffd32a;
        box-shadow: 0 0 10px rgba(255, 211, 42, 0.6), inset 0 0 6px rgba(255, 211, 42, 0.3);
        animation: unreadBreathing 2.2s infinite ease-in-out;
    }

    .unread-pulse-ring {
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        border: 1.5px solid #f1c40f;
        opacity: 0;
        pointer-events: none;
        animation: pulseRing 2.4s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
    }

    .unread-spark-dot {
        position: absolute;
        top: -1px;
        right: -1px;
        width: 8px;
        height: 8px;
        background: #e74c3c;
        border: 1.5px solid #fff;
        border-radius: 50%;
        box-shadow: 0 0 6px #e74c3c;
    }

    @keyframes unreadBreathing {
        0%, 100% {
            box-shadow: 0 0 8px rgba(255, 211, 42, 0.4), inset 0 0 4px rgba(255, 211, 42, 0.2);
            border-color: rgba(255, 211, 42, 0.7);
        }
        50% {
            box-shadow: 0 0 16px rgba(255, 211, 42, 0.8), inset 0 0 8px rgba(255, 211, 42, 0.4);
            border-color: #fff;
        }
    }

    @keyframes pulseRing {
        0% {
            transform: scale(0.9);
            opacity: 0.8;
        }
        60%, 100% {
            transform: scale(1.4);
            opacity: 0;
        }
    }
</style>
