<script lang="ts">
    import { gameStore, currentClickPower, currentIdleIncome, formatNumber } from '../store';
    import gsap from 'gsap';

    export let isOpen = false;
    export let onClose: () => void;

    let buttons: Record<string, HTMLElement> = {};

    function getUpgradeCost(baseCost: number, costMultiplier: number, level: number) {
        return Math.floor(baseCost * Math.pow(costMultiplier, level));
    }

    function buyUpgrade(id: string, cost: number) {
        if ($gameStore.gold >= cost) {
            gameStore.buyUpgrade(id);
            gameStore.updateQuestProgress('buy_upgrades', 1);
            const btn = buttons[id];
            if (btn) {
                gsap.fromTo(btn, 
                    { scale: 0.9 }, 
                    { scale: 1, duration: 0.3, ease: 'back.out(2)' }
                );
            }
        } else {
            const btn = buttons[id];
            if (btn) {
                gsap.to(btn, {
                    keyframes: [
                        { x: -5, duration: 0.05 },
                        { x: 5, duration: 0.05 },
                        { x: -5, duration: 0.05 },
                        { x: 5, duration: 0.05 },
                        { x: 0, duration: 0.05 }
                    ]
                });
            }
        }
    }

    const svgIcons: Record<string, string> = {
        'click': `<svg viewBox="0 0 24 24" width="36" height="36" fill="#e74c3c"><path d="M12.89,3L14.85,3.4L11.11,21L9.16,20.6L12.89,3M19.59,12L16,8.41V5.58L22.42,12L16,18.41V15.58L19.59,12M1.58,12L8,5.58V8.41L4.41,12L8,15.58V18.41L1.58,12Z"/></svg>`,
        'idle': `<svg viewBox="0 0 24 24" width="36" height="36" fill="#3498db"><path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/></svg>`
    };
</script>

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay" on:click={onClose}>
    <div class="modal-content" on:click|stopPropagation>
        <button class="close-btn" on:click={onClose}>&times;</button>
        <h2 class="modal-title">Лавка Улучшений</h2>
        
        <div class="totals-row">
            <span>⚔️ За клик: <strong>{formatNumber($currentClickPower)}</strong></span>
            <span>⏱️ Пассивно: <strong>{formatNumber($currentIdleIncome)}/сек</strong></span>
        </div>
        
        <div class="upgrades-list">
            {#each $gameStore.upgrades as upgrade}
                {@const currentCost = getUpgradeCost(upgrade.baseCost, upgrade.costMultiplier, upgrade.level)}
                {@const canAfford = $gameStore.gold >= currentCost}
                
                <div class="upgrade-card" class:disabled={!canAfford}>
                    <div class="icon">
                        {@html svgIcons[upgrade.type]}
                    </div>
                    <div class="info">
                        <h4>{upgrade.name}</h4>
                        <div class="stats">
                            <span class="level">Ур. {upgrade.level}</span>
                            <span class="bonus">
                                +{upgrade.baseValue} {upgrade.type === 'click' ? 'за клик' : 'в сек'}
                            </span>
                        </div>
                    </div>
                    <button 
                        class="buy-btn" 
                        bind:this={buttons[upgrade.id]}
                        on:click|stopPropagation={() => buyUpgrade(upgrade.id, currentCost)}
                    >
                        💰 {formatNumber(currentCost)}
                    </button>
                </div>
            {/each}
        </div>
    </div>
</div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
    }

    .modal-content {
        background: linear-gradient(145deg, #1a0a2e, #2d1b4e);
        padding: 2.5rem 2rem;
        border-radius: 20px;
        border: 2px solid #a29bfe;
        box-shadow: 0 0 30px rgba(162, 155, 254, 0.4), inset 0 2px 0 rgba(255,255,255,0.1);
        width: 85%;
        max-width: 600px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        position: relative;
        animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes popIn {
        from { opacity: 0; transform: scale(0.9) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .close-btn {
        position: absolute;
        top: 15px;
        right: 20px;
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        font-size: 2rem;
        cursor: pointer;
        transition: color 0.2s;
        line-height: 1;
    }

    .close-btn:hover {
        color: white;
    }

    .modal-title {
        margin: 0 0 20px 0;
        color: #f1c40f;
        text-align: center;
        font-size: 2rem;
        text-transform: uppercase;
        letter-spacing: 2px;
        text-shadow: 0 0 15px rgba(241, 196, 15, 0.6);
    }

    .totals-row {
        display: flex;
        justify-content: center;
        gap: 24px;
        font-size: 1rem;
        color: rgba(255,255,255,0.8);
        margin-bottom: 20px;
        padding: 12px;
        background: rgba(0,0,0,0.3);
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.1);
    }

    .totals-row strong {
        color: #f1c40f;
    }

    .upgrades-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow-y: auto;
        padding-right: 10px;
    }

    .upgrades-list::-webkit-scrollbar {
        width: 6px;
    }
    .upgrades-list::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
    }
    .upgrades-list::-webkit-scrollbar-thumb {
        background: rgba(162, 155, 254, 0.5);
        border-radius: 10px;
    }

    .upgrade-card {
        background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
        border-radius: 12px;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        border: 1px solid rgba(255,255,255,0.05);
        transition: border-color 0.3s, background 0.3s;
    }

    .upgrade-card:hover {
        border-color: rgba(162, 155, 254, 0.4);
        background: linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05));
    }

    .icon {
        background: rgba(0,0,0,0.4);
        border-radius: 12px;
        padding: 12px;
        display: flex;
        justify-content: center;
        align-items: center;
        box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);
    }

    .info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .info h4 {
        margin: 0;
        color: #fff;
        font-size: 1.2rem;
        text-shadow: 0 1px 2px rgba(0,0,0,0.8);
    }

    .stats {
        display: flex;
        gap: 15px;
        font-size: 0.95rem;
    }

    .level {
        color: #3498db;
        font-weight: bold;
    }

    .bonus {
        color: #2ecc71;
    }

    .buy-btn {
        background: linear-gradient(135deg, #f1c40f, #f39c12);
        border: none;
        color: #2c3e50;
        padding: 12px 20px;
        border-radius: 10px;
        font-weight: bold;
        font-size: 1.1rem;
        cursor: pointer;
        box-shadow: 0 4px #d35400;
        transition: filter 0.2s, transform 0.1s;
    }

    .buy-btn:active {
        transform: translateY(4px);
        box-shadow: 0 0 #d35400;
    }

    .upgrade-card.disabled {
        opacity: 0.6;
        filter: grayscale(60%);
    }

    .upgrade-card.disabled .buy-btn {
        background: #7f8c8d;
        box-shadow: 0 4px #546566;
        color: #ddd;
        cursor: not-allowed;
    }
</style>
