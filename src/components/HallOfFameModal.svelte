<script lang="ts">
    import { t, formatNumberLocalized } from '../i18n';
    import { 
        gameStore, 
        unclaimedAchievementsCount, 
        formatNumber 
    } from '../store';
    import { 
        ACHIEVEMENTS, 
        getAchievementStatus, 
        calculateAchievementPerks,
        getTotalClaimedStars,
        getCurrentArchmageTitle,
        type AchievementDef
    } from '../achievements';

    export let isOpen: boolean = false;
    export let onClose: () => void = () => {};

    const romanNumerals = ['I', 'II', 'III', 'IV', 'V'];

    $: state = $gameStore;
    $: totalStars = getTotalClaimedStars(state);
    $: titleInfo = getCurrentArchmageTitle(totalStars);
    $: passivePerks = calculateAchievementPerks(state);
    $: unclaimedCount = $unclaimedAchievementsCount;

    function handleClaim(def: AchievementDef) {
        gameStore.claimAchievement(def.id);
    }

    function handleClaimAll() {
        gameStore.claimAllAchievements();
    }

    function formatPerkText(perkType: string, perkValue: number): string {
        const percent = Math.round(perkValue * 100);
        switch (perkType) {
            case 'gold_mult':
                return `+${percent}% ${$t('achievements.perkGold')}`;
            case 'stardust_mult':
                return `+${percent}% ${$t('achievements.perkStardust')}`;
            case 'double_brew':
                return `+${percent}% ${$t('achievements.perkDoubleBrew')}`;
            case 'orders_gold':
                return `+${percent}% ${$t('achievements.perkOrdersGold')}`;
            case 'click_power':
                return `+${percent}% ${$t('achievements.perkClickPower')}`;
            default:
                return `+${percent}%`;
        }
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="hall-backdrop" on:click={onClose} role="presentation">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div class="hall-window" on:click|stopPropagation role="dialog" aria-modal="true" tabindex="-1">
            <!-- 1. Header Bar -->
            <div class="hall-header">
                <div class="hall-header-left">
                    <div class="hall-trophy-icon">
                        <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                            <path d="M8 5 H24 V14 C24 19 16 22 16 22 C16 22 8 19 8 14 Z" fill="url(#hallTrophyGold)" stroke="#f1c40f" stroke-width="1.4"/>
                            <path d="M8 8 H4 C4 13 8 14 8 14" stroke="#f1c40f" stroke-width="1.4" fill="none" stroke-linecap="round"/>
                            <path d="M24 8 H28 C28 13 24 14 24 14" stroke="#f1c40f" stroke-width="1.4" fill="none" stroke-linecap="round"/>
                            <path d="M16 22 V26 M11 26 H21" stroke="#f39c12" stroke-width="2" stroke-linecap="round"/>
                            <polygon points="16,8 17.5,12 21.5,12 18,14.5 19.5,18.5 16,16 12.5,18.5 14,14.5 10.5,12 14.5,12" fill="#fff"/>
                            <defs>
                                <linearGradient id="hallTrophyGold" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="#f9ca24"/>
                                    <stop offset="100%" stop-color="#f0932b"/>
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div class="hall-title-box">
                        <h2 class="hall-main-title">{$t('achievements.title')}</h2>
                        <span class="hall-sub-title">{$t('achievements.subtitle')}</span>
                    </div>
                </div>
                <button 
                    type="button" 
                    class="hall-close-btn" 
                    on:click={onClose} 
                    aria-label="{$t('common.close')}"
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <!-- Scrollable Content -->
            <div class="hall-scroll-body">
                <!-- 2. Archmage Rank Banner -->
                <div class="archmage-rank-card" style="--rank-glow: {titleInfo.current.glowColor}">
                    <div class="rank-top-row">
                        <div class="rank-crown-badge" style="background: {titleInfo.current.badgeColor}">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="#ffffff">
                                <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z"/>
                            </svg>
                        </div>
                        <div class="rank-info-meta">
                            <span class="rank-label">{$t('achievements.archmageTitle')}</span>
                            <span class="rank-name" style="color: {titleInfo.current.badgeColor}">
                                {$t(`achievements.titles.${titleInfo.current.titleKey}`)}
                            </span>
                        </div>
                        <div class="stars-counter-badge">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="#f1c40f">
                                <polygon points="12,2 15,9 22,9 16.5,13.5 18.5,20.5 12,16 5.5,20.5 7.5,13.5 2,9 9,9"/>
                            </svg>
                            <span class="stars-text">{totalStars} / 40</span>
                        </div>
                    </div>

                    <!-- Rank Progress Bar -->
                    <div class="rank-progress-wrap">
                        <div class="rank-progress-text">
                            {#if titleInfo.next}
                                <span>{$t('achievements.rankProgress')}: <strong>{titleInfo.starsToNext} ★</strong></span>
                                <span class="next-title-name">→ {$t(`achievements.titles.${titleInfo.next.titleKey}`)}</span>
                            {:else}
                                <span class="rank-max-text">{$t('achievements.maxRank')}</span>
                            {/if}
                        </div>
                        <div class="rank-bar-track">
                            <div 
                                class="rank-bar-fill" 
                                style="width: {titleInfo.next ? Math.min(100, Math.max(0, ((totalStars - titleInfo.current.minStars) / (titleInfo.next.minStars - titleInfo.current.minStars)) * 100)) : 100}%; background: {titleInfo.current.badgeColor};"
                            ></div>
                        </div>
                    </div>
                </div>

                <!-- 3. Permanent Passive Perks Summary -->
                <div class="perks-summary-card">
                    <div class="perks-summary-title">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="#a29bfe">
                            <path d="M12 2L15 8L21 9L17 14L18 20L12 17L6 20L7 14L3 9L9 8L12 2Z"/>
                        </svg>
                        <span>{$t('achievements.passivePerksTitle')}</span>
                    </div>
                    <div class="perks-chip-grid">
                        <div class="perk-chip" class:active={passivePerks.gold_mult > 0}>
                            <span class="perk-val">+{Math.round(passivePerks.gold_mult * 100)}%</span>
                            <span class="perk-name">{$t('achievements.perkGold')}</span>
                        </div>
                        <div class="perk-chip" class:active={passivePerks.stardust_mult > 0}>
                            <span class="perk-val">+{Math.round(passivePerks.stardust_mult * 100)}%</span>
                            <span class="perk-name">{$t('achievements.perkStardust')}</span>
                        </div>
                        <div class="perk-chip" class:active={passivePerks.double_brew > 0}>
                            <span class="perk-val">+{Math.round(passivePerks.double_brew * 100)}%</span>
                            <span class="perk-name">{$t('achievements.perkDoubleBrew')}</span>
                        </div>
                        <div class="perk-chip" class:active={passivePerks.orders_gold > 0}>
                            <span class="perk-val">+{Math.round(passivePerks.orders_gold * 100)}%</span>
                            <span class="perk-name">{$t('achievements.perkOrdersGold')}</span>
                        </div>
                        <div class="perk-chip" class:active={passivePerks.click_power > 0}>
                            <span class="perk-val">+{Math.round(passivePerks.click_power * 100)}%</span>
                            <span class="perk-name">{$t('achievements.perkClickPower')}</span>
                        </div>
                    </div>
                </div>

                <!-- 4. Claim All Banner (if any ready) -->
                {#if unclaimedCount > 0}
                    <div class="claim-all-banner">
                        <div class="claim-all-text">
                            <span class="claim-all-badge">!</span>
                            <span>{unclaimedCount} {$t('achievements.toastRewardReady')}</span>
                        </div>
                        <button 
                            type="button" 
                            class="claim-all-btn pulse"
                            on:click={handleClaimAll}
                        >
                            {$t('achievements.claimAll')}
                        </button>
                    </div>
                {/if}

                <!-- 5. Achievements List -->
                <div class="achievements-list">
                    {#each ACHIEVEMENTS as def (def.id)}
                        {@const status = getAchievementStatus(def, state)}
                        <div class="achievement-card" class:ready-card={status.canClaim} class:max-card={status.isMax}>
                            <div class="ach-top-row">
                                <div class="ach-icon-box">
                                    {@html def.iconSvg}
                                </div>
                                <div class="ach-details">
                                    <div class="ach-name-row">
                                        <span class="ach-title">{$t(`achievements.items.${def.id}.name`)}</span>
                                        <div class="ach-stars-row">
                                            {#each [1, 2, 3, 4, 5] as starTier}
                                                <svg 
                                                    viewBox="0 0 24 24" 
                                                    width="14" 
                                                    height="14" 
                                                    class="ach-star-icon"
                                                    class:earned={starTier <= status.claimedTier}
                                                    class:current-ready={starTier === status.claimedTier + 1 && status.canClaim}
                                                >
                                                    <polygon points="12,2 15,9 22,9 16.5,13.5 18.5,20.5 12,16 5.5,20.5 7.5,13.5 2,9 9,9"/>
                                                </svg>
                                            {/each}
                                        </div>
                                    </div>
                                    <div class="ach-desc">
                                        {#if status.isMax}
                                            {$t('achievements.completed')}
                                        {:else}
                                            {$t(`achievements.items.${def.id}.desc`, { target: formatNumberLocalized(status.nextTier.target) })}
                                        {/if}
                                    </div>
                                </div>
                            </div>

                            <!-- Progress Track -->
                            <div class="ach-progress-row">
                                <div class="ach-progress-track">
                                    <div 
                                        class="ach-progress-fill" 
                                        class:full={status.isMax || status.canClaim}
                                        style="width: {status.progressPercent}%;"
                                    ></div>
                                </div>
                                <div class="ach-progress-numbers">
                                    {#if status.isMax}
                                        <span class="ach-num-max">{$t('achievements.maxTier')}</span>
                                    {:else}
                                        <span>{formatNumber(status.currentProgress)} / {formatNumber(status.nextTier.target)}</span>
                                    {/if}
                                </div>
                            </div>

                            <!-- Reward Row & Action Button -->
                            <div class="ach-reward-row">
                                {#if !status.isMax}
                                    <div class="ach-rewards-tags">
                                        <span class="reward-pill crystals-pill">
                                            💎 +{status.nextTier.crystalsReward}
                                        </span>
                                        <span class="reward-pill stardust-pill">
                                            ✨ +{status.nextTier.stardustReward}
                                        </span>
                                        <span class="reward-pill perk-pill">
                                            🔮 {formatPerkText(status.nextTier.perkType, status.nextTier.perkValue)}
                                        </span>
                                    </div>
                                    {#if status.canClaim}
                                        <button 
                                            type="button" 
                                            class="claim-ach-btn pulse"
                                            on:click={() => handleClaim(def)}
                                        >
                                            {$t('achievements.claim')}
                                        </button>
                                    {:else}
                                        <span class="ach-tier-badge">
                                            {$t('achievements.tier')} {romanNumerals[status.claimedTier] || (status.claimedTier + 1)}
                                        </span>
                                    {/if}
                                {:else}
                                    <div class="ach-completed-banner">
                                        <span>★★★★★ {$t('achievements.maxTier')}</span>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    /* Base Cascading Styles (strictly before @media) */
    .hall-backdrop {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        height: 100dvh;
        background: rgba(10, 5, 24, 0.95);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px;
        box-sizing: border-box;
        overflow: hidden;
    }

    .hall-window {
        background: linear-gradient(165deg, #1d0f36 0%, #110724 100%);
        border: 1.5px solid rgba(241, 196, 15, 0.5);
        border-radius: 20px;
        width: 100%;
        max-width: 580px;
        min-width: 0;
        max-height: 92vh;
        max-height: 92dvh;
        display: flex;
        flex-direction: column;
        box-shadow: 
            0 20px 50px rgba(0, 0, 0, 0.85),
            0 0 35px rgba(241, 196, 15, 0.15),
            inset 0 1px 4px rgba(255, 255, 255, 0.2);
        overflow: hidden;
        box-sizing: border-box;
    }

    /* 1. Header */
    .hall-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: rgba(18, 8, 36, 0.7);
        border-bottom: 1px solid rgba(241, 196, 15, 0.25);
        flex-shrink: 0;
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
    }

    .hall-header-left {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        min-width: 0;
    }

    .hall-trophy-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.25) 0%, rgba(230, 126, 34, 0.15) 100%);
        border: 1px solid rgba(241, 196, 15, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 15px rgba(241, 196, 15, 0.3);
        flex-shrink: 0;
    }

    .hall-title-box {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-width: 0;
    }

    .hall-main-title {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 800;
        color: #f1c40f;
        text-shadow: 0 0 10px rgba(241, 196, 15, 0.4);
        letter-spacing: 0.5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .hall-sub-title {
        font-size: 0.72rem;
        color: #a29bfe;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .hall-close-btn {
        width: 44px;
        height: 44px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        color: #dfe6e9;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease;
        flex-shrink: 0;
        touch-action: manipulation;
    }

    .hall-close-btn:hover {
        background: rgba(231, 76, 60, 0.25);
        border-color: rgba(231, 76, 60, 0.6);
        color: #ffffff;
        transform: scale(1.05);
    }

    /* Scroll Body */
    .hall-scroll-body {
        overflow-y: auto;
        overflow-x: hidden;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        scrollbar-width: thin;
        scrollbar-color: rgba(241, 196, 15, 0.4) transparent;
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
    }

    .hall-scroll-body::-webkit-scrollbar {
        width: 6px;
    }

    .hall-scroll-body::-webkit-scrollbar-thumb {
        background: rgba(241, 196, 15, 0.4);
        border-radius: 4px;
    }

    /* 2. Rank Banner */
    .archmage-rank-card {
        flex-shrink: 0;
        background: linear-gradient(135deg, rgba(38, 18, 68, 0.85) 0%, rgba(20, 9, 40, 0.95) 100%);
        border: 1.5px solid rgba(241, 196, 15, 0.35);
        border-radius: 16px;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5), inset 0 0 25px var(--rank-glow, rgba(165, 177, 194, 0.2));
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
    }

    .rank-top-row {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        min-width: 0;
    }

    .rank-crown-badge {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }

    .rank-info-meta {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
    }

    .rank-label {
        font-size: 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #b2bec3;
    }

    .rank-name {
        font-size: 1.05rem;
        font-weight: 800;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-shadow: 0 0 10px currentColor;
        min-width: 0;
    }

    .stars-counter-badge {
        display: flex;
        align-items: center;
        gap: 5px;
        background: rgba(241, 196, 15, 0.15);
        border: 1px solid rgba(241, 196, 15, 0.4);
        padding: 4px 10px;
        border-radius: 20px;
        flex-shrink: 0;
    }

    .stars-text {
        font-size: 0.82rem;
        font-weight: 800;
        color: #f1c40f;
    }

    .rank-progress-wrap {
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 100%;
        min-width: 0;
    }

    .rank-progress-text {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 6px;
        font-size: 0.72rem;
        color: #dfe6e9;
        width: 100%;
        min-width: 0;
    }

    .next-title-name {
        color: #a29bfe;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 55%;
        text-align: right;
    }

    .rank-max-text {
        color: #f1c40f;
        font-weight: 700;
    }

    .rank-bar-track {
        height: 7px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .rank-bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;
    }

    /* 3. Passive Perks */
    .perks-summary-card {
        flex-shrink: 0;
        background: rgba(20, 10, 38, 0.75);
        border: 1px solid rgba(162, 155, 254, 0.25);
        border-radius: 14px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
    }

    .perks-summary-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.74rem;
        font-weight: 700;
        color: #a29bfe;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .perks-chip-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(95px, 1fr));
        gap: 6px;
        width: 100%;
        min-width: 0;
    }

    .perk-chip {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 5px 6px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 1px;
        min-width: 0;
    }

    .perk-chip.active {
        background: rgba(46, 204, 113, 0.1);
        border-color: rgba(46, 204, 113, 0.35);
    }

    .perk-val {
        font-size: 0.80rem;
        font-weight: 800;
        color: #2ecc71;
    }

    .perk-chip:not(.active) .perk-val {
        color: #7f8c8d;
    }

    .perk-name {
        font-size: 0.62rem;
        color: #b2bec3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
    }

    /* 4. Claim All Banner */
    .claim-all-banner {
        flex-shrink: 0;
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.2) 0%, rgba(230, 126, 34, 0.25) 100%);
        border: 1.5px solid #f1c40f;
        border-radius: 14px;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
    }

    .claim-all-text {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.80rem;
        font-weight: 700;
        color: #ffffff;
        min-width: 0;
        flex: 1;
        overflow: hidden;
    }

    .claim-all-text span:last-child {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .claim-all-badge {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #e74c3c;
        color: #ffffff;
        font-weight: 900;
        font-size: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .claim-all-btn {
        background: linear-gradient(135deg, #f1c40f 0%, #e67e22 100%);
        color: #1a0826;
        border: none;
        border-radius: 10px;
        padding: 7px 14px;
        font-size: 0.82rem;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(241, 196, 15, 0.35);
        transition: transform 0.15s ease, filter 0.15s ease;
        touch-action: manipulation;
        min-height: 38px;
    }

    .claim-all-btn:active {
        transform: scale(0.96);
    }

    /* 5. Achievements List */
    .achievements-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
    }

    .achievement-card {
        flex-shrink: 0;
        background: rgba(22, 10, 42, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 14px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        transition: border-color 0.2s ease, background 0.2s ease;
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
    }

    .achievement-card.ready-card {
        background: linear-gradient(135deg, rgba(38, 18, 68, 0.95) 0%, rgba(26, 10, 52, 0.95) 100%);
        border-color: rgba(241, 196, 15, 0.6);
        box-shadow: 0 0 15px rgba(241, 196, 15, 0.15);
    }

    .achievement-card.max-card {
        background: rgba(16, 7, 32, 0.7);
        border-color: rgba(46, 204, 113, 0.3);
        opacity: 0.9;
    }

    .ach-top-row {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        min-width: 0;
    }

    .ach-icon-box {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .ach-details {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .ach-name-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        width: 100%;
        min-width: 0;
    }

    .ach-title {
        font-size: 0.88rem;
        font-weight: 700;
        color: #ffffff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
        flex: 1;
    }

    .ach-stars-row {
        display: flex;
        align-items: center;
        gap: 2px;
        flex-shrink: 0;
    }

    .ach-star-icon {
        fill: #34495e;
        transition: fill 0.2s ease, transform 0.2s ease;
    }

    .ach-star-icon.earned {
        fill: #f1c40f;
    }

    .ach-star-icon.current-ready {
        fill: #f39c12;
        animation: starPulse 1s infinite alternate;
    }

    @keyframes starPulse {
        from { transform: scale(1); filter: drop-shadow(0 0 2px #f1c40f); }
        to { transform: scale(1.2); filter: drop-shadow(0 0 6px #f1c40f); }
    }

    .ach-desc {
        font-size: 0.72rem;
        color: #b2bec3;
        line-height: 1.25;
        min-width: 0;
    }

    /* Progress */
    .ach-progress-row {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        min-width: 0;
    }

    .ach-progress-track {
        flex: 1;
        min-width: 0;
        height: 6px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 3px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .ach-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #3498db, #9b59b6);
        border-radius: 3px;
        transition: width 0.25s ease;
    }

    .ach-progress-fill.full {
        background: linear-gradient(90deg, #f1c40f, #2ecc71);
    }

    .ach-progress-numbers {
        font-size: 0.68rem;
        font-weight: 700;
        color: #dfe6e9;
        flex-shrink: 0;
        min-width: 65px;
        text-align: right;
    }

    .ach-num-max {
        color: #2ecc71;
        font-weight: 800;
    }

    /* Rewards & Buttons */
    .ach-reward-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        margin-top: 2px;
        width: 100%;
        min-width: 0;
    }

    .ach-rewards-tags {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px;
        flex: 1;
        min-width: 0;
    }

    .reward-pill {
        font-size: 0.66rem;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 6px;
        white-space: nowrap;
    }

    .crystals-pill {
        background: rgba(52, 152, 219, 0.2);
        color: #74b9ff;
        border: 1px solid rgba(52, 152, 219, 0.4);
    }

    .stardust-pill {
        background: rgba(155, 89, 182, 0.2);
        color: #d29bf7;
        border: 1px solid rgba(155, 89, 182, 0.4);
    }

    .perk-pill {
        background: rgba(46, 204, 113, 0.15);
        color: #2ecc71;
        border: 1px solid rgba(46, 204, 113, 0.35);
    }

    .claim-ach-btn {
        background: linear-gradient(135deg, #f1c40f 0%, #e67e22 100%);
        color: #1a0826;
        border: none;
        border-radius: 10px;
        padding: 6px 14px;
        font-size: 0.80rem;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(241, 196, 15, 0.35);
        transition: transform 0.15s ease;
        touch-action: manipulation;
        flex-shrink: 0;
        min-height: 38px;
    }

    .claim-ach-btn:active {
        transform: scale(0.95);
    }

    .ach-tier-badge {
        font-size: 0.68rem;
        font-weight: 700;
        color: #a29bfe;
        background: rgba(162, 155, 254, 0.12);
        border: 1px solid rgba(162, 155, 254, 0.25);
        padding: 3px 8px;
        border-radius: 8px;
        flex-shrink: 0;
    }

    .ach-completed-banner {
        font-size: 0.72rem;
        font-weight: 800;
        color: #2ecc71;
        background: rgba(46, 204, 113, 0.12);
        border: 1px solid rgba(46, 204, 113, 0.3);
        padding: 3px 10px;
        border-radius: 8px;
    }

    .pulse {
        animation: btnPulse 1.8s infinite;
    }

    @keyframes btnPulse {
        0% { box-shadow: 0 0 0 0 rgba(241, 196, 15, 0.6); }
        70% { box-shadow: 0 0 0 8px rgba(241, 196, 15, 0); }
        100% { box-shadow: 0 0 0 0 rgba(241, 196, 15, 0); }
    }

    /* Responsive Media Queries (strictly at the end) */
    @media (max-width: 680px) {
        .hall-backdrop {
            padding: 0;
            width: 100%;
            height: 100%;
            height: 100dvh;
            max-width: 100vw;
            background: rgba(10, 4, 22, 0.98);
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            box-sizing: border-box;
        }

        .hall-window {
            width: 100%;
            max-width: 100%;
            height: 100%;
            height: 100dvh;
            max-height: 100dvh;
            border-radius: 0;
            border: none;
            background: rgba(16, 7, 32, 1);
            box-sizing: border-box;
            min-width: 0;
        }

        .hall-header {
            padding: 10px 12px;
            width: 100%;
            min-width: 0;
        }

        .hall-trophy-icon {
            width: 36px;
            height: 36px;
        }

        .hall-trophy-icon svg {
            width: 22px;
            height: 22px;
        }

        .hall-main-title {
            font-size: 0.95rem;
        }

        .hall-sub-title {
            font-size: 0.62rem;
        }

        .hall-close-btn {
            width: 40px;
            height: 40px;
        }

        .hall-scroll-body {
            padding: 10px 8px;
            gap: 8px;
            width: 100%;
            min-width: 0;
            overflow-x: hidden;
            box-sizing: border-box;
        }

        .archmage-rank-card {
            padding: 8px 10px;
            gap: 6px;
            width: 100%;
            min-width: 0;
        }

        .rank-crown-badge {
            width: 30px;
            height: 30px;
        }

        .rank-name {
            font-size: 0.90rem;
        }

        .stars-counter-badge {
            padding: 3px 8px;
        }

        .stars-text {
            font-size: 0.76rem;
        }

        .next-title-name {
            font-size: 0.68rem;
            max-width: 50%;
        }

        .perks-summary-card {
            padding: 8px 10px;
            width: 100%;
            min-width: 0;
        }

        .perks-chip-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 4px;
            width: 100%;
            min-width: 0;
        }

        .perk-val {
            font-size: 0.74rem;
        }

        .perk-name {
            font-size: 0.58rem;
        }

        .claim-all-banner {
            padding: 6px 10px;
            gap: 6px;
            width: 100%;
            min-width: 0;
        }

        .claim-all-btn {
            padding: 6px 12px;
            font-size: 0.78rem;
            flex-shrink: 0;
        }

        .achievement-card {
            padding: 8px 10px;
            gap: 6px;
            box-sizing: border-box;
            width: 100%;
            min-width: 0;
        }

        .ach-name-row {
            width: 100%;
            min-width: 0;
            gap: 4px;
        }

        .ach-reward-row {
            width: 100%;
            min-width: 0;
            gap: 6px;
            flex-wrap: wrap;
        }

        .ach-rewards-tags {
            min-width: 0;
            flex: 1;
            gap: 3px;
        }

        .ach-icon-box {
            width: 34px;
            height: 34px;
        }

        .ach-title {
            font-size: 0.82rem;
        }

        .ach-desc {
            font-size: 0.66rem;
        }

        .reward-pill {
            font-size: 0.60rem;
            padding: 2px 5px;
        }

        .claim-ach-btn {
            padding: 5px 12px;
            font-size: 0.74rem;
        }
    }
</style>
