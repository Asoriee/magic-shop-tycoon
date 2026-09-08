<script lang="ts">
    import { gameStore, formatNumber } from '../store';
    import gsap from 'gsap';

    let buttons: Record<string, HTMLElement> = {};

    function getCost(baseCost: number, costMultiplier: number, level: number) {
        return Math.floor(baseCost * Math.pow(costMultiplier, level));
    }

    function buySecret(id: string, cost: number) {
        if ($gameStore.stardust >= cost) {
            gameStore.buySecretUpgrade(id);
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

    const icons: Record<string, string> = {
        'magnet': '🧲',
        'alchemy': '⚗️',
        'orders': '📜',
        'wallet': '👛',
        'familiar': '🐾'
    };
</script>

<div class="secret-tab">
    <div class="modal-header">
        <div class="header-icon">🔮</div>
        <div class="header-text">
            <h2>Тайные Знания</h2>
            <p class="header-sub">Эти знания остаются с вами даже после Тёмного Ритуала.</p>
        </div>
    </div>
    
    <div class="balance-row">
        <div class="balance-chip stardust">
            <span>✨ {formatNumber($gameStore.stardust)} Звездной Пыли</span>
        </div>
    </div>
    
    <div class="list">
        {#each $gameStore.secretUpgrades as upgrade}
            {@const cost = getCost(upgrade.baseCost, upgrade.costMultiplier, upgrade.level)}
            {@const isMax = upgrade.level >= upgrade.maxLevel}
            {@const canAfford = $gameStore.stardust >= cost}
            
            <div class="card" class:disabled={!canAfford && !isMax}>
                <div class="icon-wrap">
                    <span class="icon">{icons[upgrade.id] || '🔮'}</span>
                </div>
                <div class="info">
                    <h4>{upgrade.name}</h4>
                    <p class="desc">{upgrade.description}</p>
                    <div class="progress">
                        <div class="level">Ур. {upgrade.level} / {upgrade.maxLevel}</div>
                        <div class="bar">
                            <div class="fill" style="width: {(upgrade.level / upgrade.maxLevel) * 100}%"></div>
                        </div>
                    </div>
                </div>
                <button 
                    class="buy-btn" 
                    class:max={isMax}
                    bind:this={buttons[upgrade.id]}
                    on:click={() => { if(!isMax) buySecret(upgrade.id, cost); }}
                    disabled={isMax}
                >
                    {#if isMax}
                        МАКС
                    {:else}
                        ✨ {cost}
                    {/if}
                </button>
            </div>
        {/each}
    </div>
</div>

<style>
    .secret-tab {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
    }



    .list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow-y: auto;
        padding-right: 8px;
        flex: 1;
    }

    .list::-webkit-scrollbar {
        width: 6px;
    }
    .list::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
    }
    .list::-webkit-scrollbar-thumb {
        background: rgba(162, 155, 254, 0.5);
        border-radius: 10px;
    }

    .card {
        background: linear-gradient(145deg, rgba(162, 155, 254, 0.1), rgba(108, 92, 231, 0.05));
        border-radius: 16px;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        border: 1px solid rgba(162, 155, 254, 0.2);
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(0,0,0,0.3);
        border-color: rgba(162, 155, 254, 0.4);
    }

    .card.disabled {
        opacity: 0.6;
        filter: grayscale(40%);
    }

    .icon-wrap {
        width: 50px;
        height: 50px;
        background: rgba(0,0,0,0.3);
        border-radius: 12px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.8rem;
        box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);
        border: 1px solid rgba(162, 155, 254, 0.2);
    }

    .info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .info h4 {
        margin: 0;
        color: #fff;
        font-size: 1.15rem;
        text-shadow: 0 1px 2px rgba(0,0,0,0.8);
    }

    .desc {
        margin: 0;
        color: #a29bfe;
        font-size: 0.85rem;
    }

    .progress {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 4px;
    }

    .level {
        color: #81ecec;
        font-size: 0.85rem;
        font-weight: bold;
    }

    .bar {
        flex: 1;
        height: 6px;
        background: rgba(0,0,0,0.5);
        border-radius: 4px;
        overflow: hidden;
    }

    .fill {
        height: 100%;
        background: linear-gradient(90deg, #a29bfe, #6c5ce7);
        border-radius: 4px;
        transition: width 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .buy-btn {
        background: linear-gradient(135deg, #a29bfe, #6c5ce7);
        border: none;
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        font-weight: bold;
        font-size: 1.1rem;
        cursor: pointer;
        box-shadow: 0 4px #4834d4;
        transition: filter 0.2s, transform 0.1s;
        min-width: 90px;
    }

    .buy-btn:active:not(:disabled) {
        transform: translateY(4px);
        box-shadow: 0 0 #4834d4;
    }

    .buy-btn:hover:not(:disabled) {
        filter: brightness(1.2);
    }

    .buy-btn.max {
        background: #2d3436;
        color: #636e72;
        box-shadow: 0 4px #1e272e;
        cursor: default;
    }

    .card.disabled .buy-btn:not(.max) {
        background: #7f8c8d;
        box-shadow: 0 4px #546566;
        color: #ddd;
        cursor: not-allowed;
    }
</style>
