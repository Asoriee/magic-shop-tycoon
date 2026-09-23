<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { 
        crystals, 
        isVip, 
        vipDaysLeft, 
        vipHoursLeft, 
        isVipDailyRewardAvailable, 
        claimVipDailyReward, 
        gameStore, 
        formatNumber 
    } from '../store';
    import { purchaseItem, showRewardedAd, saveGame, getProductDisplayPrice, checkPurchases } from '../yandex-sdk';
    import ResourceIcon from './ResourceIcon.svelte';
    import { t } from '../i18n';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void;

    let isPurchasing = false;
    let purchaseMessage = '';
    let messageTimeout: any;

    // Cooldown for Dragon Gift: 5 minutes (300 seconds)
    const DRAGON_GIFT_COOLDOWN_MS = 5 * 60 * 1000;
    let secondsToDragonGift = 0;
    let giftTimerInterval: any;

    function updateGiftTimer() {
        const lastTime = $gameStore?.lastDragonGiftTime || 0;
        const diff = Date.now() - lastTime;
        if (diff >= DRAGON_GIFT_COOLDOWN_MS) {
            secondsToDragonGift = 0;
        } else {
            secondsToDragonGift = Math.ceil((DRAGON_GIFT_COOLDOWN_MS - diff) / 1000);
        }
    }

    onMount(() => {
        updateGiftTimer();
        giftTimerInterval = setInterval(updateGiftTimer, 1000);
        checkPurchases().catch(() => {});
    });

    onDestroy(() => {
        if (giftTimerInterval) clearInterval(giftTimerInterval);
        if (messageTimeout) clearTimeout(messageTimeout);
    });

    function showMessage(msg: string) {
        purchaseMessage = msg;
        clearTimeout(messageTimeout);
        messageTimeout = setTimeout(() => { purchaseMessage = ''; }, 3500);
    }

    async function handleBuy(itemId: string) {
        if (isPurchasing) return;
        isPurchasing = true;
        purchaseMessage = '';

        try {
            await purchaseItem(itemId);
            if (itemId === 'pack_crystals_100') {
                showMessage($t('treasury.msgCrystals100'));
            } else if (itemId === 'pack_crystals_300') {
                showMessage($t('treasury.msgCrystals300'));
            } else if (itemId === 'pack_crystals_1000') {
                showMessage($t('treasury.msgCrystals1000'));
            } else if (itemId === 'starter_pack') {
                showMessage($t('treasury.msgStarterPackSuccess'));
            } else if (itemId === 'vip_status' || itemId === 'vip_month') {
                showMessage($t('treasury.msgVipSuccess'));
            }
        } catch (e: any) {
            const errMsg = e?.message || '';
            if (errMsg.toLowerCase().includes('cancel') || errMsg.toLowerCase().includes('closed')) {
                showMessage($t('treasury.msgPurchaseCancelled'));
            } else {
                showMessage($t('treasury.msgPurchaseError'));
                console.error('Purchase error:', e);
            }
        } finally {
            isPurchasing = false;
        }
    }

    function handleClaimVipDaily() {
        const success = claimVipDailyReward();
        if (success) {
            saveGame();
            showMessage($t('treasury.msgVipDailyClaimed'));
        }
    }

    function handleClaimDragonGift() {
        if (secondsToDragonGift > 0) return;
        showRewardedAd(
            () => {
                crystals.update(n => n + 3);
                gameStore.claimDragonGift();
                saveGame();
                showMessage($t('treasury.msgDragonGiftClaimed'));
                updateGiftTimer();
            },
            () => {}
        );
    }

    function formatTime(secs: number): string {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
</script>

{#if isOpen}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="overlay" class:embedded={isEmbedded} on:click={onClose}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal" class:embedded-modal={isEmbedded} on:click|stopPropagation>

        {#if !isEmbedded}
            <div class="tab-header">
                <div class="tab-title-row">
                    <div class="header-icon">
                        <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
                            <rect x="5" y="14" width="30" height="20" rx="4" fill="#8B4513" stroke="#f1c40f" stroke-width="1.5"/>
                            <path d="M5 14 C5 8 10 5 20 5 C30 5 35 8 35 14 Z" fill="#a0522d" stroke="#f1c40f" stroke-width="1.5"/>
                            <circle cx="20" cy="22" r="3" fill="#f1c40f"/>
                        </svg>
                    </div>
                    <h2 class="tab-title">{$t('treasury.title')}</h2>
                </div>
                <button class="close-btn" on:click={onClose} aria-label={$t('common.close')}>
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.2" fill="none">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        {/if}

        <!-- Notification Banner -->
        {#if purchaseMessage}
            <div class="purchase-message">
                <svg viewBox="0 0 20 20" width="16" height="16" fill="none" class="msg-svg">
                    <circle cx="10" cy="10" r="9" stroke="#f1c40f" stroke-width="1.5"/>
                    <path d="M6 10 L9 13 L14 7" stroke="#2ecc71" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>{purchaseMessage}</span>
            </div>
        {/if}

        <div class="treasury-container">

            <!-- 0. STARTER PACK (Limited Beginner Offer) -->
            {#if !$gameStore?.hasBoughtStarterPack}
                <div class="starter-pack-card">
                    <div class="starter-glow"></div>
                    <div class="starter-ribbon-badge">
                        <span class="ribbon-disc">{$t('treasury.starterBadge')}</span>
                        <span class="ribbon-val">{$t('treasury.starterValue')}</span>
                    </div>

                    <div class="starter-card-body">
                        <div class="starter-visual-box">
                            <svg viewBox="0 0 74 74" width="68" height="68" class="starter-chest-svg">
                                <defs>
                                    <radialGradient id="starterAura" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" stop-color="#ffeaa7" stop-opacity="0.9"/>
                                        <stop offset="50%" stop-color="#a855f7" stop-opacity="0.45"/>
                                        <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
                                    </radialGradient>
                                    <linearGradient id="starterGoldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="#ffeaa7"/>
                                        <stop offset="50%" stop-color="#f59e0b"/>
                                        <stop offset="100%" stop-color="#d97706"/>
                                    </linearGradient>
                                </defs>
                                <circle cx="37" cy="37" r="34" fill="url(#starterAura)"/>
                                <!-- Magical Chest -->
                                <rect x="12" y="34" width="50" height="28" rx="4" fill="#2d134d" stroke="url(#starterGoldStroke)" stroke-width="1.8"/>
                                <path d="M10 34 Q37 14 64 34 Z" fill="#441a75" stroke="url(#starterGoldStroke)" stroke-width="1.8"/>
                                <!-- Huge Blue Core Gem Emerging -->
                                <polygon points="37,8 47,24 37,38 27,24" fill="#38bdf8" stroke="#bae6fd" stroke-width="1.5"/>
                                <polygon points="37,8 37,38 27,24" fill="#0284c7"/>
                                <polygon points="37,8 47,24 37,38" fill="#7dd3fc"/>
                                <!-- Sparkles -->
                                <polygon points="18,16 20,21 25,23 20,25 18,30 16,25 11,23 16,21" fill="#fde047"/>
                                <polygon points="56,18 57,22 61,23 57,24 56,28 55,24 51,23 55,22" fill="#fde047"/>
                                <circle cx="37" cy="48" r="3.5" fill="#f59e0b" stroke="#fff" stroke-width="0.8"/>
                            </svg>
                        </div>

                        <div class="starter-info-box">
                            <div class="starter-heading-row">
                                <h3 class="starter-title">{$t('treasury.starterTitle')}</h3>
                            </div>
                            <p class="starter-desc">{$t('treasury.starterDesc')}</p>

                            <ul class="starter-perks-list">
                                <li>
                                    <ResourceIcon type="crystals" size={15} />
                                    <span>{@html $t('treasury.starterPerkCrystals')}</span>
                                </li>
                                <li>
                                    <ResourceIcon type="vip" size={15} />
                                    <span>{@html $t('treasury.starterPerkVip')}</span>
                                </li>
                                <li>
                                    <ResourceIcon type="gold" size={15} />
                                    <span>{@html $t('treasury.starterPerkGold')}</span>
                                </li>
                            </ul>
                        </div>

                        <div class="starter-action-box">
                            <button 
                                type="button" 
                                class="buy-starter-btn" 
                                on:click={() => handleBuy('starter_pack')} 
                                disabled={isPurchasing}
                                title="{$t('treasury.starterBuyCta')}"
                            >
                                {#if isPurchasing}
                                    <span class="btn-spinner"></span>
                                {:else}
                                    <span class="starter-yan-price">{getProductDisplayPrice('starter_pack', `69 ${$t('bank.yanSuffix') || 'YAN'}`)}</span>
                                    <span class="starter-cta-label">{$t('treasury.starterBuyCta')}</span>
                                {/if}
                            </button>
                        </div>
                    </div>
                </div>
            {/if}

            <!-- 1. VIP Flagship Card (30 days pass) -->
            <div class="vip-card" class:vip-active={$isVip}>
                <div class="vip-glow"></div>
                <div class="vip-content">
                    
                    <!-- VIP Master Header (Brand + Status Pill) -->
                    <div class="vip-top-header">
                        <div class="vip-brand-group">
                            <div class="vip-crown-badge">
                                <svg viewBox="0 0 70 60" width="36" height="30" class="crown-svg">
                                    <defs>
                                        <radialGradient id="vipGoldAura" cx="50%" cy="50%" r="50%">
                                            <stop offset="0%" stop-color="#ffeaa7"/>
                                            <stop offset="70%" stop-color="#f39c12"/>
                                            <stop offset="100%" stop-color="#d35400"/>
                                        </radialGradient>
                                        <filter id="vipGoldGlow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="2.5" result="blur"/>
                                            <feMerge>
                                                <feMergeNode in="blur"/>
                                                <feMergeNode in="SourceGraphic"/>
                                            </feMerge>
                                        </filter>
                                    </defs>
                                    <circle cx="35" cy="30" r="26" fill="rgba(241, 196, 15, 0.15)"/>
                                    <!-- Crown base & peaks -->
                                    <path d="M10 46 L60 46 L58 52 L12 52 Z" fill="#b7791f"/>
                                    <path d="M10 46 L60 46 L64 24 L48 36 L35 12 L22 36 L6 24 Z" 
                                          fill="url(#vipGoldAura)" stroke="#ffeaa7" stroke-width="1.5" filter="url(#vipGoldGlow)"/>
                                    <!-- Gems on peaks -->
                                    <circle cx="35" cy="12" r="4.5" fill="#e74c3c" stroke="#fff" stroke-width="1"/>
                                    <circle cx="6" cy="24" r="3" fill="#3498db" stroke="#fff" stroke-width="1"/>
                                    <circle cx="64" cy="24" r="3" fill="#3498db" stroke="#fff" stroke-width="1"/>
                                    <circle cx="22" cy="36" r="3" fill="#2ecc71" stroke="#fff" stroke-width="1"/>
                                    <circle cx="48" cy="36" r="3" fill="#2ecc71" stroke="#fff" stroke-width="1"/>
                                </svg>
                            </div>
                            <div class="vip-titles">
                                <h3 class="vip-title">{$t('treasury.vipTitle')}</h3>
                                <span class="vip-subtitle">{$t('treasury.perk7')}</span>
                            </div>
                        </div>

                        <div class="vip-status-box">
                            {#if $isVip}
                                <span class="vip-badge-tag vip-active-tag">
                                    <ResourceIcon type="vip" size={13} />
                                    <span class="status-days-text">{$t('treasury.vipActiveDays', { days: $vipDaysLeft })}</span>
                                </span>
                            {:else}
                                <span class="vip-badge-tag">
                                    <span>{$t('treasury.vipDays30')}</span>
                                </span>
                            {/if}
                        </div>
                    </div>

                    <!-- 2-Column Structured Benefits Matrix -->
                    <div class="vip-perks-grid">
                        <div class="vip-perk-item">
                            <div class="perk-icon-wrap icon-gem">
                                <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                                    <polygon points="10,2 17,7 14,17 6,17 3,7" fill="#74b9ff" stroke="#0984e3" stroke-width="1.2"/>
                                    <polygon points="10,2 17,7 10,9" fill="#a29bfe" opacity="0.8"/>
                                    <polygon points="10,2 3,7 10,9" fill="#dff9fb" opacity="0.9"/>
                                </svg>
                            </div>
                            <div class="perk-text-wrap">
                                {@html $t('treasury.perk1')}
                            </div>
                        </div>

                        <div class="vip-perk-item highlight-altar">
                            <div class="perk-icon-wrap icon-daily">
                                <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                                    <rect x="3" y="4" width="14" height="13" rx="2.5" fill="#2d134d" stroke="#f1c40f" stroke-width="1.2"/>
                                    <path d="M3 8 L17 8" stroke="#f1c40f" stroke-width="1.2"/>
                                    <line x1="7" y1="2" x2="7" y2="5" stroke="#f1c40f" stroke-width="1.5" stroke-linecap="round"/>
                                    <line x1="13" y1="2" x2="13" y2="5" stroke="#f1c40f" stroke-width="1.5" stroke-linecap="round"/>
                                    <polygon points="10,10 12,14 8,14" fill="#00d2d3"/>
                                </svg>
                            </div>
                            <div class="perk-text-wrap">
                                {@html $t('treasury.perk2')}
                            </div>
                        </div>

                        <div class="vip-perk-item">
                            <div class="perk-icon-wrap icon-noads">
                                <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                                    <path d="M10 2 L17 5 V11 C17 15 13 18 10 19 C7 18 3 15 3 11 V5 Z" fill="#1b2a47" stroke="#00cec9" stroke-width="1.2"/>
                                    <polygon points="8,7 14,10.5 8,14" fill="#00cec9"/>
                                    <line x1="5" y1="5" x2="15" y2="15" stroke="#ff7675" stroke-width="1.5" stroke-linecap="round"/>
                                </svg>
                            </div>
                            <div class="perk-text-wrap">
                                <span>{$t('treasury.perk3')}</span>
                            </div>
                        </div>

                        <div class="vip-perk-item">
                            <div class="perk-icon-wrap icon-income">
                                <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                                    <circle cx="10" cy="10" r="8" fill="#2d2008" stroke="#f1c40f" stroke-width="1.2"/>
                                    <polyline points="5,13 8.5,9.5 11,12 15,7" stroke="#2ecc71" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                                    <polyline points="12,7 15,7 15,10" stroke="#2ecc71" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div class="perk-text-wrap">
                                {@html $t('treasury.perk4')}
                            </div>
                        </div>

                        <div class="vip-perk-item">
                            <div class="perk-icon-wrap icon-calendar">
                                <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                                    <rect x="3" y="3" width="14" height="14" rx="3" fill="#25143a" stroke="#e056fd" stroke-width="1.2"/>
                                    <path d="M6 10 L8 8 L10 12 L12 10" stroke="#f1c40f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    <text x="10" y="14.5" fill="#ffeaa7" font-size="7" font-weight="900" text-anchor="middle" font-family="sans-serif">2×</text>
                                </svg>
                            </div>
                            <div class="perk-text-wrap">
                                {@html $t('treasury.perkCalendar')}
                            </div>
                        </div>

                        <div class="vip-perk-item">
                            <div class="perk-icon-wrap icon-offline">
                                <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                                    <circle cx="10" cy="10" r="8" fill="#1b1633" stroke="#a29bfe" stroke-width="1.2"/>
                                    <polyline points="10,6 10,10 13,12" stroke="#ffeaa7" stroke-width="1.5" stroke-linecap="round"/>
                                    <path d="M14 4 L17 7" stroke="#2ecc71" stroke-width="1.5" stroke-linecap="round"/>
                                </svg>
                            </div>
                            <div class="perk-text-wrap">
                                {@html $t('treasury.perk5')}
                            </div>
                        </div>

                        <div class="vip-perk-item">
                            <div class="perk-icon-wrap icon-cauldron">
                                <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                                    <ellipse cx="10" cy="14" rx="7" ry="4" fill="#1e272e" stroke="#2ed573" stroke-width="1.2"/>
                                    <path d="M4 14 C4 8 7 6 10 6 C13 6 16 8 16 14" fill="#1e272e" stroke="#2ed573" stroke-width="1.2"/>
                                    <circle cx="8" cy="10" r="1.2" fill="#55efc4"/>
                                    <circle cx="12" cy="9" r="1.5" fill="#2ed573"/>
                                    <line x1="8" y1="3" x2="12" y2="3" stroke="#ffd32a" stroke-width="1.5" stroke-linecap="round"/>
                                </svg>
                            </div>
                            <div class="perk-text-wrap">
                                {@html $t('treasury.perk6')}
                            </div>
                        </div>

                        <div class="vip-perk-item">
                            <div class="perk-icon-wrap icon-crown">
                                <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                                    <path d="M3 14 L17 14 L16 16 L4 16 Z" fill="#b7791f"/>
                                    <path d="M3 14 L17 14 L18 7 L13 11 L10 4 L7 11 L2 7 Z" fill="#f1c40f" stroke="#ffeaa7" stroke-width="1"/>
                                    <circle cx="10" cy="4" r="1.2" fill="#e74c3c"/>
                                    <circle cx="2" cy="7" r="1" fill="#3498db"/>
                                    <circle cx="18" cy="7" r="1" fill="#3498db"/>
                                </svg>
                            </div>
                            <div class="perk-text-wrap">
                                <span>{$t('treasury.perk7')}</span>
                            </div>
                        </div>
                    </div>

                    <!-- VIP Ergonomic Action Bar -->
                    <div class="vip-action-bar">
                        {#if $isVip}
                            <div class="vip-active-grid">
                                {#if $isVipDailyRewardAvailable}
                                    <button 
                                        type="button" 
                                        class="claim-vip-daily-btn" 
                                        on:click={handleClaimVipDaily}
                                        title={$t('treasury.claimVipDailyTitle')}
                                    >
                                        <ResourceIcon type="crystals" size={18} class="claim-gem-icon" />
                                        <span class="claim-btn-text">{$t('treasury.claimVipDailyBtn')}</span>
                                    </button>
                                {:else}
                                    <div class="vip-daily-collected-pill">
                                        <svg viewBox="0 0 16 16" width="15" height="15" fill="none">
                                            <circle cx="8" cy="8" r="7" fill="rgba(46, 204, 113, 0.2)" stroke="#2ecc71" stroke-width="1.2"/>
                                            <path d="M5 8 L7 10 L11 6" stroke="#2ecc71" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        <span class="collected-label">{$t('treasury.vipDayClaimed')}</span>
                                    </div>
                                {/if}

                                <button 
                                    type="button" 
                                    class="extend-vip-btn" 
                                    on:click={() => handleBuy('vip_status')} 
                                    disabled={isPurchasing}
                                    title={$t('treasury.extendVipTitle')}
                                >
                                    {#if isPurchasing}
                                        <span class="btn-spinner-sm"></span>
                                    {:else}
                                        <span class="extend-price">{getProductDisplayPrice('vip_status', `249 ${$t('bank.yanSuffix') || 'YAN'}`)}</span>
                                        <span class="extend-cta">{$t('treasury.extendVipCta')}</span>
                                    {/if}
                                </button>
                            </div>
                        {:else}
                            <button 
                                type="button"
                                class="buy-vip-btn" 
                                on:click={() => handleBuy('vip_status')} 
                                disabled={isPurchasing}
                            >
                                {#if isPurchasing}
                                    <span class="btn-spinner"></span>
                                {:else}
                                    <div class="buy-vip-btn-inner">
                                        <div class="buy-vip-price-wrap">
                                            <span class="btn-yan">{getProductDisplayPrice('vip_status', `249 ${$t('bank.yanSuffix') || 'YAN'}`)}</span>
                                            <span class="btn-yan-sub">/ 30 {$t('common.dayShort') || 'дн.'}</span>
                                        </div>
                                        <div class="buy-vip-text-wrap">
                                            <span class="btn-cta">{$t('treasury.buyVipCta')}</span>
                                            <span class="btn-bonus-tag">+50 💎 сразу</span>
                                        </div>
                                    </div>
                                {/if}
                            </button>
                        {/if}
                    </div>

                </div>
            </div>

            <!-- 2. Free Dragon Gift (Rewarded Ad Cooldown) -->
            <div class="dragon-gift-card">
                <div class="gift-icon-wrap">
                    <svg viewBox="0 0 44 44" width="38" height="38" fill="none">
                        <circle cx="22" cy="22" r="20" fill="#1b1236" stroke="#9b59b6" stroke-width="1.5"/>
                        <!-- Gift box -->
                        <rect x="11" y="18" width="22" height="16" rx="2" fill="#e74c3c" stroke="#c0392b" stroke-width="1.2"/>
                        <rect x="9" y="13" width="26" height="6" rx="2" fill="#c0392b"/>
                        <rect x="20" y="13" width="4" height="21" fill="#f1c40f"/>
                        <!-- Ribbon bow -->
                        <circle cx="18" cy="10" r="3" fill="none" stroke="#f1c40f" stroke-width="1.5"/>
                        <circle cx="26" cy="10" r="3" fill="none" stroke="#f1c40f" stroke-width="1.5"/>
                        <!-- Sparkles -->
                        <polygon points="34,10 35,13 38,14 35,15 34,18 33,15 30,14 33,13" fill="#ffeaa7"/>
                    </svg>
                </div>
                <div class="gift-info">
                    <div class="gift-title-row">
                        <span class="gift-title">{$t('treasury.dragonGiftTitle')}</span>
                        <span class="free-badge">{$t('treasury.dragonGiftFree')}</span>
                    </div>
                    <p class="gift-desc">{$t('treasury.dragonGiftDesc')}</p>
                </div>
                <div class="gift-action">
                    {#if secondsToDragonGift === 0}
                        <button 
                            type="button" 
                            class="claim-gift-btn" 
                            on:click={handleClaimDragonGift}
                        >
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="#f1c40f">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                            <span>{$t('treasury.dragonGiftClaim')}</span>
                        </button>
                    {:else}
                        <div class="gift-cooldown-badge">
                            <ResourceIcon type="time" size={14} />
                            <span>{formatTime(secondsToDragonGift)}</span>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- 3. Crystal Packs Grid -->
            <div class="packs-section-title">
                <ResourceIcon type="crystals" size={18} />
                <span>{$t('treasury.packsTitle')}</span>
            </div>

            <div class="crystal-packs-grid">

                <!-- Pack 1: 100 crystals -->
                <div class="pack-card">
                    <div class="pack-visual">
                        <svg viewBox="0 0 60 60" width="54" height="54" fill="none">
                            <circle cx="30" cy="30" r="24" fill="rgba(116, 185, 255, 0.12)"/>
                            <!-- Small crystal cluster -->
                            <polygon points="30,8 42,24 38,48 30,54 22,48 18,24" fill="#74b9ff" stroke="#0984e3" stroke-width="1.2"/>
                            <polygon points="30,8 42,24 30,28" fill="#a29bfe" opacity="0.8"/>
                            <polygon points="30,8 18,24 30,28" fill="#dff9fb" opacity="0.9"/>
                            <line x1="26" y1="14" x2="28" y2="22" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <div class="pack-details">
                        <h4 class="pack-name">{$t('treasury.pack1Name')}</h4>
                        <div class="pack-amount">
                            <ResourceIcon type="crystals" size={16} />
                            <span>+100</span>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        class="buy-pack-btn" 
                        on:click={() => handleBuy('pack_crystals_100')} 
                        disabled={isPurchasing}
                    >
                        {getProductDisplayPrice('pack_crystals_100', `100 ${$t('bank.yanSuffix') || 'YAN'}`)}
                    </button>
                </div>

                <!-- Pack 2: 300 + 50 bonus crystals -->
                <div class="pack-card featured-pack">
                    <div class="ribbon-tag">{$t('treasury.tagBestValue')}</div>
                    <div class="pack-visual">
                        <svg viewBox="0 0 60 60" width="54" height="54" fill="none">
                            <circle cx="30" cy="30" r="24" fill="rgba(162, 155, 254, 0.15)"/>
                            <!-- Chest of crystals -->
                            <rect x="10" y="24" width="40" height="24" rx="3" fill="#8B4513" stroke="#f1c40f" stroke-width="1.2"/>
                            <path d="M10 24 C10 16 16 12 30 12 C44 12 50 16 50 24 Z" fill="#a0522d" stroke="#f1c40f" stroke-width="1.2"/>
                            <polygon points="26,8 34,8 37,16 23,16" fill="#74b9ff" stroke="#0984e3" stroke-width="1"/>
                            <polygon points="34,10 42,10 45,17 31,17" fill="#a29bfe" stroke="#6c5ce7" stroke-width="1"/>
                            <circle cx="30" cy="33" r="3.5" fill="#f1c40f"/>
                        </svg>
                    </div>
                    <div class="pack-details">
                        <h4 class="pack-name">{$t('treasury.pack2Name')}</h4>
                        <div class="pack-amount">
                            <ResourceIcon type="crystals" size={16} />
                            <span>+350</span>
                            <span class="bonus-sub">{$t('treasury.bonusSub', { bonus: 50 })}</span>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        class="buy-pack-btn featured-btn" 
                        on:click={() => handleBuy('pack_crystals_300')} 
                        disabled={isPurchasing}
                    >
                        {getProductDisplayPrice('pack_crystals_300', `250 ${$t('bank.yanSuffix') || 'YAN'}`)}
                    </button>
                </div>

                <!-- Pack 3: 1000 + 250 bonus crystals -->
                <div class="pack-card royal-pack">
                    <div class="ribbon-tag hit-tag">{$t('treasury.tagHit')}</div>
                    <div class="pack-visual">
                        <svg viewBox="0 0 60 60" width="54" height="54" fill="none">
                            <defs>
                                <radialGradient id="royalCrystalsAura" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stop-color="#fd79a8"/>
                                    <stop offset="60%" stop-color="#6c5ce7"/>
                                    <stop offset="100%" stop-color="#0984e3"/>
                                </radialGradient>
                            </defs>
                            <circle cx="30" cy="30" r="26" fill="url(#royalCrystalsAura)" opacity="0.3"/>
                            <!-- Mountain of crystals -->
                            <polygon points="30,4 44,22 38,50 30,56 22,50 16,22" fill="#74b9ff" stroke="#ffeaa7" stroke-width="1.5"/>
                            <polygon points="14,24 24,14 26,38 12,38" fill="#a29bfe" stroke="#6c5ce7" stroke-width="1.2"/>
                            <polygon points="46,24 36,14 34,38 48,38" fill="#fd79a8" stroke="#e84393" stroke-width="1.2"/>
                            <!-- Shine stars -->
                            <polygon points="30,12 32,18 38,20 32,22 30,28 28,22 22,20 28,18" fill="#fff"/>
                        </svg>
                    </div>
                    <div class="pack-details">
                        <h4 class="pack-name">{$t('treasury.pack3Name')}</h4>
                        <div class="pack-amount">
                            <ResourceIcon type="crystals" size={16} />
                            <span>+1250</span>
                            <span class="bonus-sub">{$t('treasury.bonusSub', { bonus: 250 })}</span>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        class="buy-pack-btn royal-btn" 
                        on:click={() => handleBuy('pack_crystals_1000')} 
                        disabled={isPurchasing}
                    >
                        {getProductDisplayPrice('pack_crystals_1000', `650 ${$t('bank.yanSuffix') || 'YAN'}`)}
                    </button>
                </div>

            </div>

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
        z-index: 200;
        backdrop-filter: blur(8px);
    }

    .modal {
        background: linear-gradient(150deg, #1b0a33 0%, #100620 100%);
        border: 2px solid rgba(241, 196, 15, 0.4);
        border-radius: 20px;
        box-shadow: 0 0 40px rgba(0,0,0,0.8);
        width: 95%;
        max-width: 580px;
        max-height: 88vh;
        overflow-y: auto;
        color: white;
        padding: 20px;
        box-sizing: border-box;
    }

    .embedded {
        position: relative;
        background: transparent;
        backdrop-filter: none;
        z-index: 1;
        padding: 0;
        inset: auto;
        display: block;
    }

    .embedded-modal {
        box-shadow: none;
        border: none;
        border-radius: 0;
        width: 100%;
        max-width: none;
        max-height: none;
        background: transparent;
        padding: 4px 0 16px;
    }

    .tab-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        border-bottom: 1px solid rgba(241, 196, 15, 0.2);
        padding-bottom: 12px;
    }

    .tab-title-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .tab-title {
        font-size: 1.3rem;
        color: #ffeaa7;
        margin: 0;
    }

    .close-btn {
        background: none;
        border: none;
        color: #b2bec3;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        cursor: pointer;
        transition: color 0.15s, background 0.15s;
    }

    .close-btn:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.08);
    }

    .purchase-message {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(39, 174, 96, 0.2);
        border: 1px solid rgba(46, 204, 113, 0.5);
        border-radius: 10px;
        padding: 10px 14px;
        color: #2ecc71;
        font-size: 0.9rem;
        font-weight: bold;
        margin-bottom: 14px;
        animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .treasury-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    /* 0. Starter Pack Card */
    .starter-pack-card {
        position: relative;
        background: linear-gradient(135deg, rgba(68, 26, 117, 0.95) 0%, rgba(32, 10, 62, 0.98) 100%);
        border: 2px solid #f59e0b;
        border-radius: 18px;
        padding: 16px;
        overflow: hidden;
        box-shadow: 0 6px 24px rgba(245, 158, 11, 0.22), 0 0 16px rgba(168, 85, 247, 0.25);
        transition: transform 0.2s, box-shadow 0.2s;
        animation: starterPulse 3.5s infinite ease-in-out;
    }

    @keyframes starterPulse {
        0%, 100% {
            box-shadow: 0 6px 22px rgba(245, 158, 11, 0.22), 0 0 14px rgba(168, 85, 247, 0.25);
        }
        50% {
            box-shadow: 0 8px 30px rgba(245, 158, 11, 0.42), 0 0 22px rgba(241, 196, 15, 0.4);
        }
    }

    .starter-ribbon-badge {
        position: absolute;
        top: 12px;
        right: 14px;
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
        border: 1px solid #ff7675;
        border-radius: 8px;
        color: #ffffff;
        padding: 4px 10px;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 2px 10px rgba(231, 76, 60, 0.4);
        z-index: 5;
        pointer-events: none;
    }

    .ribbon-disc {
        font-size: 0.72rem;
        font-weight: 900;
        color: #ffeaa7;
    }

    .ribbon-val {
        font-size: 0.65rem;
        font-weight: 800;
        opacity: 0.95;
    }

    .starter-card-body {
        display: flex;
        align-items: center;
        gap: 16px;
        position: relative;
        z-index: 2;
    }

    .starter-visual-box {
        flex-shrink: 0;
    }

    .starter-info-box {
        flex: 1;
    }

    .starter-title {
        margin: 0 0 4px;
        font-size: 1.08rem;
        font-weight: 800;
        color: #ffeaa7;
        letter-spacing: 0.2px;
    }

    .starter-desc {
        margin: 0 0 6px;
        font-size: 0.76rem;
        color: #dcdde1;
        line-height: 1.2;
    }

    .starter-perks-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 6px 8px;
    }

    .starter-perks-list li {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.74rem;
        color: #f1f2f6;
        background: rgba(0, 0, 0, 0.28);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        padding: 2px 7px;
    }

    .starter-action-box {
        flex-shrink: 0;
    }

    .buy-starter-btn {
        min-height: 44px;
        padding: 8px 16px;
        background: linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%);
        border: 1.5px solid #fffbeb;
        border-radius: 12px;
        color: #1a0a2a;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(245, 158, 11, 0.45);
        transition: transform 0.15s ease, filter 0.15s ease;
    }

    .buy-starter-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        filter: brightness(1.1);
        box-shadow: 0 6px 20px rgba(245, 158, 11, 0.6);
    }

    .buy-starter-btn:active:not(:disabled) {
        transform: scale(0.97);
    }

    .starter-yan-price {
        font-size: 1.05rem;
        font-weight: 900;
        line-height: 1.1;
    }

    .starter-cta-label {
        font-size: 0.68rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        opacity: 0.9;
    }

    /* 1. VIP Card */
    .vip-card {
        position: relative;
        background: linear-gradient(145deg, rgba(46, 26, 80, 0.95) 0%, rgba(26, 12, 48, 0.98) 100%);
        border: 1.5px solid rgba(241, 196, 15, 0.55);
        border-radius: 16px;
        padding: 12px 14px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45), 0 0 16px rgba(241, 196, 15, 0.12);
        transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    }

    .vip-card.vip-active {
        border-color: #2ecc71;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45), 0 0 16px rgba(46, 204, 113, 0.2);
    }

    .vip-content {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    /* VIP Top Header */
    .vip-top-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding-bottom: 6px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .vip-brand-group {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
    }

    .vip-crown-badge {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.2) 0%, rgba(230, 126, 34, 0.12) 100%);
        border: 1px solid rgba(241, 196, 15, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 0 10px rgba(241, 196, 15, 0.2);
    }

    .vip-titles {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
    }

    .vip-title {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 800;
        color: #f1c40f;
        letter-spacing: 0.2px;
        text-shadow: 0 1px 3px rgba(0,0,0,0.6);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .vip-subtitle {
        font-size: 0.70rem;
        color: #b2bec3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .vip-status-box {
        flex-shrink: 0;
    }

    .vip-badge-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: linear-gradient(90deg, #f39c12, #d35400);
        color: #ffffff;
        font-size: 0.68rem;
        font-weight: 800;
        padding: 3px 8px;
        border-radius: 16px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }

    .vip-badge-tag.vip-active-tag {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border: 1px solid #34d399;
        box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
    }

    .status-days-text {
        white-space: nowrap;
    }

    /* 2-Column Structured Benefits Matrix */
    .vip-perks-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 6px 10px;
        margin: 0;
    }

    .vip-perk-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 8px;
        background: rgba(255, 255, 255, 0.035);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 8px;
        transition: background 0.15s, border-color 0.15s;
    }

    .vip-perk-item:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(241, 196, 15, 0.25);
    }

    .vip-perk-item.highlight-altar {
        background: rgba(0, 206, 201, 0.08);
        border-color: rgba(0, 206, 201, 0.25);
    }

    .perk-icon-wrap {
        width: 22px;
        height: 22px;
        border-radius: 6px;
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .perk-text-wrap {
        font-size: 0.74rem;
        color: #dfe6e9;
        line-height: 1.2;
        min-width: 0;
    }

    .perk-text-wrap :global(strong) {
        color: #ffeaa7;
        font-weight: 700;
    }

    /* VIP Action Bar */
    .vip-action-bar {
        margin-top: 2px;
        width: 100%;
    }

    .vip-active-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        align-items: stretch;
    }

    .claim-vip-daily-btn {
        height: 42px;
        background: linear-gradient(135deg, #0984e3 0%, #00cec9 100%);
        border: 1.5px solid #74b9ff;
        border-radius: 10px;
        padding: 0 12px;
        color: #ffffff;
        font-weight: 800;
        font-size: 0.88rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        box-shadow: 0 4px 14px rgba(9, 132, 227, 0.4);
        animation: pulseVipBtn 2s infinite ease-in-out;
        transition: transform 0.15s, filter 0.15s;
    }

    .claim-vip-daily-btn:hover {
        transform: translateY(-2px);
        filter: brightness(1.15);
        box-shadow: 0 6px 18px rgba(0, 206, 201, 0.55);
    }

    .claim-vip-daily-btn:active {
        transform: scale(0.98);
    }

    .claim-btn-text {
        letter-spacing: 0.2px;
    }

    .vip-daily-collected-pill {
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        background: rgba(46, 204, 113, 0.12);
        border: 1.5px solid rgba(46, 204, 113, 0.4);
        border-radius: 10px;
        padding: 0 10px;
        color: #2ecc71;
        font-size: 0.82rem;
        font-weight: 800;
        box-sizing: border-box;
    }

    .extend-vip-btn {
        height: 42px;
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.16) 0%, rgba(230, 126, 34, 0.12) 100%);
        border: 1.5px solid rgba(241, 196, 15, 0.55);
        border-radius: 10px;
        padding: 0 10px;
        color: #f1c40f;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        transition: background 0.15s, border-color 0.15s, transform 0.15s;
    }

    .extend-vip-btn:hover:not(:disabled) {
        background: rgba(241, 196, 15, 0.28);
        border-color: #f1c40f;
        transform: translateY(-1px);
        box-shadow: 0 3px 10px rgba(241, 196, 15, 0.22);
    }

    .extend-vip-btn:active:not(:disabled) {
        transform: scale(0.98);
    }

    .extend-price {
        font-size: 0.90rem;
        font-weight: 900;
        line-height: 1.1;
    }

    .extend-cta {
        font-size: 0.62rem;
        font-weight: 800;
        text-transform: uppercase;
        opacity: 0.9;
        letter-spacing: 0.3px;
    }

    .buy-vip-btn {
        width: 100%;
        min-height: 44px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
        border: 1.5px solid #fde68a;
        border-radius: 12px;
        padding: 6px 14px;
        color: #ffffff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
        transition: transform 0.15s, filter 0.15s, box-shadow 0.15s;
    }

    .buy-vip-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        filter: brightness(1.1);
        box-shadow: 0 6px 20px rgba(245, 158, 11, 0.55);
    }

    .buy-vip-btn:active:not(:disabled) {
        transform: scale(0.98);
    }

    .buy-vip-btn-inner {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }

    .buy-vip-price-wrap {
        display: flex;
        align-items: baseline;
        gap: 4px;
    }

    .buy-vip-price-wrap .btn-yan {
        font-size: 1.18rem;
        font-weight: 900;
        color: #ffffff;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    }

    .buy-vip-price-wrap .btn-yan-sub {
        font-size: 0.72rem;
        color: #fef3c7;
        font-weight: 700;
    }

    .buy-vip-text-wrap {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 1px;
    }

    .buy-vip-text-wrap .btn-cta {
        font-size: 0.84rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: #ffffff;
    }

    .buy-vip-text-wrap .btn-bonus-tag {
        font-size: 0.65rem;
        font-weight: 800;
        color: #fef08a;
    }

    .btn-spinner-sm {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(241, 196, 15, 0.3);
        border-top-color: #f1c40f;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    /* 2. Free Dragon Gift */
    .dragon-gift-card {
        background: rgba(155, 89, 182, 0.12);
        border: 1px solid rgba(162, 155, 254, 0.35);
        border-radius: 14px;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 14px;
    }

    .gift-info {
        flex: 1;
    }

    .gift-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 3px;
    }

    .gift-title {
        font-size: 0.98rem;
        font-weight: 800;
        color: #a29bfe;
    }

    .free-badge {
        background: #27ae60;
        color: #fff;
        font-size: 0.65rem;
        font-weight: 800;
        padding: 1px 6px;
        border-radius: 4px;
    }

    .gift-desc {
        margin: 0;
        font-size: 0.8rem;
        color: #b2bec3;
    }

    .claim-gift-btn {
        background: linear-gradient(135deg, #8e44ad, #6c5ce7);
        border: 1px solid #a29bfe;
        border-radius: 10px;
        padding: 8px 14px;
        color: #fff;
        font-size: 0.85rem;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 12px rgba(108, 92, 231, 0.3);
        transition: transform 0.15s;
    }

    .claim-gift-btn:hover {
        transform: translateY(-2px);
    }

    .gift-cooldown-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 8px 12px;
        border-radius: 10px;
        color: #b2bec3;
        font-size: 0.85rem;
        font-weight: 700;
    }

    /* 3. Packs Grid */
    .packs-section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.05rem;
        font-weight: 800;
        color: #74b9ff;
        margin-top: 4px;
    }

    .crystal-packs-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
    }

    .pack-card {
        position: relative;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 14px;
        padding: 14px 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 8px;
        transition: transform 0.2s, border-color 0.2s;
    }

    .pack-card:hover {
        transform: translateY(-2px);
        border-color: rgba(116, 185, 255, 0.4);
    }

    .featured-pack {
        border-color: rgba(162, 155, 254, 0.4);
        background: linear-gradient(180deg, rgba(162, 155, 254, 0.08) 0%, rgba(255,255,255,0.02) 100%);
    }

    .royal-pack {
        border-color: rgba(241, 196, 15, 0.45);
        background: linear-gradient(180deg, rgba(241, 196, 15, 0.08) 0%, rgba(255,255,255,0.02) 100%);
    }

    .ribbon-tag {
        position: absolute;
        top: -8px;
        right: 8px;
        background: #6c5ce7;
        color: #fff;
        font-size: 0.62rem;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    }

    .hit-tag {
        background: #e74c3c;
    }

    .pack-name {
        margin: 0 0 4px;
        font-size: 0.85rem;
        color: #dfe6e9;
        font-weight: 700;
    }

    .pack-amount {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        font-size: 1.15rem;
        font-weight: 900;
        color: #74b9ff;
        flex-wrap: wrap;
    }

    .bonus-sub {
        display: block;
        width: 100%;
        font-size: 0.7rem;
        color: #f1c40f;
        font-weight: 800;
    }

    .buy-pack-btn {
        width: 100%;
        min-height: 44px;
        margin-top: auto;
        background: linear-gradient(135deg, #0984e3, #74b9ff);
        border: none;
        border-radius: 8px;
        padding: 8px 10px;
        color: #fff;
        font-size: 0.92rem;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: filter 0.15s, transform 0.15s;
    }

    .buy-pack-btn:hover:not(:disabled) {
        filter: brightness(1.1);
    }

    .featured-btn {
        background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    }

    .royal-btn {
        background: linear-gradient(135deg, #d35400, #f1c40f);
        color: #1a0a2e;
    }

    .btn-spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* Mobile adjustments */
    @media (max-width: 680px) {
        .starter-card-body {
            flex-direction: column;
            text-align: center;
        }
        .starter-heading-row {
            justify-content: center;
        }
        .starter-action-box {
            width: 100%;
        }
        .buy-starter-btn {
            width: 100%;
        }
        .starter-perks-list li {
            justify-content: center;
        }
        .vip-top-header {
            flex-wrap: wrap;
            gap: 8px;
        }
        .vip-perks-grid {
            grid-template-columns: 1fr;
            gap: 6px;
        }
        .vip-active-grid {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }
        .buy-vip-btn-inner {
            flex-direction: row;
            gap: 8px;
        }
        .crystal-packs-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
        }
        .pack-card {
            padding: 8px 4px;
        }
        .pack-visual svg {
            width: 38px;
            height: 38px;
        }
        .pack-name {
            font-size: 0.66rem;
        }
        .pack-amount {
            font-size: 0.74rem;
        }
        .buy-pack-btn {
            font-size: 0.70rem;
            padding: 6px 2px;
        }
        .dragon-gift-card {
            flex-direction: column;
            text-align: center;
            gap: 10px;
            padding: 14px 12px;
        }
        .gift-info {
            width: 100%;
        }
        .gift-title-row {
            justify-content: center;
        }
        .gift-desc {
            text-align: center;
            margin: 0;
        }
        .gift-action {
            width: 100%;
            display: flex;
            justify-content: center;
        }
        .claim-gift-btn {
            width: 100%;
            max-width: 220px;
            justify-content: center;
        }
        .gift-cooldown-badge {
            margin: 0 auto;
        }
    }
</style>
