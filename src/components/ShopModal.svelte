<script lang="ts">
    import { 
        gameStore, 
        currentClickPower, 
        currentIdleIncome, 
        critChance, 
        resonanceBonus, 
        milestoneInfo,
        maxOfflineTimeHours,
        formatNumber, 
        calculateBulkBuy, 
        type Upgrade 
    } from '../store';
    import gsap from 'gsap';

    export let isOpen = false;
    export let onClose: () => void;
    export let isEmbedded = false;

    let activeCategory: 'all' | 'production' | 'click' | 'mastery' = 'all';
    let buyMode: '1' | '10' | 'max' = '1';

    let buttons: Record<string, HTMLButtonElement> = {};

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape' && isOpen) {
            onClose();
        }
    }

    function buyUpgrade(upgrade: Upgrade) {
        const bulk = calculateBulkBuy(upgrade, buyMode, $gameStore.gold);
        const btn = buttons[upgrade.id];

        if (bulk.canAfford && bulk.count > 0) {
            gameStore.buyUpgradeBulk(upgrade.id, bulk.count, bulk.totalCost);
            gameStore.updateQuestProgress('buy_upgrades', bulk.count);
            
            if (btn) {
                gsap.fromTo(btn, 
                    { scale: 0.9 }, 
                    { scale: 1, duration: 0.25, ease: 'back.out(2)' }
                );
            }
        } else {
            if (btn) {
                gsap.to(btn, {
                    keyframes: [
                        { x: -5, duration: 0.04 },
                        { x: 5, duration: 0.04 },
                        { x: -4, duration: 0.04 },
                        { x: 4, duration: 0.04 },
                        { x: 0, duration: 0.04 }
                    ]
                });
            }
        }
    }

    $: visibleUpgrades = $gameStore.upgrades.filter(u => {
        if (activeCategory === 'all') return true;
        return u.category === activeCategory;
    });

    $: productionCount = $gameStore.upgrades.filter(u => u.category === 'production').length;
    $: clickCount = $gameStore.upgrades.filter(u => u.category === 'click').length;
    $: masteryCount = $gameStore.upgrades.filter(u => u.category === 'mastery').length;
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay" class:embedded={isEmbedded} on:click={onClose} role="dialog" aria-modal="true" aria-label="Лавка Улучшений" tabindex="-1">
    <div class="modal-content" class:embedded-modal={isEmbedded} on:click|stopPropagation>
        {#if !isEmbedded}
            <!-- Master Header -->
            <div class="master-header">
                <button class="close-btn" on:click={onClose} aria-label="Закрыть">✕</button>

                <div class="header-main">
                    <div class="master-icon-wrap">
                        <svg viewBox="0 0 56 56" width="48" height="48" class="master-svg-icon">
                            <defs>
                                <radialGradient id="shopMasterAura" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stop-color="#ffeaa7" stop-opacity="0.9"/>
                                    <stop offset="55%" stop-color="#f39c12" stop-opacity="0.5"/>
                                    <stop offset="100%" stop-color="#d35400" stop-opacity="0"/>
                                </radialGradient>
                                <filter id="shopGoldGlow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="2" result="blur"/>
                                    <feMerge>
                                        <feMergeNode in="blur"/>
                                        <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                </filter>
                                <radialGradient id="alchSphere" cx="40%" cy="30%" r="70%">
                                    <stop offset="0%" stop-color="#fff"/>
                                    <stop offset="25%" stop-color="#ffeaa7"/>
                                    <stop offset="65%" stop-color="#f39c12"/>
                                    <stop offset="100%" stop-color="#b7791f"/>
                                </radialGradient>
                            </defs>
                            <!-- Ambient Aura -->
                            <circle cx="28" cy="28" r="26" fill="url(#shopMasterAura)"/>
                            <!-- Magic Shop / Alchemy Pedestal Base -->
                            <rect x="8" y="44" width="40" height="6" rx="3" fill="#2d3436" stroke="#f1c40f" stroke-width="1.5"/>
                            <rect x="12" y="41" width="32" height="4" fill="#636e72"/>
                            <!-- Alchemy Flask / Orb Structure -->
                            <path d="M22 22 L22 28 Q14 34 14 41 L42 41 Q42 34 34 28 L34 22 Z" 
                                  fill="url(#alchSphere)" stroke="#ffeaa7" stroke-width="1.8" filter="url(#shopGoldGlow)"/>
                            <!-- Neck & Rim of Flask -->
                            <rect x="20" y="16" width="16" height="7" rx="2" fill="#dcdde1" stroke="#f1c40f" stroke-width="1.2"/>
                            <ellipse cx="28" cy="16" rx="8" ry="3" fill="#ffeaa7" stroke="#b7791f" stroke-width="1.2"/>
                            <!-- Swirling Magic Liquid & Sparkles -->
                            <ellipse cx="28" cy="36" rx="10" ry="4" fill="#ffffff" opacity="0.6"/>
                            <!-- Gold Coins Stacks beside the Flask -->
                            <ellipse cx="38" cy="35" rx="7" ry="3" fill="#f1c40f" stroke="#b7791f" stroke-width="1"/>
                            <ellipse cx="38" cy="38" rx="7" ry="3" fill="#f39c12" stroke="#b7791f" stroke-width="1"/>
                            <ellipse cx="38" cy="41" rx="7" ry="3" fill="#d35400" stroke="#b7791f" stroke-width="1"/>
                            <!-- Sparkling Star above Flask -->
                            <polygon points="28,4 30,10 36,12 30,14 28,20 26,14 20,12 26,10" fill="#ffeaa7" filter="url(#shopGoldGlow)"/>
                            <circle cx="28" cy="12" r="2" fill="#fff"/>
                        </svg>
                    </div>

                    <div class="header-titles">
                        <h2 class="title-text">ЛАВКА УЛУЧШЕНИЙ</h2>
                        <span class="subtitle-text">Инвестируйте золото в производство, силу клика и магическое мастерство</span>
                    </div>
                </div>

                <!-- Economic Stats Row -->
                <div class="currencies-panel">
                    <div class="curr-chip gold-chip" title="Золото">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <circle cx="12" cy="12" r="9" fill="#f1c40f" stroke="#d4ac0d" stroke-width="2"/>
                            <circle cx="12" cy="12" r="5" fill="#f39c12"/>
                        </svg>
                        <span class="curr-val">{formatNumber($gameStore.gold)} золота</span>
                    </div>

                    <div class="curr-chip click-chip" title="Сила клика">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <polygon points="13,2 4,14 11,14 10,22 20,9 13,9" fill="#ff7675" stroke="#d63031" stroke-width="1.5"/>
                        </svg>
                        <span class="curr-val">+{formatNumber($currentClickPower)}/клик</span>
                    </div>

                    <div class="curr-chip idle-chip" title="Доход в секунду">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <circle cx="12" cy="12" r="9" stroke="#74b9ff" stroke-width="2"/>
                            <polyline points="12,6 12,12 16,14" stroke="#74b9ff" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <span class="curr-val">+{formatNumber($currentIdleIncome)}/сек</span>
                    </div>
                </div>
            </div>
        {/if}

        <div class="shop-body-scroll">

        <!-- Золотая Жила: Майлстоуны прокачки -->
        <div class="milestone-card">
            <div class="milestone-top">
                <div class="milestone-badge">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                        <path d="M6 4 L18 4 L16 14 Q16 18 12 18 Q8 18 8 14 Z" fill="#f1c40f" stroke="#b7791f" stroke-width="1.5"/>
                        <path d="M4 6 H6 V10 H4 Z M18 6 H20 V10 H18 Z" fill="#f39c12"/>
                        <rect x="10" y="18" width="4" height="4" fill="#b7791f"/>
                    </svg>
                    <span>Золотая Жила: x{$milestoneInfo.multiplier.toFixed(2)} ко всему доходу</span>
                </div>
                <span class="milestone-step">{$milestoneInfo.progress} / 25 уровней</span>
            </div>
            <div class="milestone-bar">
                <div class="milestone-fill" style="width: {($milestoneInfo.progress / 25) * 100}%"></div>
            </div>
        </div>

        <!-- Controls: Category Filters & Multi-buy Toggle -->
        <div class="shop-controls-bar">
            <div class="category-tabs" role="tablist">
                <button 
                    type="button"
                    class="filter-pill" 
                    class:active={activeCategory === 'all'} 
                    on:click={() => activeCategory = 'all'}
                >
                    Все <span class="pill-count">{$gameStore.upgrades.length}</span>
                </button>
                <button 
                    type="button"
                    class="filter-pill" 
                    class:active={activeCategory === 'production'} 
                    on:click={() => activeCategory = 'production'}
                >
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                        <path d="M8 0a8 8 0 1 0 8 8 8 8 0 0 0-8-8zm0 14A6 6 0 1 1 14 8a6 6 0 0 1-6 6zm1-9H7v4h4V8H9z"/>
                    </svg>
                    Доход <span class="pill-count">{productionCount}</span>
                </button>
                <button 
                    type="button"
                    class="filter-pill" 
                    class:active={activeCategory === 'click'} 
                    on:click={() => activeCategory = 'click'}
                >
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                        <polygon points="9,1 2,9 7,9 6,15 14,6 9,6"/>
                    </svg>
                    Клик & Чары <span class="pill-count">{clickCount}</span>
                </button>
                <button 
                    type="button"
                    class="filter-pill" 
                    class:active={activeCategory === 'mastery'} 
                    on:click={() => activeCategory = 'mastery'}
                >
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/>
                        <polygon points="8,3 10,7 14,7 11,10 12,14 8,11 4,14 5,10 2,7 6,7"/>
                    </svg>
                    Мастерство <span class="pill-count">{masteryCount}</span>
                </button>
            </div>

            <div class="buy-mode-group" role="group" aria-label="Режим покупки">
                <button 
                    type="button"
                    class="mode-btn" 
                    class:active={buyMode === '1'} 
                    on:click={() => buyMode = '1'}
                >
                    x1
                </button>
                <button 
                    type="button"
                    class="mode-btn" 
                    class:active={buyMode === '10'} 
                    on:click={() => buyMode = '10'}
                >
                    x10
                </button>
                <button 
                    type="button"
                    class="mode-btn max-btn" 
                    class:active={buyMode === 'max'} 
                    on:click={() => buyMode = 'max'}
                >
                    MAX
                </button>
            </div>
        </div>

        <!-- Upgrades List -->
        <div class="upgrades-list">
            {#each visibleUpgrades as upgrade (upgrade.id)}
                {@const bulk = calculateBulkBuy(upgrade, buyMode, $gameStore.gold)}
                {@const canAfford = bulk.canAfford}
                {@const isCrit = upgrade.type === 'crit'}
                {@const isResonance = upgrade.type === 'resonance'}
                {@const isHearth = upgrade.type === 'hearth'}
                {@const isHeat = upgrade.type === 'heat'}
                
                <div class="upgrade-card" class:disabled={!canAfford}>
                    <div class="icon-wrap">
                        {@html upgrade.iconSvg}
                    </div>

                    <div class="info">
                        <div class="name-row">
                            <h4 class="name">{upgrade.name}</h4>
                            <div class="badges-row">
                                {#if upgrade.type === 'idle'}
                                    <span class="type-badge idle">Пассивно</span>
                                {:else if upgrade.type === 'click'}
                                    <span class="type-badge click">Клик</span>
                                {:else if isCrit}
                                    <span class="type-badge crit">Крит x5</span>
                                {:else if isResonance}
                                    <span class="type-badge resonance">Резонанс</span>
                                {:else if isHearth}
                                    <span class="type-badge mastery">Офлайн</span>
                                {:else if isHeat}
                                    <span class="type-badge heat">Комбо</span>
                                {/if}
                                <span class="level-badge">Ур. {upgrade.level}</span>
                            </div>
                        </div>

                        <p class="description">{upgrade.description}</p>

                        <div class="effect-preview">
                            {#if upgrade.type === 'idle'}
                                <span class="effect-current">Текущий: +{formatNumber(upgrade.baseValue * upgrade.level)}/сек</span>
                                <span class="effect-next">→ +{formatNumber(upgrade.baseValue * (upgrade.level + bulk.count))}/сек</span>
                            {:else if upgrade.type === 'click'}
                                <span class="effect-current">Текущий: +{formatNumber(upgrade.baseValue * upgrade.level)}</span>
                                <span class="effect-next">→ +{formatNumber(upgrade.baseValue * (upgrade.level + bulk.count))}</span>
                            {:else if isCrit}
                                <span class="effect-current">Шанс: {Math.round(upgrade.level * 3)}%</span>
                                <span class="effect-next">→ {Math.min(50, Math.round((upgrade.level + bulk.count) * 3))}% (кап 50%)</span>
                            {:else if isResonance}
                                <span class="effect-current">Бонус: +{upgrade.level}% дохода</span>
                                <span class="effect-next">→ +{upgrade.level + bulk.count}% (+{formatNumber($resonanceBonus)})</span>
                            {:else if isHearth}
                                <span class="effect-current">Офлайн: +{upgrade.level} ч (всего: {$maxOfflineTimeHours} ч)</span>
                                <span class="effect-next">→ +{upgrade.level + bulk.count} ч</span>
                            {:else if isHeat}
                                <span class="effect-current">Комбо-жар: +{upgrade.level * 25}%</span>
                                <span class="effect-next">→ +{(upgrade.level + bulk.count) * 25}%</span>
                            {/if}
                        </div>
                    </div>

                    <button 
                        type="button"
                        class="buy-btn" 
                        class:can-afford={canAfford}
                        bind:this={buttons[upgrade.id]}
                        on:click|stopPropagation={() => buyUpgrade(upgrade)}
                        aria-label="Купить {upgrade.name}"
                    >
                        <span class="buy-count">+{bulk.count}</span>
                        <span class="buy-price">
                            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" style="display:inline-block; vertical-align:middle; margin-right:2px;">
                                <circle cx="8" cy="8" r="7" fill="#f1c40f" stroke="#b7791f" stroke-width="1.5"/>
                                <circle cx="8" cy="8" r="4" fill="#f39c12"/>
                            </svg>
                            {formatNumber(bulk.totalCost)}
                        </span>
                    </button>
                </div>
            {/each}
        </div>
        </div>
    </div>
</div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(8, 5, 18, 0.82);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        padding: 16px;
        box-sizing: border-box;
    }

    .modal-content {
        background: linear-gradient(160deg, #1d0b33 0%, #120624 55%, #0a0314 100%);
        padding: 0;
        border-radius: 24px;
        border: 2px solid rgba(241, 196, 15, 0.4);
        box-shadow: 
            0 0 50px rgba(162, 155, 254, 0.25),
            0 25px 60px rgba(0, 0, 0, 0.85),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        width: 100%;
        max-width: 680px;
        max-height: 88vh;
        display: flex;
        flex-direction: column;
        position: relative;
        animation: popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        box-sizing: border-box;
        overflow: hidden;
    }

    .shop-body-scroll {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 14px 20px 20px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
    }

    .embedded {
        position: relative;
        background: transparent;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
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
        padding: 0;
    }

    @keyframes popIn {
        from { opacity: 0; transform: scale(0.92) translateY(12px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* Master Header */
    .master-header {
        position: relative;
        padding: 16px 20px 12px;
        background: rgba(0, 0, 0, 0.35);
        border-bottom: 1px solid rgba(241, 196, 15, 0.25);
        display: flex;
        flex-direction: column;
        gap: 10px;
        flex-shrink: 0;
    }

    .close-btn {
        position: absolute;
        top: 14px;
        right: 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 10px;
        width: 32px;
        height: 32px;
        color: #b2bec3;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        line-height: 1;
        z-index: 10;
    }

    .close-btn:hover {
        background: rgba(231, 76, 60, 0.2);
        border-color: #e74c3c;
        color: #ff7675;
    }

    .header-main {
        display: flex;
        align-items: center;
        gap: 14px;
        padding-right: 40px;
    }

    .master-icon-wrap {
        flex-shrink: 0;
        filter: drop-shadow(0 2px 10px rgba(241, 196, 15, 0.35));
    }

    .header-titles {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .title-text {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 900;
        letter-spacing: 1px;
        color: #f1c40f;
        text-shadow: 0 0 16px rgba(241, 196, 15, 0.4);
    }

    .subtitle-text {
        font-size: 0.78rem;
        color: #b2bec3;
        line-height: 1.25;
    }

    /* Currency Panel */
    .currencies-panel {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .curr-chip {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 4px 10px;
        font-size: 0.82rem;
        font-weight: 800;
        transition: all 0.2s ease;
    }

    .curr-chip:hover {
        transform: translateY(-1px);
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
    }

    .gold-chip {
        border-color: rgba(241, 196, 15, 0.3);
        color: #f1c40f;
    }

    .click-chip {
        border-color: rgba(255, 118, 117, 0.3);
        color: #fab1a0;
    }

    .idle-chip {
        border-color: rgba(116, 185, 255, 0.3);
        color: #81ecec;
    }

    /* Milestone Banner */
    .milestone-card {
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.12) 0%, rgba(243, 156, 18, 0.05) 100%);
        border: 1px solid rgba(241, 196, 15, 0.3);
        border-radius: 12px;
        padding: 8px 12px;
        margin-bottom: 10px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .milestone-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.82rem;
    }

    .milestone-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #ffeaa7;
        font-weight: 700;
    }

    .milestone-step {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.78rem;
        font-weight: 600;
    }

    .milestone-bar {
        height: 6px;
        background: rgba(0, 0, 0, 0.45);
        border-radius: 6px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .milestone-fill {
        height: 100%;
        background: linear-gradient(90deg, #f1c40f, #f39c12);
        border-radius: 6px;
        box-shadow: 0 0 8px rgba(241, 196, 15, 0.6);
        transition: width 0.3s ease-out;
    }

    /* Controls: Category Pills & Buy Multiplier */
    .shop-controls-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        background: rgba(0, 0, 0, 0.35);
        padding: 6px 10px;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        margin-bottom: 10px;
        flex-shrink: 0;
    }

    .category-tabs {
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
    }

    .filter-pill {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.75);
        padding: 5px 10px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
        transition: all 0.2s;
    }

    .filter-pill:hover {
        background: rgba(255, 255, 255, 0.12);
        color: white;
    }

    .filter-pill.active {
        background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%);
        border-color: #a29bfe;
        color: white;
        box-shadow: 0 0 10px rgba(108, 92, 231, 0.5);
    }

    .pill-count {
        background: rgba(0, 0, 0, 0.35);
        padding: 1px 5px;
        border-radius: 10px;
        font-size: 0.72rem;
    }

    .buy-mode-group {
        display: flex;
        background: rgba(0, 0, 0, 0.45);
        padding: 3px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        gap: 2px;
    }

    .mode-btn {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.65);
        padding: 4px 8px;
        font-size: 0.78rem;
        font-weight: 700;
        border-radius: 7px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .mode-btn:hover {
        color: white;
    }

    .mode-btn.active {
        background: #f1c40f;
        color: #1e1035;
        box-shadow: 0 0 8px rgba(241, 196, 15, 0.5);
    }

    .mode-btn.max-btn.active {
        background: #ff7675;
        color: white;
        box-shadow: 0 0 8px rgba(255, 118, 117, 0.6);
    }

    /* Upgrades List */
    .upgrades-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        overflow-y: auto;
        padding-right: 6px;
        flex: 1;
        min-height: 0;
    }

    .upgrades-list::-webkit-scrollbar {
        width: 6px;
    }

    .upgrades-list::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
    }

    .upgrades-list::-webkit-scrollbar-thumb {
        background: rgba(162, 155, 254, 0.4);
        border-radius: 10px;
    }

    .upgrades-list::-webkit-scrollbar-thumb:hover {
        background: rgba(162, 155, 254, 0.7);
    }

    .upgrade-card {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 12px 14px;
        display: flex;
        align-items: center;
        gap: 14px;
        transition: transform 0.2s, border-color 0.2s, background 0.2s;
        position: relative;
    }

    .upgrade-card:hover {
        border-color: rgba(162, 155, 254, 0.4);
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.04) 100%);
    }

    .icon-wrap {
        background: rgba(0, 0, 0, 0.45);
        border-radius: 14px;
        width: 52px;
        height: 52px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5);
    }

    .info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .name-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
    }

    .name {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
        color: #ffffff;
        text-shadow: 0 1px 3px rgba(0,0,0,0.8);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .badges-row {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .type-badge {
        font-size: 0.72rem;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .type-badge.idle {
        background: rgba(9, 132, 227, 0.25);
        color: #74b9ff;
        border: 1px solid rgba(9, 132, 227, 0.5);
    }

    .type-badge.click {
        background: rgba(231, 76, 60, 0.25);
        color: #ff7675;
        border: 1px solid rgba(231, 76, 60, 0.5);
    }

    .type-badge.crit {
        background: rgba(243, 156, 18, 0.25);
        color: #f1c40f;
        border: 1px solid rgba(243, 156, 18, 0.6);
        box-shadow: 0 0 6px rgba(243, 156, 18, 0.4);
    }

    .type-badge.resonance {
        background: rgba(155, 89, 182, 0.25);
        color: #d2a8ff;
        border: 1px solid rgba(155, 89, 182, 0.6);
        box-shadow: 0 0 6px rgba(155, 89, 182, 0.4);
    }

    .type-badge.mastery {
        background: rgba(46, 204, 113, 0.25);
        color: #2ecc71;
        border: 1px solid rgba(46, 204, 113, 0.6);
    }

    .type-badge.heat {
        background: rgba(230, 126, 34, 0.25);
        color: #e67e22;
        border: 1px solid rgba(230, 126, 34, 0.6);
        box-shadow: 0 0 6px rgba(230, 126, 34, 0.4);
    }

    .level-badge {
        font-size: 0.75rem;
        font-weight: 800;
        padding: 2px 8px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.1);
        color: #ffeaa7;
        border: 1px solid rgba(255, 255, 255, 0.15);
    }

    .description {
        margin: 0;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.65);
        line-height: 1.25;
    }

    .effect-preview {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.8rem;
        margin-top: 2px;
        flex-wrap: wrap;
    }

    .effect-current {
        color: rgba(255, 255, 255, 0.85);
        font-weight: 500;
    }

    .effect-next {
        color: #2ecc71;
        font-weight: 700;
    }

    /* Buy Button */
    .buy-btn {
        background: #4b4b5e;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        padding: 8px 14px;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        min-width: 95px;
        height: 48px;
        cursor: not-allowed;
        box-shadow: 0 3px 0 #2d3436;
        transition: all 0.2s;
        flex-shrink: 0;
        box-sizing: border-box;
    }

    .buy-btn.can-afford {
        background: linear-gradient(135deg, #f1c40f 0%, #f39c12 100%);
        color: #1e1035;
        cursor: pointer;
        box-shadow: 0 3px 0 #b7791f, 0 4px 12px rgba(241, 196, 15, 0.35);
    }

    .buy-btn.can-afford:hover {
        filter: brightness(1.08);
        transform: translateY(-1px);
        box-shadow: 0 4px 0 #b7791f, 0 6px 16px rgba(241, 196, 15, 0.5);
    }

    .buy-btn.can-afford:active {
        transform: translateY(2px);
        box-shadow: 0 1px 0 #b7791f;
    }

    .buy-count {
        font-size: 0.78rem;
        font-weight: 800;
        line-height: 1;
        opacity: 0.9;
    }

    .buy-price {
        font-size: 0.88rem;
        font-weight: 800;
        line-height: 1.1;
        white-space: nowrap;
        display: flex;
        align-items: center;
    }

    .upgrade-card.disabled {
        opacity: 0.72;
    }

    /* Responsive Design for Mobile Devices */
    @media (max-width: 600px) {
        .modal-content {
            max-height: 92vh;
            border-radius: 18px;
        }

        .master-header {
            padding: 14px 14px 10px;
        }

        .title-text {
            font-size: 1.15rem;
        }

        .currencies-panel {
            gap: 6px;
        }

        .curr-chip {
            padding: 3px 8px;
            font-size: 0.74rem;
        }

        .shop-body-scroll {
            padding: 10px 12px 14px;
        }

        .shop-controls-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            padding: 8px;
        }

        .category-tabs {
            justify-content: center;
        }

        .buy-mode-group {
            justify-content: center;
        }

        .upgrade-card {
            padding: 10px;
            gap: 10px;
        }

        .icon-wrap {
            width: 44px;
            height: 44px;
        }

        .name {
            font-size: 0.95rem;
        }

        .description {
            font-size: 0.75rem;
        }

        .effect-preview {
            font-size: 0.74rem;
        }

        .buy-btn {
            min-width: 80px;
            padding: 6px 10px;
            height: 44px;
        }

        .buy-price {
            font-size: 0.8rem;
        }
    }
</style>
