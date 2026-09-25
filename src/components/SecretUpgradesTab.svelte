<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { gameStore, formatNumber } from '../store';
    import { saveGame, showRewardedAd } from '../yandex-sdk';
    import { playSuccessSound, playLevelUpSound } from '../audio';
    import gsap from 'gsap';
    import ResourceIcon from './ResourceIcon.svelte';
    import { t, currentLang, getSecretUpgradeName, getSecretUpgradeDesc } from '../i18n';

    let buttons: Record<string, HTMLElement> = {};
    let nowTime = Date.now();
    let timer: any;

    onMount(() => {
        timer = setInterval(() => {
            nowTime = Date.now();
        }, 1000);
    });

    onDestroy(() => {
        if (timer) clearInterval(timer);
    });

    $: boostUntil = $gameStore?.secretKnowledgeBoostUntil || 0;
    $: isBoosted = boostUntil > nowTime;
    $: boostSecondsLeft = isBoosted ? Math.max(0, Math.ceil((boostUntil - nowTime) / 1000)) : 0;
    $: boostFormattedTime = `${Math.floor(boostSecondsLeft / 60)}:${(boostSecondsLeft % 60).toString().padStart(2, '0')}`;

    function getCost(baseCost: number, costMultiplier: number, level: number) {
        return Math.floor(baseCost * Math.pow(costMultiplier, level));
    }

    function buySecret(id: string, cost: number) {
        if ($gameStore.stardust >= cost) {
            playSuccessSound();
            gameStore.buySecretUpgrade(id);
            saveGame();
            const btn = buttons[id];
            if (btn) {
                gsap.fromTo(btn, 
                    { scale: 0.88 }, 
                    { scale: 1, duration: 0.25, ease: 'back.out(2)' }
                );
            }
        } else {
            const btn = buttons[id];
            if (btn) {
                gsap.to(btn, {
                    keyframes: [
                        { x: -6, duration: 0.04 },
                        { x:  6, duration: 0.04 },
                        { x: -4, duration: 0.04 },
                        { x:  4, duration: 0.04 },
                        { x:  0, duration: 0.04 }
                    ],
                    ease: 'none'
                });
            }
        }
    }

    function triggerInsightReward() {
        showRewardedAd(() => {
            playLevelUpSound();
            gameStore.activateSecretKnowledgeBoost(30 * 60 * 1000);
            saveGame();
        });
    }

    const categoryIcons: Record<string, string> = {
        'ritual': `<svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor"><polygon points="6,1 7.5,4.5 11,6 7.5,7.5 6,11 4.5,7.5 1,6 4.5,4.5"/></svg>`,
        'alchemy': `<svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor"><path d="M4 1h4v2l2 6a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 2 9l2-6V1z"/></svg>`,
        'expeditions': `<svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor"><ellipse cx="6" cy="7.5" rx="2.5" ry="2"/><circle cx="3.5" cy="4" r="1.1"/><circle cx="6" cy="3" r="1.1"/><circle cx="8.5" cy="4" r="1.1"/></svg>`,
        'orders': `<svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor"><rect x="2" y="2" width="8" height="8" rx="1.5"/></svg>`,
        'economy': `<svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor"><polygon points="6,1 10.5,4.5 6,11 1.5,4.5"/></svg>`,
    };

    $: categoryColors = {
        'ritual':      { label: $t('secretUpgradesMeta.ritual'), color: '#e056fd', bg: 'rgba(224, 86, 253, 0.15)' },
        'alchemy':     { label: $t('secretUpgradesMeta.alchemy'), color: '#2ecc71', bg: 'rgba(46, 204, 113, 0.15)' },
        'expeditions': { label: $t('secretUpgradesMeta.expeditions'), color: '#f39c12', bg: 'rgba(243, 156, 18, 0.15)' },
        'orders':      { label: $t('secretUpgradesMeta.orders'), color: '#3498db', bg: 'rgba(52, 152, 219, 0.15)' },
        'economy':     { label: $t('secretUpgradesMeta.economy'), color: '#f1c40f', bg: 'rgba(241, 196, 15, 0.15)' },
    } as Record<string, { label: string; color: string; bg: string }>;

    const icons: Record<string, string> = {
        'stardust_extractor': `<svg viewBox="0 0 28 28" width="28" height="28" fill="none">
            <ellipse cx="14" cy="14" rx="11" ry="6" stroke="#e056fd" stroke-width="1.4" stroke-dasharray="3 2" transform="rotate(-25 14 14)"/>
            <circle cx="14" cy="14" r="3.5" fill="#f1c40f"/>
            <polygon points="14,3 16,9 22,11 17,15 18,21 14,17 10,21 11,15 6,11 12,9" fill="#e056fd" opacity="0.4"/>
            <circle cx="7" cy="8" r="1" fill="#ffeaa7"/>
            <circle cx="21" cy="20" r="1.2" fill="#ffeaa7"/>
        </svg>`,
        'essence_mastery': `<svg viewBox="0 0 28 28" width="28" height="28" fill="none">
            <path d="M10 4 H18 M11 4 V10 L5 21 C4.2 22.5 5.3 24 7 24 H21 C22.7 24 23.8 22.5 23 21 L17 10 V4" stroke="#2ecc71" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M7 19 L21 19 L22 21 C22.4 22 21.6 23 20.5 23 H7.5 C6.4 23 5.6 22 6 21 Z" fill="#2ecc71" opacity="0.6"/>
            <circle cx="11" cy="20" r="1.5" fill="#fff"/>
            <circle cx="16" cy="17" r="1.8" fill="#a8e6cf"/>
            <path d="M14 8 Q15 6 17 7" stroke="#f1c40f" stroke-width="1.2" stroke-linecap="round"/>
        </svg>`,
        'scout_whisper': `<svg viewBox="0 0 28 28" width="28" height="28" fill="none">
            <circle cx="14" cy="14" r="11" stroke="#f39c12" stroke-width="1.3" stroke-dasharray="2 2"/>
            <ellipse cx="14" cy="17" rx="5" ry="4" fill="#f39c12"/>
            <circle cx="9" cy="12" r="2" fill="#f39c12"/>
            <circle cx="13" cy="9.5" r="2" fill="#f39c12"/>
            <circle cx="17" cy="10" r="2" fill="#f39c12"/>
            <circle cx="20" cy="13.5" r="1.8" fill="#f39c12"/>
            <path d="M4 14 L7 14 M21 14 L24 14" stroke="#ffeaa7" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`,
        'orders': `<svg viewBox="0 0 28 28" width="28" height="28" fill="none">
            <rect x="7" y="5" width="14" height="18" rx="2.5" fill="#2c3e50" stroke="#3498db" stroke-width="1.5"/>
            <line x1="10" y1="10" x2="18" y2="10" stroke="#74b9ff" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="10" y1="14" x2="16" y2="14" stroke="#74b9ff" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="10" y1="18" x2="14" y2="18" stroke="#74b9ff" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="18" cy="18" r="3.5" fill="#f1c40f" stroke="#e67e22" stroke-width="1"/>
            <polygon points="18,16 19,17.5 20.5,17.5 19.3,18.5 19.8,20 18,19 16.2,20 16.7,18.5 15.5,17.5 17,17.5" fill="#d35400"/>
        </svg>`,
        'cooldown_mastery': `<svg viewBox="0 0 28 28" width="28" height="28" fill="none">
            <path d="M14 4 L14 24 M4 14 L24 14 M7 7 L21 21 M7 21 L21 7" stroke="#74b9ff" stroke-width="1.4" stroke-linecap="round"/>
            <circle cx="14" cy="14" r="5" fill="#0984e3" stroke="#dfe6e9" stroke-width="1"/>
            <circle cx="14" cy="14" r="2" fill="#ffffff"/>
            <circle cx="14" cy="6" r="1" fill="#74b9ff"/>
            <circle cx="14" cy="22" r="1" fill="#74b9ff"/>
        </svg>`,
        'crystal_transmute': `<svg viewBox="0 0 28 28" width="28" height="28" fill="none">
            <polygon points="14,3 22,10 14,25 6,10" fill="#0984e3" opacity="0.4"/>
            <polygon points="14,3 22,10 14,15 6,10" fill="#74b9ff" stroke="#00cec9" stroke-width="1.2"/>
            <polygon points="6,10 14,15 14,25" fill="#0984e3" stroke="#00cec9" stroke-width="1.2"/>
            <polygon points="22,10 14,15 14,25" fill="#6c5ce7" stroke="#00cec9" stroke-width="1.2"/>
            <circle cx="14" cy="11" r="1.5" fill="#ffffff"/>
        </svg>`,
        'archmage_heritage': `<svg viewBox="0 0 28 28" width="28" height="28" fill="none">
            <path d="M5 20 L7 10 L11 15 L14 7 L17 15 L21 10 L23 20 Z" fill="#f1c40f" stroke="#d4ac0d" stroke-width="1.2"/>
            <rect x="5" y="20" width="18" height="3" rx="1" fill="#d35400"/>
            <circle cx="14" cy="7" r="1.5" fill="#e74c3c"/>
            <circle cx="7" cy="10" r="1.2" fill="#3498db"/>
            <circle cx="21" cy="10" r="1.2" fill="#3498db"/>
            <circle cx="14" cy="16" r="1.5" fill="#ffffff"/>
        </svg>`,
        'familiar': `<svg viewBox="0 0 28 28" width="28" height="28" fill="none">
            <circle cx="14" cy="14" r="10" stroke="#a29bfe" stroke-width="1.2" stroke-dasharray="3 2"/>
            <ellipse cx="14" cy="16" rx="6" ry="5" fill="#6c5ce7"/>
            <circle cx="10" cy="11" r="2.5" fill="#a29bfe"/>
            <circle cx="18" cy="11" r="2.5" fill="#a29bfe"/>
            <circle cx="14" cy="14" r="2" fill="#ffeaa7"/>
            <polygon points="8,9 9,5 12,8" fill="#6c5ce7"/>
            <polygon points="20,9 19,5 16,8" fill="#6c5ce7"/>
        </svg>`
    };

    const defaultIcon = `<svg viewBox="0 0 28 28" width="28" height="28" fill="none">
        <circle cx="14" cy="14" r="10" fill="#9b59b6" stroke="#fd79a8" stroke-width="1.5"/>
        <polygon points="14,6 16,11 21,12 17,16 18,21 14,18 10,21 11,16 7,12 12,11" fill="#f1c40f"/>
    </svg>`;
</script>

<div class="secret-tab">
    <!-- Top Arcane Info Bar -->
    <div class="secret-info-bar">
        <div class="info-content">
            <div class="info-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="#a29bfe" stroke-width="1.5"/>
                    <polygon points="12,4 14,9 19,10 15,14 16,19 12,16 8,19 9,14 5,10 10,9" fill="#a29bfe"/>
                </svg>
            </div>
            <div class="info-text">
                <span class="info-title">{$t('secretUpgradesMeta.title')}</span>
                <span class="info-sub">{$t('secretUpgradesMeta.subtitle')}</span>
            </div>
        </div>
    </div>

    <!-- Archmage Insight (Rewarded Ad Banner) -->
    <div class="insight-banner" class:is-active={isBoosted}>
        <div class="insight-left">
            <div class="insight-badge-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                    <circle cx="12" cy="12" r="9" fill="rgba(241, 196, 15, 0.2)" stroke="#f1c40f" stroke-width="1.5"/>
                    <path d="M12 7 L12 13 L16 15" stroke="#ffeaa7" stroke-width="1.8" stroke-linecap="round"/>
                    <circle cx="12" cy="12" r="2" fill="#f1c40f"/>
                </svg>
            </div>
            <div class="insight-texts">
                <div class="insight-title-row">
                    <span class="insight-title">{$t('secretUpgradesMeta.insightTitle')}</span>
                    {#if isBoosted}
                        <span class="active-pill">{$t('secretUpgradesMeta.insightActiveTag')}</span>
                    {/if}
                </div>
                <span class="insight-desc">
                    {#if isBoosted}
                        {$t('secretUpgradesMeta.insightActiveDesc', { time: boostFormattedTime })}
                    {:else}
                        {$t('secretUpgradesMeta.insightInactiveDesc')}
                    {/if}
                </span>
            </div>
        </div>
        
        <div class="insight-action">
            {#if !isBoosted}
                <button type="button" class="insight-btn" on:click={triggerInsightReward}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" class="ad-icon">
                        <rect x="3" y="5" width="18" height="14" rx="3" stroke="#fff" stroke-width="1.5"/>
                        <polygon points="10,9 16,12 10,15" fill="#f1c40f"/>
                    </svg>
                    <span>{$t('secretUpgradesMeta.insightActivate')}</span>
                </button>
            {:else}
                <div class="insight-timer-box">
                    <span class="timer-digits">{boostFormattedTime}</span>
                </div>
            {/if}
        </div>
    </div>
    
    <!-- List of Arcane Runes -->
    <div class="list">
        {#each $gameStore.secretUpgrades as upgrade}
            {@const cost = getCost(upgrade.baseCost, upgrade.costMultiplier, upgrade.level)}
            {@const isMax = upgrade.level >= upgrade.maxLevel}
            {@const canAfford = $gameStore.stardust >= cost}
            {@const category = categoryColors[upgrade.category || 'ritual'] || categoryColors['ritual']}
            {@const upgradeName = getSecretUpgradeName(upgrade.id, $currentLang)}
            {@const upgradeDesc = getSecretUpgradeDesc(upgrade.id, $currentLang)}
            
            <div class="card" class:is-max={isMax}>
                <div class="icon-wrap">
                    <span class="icon">{@html icons[upgrade.id] || defaultIcon}</span>
                </div>
                
                <div class="info">
                    <div class="title-row">
                        <div class="name-with-tag">
                            <h4 class="card-name">{upgradeName}</h4>
                            <span class="category-chip" style="color: {category.color}; background: {category.bg}">
                                {@html categoryIcons[upgrade.category || 'ritual'] || categoryIcons['ritual']}
                                <span>{category.label}</span>
                            </span>
                        </div>
                        <span class="level-tag" class:max-tag={isMax}>
                            {isMax ? $t('common.maxLevel') : `${upgrade.level} / ${upgrade.maxLevel}`}
                        </span>
                    </div>

                    <p class="desc">
                        {upgradeDesc}
                        {#if isBoosted && upgrade.level > 0}
                            <span class="boost-bonus-text">{$t('secretUpgradesMeta.boostActiveBadge')}</span>
                        {/if}
                    </p>

                    <div class="progress-wrap">
                        <div class="bar">
                            <div class="fill" style="width: {(upgrade.level / upgrade.maxLevel) * 100}%"></div>
                        </div>
                    </div>
                </div>

                <div class="action-wrap">
                    <button 
                        type="button"
                        class="buy-btn" 
                        class:max={isMax}
                        bind:this={buttons[upgrade.id]}
                        on:click={() => { if(!isMax) buySecret(upgrade.id, cost); }}
                        disabled={isMax || !canAfford}
                    >
                        {#if isMax}
                            <span>{$t('secretUpgradesMeta.learned')}</span>
                        {:else}
                            <span class="btn-cost-row">
                                <ResourceIcon type="stardust" size={13} />
                                <span>{formatNumber(cost)}</span>
                            </span>
                        {/if}
                    </button>
                </div>
            </div>
        {/each}
    </div>
</div>

<style>
    .secret-tab {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-top: 4px;
    }

    /* Info Bar */
    .secret-info-bar {
        background: rgba(155, 89, 182, 0.12);
        border: 1px solid rgba(162, 155, 254, 0.25);
        border-radius: 14px;
        padding: 10px 14px;
    }

    .info-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .info-icon {
        flex-shrink: 0;
        filter: drop-shadow(0 2px 6px rgba(162, 155, 254, 0.4));
    }

    .info-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .info-title {
        display: block;
        font-size: 0.95rem;
        font-weight: 800;
        color: #a29bfe;
    }

    .info-sub {
        display: block;
        font-size: 0.76rem;
        color: #b2bec3;
        line-height: 1.35;
    }

    /* Archmage Insight Banner */
    .insight-banner {
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.1) 0%, rgba(142, 68, 173, 0.15) 100%);
        border: 1.5px solid rgba(241, 196, 15, 0.35);
        border-radius: 14px;
        padding: 12px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        transition: border-color 0.3s, background 0.3s;
    }

    .insight-banner.is-active {
        border-color: rgba(46, 204, 113, 0.55);
        background: linear-gradient(135deg, rgba(46, 204, 113, 0.12) 0%, rgba(30, 144, 255, 0.1) 100%);
    }

    .insight-left {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
    }

    .insight-badge-icon {
        flex-shrink: 0;
    }

    .insight-texts {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .insight-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .insight-title {
        font-size: 0.92rem;
        font-weight: 900;
        color: #ffeaa7;
    }

    .active-pill {
        font-size: 0.68rem;
        font-weight: 900;
        background: rgba(46, 204, 113, 0.25);
        border: 1px solid #2ecc71;
        color: #2ecc71;
        padding: 1px 6px;
        border-radius: 6px;
        letter-spacing: 0.5px;
    }

    .insight-desc {
        font-size: 0.74rem;
        color: #dfe6e9;
        line-height: 1.3;
    }

    .insight-action {
        flex-shrink: 0;
    }

    .insight-btn {
        background: linear-gradient(135deg, #f39c12, #e67e22);
        border: 1px solid #ffeaa7;
        border-radius: 10px;
        padding: 7px 12px;
        color: #fff;
        font-size: 0.8rem;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 10px rgba(243, 156, 18, 0.35);
        transition: transform 0.15s, filter 0.15s;
    }

    .insight-btn:hover {
        transform: translateY(-2px);
        filter: brightness(1.1);
    }

    .insight-timer-box {
        background: rgba(46, 204, 113, 0.15);
        border: 1px solid rgba(46, 204, 113, 0.35);
        padding: 6px 12px;
        border-radius: 8px;
    }

    .timer-digits {
        font-size: 0.88rem;
        font-weight: 900;
        color: #2ecc71;
        letter-spacing: 1px;
    }

    /* List of Runes */
    .list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .card {
        background: rgba(255, 255, 255, 0.03);
        border: 1.5px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 11px 13px;
        display: flex;
        align-items: center;
        gap: 14px;
        transition: transform 0.15s, border-color 0.15s;
    }

    .card:hover {
        border-color: rgba(162, 155, 254, 0.35);
        transform: translateY(-1px);
    }

    .card.is-max {
        border-color: rgba(39, 174, 96, 0.35);
        background: rgba(39, 174, 96, 0.04);
    }

    .icon-wrap {
        flex-shrink: 0;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: rgba(162, 155, 254, 0.1);
        border: 1px solid rgba(162, 155, 254, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .info {
        flex: 1;
        min-width: 0;
    }

    .title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 2px;
    }

    .name-with-tag {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .card-name {
        margin: 0;
        font-size: 0.92rem;
        font-weight: 800;
        color: #fff;
    }

    .category-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.65rem;
        font-weight: 800;
        padding: 1px 6px;
        border-radius: 4px;
        letter-spacing: 0.3px;
    }

    .level-tag {
        font-size: 0.72rem;
        font-weight: 800;
        background: rgba(162, 155, 254, 0.15);
        border: 1px solid rgba(162, 155, 254, 0.3);
        color: #a29bfe;
        padding: 1px 6px;
        border-radius: 6px;
        flex-shrink: 0;
    }

    .level-tag.max-tag {
        background: rgba(46, 204, 113, 0.2);
        border-color: #2ecc71;
        color: #2ecc71;
    }

    .desc {
        margin: 0 0 6px;
        font-size: 0.76rem;
        color: #b2bec3;
    }

    .boost-bonus-text {
        color: #2ecc71;
        font-weight: 800;
    }

    .progress-wrap {
        width: 100%;
    }

    .bar {
        height: 5px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 3px;
        overflow: hidden;
    }

    .fill {
        height: 100%;
        background: linear-gradient(90deg, #9b59b6, #e056fd);
        border-radius: 3px;
        transition: width 0.3s ease;
    }

    .action-wrap {
        flex-shrink: 0;
    }

    .buy-btn {
        background: linear-gradient(135deg, #8e44ad, #a29bfe);
        border: 1px solid #dcdde1;
        border-radius: 10px;
        padding: 8px 13px;
        color: #fff;
        font-size: 0.82rem;
        font-weight: 800;
        cursor: pointer;
        min-width: 80px;
        box-shadow: 0 4px 12px rgba(142, 68, 173, 0.3);
        transition: transform 0.15s, filter 0.15s;
    }

    .buy-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        filter: brightness(1.1);
    }

    .buy-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
        box-shadow: none;
    }

    .buy-btn.max {
        background: rgba(46, 204, 113, 0.15);
        border-color: rgba(46, 204, 113, 0.4);
        color: #2ecc71;
        cursor: default;
        opacity: 1;
    }

    .btn-cost-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
    }

    @media (max-width: 680px) {
        .card {
            padding: 9px 10px;
            gap: 10px;
        }
        .icon-wrap {
            width: 38px;
            height: 38px;
        }
        .card-name {
            font-size: 0.86rem;
        }
        .desc {
            font-size: 0.72rem;
            margin-bottom: 4px;
        }
        .buy-btn {
            min-width: 72px;
            min-height: 44px;
            padding: 8px 10px;
            font-size: 0.78rem;
        }
        .insight-banner {
            flex-direction: column;
            align-items: stretch;
            padding: 12px;
            gap: 10px;
        }
        .insight-btn {
            width: 100%;
            justify-content: center;
            min-height: 44px;
        }
    }

    @media (max-width: 380px) {
        .card {
            padding: 8px 8px;
            gap: 8px;
        }
        .icon-wrap {
            width: 34px;
            height: 34px;
        }
        .card-name {
            font-size: 0.82rem;
        }
        .category-chip {
            display: none;
        }
        .buy-btn {
            min-width: 64px;
            padding: 7px 6px;
            font-size: 0.74rem;
        }
    }
</style>
