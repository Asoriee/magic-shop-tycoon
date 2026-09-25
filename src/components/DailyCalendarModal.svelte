<script lang="ts">
    import { tick } from 'svelte';
    import gsap from 'gsap';
    import { gameStore, isVip, formatNumber, stableIdleIncome } from '../store';
    import { 
        CALENDAR_REWARDS, 
        isCalendarRewardReady, 
        claimCalendarReward, 
        type CalendarRewardItem 
    } from '../calendar';
    import { t } from '../i18n';

    export let isOpen = false;
    export let onClose: () => void;
    export let onOpenVip: (() => void) | undefined = undefined;

    let overlayEl: HTMLElement;
    let modalEl: HTMLElement;
    let claimFeedback: string | null = null;
    let feedbackTimeout: any = null;

    $: isReady = isCalendarRewardReady($gameStore);
    $: rawDay = $gameStore?.calendarDay || 1;
    $: rawSeason = $gameStore?.calendarSeason || 1;
    $: activeSeason = (rawDay > 30 && isReady) ? rawSeason + 1 : rawSeason;
    $: currentDay = (rawDay > 30 && isReady) ? 1 : rawDay;
    $: currentReward = CALENDAR_REWARDS[Math.min(29, Math.max(0, currentDay - 1))];

    $: if (isOpen) {
        tick().then(() => {
            if (overlayEl && modalEl) {
                gsap.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.25 });
                gsap.fromTo(modalEl,
                    { y: 35, opacity: 0, scale: 0.94 },
                    { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.2)' }
                );
                if (currentDay > 7) {
                    const activeWeekEl = modalEl.querySelector('.week-section.week-active');
                    if (activeWeekEl) {
                        activeWeekEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            }
        });
    }

    function close() {
        if (overlayEl && modalEl) {
            gsap.to(overlayEl, { opacity: 0, duration: 0.2 });
            gsap.to(modalEl, {
                y: 25,
                opacity: 0,
                scale: 0.95,
                duration: 0.2,
                onComplete: () => onClose()
            });
        } else {
            onClose();
        }
    }

    function handleClaim() {
        if (!isReady) return;
        const res = claimCalendarReward();
        if (res.success) {
            claimFeedback = res.rewardDesc || $t('calendar.received');
            if (modalEl) {
                gsap.fromTo(modalEl, 
                    { scale: 0.98 }, 
                    { scale: 1, duration: 0.35, ease: 'back.out(2)' }
                );
            }
            if (feedbackTimeout) clearTimeout(feedbackTimeout);
            feedbackTimeout = setTimeout(() => {
                claimFeedback = null;
            }, 3500);
        }
    }

    function getRewardLabel(reward: CalendarRewardItem, vipActive: boolean): string {
        const mult = vipActive ? 2 : 1;
        if (reward.type === 'crystals') {
            return $t('calendar.rewardCrystals', { amount: (reward.amount || 1) * mult });
        }
        if (reward.type === 'gold_seconds') {
            const idle = $stableIdleIncome || 0;
            const gold = Math.max(1000, Math.round(idle * (reward.amount || 60) * mult));
            return $t('calendar.rewardGold', { amount: formatNumber(gold) });
        }
        if (reward.type === 'chest') {
            const cType = reward.chestType || 'wooden';
            const cName = $t(`chests.${cType}`) || cType;
            return $t('calendar.rewardChest', { mult, chest: cName });
        }
        if (reward.type === 'stardust') {
            return $t('calendar.rewardDust', { amount: (reward.amount || 10) * mult });
        }
        if (reward.type === 'pet') {
            return $t('calendar.rewardOwl', { crystals: vipActive ? 40 : 20 });
        }
        if (reward.type === 'relic') {
            return $t('calendar.rewardRelic', { mult: vipActive ? ' (2x)' : '' });
        }
        return '';
    }

    const WEEKS = [
        { titleKey: 'calendar.week1', days: CALENDAR_REWARDS.slice(0, 7), milestoneKey: 'calendar.milestoneWeek1' },
        { titleKey: 'calendar.week2', days: CALENDAR_REWARDS.slice(7, 14), milestoneKey: 'calendar.milestoneWeek2' },
        { titleKey: 'calendar.week3', days: CALENDAR_REWARDS.slice(14, 21), milestoneKey: 'calendar.milestoneWeek3' },
        { titleKey: 'calendar.week4', days: CALENDAR_REWARDS.slice(21, 30), milestoneKey: 'calendar.milestoneWeek4' }
    ];

    function getWeekStats(wIdx: number, curDay: number, ready: boolean) {
        const startDay = wIdx * 7 + 1;
        const total = wIdx === 3 ? (CALENDAR_REWARDS.length - 21) : 7;
        const endDay = startDay + total - 1;
        const effectiveClaimedDay = ready ? (curDay - 1) : curDay;
        const completed = Math.max(0, Math.min(total, effectiveClaimedDay - startDay + 1));
        const isCurrentWeek = curDay >= startDay && curDay <= endDay;
        const isCompleted = completed >= total;
        const percent = Math.min(100, Math.round((completed / total) * 100));
        return { startDay, endDay, total, completed, isCurrentWeek, isCompleted, percent };
    }
</script>

{#if isOpen}
    <div 
        class="modal-overlay" 
        bind:this={overlayEl} 
        on:click|self={close}
        on:keydown={(e) => e.key === 'Escape' && close()}
        role="presentation"
    >
        <div class="calendar-modal" bind:this={modalEl} role="dialog" aria-modal="true" aria-labelledby="cal-title">
            <!-- Header -->
            <div class="modal-header">
                <div class="header-left">
                    <div class="header-icon">
                        <svg viewBox="0 0 40 40" width="32" height="32">
                            <rect x="4" y="6" width="32" height="30" rx="6" fill="#2d1b4e" stroke="#9b59b6" stroke-width="2.2"/>
                            <rect x="4" y="6" width="32" height="9" rx="3" fill="#8e44ad"/>
                            <circle cx="12" cy="4" r="2.5" fill="#f1c40f"/>
                            <circle cx="28" cy="4" r="2.5" fill="#f1c40f"/>
                            <rect x="9" y="19" width="5" height="4" rx="1" fill="#ecf0f1"/>
                            <rect x="17.5" y="19" width="5" height="4" rx="1" fill="#ecf0f1"/>
                            <rect x="26" y="19" width="5" height="4" rx="1" fill="#ecf0f1"/>
                            <rect x="9" y="26" width="5" height="4" rx="1" fill="#f1c40f"/>
                            <rect x="17.5" y="26" width="5" height="4" rx="1" fill="#ecf0f1"/>
                            <rect x="26" y="26" width="5" height="4" rx="1" fill="#00d2d3"/>
                        </svg>
                    </div>
                    <div>
                        <div class="title-with-badge">
                            <h2 id="cal-title" class="title">{$t('calendar.title')}</h2>
                            <span class="season-badge-pill">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="#ffd700">
                                    <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/>
                                </svg>
                                {$t('calendar.seasonBadge', { season: activeSeason })}
                            </span>
                        </div>
                        <p class="subtitle">
                            {$t('calendar.subtitle')}
                            {#if activeSeason > 1}
                                <span class="season-bonus-tag">({$t('calendar.seasonBonus', { percent: (activeSeason - 1) * 15 })})</span>
                            {/if}
                        </p>
                    </div>
                </div>
                <button class="close-btn" on:click={close} aria-label="{$t('common.close')}">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.2" fill="none">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>

            <!-- VIP Banner -->
            <div class="vip-banner {$isVip ? 'vip-active' : 'vip-inactive'}">
                <div class="vip-icon">
                    <svg viewBox="0 0 32 32" width="24" height="24">
                        <polygon points="16,3 20,11 29,11 22,17 25,26 16,20 7,26 10,17 3,11 12,11" fill="#f1c40f" stroke="#d4ac0d" stroke-width="1.5"/>
                    </svg>
                </div>
                <div class="vip-content">
                    {#if $isVip}
                        <div class="vip-title">{$t('calendar.vipActiveTitle')}</div>
                        <div class="vip-desc">{$t('calendar.vipActiveDesc')}</div>
                    {:else}
                        <div class="vip-title">{$t('calendar.vipPromoTitle')}</div>
                        <div class="vip-desc">{$t('calendar.vipPromoDesc')}</div>
                    {/if}
                </div>
                {#if !$isVip && onOpenVip}
                    <button class="vip-activate-btn" on:click={onOpenVip}>
                        {$t('common.vip')}
                    </button>
                {/if}
            </div>

            <!-- Feedback Toast -->
            {#if claimFeedback}
                <div class="claim-toast">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2ed573" stroke-width="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>{$t('calendar.received')}: <strong>{claimFeedback}</strong></span>
                </div>
            {/if}

            <!-- 4 Weeks Calendar Body -->
            <div class="calendar-scroll-area">
                {#each WEEKS as week, wIdx}
                    {@const stats = getWeekStats(wIdx, currentDay, isReady)}
                    <div class="week-section" class:week-active={stats.isCurrentWeek} class:week-done={stats.isCompleted}>
                        <div class="week-header">
                            <div class="week-header-left">
                                <span class="week-title">{$t(week.titleKey)}</span>
                                {#if stats.isCurrentWeek}
                                    <span class="active-week-badge">{$t('calendar.currentWeekBadge')}</span>
                                {/if}
                            </div>
                            <div class="week-header-right">
                                <span class="week-milestone-hint">
                                    <svg viewBox="0 0 24 24" width="13" height="13" fill="#ffd32a" style="vertical-align: -1px; margin-right: 2px;">
                                        <path d="M6 3h12v4c0 3.3-2.7 6-6 6s-6-2.7-6-6V3zm0 2H4c0 2.2 1.8 4 4 4h.4C7.5 8.2 6.8 6.7 6.5 5H6zm12 0h.5c-.3 1.7-1 3.2-1.9 4H17c2.2 0 4-1.8 4-4h-2zm-7 10.9V18H8v2h8v-2h-3v-2.1c3.5-.5 6-3.4 6-6.9V3H5v6c0 3.5 2.5 6.4 6 6.9z"/>
                                    </svg>
                                    {$t(week.milestoneKey)}
                                </span>
                                <span class="week-progress-pill" class:pill-done={stats.isCompleted}>
                                    {#if stats.isCompleted}
                                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#2ed573" stroke-width="3">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                        <span>{$t('calendar.weekCompleted')}</span>
                                    {:else}
                                        <span>{$t('calendar.weekProgress', { completed: stats.completed, total: stats.total })}</span>
                                    {/if}
                                </span>
                            </div>
                        </div>

                        <!-- Sleek Weekly Progress Track -->
                        <div class="week-progress-track">
                            <div class="week-progress-fill" style="width: {stats.percent}%"></div>
                        </div>

                        <div class="days-grid" class:days-grid-9={week.days.length === 9}>
                            {#each week.days as reward}
                                {@const isClaimed = reward.day < currentDay}
                                {@const isCurrentReady = reward.day === currentDay && isReady}
                                {@const isUpcoming = reward.day === currentDay && !isReady}
                                {@const isFuture = reward.day > currentDay}
                                <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
                                <div 
                                    class="day-card"
                                    class:past={isClaimed}
                                    class:current={reward.day === currentDay && isReady}
                                    class:ready={isCurrentReady}
                                    class:upcoming={isUpcoming}
                                    class:future={isFuture}
                                    class:milestone={reward.isMilestone}
                                    role={isCurrentReady ? "button" : undefined}
                                    tabindex={isCurrentReady ? 0 : undefined}
                                    on:click={() => { if (isCurrentReady) handleClaim(); }}
                                    on:keydown={(e) => { if (isCurrentReady && (e.key === 'Enter' || e.key === ' ')) handleClaim(); }}
                                >
                                    <!-- Grand Milestone Banner on 7th card of week -->
                                    {#if reward.isMilestone}
                                        <div class="milestone-ribbon-tag">
                                            <svg viewBox="0 0 24 24" width="9" height="9" fill="#ffd700">
                                                <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/>
                                            </svg>
                                            <span>{$t('calendar.superReward')}</span>
                                        </div>
                                    {/if}

                                    <!-- Day Header -->
                                    <div class="day-card-header">
                                        <span class="day-num">{$t('calendar.dayNum', { day: reward.day })}</span>
                                        {#if $isVip}
                                            <span class="vip-badge-pill">2x</span>
                                        {/if}
                                    </div>

                                    <!-- Icon -->
                                    <div class="reward-icon-wrap" class:icon-milestone={reward.isMilestone}>
                                        {#if reward.isMilestone}
                                            <div class="milestone-aura"></div>
                                        {/if}
                                        {@html reward.iconSvg}
                                    </div>

                                    <!-- Label -->
                                    <div class="reward-label" class:label-milestone={reward.isMilestone}>
                                        {getRewardLabel(reward, $isVip)}
                                    </div>

                                    <!-- Status Overlay / Stamp -->
                                    {#if isClaimed}
                                        <div class="stamp-claimed">
                                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="#2ed573" stroke-width="3" fill="none">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                            <span>{$t('calendar.claimed')}</span>
                                        </div>
                                    {:else if isCurrentReady}
                                        <div class="ready-cta-pill">
                                            <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
                                                <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/>
                                            </svg>
                                            <span>{$t('calendar.claim')}</span>
                                        </div>
                                    {:else if isUpcoming}
                                        <div class="stamp-upcoming">
                                            <svg viewBox="0 0 24 24" width="13" height="13" stroke="#ffd32a" stroke-width="2.2" fill="none">
                                                <circle cx="12" cy="12" r="9"/>
                                                <polyline points="12 7 12 12 15 14"/>
                                            </svg>
                                            <span>{$t('calendar.tomorrow')}</span>
                                        </div>
                                    {:else}
                                        <div class="stamp-locked">
                                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                            </svg>
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>

            <!-- Footer Action -->
            <div class="modal-footer">
                {#if isReady}
                    <button class="main-claim-btn" on:click={handleClaim}>
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="#ffd32a">
                            <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/>
                        </svg>
                        <span>{$t('calendar.claimToday', { day: currentDay, reward: getRewardLabel(currentReward, $isVip) })}</span>
                    </button>
                {:else}
                    <div class="already-claimed-notice">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="#2ed573" stroke-width="2" fill="none">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>{$t('calendar.alreadyClaimedToday')}</span>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        z-index: 9999;
        background: rgba(10, 8, 20, 0.82);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px;
        box-sizing: border-box;
        overflow: hidden;
    }

    .calendar-modal {
        background: linear-gradient(175deg, #1b132f 0%, #110c22 100%);
        border: 1px solid rgba(155, 89, 182, 0.35);
        border-radius: 20px;
        width: 100%;
        max-width: 820px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.65), 0 0 35px rgba(155, 89, 182, 0.2);
        overflow: hidden;
        overflow-x: hidden;
        color: #ecf0f1;
        font-family: inherit;
        box-sizing: border-box;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(0, 0, 0, 0.2);
        gap: 10px;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 14px;
        flex: 1;
        min-width: 0;
    }

    .header-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(155, 89, 182, 0.15);
        border-radius: 12px;
        padding: 6px;
        border: 1px solid rgba(155, 89, 182, 0.3);
    }

    .title {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 800;
        background: linear-gradient(90deg, #ffd32a 0%, #ff9f43 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: 0.3px;
    }

    .title-with-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .season-badge-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: rgba(255, 215, 0, 0.15);
        border: 1px solid rgba(255, 215, 0, 0.4);
        border-radius: 20px;
        padding: 2px 8px;
        font-size: 0.72rem;
        font-weight: 700;
        color: #ffd700;
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.2);
    }

    .subtitle {
        margin: 2px 0 0;
        font-size: 0.82rem;
        color: rgba(236, 240, 241, 0.7);
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
    }

    .season-bonus-tag {
        color: #2ed573;
        font-weight: 600;
        font-size: 0.78rem;
    }

    .close-btn {
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        color: #bdc3c7;
        width: 44px;
        height: 44px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
    }

    .close-btn:hover {
        background: rgba(231, 76, 60, 0.25);
        color: #ff7675;
        border-color: rgba(231, 76, 60, 0.4);
    }

    .vip-banner {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 12px 18px 4px;
        padding: 10px 14px;
        border-radius: 12px;
        overflow: hidden;
        box-sizing: border-box;
    }

    .vip-banner.vip-active {
        background: linear-gradient(90deg, rgba(241, 196, 15, 0.18) 0%, rgba(230, 126, 34, 0.18) 100%);
        border: 1px solid rgba(241, 196, 15, 0.45);
    }

    .vip-banner.vip-inactive {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .vip-content {
        flex: 1;
        min-width: 0;
        overflow: hidden;
    }

    .vip-title {
        font-weight: 700;
        font-size: 0.88rem;
        color: #ffd32a;
    }

    .vip-desc {
        font-size: 0.78rem;
        color: rgba(255, 255, 255, 0.75);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .vip-activate-btn {
        background: linear-gradient(135deg, #ffd32a 0%, #ff9f43 100%);
        color: #2c3e50;
        border: none;
        border-radius: 8px;
        font-weight: 800;
        font-size: 0.78rem;
        padding: 6px 14px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(241, 196, 15, 0.35);
        transition: transform 0.15s;
    }

    .vip-activate-btn:hover {
        transform: scale(1.04);
    }

    .claim-toast {
        margin: 6px 18px 0;
        padding: 8px 14px;
        background: rgba(46, 213, 115, 0.15);
        border: 1px solid rgba(46, 213, 115, 0.4);
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        color: #2ed573;
        animation: fadeIn 0.25s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-6px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .calendar-scroll-area {
        flex: 1;
        overflow-y: auto;
        padding: 12px 18px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        box-sizing: border-box;
        min-width: 0;
    }

    .calendar-scroll-area::-webkit-scrollbar {
        width: 4px;
    }

    .calendar-scroll-area::-webkit-scrollbar-thumb {
        background: rgba(155, 89, 182, 0.3);
        border-radius: 4px;
    }

    .week-section {
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 16px;
        padding: 12px 14px;
        transition: border-color 0.2s, box-shadow 0.2s;
        box-sizing: border-box;
        min-width: 0;
        flex-shrink: 0;
    }

    .week-section.week-active {
        border-color: rgba(241, 196, 15, 0.4);
        background: linear-gradient(180deg, rgba(241, 196, 15, 0.05) 0%, rgba(0, 0, 0, 0.3) 100%);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 14px rgba(241, 196, 15, 0.08);
    }

    .week-section.week-done {
        border-color: rgba(46, 204, 113, 0.3);
    }

    .week-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 6px;
    }

    .week-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .week-title {
        font-weight: 800;
        color: #a29bfe;
        font-size: 0.86rem;
        letter-spacing: 0.4px;
    }

    .active-week-badge {
        background: rgba(241, 196, 15, 0.15);
        border: 1px solid rgba(241, 196, 15, 0.4);
        color: #f1c40f;
        font-size: 0.65rem;
        font-weight: 800;
        padding: 1px 6px;
        border-radius: 6px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
    }

    .week-header-right {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .week-milestone-hint {
        color: #ffd32a;
        font-size: 0.74rem;
        font-weight: 600;
    }

    .week-progress-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #dcdde1;
        font-size: 0.72rem;
        font-weight: 800;
        padding: 2px 8px;
        border-radius: 8px;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .week-progress-pill.pill-done {
        background: rgba(46, 204, 113, 0.15);
        border-color: rgba(46, 204, 113, 0.4);
        color: #2ed573;
    }

    .week-progress-track {
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 10px;
    }

    .week-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #6c5ce7, #f1c40f);
        border-radius: 2px;
        transition: width 0.3s ease;
    }

    .days-grid {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 8px;
        width: 100%;
        box-sizing: border-box;
    }

    .day-card {
        position: relative;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.09);
        border-radius: 12px;
        padding: 8px 6px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        min-height: 98px;
        min-width: 0;
        box-sizing: border-box;
        overflow: hidden;
        transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
    }

    .day-card.milestone {
        background: linear-gradient(160deg, rgba(108, 92, 231, 0.22) 0%, rgba(241, 196, 15, 0.18) 100%);
        border: 1.5px solid rgba(241, 196, 15, 0.55);
        box-shadow: 0 0 16px rgba(241, 196, 15, 0.2);
    }

    .milestone-ribbon-tag {
        position: absolute;
        top: -6px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #d35400, #f1c40f);
        color: #1a0a2a;
        font-size: 0.54rem;
        font-weight: 900;
        letter-spacing: 0.3px;
        padding: 1px 6px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 3px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        white-space: nowrap;
        z-index: 4;
    }

    .reward-icon-wrap.icon-milestone {
        position: relative;
    }

    .milestone-aura {
        position: absolute;
        inset: -4px;
        background: radial-gradient(circle, rgba(241, 196, 15, 0.35) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        animation: pulseAura 2.2s infinite ease-in-out;
    }

    @keyframes pulseAura {
        0%, 100% { transform: scale(0.9); opacity: 0.6; }
        50% { transform: scale(1.15); opacity: 1; }
    }

    .label-milestone {
        color: #ffeaa7;
        font-weight: 800;
        text-shadow: 0 0 8px rgba(241, 196, 15, 0.4);
    }

    .day-card.current.ready {
        border-color: #ffd32a;
        background: linear-gradient(160deg, rgba(241, 196, 15, 0.22) 0%, rgba(230, 126, 34, 0.15) 100%);
        box-shadow: 0 0 18px rgba(241, 196, 15, 0.35);
        animation: pulseReady 2s infinite ease-in-out;
    }

    @keyframes pulseReady {
        0%, 100% { transform: scale(1); box-shadow: 0 0 14px rgba(241, 196, 15, 0.3); }
        50% { transform: scale(1.02); box-shadow: 0 0 22px rgba(241, 196, 15, 0.6); }
    }

    .day-card.past {
        opacity: 0.65;
        background: rgba(0, 0, 0, 0.28);
    }

    .day-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        margin-bottom: 4px;
        font-size: 0.72rem;
        font-weight: 700;
        color: rgba(236, 240, 241, 0.7);
    }

    .vip-badge-pill {
        background: #ffd32a;
        color: #2c3e50;
        border-radius: 4px;
        padding: 1px 4px;
        font-size: 0.64rem;
        font-weight: 900;
    }

    .reward-icon-wrap {
        margin: 2px 0 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 38px;
    }

    .reward-label {
        font-size: 0.72rem;
        font-weight: 700;
        color: #ecf0f1;
        line-height: 1.15;
        margin-top: auto;
    }

    .stamp-claimed {
        display: flex;
        align-items: center;
        gap: 3px;
        font-size: 0.65rem;
        color: #2ed573;
        font-weight: 700;
        margin-top: 4px;
    }

    .day-card.upcoming {
        border-color: rgba(241, 196, 15, 0.4);
        background: rgba(241, 196, 15, 0.06);
    }

    .stamp-upcoming {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.65rem;
        color: #ffd32a;
        font-weight: 700;
        margin-top: 4px;
        background: rgba(241, 196, 15, 0.12);
        padding: 2px 6px;
        border-radius: 6px;
        border: 1px solid rgba(241, 196, 15, 0.25);
    }

    .stamp-locked {
        color: rgba(255, 255, 255, 0.3);
        margin-top: 4px;
    }

    .ready-cta-pill {
        margin-top: 4px;
        background: linear-gradient(135deg, #ffd32a 0%, #ff9f43 100%);
        color: #2c3e50;
        border-radius: 6px;
        font-size: 0.68rem;
        font-weight: 800;
        padding: 3px 8px;
        box-shadow: 0 2px 8px rgba(241, 196, 15, 0.4);
        display: inline-flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
        animation: pulseReadyPill 1.8s infinite ease-in-out;
    }

    @keyframes pulseReadyPill {
        0%, 100% { transform: scale(1); filter: brightness(1); }
        50% { transform: scale(1.04); filter: brightness(1.15); }
    }

    .modal-footer {
        padding: 14px 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(0, 0, 0, 0.25);
        display: flex;
        justify-content: center;
    }

    .main-claim-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        background: linear-gradient(135deg, #ffd32a 0%, #ff9f43 100%);
        color: #2c3e50;
        border: none;
        border-radius: 12px;
        padding: 12px 28px;
        font-size: 0.95rem;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(241, 196, 15, 0.4);
        transition: transform 0.15s, box-shadow 0.15s;
    }

    .main-claim-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(241, 196, 15, 0.55);
    }

    .already-claimed-notice {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        color: rgba(236, 240, 241, 0.7);
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 10px;
    }

    @media (max-width: 768px) {
        .days-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 7px;
        }
        .day-card.milestone {
            grid-column: span 2;
        }
    }

    @media (max-width: 500px) {
        .modal-overlay {
            padding: 8px 6px;
            box-sizing: border-box;
            overflow-x: hidden;
        }
        .calendar-modal {
            max-height: 94vh;
            border-radius: 16px;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            overflow-x: hidden;
        }
        .modal-header {
            padding: 10px 12px;
            gap: 8px;
            box-sizing: border-box;
            max-width: 100%;
        }
        .header-left {
            gap: 8px;
            flex: 1;
            min-width: 0;
            overflow: hidden;
        }
        .header-icon {
            padding: 4px;
            border-radius: 10px;
            flex-shrink: 0;
        }
        .header-icon svg {
            width: 26px;
            height: 26px;
        }
        .title {
            font-size: 1.05rem;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .title-with-badge {
            gap: 6px;
            flex-wrap: wrap;
            min-width: 0;
        }
        .season-badge-pill {
            font-size: 0.62rem;
            padding: 1px 6px;
            flex-shrink: 0;
            white-space: nowrap;
        }
        .subtitle {
            font-size: 0.7rem;
            margin-top: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .close-btn {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            flex-shrink: 0;
        }
        .vip-banner {
            margin: 6px 8px 2px;
            padding: 8px 10px;
            gap: 8px;
            box-sizing: border-box;
            max-width: calc(100% - 16px);
        }
        .vip-icon {
            flex-shrink: 0;
        }
        .vip-content {
            flex: 1;
            min-width: 0;
        }
        .vip-title {
            font-size: 0.78rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .vip-desc {
            font-size: 0.68rem;
            line-height: 1.2;
        }
        .vip-activate-btn {
            padding: 5px 8px;
            font-size: 0.7rem;
            flex-shrink: 0;
        }
        .calendar-scroll-area {
            padding: 6px 8px;
            gap: 10px;
            box-sizing: border-box;
            overflow-x: hidden;
            scrollbar-width: none; /* Firefox */
        }
        .calendar-scroll-area::-webkit-scrollbar {
            display: none; /* Chrome/Safari */
        }
        .week-section {
            padding: 8px;
            border-radius: 14px;
            box-sizing: border-box;
            max-width: 100%;
            flex-shrink: 0;
        }
        .week-header {
            gap: 4px;
            margin-bottom: 5px;
            flex-wrap: wrap;
        }
        .week-header-left {
            gap: 6px;
            flex: 1;
            min-width: 0;
        }
        .week-title {
            font-size: 0.78rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .active-week-badge {
            font-size: 0.62rem;
            padding: 1px 5px;
            flex-shrink: 0;
        }
        .week-header-right {
            gap: 4px;
            flex-shrink: 0;
        }
        .week-milestone-hint {
            display: none;
        }
        .week-progress-pill {
            font-size: 0.64rem;
            padding: 1px 6px;
            flex-shrink: 0;
        }
        .days-grid {
            display: grid;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 5px;
            width: 100%;
            box-sizing: border-box;
        }
        .day-card {
            grid-column: span 2;
            min-height: 86px;
            padding: 5px 3px;
            border-radius: 10px;
            min-width: 0;
            box-sizing: border-box;
            overflow: hidden;
        }
        .days-grid-9 .day-card:nth-child(7),
        .days-grid-9 .day-card:nth-child(8) {
            grid-column: span 3;
            min-width: 0;
        }
        .day-card.milestone {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: auto minmax(0, 1fr) auto;
            grid-template-rows: auto auto;
            align-items: center;
            gap: 2px 8px;
            padding: 8px 10px;
            min-height: 58px;
            text-align: left;
            min-width: 0;
            box-sizing: border-box;
            max-width: 100%;
            overflow: hidden;
        }
        .day-card.milestone .reward-icon-wrap {
            grid-column: 1;
            grid-row: 1 / span 2;
            margin: 0;
            height: 36px;
            flex-shrink: 0;
        }
        .day-card.milestone .day-card-header {
            grid-column: 2;
            grid-row: 1;
            justify-content: flex-start;
            gap: 6px;
            margin-bottom: 0;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .day-card.milestone .reward-label {
            grid-column: 2;
            grid-row: 2;
            margin-top: 0;
            font-size: 0.74rem;
            line-height: 1.2;
            text-align: left;
            min-width: 0;
            word-break: break-word;
        }
        .day-card.milestone .stamp-claimed,
        .day-card.milestone .ready-cta-pill,
        .day-card.milestone .stamp-upcoming,
        .day-card.milestone .stamp-locked {
            grid-column: 3;
            grid-row: 1 / span 2;
            margin-top: 0;
            align-self: center;
            flex-shrink: 0;
        }
        .day-card.milestone .milestone-ribbon-tag {
            top: -6px;
            left: 10px;
            transform: none;
            font-size: 0.52rem;
            padding: 1px 5px;
        }
        .day-card-header {
            font-size: 0.66rem;
            margin-bottom: 2px;
            min-width: 0;
            max-width: 100%;
        }
        .reward-icon-wrap {
            height: 30px;
            margin: 1px 0 2px;
        }
        .reward-icon-wrap :global(svg) {
            width: 26px;
            height: 26px;
        }
        .reward-label {
            font-size: 0.66rem;
            line-height: 1.15;
            word-break: break-word;
            max-width: 100%;
            overflow: hidden;
        }
        .ready-cta-pill {
            font-size: 0.6rem;
            padding: 2px 5px;
            max-width: 100%;
            white-space: nowrap;
        }
        .stamp-claimed {
            font-size: 0.58rem;
        }
        .stamp-upcoming {
            font-size: 0.58rem;
            padding: 1px 4px;
        }
        .modal-footer {
            padding: 8px 10px;
            box-sizing: border-box;
            max-width: 100%;
        }
        .main-claim-btn {
            width: 100%;
            max-width: 100%;
            padding: 10px 14px;
            font-size: 0.84rem;
            border-radius: 11px;
            justify-content: center;
            box-sizing: border-box;
            gap: 6px;
        }
        .main-claim-btn svg {
            flex-shrink: 0;
            width: 18px;
            height: 18px;
        }
        .main-claim-btn span {
            white-space: normal;
            text-align: center;
            line-height: 1.2;
            flex: 1;
            min-width: 0;
        }
        .already-claimed-notice {
            width: 100%;
            justify-content: center;
            font-size: 0.78rem;
            padding: 8px 10px;
            box-sizing: border-box;
        }
    }

    @media (max-width: 400px) {
        .modal-overlay {
            padding: 4px 3px;
        }
        .calendar-scroll-area {
            padding: 5px 4px;
        }
        .week-section {
            padding: 6px 4px;
            flex-shrink: 0;
        }
        .week-header-right {
            display: none;
        }
        .days-grid {
            gap: 4px;
        }
    }

    @media (max-width: 360px) {
        .modal-overlay {
            padding: 4px 2px;
        }
        .title {
            font-size: 1.0rem;
        }
        .calendar-scroll-area {
            padding: 4px 4px;
        }
        .week-section {
            padding: 5px 3px;
            flex-shrink: 0;
        }
        .days-grid {
            gap: 4px;
        }
        .day-card {
            min-height: 80px;
            padding: 4px 2px;
        }
        .reward-icon-wrap :global(svg) {
            width: 24px;
            height: 24px;
        }
        .reward-label {
            font-size: 0.64rem;
        }
        .day-card-header {
            font-size: 0.64rem;
        }
        .day-card.milestone {
            padding: 8px 10px;
            gap: 2px 8px;
        }
        .day-card.milestone .reward-label {
            font-size: 0.74rem;
        }
    }
</style>


