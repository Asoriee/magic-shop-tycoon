<script lang="ts">
    import { tick } from 'svelte';
    import gsap from 'gsap';
    import InventoryModal from './InventoryModal.svelte';
    import AlchemyTableModal from './AlchemyTableModal.svelte';
    import FamiliarsModal from './FamiliarsModal.svelte';
    import CollectionsTab from './CollectionsTab.svelte';
    import { 
        gameStore, 
        crystals, 
        finishedExpeditionsCount, 
        totalInventoryCount, 
        archmageProgress,
        failedBrewAttempts,
        formatNumber 
    } from '../store';
    import { showInterstitialAd } from '../yandex-sdk';

    export let isOpen = false;
    export let onClose: () => void;

    let activeTab: 'inventory' | 'alchemy' | 'pets' | 'collections' = 'inventory';
    let overlayEl: HTMLElement;
    let modalEl: HTMLElement;
    let contentEl: HTMLElement;

    $: if (isOpen) {
        tick().then(() => {
            if (overlayEl && modalEl) {
                gsap.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.25 });
                gsap.fromTo(modalEl,
                    { y: 35, opacity: 0, scale: 0.94 },
                    { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.2)' }
                );
            }
        });
    }

    function switchTab(tab: 'inventory' | 'alchemy' | 'pets' | 'collections') {
        if (activeTab === tab) return;
        activeTab = tab;
        if (contentEl) {
            gsap.fromTo(contentEl, { opacity: 0.4, y: 10 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' });
        }
    }

    function close() {
        if (overlayEl && modalEl) {
            gsap.to(overlayEl, { opacity: 0, duration: 0.2 });
            gsap.to(modalEl, { 
                y: 30, 
                opacity: 0, 
                scale: 0.94, 
                duration: 0.22, 
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
    <div class="modal grimoire-modal" bind:this={modalEl} on:click|stopPropagation>
        
        <!-- Background Ambient Glow -->
        <div class="modal-bg-glow"></div>

        <!-- Master Header -->
        <div class="master-header">
            <button class="close-btn" on:click={close} title="Закрыть" aria-label="Закрыть">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            <div class="header-main">
                <div class="grimoire-icon-wrapper">
                    <!-- Pure SVG Ancient Grimoire Tome -->
                    <svg viewBox="0 0 64 64" width="48" height="48" class="grimoire-svg">
                        <defs>
                            <radialGradient id="tomeAura" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#a29bfe" stop-opacity="0.8"/>
                                <stop offset="100%" stop-color="#6c5ce7" stop-opacity="0"/>
                            </radialGradient>
                            <linearGradient id="tomeCover" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#2d134d"/>
                                <stop offset="50%" stop-color="#1b0a33"/>
                                <stop offset="100%" stop-color="#100520"/>
                            </linearGradient>
                            <linearGradient id="goldFiligree" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#ffeaa7"/>
                                <stop offset="50%" stop-color="#fdcb6e"/>
                                <stop offset="100%" stop-color="#d63031"/>
                            </linearGradient>
                        </defs>
                        <!-- Glowing Background circle -->
                        <circle cx="32" cy="32" r="28" fill="url(#tomeAura)"/>
                        
                        <!-- Book Pages (Thick edge) -->
                        <path d="M12 48 L46 54 L52 14 L18 8 Z" fill="#dcdde1" stroke="#718093" stroke-width="1"/>
                        <path d="M14 50 L48 56 L54 16 L20 10 Z" fill="#f5f6fa" stroke="#b2bec3" stroke-width="1"/>
                        
                        <!-- Book Cover back & front -->
                        <path d="M10 52 L48 58 Q53 58 55 54 L57 12 Q57 8 52 8 L14 4 Q10 4 8 8 L6 48 Q6 52 10 52 Z" 
                              fill="url(#tomeCover)" stroke="url(#goldFiligree)" stroke-width="2"/>
                        
                        <!-- Spine Ribs -->
                        <path d="M8 12 L15 13" stroke="#f1c40f" stroke-width="1.8" stroke-linecap="round"/>
                        <path d="M7 26 L14 27" stroke="#f1c40f" stroke-width="1.8" stroke-linecap="round"/>
                        <path d="M7 40 L14 41" stroke="#f1c40f" stroke-width="1.8" stroke-linecap="round"/>

                        <!-- Center Rune Medallion -->
                        <circle cx="34" cy="31" r="11" fill="#170826" stroke="url(#goldFiligree)" stroke-width="1.8"/>
                        <!-- Star Pentagram / Arcane Rune -->
                        <path d="M34 22 L36.5 28 L43 28.5 L38 32.5 L40 39 L34 35 L28 39 L30 32.5 L25 28.5 L31.5 28 Z" 
                              fill="#9b59b6" stroke="#f1c40f" stroke-width="0.8"/>
                        <circle cx="34" cy="31" r="2.5" fill="#ffeaa7"/>

                        <!-- Corner Ornamental Gold Brackets -->
                        <path d="M17 12 L24 10 L24 13 L19 14 L18 19 L15 19 Z" fill="#fdcb6e"/>
                        <path d="M49 15 L43 14 L43 17 L47 18 L46 23 L49 23 Z" fill="#fdcb6e"/>
                        <path d="M44 50 L38 51 L38 48 L42 47 L41 42 L44 42 Z" fill="#fdcb6e"/>
                        <path d="M13 46 L20 48 L20 45 L15 44 L16 39 L13 39 Z" fill="#fdcb6e"/>

                        <!-- Bookmark Ribbon -->
                        <path d="M33 55 L35 63 L40 59 L45 63 L44 56 Z" fill="#e74c3c" stroke="#c0392b" stroke-width="1"/>
                    </svg>
                </div>

                <div class="header-titles">
                    <h2 class="title-text">ВЕЛИКИЙ ГРИМУАР</h2>
                    <span class="subtitle-text">Инвентарь, тайная алхимия, обитель фамильяров и реликвии</span>
                </div>
            </div>

            <!-- Currency Badges Row -->
            <div class="currencies-panel">
                <!-- Gold -->
                <div class="curr-chip gold-chip" title="Золото">
                    <svg viewBox="0 0 24 24" width="16" height="16" class="chip-svg">
                        <circle cx="12" cy="12" r="10" fill="#f39c12" stroke="#f1c40f" stroke-width="2"/>
                        <circle cx="12" cy="12" r="7" fill="#f1c40f" opacity="0.6"/>
                        <path d="M12 6 V18 M8.5 9.5 C8.5 7.5 15.5 7.5 15.5 10.5 C15.5 13.5 8.5 12.5 8.5 15 C8.5 17.5 15.5 17.5 15.5 15" 
                              stroke="#7a4700" stroke-width="2" stroke-linecap="round" fill="none"/>
                    </svg>
                    <span class="curr-val">{formatNumber($gameStore.gold)}</span>
                </div>

                <!-- Crystals -->
                <div class="curr-chip crystal-chip" title="Кристаллы">
                    <svg viewBox="0 0 24 24" width="16" height="16" class="chip-svg">
                        <path d="M12 2 L21 9 L12 22 L3 9 Z" fill="#3498db" stroke="#2980b9" stroke-width="1.5"/>
                        <path d="M12 2 L12 22 M3 9 L21 9" stroke="#74b9ff" stroke-width="1.2" opacity="0.8"/>
                        <path d="M7.5 9 L12 22 L16.5 9" fill="#74b9ff" opacity="0.4"/>
                    </svg>
                    <span class="curr-val">{formatNumber($crystals)}</span>
                </div>

                <!-- Stardust -->
                <div class="curr-chip stardust-chip" title="Звёздная пыль">
                    <svg viewBox="0 0 24 24" width="16" height="16" class="chip-svg">
                        <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="#e056fd" stroke="#be2edd" stroke-width="1.2"/>
                        <circle cx="12" cy="12" r="2.5" fill="#fff"/>
                    </svg>
                    <span class="curr-val">{formatNumber($gameStore.stardust)}</span>
                </div>
            </div>
        </div>

        <!-- Master Tabs Bar -->
        <nav class="master-tabs" aria-label="Разделы Гримуара">
            <!-- Tab 1: Inventory -->
            <button 
                class="tab-btn" 
                class:active={activeTab === 'inventory'} 
                on:click={() => switchTab('inventory')}
            >
                <div class="tab-icon-box">
                    <!-- Satchel SVG -->
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path d="M6 8V6a3 3 0 0 1 6-0v2" stroke-linecap="round"/>
                        <rect x="3" y="8" width="18" height="14" rx="4" fill="rgba(162, 155, 254, 0.2)"/>
                        <path d="M3 13h18"/>
                        <circle cx="12" cy="13" r="2" fill="#ffd700" stroke="#b7791f" stroke-width="1"/>
                    </svg>
                </div>
                <span class="tab-label">Инвентарь</span>
                <span class="tab-badge info-badge" title="Всего предметов">{$totalInventoryCount}</span>
            </button>

            <!-- Tab 2: Alchemy -->
            <button 
                class="tab-btn" 
                class:active={activeTab === 'alchemy'} 
                on:click={() => switchTab('alchemy')}
            >
                <div class="tab-icon-box">
                    <!-- Flask / Retort SVG -->
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path d="M10 2h4M12 2v6L6 19a2 2 0 0 0 2 3h8a2 2 0 0 0 2-3L12 8" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M8.5 16h7" stroke="rgba(255,255,255,0.7)" stroke-linecap="round"/>
                        <circle cx="12" cy="18" r="1" fill="#fdcb6e"/>
                        <circle cx="10" cy="15" r="0.8" fill="#fdcb6e"/>
                    </svg>
                </div>
                <span class="tab-label">Алхимия</span>
                {#if $failedBrewAttempts > 0}
                    <span class="tab-badge danger-badge" title="Котёл перегрет!">
                        <svg viewBox="0 0 16 16" width="10" height="10" fill="#ff4757">
                            <path d="M8 1c-.5 2-3 4-3 7 0 2.5 2 4 3 4s3-1.5 3-4c0-3-2.5-5-3-7z"/>
                        </svg>
                        {3 - $failedBrewAttempts}
                    </span>
                {/if}
            </button>

            <!-- Tab 3: Familiars -->
            <button 
                class="tab-btn" 
                class:active={activeTab === 'pets'} 
                on:click={() => switchTab('pets')}
            >
                <div class="tab-icon-box">
                    <!-- Winged Dragon / Pet SVG -->
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 3C8 3 4.5 5.5 3 9c-1.5 3.5 0 8 3 10.5 1.5 1.2 3.5 1.5 5 1 .5 1.5 1.8 2.5 3.5 2.5 2 0 3.5-1.5 3.5-3.5 0-.5-.1-1-.3-1.5 2.8-1 4.8-3.5 5.3-6.5C24 6 18 3 12 3zm-2 9c-.8 0-1.5-.7-1.5-1.5S9.2 9 10 9s1.5.7 1.5 1.5S10.8 12 10 12zm6 0c-.8 0-1.5-.7-1.5-1.5S15.2 9 16 9s1.5.7 1.5 1.5S16.8 12 16 12z"/>
                    </svg>
                </div>
                <span class="tab-label">Фамильяры</span>
                {#if $finishedExpeditionsCount > 0}
                    <span class="tab-badge success-badge pulse" title="Добыча готова!">
                        {$finishedExpeditionsCount}
                    </span>
                {/if}
            </button>

            <!-- Tab 4: Collections -->
            <button 
                class="tab-btn" 
                class:active={activeTab === 'collections'} 
                on:click={() => switchTab('collections')}
            >
                <div class="tab-icon-box">
                    <!-- Heraldic Crest SVG -->
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path d="M12 2L4 5v6.5C4 17 7.5 21.5 12 23c4.5-1.5 8-6 8-11.5V5l-8-3z" fill="rgba(241, 196, 15, 0.15)"/>
                        <path d="M12 7l1.5 3.5L17 11l-2.7 2.4.8 3.6-3.1-1.8-3.1 1.8.8-3.6L7 11l3.5-.5L12 7z" fill="#f1c40f" stroke="#d63031" stroke-width="0.5"/>
                    </svg>
                </div>
                <span class="tab-label">Коллекции</span>
                <span class="tab-badge" class:success-badge={$archmageProgress.isCompleted} class:neutral-badge={!$archmageProgress.isCompleted}>
                    {$archmageProgress.owned}/{$archmageProgress.total}
                </span>
            </button>
        </nav>

        <!-- Main Body Content Area -->
        <div class="content-scroll" bind:this={contentEl}>
            {#if activeTab === 'inventory'}
                <InventoryModal isOpen={true} isEmbedded={true} onClose={() => {}} />
            {:else if activeTab === 'alchemy'}
                <AlchemyTableModal isOpen={true} isEmbedded={true} onClose={() => {}} />
            {:else if activeTab === 'pets'}
                <FamiliarsModal isOpen={true} isEmbedded={true} onClose={() => {}} />
            {:else if activeTab === 'collections'}
                <CollectionsTab />
            {/if}
        </div>

    </div>
</div>
{/if}

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(4, 2, 9, 0.88);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 200;
        backdrop-filter: blur(10px);
        padding: 12px;
        box-sizing: border-box;
    }

    .grimoire-modal {
        position: relative;
        background: linear-gradient(165deg, #180c2e 0%, #120722 45%, #0a0414 100%);
        border: 2px solid rgba(162, 155, 254, 0.35);
        border-radius: 24px;
        box-shadow: 
            0 0 50px rgba(162, 155, 254, 0.2), 
            0 25px 70px rgba(0, 0, 0, 0.95),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        width: 100%;
        max-width: 680px;
        height: 92vh;
        max-height: 880px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: #f5f6fa;
        font-family: inherit;
    }

    .modal-bg-glow {
        position: absolute;
        top: -80px;
        left: 50%;
        transform: translateX(-50%);
        width: 320px;
        height: 200px;
        background: radial-gradient(circle, rgba(162, 155, 254, 0.22) 0%, rgba(108, 92, 231, 0.08) 60%, transparent 80%);
        pointer-events: none;
        z-index: 0;
    }

    /* Master Header */
    .master-header {
        position: relative;
        z-index: 1;
        padding: 18px 20px 14px;
        background: linear-gradient(180deg, rgba(25, 12, 46, 0.85) 0%, rgba(15, 6, 28, 0.95) 100%);
        border-bottom: 1px solid rgba(162, 155, 254, 0.2);
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .close-btn {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.14);
        color: #dcdde1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 5;
    }

    .close-btn:hover {
        background: rgba(231, 76, 60, 0.2);
        border-color: rgba(231, 76, 60, 0.5);
        color: #ff7675;
        transform: rotate(90deg) scale(1.08);
    }

    .header-main {
        display: flex;
        align-items: center;
        gap: 14px;
        padding-right: 40px;
    }

    .grimoire-icon-wrapper {
        flex-shrink: 0;
        filter: drop-shadow(0 0 12px rgba(162, 155, 254, 0.5));
        transition: transform 0.3s ease;
    }

    .grimoire-modal:hover .grimoire-icon-wrapper {
        transform: scale(1.04) rotate(-2deg);
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
        background: linear-gradient(135deg, #ffd700 0%, #ffae19 50%, #f39c12 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 2px 14px rgba(243, 156, 18, 0.4);
    }

    .subtitle-text {
        font-size: 0.8rem;
        color: #a4b0be;
        line-height: 1.3;
    }

    /* Currency Panel */
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
        padding: 5px 12px;
        border-radius: 20px;
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.09);
        font-size: 0.82rem;
        font-weight: 700;
        transition: all 0.2s ease;
    }

    .curr-chip:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.4);
    }

    .chip-svg {
        flex-shrink: 0;
        filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5));
    }

    .gold-chip {
        border-color: rgba(241, 196, 15, 0.35);
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.12), rgba(0, 0, 0, 0.35));
        color: #f1c40f;
    }

    .crystal-chip {
        border-color: rgba(52, 152, 219, 0.35);
        background: linear-gradient(135deg, rgba(52, 152, 219, 0.12), rgba(0, 0, 0, 0.35));
        color: #74b9ff;
    }

    .stardust-chip {
        border-color: rgba(224, 86, 253, 0.35);
        background: linear-gradient(135deg, rgba(224, 86, 253, 0.12), rgba(0, 0, 0, 0.35));
        color: #e056fd;
    }

    /* Tabs Navigation */
    .master-tabs {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        background: rgba(10, 4, 20, 0.75);
        border-bottom: 2px solid rgba(162, 155, 254, 0.18);
        padding: 4px 8px 0;
        gap: 4px;
        z-index: 1;
    }

    .tab-btn {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 10px 4px 8px;
        background: transparent;
        border: none;
        border-bottom: 3px solid transparent;
        border-radius: 10px 10px 0 0;
        color: #8395a7;
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.22s ease;
    }

    .tab-btn:hover {
        color: #c8d6e5;
        background: rgba(162, 155, 254, 0.06);
    }

    .tab-btn.active {
        color: #ffeaa7;
        background: linear-gradient(180deg, rgba(162, 155, 254, 0.18) 0%, rgba(108, 92, 231, 0.04) 100%);
        border-bottom-color: #ffd700;
    }

    .tab-icon-box {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        transition: transform 0.2s ease;
    }

    .tab-btn.active .tab-icon-box {
        transform: scale(1.15) translateY(-1px);
        color: #ffd700;
        filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
    }

    .tab-label {
        white-space: nowrap;
        font-size: 0.8rem;
        letter-spacing: 0.3px;
    }

    .tab-badge {
        position: absolute;
        top: 4px;
        right: 8px;
        font-size: 0.68rem;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 10px;
        line-height: 1;
        display: flex;
        align-items: center;
        gap: 3px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.5);
    }

    .info-badge {
        background: rgba(162, 155, 254, 0.25);
        color: #dfe4ea;
        border: 1px solid rgba(162, 155, 254, 0.4);
    }

    .neutral-badge {
        background: rgba(255, 255, 255, 0.1);
        color: #b2bec3;
        border: 1px solid rgba(255, 255, 255, 0.15);
    }

    .danger-badge {
        background: rgba(231, 76, 60, 0.3);
        color: #ff6b6b;
        border: 1px solid rgba(231, 76, 60, 0.5);
    }

    .success-badge {
        background: #2ed573;
        color: #042410;
        border: 1px solid #7bed9f;
    }

    .tab-badge.pulse {
        animation: badgePulse 1.4s infinite ease-in-out;
    }

    @keyframes badgePulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(46, 213, 115, 0.6); }
        50% { transform: scale(1.15); box-shadow: 0 0 10px 4px rgba(46, 213, 115, 0.4); }
    }

    /* Content Area */
    .content-scroll {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        position: relative;
        background: transparent;
        display: flex;
        flex-direction: column;
    }

    /* Sleek Scrollbar */
    .content-scroll::-webkit-scrollbar {
        width: 6px;
    }
    .content-scroll::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
    }
    .content-scroll::-webkit-scrollbar-thumb {
        background: rgba(162, 155, 254, 0.3);
        border-radius: 4px;
    }
    .content-scroll::-webkit-scrollbar-thumb:hover {
        background: rgba(162, 155, 254, 0.5);
    }

    /* Mobile Responsiveness */
    @media (max-width: 480px) {
        .overlay {
            padding: 4px;
        }
        .grimoire-modal {
            max-height: 96vh;
            border-radius: 16px;
        }
        .master-header {
            padding: 12px 14px 10px;
            gap: 8px;
        }
        .grimoire-svg {
            width: 38px;
            height: 38px;
        }
        .title-text {
            font-size: 1.15rem;
        }
        .subtitle-text {
            display: none;
        }
        .currencies-panel {
            gap: 6px;
        }
        .curr-chip {
            padding: 4px 8px;
            font-size: 0.75rem;
        }
        .master-tabs {
            padding: 2px 4px 0;
            gap: 2px;
        }
        .tab-btn {
            padding: 8px 2px 6px;
        }
        .tab-label {
            font-size: 0.72rem;
        }
        .tab-icon-box {
            width: 22px;
            height: 22px;
        }
        .tab-badge {
            top: 2px;
            right: 2px;
            font-size: 0.62rem;
            padding: 1px 4px;
        }
    }
</style>
