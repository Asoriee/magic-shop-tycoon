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
        <button class="close-btn" on:click={close} aria-label="Закрыть">✕</button>

        <!-- Master Tab Header -->
        <div class="tab-header">
            <div class="tab-title-row">
                <div class="header-icon">
                    <svg viewBox="0 0 40 40" width="36" height="36" fill="none">
                        <defs>
                            <radialGradient id="cityPortal" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#ffeaa7"/>
                                <stop offset="60%" stop-color="#f39c12"/>
                                <stop offset="100%" stop-color="#8e44ad"/>
                            </radialGradient>
                            <filter id="cityGoldGlow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="2" result="blur"/>
                                <feMerge>
                                    <feMergeNode in="blur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        <!-- Fortress Wall & Gate -->
                        <path d="M4 36 L36 36 L36 22 L33 22 L33 14 L29 14 L29 22 L25 22 L25 10 L20 6 L15 10 L15 22 L11 22 L11 14 L7 14 L7 22 L4 22 Z" fill="#24123d" stroke="#f1c40f" stroke-width="1.5" stroke-linejoin="round"/>
                        <!-- Glowing Arch Portal -->
                        <path d="M14 36 L14 24 Q20 18 26 24 L26 36 Z" fill="url(#cityPortal)" stroke="#ffeaa7" stroke-width="1.5" filter="url(#cityGoldGlow)"/>
                        <ellipse cx="20" cy="28" rx="2.5" ry="4" fill="#ffffff" opacity="0.6"/>
                        <!-- Top Banner / Spire -->
                        <polygon points="20,2 23,6 17,6" fill="#f1c40f"/>
                        <circle cx="20" cy="2" r="1.5" fill="#e74c3c"/>
                    </svg>
                </div>
                <h2 class="tab-title">Королевский Город</h2>
            </div>
            
            <p class="header-sub">Торговая гильдия, контракты героев, сокровищницы и реликвии</p>

            <!-- Multi-Currency Balance Row -->
            <div class="balance-row">
                <div class="balance-chip gold">
                    <span class="icon">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
                            <circle cx="12" cy="12" r="9" fill="#f1c40f" stroke="#d4ac0d" stroke-width="2"/>
                            <circle cx="12" cy="12" r="5" fill="#f39c12"/>
                        </svg>
                    </span>
                    <span>{formatNumber($gameStore.gold)}</span>
                </div>
                <div class="balance-chip crystal">
                    <span class="icon">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
                            <polygon points="12,2 20,7 16,21 8,21 4,7" fill="#74b9ff" stroke="#0984e3" stroke-width="1.5"/>
                        </svg>
                    </span>
                    <span>{formatNumber($crystals)}</span>
                </div>
                <div class="balance-chip stardust">
                    <span class="icon">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
                            <path d="M12 2 L14 8 L20 10 L15 14 L17 21 L12 17 L7 21 L9 14 L4 10 L10 8 Z" fill="#e056fd" stroke="#be2edd" stroke-width="1.5"/>
                        </svg>
                    </span>
                    <span>{formatNumber($gameStore.stardust)}</span>
                </div>
            </div>
        </div>

        <!-- Navigation Tabs Bar -->
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
                <div class="tab-btn-content">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" class="tab-svg">
                        <path d="M6 4 C6 2.5 8 2.5 8 4 L8 18 C8 19.5 6 19.5 6 18 Z" fill="#d35400" stroke="#f39c12" stroke-width="1.2"/>
                        <path d="M8 3 L18 3 C19.5 3 20 4 20 5.5 L20 17 C20 18.5 19 19 17.5 19 L8 19 Z" fill="#f5cd79" stroke="#d35400" stroke-width="1.2"/>
                        <line x1="10" y1="7" x2="17" y2="7" stroke="#b7791f" stroke-width="1.2" stroke-linecap="round"/>
                        <line x1="10" y1="11" x2="17" y2="11" stroke="#b7791f" stroke-width="1.2" stroke-linecap="round"/>
                        <line x1="10" y1="15" x2="14" y2="15" stroke="#b7791f" stroke-width="1.2" stroke-linecap="round"/>
                    </svg>
                    <span class="tab-label">Заказы</span>
                </div>
                {#if $readyOrdersCount > 0}
                    <span class="badge badge-ready">{$readyOrdersCount}</span>
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
                <div class="tab-btn-content">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" class="tab-svg">
                        <path d="M12 2 L20 5 L20 12 C20 17 12 22 12 22 C12 22 4 17 4 12 L4 5 Z" fill="#2d1b4e" stroke="#74b9ff" stroke-width="1.5"/>
                        <line x1="8" y1="8" x2="16" y2="16" stroke="#f1c40f" stroke-width="1.5" stroke-linecap="round"/>
                        <line x1="16" y1="8" x2="8" y2="16" stroke="#f1c40f" stroke-width="1.5" stroke-linecap="round"/>
                        <circle cx="12" cy="12" r="2.5" fill="#e74c3c"/>
                    </svg>
                    <span class="tab-label">Квесты</span>
                </div>
                {#if $unclaimedQuestsCount > 0}
                    <span class="badge badge-claim">{$unclaimedQuestsCount}</span>
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
                <div class="tab-btn-content">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" class="tab-svg">
                        <rect x="3" y="10" width="18" height="11" rx="2" fill="#8B4513" stroke="#f1c40f" stroke-width="1.2"/>
                        <path d="M3 10 C3 6 7 4 12 4 C17 4 21 6 21 10 Z" fill="#a0522d" stroke="#f1c40f" stroke-width="1.2"/>
                        <rect x="10" y="9" width="4" height="4" rx="1" fill="#f1c40f" stroke="#b7791f" stroke-width="1"/>
                    </svg>
                    <span class="tab-label">Сундуки</span>
                </div>
                {#if $isFreeChestReady}
                    <span class="badge badge-free">FREE</span>
                {:else}
                    <span class="badge badge-ad">AD</span>
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
                <div class="tab-btn-content">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" class="tab-svg">
                        <path d="M12 2 L19 8 L16 19 L8 19 L5 8 Z" fill="#2d1b4e" stroke="#a29bfe" stroke-width="1.5"/>
                        <circle cx="12" cy="12" r="4" fill="#a29bfe" stroke="#ffeaa7" stroke-width="1"/>
                        <path d="M12 4 L14 7 L10 7 Z" fill="#ffeaa7"/>
                    </svg>
                    <span class="tab-label">Древности</span>
                </div>
                <span class="badge badge-count">{$gameStore.artifacts.length}/8</span>
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
        padding: 22px 20px 18px 20px;
        border-radius: 24px;
        border: 2px solid rgba(241, 196, 15, 0.35);
        box-shadow: 
            0 0 50px rgba(241, 196, 15, 0.2),
            0 20px 60px rgba(0, 0, 0, 0.85),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
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

    .close-btn {
        position: absolute;
        top: 14px;
        right: 16px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 50%;
        width: 34px;
        height: 34px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 1.4rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        line-height: 1;
        z-index: 10;
    }

    .close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        transform: scale(1.06);
    }

    /* Standard Tab Header */
    .tab-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 6px;
        margin-bottom: 12px;
        flex-shrink: 0;
    }

    .tab-title-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 10px;
    }

    .header-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 0 10px rgba(241, 196, 15, 0.45));
    }

    .tab-title {
        margin: 0;
        color: #f1c40f;
        font-size: 1.75rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        text-shadow: 0 0 16px rgba(241, 196, 15, 0.5), 0 2px 4px rgba(0,0,0,0.8);
    }

    .header-sub {
        margin: 0;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.7);
        max-width: 520px;
    }

    .balance-row {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px;
        margin-top: 4px;
    }

    .balance-chip {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 4px 11px;
        border-radius: 20px;
        font-size: 0.82rem;
        font-weight: 600;
        background: rgba(0, 0, 0, 0.45);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.4);
    }

    .balance-chip.gold {
        color: #ffeaa7;
        border-color: rgba(241, 196, 15, 0.35);
    }

    .balance-chip.crystal {
        color: #74b9ff;
        border-color: rgba(116, 185, 255, 0.35);
    }

    .balance-chip.stardust {
        color: #e056fd;
        border-color: rgba(224, 86, 253, 0.35);
    }

    /* Navigation Tabs Bar */
    .city-tabs-bar {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        background: rgba(0, 0, 0, 0.4);
        padding: 6px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        margin-bottom: 12px;
        flex-shrink: 0;
    }

    .city-tab {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 11px;
        padding: 8px 10px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.22s ease;
        position: relative;
    }

    .tab-btn-content {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .tab-svg {
        flex-shrink: 0;
        transition: transform 0.2s;
    }

    .city-tab:hover {
        background: rgba(255, 255, 255, 0.09);
        color: white;
    }

    .city-tab:hover .tab-svg {
        transform: scale(1.1);
    }

    .city-tab.active {
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.22) 0%, rgba(211, 84, 0, 0.25) 100%);
        border-color: rgba(241, 196, 15, 0.6);
        color: #ffeaa7;
        box-shadow: 0 0 14px rgba(241, 196, 15, 0.25);
    }

    .city-tab.active .tab-svg {
        filter: drop-shadow(0 0 4px rgba(241, 196, 15, 0.6));
    }

    /* Badges */
    .badge {
        font-size: 0.7rem;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 10px;
        line-height: 1;
        letter-spacing: 0.3px;
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
            padding: 16px 10px 12px 10px;
            max-height: 94vh;
            border-radius: 18px;
        }

        .tab-title {
            font-size: 1.35rem;
        }

        .header-sub {
            font-size: 0.76rem;
        }

        .city-tabs-bar {
            gap: 4px;
            padding: 4px;
        }

        .city-tab {
            padding: 6px 4px;
            flex-direction: column;
            gap: 3px;
        }

        .tab-btn-content {
            flex-direction: column;
            gap: 2px;
        }

        .tab-label {
            font-size: 0.72rem;
        }

        .badge {
            font-size: 0.62rem;
            padding: 1px 4px;
        }
    }

    @media (max-width: 380px) {
        .balance-row {
            gap: 4px;
        }

        .balance-chip {
            padding: 3px 7px;
            font-size: 0.75rem;
        }

        .tab-title {
            font-size: 1.15rem;
        }
    }
</style>
