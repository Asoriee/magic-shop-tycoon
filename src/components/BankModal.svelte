<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { crystals, isVip, gameStore, formatNumber } from '../store';
    import { purchaseItem, showRewardedAd, saveGame } from '../yandex-sdk';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void;

    let isPurchasing = false;
    let purchaseMessage = '';
    let messageTimeout: any;

    // Cooldown for Dragon Gift: 15 minutes (900 seconds)
    const DRAGON_GIFT_COOLDOWN_MS = 15 * 60 * 1000;
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
                showMessage('Вы получили 100 Кристаллов!');
            } else if (itemId === 'pack_crystals_300') {
                showMessage('Вы получили 350 Кристаллов (с бонусом)!');
            } else if (itemId === 'pack_crystals_1000') {
                showMessage('Вы получили 1250 Кристаллов (с бонусом)!');
            } else if (itemId === 'vip_status') {
                showMessage('VIP-статус успешно активирован навсегда!');
            }
        } catch (e: any) {
            const errMsg = e?.message || '';
            if (errMsg.toLowerCase().includes('cancel') || errMsg.toLowerCase().includes('closed')) {
                showMessage('Покупка отменена.');
            } else {
                showMessage('Ошибка при покупке. Попробуйте позже.');
                console.error('Purchase error:', e);
            }
        } finally {
            isPurchasing = false;
        }
    }

    function handleClaimDragonGift() {
        if (secondsToDragonGift > 0) return;
        showRewardedAd(
            () => {
                crystals.update(n => n + 5);
                gameStore.claimDragonGift();
                saveGame();
                showMessage('Дар Дракона получен: +5 Кристаллов!');
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
                    <h2 class="tab-title">Сокровищница</h2>
                </div>
                <button class="close-btn" on:click={onClose} aria-label="Закрыть">✕</button>
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

            <!-- 1. VIP Flagship Card -->
            <div class="vip-card" class:vip-active={$isVip}>
                <div class="vip-glow"></div>
                <div class="vip-content">
                    <div class="vip-visual">
                        <svg viewBox="0 0 70 60" width="60" height="52" class="crown-svg">
                            <defs>
                                <radialGradient id="vipGoldAura" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stop-color="#ffeaa7"/>
                                    <stop offset="70%" stop-color="#f39c12"/>
                                    <stop offset="100%" stop-color="#d35400"/>
                                </radialGradient>
                                <filter id="vipGoldGlow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="3" result="blur"/>
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

                    <div class="vip-info">
                        <div class="vip-header-row">
                            <h3 class="vip-title">Статус VIP-Алхимика</h3>
                            <span class="vip-badge-tag">Навсегда</span>
                        </div>
                        <ul class="vip-perks">
                            <li>
                                <svg viewBox="0 0 16 16" width="13" height="13" fill="none" class="perk-icon">
                                    <path d="M3 8 L6 11 L13 4" stroke="#2ecc71" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <span>Без межстраничной рекламы (награды сразу)</span>
                            </li>
                            <li>
                                <svg viewBox="0 0 16 16" width="13" height="13" fill="none" class="perk-icon">
                                    <path d="M3 8 L6 11 L13 4" stroke="#2ecc71" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <span><strong>x2 ко всему доходу:</strong> пассивный доход и сила клика</span>
                            </li>
                            <li>
                                <svg viewBox="0 0 16 16" width="13" height="13" fill="none" class="perk-icon">
                                    <path d="M3 8 L6 11 L13 4" stroke="#2ecc71" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <span>Золотая корона и статус почетного жителя лавки</span>
                            </li>
                        </ul>
                    </div>

                    <div class="vip-action">
                        {#if $isVip}
                            <div class="vip-activated-pill">
                                <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                                    <circle cx="10" cy="10" r="8" fill="#27ae60"/>
                                    <path d="M6 10 L9 13 L14 7" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                                <span>АКТИВИРОВАН</span>
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
                                    <span class="btn-yan">350 ЯН</span>
                                    <span class="btn-cta">Активировать</span>
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
                        <span class="gift-title">Дар Дракона</span>
                        <span class="free-badge">БЕСПЛАТНО</span>
                    </div>
                    <p class="gift-desc">Посмотрите магическое видение и получите кристаллы</p>
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
                            <span>+5 Кристаллов</span>
                        </button>
                    {:else}
                        <div class="gift-cooldown-badge">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                                <circle cx="12" cy="12" r="9" stroke="#b2bec3" stroke-width="1.5"/>
                                <path d="M12 7 V12 L15 14" stroke="#b2bec3" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                            <span>{formatTime(secondsToDragonGift)}</span>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- 3. Crystal Packs Grid -->
            <div class="packs-section-title">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                    <polygon points="12,2 20,7 16,21 8,21 4,7" fill="#74b9ff" stroke="#0984e3" stroke-width="1.5"/>
                </svg>
                <span>Наборы Кристаллов</span>
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
                        <h4 class="pack-name">Горсть Кристаллов</h4>
                        <div class="pack-amount">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="#74b9ff">
                                <polygon points="12,2 20,7 16,21 8,21 4,7"/>
                            </svg>
                            <span>+100</span>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        class="buy-pack-btn" 
                        on:click={() => handleBuy('pack_crystals_100')} 
                        disabled={isPurchasing}
                    >
                        100 ЯН
                    </button>
                </div>

                <!-- Pack 2: 300 + 50 bonus crystals -->
                <div class="pack-card featured-pack">
                    <div class="ribbon-tag">ВЫГОДНО</div>
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
                        <h4 class="pack-name">Сундук Алхимика</h4>
                        <div class="pack-amount">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="#74b9ff">
                                <polygon points="12,2 20,7 16,21 8,21 4,7"/>
                            </svg>
                            <span>+350</span>
                            <span class="bonus-sub">+50 Бонус</span>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        class="buy-pack-btn featured-btn" 
                        on:click={() => handleBuy('pack_crystals_300')} 
                        disabled={isPurchasing}
                    >
                        250 ЯН
                    </button>
                </div>

                <!-- Pack 3: 1000 + 250 bonus crystals -->
                <div class="pack-card royal-pack">
                    <div class="ribbon-tag hit-tag">ХИТ</div>
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
                        <h4 class="pack-name">Казна Архимага</h4>
                        <div class="pack-amount">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="#74b9ff">
                                <polygon points="12,2 20,7 16,21 8,21 4,7"/>
                            </svg>
                            <span>+1250</span>
                            <span class="bonus-sub">+250 Бонус</span>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        class="buy-pack-btn royal-btn" 
                        on:click={() => handleBuy('pack_crystals_1000')} 
                        disabled={isPurchasing}
                    >
                        650 ЯН
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
        font-size: 1.4rem;
        cursor: pointer;
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

    /* 1. VIP Card */
    .vip-card {
        position: relative;
        background: linear-gradient(135deg, rgba(45, 27, 78, 0.9) 0%, rgba(30, 15, 55, 0.95) 100%);
        border: 1.5px solid rgba(241, 196, 15, 0.6);
        border-radius: 16px;
        padding: 16px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(241, 196, 15, 0.15);
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .vip-card.vip-active {
        border-color: #2ecc71;
        box-shadow: 0 4px 20px rgba(46, 204, 113, 0.2);
    }

    .vip-content {
        display: flex;
        align-items: center;
        gap: 16px;
        position: relative;
        z-index: 2;
    }

    .vip-visual {
        flex-shrink: 0;
    }

    .vip-info {
        flex: 1;
        min-width: 0;
    }

    .vip-header-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
    }

    .vip-title {
        margin: 0;
        font-size: 1.15rem;
        color: #f1c40f;
        text-shadow: 0 1px 4px rgba(0,0,0,0.6);
    }

    .vip-badge-tag {
        background: linear-gradient(90deg, #f39c12, #d35400);
        color: #fff;
        font-size: 0.68rem;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .vip-perks {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .vip-perks li {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.82rem;
        color: #dfe6e9;
    }

    .perk-icon {
        flex-shrink: 0;
    }

    .vip-action {
        flex-shrink: 0;
    }

    .buy-vip-btn {
        background: linear-gradient(135deg, #f1c40f, #e67e22);
        border: none;
        border-radius: 12px;
        padding: 10px 16px;
        color: #1a0a2e;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-shadow: 0 4px 15px rgba(241, 196, 15, 0.4);
        transition: transform 0.15s, filter 0.15s;
    }

    .buy-vip-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        filter: brightness(1.1);
    }

    .btn-yan {
        font-size: 1.1rem;
        font-weight: 900;
        line-height: 1.1;
    }

    .btn-cta {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
    }

    .vip-activated-pill {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(39, 174, 96, 0.25);
        border: 1px solid #2ecc71;
        padding: 8px 12px;
        border-radius: 10px;
        color: #2ecc71;
        font-size: 0.8rem;
        font-weight: 800;
        letter-spacing: 0.5px;
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
        margin-top: auto;
        background: linear-gradient(135deg, #0984e3, #74b9ff);
        border: none;
        border-radius: 8px;
        padding: 8px 10px;
        color: #fff;
        font-size: 0.92rem;
        font-weight: 800;
        cursor: pointer;
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
    @media (max-width: 520px) {
        .vip-content {
            flex-direction: column;
            text-align: center;
        }
        .vip-header-row {
            justify-content: center;
        }
        .vip-perks li {
            justify-content: center;
        }
        .crystal-packs-grid {
            grid-template-columns: 1fr;
        }
        .dragon-gift-card {
            flex-direction: column;
            text-align: center;
        }
    }
</style>
