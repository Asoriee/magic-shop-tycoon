<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { 
        gameStore, 
        crystals, 
        stableIdleIncome,
        formatNumber,
        LUCKY_WHEEL_SECTORS, 
        rollLuckyWheelSectorIndex, 
        canLuckyWheelFreeSpin, 
        timeUntilLuckyWheelFreeSpinSec, 
        canLuckyWheelAdSpin, 
        executeLuckyWheelSpin,
        type LuckyWheelReward,
        type LuckyWheelSector
    } from '../store';
    import { showRewardedAd, saveGame } from '../yandex-sdk';
    import { playWheelTickSound, playJackpotFanfare, playSuccessSound } from '../audio';
    import { t } from '../i18n';
    import ResourceIcon from './ResourceIcon.svelte';

    export let isOpen = false;
    export let onClose: () => void = () => {};

    // State
    let isSpinning = false;
    let wheelRotation = 0; // Total accumulated degrees
    let pointerWobble = 0; // Pointer deflection in degrees
    let wonRewards: LuckyWheelReward[] = [];
    let showWinModal = false;

    // Timers
    let freeCooldownStr = '';
    let adCooldownStr = '';
    let spinsLeftToday = 5;
    let isAdReady = false;
    let isFreeReady = false;
    let tickerInterval: any;
    let animFrameId: number | null = null;

    function formatTime(totalSec: number): string {
        if (totalSec <= 0) return '';
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function updateTimers() {
        // Free cooldown
        const freeSec = timeUntilLuckyWheelFreeSpinSec();
        isFreeReady = freeSec <= 0;
        freeCooldownStr = formatTime(freeSec);

        // Ad cooldown
        const adStatus = canLuckyWheelAdSpin();
        isAdReady = adStatus.allowed;
        spinsLeftToday = adStatus.spinsLeftToday;
        adCooldownStr = formatTime(adStatus.remainingSec);
    }

    onMount(() => {
        updateTimers();
        tickerInterval = setInterval(updateTimers, 1000);
    });

    onDestroy(() => {
        if (tickerInterval) clearInterval(tickerInterval);
        if (animFrameId) cancelAnimationFrame(animFrameId);
    });

    // Reactive pity
    $: currentPity = $gameStore?.luckyWheel?.pityProgress || 0;
    $: isPityFull = currentPity >= 10;

    // SVG Sector Geometry Generation (Center = 180, 180, R = 168)
    const CX = 180;
    const CY = 180;
    const RADIUS = 168;
    const NUM_SECTORS = 8;
    const ANGLE_PER_SECTOR = 360 / NUM_SECTORS; // 45 deg

    function getSectorPath(index: number): string {
        const startAngle = (index * ANGLE_PER_SECTOR - 90 - ANGLE_PER_SECTOR / 2) * (Math.PI / 180);
        const endAngle = (index * ANGLE_PER_SECTOR - 90 + ANGLE_PER_SECTOR / 2) * (Math.PI / 180);

        const x1 = CX + RADIUS * Math.cos(startAngle);
        const y1 = CY + RADIUS * Math.sin(startAngle);
        const x2 = CX + RADIUS * Math.cos(endAngle);
        const y2 = CY + RADIUS * Math.sin(endAngle);

        return `M ${CX} ${CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${RADIUS} ${RADIUS} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    }

    // Colors for sectors
    const SECTOR_FILLS = [
        '#1e1b4b', // Gold: Obsidian indigo
        '#18182e', // Crystals: Night twilight
        '#281216', // Frenzy: Deep bloodstone
        '#0f2238', // Chest: Deep sapphire
        '#0d281a', // Reagents: Deep forest emerald
        '#1c163a', // Time Warp: Chronomancer violet
        '#221133', // Crystals 10: Mystic amethyst
        '#2e1b0c'  // Jackpot: Molten gold stone
    ];

    const SECTOR_STROKES = [
        '#f59e0b', // Gold
        '#38bdf8', // Crystals
        '#ef4444', // Frenzy
        '#0284c7', // Chest
        '#10b981', // Reagents
        '#818cf8', // Time Warp
        '#c084fc', // Crystals 10
        '#fbbf24'  // Jackpot
    ];

    /**
     * Animate Wheel Rotation with physics and procedural Web Audio ticks
     */
    function spinToSector(winningSectorIndex: number, onComplete: () => void) {
        isSpinning = true;
        
        // Winning sector center is at: winningSectorIndex * 45 deg
        // Pointer is at the top (12 o'clock, 0 deg).
        // To align sector center with pointer, wheel must rotate clockwise by: (360 - winningSectorIndex * 45) % 360
        const sectorCenter = (360 - (winningSectorIndex * ANGLE_PER_SECTOR)) % 360;
        // Add random jitter [-13, +13] to feel organic without crossing sector boundary (45/2 = 22.5)
        const jitter = (Math.random() * 24 - 12);
        // Full rotations: 6 to 8 complete rounds (2160 - 2880 deg)
        const fullSpins = (6 + Math.floor(Math.random() * 3)) * 360;
        
        const currentNorm = wheelRotation % 360;
        const targetDeg = wheelRotation + (360 - currentNorm) + fullSpins + sectorCenter + jitter;

        const startDeg = wheelRotation;
        const totalDistance = targetDeg - startDeg;
        const durationMs = 4500;
        const startTime = performance.now();
        let lastTickAngle = startDeg;

        function cubicEaseOut(t: number): number {
            return 1 - Math.pow(1 - t, 3.5);
        }

        function frame(now: number) {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / durationMs);
            const eased = cubicEaseOut(progress);

            const currentAngle = startDeg + totalDistance * eased;
            wheelRotation = currentAngle;

            // Trigger mechanical ticker audio on sector threshold crossing
            if (currentAngle - lastTickAngle >= ANGLE_PER_SECTOR) {
                lastTickAngle = currentAngle;
                // Pitch varies with speed
                const speed = 1 - progress;
                playWheelTickSound(0.8 + speed * 0.4);
                // Animate pointer deflection
                pointerWobble = -18 * Math.max(0.2, speed);
                setTimeout(() => { pointerWobble = 0; }, 40);
            }

            if (progress < 1) {
                animFrameId = requestAnimationFrame(frame);
            } else {
                wheelRotation = targetDeg;
                pointerWobble = 0;
                isSpinning = false;
                onComplete();
            }
        }

        animFrameId = requestAnimationFrame(frame);
    }

    async function handleFreeSpin() {
        if (isSpinning || !isFreeReady) return;
        const winningIndex = rollLuckyWheelSectorIndex();

        spinToSector(winningIndex, async () => {
            const res = executeLuckyWheelSpin('free', winningIndex);
            if (res.success) {
                wonRewards = res.rewards;
                showWinModal = true;
                if (winningIndex === 7 || res.rewards[0]?.isPityBonus) {
                    playJackpotFanfare();
                } else {
                    playSuccessSound();
                }
                await saveGame();
                updateTimers();
            }
        });
    }

    async function handleAdSpin() {
        if (isSpinning || !isAdReady) return;

        showRewardedAd(async () => {
            const winningIndex = rollLuckyWheelSectorIndex();
            spinToSector(winningIndex, async () => {
                const res = executeLuckyWheelSpin('ad', winningIndex);
                if (res.success) {
                    wonRewards = res.rewards;
                    showWinModal = true;
                    if (winningIndex === 7 || res.rewards[0]?.isPityBonus) {
                        playJackpotFanfare();
                    } else {
                        playSuccessSound();
                    }
                    await saveGame();
                    updateTimers();
                }
            });
        });
    }

    async function handleCrystalSpin() {
        if (isSpinning) return;
        if ($crystals < 10) return;

        const winningIndex = rollLuckyWheelSectorIndex();
        spinToSector(winningIndex, async () => {
            const res = executeLuckyWheelSpin('crystal', winningIndex);
            if (res.success) {
                wonRewards = res.rewards;
                showWinModal = true;
                if (winningIndex === 7 || res.rewards[0]?.isPityBonus) {
                    playJackpotFanfare();
                } else {
                    playSuccessSound();
                }
                await saveGame();
                updateTimers();
            }
        });
    }

    async function handleCrystal10Spins() {
        if (isSpinning) return;
        if ($crystals < 90) return;

        const winningIndex = rollLuckyWheelSectorIndex();
        spinToSector(winningIndex, async () => {
            const res = executeLuckyWheelSpin('crystal10', winningIndex);
            if (res.success) {
                wonRewards = res.rewards;
                showWinModal = true;
                playJackpotFanfare();
                await saveGame();
                updateTimers();
            }
        });
    }

    function closeWinModal() {
        showWinModal = false;
        wonRewards = [];
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div class="wheel-modal-overlay" on:click|self={onClose} role="dialog" aria-modal="true" tabindex="-1">
        <div class="wheel-dialog">
            <!-- Modal Header -->
            <header class="wheel-header">
                <div class="header-titles">
                    <h2 class="wheel-title">{$t('luckyWheel.title')}</h2>
                    <p class="wheel-subtitle">{$t('luckyWheel.subtitle')}</p>
                </div>
                <button type="button" class="close-btn" on:click={onClose} aria-label="{$t('common.close')}">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </header>

            <!-- Pity Meter Bar -->
            <div class="pity-section">
                <div class="pity-header-row">
                    <span class="pity-title">{$t('luckyWheel.pityTitle')}</span>
                    <span class="pity-counter" class:pity-full={isPityFull}>{currentPity}/10</span>
                </div>
                <div class="pity-bar-track">
                    {#each Array(10) as _, i}
                        <div 
                            class="pity-notch" 
                            class:notch-filled={i < currentPity}
                            class:notch-bonus={i === 9 && currentPity >= 10}
                        ></div>
                    {/each}
                </div>
                {#if isPityFull}
                    <div class="pity-alert-banner">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="#f59e0b">
                            <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/>
                        </svg>
                        <span>{$t('luckyWheel.pityActive')}</span>
                    </div>
                {:else}
                    <span class="pity-hint">{$t('luckyWheel.pityDesc')}</span>
                {/if}
            </div>

            <!-- Wheel Visual Stage -->
            <div class="wheel-stage">
                <!-- Golden Pointer / Ticker Arrow -->
                <div 
                    class="wheel-pointer-anchor"
                    style="transform: rotate({pointerWobble}deg);"
                >
                    <svg viewBox="0 0 36 44" width="36" height="44" class="pointer-svg">
                        <defs>
                            <linearGradient id="pointerGold" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#fff"/>
                                <stop offset="30%" stop-color="#fef08a"/>
                                <stop offset="70%" stop-color="#f59e0b"/>
                                <stop offset="100%" stop-color="#b45309"/>
                            </linearGradient>
                            <filter id="pointerGlow" x="-30%" y="-30%" width="160%" height="160%">
                                <feGaussianBlur stdDeviation="2.5" result="blur"/>
                                <feMerge>
                                    <feMergeNode in="blur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        <polygon points="18,42 6,10 18,2 30,10" fill="url(#pointerGold)" filter="url(#pointerGlow)" stroke="#78350f" stroke-width="1.5"/>
                        <circle cx="18" cy="14" r="4" fill="#fff" stroke="#f59e0b" stroke-width="1"/>
                    </svg>
                </div>

                <!-- Pure SVG Rotating Wheel Disc -->
                <div class="wheel-disc-wrap">
                    <svg 
                        viewBox="0 0 360 360" 
                        class="wheel-svg"
                    >
                        <defs>
                            <radialGradient id="jackpotAura" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#fef08a"/>
                                <stop offset="60%" stop-color="#f59e0b"/>
                                <stop offset="100%" stop-color="#9a3412"/>
                            </radialGradient>
                            <filter id="goldRingGlow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="blur"/>
                                <feMerge>
                                    <feMergeNode in="blur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>

                        <!-- Rotating Sector Disc Group -->
                        <g class="wheel-rotator" transform="rotate({wheelRotation}, 180, 180)">
                            <!-- Outer Runic Rim -->
                            <circle cx="180" cy="180" r="176" fill="#0f0920" stroke="#f59e0b" stroke-width="5" filter="url(#goldRingGlow)"/>
                            <circle cx="180" cy="180" r="172" fill="none" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="4 3"/>

                            <!-- 8 Sectors -->
                            {#each LUCKY_WHEEL_SECTORS as sector, i}
                                <g class="sector-group">
                                    <path 
                                        d={getSectorPath(i)} 
                                        fill={SECTOR_FILLS[i]} 
                                        stroke={SECTOR_STROKES[i]} 
                                        stroke-width="1.8"
                                    />

                                    <!-- Sector Content Group (Transformed to Sector Angle) -->
                                    <g transform="rotate({i * 45}, 180, 180)">
                                        <!-- Badge / Reward text near outer rim (kept upright and localized) -->
                                        <text 
                                            x="180" 
                                            y="46" 
                                            text-anchor="middle" 
                                            fill="#fff" 
                                            font-size="12" 
                                            font-weight="bold" 
                                            letter-spacing="0.5"
                                            class="sector-badge-text"
                                            transform="rotate({-(wheelRotation + i * 45)}, 180, 42)"
                                        >
                                            {$t(sector.badgeKey || '') || sector.badge}
                                        </text>

                                        <!-- Embedded Pure SVG Sector Icon (kept upright) -->
                                        <g transform="rotate({-(wheelRotation + i * 45)}, 180, 74)">
                                            <g transform="translate(164, 58)">
                                                {@html sector.iconSvg}
                                            </g>
                                        </g>
                                    </g>
                                </g>
                            {/each}
                        </g>

                        <!-- Center Archmage Orb & Spin Trigger Seal -->
                        <circle cx="180" cy="180" r="38" fill="#18132e" stroke="#f59e0b" stroke-width="3" filter="url(#goldRingGlow)"/>
                        <circle cx="180" cy="180" r="32" fill="#0c071a" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="3 2"/>
                        <circle cx="180" cy="180" r="22" fill="url(#jackpotAura)"/>
                        <polygon points="180,166 184,175 194,176 186,183 189,193 180,187 171,193 174,183 166,176 176,175" fill="#fff"/>
                    </svg>
                </div>
            </div>

            <!-- Action Controls Cluster -->
            <div class="wheel-controls">
                <!-- 1. Free Spin Button -->
                <button 
                    type="button" 
                    class="action-btn free-btn"
                    class:active={isFreeReady && !isSpinning}
                    disabled={!isFreeReady || isSpinning}
                    on:click={handleFreeSpin}
                >
                    <span class="btn-top-label">
                        {#if isFreeReady}
                            {$t('luckyWheel.freeSpinBtn')}
                        {:else}
                            {$t('luckyWheel.freeCooldown', { time: freeCooldownStr })}
                        {/if}
                    </span>
                    <span class="btn-cost-tag">{$t('common.free')}</span>
                </button>

                <!-- 2. Ad Spin Button -->
                <button 
                    type="button" 
                    class="action-btn ad-btn"
                    class:active={isAdReady && !isSpinning}
                    disabled={!isAdReady || isSpinning}
                    on:click={handleAdSpin}
                >
                    <span class="btn-top-label">
                        {#if spinsLeftToday <= 0}
                            {$t('luckyWheel.spinsLimitReached')}
                        {:else if isAdReady}
                            {$t('luckyWheel.adSpinBtn', { left: spinsLeftToday })}
                        {:else}
                            {$t('luckyWheel.adCooldown', { time: adCooldownStr })}
                        {/if}
                    </span>
                    <span class="btn-cost-tag ad-tag">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <polygon points="5,3 19,12 5,21"/>
                        </svg>
                        {$t('common.ad')}
                    </span>
                </button>

                <!-- 3. Crystal Single Spin (10 💎) -->
                <button 
                    type="button" 
                    class="action-btn crystal-btn"
                    disabled={isSpinning || $crystals < 10}
                    on:click={handleCrystalSpin}
                >
                    <span class="btn-top-label">{$t('luckyWheel.crystalSpin1Btn')}</span>
                    <span class="btn-cost-tag crystal-tag">
                        <ResourceIcon type="crystals" size={14} />
                        10
                    </span>
                </button>

                <!-- 4. Crystal 10x Spins (90 💎) -->
                <button 
                    type="button" 
                    class="action-btn crystal10-btn"
                    disabled={isSpinning || $crystals < 90}
                    on:click={handleCrystal10Spins}
                >
                    <span class="btn-top-label">
                        {$t('luckyWheel.crystalSpin10Btn')}
                        <span class="discount-badge">-10%</span>
                    </span>
                    <span class="btn-cost-tag crystal-tag">
                        <ResourceIcon type="crystals" size={14} />
                        90
                    </span>
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Win Celebration Modal -->
{#if showWinModal}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div class="win-modal-overlay" on:click|self={closeWinModal} role="dialog" aria-modal="true" tabindex="-1">
        <div class="win-dialog">
            <div class="win-header">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="#f59e0b">
                    <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/>
                </svg>
                <h3 class="win-title">{$t('luckyWheel.winTitle')}</h3>
            </div>

            <!-- List of Won Rewards -->
            <div class="rewards-deck">
                {#each wonRewards as reward, idx}
                    <div class="reward-card" class:jackpot-card={reward.type === 'jackpot'}>
                        <div class="reward-icon-box">
                            {@html LUCKY_WHEEL_SECTORS[reward.sectorIndex]?.iconSvg || ''}
                        </div>
                        <div class="reward-info">
                            <span class="reward-title">{reward.title}</span>
                            <span class="reward-desc">{reward.description}</span>
                            {#if reward.goldAmount}
                                <span class="reward-quant gold-quant">+{formatNumber(reward.goldAmount)} G</span>
                            {/if}
                            {#if reward.crystalAmount}
                                <span class="reward-quant crystal-quant">+{reward.crystalAmount} 💎</span>
                            {/if}
                            {#if reward.chestResult}
                                <span class="reward-quant chest-quant">📦 {reward.chestResult.drops.length} {$t('luckyWheel.chestItemsCount')}</span>
                            {/if}
                        </div>
                    </div>

                    <!-- Pity Bonus Card (if triggered) -->
                    {#if reward.isPityBonus}
                        <div class="pity-bonus-card">
                            <div class="pity-bonus-badge">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="#f59e0b">
                                    <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/>
                                </svg>
                                {$t('luckyWheel.pityBonusBadge')}
                            </div>
                            <p class="pity-bonus-desc">
                                {$t('luckyWheel.pityBonusDesc')}
                            </p>
                        </div>
                    {/if}
                {/each}
            </div>

            <button type="button" class="claim-win-btn" on:click={closeWinModal}>
                {$t('luckyWheel.claimReward')}
            </button>
        </div>
    </div>
{/if}

<style>
    *, *::before, *::after {
        box-sizing: border-box;
    }

    /* Overlay & Dialog Base */
    .wheel-modal-overlay {
        position: fixed;
        inset: 0;
        width: 100%;
        max-width: 100vw;
        height: 100%;
        max-height: 100dvh;
        box-sizing: border-box;
        overflow-x: hidden;
        background: rgba(8, 4, 18, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 12px;
        animation: fadeIn 0.25s ease-out;
    }

    .wheel-dialog {
        background: linear-gradient(175deg, #18112e 0%, #0d071c 100%);
        border: 1px solid rgba(245, 158, 11, 0.35);
        box-shadow: 0 0 40px rgba(0, 0, 0, 0.8), 0 0 24px rgba(245, 158, 11, 0.2);
        border-radius: 20px;
        width: 100%;
        max-width: 480px;
        max-height: 94vh;
        overflow-y: auto;
        overflow-x: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px 20px 22px;
        position: relative;
    }

    /* Header */
    .wheel-header {
        width: 100%;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 12px;
    }

    .header-titles {
        display: flex;
        flex-direction: column;
    }

    .wheel-title {
        margin: 0;
        font-size: 20px;
        font-weight: 800;
        color: #fef08a;
        text-shadow: 0 0 12px rgba(245, 158, 11, 0.5);
        letter-spacing: 0.5px;
    }

    .wheel-subtitle {
        margin: 3px 0 0;
        font-size: 12px;
        color: #94a3b8;
    }

    .close-btn {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #cbd5e1;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
    }

    .close-btn:hover {
        background: rgba(239, 68, 68, 0.25);
        color: #fff;
        border-color: #ef4444;
    }

    /* Pity Bar Section */
    .pity-section {
        width: 100%;
        background: rgba(15, 10, 30, 0.7);
        border: 1px solid rgba(245, 158, 11, 0.2);
        border-radius: 12px;
        padding: 8px 12px;
        margin-bottom: 14px;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .pity-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
    }

    .pity-title {
        color: #fde047;
        font-weight: 600;
    }

    .pity-counter {
        font-weight: 700;
        color: #cbd5e1;
    }

    .pity-counter.pity-full {
        color: #f59e0b;
        text-shadow: 0 0 8px rgba(245, 158, 11, 0.8);
    }

    .pity-bar-track {
        display: grid;
        grid-template-columns: repeat(10, 1fr);
        gap: 4px;
        height: 8px;
    }

    .pity-notch {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        transition: background 0.3s, box-shadow 0.3s;
    }

    .pity-notch.notch-filled {
        background: linear-gradient(180deg, #fef08a 0%, #f59e0b 100%);
        box-shadow: 0 0 6px rgba(245, 158, 11, 0.6);
    }

    .pity-notch.notch-bonus {
        background: #ef4444;
        box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
        animation: pulseBonus 1s infinite alternate;
    }

    .pity-alert-banner {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 700;
        color: #fef08a;
        background: rgba(245, 158, 11, 0.15);
        padding: 4px 8px;
        border-radius: 6px;
        border: 1px solid rgba(245, 158, 11, 0.4);
    }

    .pity-hint {
        font-size: 10.5px;
        color: #94a3b8;
    }

    /* Wheel Visual Stage */
    .wheel-stage {
        position: relative;
        width: 100%;
        max-width: 350px;
        aspect-ratio: 1;
        margin: 6px auto 16px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .wheel-pointer-anchor {
        position: absolute;
        top: -10px;
        left: 50%;
        margin-left: -18px;
        z-index: 20;
        pointer-events: none;
        transition: transform 0.05s ease-out;
        transform-origin: 18px 6px;
    }

    .pointer-svg {
        filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.8));
    }

    .wheel-disc-wrap {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 50%;
    }

    .wheel-svg {
        width: 100%;
        height: 100%;
        display: block;
    }

    .wheel-rotator {
        will-change: transform;
    }

    .sector-badge-text {
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9), 0 0 6px rgba(0, 0, 0, 0.8);
        user-select: none;
    }

    /* Action Buttons Cluster */
    .wheel-controls {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }

    .action-btn {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        cursor: pointer;
        min-height: 48px;
        color: #e2e8f0;
        transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
        position: relative;
    }

    .action-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }

    .btn-top-label {
        font-size: 12px;
        font-weight: 700;
        text-align: center;
        line-height: 1.2;
    }

    .btn-cost-tag {
        font-size: 11px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    /* Free Button Active */
    .free-btn.active {
        background: linear-gradient(180deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.4) 100%);
        border-color: #10b981;
        color: #ecfdf5;
        box-shadow: 0 0 16px rgba(16, 185, 129, 0.35);
    }
    .free-btn.active:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 22px rgba(16, 185, 129, 0.5);
    }

    /* Ad Button Active */
    .ad-btn.active {
        background: linear-gradient(180deg, rgba(14, 165, 233, 0.25) 0%, rgba(2, 132, 199, 0.35) 100%);
        border-color: #38bdf8;
        color: #f0f9ff;
        box-shadow: 0 0 16px rgba(14, 165, 233, 0.3);
    }
    .ad-btn.active:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 22px rgba(14, 165, 233, 0.5);
    }

    .ad-tag {
        color: #38bdf8;
    }

    /* Crystal Buttons */
    .crystal-btn {
        background: linear-gradient(180deg, rgba(168, 85, 247, 0.2) 0%, rgba(126, 34, 206, 0.3) 100%);
        border-color: rgba(168, 85, 247, 0.4);
    }
    .crystal-btn:not(:disabled):hover {
        transform: translateY(-2px);
        border-color: #c084fc;
        box-shadow: 0 0 16px rgba(168, 85, 247, 0.4);
    }

    .crystal10-btn {
        background: linear-gradient(180deg, rgba(245, 158, 11, 0.2) 0%, rgba(180, 83, 9, 0.3) 100%);
        border-color: rgba(245, 158, 11, 0.45);
    }
    .crystal10-btn:not(:disabled):hover {
        transform: translateY(-2px);
        border-color: #fde047;
        box-shadow: 0 0 18px rgba(245, 158, 11, 0.45);
    }

    .discount-badge {
        display: inline-block;
        background: #ef4444;
        color: #fff;
        font-size: 9.5px;
        padding: 1px 4px;
        border-radius: 4px;
        margin-left: 4px;
        vertical-align: middle;
    }

    .crystal-tag {
        color: #38bdf8;
    }

    /* Win Celebration Modal */
    .win-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.88);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 14px;
        animation: fadeIn 0.2s ease-out;
    }

    .win-dialog {
        background: linear-gradient(180deg, #22153d 0%, #120924 100%);
        border: 2px solid #f59e0b;
        box-shadow: 0 0 50px rgba(245, 158, 11, 0.5), 0 0 100px rgba(0, 0, 0, 0.9);
        border-radius: 20px;
        width: 100%;
        max-width: 420px;
        max-height: 85vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 24px 20px;
        text-align: center;
    }

    .win-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        margin-bottom: 16px;
    }

    .win-title {
        margin: 0;
        font-size: 22px;
        color: #fef08a;
        text-shadow: 0 0 12px rgba(245, 158, 11, 0.7);
    }

    .rewards-deck {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 20px;
    }

    .reward-card {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        text-align: left;
    }

    .reward-card.jackpot-card {
        border-color: #f59e0b;
        background: rgba(245, 158, 11, 0.15);
        box-shadow: 0 0 16px rgba(245, 158, 11, 0.3);
    }

    .reward-icon-box {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .reward-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow: hidden;
    }

    .reward-title {
        font-size: 14px;
        font-weight: 700;
        color: #fde047;
    }

    .reward-desc {
        font-size: 11.5px;
        color: #cbd5e1;
    }

    .reward-quant {
        font-size: 12px;
        font-weight: 700;
        margin-top: 2px;
    }

    .gold-quant { color: #facc15; }
    .crystal-quant { color: #38bdf8; }
    .chest-quant { color: #a78bfa; }

    .pity-bonus-card {
        background: linear-gradient(90deg, rgba(239, 68, 68, 0.2) 0%, rgba(245, 158, 11, 0.25) 100%);
        border: 1px solid #f59e0b;
        border-radius: 12px;
        padding: 10px 12px;
        text-align: left;
    }

    .pity-bonus-badge {
        font-size: 12px;
        font-weight: 800;
        color: #fef08a;
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
    }

    .pity-bonus-desc {
        margin: 0;
        font-size: 11px;
        color: #fed7aa;
        line-height: 1.3;
    }

    .claim-win-btn {
        width: 100%;
        background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
        border: none;
        color: #000;
        font-size: 15px;
        font-weight: 800;
        border-radius: 12px;
        padding: 13px;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .claim-win-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 22px rgba(245, 158, 11, 0.6);
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes pulseBonus {
        from { opacity: 0.6; transform: scale(0.98); }
        to { opacity: 1; transform: scale(1.04); }
    }

    /* Mobile Responsiveness */
    @media (max-width: 680px) {
        .wheel-modal-overlay {
            padding: 8px;
        }

        .wheel-dialog {
            padding: 12px 12px 16px;
            max-width: min(355px, calc(100vw - 16px));
            width: 100%;
            margin: 0 auto;
            box-sizing: border-box;
        }

        .wheel-title {
            font-size: 17px;
        }

        .wheel-subtitle {
            font-size: 11px;
        }

        .wheel-stage {
            max-width: 255px;
            margin: 4px auto 10px;
        }

        .wheel-controls {
            gap: 6px;
        }

        .action-btn {
            padding: 6px 8px;
            min-height: 44px;
        }

        .btn-top-label {
            font-size: 10.5px;
        }

        .btn-cost-tag {
            font-size: 10px;
        }
    }

    @media (max-width: 390px) {
        .wheel-modal-overlay {
            padding: 6px;
        }

        .wheel-dialog {
            padding: 10px 10px 14px;
            max-width: calc(100vw - 12px);
            width: 100%;
            margin: 0 auto;
            border-radius: 16px;
        }

        .wheel-title {
            font-size: 15px;
        }

        .wheel-subtitle {
            font-size: 10px;
        }

        .pity-section {
            padding: 6px 8px;
            margin-bottom: 8px;
            gap: 4px;
        }

        .pity-header-row {
            font-size: 11px;
        }

        .pity-hint {
            font-size: 9.5px;
        }

        .wheel-stage {
            max-width: 230px;
            margin: 2px auto 8px;
        }

        .wheel-controls {
            gap: 5px;
        }

        .action-btn {
            padding: 5px 6px;
            min-height: 40px;
            border-radius: 10px;
        }

        .btn-top-label {
            font-size: 9.5px;
        }

        .btn-cost-tag {
            font-size: 9px;
        }
    }
</style>
