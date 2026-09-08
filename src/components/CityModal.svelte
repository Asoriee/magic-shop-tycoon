<script lang="ts">
    import { tick } from 'svelte';
    import gsap from 'gsap';
    import DailyQuestsModal from './DailyQuestsModal.svelte';
    import CustomerOrders from './CustomerOrders.svelte';
    import ChestShopModal from './ChestShopModal.svelte';
    import ArtifactStore from './ArtifactStore.svelte';
    import { 
        gameStore, 
        crystals, 
        readyOrdersCount, 
        unclaimedQuestsCount,
        isFreeChestReady,
        formatNumber 
    } from '../store';
    import { showInterstitialAd } from '../yandex-sdk';

    export let isOpen = false;
    export let onClose: () => void;

    let activeTab: 'orders' | 'quests' | 'chests' | 'artifacts' = 'orders';
    let overlayEl: HTMLElement;
    let modalEl: HTMLElement;

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

    function close() {
        if (overlayEl && modalEl) {
            gsap.to(overlayEl, { opacity: 0, duration: 0.2 });
            gsap.to(modalEl, { y: 25, opacity: 0, scale: 0.94, duration: 0.2, ease: 'power2.in', onComplete: () => {
                onClose();
                showInterstitialAd();
            }});
        } else {
            onClose();
            showInterstitialAd();
        }
    }
</script>

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" bind:this={overlayEl} on:click={close}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-content" bind:this={modalEl} on:click|stopPropagation>
        <!-- Master Header -->
        <div class="master-header">
            <button class="close-btn" on:click={close} aria-label="Закрыть">✕</button>

            <div class="header-main">
                <div class="master-icon-wrap">
                    <svg viewBox="0 0 56 56" width="48" height="48" class="master-svg-icon">
                        <defs>
                            <radialGradient id="cityAura" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#ffeaa7" stop-opacity="0.9"/>
                                <stop offset="50%" stop-color="#f39c12" stop-opacity="0.6"/>
                                <stop offset="100%" stop-color="#8e44ad" stop-opacity="0"/>
                            </radialGradient>
                            <filter id="cityGlow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="2" result="blur"/>
                                <feMerge>
                                    <feMergeNode in="blur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                            <linearGradient id="cityWallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#341f54"/>
                                <stop offset="100%" stop-color="#190a30"/>
                            </linearGradient>
                        </defs>
                        <!-- Radiant Aura Glow -->
                        <circle cx="28" cy="28" r="26" fill="url(#cityAura)"/>
                        <!-- Fortress Walls & Battlements -->
                        <path d="M6 48 L50 48 L50 28 L46 28 L46 18 L41 18 L41 28 L35 28 L35 14 L28 8 L21 14 L21 28 L15 28 L15 18 L10 18 L10 28 L6 28 Z" 
                              fill="url(#cityWallGrad)" stroke="#f1c40f" stroke-width="1.8" stroke-linejoin="round" filter="url(#cityGlow)"/>
                        <!-- Golden Battlements Trim -->
                        <path d="M10 18 L15 18 M21 14 L28 8 L35 14 M41 18 L46 18" stroke="#ffeaa7" stroke-width="2" stroke-linecap="round"/>
                        <!-- Portal Arch (Glowing Golden Amber) -->
                        <path d="M20 48 L20 30 Q28 22 36 30 L36 48 Z" fill="#f39c12" stroke="#ffeaa7" stroke-width="1.8"/>
                        <path d="M23 48 L23 33 Q28 26 33 33 L33 48 Z" fill="#ffeaa7" opacity="0.85"/>
                        <ellipse cx="28" cy="38" rx="3" ry="5" fill="#ffffff" opacity="0.9"/>
                        <!-- Citadel Tower Flags & Spire Jewels -->
                        <polygon points="28,2 32,7 24,7" fill="#f1c40f"/>
                        <circle cx="28" cy="2" r="2" fill="#e74c3c" stroke="#fff" stroke-width="0.8"/>
                        <circle cx="12.5" cy="18" r="1.5" fill="#3498db"/>
                        <circle cx="43.5" cy="18" r="1.5" fill="#3498db"/>
                    </svg>
                </div>

                <div class="header-titles">
                    <h2 class="title-text">КОРОЛЕВСКИЙ ГОРОД</h2>
                    <span class="subtitle-text">Торговая гильдия, контракты героев, сокровищницы и реликвии</span>
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
                    <span class="curr-val">{formatNumber($gameStore.gold)}</span>
                </div>

                <!-- Crystals -->
                <div class="curr-chip crystal-chip" title="Кристаллы">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <polygon points="12,2 20,7 16,21 8,21 4,7" fill="#74b9ff" stroke="#0984e3" stroke-width="1.5"/>
                    </svg>
                    <span class="curr-val">{formatNumber($crystals)}</span>
                </div>

                <!-- Stardust -->
                <div class="curr-chip stardust-chip" title="Звёздная Пыль">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path d="M12 2 L14 8 L20 10 L15 14 L17 21 L12 17 L7 21 L9 14 L4 10 L10 8 Z" fill="#e056fd" stroke="#be2edd" stroke-width="1.5"/>
                    </svg>
                    <span class="curr-val">{formatNumber($gameStore.stardust)}</span>
                </div>
            </div>
        </div>

        <!-- Master Tabs Bar -->
        <div class="city-tabs-bar" role="tablist">
            <!-- Orders Tab -->
            <button 
                type="button"
                role="tab"
                aria-selected={activeTab === 'orders'}
                class="city-tab" 
                class:active={activeTab === 'orders'} 
                on:click={() => activeTab = 'orders'}
            >
                <div class="tab-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" class="tab-svg">
                        <path d="M6 4 C6 2.5 8 2.5 8 4 L8 18 C8 19.5 6 19.5 6 18 Z" fill="#d35400" stroke="#f39c12" stroke-width="1.2"/>
                        <path d="M8 3 L18 3 C19.5 3 20 4 20 5.5 L20 17 C20 18.5 19 19 17.5 19 L8 19 Z" fill="#f5cd79" stroke="#d35400" stroke-width="1.2"/>
                        <line x1="10" y1="7" x2="17" y2="7" stroke="#b7791f" stroke-width="1.2" stroke-linecap="round"/>
                        <line x1="10" y1="11" x2="17" y2="11" stroke="#b7791f" stroke-width="1.2" stroke-linecap="round"/>
                        <line x1="10" y1="15" x2="14" y2="15" stroke="#b7791f" stroke-width="1.2" stroke-linecap="round"/>
                    </svg>
                </div>
                <span class="tab-label">Заказы</span>
                {#if $readyOrdersCount > 0}
                    <span class="tab-badge badge-ready">{$readyOrdersCount}</span>
                {/if}
            </button>

            <!-- Quests Tab -->
            <button 
                type="button"
                role="tab"
                aria-selected={activeTab === 'quests'}
                class="city-tab" 
                class:active={activeTab === 'quests'} 
                on:click={() => activeTab = 'quests'}
            >
                <div class="tab-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" class="tab-svg">
                        <path d="M12 2 L20 5 L20 12 C20 17 12 22 12 22 C12 22 4 17 4 12 L4 5 Z" fill="#2d1b4e" stroke="#74b9ff" stroke-width="1.5"/>
                        <line x1="8" y1="8" x2="16" y2="16" stroke="#f1c40f" stroke-width="1.5" stroke-linecap="round"/>
                        <line x1="16" y1="8" x2="8" y2="16" stroke="#f1c40f" stroke-width="1.5" stroke-linecap="round"/>
                        <circle cx="12" cy="12" r="2.5" fill="#e74c3c"/>
                    </svg>
                </div>
                <span class="tab-label">Квесты</span>
                {#if $unclaimedQuestsCount > 0}
                    <span class="tab-badge badge-claim">{$unclaimedQuestsCount}</span>
                {/if}
            </button>

            <!-- Chests Tab -->
            <button 
                type="button"
                role="tab"
                aria-selected={activeTab === 'chests'}
                class="city-tab" 
                class:active={activeTab === 'chests'} 
                on:click={() => activeTab = 'chests'}
            >
                <div class="tab-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" class="tab-svg">
                        <rect x="3" y="10" width="18" height="11" rx="2" fill="#8B4513" stroke="#f1c40f" stroke-width="1.2"/>
                        <path d="M3 10 C3 6 7 4 12 4 C17 4 21 6 21 10 Z" fill="#a0522d" stroke="#f1c40f" stroke-width="1.2"/>
                        <rect x="10" y="9" width="4" height="4" rx="1" fill="#f1c40f" stroke="#b7791f" stroke-width="1"/>
                    </svg>
                </div>
                <span class="tab-label">Сундуки</span>
                {#if $isFreeChestReady}
                    <span class="tab-badge badge-free">FREE</span>
                {:else}
                    <span class="tab-badge badge-ad">AD</span>
                {/if}
            </button>

            <!-- Artifacts Tab -->
            <button 
                type="button"
                role="tab"
                aria-selected={activeTab === 'artifacts'}
                class="city-tab" 
                class:active={activeTab === 'artifacts'} 
                on:click={() => activeTab = 'artifacts'}
            >
                <div class="tab-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" class="tab-svg">
                        <path d="M12 2 L19 8 L16 19 L8 19 L5 8 Z" fill="#2d1b4e" stroke="#a29bfe" stroke-width="1.5"/>
                        <circle cx="12" cy="12" r="4" fill="#a29bfe" stroke="#ffeaa7" stroke-width="1"/>
                        <path d="M12 4 L14 7 L10 7 Z" fill="#ffeaa7"/>
                    </svg>
                </div>
                <span class="tab-label">Древности</span>
                <span class="tab-badge badge-count">{$gameStore.artifacts.length}/8</span>
            </button>
        </div>

        <!-- Tab Content View -->
        <div class="city-content">
            {#if activeTab === 'orders'}
                <div class="view-panel">
                    <CustomerOrders isEmbedded={true} />
                </div>
            {:else if activeTab === 'quests'}
                <div class="view-panel">
                    <DailyQuestsModal isOpen={true} isEmbedded={true} onClose={() => {}} />
                </div>
            {:else if activeTab === 'chests'}
                <div class="view-panel">
                    <ChestShopModal isOpen={true} isEmbedded={true} onClose={() => {}} />
                </div>
            {:else if activeTab === 'artifacts'}
                <div class="view-panel">
                    <ArtifactStore isOpen={true} isEmbedded={true} onClose={() => {}} />
                </div>
            {/if}
        </div>
    </div>
</div>
{/if}

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.82);
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
        background: linear-gradient(160deg, #1a0a2e 0%, #150826 40%, #0d041a 100%);
        padding: 0;
        border-radius: 24px;
        border: 2px solid rgba(241, 196, 15, 0.4);
        box-shadow: 
            0 0 50px rgba(162, 155, 254, 0.25),
            0 25px 60px rgba(0, 0, 0, 0.85),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        width: 100%;
        max-width: 760px;
        height: 90vh;
        max-height: 860px;
        display: flex;
        flex-direction: column;
        position: relative;
        box-sizing: border-box;
        overflow: hidden;
        color: white;
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
        color: #b2bec3;
        font-size: 1.1rem;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        z-index: 10;
        line-height: 1;
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

    .crystal-chip {
        border-color: rgba(116, 185, 255, 0.3);
        color: #74b9ff;
    }

    .stardust-chip {
        border-color: rgba(224, 86, 253, 0.3);
        color: #e056fd;
    }

    /* Master Tabs Bar */
    .city-tabs-bar {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        background: rgba(8, 3, 16, 0.85);
        border-bottom: 2px solid rgba(241, 196, 15, 0.25);
        padding: 4px 6px 0;
        gap: 4px;
        flex-shrink: 0;
        z-index: 2;
    }

    .city-tab {
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

    .city-tab:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #dfe6e9;
    }

    .city-tab.active {
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

    .city-tab.active .tab-svg {
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
        white-space: nowrap;
    }

    /* Badges */
    .tab-badge {
        position: absolute;
        top: 2px;
        right: 4px;
        font-size: 0.58rem;
        font-weight: 900;
        padding: 1px 5px;
        border-radius: 8px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        line-height: 1.2;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
        pointer-events: none;
        white-space: nowrap;
    }

    .badge-ready {
        background: #2ecc71;
        color: #0b381a;
        box-shadow: 0 0 8px rgba(46, 204, 113, 0.8);
        animation: readyPulse 1.6s infinite ease-in-out;
    }

    @keyframes readyPulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.15); opacity: 0.85; }
    }

    .badge-claim {
        background: #f1c40f;
        color: #3b2800;
        box-shadow: 0 0 8px rgba(241, 196, 15, 0.8);
        animation: readyPulse 1.6s infinite ease-in-out;
    }

    .badge-free {
        background: linear-gradient(135deg, #00cec9, #0984e3);
        color: #ffffff;
        box-shadow: 0 0 8px rgba(0, 206, 201, 0.6);
    }

    .badge-ad {
        background: linear-gradient(135deg, #e67e22, #d35400);
        color: #ffffff;
        box-shadow: 0 0 8px rgba(230, 126, 34, 0.5);
    }

    .badge-count {
        background: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* Content Area */
    .city-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        position: relative;
        display: flex;
        flex-direction: column;
        padding: 16px 20px;
        box-sizing: border-box;
    }

    .view-panel {
        height: 100%;
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow-y: auto;
    }

    /* Scrollbar styling */
    .city-content::-webkit-scrollbar,
    .view-panel::-webkit-scrollbar {
        width: 6px;
    }

    .city-content::-webkit-scrollbar-track,
    .view-panel::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
    }

    .city-content::-webkit-scrollbar-thumb,
    .view-panel::-webkit-scrollbar-thumb {
        background: rgba(241, 196, 15, 0.3);
        border-radius: 4px;
    }

    .city-content::-webkit-scrollbar-thumb:hover,
    .view-panel::-webkit-scrollbar-thumb:hover {
        background: rgba(241, 196, 15, 0.5);
    }

    /* Mobile Responsive */
    @media (max-width: 600px) {
        .modal-content {
            max-height: 94vh;
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
            font-size: 0.75rem;
        }

        .city-tabs-bar {
            padding: 3px 4px 0;
            gap: 2px;
        }

        .city-tab {
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

        .city-content {
            padding: 12px 10px;
        }
    }

    @media (max-width: 380px) {
        .currencies-panel {
            gap: 4px;
        }

        .curr-chip {
            padding: 2px 6px;
            font-size: 0.7rem;
        }

        .city-tabs-bar {
            padding: 2px 2px 0;
            gap: 1px;
        }

        .city-tab {
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
