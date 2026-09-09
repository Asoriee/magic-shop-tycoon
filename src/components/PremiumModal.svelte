<script lang="ts">
    import { tick } from 'svelte';
    import gsap from 'gsap';
    import BankModal from './BankModal.svelte';
    import CrystalShopModal from './CrystalShopModal.svelte';
    import RebirthModal from './RebirthModal.svelte';
    import SecretUpgradesTab from './SecretUpgradesTab.svelte';
    import { 
        gameStore, 
        crystals, 
        isVip, 
        vipDaysLeft,
        isVipDailyRewardAvailable,
        formatNumber 
    } from '../store';
    import { showInterstitialAd } from '../yandex-sdk';

    export let isOpen = false;
    export let onClose: () => void;

    let activeTab: 'bank' | 'timeskip' | 'secret' | 'rebirth' = 'bank';
    let overlayEl: HTMLElement;
    let modalEl: HTMLElement;
    let contentEl: HTMLElement;

    // Badges calculation
    $: earnedStardust = Math.floor(($gameStore?.gold || 0) / 1_000_000);
    $: isDragonGiftReady = (Date.now() - ($gameStore?.lastDragonGiftTime || 0)) >= 5 * 60 * 1000;
    $: isFreeSkipReady = (Date.now() - ($gameStore?.lastFreeTimeSkipTime || 0)) >= 45 * 60 * 1000;

    $: if (isOpen) {
        tick().then(() => {
            if (overlayEl && modalEl) {
                gsap.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.25 });
                gsap.fromTo(modalEl,
                    { y: 35, opacity: 0, scale: 0.94 },
                    { y: 0,  opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.2)' }
                );
            }
        });
    }

    function switchTab(tab: 'bank' | 'timeskip' | 'secret' | 'rebirth') {
        if (activeTab === tab) return;
        activeTab = tab;
        if (contentEl) {
            gsap.fromTo(contentEl, 
                { opacity: 0.3, y: 10 }, 
                { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }
            );
        }
    }

    function close() {
        if (overlayEl && modalEl) {
            gsap.to(overlayEl, { opacity: 0, duration: 0.2 });
            gsap.to(modalEl, { 
                y: 25, 
                opacity: 0, 
                scale: 0.94, 
                duration: 0.2, 
                ease: 'power2.in', 
                onComplete: () => {
                    onClose();
                    showInterstitialAd();
                }
            });
        } else {
            onClose();
            showInterstitialAd();
        }
    }
</script>

{#if isOpen}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="overlay" bind:this={overlayEl} on:click={close}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal" bind:this={modalEl} on:click|stopPropagation>

        <!-- Master Header -->
        <div class="master-header">
            <button class="close-btn" on:click={close} aria-label="Закрыть">✕</button>

            <div class="header-main">
                <div class="master-icon-wrap">
                    <svg viewBox="0 0 70 60" width="48" height="42" class="crown-master-svg">
                        <defs>
                            <radialGradient id="arcanumCrownGlow" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#ffeaa7"/>
                                <stop offset="60%" stop-color="#f39c12"/>
                                <stop offset="100%" stop-color="#8e44ad" stop-opacity="0"/>
                            </radialGradient>
                            <filter id="crownGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="2.5" result="blur"/>
                                <feMerge>
                                    <feMergeNode in="blur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        <!-- Back glow -->
                        <circle cx="35" cy="30" r="26" fill="url(#arcanumCrownGlow)" opacity="0.4"/>
                        <!-- Crown base & peaks -->
                        <path d="M10 46 L60 46 L58 52 L12 52 Z" fill="#b7791f"/>
                        <path d="M10 46 L60 46 L64 24 L48 36 L35 12 L22 36 L6 24 Z" 
                              fill="url(#arcanumCrownGlow)" stroke="#ffeaa7" stroke-width="1.6" filter="url(#crownGlowFilter)"/>
                        <!-- Gems -->
                        <circle cx="35" cy="12" r="4.5" fill="#e74c3c" stroke="#fff" stroke-width="1"/>
                        <circle cx="6" cy="24" r="3" fill="#3498db" stroke="#fff" stroke-width="1"/>
                        <circle cx="64" cy="24" r="3" fill="#3498db" stroke="#fff" stroke-width="1"/>
                        <circle cx="22" cy="36" r="3" fill="#2ecc71" stroke="#fff" stroke-width="1"/>
                        <circle cx="48" cy="36" r="3" fill="#2ecc71" stroke="#fff" stroke-width="1"/>
                    </svg>
                </div>

                <div class="header-titles">
                    <h2 class="title-text">ВЕЛИКИЙ АРКАНУМ</h2>
                    <span class="subtitle-text">Сокровищница кристаллов, хрономантия, тайные знания и ритуал перерождения</span>
                </div>
            </div>

            <!-- Unified Multi-Currency Bar -->
            <div class="currencies-panel">
                <!-- Gold -->
                <div class="curr-chip gold-chip" title="Золото">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <circle cx="12" cy="12" r="9" fill="#f1c40f" stroke="#d4ac0d" stroke-width="2"/>
                        <circle cx="12" cy="12" r="5" fill="#f39c12"/>
                    </svg>
                    <span class="curr-val">{formatNumber($gameStore?.gold || 0)}</span>
                </div>

                <!-- Crystals -->
                <div class="curr-chip crystal-chip" title="Кристаллы">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <polygon points="12,2 20,7 16,21 8,21 4,7" fill="#74b9ff" stroke="#0984e3" stroke-width="1.5"/>
                    </svg>
                    <span class="curr-val">{formatNumber($crystals || 0)}</span>
                </div>

                <!-- Stardust -->
                <div class="curr-chip stardust-chip" title="Звёздная Пыль">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path d="M12 2 L14 8 L20 10 L15 14 L17 21 L12 17 L7 21 L9 14 L4 10 L10 8 Z" fill="#e056fd" stroke="#be2edd" stroke-width="1.5"/>
                    </svg>
                    <span class="curr-val">{formatNumber($gameStore?.stardust || 0)}</span>
                </div>

                <!-- VIP status indicator -->
                {#if $isVip}
                    <div class="vip-status-chip" title="VIP-статус активен ({$vipDaysLeft} дн.)">
                        <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
                            <path d="M3 14 L17 14 L19 6 L14 10 L10 3 L6 10 L1 6 Z" fill="#f1c40f" stroke="#d4ac0d" stroke-width="1.2"/>
                        </svg>
                        <span>VIP {$vipDaysLeft}д</span>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Master Tab Navigation Bar -->
        <div class="arcanum-tabs-bar" role="tablist">
            
            <!-- 1. Treasury / Bank -->
            <button 
                type="button" 
                role="tab"
                aria-selected={activeTab === 'bank'}
                class="arcanum-tab" 
                class:active={activeTab === 'bank'} 
                on:click={() => switchTab('bank')}
            >
                <div class="tab-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" class="tab-svg">
                        <rect x="3" y="10" width="18" height="11" rx="2" fill="#8B4513" stroke="#f1c40f" stroke-width="1.2"/>
                        <path d="M3 10 C3 6 7 4 12 4 C17 4 21 6 21 10 Z" fill="#a0522d" stroke="#f1c40f" stroke-width="1.2"/>
                        <circle cx="12" cy="15" r="2" fill="#f1c40f"/>
                    </svg>
                </div>
                <span class="tab-label">Сокровищница</span>
                {#if $isVipDailyRewardAvailable}
                    <span class="tab-badge badge-ready">+10 VIP</span>
                {:else if isDragonGiftReady}
                    <span class="tab-badge badge-free">ДАР</span>
                {/if}
            </button>

            <!-- 2. Chronomancy / Time Skip -->
            <button 
                type="button" 
                role="tab"
                aria-selected={activeTab === 'timeskip'}
                class="arcanum-tab" 
                class:active={activeTab === 'timeskip'} 
                on:click={() => switchTab('timeskip')}
            >
                <div class="tab-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" class="tab-svg">
                        <rect x="5" y="2" width="14" height="3" rx="1.5" fill="#74b9ff"/>
                        <rect x="5" y="19" width="14" height="3" rx="1.5" fill="#74b9ff"/>
                        <path d="M6 5 L18 5 Q18 12 12 12 Q6 12 6 5 Z" fill="#74b9ff" opacity="0.6"/>
                        <path d="M6 19 L18 19 Q18 12 12 12 Q6 12 6 19 Z" fill="#74b9ff" opacity="0.3"/>
                        <circle cx="12" cy="12" r="1.5" fill="#f1c40f"/>
                    </svg>
                </div>
                <span class="tab-label">Хрономантия</span>
                {#if isFreeSkipReady}
                    <span class="tab-badge badge-ready">1Ч FREE</span>
                {/if}
            </button>

            <!-- 3. Secret Upgrades -->
            <button 
                type="button" 
                role="tab"
                aria-selected={activeTab === 'secret'}
                class="arcanum-tab" 
                class:active={activeTab === 'secret'} 
                on:click={() => switchTab('secret')}
            >
                <div class="tab-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" class="tab-svg">
                        <circle cx="12" cy="12" r="8" fill="#1e1035" stroke="#a29bfe" stroke-width="1.5"/>
                        <polygon points="12,5 14,10 19,12 14,14 12,19 10,14 5,12 10,10" fill="#a29bfe"/>
                    </svg>
                </div>
                <span class="tab-label">Тайные Знания</span>
            </button>

            <!-- 4. Rebirth / Prestige -->
            <button 
                type="button" 
                role="tab"
                aria-selected={activeTab === 'rebirth'}
                class="arcanum-tab" 
                class:active={activeTab === 'rebirth'} 
                on:click={() => switchTab('rebirth')}
            >
                <div class="tab-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" class="tab-svg">
                        <circle cx="12" cy="12" r="9" stroke="#e74c3c" stroke-width="1.5"/>
                        <polygon points="12,4 19,17 5,17" stroke="#f1c40f" stroke-width="1.2" fill="none"/>
                        <circle cx="12" cy="12" r="2" fill="#e74c3c"/>
                    </svg>
                </div>
                <span class="tab-label">Тёмный Ритуал</span>
                {#if earnedStardust > 0}
                    <span class="tab-badge badge-rebirth">
                        +{formatNumber(earnedStardust)}
                        <svg viewBox="0 0 24 24" width="9" height="9" fill="#ffeaa7" class="badge-svg">
                            <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/>
                        </svg>
                    </span>
                {/if}
            </button>

        </div>

        <!-- Tab Body Content -->
        <div class="tab-content-area" bind:this={contentEl}>
            {#if activeTab === 'bank'}
                <BankModal isOpen={true} isEmbedded={true} onClose={() => {}} />
            {:else if activeTab === 'timeskip'}
                <CrystalShopModal isOpen={true} isEmbedded={true} onClose={() => {}} />
            {:else if activeTab === 'secret'}
                <SecretUpgradesTab />
            {:else if activeTab === 'rebirth'}
                <RebirthModal isOpen={true} isEmbedded={true} onClose={() => {}} />
            {/if}
        </div>

    </div>
</div>
{/if}

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(4, 2, 10, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 200;
        backdrop-filter: blur(10px);
        padding: 12px;
        box-sizing: border-box;
    }

    .modal {
        background: linear-gradient(160deg, #1d0b33 0%, #120624 55%, #0a0314 100%);
        border: 2px solid rgba(241, 196, 15, 0.45);
        border-radius: 24px;
        box-shadow: 
            0 0 50px rgba(162, 155, 254, 0.25),
            0 25px 60px rgba(0, 0, 0, 0.85),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        width: 100%;
        max-width: 660px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: white;
        box-sizing: border-box;
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
    }

    .close-btn {
        position: absolute;
        top: 14px;
        right: 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 10px;
        color: #b2bec3;
        font-size: 1.1rem;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
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
        padding-right: 36px;
    }

    .master-icon-wrap {
        flex-shrink: 0;
        filter: drop-shadow(0 2px 8px rgba(241, 196, 15, 0.3));
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
        line-height: 1.2;
    }

    /* Multi-currency panel */
    .currencies-panel {
        display: flex;
        align-items: center;
        gap: 10px;
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
    }

    .gold-chip {
        border-color: rgba(241, 196, 15, 0.3);
        color: #f1c40f;
    }

    .crystal-chip {
        border-color: rgba(116, 185, 255, 0.3);
        color: #74b9ff;
    }

    .stardust-chip {
        border-color: rgba(224, 86, 253, 0.3);
        color: #e056fd;
    }

    .vip-status-chip {
        display: flex;
        align-items: center;
        gap: 4px;
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.2), rgba(230, 126, 34, 0.2));
        border: 1px solid #f1c40f;
        border-radius: 20px;
        padding: 4px 10px;
        color: #f1c40f;
        font-size: 0.78rem;
        font-weight: 900;
        letter-spacing: 0.5px;
    }

    /* Master Tab Navigation Bar */
    .arcanum-tabs-bar {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        background: rgba(8, 3, 16, 0.85);
        border-bottom: 2px solid rgba(241, 196, 15, 0.25);
        padding: 4px 6px 0;
        gap: 4px;
        flex-shrink: 0;
        z-index: 2;
    }

    .arcanum-tab {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 8px 4px 6px;
        background: transparent;
        border: none;
        border-bottom: 3px solid transparent;
        border-radius: 8px 8px 0 0;
        color: #b2bec3;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 0;
        width: 100%;
        box-sizing: border-box;
    }

    .arcanum-tab:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #dfe6e9;
    }

    .arcanum-tab.active {
        color: #f1c40f;
        background: linear-gradient(180deg, rgba(241, 196, 15, 0.15) 0%, rgba(241, 196, 15, 0.02) 100%);
        border-bottom-color: #f1c40f;
    }

    .tab-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        transition: transform 0.2s ease;
    }

    .tab-svg {
        flex-shrink: 0;
        transition: transform 0.2s ease, filter 0.2s ease;
    }

    .arcanum-tab.active .tab-svg {
        transform: scale(1.1);
        filter: drop-shadow(0 0 6px rgba(241, 196, 15, 0.5));
    }

    .tab-label {
        font-size: 0.76rem;
        font-weight: 700;
        text-align: center;
        line-height: 1.15;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        word-break: normal;
    }

    .tab-badge {
        position: absolute;
        top: 2px;
        right: 3px;
        font-size: 0.56rem;
        font-weight: 900;
        padding: 1px 4px;
        border-radius: 6px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        line-height: 1.2;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
        pointer-events: none;
        display: flex;
        align-items: center;
        gap: 2px;
        white-space: nowrap;
    }

    .badge-svg {
        flex-shrink: 0;
    }

    .badge-free {
        background: #27ae60;
        color: #fff;
    }

    .badge-ready {
        background: #0984e3;
        color: #fff;
    }

    .badge-rebirth {
        background: #8e44ad;
        color: #ffeaa7;
        border: 1px solid #e056fd;
    }

    /* Content Area */
    .tab-content-area {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 16px 20px;
        position: relative;
        box-sizing: border-box;
    }

    .tab-content-area::-webkit-scrollbar {
        width: 6px;
    }
    .tab-content-area::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
    }
    .tab-content-area::-webkit-scrollbar-thumb {
        background: rgba(241, 196, 15, 0.3);
        border-radius: 3px;
    }
    .tab-content-area::-webkit-scrollbar-thumb:hover {
        background: rgba(241, 196, 15, 0.5);
    }

    /* Responsive adjustments */
    @media (max-width: 540px) {
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
            font-size: 0.75rem;
        }
        .tab-content-area {
            padding: 12px 10px;
        }
        .arcanum-tabs-bar {
            padding: 3px 4px 0;
            gap: 2px;
        }
        .arcanum-tab {
            padding: 6px 2px 5px;
            gap: 2px;
        }
        .tab-svg {
            width: 17px;
            height: 17px;
        }
        .tab-label {
            font-size: 0.68rem;
            line-height: 1.1;
        }
        .tab-badge {
            top: 1px;
            right: 2px;
            font-size: 0.52rem;
            padding: 1px 3px;
        }
    }

    @media (max-width: 380px) {
        .arcanum-tabs-bar {
            padding: 2px 2px 0;
            gap: 1px;
        }
        .arcanum-tab {
            padding: 5px 1px 4px;
        }
        .tab-label {
            font-size: 0.62rem;
        }
        .tab-badge {
            font-size: 0.46rem;
            padding: 1px 2px;
        }
    }
</style>
