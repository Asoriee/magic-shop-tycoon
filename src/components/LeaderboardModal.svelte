<script lang="ts">
    import { onMount } from 'svelte';
    import { gameStore, formatNumber } from '../store';
    import { getLeaderboardEntries, type LeaderboardEntry } from '../yandex-sdk';
    import ResourceIcon from './ResourceIcon.svelte';
    import { t } from '../i18n';

    export let isOpen = false;
    export let onClose: () => void;

    let isLoading = true;
    let entries: LeaderboardEntry[] = [];
    let userEntry: LeaderboardEntry | null = null;
    let errorMessage: string | null = null;

    async function loadLeaderboard() {
        isLoading = true;
        errorMessage = null;
        try {
            const res = await getLeaderboardEntries(10);
            entries = res.entries;
            userEntry = res.userEntry;
        } catch (e) {
            console.error('Failed to load leaderboard', e);
            errorMessage = 'Не удалось загрузить таблицу лидеров';
        } finally {
            isLoading = false;
        }
    }

    $: if (isOpen) {
        loadLeaderboard();
    }
</script>

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key-events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" on:click={onClose}>
    <!-- svelte-ignore a11y_click_events_have_key-events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal" on:click|stopPropagation>
        <!-- Header -->
        <div class="modal-header">
            <div class="header-icon-trophy">
                <svg viewBox="0 0 32 32" width="32" height="32" fill="none">
                    <defs>
                        <linearGradient id="trophyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#ffd700"/>
                            <stop offset="50%" stop-color="#f39c12"/>
                            <stop offset="100%" stop-color="#d35400"/>
                        </linearGradient>
                    </defs>
                    <path d="M9 4 L23 4 C23 4 24 16 16 19 C8 16 9 4 9 4 Z" fill="url(#trophyGrad)" stroke="#f1c40f" stroke-width="1.5"/>
                    <path d="M9 7 C4 7 4 14 9 14" stroke="#f1c40f" stroke-width="2" fill="none" stroke-linecap="round"/>
                    <path d="M23 7 C28 7 28 14 23 14" stroke="#f1c40f" stroke-width="2" fill="none" stroke-linecap="round"/>
                    <path d="M16 19 L16 25" stroke="#f1c40f" stroke-width="2.5" stroke-linecap="round"/>
                    <path d="M10 25 L22 25 L24 28 L8 28 Z" fill="url(#trophyGrad)" stroke="#e67e22" stroke-width="1"/>
                    <circle cx="16" cy="11" r="2.5" fill="#ffffff" opacity="0.85"/>
                </svg>
            </div>
            <div class="header-text">
                <h2>{$t('leaderboard.title')}</h2>
                <p class="header-sub">{$t('leaderboard.subtitle')}</p>
            </div>
            <button class="close-btn" on:click={onClose} aria-label={$t('common.close')}>✕</button>
        </div>

        <!-- Info Note: Spending doesn't reduce score -->
        <div class="info-banner">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#686de0" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>{$t('leaderboard.infoBanner')}</span>
        </div>

        <!-- Player Card -->
        <div class="player-card">
            <div class="player-rank">
                <span class="rank-label">{$t('leaderboard.yourRank')}</span>
                <span class="rank-value">#{userEntry?.rank || '—'}</span>
            </div>
            <div class="player-details">
                <span class="player-name">{$t('leaderboard.you')}</span>
                <div class="player-score">
                    <ResourceIcon type="stardust" size={16} />
                    <span class="score-number">{formatNumber($gameStore.totalStardustEarned || $gameStore.stardust || 0)}</span>
                    <span class="score-unit">{$t('leaderboard.scoreDust')}</span>
                </div>
            </div>
        </div>

        <!-- Leaderboard Table -->
        <div class="content-scroll">
            {#if isLoading}
                <div class="state-container">
                    <div class="loader-spinner"></div>
                    <p>{$t('leaderboard.connecting')}</p>
                </div>
            {:else if errorMessage}
                <div class="state-container error">
                    <p>{errorMessage}</p>
                    <button class="retry-btn" on:click={loadLeaderboard}>{$t('leaderboard.retry')}</button>
                </div>
            {:else if entries.length === 0}
                <div class="state-container">
                    <p>{$t('leaderboard.empty')}</p>
                </div>
            {:else}
                <div class="entries-list">
                    {#each entries as entry}
                        <div class="entry-row" class:user-highlight={entry.isUser} class:top-one={entry.rank === 1} class:top-two={entry.rank === 2} class:top-three={entry.rank === 3}>
                            <div class="entry-rank">
                                {#if entry.rank === 1}
                                    <span class="medal-badge gold">
                                        1
                                        <svg viewBox="0 0 24 24" width="12" height="12" fill="#ffd700">
                                            <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/>
                                        </svg>
                                    </span>
                                {:else if entry.rank === 2}
                                    <span class="medal-badge silver">2</span>
                                {:else if entry.rank === 3}
                                    <span class="medal-badge bronze">3</span>
                                {:else}
                                    <span class="rank-num">#{entry.rank}</span>
                                {/if}
                            </div>

                            <div class="entry-info">
                                <span class="entry-name">{entry.name}</span>
                                {#if entry.isUser}
                                    <span class="you-badge">{$t('leaderboard.youTag')}</span>
                                {/if}
                            </div>

                            <div class="entry-score">
                                <ResourceIcon type="stardust" size={14} />
                                <span class="score-val">{formatNumber(entry.score)}</span>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Footer -->
        <div class="modal-footer">
            <button class="refresh-btn" on:click={loadLeaderboard} disabled={isLoading}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 4v6h-6M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                <span>{$t('leaderboard.refresh')}</span>
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
        z-index: 220;
        backdrop-filter: blur(8px);
    }

    .modal {
        background: linear-gradient(165deg, #110926, #1a0f35 60%, #0d061c);
        padding: 20px;
        border-radius: 24px;
        border: 1.5px solid rgba(162, 155, 254, 0.35);
        box-shadow: 0 12px 50px rgba(0, 0, 0, 0.85), 0 0 45px rgba(108, 92, 231, 0.25);
        width: 92%;
        max-width: 480px;
        color: white;
        display: flex;
        flex-direction: column;
        max-height: 86vh;
        gap: 12px;
    }

    .modal-header {
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .header-icon-trophy {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(241, 196, 15, 0.12);
        border: 1px solid rgba(241, 196, 15, 0.3);
        border-radius: 12px;
        flex-shrink: 0;
    }

    .header-text h2 {
        margin: 0;
        font-size: 1.15rem;
        color: #f1c40f;
        font-weight: 800;
    }

    .header-sub {
        margin: 2px 0 0;
        font-size: 0.76rem;
        color: #a4b0be;
    }

    .close-btn {
        position: absolute;
        right: 0;
        top: 0;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 0.85rem;
        transition: background 0.2s;
    }
    .close-btn:hover {
        background: rgba(255, 255, 255, 0.18);
    }

    .info-banner {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(104, 109, 224, 0.12);
        border: 1px solid rgba(104, 109, 224, 0.3);
        padding: 8px 12px;
        border-radius: 12px;
        font-size: 0.74rem;
        color: #dcdde1;
        line-height: 1.3;
    }

    .player-card {
        display: flex;
        align-items: center;
        gap: 14px;
        background: linear-gradient(135deg, rgba(108, 92, 231, 0.25), rgba(72, 52, 212, 0.35));
        border: 1.5px solid rgba(162, 155, 254, 0.5);
        padding: 12px 16px;
        border-radius: 16px;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.3);
    }

    .player-rank {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(0, 0, 0, 0.3);
        padding: 4px 10px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        min-width: 58px;
    }
    .rank-label {
        font-size: 0.6rem;
        color: #a4b0be;
        font-weight: 700;
        letter-spacing: 0.5px;
    }
    .rank-value {
        font-size: 1.15rem;
        font-weight: 900;
        color: #ffd700;
    }

    .player-details {
        display: flex;
        flex-direction: column;
        gap: 3px;
        flex: 1;
    }
    .player-name {
        font-size: 0.88rem;
        font-weight: 800;
        color: #fff;
    }
    .player-score {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.82rem;
    }
    .score-number {
        font-weight: 800;
        color: #74b9ff;
    }
    .score-unit {
        color: #8395a7;
        font-size: 0.72rem;
    }

    .content-scroll {
        flex: 1;
        overflow-y: auto;
        padding-right: 4px;
        min-height: 180px;
        max-height: 320px;
    }
    .content-scroll::-webkit-scrollbar { width: 4px; }
    .content-scroll::-webkit-scrollbar-thumb { background: rgba(162, 155, 254, 0.3); border-radius: 4px; }

    .state-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        height: 100%;
        min-height: 160px;
        color: #8395a7;
        font-size: 0.85rem;
    }

    .loader-spinner {
        width: 30px;
        height: 30px;
        border: 3px solid rgba(162, 155, 254, 0.2);
        border-top-color: #a29bfe;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .retry-btn {
        background: rgba(108, 92, 231, 0.3);
        border: 1px solid #6c5ce7;
        color: white;
        padding: 6px 16px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 0.8rem;
    }

    .entries-list {
        display: flex;
        flex-direction: column;
        gap: 7px;
    }

    .entry-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 9px 12px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        transition: all 0.15s ease;
    }

    .entry-row.user-highlight {
        background: rgba(108, 92, 231, 0.2);
        border-color: rgba(162, 155, 254, 0.5);
    }
    .entry-row.top-one {
        background: rgba(241, 196, 15, 0.08);
        border-color: rgba(241, 196, 15, 0.3);
    }
    .entry-row.top-two {
        background: rgba(189, 195, 199, 0.07);
        border-color: rgba(189, 195, 199, 0.25);
    }
    .entry-row.top-three {
        background: rgba(230, 126, 34, 0.07);
        border-color: rgba(230, 126, 34, 0.25);
    }

    .entry-rank {
        width: 38px;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .medal-badge {
        font-size: 0.8rem;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 8px;
    }
    .medal-badge.gold {
        background: rgba(241, 196, 15, 0.2);
        color: #ffd700;
        border: 1px solid rgba(241, 196, 15, 0.4);
    }
    .medal-badge.silver {
        background: rgba(189, 195, 199, 0.2);
        color: #ecf0f1;
        border: 1px solid rgba(189, 195, 199, 0.4);
    }
    .medal-badge.bronze {
        background: rgba(230, 126, 34, 0.2);
        color: #e67e22;
        border: 1px solid rgba(230, 126, 34, 0.4);
    }
    .rank-num {
        font-size: 0.82rem;
        font-weight: 700;
        color: #718093;
    }

    .entry-info {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        overflow: hidden;
    }
    .entry-name {
        font-size: 0.84rem;
        font-weight: 700;
        color: #dfe4ea;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .you-badge {
        font-size: 0.65rem;
        font-weight: 800;
        padding: 1px 6px;
        border-radius: 6px;
        background: #6c5ce7;
        color: #fff;
    }

    .entry-score {
        display: flex;
        align-items: center;
        gap: 5px;
    }
    .score-val {
        font-size: 0.88rem;
        font-weight: 800;
        color: #74b9ff;
    }

    .modal-footer {
        display: flex;
        justify-content: center;
        padding-top: 4px;
    }

    .refresh-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #a4b0be;
        padding: 7px 18px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 700;
        transition: all 0.2s;
    }
    .refresh-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }
</style>
