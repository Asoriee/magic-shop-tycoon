<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import gsap from 'gsap';
    import { gameStore, ingredientsCount, potionsCount, AVAILABLE_INGREDIENTS, AVAILABLE_POTIONS, type CustomerOrder, formatNumber } from '../store';
    import { showRewardedAd } from '../yandex-sdk';

    // Orders spawn every 1-2 minutes up to max 4.
    let spawnTimer: number;

    onMount(() => {
        spawnTimer = setInterval(() => {
            const { activeOrders } = $gameStore;
            if (activeOrders.length < 4) {
                gameStore.spawnOrder();
            }
        }, 30000); // Check every 30 seconds if we can spawn
    });

    onDestroy(() => {
        clearInterval(spawnTimer);
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
            gsap.fromTo(`#order-${order.id}`, 
                { x: -5 }, { x: 5, duration: 0.1, yoyo: true, repeat: 3, onComplete: () => gsap.set(`#order-${order.id}`, { x: 0 })}
            );
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
            
            // GSAP complete animation
            gsap.to(`#order-${order.id}`, {
                scale: 1.1,
                opacity: 0,
                x: 100,
                duration: 0.5,
                ease: 'back.in(1.5)',
                onComplete: () => {
                    gameStore.completeOrder(order.id);
                }
            });
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
        gsap.to(`#order-${order.id}`, {
            scale: 0.8,
            opacity: 0,
            x: -50,
            duration: 0.3,
            onComplete: () => {
                gameStore.dismissOrder(order.id);
            }
        });
    }

</script>

<div class="orders-container">
    <div class="modal-header">
        <div class="header-icon">📜</div>
        <div class="header-text">
            <h2>Доска Заказов</h2>
            <p class="header-sub">Выполняйте заказы героев</p>
        </div>
    </div>
    <div class="balance-row">
        <div class="balance-chip gold">
            <span>🪙 {formatNumber($gameStore.gold)} золота</span>
        </div>
    </div>
    {#each $gameStore.activeOrders as order (order.id)}
        <div class="order-card {order.isVip ? 'vip' : ''}" id="order-{order.id}">
            <button class="dismiss-btn" on:click={() => dismissOrder(order)}>&times;</button>
            
            <div class="customer">
                <span class="customer-icon">{order.icon}</span>
                <span class="customer-name">{order.name}</span>
            </div>
            
            <div class="requirements">
                {#each order.requirements as req}
                    {@const item = getRequirementItem(req.type, req.id)}
                    {@const current = req.type === 'ingredient' ? ($ingredientsCount[req.id] || 0) : ($potionsCount[req.id] || 0)}
                    {@const isEnough = current >= req.count}
                    
                    {#if item}
                        <div class="req-item {isEnough ? 'enough' : 'not-enough'}" title="{item.name}">
                            <div class="req-icon">
                                {#if req.type === 'ingredient'}
                                    {@html item.icon}
                                {:else}
                                    {@html item.icon}
                                {/if}
                            </div>
                            <div class="req-count">{current}/{req.count}</div>
                        </div>
                    {/if}
                {/each}
            </div>
            
            <div class="rewards">
                <div class="reward-pill gold">
                    <span class="icon">🪙</span> {formatNumber(order.rewardGold)}
                </div>
                {#if order.rewardStardust > 0}
                    <div class="reward-pill stardust">
                        <span class="icon">✨</span> {formatNumber(order.rewardStardust)}
                    </div>
                {/if}
            </div>

            <button class="fulfill-btn {order.isVip ? 'vip-btn' : ''} {checkCanFulfill(order) ? 'ready' : ''}" on:click={() => fulfillOrder(order)}>
                {#if order.isVip}
                    <span class="video-icon">▶️</span> Выполнить VIP
                {:else}
                    Выполнить
                {/if}
            </button>
        </div>
    {/each}
</div>

<style>
    .orders-container {
        position: absolute;
        right: 20px;
        top: 80px;
        bottom: 20px;
        width: 320px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        pointer-events: none; /* Let clicks pass through empty space */
        z-index: 50;
        overflow-y: auto;
        padding-right: 10px;
        align-items: flex-end;
    }

    .orders-container::-webkit-scrollbar { width: 0; }

    .order-card {
        background: linear-gradient(135deg, rgba(30, 30, 47, 0.9), rgba(45, 52, 54, 0.9));
        border: 2px solid #6c5ce7;
        border-radius: 15px;
        padding: 15px;
        width: 300px;
        pointer-events: auto;
        backdrop-filter: blur(5px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        position: relative;
        animation: slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        will-change: transform, opacity;
    }

    .order-card.vip {
        border-color: #f1c40f;
        background: linear-gradient(135deg, rgba(40, 30, 10, 0.9), rgba(45, 40, 20, 0.9));
        box-shadow: 0 0 15px rgba(241, 196, 15, 0.3);
    }

    @keyframes slideInRight {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    .dismiss-btn {
        position: absolute;
        top: 5px; right: 5px;
        background: transparent;
        border: none;
        color: #b2bec3;
        font-size: 1.2rem;
        cursor: pointer;
    }
    .dismiss-btn:hover { color: #ff7675; }

    .customer {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
    }
    .customer-icon {
        font-size: 1.8rem;
    }
    .customer-name {
        color: white;
        font-weight: bold;
        font-size: 1.1rem;
    }

    .requirements {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 15px;
        background: rgba(0,0,0,0.2);
        padding: 10px;
        border-radius: 10px;
    }

    .req-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(255,255,255,0.05);
        padding: 5px;
        border-radius: 8px;
        min-width: 50px;
        border: 1px solid transparent;
    }
    .req-item.not-enough { border-color: #ff7675; }
    .req-item.enough { border-color: #00b894; }

    .req-icon {
        width: 30px; height: 30px;
        display: flex; justify-content: center; align-items: center;
    }
    .req-icon :global(svg) { width: 24px; height: 24px; }
    
    .req-count {
        font-size: 0.8rem;
        font-weight: bold;
        margin-top: 2px;
        color: white;
    }
    .not-enough .req-count { color: #ff7675; }

    .rewards {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
    }

    .reward-pill {
        padding: 4px 10px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 5px;
    }
    .reward-pill.gold { background: rgba(241, 196, 15, 0.2); color: #f1c40f; }
    .reward-pill.stardust { background: rgba(162, 155, 254, 0.2); color: #a29bfe; }

    .fulfill-btn {
        width: 100%;
        padding: 10px;
        border: none;
        border-radius: 10px;
        background: #2d3436;
        color: #b2bec3;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 5px;
    }
    .fulfill-btn.ready { background: #00b894; color: white; }
    .fulfill-btn.ready:hover { filter: brightness(1.1); transform: scale(1.02); }
    .fulfill-btn.ready:active { transform: scale(0.95); }

    .fulfill-btn.vip-btn.ready {
        background: linear-gradient(135deg, #f39c12, #d35400);
        color: white;
    }
</style>
