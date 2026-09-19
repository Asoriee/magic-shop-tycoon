<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { get } from 'svelte/store';
    import gsap from 'gsap';
    import { 
        gameStore, 
        stableIdleIncome,
        ingredientsCount, 
        potionsCount, 
        AVAILABLE_INGREDIENTS, 
        AVAILABLE_POTIONS, 
        type CustomerOrder, 
        formatNumber,
        ORDER_SPAWN_INTERVAL_MS,
        getPetBonusValues
    } from '../store';
    import { showRewardedAd, saveGame } from '../yandex-sdk';
    import { playCoinSound, playSuccessSound } from '../audio';
    import { t, currentLang, getCustomerName, getCustomerArchetype, getIngredientName, getPotionName } from '../i18n';
    import ResourceIcon from './ResourceIcon.svelte';

    export let isEmbedded = false;

    // Toast notification for completed orders
    let toastMessage: string | null = null;
    let toastTimer: any;

    function showToast(msg: string) {
        toastMessage = msg;
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toastMessage = null;
        }, 3400);
    }

    export function getDynamicOrderGold(order: CustomerOrder, idleIncome: number): number {
        const goldSecs = order.goldSeconds
            ? Math.min(order.goldSeconds, order.isVip ? 120 : (order.requirements.some(r => r.type === 'potion') ? 60 : 30))
            : (order.isVip ? 120 : (order.requirements.some(r => r.type === 'potion') ? 60 : 30));
        const minFloor = order.minGold
            ? Math.min(order.minGold, order.isVip ? 25000 : (order.requirements.some(r => r.type === 'potion') ? 5000 : 1000))
            : (order.isVip ? 25000 : (order.requirements.some(r => r.type === 'potion') ? 5000 : 1000));
        const base = Math.max(minFloor, Math.round((idleIncome || 0) * goldSecs));

        const ordersLevel = $gameStore.secretUpgrades?.find(u => u.id === 'orders')?.level || 0;
        const isBoosted = ($gameStore.secretKnowledgeBoostUntil || 0) > Date.now();
        const boostMult = isBoosted ? 1.5 : 1;
        let goldMultiplier = 1 + (ordersLevel * 0.15 * boostMult);
        if ($gameStore.artifacts?.includes(8)) goldMultiplier += 0.40;
        if ($gameStore.unlockedCollections?.includes('phoenix_set')) goldMultiplier += 0.30;
        if ($gameStore.activeCompanionId) {
            const compLvl = $gameStore.petLevels?.[$gameStore.activeCompanionId] || 1;
            const compBonus = getPetBonusValues($gameStore.activeCompanionId, compLvl);
            if (compBonus.orderBonus > 0) {
                goldMultiplier += compBonus.orderBonus;
            }
        }

        return Math.floor(base * goldMultiplier);
    }

    // ----------------------------------------------------------------
    // Spawn logic: глобальный цикл появления заказа — 3 минуты
    // ----------------------------------------------------------------
    let secondsToNext = 0;
    let tickInterval: any;

    function updateCountdown() {
        const now = Date.now();
        if ($gameStore.activeOrders.length >= 4) {
            secondsToNext = 0;
            return;
        }

        const lastSpawn = $gameStore.lastOrderSpawnTime || now;
        const elapsed = now - lastSpawn;
        const remainingMs = Math.max(0, ORDER_SPAWN_INTERVAL_MS - elapsed);
        secondsToNext = Math.ceil(remainingMs / 1000);

        if (remainingMs <= 0 && $gameStore.activeOrders.length < 4) {
            gameStore.checkOrderSpawns();
        }
    }

    $: mins = Math.floor(secondsToNext / 60);
    $: secs = secondsToNext % 60;

    onMount(() => {
        gameStore.checkOrderSpawns();
        updateCountdown();
        tickInterval = setInterval(updateCountdown, 1000);
    });

    onDestroy(() => {
        if (tickInterval) clearInterval(tickInterval);
        if (toastTimer) clearTimeout(toastTimer);
    });

    function getRequirementItem(type: 'ingredient' | 'potion', id: string) {
        if (type === 'ingredient') return AVAILABLE_INGREDIENTS.find(i => i.id === id);
        if (type === 'potion') return AVAILABLE_POTIONS.find(p => p.id === id);
        return null;
    }

    function checkCanFulfill(order: CustomerOrder) {
        for (const req of order.requirements) {
            if (req.type === 'ingredient') {
                if (($ingredientsCount[req.id] || 0) < req.count) return false;
            } else {
                if (($potionsCount[req.id] || 0) < req.count) return false;
            }
        }
        return true;
    }

    function fulfillOrder(order: CustomerOrder) {
        if (!checkCanFulfill(order)) {
            const el = document.getElementById(`order-${order.id}`);
            if (el) {
                gsap.fromTo(el, 
                    { x: -6 }, 
                    { x: 6, duration: 0.05, yoyo: true, repeat: 4, onComplete: () => gsap.set(el, { x: 0 }) }
                );
            }
            return;
        }

        const complete = () => {
            // Deduct items
            for (const req of order.requirements) {
                if (req.type === 'ingredient') {
                    ingredientsCount.update(c => {
                        const next = { ...c };
                        next[req.id] = (next[req.id] || 0) - req.count;
                        if (next[req.id] <= 0) delete next[req.id];
                        return next;
                    });
                } else {
                    potionsCount.update(c => {
                        const next = { ...c };
                        next[req.id] = (next[req.id] || 0) - req.count;
                        if (next[req.id] <= 0) delete next[req.id];
                        return next;
                    });
                }
            }

            const dynGold = getDynamicOrderGold(order, $stableIdleIncome || 0);
            const localizedCustName = getCustomerName(order.name, get(currentLang));
            const crystalTxt = order.rewardCrystals ? `, ${get(t)('orders.crystalsReward', { count: order.rewardCrystals })}` : '';
            let chestName = '';
            if (order.rewardChest) {
                chestName = `, ${get(t)(`chests.${order.rewardChest}`)}`;
            }
            const toastMsg = get(t)('orders.orderCompletedToast', {
                name: localizedCustName,
                gold: formatNumber(dynGold),
                crystals: crystalTxt,
                chest: chestName
            });
            
            // Complete animation
            const el = document.getElementById(`order-${order.id}`);
            if (el) {
                gsap.to(el, {
                    scale: 1.06,
                    opacity: 0,
                    y: -20,
                    duration: 0.35,
                    ease: 'power2.in',
                    onComplete: () => {
                        gameStore.completeOrder(order.id);
                        if (order.isVip || order.orderType === 'potion' || order.rewardChest) {
                            playSuccessSound();
                        } else {
                            playCoinSound();
                        }
                        showToast(toastMsg);
                        saveGame();
                    }
                });
            } else {
                gameStore.completeOrder(order.id);
                if (order.isVip || order.orderType === 'potion' || order.rewardChest) {
                    playSuccessSound();
                } else {
                    playCoinSound();
                }
                showToast(toastMsg);
                saveGame();
            }
        };

        if (order.isVip) {
            showRewardedAd(() => {
                complete();
                gameStore.updateQuestProgress('watch_ads', 1);
            }, () => {});
        } else {
            complete();
        }
    }

    function dismissOrder(order: CustomerOrder) {
        const el = document.getElementById(`order-${order.id}`);
        if (el) {
            gsap.to(el, {
                scale: 0.85,
                opacity: 0,
                x: -30,
                duration: 0.25,
                onComplete: () => {
                    gameStore.dismissOrder(order.id);
                    saveGame();
                }
            });
        } else {
            gameStore.dismissOrder(order.id);
            saveGame();
        }
    }

    function summonCaravanAd() {
        if ($gameStore.activeOrders.length >= 4) return;
        showRewardedAd(() => {
            gameStore.spawnOrder();
            gameStore.updateQuestProgress('watch_ads', 1);
            showToast(get(t)('orders.caravanArrivedToast'));
            saveGame();
        }, undefined, () => {
            showToast(get(t)('orders.videoLoadError'));
        });
    }
</script>

<div class="orders-wrapper" class:standalone={!isEmbedded}>
    <!-- Toast Feedback -->
    {#if toastMessage}
        <div class="order-toast">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#2ed573" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{toastMessage}</span>
        </div>
    {/if}

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
                <h2 class="tab-title">{$t('orders.title')}</h2>
            </div>
            <p class="header-sub">{$t('orders.title')}</p>
        </div>
    {/if}

    <!-- Caravan status bar -->
    <div class="caravan-bar">
        <div class="caravan-info">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" class="caravan-svg">
                <path d="M4 14 L20 14 L18 8 L6 8 Z" fill="#e67e22" stroke="#d35400" stroke-width="1.5"/>
                <circle cx="7" cy="16" r="3" fill="#2d3436" stroke="#f1c40f" stroke-width="1.5"/>
                <circle cx="17" cy="16" r="3" fill="#2d3436" stroke="#f1c40f" stroke-width="1.5"/>
                <path d="M12 4 L12 8 M9 6 L15 6" stroke="#f1c40f" stroke-width="1.5"/>
            </svg>
            <div class="caravan-text">
                <span class="caravan-title">{$t('city.tabOrders')}</span>
                <span class="caravan-sub">
                    {#if $gameStore.activeOrders.length >= 4}
                        4 / 4 ({$t('common.maxLevel')})
                    {:else}
                        {@const mins = Math.floor(secondsToNext / 60)}
                        {@const secs = secondsToNext % 60}
                        {$t('orders.refreshTimer', { time: `${mins}:${secs.toString().padStart(2, '0')}` })}
                    {/if}
                </span>
            </div>
        </div>
        <div class="caravan-actions">
            {#if $gameStore.activeOrders.length < 4}
                <button type="button" class="summon-mini-btn" on:click={summonCaravanAd} title="{$t('common.watchAd')}">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                        <polygon points="5,3 19,12 5,21"/>
                    </svg>
                    <span>+1 {$t('city.tabOrders')}</span>
                </button>
            {/if}
            <div class="orders-count-badge">
                {$gameStore.activeOrders.length} / 4
            </div>
        </div>
    </div>

    <!-- Orders Grid -->
    <div class="orders-grid">
        {#each $gameStore.activeOrders as order (order.id)}
            {@const canFulfill = checkCanFulfill(order)}
            {@const dynGold = getDynamicOrderGold(order, $stableIdleIncome || 0)}
            {@const localizedCustName = getCustomerName(order.name, $currentLang)}
            {@const archetype = getCustomerArchetype(order.name, order.isVip, order.orderType)}
            <div class="order-card" class:vip={order.isVip} id="order-{order.id}">
                <button 
                    type="button" 
                    class="dismiss-btn" 
                    on:click|stopPropagation={() => dismissOrder(order)} 
                    title="{$t('orders.dismiss')}"
                    aria-label="{$t('orders.dismiss')}"
                >
                    &times;
                </button>
                
                <div class="customer-row">
                    <div class="customer-avatar" class:vip={order.isVip}>
                        {#if archetype === 'vip'}
                            <ResourceIcon type="vip" size={26} />
                        {:else if archetype === 'mage'}
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                                <polygon points="12,2 19,10 17,20 7,20 5,10" fill="#6c5ce7" stroke="#a29bfe" stroke-width="1.5"/>
                                <circle cx="12" cy="11" r="2.5" fill="#ffeaa7"/>
                            </svg>
                        {:else if archetype === 'knight'}
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                                <path d="M7 5 C7 3 17 3 17 5 L17 14 C17 19 12 21 12 21 C12 21 7 19 7 14 Z" fill="#74b9ff" stroke="#0984e3" stroke-width="1.5"/>
                                <line x1="9" y1="10" x2="15" y2="10" stroke="#2d3436" stroke-width="2"/>
                            </svg>
                        {:else}
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                                <circle cx="12" cy="9" r="5" fill="#ffeaa7" stroke="#fdcb6e" stroke-width="1.5"/>
                                <path d="M5 20 C5 15 8 14 12 14 C16 14 19 15 19 20" fill="#e17055" stroke="#d63031" stroke-width="1.5"/>
                            </svg>
                        {/if}
                    </div>

                    <div class="customer-info">
                        <div class="name-line">
                            <span class="customer-name">{localizedCustName}</span>
                            {#if order.isVip}
                                <span class="order-badge vip-badge">{$t('orders.vipOrder').toUpperCase()}</span>
                            {:else if order.orderType === 'potion' || order.requirements.some(r => r.type === 'potion')}
                                <span class="order-badge potion-badge">{$t('alchemy.tabBrew').toUpperCase()}</span>
                            {/if}
                        </div>
                    </div>
                </div>
                
                <!-- Requirements List -->
                <div class="requirements-box">
                    <span class="req-label">{$t('orders.requires')}</span>
                    <div class="requirements-list">
                        {#each order.requirements as req}
                            {@const item = getRequirementItem(req.type, req.id)}
                            {@const current = req.type === 'ingredient' ? ($ingredientsCount[req.id] || 0) : ($potionsCount[req.id] || 0)}
                            {@const isEnough = current >= req.count}
                            {@const itemName = req.type === 'ingredient' ? getIngredientName(req.id, $currentLang) : getPotionName(req.id, $currentLang)}
                            
                            <div class="req-chip" class:enough={isEnough} class:missing={!isEnough} title="{itemName}">
                                <div class="req-icon">
                                    {#if item}
                                        {@html item.icon}
                                    {:else}
                                        <ResourceIcon type="ingredients" size={16} />
                                    {/if}
                                </div>
                                <span class="req-name">{itemName}</span>
                                <span class="req-qty">{current} / {req.count}</span>
                            </div>
                        {/each}
                    </div>
                </div>
                
                <!-- Rewards Row -->
                <div class="rewards-row">
                    <div class="reward-chip gold" title="{$t('common.gold')}">
                        <ResourceIcon type="gold" size={14} />
                        <span>+{formatNumber(dynGold)}</span>
                    </div>

                    {#if order.rewardCrystals && order.rewardCrystals > 0}
                        <div class="reward-chip crystals" title="{$t('common.crystals')}">
                            <ResourceIcon type="crystals" size={14} />
                            <span>+{formatNumber(order.rewardCrystals)}</span>
                        </div>
                    {/if}

                    {#if order.rewardChest}
                        <div class="reward-chip chest chest-{order.rewardChest}" title="{$t('chests.' + order.rewardChest)}">
                            <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
                                <rect x="2" y="7" width="16" height="10" rx="2" fill={order.rewardChest === 'astral' ? '#a29bfe' : (order.rewardChest === 'magical' ? '#e056fd' : '#d35400')} stroke="#ffeaa7" stroke-width="1.2"/>
                                <path d="M2 7 Q10 2 18 7" fill={order.rewardChest === 'astral' ? '#6c5ce7' : (order.rewardChest === 'magical' ? '#8e44ad' : '#b85900')} stroke="#ffeaa7" stroke-width="1.2"/>
                                <circle cx="10" cy="11" r="1.5" fill="#ffeaa7"/>
                            </svg>
                            <span>+{$t('chests.' + order.rewardChest)}</span>
                        </div>
                    {/if}
                </div>

                <!-- Action Button -->
                <button 
                    type="button"
                    class="action-btn" 
                    class:can-fulfill={canFulfill}
                    class:vip-btn={order.isVip}
                    on:click|stopPropagation={() => fulfillOrder(order)}
                >
                    {#if order.isVip}
                        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                            <polygon points="4,2 14,8 4,14"/>
                        </svg>
                        <span>{$t('orders.fulfill')} ({$t('common.watchAd')})</span>
                    {:else if canFulfill}
                        <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                            <polyline points="3,8 7,12 13,4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>{$t('orders.fulfill')}</span>
                    {:else}
                        <span>{$t('alchemy.needIngredients')}</span>
                    {/if}
                </button>
            </div>
        {/each}
    </div>

    {#if $gameStore.activeOrders.length === 0}
        <div class="empty-orders-card">
            <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
                <path d="M8 28 L40 28 L36 14 L12 14 Z" fill="#6c5ce7" opacity="0.3" stroke="#a29bfe" stroke-width="2"/>
                <circle cx="14" cy="34" r="5" fill="#2d3436" stroke="#f1c40f" stroke-width="2"/>
                <circle cx="34" cy="34" r="5" fill="#2d3436" stroke="#f1c40f" stroke-width="2"/>
                <path d="M24 6 L24 14 M18 10 L30 10" stroke="#f1c40f" stroke-width="2"/>
            </svg>
            <p class="empty-title">{$t('orders.emptyState')}</p>
            <div class="empty-timer-box">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>
                    {$t('orders.refreshTimer', { time: mins > 0 ? `${mins} ${$t('common.min')} ${secs} ${$t('common.sec')}` : `${secs} ${$t('common.sec')}` })}
                </span>
            </div>

            <button type="button" class="summon-ad-btn" on:click={summonCaravanAd}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                    <path d="M4 6 L16 6 L16 18 L4 18 Z" fill="#1e1035" opacity="0.85"/>
                    <polygon points="16,10 21,7 21,17 16,14" fill="#1e1035"/>
                    <polygon points="8,9 13,12 8,15" fill="#ffeaa7"/>
                </svg>
                <span>{$t('orders.title')} ({$t('common.watchAd')})</span>
            </button>
        </div>
    {/if}
</div>

<style>
    .orders-wrapper {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        box-sizing: border-box;
    }

    .orders-wrapper.standalone {
        padding: 16px;
    }

    /* Caravan Info Bar */
    .caravan-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.08) 0%, rgba(243, 156, 18, 0.03) 100%);
        border: 1px solid rgba(241, 196, 15, 0.25);
        border-radius: 14px;
        padding: 8px 14px;
        box-sizing: border-box;
    }

    .caravan-info {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .caravan-svg {
        filter: drop-shadow(0 0 6px rgba(241, 196, 15, 0.4));
    }

    .caravan-text {
        display: flex;
        flex-direction: column;
    }

    .caravan-title {
        font-size: 0.88rem;
        font-weight: 700;
        color: #ffeaa7;
    }

    .caravan-sub {
        font-size: 0.76rem;
        color: rgba(255, 255, 255, 0.65);
    }

    .orders-count-badge {
        background: rgba(0, 0, 0, 0.45);
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 0.82rem;
        font-weight: 700;
        color: #f1c40f;
    }

    /* Grid of orders */
    .orders-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
        gap: 12px;
        width: 100%;
        box-sizing: border-box;
    }

    .order-card {
        background: linear-gradient(145deg, rgba(30, 20, 50, 0.85) 0%, rgba(20, 10, 35, 0.85) 100%);
        border: 1.5px solid rgba(162, 155, 254, 0.25);
        border-radius: 16px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        position: relative;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
        transition: border-color 0.2s, transform 0.2s;
        box-sizing: border-box;
    }

    .order-card:hover {
        border-color: rgba(162, 155, 254, 0.5);
    }

    .order-card.vip {
        border-color: rgba(241, 196, 15, 0.5);
        background: linear-gradient(145deg, rgba(45, 30, 15, 0.85) 0%, rgba(25, 18, 10, 0.85) 100%);
        box-shadow: 0 0 20px rgba(241, 196, 15, 0.15);
    }

    .dismiss-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        width: 24px;
        height: 24px;
        color: rgba(255, 255, 255, 0.5);
        font-size: 1.1rem;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .dismiss-btn:hover {
        color: #ff7675;
        background: rgba(231, 76, 60, 0.2);
    }

    .customer-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .customer-avatar {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .customer-avatar.vip {
        background: rgba(241, 196, 15, 0.15);
        border-color: rgba(241, 196, 15, 0.4);
    }

    .customer-info {
        display: flex;
        flex-direction: column;
        min-width: 0;
        flex: 1;
    }

    .order-toast {
        position: sticky;
        top: 6px;
        z-index: 50;
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(16, 12, 30, 0.95);
        border: 1px solid rgba(46, 204, 113, 0.6);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 12px rgba(46, 204, 113, 0.25);
        border-radius: 10px;
        padding: 8px 14px;
        color: #ffffff;
        font-size: 0.85rem;
        font-weight: 600;
        margin-bottom: 8px;
        animation: toastIn 0.25s ease-out;
    }

    @keyframes toastIn {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .name-line {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
    }

    .customer-name {
        font-size: 0.95rem;
        font-weight: 700;
        color: #ffffff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .order-badge {
        font-size: 0.62rem;
        font-weight: 900;
        padding: 2px 6px;
        border-radius: 5px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        line-height: 1;
    }

    .vip-badge {
        background: linear-gradient(135deg, #f1c40f, #f39c12);
        color: #1e1035;
        box-shadow: 0 0 8px rgba(241, 196, 15, 0.4);
    }

    .potion-badge {
        background: rgba(224, 86, 253, 0.18);
        color: #e056fd;
        border: 1px solid rgba(224, 86, 253, 0.45);
    }

    .common-badge {
        background: rgba(0, 206, 201, 0.15);
        color: #00cec9;
        border: 1px solid rgba(0, 206, 201, 0.35);
    }

    .vip-tag {
        background: linear-gradient(135deg, #f1c40f, #f39c12);
        color: #1e1035;
        font-size: 0.65rem;
        font-weight: 900;
        padding: 1px 6px;
        border-radius: 6px;
        letter-spacing: 0.5px;
    }

    .order-type-hint {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.55);
    }

    /* Requirements */
    .requirements-box {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 10px;
        padding: 8px 10px;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .req-label {
        font-size: 0.72rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .requirements-list {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .req-chip {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 8px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        font-size: 0.8rem;
    }

    .req-chip.enough {
        border-color: rgba(46, 204, 113, 0.4);
        background: rgba(46, 204, 113, 0.08);
    }

    .req-chip.missing {
        border-color: rgba(231, 76, 60, 0.35);
        background: rgba(231, 76, 60, 0.06);
    }

    .req-icon {
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .req-icon :global(svg) {
        width: 20px;
        height: 20px;
    }

    .req-name {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: rgba(255, 255, 255, 0.85);
    }

    .req-qty {
        font-weight: 700;
        font-size: 0.78rem;
    }

    .enough .req-qty {
        color: #2ecc71;
    }

    .missing .req-qty {
        color: #ff7675;
    }

    /* Rewards */
    .rewards-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
    }

    .reward-chip {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 0.78rem;
        font-weight: 700;
        background: rgba(0, 0, 0, 0.35);
    }

    .reward-chip.gold {
        color: #ffeaa7;
        border: 1px solid rgba(241, 196, 15, 0.3);
    }

    .reward-chip.crystals {
        color: #74b9ff;
        border: 1px solid rgba(116, 185, 255, 0.4);
    }

    .reward-chip.chest {
        background: rgba(0, 0, 0, 0.4);
    }

    .reward-chip.chest.chest-wooden {
        color: #f5cd79;
        border: 1px solid rgba(230, 126, 34, 0.5);
    }

    .reward-chip.chest.chest-magical {
        color: #e056fd;
        border: 1px solid rgba(224, 86, 253, 0.5);
        box-shadow: 0 0 6px rgba(224, 86, 253, 0.2);
    }

    .reward-chip.chest.chest-astral {
        color: #a29bfe;
        border: 1px solid rgba(162, 155, 254, 0.6);
        box-shadow: 0 0 8px rgba(162, 155, 254, 0.3);
    }

    /* Action button */
    .action-btn {
        width: 100%;
        height: 42px;
        padding: 0 12px;
        border-radius: 10px;
        border: none;
        background: #353b48;
        color: rgba(255, 255, 255, 0.45);
        font-size: 0.86rem;
        font-weight: 700;
        cursor: not-allowed;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.2s;
    }

    .action-btn.can-fulfill {
        background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
        color: #0c241d;
        cursor: pointer;
        box-shadow: 0 3px 0 #00886c, 0 4px 12px rgba(0, 184, 148, 0.3);
    }

    .action-btn.can-fulfill:hover {
        filter: brightness(1.08);
        transform: translateY(-1px);
        box-shadow: 0 4px 0 #00886c, 0 6px 16px rgba(0, 184, 148, 0.45);
    }

    .action-btn.can-fulfill:active {
        transform: translateY(2px);
        box-shadow: 0 1px 0 #00886c;
    }

    .action-btn.vip-btn.can-fulfill {
        background: linear-gradient(135deg, #f1c40f 0%, #f39c12 100%);
        color: #1e1035;
        box-shadow: 0 3px 0 #b7791f, 0 4px 12px rgba(241, 196, 15, 0.4);
    }

    .empty-orders-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 36px 20px;
        background: rgba(0, 0, 0, 0.25);
        border: 1px dashed rgba(255, 255, 255, 0.15);
        border-radius: 16px;
        gap: 8px;
    }

    .empty-orders-card p {
        margin: 0;
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.85rem;
        max-width: 360px;
    }

    .caravan-actions {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .summon-mini-btn {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 4px 10px;
        border-radius: 10px;
        border: 1px solid rgba(241, 196, 15, 0.45);
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.22) 0%, rgba(243, 156, 18, 0.12) 100%);
        color: #ffeaa7;
        font-size: 0.76rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
    }

    .summon-mini-btn:hover {
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.38) 0%, rgba(243, 156, 18, 0.22) 100%);
        transform: translateY(-1px);
        border-color: #f1c40f;
    }

    .summon-ad-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
        padding: 10px 20px;
        border-radius: 12px;
        border: none;
        background: linear-gradient(135deg, #f1c40f 0%, #e67e22 100%);
        color: #1e1035;
        font-size: 0.88rem;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(241, 196, 15, 0.35);
        transition: all 0.2s;
    }

    .summon-ad-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(241, 196, 15, 0.5);
        filter: brightness(1.06);
    }

    .summon-ad-btn:active {
        transform: translateY(1px);
    }
</style>
