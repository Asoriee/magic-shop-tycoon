<script lang="ts">
    import { gameStore, formatNumber } from '../store';
    import { saveGame } from '../yandex-sdk';
    import gsap from 'gsap';

    let buttons: Record<string, HTMLElement> = {};

    function getCost(baseCost: number, costMultiplier: number, level: number) {
        return Math.floor(baseCost * Math.pow(costMultiplier, level));
    }

    function buySecret(id: string, cost: number) {
        if ($gameStore.stardust >= cost) {
            gameStore.buySecretUpgrade(id);
            saveGame();
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
        'magnet': `<svg viewBox="0 0 24 24" width="28" height="28" fill="none">
            <path d="M5 4 V13 C5 16.9 8.1 20 12 20 C15.9 20 19 16.9 19 13 V4 H15 V13 C15 14.7 13.7 16 12 16 C10.3 16 9 14.7 9 13 V4 H5 Z" fill="#e74c3c" stroke="#c0392b" stroke-width="1.2"/>
            <rect x="5" y="4" width="4" height="4" fill="#bdc3c7"/>
            <rect x="15" y="4" width="4" height="4" fill="#3498db"/>
            <circle cx="12" cy="11" r="1.5" fill="#f1c40f"/>
        </svg>`,
        'alchemy': `<svg viewBox="0 0 24 24" width="28" height="28" fill="none">
            <path d="M9 3 H15 M10 3 V8 L4 18 C3.3 19.3 4.2 21 5.7 21 H18.3 C19.8 21 20.7 19.3 20 18 L14 8 V3" stroke="#a29bfe" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M6 16 L18 16 L19.2 18 C19.5 18.5 19.1 19 18.5 19 H5.5 C4.9 19 4.5 18.5 4.8 18 Z" fill="#6c5ce7"/>
            <circle cx="10" cy="17" r="1.2" fill="#ffeaa7"/>
            <circle cx="14" cy="18" r="1.5" fill="#ffeaa7"/>
        </svg>`,
        'orders': `<svg viewBox="0 0 24 24" width="28" height="28" fill="none">
            <path d="M6 4 C6 2.5 8 2.5 8 4 L8 18 C8 19.5 6 19.5 6 18 Z" fill="#e67e22" stroke="#d35400" stroke-width="1.2"/>
            <path d="M8 3 L18 3 C19.5 3 20 4 20 5.5 L20 17 C20 18.5 19 19 17.5 19 L8 19 Z" fill="#f5cd79" stroke="#d35400" stroke-width="1.2"/>
            <circle cx="14" cy="11" r="3" fill="#f1c40f" stroke="#b7791f" stroke-width="1"/>
        </svg>`,
        'wallet': `<svg viewBox="0 0 24 24" width="28" height="28" fill="none">
            <path d="M4 8 C4 6.3 5.3 5 7 5 H19 C19.6 5 20 5.4 20 6 V18 C20 19.1 19.1 20 18 20 H6 C4.9 20 4 19.1 4 18 Z" fill="#d35400" stroke="#b7791f" stroke-width="1.2"/>
            <path d="M14 10 H20 V15 H14 C12.6 15 12.6 10 14 10 Z" fill="#f1c40f" stroke="#d4ac0d" stroke-width="1.2"/>
            <circle cx="16.5" cy="12.5" r="1.5" fill="#2d3436"/>
        </svg>`,
        'familiar': `<svg viewBox="0 0 24 24" width="28" height="28" fill="none">
            <ellipse cx="12" cy="15" rx="5" ry="4" fill="#a29bfe"/>
            <circle cx="7" cy="10" r="2" fill="#a29bfe"/>
            <circle cx="11" cy="7.5" r="2" fill="#a29bfe"/>
            <circle cx="15" cy="8" r="2" fill="#a29bfe"/>
            <circle cx="18" cy="11.5" r="1.8" fill="#a29bfe"/>
            <circle cx="12" cy="12" r="8" stroke="#fd79a8" stroke-width="1" stroke-dasharray="2 2" opacity="0.6"/>
        </svg>`
    };

    const defaultIcon = `<svg viewBox="0 0 24 24" width="28" height="28" fill="none">
        <circle cx="12" cy="12" r="8" fill="#9b59b6" stroke="#fd79a8" stroke-width="1.5"/>
        <circle cx="10" cy="9" r="2" fill="#ffffff" opacity="0.6"/>
    </svg>`;
</script>

<div class="secret-tab">
    <div class="tab-header">
        <div class="tab-title-row">
            <div class="header-icon">
                <svg viewBox="0 0 40 40" width="32" height="32">
                    <defs>
                        <radialGradient id="secretOrb" cx="35%" cy="35%" r="65%">
                            <stop offset="0%" stop-color="#fd79a8"/>
                            <stop offset="60%" stop-color="#9b59b6"/>
                            <stop offset="100%" stop-color="#341f97"/>
                        </radialGradient>
                    </defs>
                    <ellipse cx="20" cy="35" rx="12" ry="4" fill="#1e1035" opacity="0.7"/>
                    <rect x="14" y="30" width="12" height="5" rx="2" fill="#d4ac6e"/>
                    <circle cx="20" cy="18" r="14" fill="url(#secretOrb)"/>
                    <ellipse cx="16" cy="13" rx="4" ry="2" fill="white" opacity="0.6" transform="rotate(-30 16 13)"/>
                    <circle cx="24" cy="22" r="1.5" fill="#f1c40f" opacity="0.8"/>
                    <circle cx="16" cy="22" r="1" fill="#fff" opacity="0.7"/>
                </svg>
            </div>
            <h2 class="tab-title">Тайные Знания</h2>
        </div>
        <p class="header-sub">Эти знания остаются с вами даже после Тёмного Ритуала.</p>

        <div class="balance-row">
            <div class="balance-chip stardust">
                <span class="icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                        <path d="M12 2 L14 8 L20 10 L15 14 L17 21 L12 17 L7 21 L9 14 L4 10 L10 8 Z" fill="#e056fd" stroke="#be2edd" stroke-width="1.5"/>
                    </svg>
                </span>
                <span>{formatNumber($gameStore.stardust)} Звездной Пыли</span>
            </div>
        </div>
    </div>
    
    <div class="list">
        {#each $gameStore.secretUpgrades as upgrade}
            {@const cost = getCost(upgrade.baseCost, upgrade.costMultiplier, upgrade.level)}
            {@const isMax = upgrade.level >= upgrade.maxLevel}
            {@const canAfford = $gameStore.stardust >= cost}
            
            <div class="card" class:disabled={!canAfford && !isMax}>
                <div class="icon-wrap">
                    <span class="icon">{@html icons[upgrade.id] || defaultIcon}</span>
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
                        <span class="btn-cost-row">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none">
                                <path d="M12 2 L14 8 L20 10 L15 14 L17 21 L12 17 L7 21 L9 14 L4 10 L10 8 Z" fill="#ffeaa7" stroke="#fdcb6e" stroke-width="1.5"/>
                            </svg>
                            <span>{formatNumber(cost)}</span>
                        </span>
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

    .btn-cost-row {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
    }
</style>
