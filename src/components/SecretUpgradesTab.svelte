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
                    { scale: 1, duration: 0.25, ease: 'back.out(2)' }
                );
            }
        } else {
            const btn = buttons[id];
            if (btn) {
                gsap.to(btn, {
                    keyframes: [
                        { x: -5, duration: 0.04 },
                        { x:  5, duration: 0.04 },
                        { x: -4, duration: 0.04 },
                        { x:  4, duration: 0.04 },
                        { x:  0, duration: 0.04 }
                    ],
                    ease: 'none'
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
    <div class="secret-info-bar">
        <div class="info-text">
            <span class="info-title">Постоянные Рунические Знания</span>
            <span class="info-sub">Эти улучшения не сбрасываются даже после проведения Тёмного Ритуала!</span>
        </div>
    </div>
    
    <div class="list">
        {#each $gameStore.secretUpgrades as upgrade}
            {@const cost = getCost(upgrade.baseCost, upgrade.costMultiplier, upgrade.level)}
            {@const isMax = upgrade.level >= upgrade.maxLevel}
            {@const canAfford = $gameStore.stardust >= cost}
            
            <div class="card" class:is-max={isMax}>
                <div class="icon-wrap">
                    <span class="icon">{@html icons[upgrade.id] || defaultIcon}</span>
                </div>
                <div class="info">
                    <div class="title-row">
                        <h4 class="card-name">{upgrade.name}</h4>
                        <span class="level-tag" class:max-tag={isMax}>
                            {isMax ? 'MAX' : `${upgrade.level} / ${upgrade.maxLevel}`}
                        </span>
                    </div>
                    <p class="desc">{upgrade.description}</p>
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
                            <span>ИЗУЧЕНО</span>
                        {:else}
                            <span class="btn-cost-row">
                                <svg viewBox="0 0 24 24" width="13" height="13" fill="none">
                                    <path d="M12 2 L14 8 L20 10 L15 14 L17 21 L12 17 L7 21 L9 14 L4 10 L10 8 Z" fill="#e056fd" stroke="#be2edd" stroke-width="1.5"/>
                                </svg>
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

    .secret-info-bar {
        background: rgba(155, 89, 182, 0.12);
        border: 1px solid rgba(162, 155, 254, 0.25);
        border-radius: 12px;
        padding: 10px 14px;
    }

    .info-title {
        display: block;
        font-size: 0.95rem;
        font-weight: 800;
        color: #a29bfe;
        margin-bottom: 2px;
    }

    .info-sub {
        display: block;
        font-size: 0.78rem;
        color: #b2bec3;
    }

    .list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .card {
        background: rgba(255, 255, 255, 0.03);
        border: 1.5px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 12px 14px;
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
        margin-bottom: 3px;
    }

    .card-name {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 800;
        color: #fff;
    }

    .level-tag {
        font-size: 0.72rem;
        font-weight: 800;
        background: rgba(162, 155, 254, 0.15);
        border: 1px solid rgba(162, 155, 254, 0.3);
        color: #a29bfe;
        padding: 1px 6px;
        border-radius: 6px;
    }

    .level-tag.max-tag {
        background: rgba(46, 204, 113, 0.2);
        border-color: #2ecc71;
        color: #2ecc71;
    }

    .desc {
        margin: 0 0 6px;
        font-size: 0.78rem;
        color: #b2bec3;
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
        padding: 8px 14px;
        color: #fff;
        font-size: 0.85rem;
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

    @media (max-width: 480px) {
        .card {
            flex-wrap: wrap;
        }
        .action-wrap {
            width: 100%;
        }
        .buy-btn {
            width: 100%;
        }
    }
</style>
