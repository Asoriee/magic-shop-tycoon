<script lang="ts">
    import { tick } from 'svelte';
    import gsap from 'gsap';
    import { 
        activeGuideModalId, 
        closeGuide, 
        openGuide 
    } from '../store';
    import { 
        ALL_GUIDES, 
        getGuideMetadata, 
        getNextGuideId, 
        getPrevGuideId,
        type GuideMetadata 
    } from '../lib/guideData';
    import { t, currentLang, locales, DEFAULT_LANG } from '../i18n';
    import { playCoinSound } from '../audio';

    let overlayEl: HTMLElement;
    let modalEl: HTMLElement;
    let bodyCardEl: HTMLElement;

    $: currentGuideId = $activeGuideModalId;
    $: currentMeta = currentGuideId ? getGuideMetadata(currentGuideId) : ALL_GUIDES[0];

    // Helper to get translated points array reactively
    $: currentPoints = (() => {
        if (!currentGuideId) return [];
        const lang = $currentLang;
        const dict = locales[lang]?.guides?.[currentGuideId] || locales[DEFAULT_LANG]?.guides?.[currentGuideId];
        return dict?.points || [];
    })();

    // Animation on modal open
    $: if ($activeGuideModalId) {
        tick().then(() => {
            if (overlayEl && modalEl) {
                gsap.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.22 });
                gsap.fromTo(modalEl,
                    { y: 30, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.28, ease: 'power2.out' }
                );
            }
        });
    }

    function handleClose() {
        if (overlayEl && modalEl) {
            gsap.to(overlayEl, { opacity: 0, duration: 0.16 });
            gsap.to(modalEl, { 
                y: 20, 
                opacity: 0, 
                duration: 0.16, 
                ease: 'power2.in', 
                onComplete: () => {
                    closeGuide();
                }
            });
        } else {
            closeGuide();
        }
    }

    function switchGuide(nextId: string) {
        if (bodyCardEl) {
            gsap.to(bodyCardEl, {
                opacity: 0.3,
                y: 6,
                duration: 0.12,
                onComplete: () => {
                    openGuide(nextId);
                    playCoinSound();
                    tick().then(() => {
                        gsap.fromTo(bodyCardEl, { opacity: 0.3, y: -6 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' });
                    });
                }
            });
        } else {
            openGuide(nextId);
            playCoinSound();
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (!$activeGuideModalId) return;
        if (e.key === 'Escape') {
            handleClose();
        } else if (e.key === 'ArrowLeft') {
            switchGuide(getPrevGuideId(currentGuideId || ''));
        } else if (e.key === 'ArrowRight') {
            switchGuide(getNextGuideId(currentGuideId || ''));
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if $activeGuideModalId}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="guide-overlay" bind:this={overlayEl} on:click={handleClose} role="dialog" aria-modal="true" tabindex="-1">
        <div class="guide-modal-container" bind:this={modalEl} on:click|stopPropagation>
            
            <!-- Atmospheric Arcane Glow Behind Card -->
            <div class="guide-aura-glow" style="background: radial-gradient(circle, {currentMeta.themeColor}33 0%, transparent 70%);"></div>

            <!-- Header Section -->
            <header class="guide-header">
                <button class="guide-close-btn" on:click={handleClose} aria-label={$t('common.close')} title={$t('common.close')}>
                    ✕
                </button>

                <div class="header-main-row">
                    <!-- Pure SVG Mechanic Icon with Glow -->
                    <div class="guide-icon-badge" style="border-color: {currentMeta.themeColor}; box-shadow: 0 0 16px {currentMeta.themeColor}44;">
                        {@html currentMeta.iconSvg}
                    </div>

                    <div class="header-titles">
                        <span class="guide-category-tag" style="color: {currentMeta.themeColor}; border-color: {currentMeta.themeColor}55;">
                            {$t(`guides.${currentMeta.id}.category`)}
                        </span>
                        <h2 class="guide-title-text">
                            {$t(`guides.${currentMeta.id}.title`)}
                        </h2>
                    </div>
                </div>
            </header>

            <!-- Scrollable Guide Body -->
            <div class="guide-body-scroll" bind:this={bodyCardEl}>
                
                <!-- 1. Essence / Summary Card -->
                <section class="guide-card summary-card">
                    <div class="card-icon-accent">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ffeaa7" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                    </div>
                    <p class="summary-text">
                        {$t(`guides.${currentMeta.id}.summary`)}
                    </p>
                </section>

                <!-- 2. Core Rules List -->
                <section class="guide-card rules-card">
                    <h3 class="section-heading">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12,2 15,8 22,9 17,14 18,21 12,18 6,21 7,14 2,9 9,8"/>
                        </svg>
                        {$t('guidesUi.rulesTitle')}
                    </h3>

                    <ul class="rules-list">
                        {#each currentPoints as point, idx}
                            <li class="rule-item">
                                <span class="rule-number-badge">{idx + 1}</span>
                                <span class="rule-text">{point}</span>
                            </li>
                        {/each}
                    </ul>
                </section>

                <!-- 3. Archmage Pro-Tip Card -->
                <section class="guide-card tip-card">
                    <div class="tip-header-row">
                        <div class="tip-icon-flame">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                                <path d="M12 2 C10 6 6 9 6 14 C6 18 8.5 22 12 22 C15.5 22 18 18 18 14 C18 9 14 6 12 2 Z" fill="#e67e22" stroke="#f1c40f" stroke-width="1.5"/>
                                <circle cx="12" cy="16" r="3" fill="#ffeaa7"/>
                            </svg>
                        </div>
                        <h4 class="tip-title">{$t(`guides.${currentMeta.id}.tipTitle`)}</h4>
                    </div>
                    <p class="tip-body">
                        {$t(`guides.${currentMeta.id}.tipText`)}
                    </p>
                </section>

            </div>

            <!-- Footer: Navigation Carousel & Close -->
            <footer class="guide-footer">
                <button 
                    type="button" 
                    class="nav-step-btn prev-btn" 
                    on:click={() => switchGuide(getPrevGuideId(currentGuideId || ''))}
                    title={$t('guidesUi.prevGuide')}
                >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    <span class="nav-btn-text">{$t('guidesUi.prevGuide')}</span>
                </button>

                <button 
                    type="button" 
                    class="got-it-btn" 
                    on:click={handleClose}
                >
                    <span class="got-it-label">{$t('guidesUi.gotIt')}</span>
                </button>

                <button 
                    type="button" 
                    class="nav-step-btn next-btn" 
                    on:click={() => switchGuide(getNextGuideId(currentGuideId || ''))}
                    title={$t('guidesUi.nextGuide')}
                >
                    <span class="nav-btn-text">{$t('guidesUi.nextGuide')}</span>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </button>
            </footer>

        </div>
    </div>
{/if}

<style>
    .guide-overlay {
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: rgba(7, 4, 15, 0.82);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        box-sizing: border-box;
    }

    .guide-modal-container {
        position: relative;
        width: 100%;
        max-width: 540px;
        max-height: 90vh;
        background: linear-gradient(165deg, #1f1435 0%, #120924 60%, #0c051a 100%);
        border: 2px solid rgba(241, 196, 15, 0.5);
        border-radius: 20px;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.75), 0 0 24px rgba(241, 196, 15, 0.25);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        user-select: none;
    }

    .guide-aura-glow {
        position: absolute;
        top: -40px;
        left: 50%;
        transform: translateX(-50%);
        width: 320px;
        height: 200px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 0;
        opacity: 0.8;
    }

    /* Header */
    .guide-header {
        position: relative;
        z-index: 1;
        padding: 20px 24px 16px;
        border-bottom: 1px solid rgba(241, 196, 15, 0.2);
        background: rgba(18, 10, 36, 0.6);
        flex-shrink: 0;
    }

    .guide-close-btn {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 34px;
        height: 34px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(241, 196, 15, 0.3);
        border-radius: 50%;
        color: #ffeaa7;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .guide-close-btn:hover {
        background: rgba(231, 76, 60, 0.3);
        border-color: #e74c3c;
        color: #fff;
        transform: scale(1.1);
    }

    .header-main-row {
        display: flex;
        align-items: center;
        gap: 16px;
        padding-right: 32px;
    }

    .guide-icon-badge {
        width: 52px;
        height: 52px;
        min-width: 52px;
        border-radius: 14px;
        background: rgba(10, 5, 22, 0.7);
        border: 2px solid #f1c40f;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .header-titles {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
    }

    .guide-category-tag {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        padding: 2px 8px;
        border: 1px solid;
        border-radius: 20px;
        display: inline-block;
        width: fit-content;
        background: rgba(0, 0, 0, 0.25);
    }

    .guide-title-text {
        margin: 0;
        font-size: 18px;
        font-weight: 800;
        color: #ffeaa7;
        text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
        line-height: 1.25;
        word-break: break-word;
    }

    /* Scrollable Body */
    .guide-body-scroll {
        position: relative;
        z-index: 1;
        flex: 1;
        overflow-y: auto;
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        box-sizing: border-box;
    }

    .guide-body-scroll::-webkit-scrollbar {
        width: 6px;
    }

    .guide-body-scroll::-webkit-scrollbar-thumb {
        background: rgba(241, 196, 15, 0.3);
        border-radius: 4px;
    }

    /* Generic Card Style */
    .guide-card {
        border-radius: 14px;
        padding: 14px 18px;
        box-sizing: border-box;
    }

    /* Summary Card */
    .summary-card {
        background: linear-gradient(135deg, rgba(46, 26, 71, 0.75), rgba(26, 14, 46, 0.85));
        border: 1px solid rgba(162, 155, 254, 0.35);
        display: flex;
        align-items: flex-start;
        gap: 12px;
    }

    .card-icon-accent {
        flex-shrink: 0;
        margin-top: 2px;
    }

    .summary-text {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
        color: #f1f2f6;
        font-weight: 500;
    }

    /* Rules Card */
    .rules-card {
        background: rgba(20, 12, 36, 0.65);
        border: 1px solid rgba(241, 196, 15, 0.25);
    }

    .section-heading {
        margin: 0 0 12px 0;
        font-size: 13px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: #ffeaa7;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .rules-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .rule-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        font-size: 13px;
        line-height: 1.45;
        color: #dfe6e9;
    }

    .rule-number-badge {
        flex-shrink: 0;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: rgba(241, 196, 15, 0.15);
        border: 1px solid rgba(241, 196, 15, 0.5);
        color: #ffeaa7;
        font-size: 11px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 1px;
    }

    .rule-text {
        flex: 1;
    }

    /* Pro-Tip Card */
    .tip-card {
        background: linear-gradient(135deg, rgba(70, 36, 15, 0.7), rgba(40, 18, 5, 0.85));
        border: 1.5px solid rgba(243, 156, 18, 0.6);
        box-shadow: inset 0 0 16px rgba(243, 156, 18, 0.12);
    }

    .tip-header-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
    }

    .tip-icon-flame {
        display: flex;
        align-items: center;
    }

    .tip-title {
        margin: 0;
        font-size: 14px;
        font-weight: 800;
        color: #ffd32a;
        letter-spacing: 0.4px;
    }

    .tip-body {
        margin: 0;
        font-size: 13px;
        line-height: 1.45;
        color: #ffeaa7;
        font-weight: 500;
        font-style: italic;
    }

    /* Footer */
    .guide-footer {
        position: relative;
        z-index: 1;
        padding: 14px 20px;
        border-top: 1px solid rgba(241, 196, 15, 0.2);
        background: rgba(14, 8, 26, 0.95);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-shrink: 0;
    }

    .nav-step-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(241, 196, 15, 0.3);
        border-radius: 10px;
        color: #ffeaa7;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .nav-step-btn:hover {
        background: rgba(241, 196, 15, 0.2);
        border-color: #f1c40f;
        transform: translateY(-1px);
        color: #fff;
    }

    .got-it-btn {
        flex: 1;
        max-width: 170px;
        padding: 10px 18px;
        background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
        border: 1.5px solid #ffeaa7;
        border-radius: 12px;
        color: #1a0c00;
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 0.5px;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(243, 156, 18, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.5);
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        text-align: center;
    }

    .got-it-btn:hover {
        transform: scale(1.04);
        box-shadow: 0 6px 18px rgba(243, 156, 18, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.7);
    }

    .got-it-btn:active {
        transform: scale(0.96);
    }

    /* Mobile Adaptivity */
    @media (max-width: 480px) {
        .guide-overlay {
            padding: 8px;
        }

        .guide-modal-container {
            width: 100%;
            max-width: 100%;
            max-height: 94vh;
            border-radius: 16px;
        }

        .guide-header {
            padding: 14px 14px 10px;
        }

        .header-main-row {
            gap: 10px;
            padding-right: 28px;
        }

        .guide-icon-badge {
            width: 42px;
            height: 42px;
            min-width: 42px;
            border-radius: 10px;
        }

        .guide-title-text {
            font-size: 16px;
        }

        .guide-body-scroll {
            padding: 12px 14px;
            gap: 10px;
        }

        .summary-text, .rule-item, .tip-body {
            font-size: 12px;
        }

        .guide-footer {
            padding: 10px 12px;
            gap: 8px;
        }

        .nav-btn-text {
            display: none;
        }

        .nav-step-btn {
            width: 38px;
            height: 38px;
            min-width: 38px;
            padding: 0;
            justify-content: center;
            border-radius: 50%;
        }

        .got-it-btn {
            flex: 1;
            max-width: none;
            padding: 9px 12px;
            font-size: 13px;
        }
    }
</style>
