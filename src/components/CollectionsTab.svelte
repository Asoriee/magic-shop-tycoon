<script lang="ts">
    import { onMount } from 'svelte';
    import gsap from 'gsap';
    import { 
        gameStore, 
        AVAILABLE_COLLECTIONS, 
        AVAILABLE_ARTIFACTS, 
        AVAILABLE_PETS,
        formatNumber 
    } from '../store';

    let containerEl: HTMLElement;

    onMount(() => {
        if (containerEl) {
            gsap.fromTo(containerEl.children,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.35, stagger: 0.08, ease: 'power2.out' }
            );
        }
    });

    export function animateIn() {
        if (containerEl) {
            gsap.fromTo(containerEl.children,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.3, stagger: 0.08, ease: 'power2.out' }
            );
        }
    }
</script>

<div class="collections-container" bind:this={containerEl}>
    {#each AVAILABLE_COLLECTIONS as collection}
        {@const isUnlocked = $gameStore.unlockedCollections.includes(collection.id)}
        {@const ownedArtifactsCount = collection.requiredArtifactIds.filter(id => $gameStore.artifacts.includes(id)).length}
        {@const totalArtifacts = collection.requiredArtifactIds.length}
        {@const rewardPet = AVAILABLE_PETS.find(p => p.id === collection.rewardPetId)}
        {@const progressPct = Math.round((ownedArtifactsCount / totalArtifacts) * 100)}

        <div class="collection-vitrine" class:unlocked={isUnlocked}>
            
            <!-- Vitrine Header -->
            <div class="vitrine-header">
                <div class="vitrine-crest">
                    <svg viewBox="0 0 36 36" width="32" height="32">
                        <path d="M18 3L6 7v9c0 9 5.5 15 12 17 6.5-2 12-8 12-17V7l-12-4z" 
                              fill={isUnlocked ? "#f1c40f" : "#2d1b4e"} 
                              stroke="#ffd700" stroke-width="1.8"/>
                        <path d="M18 9l2 5h5l-4 3.5 1.5 5.5-4.5-3-4.5 3 1.5-5.5-4-3.5h5z" 
                              fill={isUnlocked ? "#9b59b6" : "#f1c40f"}/>
                    </svg>
                </div>

                <div class="vitrine-titles">
                    <div class="vitrine-name-line">
                        <h3 class="vitrine-name">{collection.name}</h3>
                        {#if isUnlocked}
                            <span class="complete-badge">Собрано</span>
                        {/if}
                    </div>
                    <span class="vitrine-desc">Соберите комплект реликвий в Лавке Древностей Города, чтобы пробудить великую силу!</span>
                </div>

                <div class="vitrine-progress-badge">
                    <span class="progress-nums">{ownedArtifactsCount} / {totalArtifacts}</span>
                    <span class="progress-pct">{progressPct}%</span>
                </div>
            </div>

            <!-- Progress Bar -->
            <div class="vitrine-bar-wrap">
                <div class="vitrine-bar-fill" style="width: {progressPct}%"></div>
            </div>

            <!-- Artifacts Gallery / Pedestals -->
            <div class="pedestals-gallery">
                {#each collection.requiredArtifactIds as artId}
                    {@const artifact = AVAILABLE_ARTIFACTS.find(a => a.id === artId)}
                    {@const isOwned = $gameStore.artifacts.includes(artId)}
                    {#if artifact}
                        <div class="pedestal-card" class:owned={isOwned}>
                            <div class="pedestal-glow"></div>
                            <div class="pedestal-icon-box">
                                {@html artifact.svg}
                            </div>
                            <div class="pedestal-info">
                                <span class="pedestal-name">{artifact.name}</span>
                                {#if isOwned}
                                    <span class="pedestal-status owned-status">
                                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        Получено
                                    </span>
                                {:else}
                                    <span class="pedestal-status locked-status">
                                        {formatNumber(artifact.cost)} пыли
                                    </span>
                                {/if}
                            </div>
                        </div>
                    {/if}
                {/each}
            </div>

            <!-- Reward Showcase Section -->
            <div class="reward-vitrine" class:reward-unlocked={isUnlocked}>
                <div class="reward-header-line">
                    <span class="reward-tag">ГРАНД-НАГРАДА КОМПЛЕКТА</span>
                    {#if isUnlocked}
                        <span class="active-effect-tag">ЭФФЕКТЫ АКТИВНЫ</span>
                    {:else}
                        <span class="pending-effect-tag">ТРЕБУЕТСЯ СБОРКА</span>
                    {/if}
                </div>

                <div class="reward-main">
                    {#if rewardPet}
                        <div class="reward-pet-preview">
                            <div class="reward-pet-icon">
                                {@html rewardPet.icon}
                            </div>
                            <span class="reward-pet-rarity">ЛЕГЕНДАРНЫЙ</span>
                        </div>

                        <div class="reward-details">
                            <h4 class="reward-pet-title">{rewardPet.name}</h4>
                            <div class="perks-list">
                                <div class="perk-item">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="#f1c40f">
                                        <polygon points="12,2 15,8.5 22,9.5 17,14.5 18.5,21.5 12,18 5.5,21.5 7,14.5 2,9.5 9,8.5"/>
                                    </svg>
                                    <span><strong>+150%</strong> к пассивному доходу золота</span>
                                </div>
                                <div class="perk-item">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="#74b9ff">
                                        <polygon points="12,2 15,8.5 22,9.5 17,14.5 18.5,21.5 12,18 5.5,21.5 7,14.5 2,9.5 9,8.5"/>
                                    </svg>
                                    <span><strong>+100%</strong> к силе магического клика</span>
                                </div>
                                <div class="perk-item">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="#e056fd">
                                        <polygon points="12,2 15,8.5 22,9.5 17,14.5 18.5,21.5 12,18 5.5,21.5 7,14.5 2,9.5 9,8.5"/>
                                    </svg>
                                    <span>Уникальный спутник и экспедиции за редкими сокровищами</span>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

        </div>
    {/each}

    <!-- Teaser for Future Collections -->
    <div class="future-collection-card">
        <div class="future-icon">
            <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="#718093" stroke-width="1.8">
                <circle cx="16" cy="16" r="13" stroke-dasharray="4 4"/>
                <path d="M12 16h8M16 12v8"/>
            </svg>
        </div>
        <div class="future-info">
            <h4 class="future-title">Тайны Стихийного Плана</h4>
            <p class="future-desc">Древние гримуары шепчут о будущих реликвиях пламени и пустоты. Исследуйте мир, чтобы первыми узнать о новых сокровищах!</p>
        </div>
    </div>
</div>

<style>
    .collections-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
        box-sizing: border-box;
    }

    .collection-vitrine {
        position: relative;
        background: linear-gradient(160deg, rgba(26, 12, 48, 0.75) 0%, rgba(14, 6, 26, 0.9) 100%);
        border: 1.5px solid rgba(162, 155, 254, 0.25);
        border-radius: 20px;
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
        transition: border-color 0.3s, box-shadow 0.3s;
    }

    .collection-vitrine.unlocked {
        border-color: rgba(241, 196, 15, 0.5);
        box-shadow: 0 0 35px rgba(241, 196, 15, 0.2), 0 10px 35px rgba(0, 0, 0, 0.7);
        background: linear-gradient(160deg, rgba(38, 20, 64, 0.8) 0%, rgba(20, 10, 35, 0.92) 100%);
    }

    /* Vitrine Header */
    .vitrine-header {
        display: flex;
        align-items: flex-start;
        gap: 14px;
    }

    .vitrine-crest {
        flex-shrink: 0;
        filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
    }

    .vitrine-titles {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .vitrine-name-line {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .vitrine-name {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 900;
        letter-spacing: 0.5px;
        color: #ffd700;
        text-shadow: 0 2px 8px rgba(241, 196, 15, 0.3);
    }

    .complete-badge {
        background: linear-gradient(135deg, #2ed573, #10ac84);
        color: #042410;
        font-weight: 800;
        font-size: 0.68rem;
        padding: 2px 8px;
        border-radius: 10px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }

    .vitrine-desc {
        font-size: 0.78rem;
        color: #a4b0be;
        line-height: 1.35;
    }

    .vitrine-progress-badge {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 6px 10px;
        border-radius: 12px;
        flex-shrink: 0;
    }

    .progress-nums {
        font-size: 0.95rem;
        font-weight: 900;
        color: #ffd700;
    }

    .progress-pct {
        font-size: 0.7rem;
        color: #8395a7;
        font-weight: 700;
    }

    /* Progress Bar */
    .vitrine-bar-wrap {
        width: 100%;
        height: 6px;
        background: rgba(0, 0, 0, 0.45);
        border-radius: 4px;
        overflow: hidden;
    }

    .vitrine-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #f39c12, #f1c40f);
        border-radius: 4px;
        transition: width 0.4s ease;
    }

    /* Pedestals Gallery */
    .pedestals-gallery {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(105px, 1fr));
        gap: 10px;
    }

    .pedestal-card {
        position: relative;
        background: rgba(15, 7, 26, 0.65);
        border: 1.5px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 12px 6px 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
        overflow: hidden;
    }

    .pedestal-card.owned {
        border-color: rgba(241, 196, 15, 0.45);
        background: linear-gradient(180deg, rgba(241, 196, 15, 0.08) 0%, rgba(15, 7, 26, 0.8) 100%);
        box-shadow: 0 4px 15px rgba(0,0,0,0.5), inset 0 0 15px rgba(241, 196, 15, 0.1);
    }

    .pedestal-card.owned:hover {
        transform: translateY(-2px);
        border-color: #ffd700;
    }

    .pedestal-card:not(.owned) {
        opacity: 0.45;
        filter: grayscale(80%);
    }

    .pedestal-icon-box {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .pedestal-icon-box :global(svg) {
        width: 44px;
        height: 44px;
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.6));
    }

    .pedestal-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 2px;
        width: 100%;
    }

    .pedestal-name {
        font-size: 0.72rem;
        font-weight: 700;
        color: #dcdde1;
        line-height: 1.2;
    }

    .pedestal-status {
        font-size: 0.65rem;
        font-weight: 800;
        display: flex;
        align-items: center;
        gap: 3px;
    }

    .owned-status {
        color: #2ed573;
    }

    .locked-status {
        color: #e056fd;
    }

    /* Reward Vitrine */
    .reward-vitrine {
        background: rgba(0, 0, 0, 0.35);
        border: 1.5px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .reward-vitrine.reward-unlocked {
        border-color: rgba(241, 196, 15, 0.4);
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.08), rgba(0, 0, 0, 0.4));
    }

    .reward-header-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .reward-tag {
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.8px;
        color: #ffd700;
    }

    .active-effect-tag {
        font-size: 0.65rem;
        font-weight: 800;
        background: rgba(46, 213, 115, 0.2);
        color: #2ed573;
        border: 1px solid rgba(46, 213, 115, 0.4);
        padding: 2px 8px;
        border-radius: 8px;
    }

    .pending-effect-tag {
        font-size: 0.65rem;
        font-weight: 800;
        background: rgba(255, 255, 255, 0.06);
        color: #8395a7;
        padding: 2px 8px;
        border-radius: 8px;
    }

    .reward-main {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .reward-pet-preview {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
    }

    .reward-pet-icon {
        width: 58px;
        height: 58px;
        background: rgba(0,0,0,0.35);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #ffd700;
        box-shadow: 0 0 16px rgba(241, 196, 15, 0.35);
    }

    .reward-pet-icon :global(svg) {
        width: 44px;
        height: 44px;
    }

    .reward-pet-rarity {
        font-size: 0.62rem;
        font-weight: 800;
        color: #f1c40f;
        letter-spacing: 0.5px;
    }

    .reward-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .reward-pet-title {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 800;
        color: #fff;
    }

    .perks-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .perk-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.78rem;
        color: #dcdde1;
    }

    .perk-item strong {
        color: #ffd700;
    }

    /* Future Collection Teaser */
    .future-collection-card {
        background: rgba(0, 0, 0, 0.2);
        border: 1px dashed rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        padding: 14px;
        display: flex;
        align-items: center;
        gap: 14px;
        opacity: 0.6;
    }

    .future-icon {
        flex-shrink: 0;
    }

    .future-info {
        flex: 1;
    }

    .future-title {
        margin: 0 0 2px;
        font-size: 0.92rem;
        color: #dcdde1;
    }

    .future-desc {
        margin: 0;
        font-size: 0.75rem;
        color: #8395a7;
        line-height: 1.35;
    }

    @media (max-width: 480px) {
        .collections-container {
            padding: 10px;
            gap: 12px;
        }
        .collection-vitrine {
            padding: 12px;
        }
        .pedestals-gallery {
            grid-template-columns: repeat(auto-fit, minmax(85px, 1fr));
            gap: 8px;
        }
        .reward-main {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
        }
        .reward-pet-preview {
            flex-direction: row;
            gap: 10px;
        }
    }
</style>
