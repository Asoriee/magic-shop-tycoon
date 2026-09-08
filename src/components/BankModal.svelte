<script lang="ts">
    import { crystals, isVip, gameStore, formatNumber } from '../store';
    import { purchaseItem } from '../yandex-sdk';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void;

    let isPurchasing = false;
    let purchaseMessage = '';
    let messageTimeout: number;

    function showMessage(msg: string) {
        purchaseMessage = msg;
        clearTimeout(messageTimeout);
        messageTimeout = setTimeout(() => { purchaseMessage = ''; }, 3000);
    }

    async function handleBuy(itemId: string) {
        if (isPurchasing) return;
        isPurchasing = true;
        purchaseMessage = '';

        try {
            await purchaseItem(itemId);
            if (itemId === 'pack_crystals_100') {
                showMessage('Вы получили 100 Кристаллов!');
            } else if (itemId === 'vip_status') {
                showMessage('VIP-статус активирован!');
                onClose();
            }
        } catch (e: any) {
            // User likely cancelled the payment
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
</script>

{#if isOpen}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="overlay" class:embedded={isEmbedded} on:click={onClose}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal" class:embedded-modal={isEmbedded} on:click|stopPropagation>

        <div class="tab-header">
            <div class="tab-title-row">
                <div class="header-icon">
                    <svg viewBox="0 0 80 60" width="40" height="30">
                        <rect x="5" y="28" width="70" height="27" rx="5" fill="#8B4513"/>
                        <rect x="5" y="28" width="70" height="8" rx="2" fill="#5C2E00"/>
                        <rect x="5" y="5" width="70" height="25" rx="5" fill="#A0522D"/>
                        <rect x="5" y="5" width="70" height="8" rx="2" fill="#7A3B1E"/>
                        <!-- Lock -->
                        <rect x="30" y="24" width="20" height="14" rx="4" fill="#FFD700"/>
                        <circle cx="40" cy="28" r="5" fill="#B8860B" stroke="#FFD700" stroke-width="1.5"/>
                        <!-- Straps -->
                        <rect x="5" y="28" width="70" height="4" fill="#D4AC6E" opacity="0.6"/>
                        <rect x="5" y="14" width="70" height="4" fill="#D4AC6E" opacity="0.6"/>
                        <!-- Jewels -->
                        <circle cx="20" cy="16" r="4" fill="#e74c3c" opacity="0.9"/>
                        <circle cx="60" cy="16" r="4" fill="#3498db" opacity="0.9"/>
                    </svg>
                </div>
                <h2 class="tab-title">Магическая Сокровищница</h2>
            </div>
            <p class="header-sub">Приобретайте премиум-валюту и бонусы</p>

            <div class="balance-row">
                <div class="balance-chip crystal">
                    <span class="icon">★</span>
                    <span>{formatNumber($crystals)} кристаллов</span>
                </div>
                <div class="balance-chip gold">
                    <span class="icon">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
                            <circle cx="12" cy="12" r="9" fill="#f1c40f" stroke="#d4ac0d" stroke-width="2"/>
                            <circle cx="12" cy="12" r="5" fill="#f39c12"/>
                        </svg>
                    </span>
                    <span>{formatNumber($gameStore.gold)} золота</span>
                </div>
                {#if $isVip}
                    <div class="vip-badge">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                            <path d="M4 17 L20 17 L22 8 L17 12 L12 4 L7 12 L2 8 Z" fill="#f1c40f" stroke="#d4ac0d" stroke-width="1.5"/>
                            <circle cx="12" cy="17" r="1.5" fill="#e74c3c"/>
                        </svg>
                        <span>VIP</span>
                    </div>
                {/if}
            </div>

            {#if !isEmbedded}
                <button class="close-btn" on:click={onClose}>✕</button>
            {/if}
        </div>

        <!-- Message Banner -->
        {#if purchaseMessage}
            <div class="purchase-message">{purchaseMessage}</div>
        {/if}

        <!-- Items -->
        <div class="items-grid">

            <!-- Item 1: Crystal Pack -->
            <div class="shop-item crystals-item">
                <div class="item-visual">
                    <svg viewBox="0 0 80 80" width="80" height="80">
                        <defs>
                            <filter id="crystalGlow" x="-30%" y="-30%" width="160%" height="160%">
                                <feGaussianBlur stdDeviation="4" result="blur"/>
                                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                            </filter>
                        </defs>
                        <!-- Main large crystal -->
                        <polygon points="40,8 55,30 50,58 40,65 30,58 25,30" fill="#74b9ff" filter="url(#crystalGlow)" opacity="0.9"/>
                        <polygon points="40,8 55,30 40,35" fill="#a29bfe" opacity="0.8"/>
                        <!-- Smaller crystals -->
                        <polygon points="18,35 26,50 22,63 16,63 12,50" fill="#a29bfe" opacity="0.8"/>
                        <polygon points="62,35 70,50 66,63 60,63 56,50" fill="#0984e3" opacity="0.8"/>
                        <!-- Shine -->
                        <line x1="35" y1="14" x2="38" y2="25" stroke="white" stroke-width="2" opacity="0.6"/>
                    </svg>
                </div>
                <div class="item-info">
                    <h3>Горсть Кристаллов</h3>
                    <p class="item-desc">100 магических кристаллов — редкая валюта для особых предложений</p>
                    <div class="item-reward">
                        <svg viewBox="0 0 20 20" width="16" height="16">
                            <polygon points="10,2 12.9,7 18.5,7.6 14.5,11.5 15.6,17.1 10,14.2 4.4,17.1 5.5,11.5 1.5,7.6 7.1,7" fill="#74b9ff"/>
                        </svg>
                        <span>+100 Кристаллов</span>
                    </div>
                </div>
                <button 
                    class="buy-btn crystals-btn" 
                    on:click={() => handleBuy('pack_crystals_100')} 
                    disabled={isPurchasing}
                >
                    {#if isPurchasing}
                        <span class="spinner-small"></span>
                    {:else}
                        Купить за 100 ЯН
                    {/if}
                </button>
            </div>

            <!-- Item 2: VIP Status -->
            <div class="shop-item vip-item" class:already-owned={$isVip}>
                <div class="item-visual">
                    <svg viewBox="0 0 80 80" width="80" height="80">
                        <defs>
                            <filter id="vipGlow" x="-30%" y="-30%" width="160%" height="160%">
                                <feGaussianBlur stdDeviation="5" result="blur"/>
                                <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                            </filter>
                        </defs>
                        <!-- Crown -->
                        <path d="M10,55 L10,30 L27,45 L40,15 L53,45 L70,30 L70,55 Z" fill="#f1c40f" filter="url(#vipGlow)"/>
                        <path d="M10,55 L70,55 L68,62 L12,62 Z" fill="#e67e22"/>
                        <!-- Jewels on crown -->
                        <circle cx="40" cy="18" r="5" fill="#e74c3c"/>
                        <circle cx="18" cy="45" r="4" fill="#3498db"/>
                        <circle cx="62" cy="45" r="4" fill="#2ecc71"/>
                        <!-- Stars around crown -->
                        <text x="5" y="22" font-size="12" fill="#f1c40f" opacity="0.8">✦</text>
                        <text x="60" y="22" font-size="12" fill="#f1c40f" opacity="0.8">✦</text>
                    </svg>
                </div>
                <div class="item-info">
                    <h3>VIP Алхимик <span class="forever-tag">Навсегда</span></h3>
                    <ul class="vip-perks">
                        <li>
                            <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                                <path d="M2 12 L14 12 L15 5 L11 8 L8 3 L5 8 L1 5 Z" fill="#f1c40f" stroke="#d4ac0d" stroke-width="1"/>
                            </svg>
                            <span>Нет рекламы — награды сразу</span>
                        </li>
                        <li>
                            <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                                <polygon points="9,1 2,9 7,9 6,15 14,7 8,7" fill="#ffeaa7" stroke="#f1c40f" stroke-width="1"/>
                            </svg>
                            <span>×2 ко всему доходу (клик + пассивный)</span>
                        </li>
                        <li>
                            <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                                <circle cx="8" cy="8" r="6" fill="#a29bfe" stroke="#6c5ce7" stroke-width="1"/>
                                <circle cx="6" cy="6" r="1.5" fill="#ffffff" opacity="0.7"/>
                            </svg>
                            <span>Доступ к эксклюзивным бустам</span>
                        </li>
                    </ul>
                </div>
                {#if $isVip}
                    <div class="owned-label">
                        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,8 7,12 13,4"/>
                        </svg>
                        <span>Активирован</span>
                    </div>
                {:else}
                    <button 
                        class="buy-btn vip-btn" 
                        on:click={() => handleBuy('vip_status')} 
                        disabled={isPurchasing}
                    >
                        {#if isPurchasing}
                            <span class="spinner-small"></span>
                        {:else}
                            Купить за 350 ЯН
                        {/if}
                    </button>
                {/if}
            </div>

        </div>
    </div>
</div>
{/if}

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 200;
        backdrop-filter: blur(6px);
    }

    .modal {
        background: linear-gradient(145deg, #1a0a2e, #2d1b4e);
        border: 2px solid rgba(241, 196, 15, 0.4);
        border-radius: 24px;
        box-shadow: 
            0 0 40px rgba(241, 196, 15, 0.2),
            0 20px 60px rgba(0, 0, 0, 0.7),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        width: 90%;
        max-width: 480px;
        max-height: 90vh;
        overflow-y: auto;
        color: white;
        padding: 24px;
        animation: modalIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .embedded {
        position: relative;
        background: transparent;
        backdrop-filter: none;
        z-index: 1;
        padding: 0;
        inset: auto;
    }

    .embedded-modal {
        box-shadow: none;
        border: none;
        border-radius: 0;
        width: 100%;
        max-width: none;
        max-height: none;
        height: 100%;
        background: transparent;
        animation: none;
    }

    @keyframes modalIn {
        from { opacity: 0; transform: scale(0.85) translateY(20px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .close-btn {
        position: absolute;
        right: 16px;
        top: 16px;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        color: white;
        border-radius: 50%;
        width: 34px;
        height: 34px;
        cursor: pointer;
        font-size: 1rem;
        line-height: 1;
        transition: background 0.2s;
    }
    .close-btn:hover { background: rgba(255,255,255,0.2); }

    .vip-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: linear-gradient(90deg, #f1c40f, #e67e22);
        color: #1a0a2e;
        border-radius: 20px;
        padding: 4px 10px;
        font-size: 0.82rem;
        font-weight: bold;
    }

    .purchase-message {
        background: rgba(255,255,255,0.08);
        border-radius: 10px;
        padding: 10px 16px;
        margin-bottom: 16px;
        text-align: center;
        font-size: 0.95rem;
        border: 1px solid rgba(255,255,255,0.15);
        animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .items-grid {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .shop-item {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px;
        padding: 16px;
        display: grid;
        grid-template-columns: 80px 1fr;
        grid-template-rows: auto auto;
        gap: 10px 16px;
        transition: border-color 0.3s;
    }

    .crystals-item {
        border-color: rgba(116, 185, 255, 0.3);
    }
    .crystals-item:hover {
        border-color: rgba(116, 185, 255, 0.6);
    }

    .vip-item {
        border-color: rgba(241, 196, 15, 0.3);
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.05), rgba(230, 126, 34, 0.05));
    }
    .vip-item:hover:not(.already-owned) {
        border-color: rgba(241, 196, 15, 0.6);
    }

    .item-visual {
        grid-row: 1 / 3;
        display: flex;
        justify-content: center;
        align-items: center;
        filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));
    }

    .item-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    h3 {
        margin: 0;
        font-size: 1rem;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .forever-tag {
        font-size: 0.7rem;
        background: rgba(241, 196, 15, 0.2);
        border: 1px solid rgba(241, 196, 15, 0.5);
        color: #f1c40f;
        border-radius: 20px;
        padding: 2px 8px;
        font-weight: normal;
    }

    .item-desc {
        margin: 0;
        font-size: 0.8rem;
        color: rgba(255,255,255,0.6);
        line-height: 1.4;
    }

    .item-reward {
        display: flex;
        align-items: center;
        gap: 5px;
        color: #74b9ff;
        font-weight: bold;
        font-size: 0.9rem;
        margin-top: 4px;
    }

    .vip-perks {
        margin: 4px 0 0;
        padding-left: 0;
        list-style: none;
        font-size: 0.82rem;
        color: rgba(255,255,255,0.75);
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .vip-perks li {
        display: flex;
        align-items: center;
        gap: 7px;
    }

    .buy-btn {
        grid-column: 2;
        padding: 10px 16px;
        border: none;
        border-radius: 12px;
        font-size: 0.95rem;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.15s, filter 0.15s;
        letter-spacing: 0.5px;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
    }
    .buy-btn:hover:not(:disabled) {
        transform: scale(1.03);
        filter: brightness(1.15);
    }
    .buy-btn:active:not(:disabled) { transform: scale(0.97); }
    .buy-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .crystals-btn {
        background: linear-gradient(135deg, #0984e3, #74b9ff);
        color: white;
        box-shadow: 0 4px 15px rgba(9, 132, 227, 0.4);
    }

    .vip-btn {
        background: linear-gradient(135deg, #f39c12, #f1c40f);
        color: #1a0a2e;
        box-shadow: 0 4px 15px rgba(241, 196, 15, 0.4);
    }

    .owned-label {
        grid-column: 2;
        color: #2ecc71;
        font-weight: bold;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .spinner-small {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.4);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
</style>
