<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import gsap from 'gsap';
    import { 
        gameStore, 
        currentIdleIncome, 
        formatNumber, 
        crystals, 
        isVip, 
        AVAILABLE_POTIONS,
        potionsCount,
        type Potion
    } from '../store';
    import { showRewardedAd, saveGame } from '../yandex-sdk';
    import ResourceIcon from './ResourceIcon.svelte';

    interface SparkBlessing {
        type: 'gold' | 'crystals' | 'astral';
        title: string;
        rarity: 'common' | 'rare' | 'epic';
        rarityLabel: string;
        description: string;
        gold: number;
        crystals: number;
        stardust: number;
        potion?: Potion;
    }

    let sparkElement: HTMLElement;
    let overlayEl: HTMLElement;
    let modalEl: HTMLElement;

    let sparkTween: gsap.core.Tween | null = null;
    let waveTween: gsap.core.Tween | null = null;
    let spawnTimer: number | null = null;

    let isVisible = false;
    let isModalOpen = false;
    let isClaiming = false;

    let currentBlessing: SparkBlessing | null = null;

    function scheduleSpawn() {
        if (spawnTimer) clearTimeout(spawnTimer);
        // Интервал от 1.5 до 2.5 минут (90 - 150 секунд)
        const delay = Math.random() * 60000 + 90000;
        spawnTimer = window.setTimeout(() => {
            spawnSpark();
        }, delay);
    }

    function spawnSpark() {
        if (isModalOpen) return;
        isVisible = true;

        setTimeout(() => {
            if (!sparkElement) return;

            const vh = window.innerHeight;
            const vw = window.innerWidth;
            const startY = Math.random() * (vh * 0.5) + vh * 0.2;
            const endX = vw + 90;
            const duration = Math.random() * 2.5 + 5.5; // 5.5 - 8 секунд

            gsap.set(sparkElement, { x: -80, y: startY, opacity: 1, scale: 1 });

            sparkTween = gsap.to(sparkElement, {
                x: endX,
                duration,
                ease: 'none',
                onComplete: () => {
                    isVisible = false;
                    scheduleSpawn();
                }
            });

            waveTween = gsap.to(sparkElement, {
                y: startY + (Math.random() > 0.5 ? 55 : -55),
                duration: duration / 4,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            });
        }, 60);
    }

    function rollBlessing(): SparkBlessing {
        const roll = Math.random();
        const baseIncome = $currentIdleIncome || 0;
        // 7 минут пассивного дохода, минимум 200 золота
        const baseGold = Math.max(200, Math.floor(baseIncome * 420));

        if (roll < 0.20) {
            // 20% Эпический дар: Астральная Вспышка (Золото + Звездная пыль ИЛИ редкое зелье)
            const givesPotion = Math.random() < 0.5 && AVAILABLE_POTIONS.length > 0;
            if (givesPotion) {
                const potion = AVAILABLE_POTIONS[Math.floor(Math.random() * AVAILABLE_POTIONS.length)];
                return {
                    type: 'astral',
                    title: 'Чародейский Эликсир',
                    rarity: 'epic',
                    rarityLabel: 'Эпический дар',
                    description: 'Искра сконденсировалась в редкое зелье и гору золота!',
                    gold: Math.floor(baseGold * 0.85),
                    crystals: 0,
                    stardust: 0,
                    potion
                };
            } else {
                return {
                    type: 'astral',
                    title: 'Астральная Вспышка',
                    rarity: 'epic',
                    rarityLabel: 'Эпический дар',
                    description: 'Искра осыпала мастерскую чистейшей звёздной пылью!',
                    gold: Math.floor(baseGold * 0.85),
                    crystals: 0,
                    stardust: 1
                };
            }
        } else if (roll < 0.50) {
            // 30% Редкий дар: Кристаллический Разряд (Золото + 2..3 кристалла)
            const crystalAmount = Math.floor(Math.random() * 2) + 2; // 2 или 3 кристалла
            return {
                type: 'crystals',
                title: 'Кристаллический Разряд',
                rarity: 'rare',
                rarityLabel: 'Редкий дар',
                description: 'Вспышка магии кристаллизовалась в драгоценные самоцветы!',
                gold: Math.floor(baseGold * 0.85),
                crystals: crystalAmount,
                stardust: 0
            };
        } else {
            // 50% Обычный дар: Золотая Энергия (Поток золота за 7 минут)
            return {
                type: 'gold',
                title: 'Золотая Энергия',
                rarity: 'common',
                rarityLabel: 'Чародейский дар',
                description: 'Мощный импульс золотого потока наполняет хранилище лавки.',
                gold: baseGold,
                crystals: 0,
                stardust: 0
            };
        }
    }

    function handleSparkClick() {
        if (!isVisible) return;

        if (sparkTween) sparkTween.pause();
        if (waveTween) waveTween.pause();

        isVisible = false;
        currentBlessing = rollBlessing();
        openModal();
    }

    function openModal() {
        isModalOpen = true;
        isClaiming = false;
        setTimeout(() => {
            if (overlayEl && modalEl) {
                gsap.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.25 });
                gsap.fromTo(modalEl, 
                    { scale: 0.9, y: 30, opacity: 0 }, 
                    { scale: 1, y: 0, opacity: 1, duration: 0.35, ease: 'back.out(1.2)' }
                );
            }
        }, 15);
    }

    function closeModal() {
        if (overlayEl && modalEl) {
            gsap.to(overlayEl, { opacity: 0, duration: 0.2 });
            gsap.to(modalEl, {
                y: 25,
                opacity: 0,
                scale: 0.92,
                duration: 0.2,
                ease: 'power2.in',
                onComplete: () => {
                    isModalOpen = false;
                    isClaiming = false;
                    currentBlessing = null;
                    scheduleSpawn();
                }
            });
        } else {
            isModalOpen = false;
            isClaiming = false;
            currentBlessing = null;
            scheduleSpawn();
        }
    }

    function claimBlessing() {
        if (isClaiming || !currentBlessing) return;
        isClaiming = true;

        showRewardedAd(
            () => {
                if (!currentBlessing) return;

                // Начисление золота
                if (currentBlessing.gold > 0) {
                    gameStore.addGold(currentBlessing.gold);
                }
                // Начисление кристаллов
                if (currentBlessing.crystals > 0) {
                    crystals.update(c => c + currentBlessing!.crystals);
                }
                // Начисление звёздной пыли
                if (currentBlessing.stardust > 0) {
                    gameStore.update(s => ({ ...s, stardust: s.stardust + currentBlessing!.stardust }));
                }
                // Начисление зелья
                if (currentBlessing.potion) {
                    const pid = currentBlessing.potion.id;
                    potionsCount.update(c => ({ ...c, [pid]: (c[pid] ?? 0) + 1 }));
                }

                // Засчитываем просмотр рекламы в квест
                gameStore.updateQuestProgress('watch_ads', 1);
                saveGame();
            },
            () => {
                closeModal();
            }
        );
    }

    onMount(() => {
        scheduleSpawn();

        // Хелперы для мгновенного ручного тестирования в консоли браузера
        (window as any).spawnSpark = () => {
            if (spawnTimer) clearTimeout(spawnTimer);
            spawnSpark();
        };
        (window as any).spawnFairy = (window as any).spawnSpark;
    });

    onDestroy(() => {
        if (spawnTimer) clearTimeout(spawnTimer);
        if (sparkTween) sparkTween.kill();
        if (waveTween) waveTween.kill();
        delete (window as any).spawnSpark;
        delete (window as any).spawnFairy;
    });
</script>

<!-- ============================================================ -->
<!-- 1. IN-FLIGHT ARCANE SPARK (FLYING ENTITY)                     -->
<!-- ============================================================ -->
{#if isVisible}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div 
        class="arcane-spark-flyer" 
        bind:this={sparkElement} 
        on:click={handleSparkClick}
        title="Чародейская Искра! Нажмите, чтобы поймать"
    >
        <svg viewBox="0 0 90 90" width="80" height="80" class="spark-svg">
            <defs>
                <!-- Plasma Aura Radial Gradient -->
                <radialGradient id="flyerAuraGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
                    <stop offset="30%" stop-color="#ffeaa7" stop-opacity="0.95"/>
                    <stop offset="65%" stop-color="#f1c40f" stop-opacity="0.6"/>
                    <stop offset="85%" stop-color="#e67e22" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="#9b59b6" stop-opacity="0"/>
                </radialGradient>

                <radialGradient id="sparkCoreGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="45%" stop-color="#74b9ff"/>
                    <stop offset="80%" stop-color="#a29bfe"/>
                    <stop offset="100%" stop-color="#6c5ce7"/>
                </radialGradient>

                <!-- Filter Glow -->
                <filter id="flyerGlowFilter" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3.5" result="blur"/>
                    <feMerge>
                        <feMergeNode in="blur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>

            <!-- Comet Stardust Tail (Trailing Wisps) -->
            <g class="spark-tail-wisps" opacity="0.85">
                <circle cx="22" cy="46" r="3.2" fill="#ffeaa7" opacity="0.6"/>
                <circle cx="14" cy="50" r="2.2" fill="#f1c40f" opacity="0.45"/>
                <circle cx="7" cy="53" r="1.4" fill="#a29bfe" opacity="0.3"/>
                <circle cx="26" cy="40" r="2.5" fill="#ffffff" opacity="0.7"/>
            </g>

            <!-- Outer Pulsing Energy Halo -->
            <circle cx="45" cy="45" r="26" fill="url(#flyerAuraGrad)" class="pulse-aura"/>

            <!-- Orbital Runic Arc 1 (Tilted Clockwise) -->
            <ellipse 
                cx="45" cy="45" rx="30" ry="11" 
                fill="none" 
                stroke="#f1c40f" 
                stroke-width="1.6" 
                stroke-dasharray="8 5" 
                transform="rotate(-28 45 45)" 
                opacity="0.85"
                class="orbital-arc-cw"
            />

            <!-- Orbital Runic Arc 2 (Tilted Counter-Clockwise) -->
            <ellipse 
                cx="45" cy="45" rx="27" ry="9" 
                fill="none" 
                stroke="#a29bfe" 
                stroke-width="1.3" 
                stroke-dasharray="6 4" 
                transform="rotate(38 45 45)" 
                opacity="0.75"
                class="orbital-arc-ccw"
            />

            <!-- Primary 4-Point Flare -->
            <path 
                d="M 45 12 Q 45 45 12 45 Q 45 45 45 78 Q 45 45 78 45 Q 45 45 45 12 Z" 
                fill="#ffffff" 
                opacity="0.95" 
                filter="url(#flyerGlowFilter)"
                class="spark-flare"
            />

            <!-- Secondary Diagonal Flare -->
            <path 
                d="M 45 23 Q 45 45 23 45 Q 45 45 45 67 Q 45 45 67 45 Q 45 45 45 23 Z" 
                fill="#ffeaa7" 
                opacity="0.8" 
                transform="rotate(45 45 45)"
            />

            <!-- Radiant Spark Core -->
            <circle cx="45" cy="45" r="9" fill="url(#sparkCoreGrad)" filter="url(#flyerGlowFilter)"/>
            <circle cx="45" cy="45" r="4.5" fill="#ffffff"/>
        </svg>
    </div>
{/if}

<!-- ============================================================ -->
<!-- 2. ARCANE SPARK MODAL WINDOW                                 -->
<!-- ============================================================ -->
{#if isModalOpen && currentBlessing}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="spark-overlay" bind:this={overlayEl} on:click={closeModal}>
        <div class="spark-ambient-glow"></div>

        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="spark-modal-card" bind:this={modalEl} on:click|stopPropagation>
            
            <!-- Close Button -->
            <button class="spark-close-btn" on:click={closeModal} title="Отпустить искру" aria-label="Закрыть">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            <!-- Header Badge & Title -->
            <div class="spark-header">
                <span class="spark-category-tag">
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="#ffeaa7">
                        <path d="M8 1 L9.5 5.5 L14 7 L9.5 8.5 L8 13 L6.5 8.5 L2 7 L6.5 5.5 Z"/>
                    </svg>
                    БЛУЖДАЮЩАЯ ЭНЕРГИЯ
                </span>
                <h2 class="spark-title">Чародейская Искра</h2>
                <p class="spark-intro">
                    Вы поймали сгусток первородной магии! Высвободите его силу, чтобы наполнить лавку древней мощью.
                </p>
            </div>

            <!-- Central Astrolabe / Spark Sphere Illustration (Pure SVG) -->
            <div class="spark-illustration-wrap">
                <svg viewBox="0 0 120 110" width="110" height="100" class="astrolabe-svg">
                    <defs>
                        <radialGradient id="astrolabeAura" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stop-color="#ffd700" stop-opacity="0.8"/>
                            <stop offset="45%" stop-color="#e056fd" stop-opacity="0.4"/>
                            <stop offset="85%" stop-color="#0984e3" stop-opacity="0.1"/>
                            <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
                        </radialGradient>
                        <filter id="coreGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="b"/>
                            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                    </defs>

                    <!-- Background Aura -->
                    <circle cx="60" cy="55" r="42" fill="url(#astrolabeAura)" class="astrolabe-aura"/>

                    <!-- Outer Golden Runic Armillary Ring -->
                    <circle cx="60" cy="55" r="42" fill="none" stroke="#f1c40f" stroke-width="1.8" stroke-dasharray="16 4" opacity="0.9"/>
                    <circle cx="60" cy="55" r="38" fill="none" stroke="#e67e22" stroke-width="0.8" opacity="0.6"/>

                    <!-- Internal Axis Ticks -->
                    <line x1="18" y1="55" x2="102" y2="55" stroke="#f1c40f" stroke-width="0.8" opacity="0.35"/>
                    <line x1="60" y1="13" x2="60" y2="97" stroke="#f1c40f" stroke-width="0.8" opacity="0.35"/>

                    <!-- Orbit Ring 1 (Angled) -->
                    <ellipse cx="60" cy="55" rx="36" ry="14" fill="none" stroke="#74b9ff" stroke-width="1.2" stroke-dasharray="8 4" transform="rotate(-30 60 55)" opacity="0.75"/>

                    <!-- Orbit Ring 2 (Cross Angled) -->
                    <ellipse cx="60" cy="55" rx="34" ry="12" fill="none" stroke="#e056fd" stroke-width="1.2" stroke-dasharray="6 3" transform="rotate(40 60 55)" opacity="0.75"/>

                    <!-- Central Radiant Starburst -->
                    <path 
                        d="M 60 22 Q 60 55 27 55 Q 60 55 60 88 Q 60 55 93 55 Q 60 55 60 22 Z" 
                        fill="#ffffff" 
                        opacity="0.9" 
                        filter="url(#coreGlow)"
                    />
                    <path 
                        d="M 60 32 Q 60 55 37 55 Q 60 55 60 78 Q 60 55 83 55 Q 60 55 60 32 Z" 
                        fill="#ffeaa7" 
                        transform="rotate(45 60 55)" 
                        opacity="0.85"
                    />

                    <!-- Core Hot Spark -->
                    <circle cx="60" cy="55" r="10" fill="#fff" filter="url(#coreGlow)"/>
                    <circle cx="60" cy="55" r="5" fill="#f1c40f"/>
                    <circle cx="60" cy="55" r="2.5" fill="#ffffff"/>

                    <!-- Floating Orbiting Spark Particles -->
                    <circle cx="34" cy="38" r="1.8" fill="#ffeaa7" opacity="0.85"/>
                    <circle cx="86" cy="72" r="1.8" fill="#74b9ff" opacity="0.85"/>
                    <circle cx="82" cy="34" r="1.5" fill="#e056fd" opacity="0.8"/>
                    <circle cx="38" cy="76" r="1.5" fill="#f1c40f" opacity="0.8"/>
                </svg>
            </div>

            <!-- Blessing Details Showcase Card -->
            <div class="blessing-card rarity-{currentBlessing.rarity}">
                <!-- Card Header with Rarity Pill -->
                <div class="blessing-card-top">
                    <div class="blessing-name-wrap">
                        <span class="blessing-title-text">{currentBlessing.title}</span>
                    </div>
                    <span class="rarity-pill pill-{currentBlessing.rarity}">
                        {currentBlessing.rarityLabel}
                    </span>
                </div>

                <p class="blessing-desc">{currentBlessing.description}</p>

                <!-- Rewards List Grid -->
                <div class="rewards-deck">
                    <!-- Gold Reward Chip -->
                    {#if currentBlessing.gold > 0}
                        <div class="reward-chip gold-chip">
                            <span class="reward-svg-icon">
                                <ResourceIcon type="gold" size={22} />
                            </span>
                            <div class="reward-data">
                                <span class="reward-label">Золото</span>
                                <span class="reward-amount gold-text">+{formatNumber(currentBlessing.gold)}</span>
                            </div>
                        </div>
                    {/if}

                    <!-- Crystals Reward Chip -->
                    {#if currentBlessing.crystals > 0}
                        <div class="reward-chip crystal-chip">
                            <span class="reward-svg-icon">
                                <ResourceIcon type="crystals" size={22} />
                            </span>
                            <div class="reward-data">
                                <span class="reward-label">Самоцветы</span>
                                <span class="reward-amount crystal-text">+{currentBlessing.crystals}</span>
                            </div>
                        </div>
                    {/if}

                    <!-- Stardust Reward Chip -->
                    {#if currentBlessing.stardust > 0}
                        <div class="reward-chip stardust-chip">
                            <span class="reward-svg-icon">
                                <ResourceIcon type="stardust" size={22} />
                            </span>
                            <div class="reward-data">
                                <span class="reward-label">Звёздная пыль</span>
                                <span class="reward-amount stardust-text">+{currentBlessing.stardust}</span>
                            </div>
                        </div>
                    {/if}

                    <!-- Magic Potion Chip -->
                    {#if currentBlessing.potion}
                        <div class="reward-chip potion-chip" title="{currentBlessing.potion.name}: {currentBlessing.potion.description}">
                            <span class="reward-svg-icon potion-svg-box">
                                {@html currentBlessing.potion.icon}
                            </span>
                            <div class="reward-data">
                                <span class="reward-label">Зелье</span>
                                <span class="reward-amount potion-text">{currentBlessing.potion.name}</span>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="spark-actions-row">
                {#if $isVip}
                    <!-- VIP Claim Button (Instant, No Ad) -->
                    <button 
                        class="action-btn btn-vip-claim" 
                        on:click={claimBlessing} 
                        disabled={isClaiming}
                        title="Получить дар мгновенно по привилегии VIP"
                    >
                        <div class="btn-sheen-glow"></div>
                        <span class="btn-content-wrap">
                            <span class="btn-icon">
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                                    <path d="M3 18 L21 18 L19 9 L15 13 L12 6 L9 13 L5 9 Z" fill="#1a0a2e" stroke="#1a0a2e" stroke-width="1.8" stroke-linejoin="round"/>
                                    <circle cx="12" cy="5" r="1.8" fill="#1a0a2e"/>
                                </svg>
                            </span>
                            <div class="btn-text-block">
                                <span class="btn-primary-label">ВЫСВОБОДИТЬ ДАР</span>
                                <span class="btn-sub-label">VIP ПРИВИЛЕГИЯ • БЕЗ РЕКЛАМЫ</span>
                            </div>
                        </span>
                    </button>
                {:else}
                    <!-- Standard Rewarded Ad Claim Button -->
                    <button 
                        class="action-btn btn-ad-claim" 
                        on:click={claimBlessing} 
                        disabled={isClaiming}
                        title="Посмотреть рекламу и забрать дар"
                    >
                        <div class="btn-sheen-glow"></div>
                        <span class="btn-content-wrap">
                            <span class="btn-icon">
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                                    <rect x="2" y="5" width="14" height="14" rx="3" fill="#ffffff" opacity="0.95"/>
                                    <polygon points="16,10 22,6 22,18 16,14" fill="#ffffff"/>
                                    <polygon points="6,9 12,12 6,15" fill="#27ae60"/>
                                </svg>
                            </span>
                            <div class="btn-text-block">
                                <span class="btn-primary-label">ВЫСВОБОДИТЬ ДАР</span>
                                <span class="btn-sub-label">СМОТРЕТЬ РЕКЛАМУ</span>
                            </div>
                        </span>
                    </button>
                {/if}

                <!-- Dismiss Button -->
                <button class="action-btn btn-dismiss" on:click={closeModal} disabled={isClaiming}>
                    Отпустить искру
                </button>
            </div>

        </div>
    </div>
{/if}

<style>
    /* ============================================================ */
    /* 1. IN-FLIGHT FLYING SPARK                                    */
    /* ============================================================ */
    .arcane-spark-flyer {
        position: fixed;
        top: 0;
        left: -100px;
        width: 80px;
        height: 80px;
        z-index: 120;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        -webkit-user-select: none;
        outline: none;
        -webkit-tap-highlight-color: transparent;
        will-change: transform;
        filter: drop-shadow(0 0 12px rgba(241, 196, 15, 0.75));
        transition: transform 0.15s ease, filter 0.15s ease;
    }

    .arcane-spark-flyer:hover {
        transform: scale(1.15);
        filter: drop-shadow(0 0 22px rgba(241, 196, 15, 0.95)) drop-shadow(0 0 35px rgba(224, 86, 253, 0.6));
    }

    .arcane-spark-flyer:active {
        transform: scale(0.95);
    }

    .pulse-aura {
        animation: sparkPulseAura 1.8s ease-in-out infinite alternate;
        transform-origin: 45px 45px;
    }

    @keyframes sparkPulseAura {
        0% { transform: scale(0.92); opacity: 0.7; }
        100% { transform: scale(1.12); opacity: 1; }
    }

    .orbital-arc-cw {
        transform-origin: 45px 45px;
        animation: spinCW 6s linear infinite;
    }

    .orbital-arc-ccw {
        transform-origin: 45px 45px;
        animation: spinCCW 4.5s linear infinite;
    }

    @keyframes spinCW {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    @keyframes spinCCW {
        from { transform: rotate(360deg); }
        to { transform: rotate(0deg); }
    }

    .spark-flare {
        transform-origin: 45px 45px;
        animation: flareThrob 2.2s ease-in-out infinite alternate;
    }

    @keyframes flareThrob {
        0% { transform: scale(0.95); }
        100% { transform: scale(1.08); }
    }

    /* ============================================================ */
    /* 2. MODAL OVERLAY & CARD (ARCANUM DESIGN SYSTEM)              */
    /* ============================================================ */
    .spark-overlay {
        position: fixed;
        inset: 0;
        background: rgba(8, 3, 18, 0.82);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 150;
        padding: 16px;
        box-sizing: border-box;
    }

    .spark-ambient-glow {
        position: absolute;
        width: 320px;
        height: 320px;
        background: radial-gradient(circle, rgba(241, 196, 15, 0.18) 0%, rgba(162, 155, 254, 0.1) 45%, transparent 70%);
        pointer-events: none;
        filter: blur(40px);
        z-index: 0;
    }

    .spark-modal-card {
        position: relative;
        width: 100%;
        max-width: 430px;
        background: linear-gradient(165deg, rgba(29, 15, 56, 0.98) 0%, rgba(16, 6, 36, 0.99) 50%, rgba(10, 3, 23, 1) 100%);
        border: 1.5px solid rgba(241, 196, 15, 0.45);
        border-radius: 24px;
        padding: 24px 22px 20px;
        box-shadow: 
            0 16px 45px rgba(0, 0, 0, 0.85),
            0 0 35px rgba(241, 196, 15, 0.15),
            inset 0 1px 4px rgba(255, 255, 255, 0.18);
        color: #f5f6fa;
        text-align: center;
        z-index: 1;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    /* Close Button */
    .spark-close-btn {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(241, 196, 15, 0.3);
        color: #dfe6e9;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 0;
        z-index: 10;
        outline: none;
    }

    .spark-close-btn:hover {
        background: rgba(231, 76, 60, 0.3);
        border-color: #e74c3c;
        color: #fff;
        transform: rotate(90deg) scale(1.08);
    }

    .spark-close-btn:active {
        transform: rotate(90deg) scale(0.95);
    }

    /* Header */
    .spark-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
    }

    .spark-category-tag {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 0.68rem;
        font-weight: 800;
        color: #ffeaa7;
        background: rgba(241, 196, 15, 0.14);
        border: 1px solid rgba(241, 196, 15, 0.35);
        padding: 3px 9px;
        border-radius: 12px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
    }

    .spark-title {
        font-size: 1.65rem;
        font-weight: 900;
        margin: 0;
        color: #ffeaa7;
        text-shadow: 0 0 16px rgba(241, 196, 15, 0.45);
        letter-spacing: 0.5px;
    }

    .spark-intro {
        font-size: 0.82rem;
        line-height: 1.35;
        color: rgba(223, 230, 233, 0.8);
        margin: 0;
        max-width: 350px;
    }

    /* Illustration */
    .spark-illustration-wrap {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 10px 0 12px;
        filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.6));
    }

    .astrolabe-svg {
        animation: floatSpark 3.6s ease-in-out infinite alternate;
    }

    @keyframes floatSpark {
        0% { transform: translateY(0); }
        100% { transform: translateY(-7px); }
    }

    /* ============================================================ */
    /* 3. BLESSING SHOWCASE CARD                                    */
    /* ============================================================ */
    .blessing-card {
        width: 100%;
        background: rgba(0, 0, 0, 0.38);
        border-radius: 18px;
        padding: 14px 14px 12px;
        box-sizing: border-box;
        margin-bottom: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        border: 1.5px solid rgba(255, 255, 255, 0.12);
        box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
        transition: border-color 0.3s ease;
    }

    .blessing-card.rarity-common {
        border-color: rgba(241, 196, 15, 0.4);
        background: linear-gradient(180deg, rgba(241, 196, 15, 0.08) 0%, rgba(0, 0, 0, 0.38) 100%);
    }

    .blessing-card.rarity-rare {
        border-color: rgba(116, 185, 255, 0.5);
        background: linear-gradient(180deg, rgba(116, 185, 255, 0.1) 0%, rgba(0, 0, 0, 0.38) 100%);
    }

    .blessing-card.rarity-epic {
        border-color: rgba(224, 86, 253, 0.55);
        background: linear-gradient(180deg, rgba(224, 86, 253, 0.12) 0%, rgba(0, 0, 0, 0.38) 100%);
    }

    .blessing-card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .blessing-title-text {
        font-size: 1.02rem;
        font-weight: 800;
        color: #ffffff;
        letter-spacing: 0.3px;
    }

    .rarity-pill {
        font-size: 0.65rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        padding: 2px 8px;
        border-radius: 10px;
    }

    .pill-common {
        background: rgba(241, 196, 15, 0.2);
        color: #ffeaa7;
        border: 1px solid rgba(241, 196, 15, 0.45);
    }

    .pill-rare {
        background: rgba(116, 185, 255, 0.2);
        color: #74b9ff;
        border: 1px solid rgba(116, 185, 255, 0.45);
    }

    .pill-epic {
        background: rgba(224, 86, 253, 0.22);
        color: #e056fd;
        border: 1px solid rgba(224, 86, 253, 0.55);
    }

    .blessing-desc {
        font-size: 0.76rem;
        line-height: 1.35;
        color: rgba(223, 230, 233, 0.72);
        margin: 0;
        text-align: left;
    }

    /* Rewards Grid */
    .rewards-deck {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
        margin-top: 2px;
    }

    .reward-chip {
        flex: 1;
        min-width: 130px;
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 14px;
        padding: 6px 10px;
        box-sizing: border-box;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
    }

    .gold-chip {
        border-color: rgba(241, 196, 15, 0.35);
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.12), rgba(0, 0, 0, 0.25));
    }

    .crystal-chip {
        border-color: rgba(116, 185, 255, 0.35);
        background: linear-gradient(135deg, rgba(116, 185, 255, 0.12), rgba(0, 0, 0, 0.25));
    }

    .stardust-chip {
        border-color: rgba(224, 86, 253, 0.35);
        background: linear-gradient(135deg, rgba(224, 86, 253, 0.14), rgba(0, 0, 0, 0.25));
    }

    .potion-chip {
        border-color: rgba(46, 204, 113, 0.35);
        background: linear-gradient(135deg, rgba(46, 204, 113, 0.12), rgba(0, 0, 0, 0.25));
    }

    .reward-svg-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .potion-svg-box {
        width: 22px;
        height: 26px;
    }

    .potion-svg-box :global(svg) {
        width: 22px;
        height: 26px;
    }

    .reward-data {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        line-height: 1.15;
    }

    .reward-label {
        font-size: 0.62rem;
        font-weight: 700;
        color: rgba(223, 230, 233, 0.6);
        text-transform: uppercase;
        letter-spacing: 0.4px;
    }

    .reward-amount {
        font-size: 0.95rem;
        font-weight: 900;
        letter-spacing: 0.3px;
    }

    .gold-text {
        color: #f1c40f;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
    }

    .crystal-text {
        color: #74b9ff;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
    }

    .stardust-text {
        color: #e056fd;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
    }

    .potion-text {
        color: #2ecc71;
        font-size: 0.8rem;
    }

    /* ============================================================ */
    /* 4. ACTIONS ROW & BUTTONS                                     */
    /* ============================================================ */
    .spark-actions-row {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .action-btn {
        position: relative;
        width: 100%;
        padding: 12px 16px;
        border-radius: 16px;
        font-family: inherit;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        outline: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition: transform 0.15s ease, filter 0.2s ease, box-shadow 0.2s ease;
        overflow: hidden;
        border: none;
    }

    .action-btn:active {
        transform: scale(0.97);
    }

    .action-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        filter: grayscale(0.6);
    }

    .btn-content-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        z-index: 2;
    }

    .btn-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
    }

    .btn-text-block {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        line-height: 1.1;
    }

    .btn-primary-label {
        font-size: 0.98rem;
        font-weight: 900;
        letter-spacing: 0.5px;
    }

    .btn-sub-label {
        font-size: 0.64rem;
        font-weight: 800;
        letter-spacing: 0.6px;
        opacity: 0.9;
        text-transform: uppercase;
    }

    /* VIP Claim Button */
    .btn-vip-claim {
        background: linear-gradient(135deg, #f1c40f 0%, #f39c12 50%, #d35400 100%);
        color: #1a0a2e;
        border: 1.5px solid #ffeaa7;
        box-shadow: 0 6px 20px rgba(241, 196, 15, 0.45);
    }

    .btn-vip-claim:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(241, 196, 15, 0.6);
        filter: brightness(1.08);
    }

    .btn-vip-claim .btn-sub-label {
        color: #2c0e42;
    }

    /* Ad Claim Button */
    .btn-ad-claim {
        background: linear-gradient(135deg, #2ecc71 0%, #27ae60 50%, #1e8449 100%);
        color: #ffffff;
        border: 1.5px solid rgba(255, 255, 255, 0.35);
        box-shadow: 0 6px 20px rgba(46, 204, 113, 0.45);
    }

    .btn-ad-claim:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(46, 204, 113, 0.6);
        filter: brightness(1.08);
    }

    .btn-ad-claim .btn-sub-label {
        color: #d4edda;
    }

    /* Sheen Glow on Buttons */
    .btn-sheen-glow {
        position: absolute;
        top: 0;
        left: -100%;
        width: 60%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
        transform: skewX(-25deg);
        animation: btnSheenAnim 3s infinite ease-in-out;
        pointer-events: none;
    }

    @keyframes btnSheenAnim {
        0%, 35% { left: -100%; }
        65%, 100% { left: 160%; }
    }

    /* Dismiss Button */
    .btn-dismiss {
        background: rgba(255, 255, 255, 0.06);
        color: rgba(223, 230, 233, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 9px 16px;
        font-size: 0.84rem;
        font-weight: 700;
        letter-spacing: 0.3px;
    }

    .btn-dismiss:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.2);
    }

    /* ============================================================ */
    /* 5. RESPONSIVE ADAPTATIONS                                    */
    /* ============================================================ */
    @media (max-width: 480px) {
        .spark-modal-card {
            padding: 20px 16px 16px;
            border-radius: 20px;
            max-width: 100%;
        }

        .spark-title {
            font-size: 1.4rem;
        }

        .spark-intro {
            font-size: 0.76rem;
        }

        .spark-illustration-wrap {
            margin: 6px 0 8px;
        }

        .astrolabe-svg {
            width: 95px;
            height: 85px;
        }

        .blessing-card {
            padding: 10px 10px 8px;
            margin-bottom: 12px;
        }

        .blessing-title-text {
            font-size: 0.92rem;
        }

        .blessing-desc {
            font-size: 0.72rem;
        }

        .reward-chip {
            min-width: 110px;
            padding: 5px 8px;
        }

        .reward-amount {
            font-size: 0.88rem;
        }

        .action-btn {
            padding: 11px 14px;
            border-radius: 14px;
        }

        .btn-primary-label {
            font-size: 0.92rem;
        }

        .btn-sub-label {
            font-size: 0.6rem;
        }
    }
</style>
