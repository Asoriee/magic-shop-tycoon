<script lang="ts">
    import { tick } from 'svelte';
    import { 
        gameStore, 
        AVAILABLE_ARTIFACTS, 
        AVAILABLE_COLLECTIONS, 
        AVAILABLE_PETS,
        formatNumber,
        getArtifactOverchargeCost
    } from '../store';
    import { saveGame } from '../yandex-sdk';
    import gsap from 'gsap';
    import ResourceIcon from './ResourceIcon.svelte';
    import { t, currentLang, getCollectionName, getCollectionDesc, getArtifactName, getArtifactDesc, getPetName } from '../i18n';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void = () => {};

    let modalEl: HTMLElement;
    let overlayEl: HTMLElement;

    let activeFilter: 'all' | 'standalone' | string = 'all';

    $: currentSynergySet = AVAILABLE_COLLECTIONS.find(c => c.id === activeFilter) || null;
    $: setOwnedCount = currentSynergySet 
        ? currentSynergySet.requiredArtifactIds.filter(id => $gameStore.artifacts.includes(id)).length 
        : 0;
    $: setTotalCount = currentSynergySet?.requiredArtifactIds.length || 0;
    $: isSetComplete = setOwnedCount === setTotalCount && setTotalCount > 0;
    $: rewardPet = AVAILABLE_PETS.find(p => p.id === currentSynergySet?.rewardPetId);
    $: standaloneOwnedCount = [0, 1, 2].filter(id => $gameStore.artifacts.includes(id)).length;

    $: filteredArtifacts = AVAILABLE_ARTIFACTS.filter(art => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'standalone') return [0, 1, 2].includes(art.id);
        const col = AVAILABLE_COLLECTIONS.find(c => c.id === activeFilter);
        return col ? col.requiredArtifactIds.includes(art.id) : true;
    });

    $: if (isOpen) {
        tick().then(() => {
            if (overlayEl && modalEl && !isEmbedded) {
                gsap.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.3 });
                gsap.fromTo(modalEl, { y: 50, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.2)' });
            }
        });
    }

    function close() {
        if (overlayEl && modalEl && !isEmbedded) {
            gsap.to(overlayEl, { opacity: 0, duration: 0.2 });
            gsap.to(modalEl, { y: 30, opacity: 0, scale: 0.9, duration: 0.25, ease: 'power2.in', onComplete: onClose });
        } else {
            onClose();
        }
    }

    async function buy(id: number, cost: number) {
        if ($gameStore.stardust >= cost && !$gameStore.artifacts.includes(id)) {
            gameStore.buyArtifact(id, cost);
            await saveGame();
        }
    }

    async function overcharge(id: number) {
        const stars = $gameStore.artifactOvercharge?.[id] || 0;
        if (stars >= 5) return;
        const cost = getArtifactOverchargeCost(id, stars);
        if ($gameStore.stardust >= cost) {
            gameStore.overchargeArtifact(id);
            await saveGame();
        }
    }

    function getArtifactSet(id: number) {
        return AVAILABLE_COLLECTIONS.find(c => c.requiredArtifactIds.includes(id));
    }
</script>

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" class:embedded={isEmbedded} bind:this={overlayEl} on:click={close}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal" class:embedded-modal={isEmbedded} bind:this={modalEl} on:click|stopPropagation>
        {#if !isEmbedded}
            <div class="tab-header">
                <div class="tab-title-row">
                    <div class="header-icon">
                        <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                            <path d="M10 6 C10 4 22 4 22 6 L21 9 C25 12 26 17 23 23 C21 27 18 28 16 28 C14 28 11 27 9 23 C6 17 7 12 11 9 Z" fill="#d35400" stroke="#f39c12" stroke-width="1.5"/>
                            <path d="M8 12 Q5 14 5 17 Q5 20 9 20" stroke="#f39c12" stroke-width="1.5" stroke-linecap="round"/>
                            <path d="M24 12 Q27 14 27 17 Q27 20 23 20" stroke="#f39c12" stroke-width="1.5" stroke-linecap="round"/>
                            <ellipse cx="16" cy="6" rx="6" ry="2" fill="#e67e22"/>
                        </svg>
                    </div>
                    <h2 class="tab-title">{$t('artifactsStore.title')}</h2>
                </div>
                <p class="header-sub">{$t('artifactsStore.subtitle')}</p>

                <div class="balance-row">
                    <div class="balance-chip stardust">
                        <span class="icon">
                            <ResourceIcon type="stardust" size={16} />
                        </span>
                        <span>{$t('grimoire.stardustBalance', { val: formatNumber($gameStore.stardust) })}</span>
                    </div>
                </div>

                <button class="close-btn" on:click={close} aria-label={$t('common.close')}>
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.2" fill="none">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        {/if}

        <!-- Unified Category Filter Tabs -->
        <div class="category-tabs-wrap">
            <button 
                type="button" 
                class="category-tab-btn" 
                class:active={activeFilter === 'all'} 
                on:click={() => activeFilter = 'all'}
            >
                <span class="tab-label">{$t('rarity.all')}</span>
                <span class="tab-badge">{AVAILABLE_ARTIFACTS.length}</span>
            </button>

            <button 
                type="button" 
                class="category-tab-btn" 
                class:active={activeFilter === 'standalone'} 
                on:click={() => activeFilter = 'standalone'}
            >
                <span class="tab-label">{$t('artifactsStore.basicFilter')}</span>
                <span class="tab-badge">3</span>
            </button>

            {#each AVAILABLE_COLLECTIONS as col}
                {@const ownedInCol = col.requiredArtifactIds.filter(id => $gameStore.artifacts.includes(id)).length}
                {@const isColDone = ownedInCol === col.requiredArtifactIds.length}
                <button 
                    type="button" 
                    class="category-tab-btn" 
                    class:active={activeFilter === col.id} 
                    class:done={isColDone}
                    style="--col-accent: {col.themeColor}"
                    on:click={() => activeFilter = col.id}
                >
                    <span class="tab-dot" style="background: {col.themeColor}"></span>
                    <span class="tab-label">{getCollectionName(col.id, $currentLang)}</span>
                    <span class="tab-badge" class:done={isColDone}>{ownedInCol}/{col.requiredArtifactIds.length}</span>
                </button>
            {/each}
        </div>

        <!-- Dynamic Synergy / Context Showcase Banner -->
        {#if currentSynergySet}
            <div class="synergy-banner" class:completed={isSetComplete} style="--accent-color: {currentSynergySet.themeColor}">
                <div class="synergy-icon">
                    {#if rewardPet}
                        <div class="mini-pet-icon">
                            {@html rewardPet.icon}
                        </div>
                    {:else}
                        <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                            <circle cx="16" cy="16" r="14" stroke={currentSynergySet.themeColor} stroke-width="2" stroke-dasharray="3 2"/>
                            <path d="M16 6 L19 13 L26 14 L21 19 L22 26 L16 22 L10 26 L11 19 L6 14 L13 13 Z" fill="#ffeaa7" stroke={currentSynergySet.themeColor} stroke-width="1.2"/>
                        </svg>
                    {/if}
                </div>
                <div class="synergy-info">
                    <div class="synergy-title-row">
                        <span class="synergy-name">{getCollectionName(currentSynergySet.id, $currentLang)}</span>
                        <span class="synergy-count" class:done={isSetComplete}>{setOwnedCount}/{setTotalCount}</span>
                    </div>
                    <div class="synergy-desc">
                        {#if isSetComplete}
                            {rewardPet ? $t('artifactsStore.setCompleted', { name: getPetName(rewardPet.id, $currentLang) }) : $t('artifactsStore.setCompletedAll')}
                        {:else}
                            {getCollectionDesc(currentSynergySet.id, $currentLang)}
                        {/if}
                    </div>
                </div>
            </div>
        {:else if activeFilter === 'standalone'}
            <div class="synergy-banner standalone" style="--accent-color: #686de0">
                <div class="synergy-icon">
                    <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                        <circle cx="16" cy="16" r="12" stroke="#686de0" stroke-width="2"/>
                        <path d="M16 8 L18 14 L24 16 L18 18 L16 24 L14 18 L8 16 L14 14 Z" fill="#a29bfe"/>
                    </svg>
                </div>
                <div class="synergy-info">
                    <div class="synergy-title-row">
                        <span class="synergy-name">{$t('artifactsStore.basicFilter')}</span>
                        <span class="synergy-count">{standaloneOwnedCount}/3</span>
                    </div>
                    <div class="synergy-desc">
                        {$t('artifactsStore.subtitle')}
                    </div>
                </div>
            </div>
        {:else}
            <div class="synergy-banner all-relics" style="--accent-color: #f1c40f">
                <div class="synergy-icon">
                    <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                        <circle cx="16" cy="16" r="13" stroke="#f1c40f" stroke-width="1.8" stroke-dasharray="4 2"/>
                        <circle cx="16" cy="16" r="7" fill="#ffeaa7" fill-opacity="0.3"/>
                        <path d="M16 5 L18 12 L25 12 L19.5 16 L21.5 23 L16 19 L10.5 23 L12.5 16 L7 12 L14 12 Z" fill="#ffeaa7" stroke="#f39c12" stroke-width="1"/>
                    </svg>
                </div>
                <div class="synergy-info">
                    <div class="synergy-title-row">
                        <span class="synergy-name">{$t('artifactsStore.title')}</span>
                        <span class="synergy-count">{$gameStore.artifacts.length}/{AVAILABLE_ARTIFACTS.length}</span>
                    </div>
                    <div class="synergy-desc">
                        {$t('artifactsStore.setHint')}
                    </div>
                </div>
            </div>
        {/if}
        
        <!-- Artifacts Grid -->
        <div class="artifact-list">
            {#each filteredArtifacts as art}
                {@const isBought = $gameStore.artifacts.includes(art.id)}
                {@const canAfford = $gameStore.stardust >= art.cost}
                {@const setInfo = getArtifactSet(art.id)}
                <div 
                    class="artifact-card" 
                    class:bought={isBought} 
                    class:unaffordable={!canAfford && !isBought} 
                    class:has-set={!!setInfo}
                    style="--card-accent: {setInfo ? setInfo.themeColor : 'rgba(241, 196, 15, 0.4)'}"
                >
                    <div class="artifact-icon">
                        {@html art.svg}
                    </div>
                    <div class="artifact-info">
                        <div class="art-header-line">
                            <h3>{getArtifactName(art.id, $currentLang)}</h3>
                            {#if setInfo && activeFilter !== setInfo.id}
                                <span class="badge-set" style="background: {setInfo.themeColor}">
                                    {getCollectionName(setInfo.id, $currentLang)}
                                </span>
                            {/if}
                        </div>
                        <p>{getArtifactDesc(art.id, $currentLang)}</p>
                    </div>
                    <div class="artifact-action">
                        {#if isBought}
                            {@const stars = $gameStore.artifactOvercharge?.[art.id] || 0}
                            {@const overchargeCost = getArtifactOverchargeCost(art.id, stars)}
                            {@const canOvercharge = $gameStore.stardust >= overchargeCost}
                            <div class="overcharge-block">
                                <div class="stars-row" title="{$t('artifactsStore.overchargeStars', { stars })}">
                                    {#each [0, 1, 2, 3, 4] as sIdx}
                                        <svg viewBox="0 0 24 24" width="13" height="13" class="overcharge-star" class:filled={sIdx < stars}>
                                            <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/>
                                        </svg>
                                    {/each}
                                </div>
                                {#if stars < 5}
                                    <button 
                                        type="button" 
                                        class="btn-overcharge" 
                                        disabled={!canOvercharge}
                                        on:click={() => overcharge(art.id)}
                                        title="{$t('artifactsStore.overchargeTitle')}: {$t('artifactsStore.overchargeBonus', { percent: (stars + 1) * 20 })}"
                                    >
                                        <ResourceIcon type="stardust" size={12} />
                                        <span>{formatNumber(overchargeCost)}</span>
                                        <span class="btn-subtext">{$t('artifactsStore.overchargeBtn')}</span>
                                    </button>
                                {:else}
                                    <span class="max-stars-badge">
                                        {$t('artifactsStore.overchargeMax')}
                                    </span>
                                {/if}
                            </div>
                        {:else}
                            <button 
                                class="btn-buy" 
                                disabled={!canAfford}
                                on:click={() => buy(art.id, art.cost)}
                            >
                                <ResourceIcon type="stardust" size={14} />
                                <span>{formatNumber(art.cost)}</span>
                            </button>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>
{/if}

<style>
    .overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.75);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(8px);
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

    .modal {
        width: 100%;
        max-width: 580px;
        background: linear-gradient(160deg, #1a0a2e 0%, #150826 40%, #0d041a 100%);
        height: 85vh;
        max-height: 680px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.8), 0 0 30px rgba(162, 155, 254, 0.2);
        border: 2px solid rgba(241, 196, 15, 0.35);
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 20px;
        box-sizing: border-box;
    }

    .embedded-modal {
        box-shadow: none;
        border: none;
        border-radius: 0;
        width: 100%;
        max-width: none;
        max-height: none;
        height: auto;
        background: transparent;
        padding: 0;
        overflow: visible;
    }

    .embedded-modal .artifact-list {
        overflow-y: visible;
        height: auto;
    }

    .tab-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 6px;
        margin-bottom: 12px;
        position: relative;
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
        filter: drop-shadow(0 0 8px rgba(241, 196, 15, 0.4));
    }

    .tab-title {
        margin: 0;
        color: #f1c40f;
        font-size: 1.6rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        text-shadow: 0 0 16px rgba(241, 196, 15, 0.5), 0 2px 4px rgba(0,0,0,0.8);
    }

    .header-sub {
        margin: 0;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.7);
    }

    .balance-row {
        display: flex;
        justify-content: center;
        margin-top: 4px;
    }

    .balance-chip.stardust {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(224, 86, 253, 0.4);
        color: #e056fd;
    }

    .close-btn {
        position: absolute;
        right: 0;
        top: 0;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.15);
        color: white;
        border-radius: 50%;
        width: 44px; height: 44px;
        cursor: pointer;
        font-size: 1rem;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .close-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.05); }

    /* Unified Category Tabs */
    .category-tabs-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
        margin-bottom: 8px;
        flex-shrink: 0;
    }

    .category-tab-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        color: #b2bec3;
        font-size: 0.76rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        user-select: none;
        white-space: nowrap;
    }

    .category-tab-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        border-color: rgba(255, 255, 255, 0.25);
    }

    .category-tab-btn.active {
        background: rgba(255, 255, 255, 0.14);
        border-color: var(--col-accent, #f1c40f);
        color: #fff;
        box-shadow: 0 0 10px rgba(241, 196, 15, 0.2);
    }

    .tab-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .tab-badge {
        font-size: 0.68rem;
        font-weight: 800;
        background: rgba(0, 0, 0, 0.4);
        padding: 1px 5px;
        border-radius: 6px;
        color: #dfe6e9;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .category-tab-btn.done .tab-badge {
        color: #2ecc71;
        background: rgba(46, 204, 113, 0.2);
    }

    /* Synergy / Context Banner */
    .synergy-banner {
        display: flex;
        align-items: center;
        gap: 12px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-left: 4px solid var(--accent-color, #f1c40f);
        padding: 10px 14px;
        border-radius: 12px;
        margin-bottom: 12px;
        transition: all 0.3s ease;
    }

    .synergy-banner.completed {
        border-color: rgba(46, 204, 113, 0.4);
        border-left-color: #2ecc71;
        background: linear-gradient(135deg, rgba(46, 204, 113, 0.12) 0%, rgba(46, 204, 113, 0.02) 100%);
    }

    .synergy-icon {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .synergy-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
    }

    .synergy-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
    }

    .synergy-name {
        font-size: 0.88rem;
        font-weight: 700;
        color: #ffeaa7;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
    }

    .synergy-count {
        font-size: 0.82rem;
        font-weight: 800;
        color: #f1c40f;
        background: rgba(0, 0, 0, 0.35);
        padding: 2px 8px;
        border-radius: 10px;
        border: 1px solid rgba(241, 196, 15, 0.3);
        white-space: nowrap;
        flex-shrink: 0;
    }

    .synergy-count.done {
        color: #2ecc71;
        border-color: rgba(46, 204, 113, 0.4);
    }

    .synergy-desc {
        font-size: 0.78rem;
        color: rgba(255, 255, 255, 0.75);
        line-height: 1.3;
    }

    @media (max-width: 520px) {
        .category-tabs-wrap {
            gap: 4px;
        }
        .category-tab-btn {
            padding: 4px 7px;
            font-size: 0.71rem;
            border-radius: 10px;
        }
        .tab-badge {
            font-size: 0.63rem;
            padding: 1px 4px;
        }
    }

    /* Artifacts Grid */
    .artifact-list {
        flex: 1;
        overflow-y: auto;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 10px;
        padding-right: 4px;
    }

    .artifact-card {
        display: flex;
        background: linear-gradient(135deg, rgba(26, 10, 46, 0.75) 0%, rgba(45, 27, 78, 0.6) 100%);
        border: 1px solid rgba(241, 196, 15, 0.2);
        border-radius: 14px;
        padding: 12px;
        align-items: center;
        gap: 12px;
        transition: all 0.25s ease;
        position: relative;
    }

    .artifact-card:hover {
        background: linear-gradient(135deg, rgba(36, 15, 62, 0.85) 0%, rgba(55, 33, 94, 0.7) 100%);
        border-color: var(--card-accent, rgba(241, 196, 15, 0.5));
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    }

    .artifact-card.has-set {
        border-color: var(--card-accent, rgba(162, 155, 254, 0.35));
    }

    .artifact-card.bought {
        border-color: rgba(46, 204, 113, 0.4);
        background: linear-gradient(135deg, rgba(46, 204, 113, 0.08) 0%, rgba(26, 10, 46, 0.7) 100%);
    }

    .artifact-card.unaffordable:not(.bought) {
        opacity: 0.75;
    }

    .artifact-icon {
        width: 52px;
        height: 52px;
        flex-shrink: 0;
        background: rgba(0, 0, 0, 0.35);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 4px;
        box-sizing: border-box;
    }

    .artifact-icon :global(svg) {
        width: 100%;
        height: 100%;
    }

    .artifact-info {
        flex: 1;
        min-width: 0;
    }

    .art-header-line {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 3px;
        flex-wrap: wrap;
    }

    .artifact-info h3 {
        margin: 0;
        color: #ffeaa7;
        font-size: 0.92rem;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .badge-set {
        color: white;
        font-size: 0.65rem;
        font-weight: 800;
        padding: 1px 6px;
        border-radius: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    }

    .artifact-info p {
        margin: 0;
        font-size: 0.76rem;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.3;
    }

    .artifact-action {
        flex-shrink: 0;
    }

    .btn-buy {
        background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%);
        border: 1px solid #a29bfe;
        color: white;
        border-radius: 10px;
        padding: 7px 12px;
        font-weight: 700;
        font-size: 0.85rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(108, 92, 231, 0.4);
    }

    .btn-buy:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(108, 92, 231, 0.6);
        background: linear-gradient(135deg, #b8b1ff 0%, #7d6df0 100%);
    }

    .btn-buy:disabled {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.4);
        cursor: not-allowed;
        box-shadow: none;
    }


    .overcharge-block {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 5px;
    }

    .stars-row {
        display: flex;
        gap: 2px;
        align-items: center;
    }

    .overcharge-star {
        fill: rgba(255, 215, 0, 0.2);
        stroke: rgba(255, 215, 0, 0.4);
        stroke-width: 1;
        transition: all 0.2s;
    }

    .overcharge-star.filled {
        fill: #ffd700;
        stroke: #f39c12;
        filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.6));
    }

    .btn-overcharge {
        background: linear-gradient(135deg, #f39c12 0%, #d35400 100%);
        border: 1px solid #f1c40f;
        color: white;
        border-radius: 8px;
        padding: 4px 9px;
        font-weight: 700;
        font-size: 0.76rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s;
        box-shadow: 0 2px 6px rgba(211, 84, 0, 0.3);
    }

    .btn-overcharge:not(:disabled):hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 10px rgba(241, 196, 15, 0.4);
        background: linear-gradient(135deg, #f1c40f 0%, #e67e22 100%);
    }

    .btn-overcharge:disabled {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.35);
        cursor: not-allowed;
        box-shadow: none;
    }

    .btn-subtext {
        font-size: 0.68rem;
        opacity: 0.85;
        border-left: 1px solid rgba(255, 255, 255, 0.3);
        padding-left: 4px;
        margin-left: 2px;
    }

    .max-stars-badge {
        font-size: 0.72rem;
        font-weight: 800;
        color: #ffd700;
        background: rgba(255, 215, 0, 0.15);
        border: 1px solid rgba(255, 215, 0, 0.4);
        border-radius: 6px;
        padding: 3px 8px;
        letter-spacing: 0.5px;
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
    }

    @media (max-width: 480px) {
        .artifact-list {
            grid-template-columns: 1fr;
        }
    }
</style>
