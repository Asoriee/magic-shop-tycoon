<script lang="ts">
    import { tick } from 'svelte';
    import gsap from 'gsap';
    import { t, currentLang, setLanguage } from '../i18n';
    import { 
        isSfxMuted, 
        sfxVolume, 
        isAmbientMuted, 
        ambientVolume, 
        toggleSfx, 
        setSfxVolume, 
        toggleAmbient, 
        setAmbientVolume,
        playCoinSound,
        playPageTurnSound
    } from '../audio';

    export let isOpen = false;
    export let onClose: () => void;

    let overlayEl: HTMLElement;
    let modalEl: HTMLElement;

    $: if (isOpen) {
        tick().then(() => {
            if (!overlayEl || !modalEl) return;
            gsap.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.25 });
            gsap.fromTo(modalEl,
                { y: 35, opacity: 0, scale: 0.95 },
                { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.2)' }
            );
        });
    }

    function close() {
        if (!overlayEl || !modalEl) {
            onClose();
            return;
        }
        gsap.to(modalEl, { y: 25, opacity: 0, scale: 0.95, duration: 0.2, ease: 'power2.in' });
        gsap.to(overlayEl, { opacity: 0, duration: 0.2, onComplete: onClose });
    }

    function handleSfxToggle() {
        toggleSfx();
    }

    function handleAmbientToggle() {
        toggleAmbient();
    }

    function handleSfxSlider(e: Event) {
        const val = parseFloat((e.target as HTMLInputElement).value);
        setSfxVolume(val);
        if ($isSfxMuted) {
            toggleSfx();
        }
    }

    function handleAmbientSlider(e: Event) {
        const val = parseFloat((e.target as HTMLInputElement).value);
        setAmbientVolume(val);
        if ($isAmbientMuted) {
            toggleAmbient();
        }
    }

    function handleLangSelect(lang: 'ru' | 'en' | 'tr') {
        if ($currentLang === lang) return;
        playPageTurnSound();
        setLanguage(lang);
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="overlay" bind:this={overlayEl} on:click={close}>
        <div class="modal" bind:this={modalEl} on:click|stopPropagation role="dialog" aria-modal="true" aria-labelledby="settings-title" tabindex="-1">
            
            <!-- Header -->
            <div class="modal-header">
                <div class="header-icon-wrap">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" class="gear-svg">
                        <circle cx="12" cy="12" r="3.2" stroke="#ffeaa7" stroke-width="2" fill="rgba(241,196,15,0.2)"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" 
                              stroke="#f1c40f" stroke-width="2" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="header-titles">
                    <h2 id="settings-title" class="title-text">{$t('settings.title')}</h2>
                    <span class="subtitle-text">{$t('settings.subtitle')}</span>
                </div>
                <button class="close-btn" on:click={close} aria-label={$t('common.close')}>
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.2" fill="none">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>

            <!-- Body Scroll -->
            <div class="modal-body-scroll">
                
                <!-- Section 1: Audio Controls -->
                <div class="settings-section">
                    <div class="section-title-row">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ffeaa7" stroke-width="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="rgba(241,196,15,0.2)"/>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                        </svg>
                        <span class="section-title">{$t('settings.audioSection')}</span>
                    </div>

                    <div class="cards-stack">
                        <!-- Sound Effects (SFX) Card -->
                        <div class="control-card">
                            <div class="card-main-row">
                                <div class="card-icon sfx-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/>
                                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                                    </svg>
                                </div>
                                <div class="card-info">
                                    <span class="card-name">{$t('settings.sfxLabel')}</span>
                                    <span class="card-desc">{$t('settings.sfxDesc')}</span>
                                </div>
                                <button 
                                    type="button" 
                                    class="toggle-switch" 
                                    class:active={!$isSfxMuted} 
                                    on:click={handleSfxToggle}
                                    aria-label="Toggle SFX"
                                >
                                    <span class="toggle-knob"></span>
                                </button>
                            </div>

                            <div class="slider-row">
                                <span class="slider-label">{$t('settings.volume')}</span>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.05" 
                                    value={$isSfxMuted ? 0 : $sfxVolume}
                                    on:input={handleSfxSlider}
                                    class="range-slider"
                                    aria-label="SFX volume"
                                />
                                <span class="volume-val">{$isSfxMuted ? '0%' : `${Math.round($sfxVolume * 100)}%`}</span>
                            </div>
                        </div>

                        <!-- Mystic Ambient Card -->
                        <div class="control-card">
                            <div class="card-main-row">
                                <div class="card-icon ambient-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M4 11a8 8 0 0 0 16 0"/>
                                        <path d="M2 11h20"/>
                                        <path d="M7 6c1 1 1 3 0 4"/>
                                        <path d="M12 4c1 1 1 3 0 5"/>
                                        <path d="M17 6c1 1 1 3 0 4"/>
                                    </svg>
                                </div>
                                <div class="card-info">
                                    <span class="card-name">{$t('settings.ambientLabel')}</span>
                                    <span class="card-desc">{$t('settings.ambientDesc')}</span>
                                </div>
                                <button 
                                    type="button" 
                                    class="toggle-switch" 
                                    class:active={!$isAmbientMuted} 
                                    on:click={handleAmbientToggle}
                                    aria-label="Toggle Ambient"
                                >
                                    <span class="toggle-knob"></span>
                                </button>
                            </div>

                            <div class="slider-row">
                                <span class="slider-label">{$t('settings.volume')}</span>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.05" 
                                    value={$isAmbientMuted ? 0 : $ambientVolume}
                                    on:input={handleAmbientSlider}
                                    class="range-slider"
                                    aria-label="Ambient volume"
                                />
                                <span class="volume-val">{$isAmbientMuted ? '0%' : `${Math.round($ambientVolume * 100)}%`}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 2: Language Selection -->
                <div class="settings-section">
                    <div class="section-title-row">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ffeaa7" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="2" y1="12" x2="22" y2="12"/>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                        </svg>
                        <span class="section-title">{$t('settings.langSection')}</span>
                    </div>

                    <div class="lang-grid">
                        <button 
                            type="button" 
                            class="lang-card" 
                            class:active={$currentLang === 'ru'} 
                            on:click={() => handleLangSelect('ru')}
                        >
                            <span class="flag-icon">🇷🇺</span>
                            <span class="lang-name">Русский</span>
                            {#if $currentLang === 'ru'}
                                <span class="active-check">✓</span>
                            {/if}
                        </button>

                        <button 
                            type="button" 
                            class="lang-card" 
                            class:active={$currentLang === 'en'} 
                            on:click={() => handleLangSelect('en')}
                        >
                            <span class="flag-icon">🇬🇧</span>
                            <span class="lang-name">English</span>
                            {#if $currentLang === 'en'}
                                <span class="active-check">✓</span>
                            {/if}
                        </button>

                        <button 
                            type="button" 
                            class="lang-card" 
                            class:active={$currentLang === 'tr'} 
                            on:click={() => handleLangSelect('tr')}
                        >
                            <span class="flag-icon">🇹🇷</span>
                            <span class="lang-name">Türkçe</span>
                            {#if $currentLang === 'tr'}
                                <span class="active-check">✓</span>
                            {/if}
                        </button>
                    </div>
                </div>

                <!-- Section 3: About & Cloud Status -->
                <div class="settings-section about-section">
                    <div class="about-card">
                        <div class="about-top">
                            <span class="app-title">{$t('settings.gameTitle')}</span>
                            <span class="version-tag">{$t('settings.version')}</span>
                        </div>
                        <div class="cloud-status-row">
                            <span class="status-pulse-dot"></span>
                            <span class="status-text">{$t('settings.storageHint')}</span>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Footer Close CTA -->
            <div class="modal-footer">
                <button type="button" class="done-btn" on:click={close}>
                    <span>{$t('common.close')}</span>
                </button>
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
        z-index: 1000;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        padding: 12px;
        box-sizing: border-box;
    }

    .modal {
        background: linear-gradient(160deg, #1d0b33 0%, #120624 55%, #0a0314 100%);
        border: 2px solid rgba(241, 196, 15, 0.45);
        border-radius: 24px;
        box-shadow: 
            0 0 40px rgba(162, 155, 254, 0.2),
            0 25px 60px rgba(0, 0, 0, 0.85),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        width: 100%;
        max-width: 520px;
        max-height: 88vh;
        display: flex;
        flex-direction: column;
        color: white;
        box-sizing: border-box;
        overflow: hidden;
    }

    /* Header */
    .modal-header {
        position: relative;
        padding: 18px 20px 14px;
        background: rgba(0, 0, 0, 0.35);
        border-bottom: 1px solid rgba(241, 196, 15, 0.25);
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
    }

    .header-icon-wrap {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: rgba(241, 196, 15, 0.12);
        border: 1px solid rgba(241, 196, 15, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 0 15px rgba(241, 196, 15, 0.2);
    }

    .header-titles {
        flex: 1;
        min-width: 0;
    }

    .title-text {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 900;
        color: #f1c40f;
        letter-spacing: 0.5px;
        line-height: 1.2;
    }

    .subtitle-text {
        font-size: 0.78rem;
        color: #b2bec3;
        display: block;
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .close-btn {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 12px;
        color: #b2bec3;
        cursor: pointer;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
    }

    .close-btn:hover {
        background: rgba(231, 76, 60, 0.2);
        border-color: #e74c3c;
        color: #ff7675;
    }

    /* Body Scroll */
    .modal-body-scroll {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        box-sizing: border-box;
    }

    .modal-body-scroll::-webkit-scrollbar {
        width: 5px;
    }
    .modal-body-scroll::-webkit-scrollbar-track {
        background: transparent;
    }
    .modal-body-scroll::-webkit-scrollbar-thumb {
        background: rgba(162, 155, 254, 0.25);
        border-radius: 10px;
    }

    /* Sections */
    .settings-section {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .section-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .section-title {
        font-size: 0.86rem;
        font-weight: 800;
        color: #ffeaa7;
        text-transform: uppercase;
        letter-spacing: 0.8px;
    }

    .cards-stack {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    /* Control Card */
    .control-card {
        background: rgba(15, 7, 28, 0.65);
        border: 1px solid rgba(162, 155, 254, 0.2);
        border-radius: 14px;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        box-sizing: border-box;
        transition: border-color 0.2s;
    }

    .control-card:hover {
        border-color: rgba(241, 196, 15, 0.35);
    }

    .card-main-row {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .card-icon {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .sfx-icon {
        background: rgba(46, 204, 113, 0.15);
        border: 1px solid rgba(46, 204, 113, 0.35);
        color: #2ecc71;
    }

    .ambient-icon {
        background: rgba(155, 89, 182, 0.18);
        border: 1px solid rgba(155, 89, 182, 0.4);
        color: #e056fd;
    }

    .card-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .card-name {
        font-weight: 800;
        font-size: 0.92rem;
        color: #dfe6e9;
    }

    .card-desc {
        font-size: 0.74rem;
        color: #a4b0be;
        line-height: 1.25;
    }

    /* Toggle Switch */
    .toggle-switch {
        width: 50px;
        height: 28px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.2);
        position: relative;
        cursor: pointer;
        padding: 2px;
        box-sizing: border-box;
        transition: all 0.25s ease;
        flex-shrink: 0;
        touch-action: manipulation;
    }

    .toggle-switch.active {
        background: #27ae60;
        border-color: #2ecc71;
        box-shadow: 0 0 10px rgba(46, 204, 113, 0.4);
    }

    .toggle-knob {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
        transition: transform 0.25s ease;
    }

    .toggle-switch.active .toggle-knob {
        transform: translateX(22px);
    }

    /* Slider Row */
    .slider-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-top: 4px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .slider-label {
        font-size: 0.72rem;
        font-weight: 700;
        color: #b2bec3;
        width: 65px;
        flex-shrink: 0;
    }

    .range-slider {
        flex: 1;
        -webkit-appearance: none;
        appearance: none;
        height: 6px;
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.12);
        outline: none;
        cursor: pointer;
    }

    .range-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #f1c40f;
        box-shadow: 0 0 6px rgba(241, 196, 15, 0.6);
        cursor: pointer;
        transition: transform 0.15s;
    }

    .range-slider::-webkit-slider-thumb:hover {
        transform: scale(1.18);
    }

    .volume-val {
        font-size: 0.75rem;
        font-weight: 800;
        color: #f1c40f;
        width: 38px;
        text-align: right;
        flex-shrink: 0;
    }

    /* Language Grid */
    .lang-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
    }

    .lang-card {
        background: rgba(15, 7, 28, 0.65);
        border: 1.5px solid rgba(162, 155, 254, 0.2);
        border-radius: 12px;
        padding: 10px 6px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #dfe6e9;
        min-height: 44px;
        box-sizing: border-box;
    }

    .lang-card:hover {
        background: rgba(241, 196, 15, 0.08);
        border-color: rgba(241, 196, 15, 0.4);
    }

    .lang-card.active {
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.18), rgba(230, 126, 34, 0.12));
        border-color: #f1c40f;
        box-shadow: 0 0 15px rgba(241, 196, 15, 0.25);
        color: #ffeaa7;
    }

    .flag-icon {
        font-size: 1.35rem;
        line-height: 1;
    }

    .lang-name {
        font-size: 0.78rem;
        font-weight: 800;
    }

    .active-check {
        font-size: 0.7rem;
        color: #2ecc71;
        font-weight: 900;
        line-height: 1;
    }

    /* About Card */
    .about-card {
        background: rgba(0, 0, 0, 0.35);
        border: 1px dashed rgba(162, 155, 254, 0.25);
        border-radius: 12px;
        padding: 10px 14px;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .about-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .app-title {
        font-weight: 800;
        font-size: 0.85rem;
        color: #dfe6e9;
    }

    .version-tag {
        font-size: 0.72rem;
        font-weight: 700;
        color: #f1c40f;
        background: rgba(241, 196, 15, 0.12);
        padding: 2px 6px;
        border-radius: 6px;
    }

    .cloud-status-row {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .status-pulse-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #2ecc71;
        box-shadow: 0 0 6px #2ecc71;
        flex-shrink: 0;
    }

    .status-text {
        font-size: 0.7rem;
        color: #a4b0be;
    }

    /* Footer */
    .modal-footer {
        padding: 12px 20px 16px;
        border-top: 1px solid rgba(241, 196, 15, 0.2);
        display: flex;
        justify-content: flex-end;
        background: rgba(0, 0, 0, 0.35);
        flex-shrink: 0;
    }

    .done-btn {
        padding: 10px 24px;
        background: linear-gradient(135deg, #f1c40f, #e67e22);
        border: 1px solid #ffeaa7;
        border-radius: 12px;
        color: #120624;
        font-weight: 900;
        font-size: 0.88rem;
        cursor: pointer;
        transition: transform 0.15s, box-shadow 0.15s;
        box-shadow: 0 4px 12px rgba(241, 196, 15, 0.35);
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .done-btn:hover {
        transform: scale(1.03);
        box-shadow: 0 6px 18px rgba(241, 196, 15, 0.5);
    }

    .done-btn:active {
        transform: scale(0.97);
    }

    /* Mobile media */
    @media (max-width: 580px) {
        .overlay {
            padding: 0;
            background: rgba(7, 3, 16, 0.98);
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
        }

        .modal {
            width: 100%;
            max-width: 100%;
            height: 100%;
            height: 100dvh;
            max-height: 100dvh;
            border-radius: 0;
            border: none;
        }

        .modal-header {
            padding: 14px 14px 12px;
        }

        .title-text {
            font-size: 1.18rem;
        }

        .modal-body-scroll {
            padding: 12px 14px;
            gap: 14px;
        }

        .modal-footer {
            padding: 12px 14px 14px;
        }

        .done-btn {
            width: 100%;
        }
    }
</style>
