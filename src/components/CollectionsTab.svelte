<script lang="ts">
    import { gameStore, AVAILABLE_COLLECTIONS, AVAILABLE_ARTIFACTS, AVAILABLE_PETS } from '../store';
    import { tick } from 'svelte';
    import gsap from 'gsap';

    let listEl: HTMLElement;

    export function animateIn() {
        if (listEl) {
            gsap.fromTo(listEl.children, 
                { y: 20, opacity: 0 }, 
                { y: 0, opacity: 1, duration: 0.3, stagger: 0.1, ease: 'back.out(1.2)' }
            );
        }
    }
</script>

<div class="collections-container" bind:this={listEl}>
    {#each AVAILABLE_COLLECTIONS as collection}
        {@const isUnlocked = $gameStore.unlockedCollections.includes(collection.id)}
        {@const ownedArtifactsCount = collection.requiredArtifactIds.filter(id => $gameStore.artifacts.includes(id)).length}
        {@const totalArtifacts = collection.requiredArtifactIds.length}
        {@const rewardPet = AVAILABLE_PETS.find(p => p.id === collection.rewardPetId)}

        <div class="collection-card" class:unlocked={isUnlocked}>
            <div class="collection-header">
                <h3>{collection.name}</h3>
                <span class="progress">{ownedArtifactsCount} / {totalArtifacts}</span>
            </div>

            <div class="artifacts-row">
                {#each collection.requiredArtifactIds as artId}
                    {@const artifact = AVAILABLE_ARTIFACTS.find(a => a.id === artId)}
                    {@const isOwned = $gameStore.artifacts.includes(artId)}
                    {#if artifact}
                        <div class="artifact-icon" class:owned={isOwned} title={artifact.name}>
                            {@html artifact.svg}
                        </div>
                    {/if}
                {/each}
            </div>

            <div class="reward-section">
                <span>Награда:</span>
                {#if rewardPet}
                    <div class="reward-pet" title={rewardPet.name}>
                        {@html rewardPet.icon}
                        <span>{rewardPet.name}</span>
                    </div>
                {/if}
            </div>
            
            {#if isUnlocked}
                <div class="status-overlay">Собрано!</div>
            {/if}
        </div>
    {/each}
</div>

<style>
    .collections-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
        padding: 10px;
    }

    .collection-card {
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        padding: 15px;
        position: relative;
        overflow: hidden;
        transition: transform 0.2s, border-color 0.2s;
    }

    .collection-card.unlocked {
        border-color: #f1c40f;
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.1), rgba(230, 126, 34, 0.1));
        box-shadow: 0 0 15px rgba(241, 196, 15, 0.2);
    }

    .collection-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }

    .collection-header h3 {
        margin: 0;
        color: #f1c40f;
        font-size: 1.2rem;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }

    .progress {
        font-weight: bold;
        color: #ecf0f1;
        background: rgba(0, 0, 0, 0.5);
        padding: 4px 10px;
        border-radius: 10px;
    }

    .artifacts-row {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-bottom: 15px;
        flex-wrap: wrap;
    }

    .artifact-icon {
        width: 50px;
        height: 50px;
        background: rgba(0,0,0,0.3);
        border-radius: 10px;
        padding: 5px;
        filter: grayscale(1) opacity(0.5);
        transition: filter 0.3s, transform 0.2s;
    }

    .artifact-icon.owned {
        filter: grayscale(0) opacity(1);
        background: rgba(241, 196, 15, 0.2);
        border: 1px solid rgba(241, 196, 15, 0.5);
        box-shadow: 0 0 10px rgba(241, 196, 15, 0.3);
    }

    .artifact-icon.owned:hover {
        transform: scale(1.1);
    }

    .reward-section {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(0, 0, 0, 0.3);
        padding: 10px;
        border-radius: 10px;
        color: #bdc3c7;
    }

    .reward-pet {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #ecf0f1;
        font-weight: bold;
    }

    .reward-pet :global(svg) {
        width: 30px;
        height: 30px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
    }

    .status-overlay {
        position: absolute;
        top: 20px;
        right: -30px;
        background: #f1c40f;
        color: #000;
        font-weight: bold;
        padding: 5px 30px;
        transform: rotate(45deg);
        box-shadow: 0 2px 10px rgba(0,0,0,0.5);
        font-size: 0.9rem;
        z-index: 2;
    }
</style>
