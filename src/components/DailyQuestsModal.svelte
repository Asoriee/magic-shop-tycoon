<script lang="ts">
    import { onMount, onDestroy, tick } from 'svelte';
    import { 
        gameStore, 
        crystals, 
        currentIdleIncome, 
        calculateQuestGoldReward, 
        formatNumber, 
        type QuestType, 
        type QuestDifficulty 
    } from '../store';
    import { saveGame } from '../yandex-sdk';
    import gsap from 'gsap';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void = () => {};

    let overlayEl: HTMLElement;
    let modalEl: HTMLElement;
    
    let progressBars: Record<string, HTMLElement> = {};
    let claimButtons: Record<string, HTMLElement> = {};

    let timeToMidnight = '';
    let clockInterval: any;

    function updateTimeToMidnight() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const diffMs = midnight.getTime() - now.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
        timeToMidnight = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    onMount(() => {
        updateTimeToMidnight();
        clockInterval = setInterval(updateTimeToMidnight, 1000);
    });

    onDestroy(() => {
        if (clockInterval) clearInterval(clockInterval);
    });

    $: if (isOpen) {
        tick().then(() => {
            if (overlayEl && modalEl && !isEmbedded) {
                gsap.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.3 });
                gsap.fromTo(modalEl, { y: 50, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.2)' });
            }
            // Animate progress bars on open
            if ($gameStore && Array.isArray($gameStore.quests)) {
                $gameStore.quests.forEach(q => {
                    const bar = progressBars[q.id];
                    if (bar) {
                        const target = q.target > 0 ? q.target : 1;
                        const width = Math.min(100, ((q.current || 0) / target) * 100);
                        gsap.fromTo(bar, { width: 0 }, { width: `${width}%`, duration: 0.5, ease: 'power2.out' });
                    }
                });
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

    function claim(id: string) {
        const btn = claimButtons[id];
        if (btn) {
            gsap.to(btn, {
                scale: 1.25,
                opacity: 0,
                duration: 0.25,
                ease: 'power1.out',
                onComplete: () => {
                    gameStore.claimQuest(id);
                    saveGame();
                }
            });
        } else {
            gameStore.claimQuest(id);
            saveGame();
        }
    }

    function claimDailyMastery() {
        gameStore.claimDailyBonus();
        saveGame();
    }

    const typeLabels: Record<QuestType, string> = {
        'clicks': 'Сварить зелий кликом',
        'buy_upgrades': 'Купить улучшений в лавке',
        'send_expeditions': 'Отправить фамильяров в поход',
        'brew_potions': 'Сварить зелий в алхимии',
        'complete_orders': 'Выполнить заказы жителей',
        'watch_ads': 'Посмотреть видения в шаре'
    };

    const difficultyLabels: Record<QuestDifficulty, string> = {
        'easy': 'Легкий',
        'medium': 'Средний',
        'hard': 'Сложный'
    };

    $: completedCount = $gameStore.quests.filter(q => q.isClaimed).length;
    $: totalQuests = $gameStore.quests.length;
    $: isAllClaimed = totalQuests >= 5 && completedCount >= totalQuests;
</script>

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" class:embedded={isEmbedded} bind:this={overlayEl} on:click={close}>
    <div class="modal" class:embedded-modal={isEmbedded} bind:this={modalEl} on:click|stopPropagation>
        {#if !isEmbedded}
            <div class="tab-header">
                <div class="tab-title-row">
                    <div class="header-icon">
                        <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                            <path d="M7 6 C7 4 10 4 10 6 L10 24 C10 26 7 26 7 24 Z" fill="#e67e22" stroke="#d35400" stroke-width="1.5"/>
                            <path d="M10 5 L24 5 C26 5 27 6 27 8 L27 22 C27 24 25 25 23 25 L10 25 Z" fill="#f5cd79" stroke="#d35400" stroke-width="1.5"/>
                            <line x1="13" y1="10" x2="23" y2="10" stroke="#d35400" stroke-width="1.5" stroke-linecap="round"/>
                            <line x1="13" y1="14" x2="23" y2="14" stroke="#d35400" stroke-width="1.5" stroke-linecap="round"/>
                            <line x1="13" y1="18" x2="19" y2="18" stroke="#d35400" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <h2 class="tab-title">Ежедневные Контракты</h2>
                </div>
                <p class="header-sub">Выполняйте поручения Гильдии для получения Золота, Пыли и Алмазов</p>

                <div class="balance-row">
                    <div class="balance-chip stardust">
                        <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                            <polygon points="8,1 10,5 15,6 11,10 12,15 8,12 4,15 5,10 1,6 6,5" fill="#a29bfe" stroke="#6c5ce7" stroke-width="1"/>
                        </svg>
                        <span>{formatNumber($gameStore?.stardust ?? 0)}</span>
                    </div>
                    <div class="balance-chip crystals">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="#74b9ff">
                            <polygon points="12,2 21,9 12,22 3,9"/>
                        </svg>
                        <span>{formatNumber($crystals ?? 0)}</span>
                    </div>
                </div>

                <button class="close-btn" on:click={close}>✕</button>
            </div>
        {/if}

        <!-- Guild reset countdown header banner -->
        <div class="guild-banner">
            <div class="banner-left">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                    <path d="M12 2 L19 6 V12 C19 17 15 21 12 22 C9 21 5 17 5 12 V6 Z" fill="#6c5ce7" opacity="0.3" stroke="#a29bfe" stroke-width="1.5"/>
                    <path d="M12 6 L12 18 M8 10 L16 10" stroke="#f1c40f" stroke-width="1.5"/>
                </svg>
                <div class="banner-text">
                    <span class="banner-title">Контракты Гильдии Искателей</span>
                    <span class="banner-sub">Обновление заданий через: <strong class="timer-text">{timeToMidnight}</strong></span>
                </div>
            </div>
            <div class="completed-summary">
                {$gameStore.quests.filter(q => q.isClaimed).length} / {$gameStore.quests.length}
            </div>
        </div>
        
        <!-- Daily Mastery Card -->
        <div class="mastery-card" class:mastery-ready={isAllClaimed && !$gameStore.dailyBonusClaimed} class:mastery-claimed={$gameStore.dailyBonusClaimed}>
            <div class="mastery-icon-box">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                    <rect x="3" y="8" width="18" height="12" rx="3" fill="#f1c40f" opacity="0.2" stroke="#f1c40f" stroke-width="1.8"/>
                    <path d="M7 8 V5 C7 3.5 17 3.5 17 5 V8" stroke="#f39c12" stroke-width="1.8"/>
                    <polygon points="12,11 13.5,14 17,14.5 14.5,17 15,20.5 12,19 9,20.5 9.5,17 7,14.5 10.5,14" fill="#f1c40f"/>
                </svg>
            </div>
            <div class="mastery-details">
                <div class="mastery-top">
                    <span class="mastery-name">Ларец Мастера Дня</span>
                    <span class="mastery-counter">{completedCount} / {totalQuests}</span>
                </div>
                <div class="mastery-sub">
                    {#if $gameStore.dailyBonusClaimed}
                        Награда дня успешно получена! Новые контракты завтра.
                    {:else}
                        Выполните все {totalQuests} контрактов дня и получите супер-приз!
                    {/if}
                </div>
            </div>
            <div class="mastery-action">
                {#if $gameStore.dailyBonusClaimed}
                    <div class="claimed-pill">
                        <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
                            <polyline points="3,8 6,11 13,4" stroke="#2ecc71" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Получено</span>
                    </div>
                {:else if isAllClaimed}
                    <button class="mastery-claim-btn" on:click={claimDailyMastery}>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="#74b9ff">
                            <polygon points="12,2 21,9 12,22 3,9"/>
                        </svg>
                        <span>Забрать (+10 крист.)</span>
                    </button>
                {:else}
                    <div class="mastery-reward-tag">
                        <span class="m-loot" title="Кристаллы">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="#74b9ff">
                                <polygon points="12,2 21,9 12,22 3,9"/>
                            </svg>
                            +10
                        </span>
                        <span class="m-loot" title="Звёздная Пыль">
                            <svg viewBox="0 0 16 16" width="11" height="11" fill="none">
                                <polygon points="8,1 10,5 15,6 11,10 12,15 8,12 4,15 5,10 1,6 6,5" fill="#a29bfe" stroke="#6c5ce7" stroke-width="1"/>
                            </svg>
                            +10
                        </span>
                    </div>
                {/if}
            </div>
        </div>
        
        <div class="quests-list">
            {#each $gameStore.quests as quest (quest.id)}
                <div class="quest-card" class:completed={quest.isCompleted && !quest.isClaimed} class:claimed={quest.isClaimed}>
                    <div class="quest-icon-col">
                        {#if quest.type === 'clicks'}
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                                <circle cx="12" cy="12" r="9" stroke="#74b9ff" stroke-width="1.5" stroke-dasharray="3 3"/>
                                <polygon points="13,3 6,13 12,13 11,21 18,11 12,11" fill="#74b9ff"/>
                            </svg>
                        {:else if quest.type === 'buy_upgrades'}
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                                <rect x="5" y="8" width="14" height="13" rx="3" fill="#fdcb6e" stroke="#e67e22" stroke-width="1.5"/>
                                <path d="M9 8 V5 C9 3.5 15 3.5 15 5 V8" stroke="#f39c12" stroke-width="1.5"/>
                                <polygon points="12,11 13.5,14 17,14.5 14.5,17 15,20.5 12,19 9,20.5 9.5,17 7,14.5 10.5,14" fill="#d35400"/>
                            </svg>
                        {:else if quest.type === 'brew_potions'}
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#2ed573" stroke-width="1.8">
                                <path d="M9 3h6M10 3v5l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/>
                                <circle cx="12" cy="15" r="2" fill="#2ed573"/>
                            </svg>
                        {:else if quest.type === 'complete_orders'}
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#00cec9" stroke-width="1.8">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10 9 9 9 8 9"/>
                            </svg>
                        {:else if quest.type === 'send_expeditions'}
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#e17055" stroke-width="1.8">
                                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                            </svg>
                        {:else}
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                                <circle cx="12" cy="12" r="9" fill="#a29bfe" opacity="0.3" stroke="#6c5ce7" stroke-width="1.5"/>
                                <polygon points="10,8 16,12 10,16" fill="#f1c40f"/>
                            </svg>
                        {/if}
                    </div>

                    <div class="quest-main-col">
                        <div class="quest-header-row">
                            <div class="title-with-diff">
                                <span class="diff-badge diff-{quest.difficulty || 'medium'}">{difficultyLabels[quest.difficulty || 'medium']}</span>
                                <span class="quest-title">{typeLabels[quest.type] || 'Задание'}: {quest.target}</span>
                            </div>
                            {#if quest.rewardType === 'gold'}
                                {@const dynGold = calculateQuestGoldReward(quest.rewardAmount || 150)}
                                <div class="reward-pill gold-pill" title="Золото от дохода лавки">
                                    <svg viewBox="0 0 24 24" width="13" height="13" fill="#f1c40f">
                                        <circle cx="12" cy="12" r="9"/>
                                        <text x="12" y="16" font-size="11" font-weight="900" fill="#1e1035" text-anchor="middle">G</text>
                                    </svg>
                                    <span>+{formatNumber(dynGold || 3000)}</span>
                                </div>
                            {:else if quest.rewardType === 'crystals'}
                                <div class="reward-pill crystal-pill" title="Алмазы">
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="#74b9ff">
                                        <polygon points="12,2 21,9 12,22 3,9"/>
                                    </svg>
                                    <span>+{quest.rewardAmount || 10}</span>
                                </div>
                            {:else}
                                <div class="reward-pill stardust-pill" title="Звёздная пыль">
                                    <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
                                        <polygon points="8,1 10,5 15,6 11,10 12,15 8,12 4,15 5,10 1,6 6,5" fill="#a29bfe" stroke="#6c5ce7" stroke-width="1"/>
                                    </svg>
                                    <span>+{quest.rewardAmount || quest.reward || 8}</span>
                                </div>
                            {/if}
                        </div>
                        
                        <div class="progress-wrap">
                            <div class="progress-bar-bg">
                                <div 
                                    class="progress-bar-fill" 
                                    bind:this={progressBars[quest.id]}
                                    style="width: {Math.min(100, ((quest.current || 0) / (quest.target || 1)) * 100)}%"
                                ></div>
                            </div>
                            <span class="progress-label">
                                {Math.min(quest.current || 0, quest.target || 0)} / {quest.target || 0}
                            </span>
                        </div>
                    </div>

                    <div class="quest-action-col">
                        {#if quest.isClaimed}
                            <div class="claimed-pill">
                                <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                                    <polyline points="3,8 6,11 13,4" stroke="#2ecc71" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <span>Сдано</span>
                            </div>
                        {:else if quest.isCompleted}
                            <button 
                                type="button"
                                class="claim-btn" 
                                bind:this={claimButtons[quest.id]}
                                on:click={() => claim(quest.id)}
                            >
                                <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
                                    <polygon points="8,1 10,5 15,6 11,10 12,15 8,12 4,15 5,10 1,6 6,5"/>
                                </svg>
                                <span>Забрать</span>
                            </button>
                        {:else}
                            <div class="in-progress-pill">
                                В процессе
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}

            {#if $gameStore.quests.length === 0}
                <div class="empty-quests-card">
                    <p>Все контракты выполнены! Возвращайтесь завтра за новыми поручениями.</p>
                </div>
            {/if}
        </div>
    </div>
</div>
{/if}

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(8, 5, 18, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(8px);
        padding: 16px;
        box-sizing: border-box;
    }

    .modal {
        background: linear-gradient(160deg, #1a0a2e 0%, #150826 40%, #0d041a 100%);
        border: 2px solid rgba(162, 155, 254, 0.35);
        border-radius: 24px;
        box-shadow: 0 0 50px rgba(162, 155, 254, 0.25);
        width: 100%;
        max-width: 580px;
        max-height: 88vh;
        overflow-y: auto;
        color: white;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        box-sizing: border-box;
    }

    .embedded {
        position: relative;
        background: transparent;
        backdrop-filter: none;
        padding: 0;
        inset: auto;
        z-index: 1;
        width: 100%;
    }

    .embedded-modal {
        box-shadow: none;
        border: none;
        border-radius: 0;
        width: 100%;
        max-width: none;
        max-height: none;
        background: transparent;
        padding: 0;
    }

    /* Guild banner */
    .guild-banner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, rgba(108, 92, 231, 0.15) 0%, rgba(162, 155, 254, 0.05) 100%);
        border: 1px solid rgba(162, 155, 254, 0.25);
        border-radius: 14px;
        padding: 10px 14px;
        box-sizing: border-box;
    }

    .banner-left {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .banner-text {
        display: flex;
        flex-direction: column;
    }

    .banner-title {
        font-size: 0.9rem;
        font-weight: 700;
        color: #d2a8ff;
    }

    .banner-sub {
        font-size: 0.76rem;
        color: rgba(255, 255, 255, 0.65);
    }

    .timer-text {
        color: #ffeaa7;
        font-family: monospace;
        font-size: 0.82rem;
    }

    .completed-summary {
        background: rgba(0, 0, 0, 0.45);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 0.82rem;
        font-weight: 700;
        color: #f1c40f;
    }

    /* Daily Mastery Card */
    .mastery-card {
        display: flex;
        align-items: center;
        gap: 12px;
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.08) 0%, rgba(108, 92, 231, 0.08) 100%);
        border: 1.5px solid rgba(241, 196, 15, 0.25);
        border-radius: 16px;
        padding: 12px 14px;
        box-sizing: border-box;
        transition: all 0.25s;
    }

    .mastery-card.mastery-ready {
        border-color: rgba(241, 196, 15, 0.7);
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.2) 0%, rgba(108, 92, 231, 0.15) 100%);
        box-shadow: 0 0 20px rgba(241, 196, 15, 0.25);
    }

    .mastery-card.mastery-claimed {
        opacity: 0.65;
        border-color: rgba(255, 255, 255, 0.08);
    }

    .mastery-icon-box {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: rgba(241, 196, 15, 0.1);
        border: 1px solid rgba(241, 196, 15, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .mastery-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
    }

    .mastery-top {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .mastery-name {
        font-size: 0.95rem;
        font-weight: 800;
        color: #f1c40f;
    }

    .mastery-counter {
        font-size: 0.76rem;
        font-weight: 800;
        color: #d2a8ff;
        background: rgba(0, 0, 0, 0.35);
        padding: 1px 7px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .mastery-sub {
        font-size: 0.76rem;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.3;
    }

    .mastery-action {
        flex-shrink: 0;
    }

    .mastery-claim-btn {
        background: linear-gradient(135deg, #f1c40f 0%, #e67e22 100%);
        color: #1e1035;
        border: none;
        border-radius: 10px;
        padding: 8px 14px;
        font-size: 0.82rem;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 3px 0 #b7791f, 0 4px 14px rgba(241, 196, 15, 0.45);
        transition: all 0.2s;
    }

    .mastery-claim-btn:hover {
        transform: scale(1.05);
        filter: brightness(1.1);
    }

    .mastery-claim-btn:active {
        transform: translateY(2px);
        box-shadow: 0 1px 0 #b7791f;
    }

    .mastery-reward-tag {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 4px 8px;
        border-radius: 10px;
    }

    .m-loot {
        display: flex;
        align-items: center;
        gap: 3px;
        font-size: 0.76rem;
        font-weight: 800;
        color: #ffffff;
    }

    /* Balance Chips */
    .balance-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
    }

    .balance-chip {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 10px;
        font-size: 0.82rem;
        font-weight: 700;
    }

    .balance-chip.stardust {
        background: rgba(162, 155, 254, 0.12);
        border: 1px solid rgba(162, 155, 254, 0.35);
        color: #d2a8ff;
    }

    .balance-chip.crystals {
        background: rgba(116, 185, 255, 0.12);
        border: 1px solid rgba(116, 185, 255, 0.35);
        color: #74b9ff;
    }

    /* Quests List */
    .quests-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
        box-sizing: border-box;
    }

    .quest-card {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%);
        border: 1.5px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 12px 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.2s;
        box-sizing: border-box;
    }

    .quest-card.completed {
        border-color: rgba(241, 196, 15, 0.45);
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%);
        box-shadow: 0 0 16px rgba(241, 196, 15, 0.15);
    }

    .quest-card.claimed {
        opacity: 0.55;
    }

    .quest-icon-col {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .quest-main-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    .quest-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
    }

    .title-with-diff {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        flex: 1;
    }

    .diff-badge {
        font-size: 0.64rem;
        font-weight: 800;
        padding: 1px 6px;
        border-radius: 6px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        flex-shrink: 0;
    }

    .diff-easy {
        background: rgba(46, 213, 115, 0.15);
        color: #2ed573;
        border: 1px solid rgba(46, 213, 115, 0.35);
    }

    .diff-medium {
        background: rgba(162, 155, 254, 0.15);
        color: #a29bfe;
        border: 1px solid rgba(162, 155, 254, 0.35);
    }

    .diff-hard {
        background: rgba(241, 196, 15, 0.15);
        color: #f1c40f;
        border: 1px solid rgba(241, 196, 15, 0.4);
        box-shadow: 0 0 8px rgba(241, 196, 15, 0.2);
    }

    .quest-title {
        font-size: 0.92rem;
        font-weight: 700;
        color: #ffffff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .reward-pill {
        display: flex;
        align-items: center;
        gap: 4px;
        background: rgba(162, 155, 254, 0.15);
        border: 1px solid rgba(162, 155, 254, 0.3);
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 0.78rem;
        font-weight: 700;
        color: #d2a8ff;
        flex-shrink: 0;
    }

    .reward-pill.gold-pill {
        background: rgba(241, 196, 15, 0.12);
        border-color: rgba(241, 196, 15, 0.35);
        color: #f1c40f;
    }

    .reward-pill.crystal-pill {
        background: rgba(116, 185, 255, 0.12);
        border-color: rgba(116, 185, 255, 0.35);
        color: #74b9ff;
    }

    .reward-pill.stardust-pill {
        background: rgba(162, 155, 254, 0.12);
        border-color: rgba(162, 155, 254, 0.35);
        color: #d2a8ff;
    }

    .progress-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .progress-bar-bg {
        flex: 1;
        height: 7px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 5px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .progress-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #3498db, #00cec9);
        border-radius: 5px;
        transition: width 0.3s ease-out;
    }

    .completed .progress-bar-fill {
        background: linear-gradient(90deg, #f1c40f, #2ecc71);
    }

    .progress-label {
        font-size: 0.76rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.75);
        min-width: 55px;
        text-align: right;
    }

    .quest-action-col {
        flex-shrink: 0;
    }

    .claim-btn {
        background: linear-gradient(135deg, #f1c40f 0%, #f39c12 100%);
        color: #1e1035;
        border: none;
        border-radius: 10px;
        padding: 8px 14px;
        font-size: 0.84rem;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
        box-shadow: 0 3px 0 #b7791f, 0 4px 12px rgba(241, 196, 15, 0.4);
        transition: all 0.2s;
    }

    .claim-btn:hover {
        filter: brightness(1.1);
        transform: scale(1.04);
    }

    .claim-btn:active {
        transform: translateY(2px);
        box-shadow: 0 1px 0 #b7791f;
    }

    .claimed-pill {
        display: flex;
        align-items: center;
        gap: 5px;
        color: #2ecc71;
        font-size: 0.8rem;
        font-weight: 700;
        padding: 6px 10px;
        background: rgba(46, 204, 113, 0.1);
        border-radius: 10px;
        border: 1px solid rgba(46, 204, 113, 0.25);
    }

    .in-progress-pill {
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.78rem;
        font-weight: 600;
        padding: 6px 10px;
    }

    .empty-quests-card {
        text-align: center;
        padding: 30px;
        color: rgba(255, 255, 255, 0.6);
        background: rgba(0, 0, 0, 0.25);
        border-radius: 14px;
        border: 1px dashed rgba(255, 255, 255, 0.1);
    }
</style>
