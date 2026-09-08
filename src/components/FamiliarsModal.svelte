<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import gsap from 'gsap';
    import { gameStore, crystals, AVAILABLE_PETS, type Pet, type ActiveExpedition, openChest } from '../store';
    import { showRewardedAd } from '../yandex-sdk';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void;

    let activeTab: 'gacha' | 'pets' = 'pets';
    let gachaAnimating = false;
    let rolledPet: Pet | null = null;
    let eggElement: HTMLElement;
    let resultElement: HTMLElement;

    const GACHA_COST = 100;

    // Computed properties
    $: unlockedPets = AVAILABLE_PETS.filter(p => $gameStore.unlockedPets.includes(p.id));
    $: lockedPets = AVAILABLE_PETS.filter(p => !$gameStore.unlockedPets.includes(p.id));
    $: activeExps = $gameStore.activeExpeditions;

    // Timers update
    let now = Date.now();
    let timerInterval: number;

    onMount(() => {
        timerInterval = setInterval(() => {
            now = Date.now();
        }, 1000);
    });

    onDestroy(() => {
        if (timerInterval) clearInterval(timerInterval);
    });

    function getExpeditionTimeRemaining(exp: ActiveExpedition) {
        const end = exp.startTime + exp.durationMs;
        const diff = end - now;
        return diff > 0 ? diff : 0;
    }

    function formatTime(ms: number) {
        if (ms <= 0) return 'Готово!';
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) return `${hours}ч ${minutes}м`;
        return `${minutes}м ${seconds}с`;
    }

    function rollGacha() {
        if (lockedPets.length === 0) {
            alert('Вы уже собрали всех фамильяров!');
            return;
        }
        if ($crystals < GACHA_COST) {
            // GSAP shake animation for insufficient funds
            gsap.fromTo('.gacha-btn', 
                { x: -10 }, 
                { x: 10, duration: 0.1, yoyo: true, repeat: 5, onComplete: () => gsap.set('.gacha-btn', { x: 0 }) }
            );
            return;
        }

        // Deduct crystals
        crystals.update(c => c - GACHA_COST);
        
        // Pick random locked pet
        const randomIndex = Math.floor(Math.random() * lockedPets.length);
        const newPet = lockedPets[randomIndex];

        gachaAnimating = true;
        rolledPet = null;

        // Egg animation
        setTimeout(() => {
            if (eggElement) {
                gsap.timeline()
                    .set(eggElement, { scale: 1, rotation: 0, opacity: 1 })
                    .to(eggElement, { rotation: 15, duration: 0.1, yoyo: true, repeat: 5 })
                    .to(eggElement, { rotation: -15, duration: 0.1, yoyo: true, repeat: 5 })
                    .to(eggElement, { scale: 1.5, duration: 0.2 })
                    .to(eggElement, { scale: 0, duration: 0.1, ease: 'back.in(2)', onComplete: () => {
                        rolledPet = newPet;
                        gameStore.unlockPet(newPet.id);
                        
                        // Show result
                        setTimeout(() => {
                            if (resultElement) {
                                gsap.fromTo(resultElement, 
                                    { scale: 0, opacity: 0, rotation: -180 },
                                    { scale: 1, opacity: 1, rotation: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' }
                                );
                            }
                        }, 50);
                    }});
            }
        }, 50);
    }

    function closeGachaResult() {
        gachaAnimating = false;
        rolledPet = null;
    }

    function startExpedition(petId: string) {
        const pet = AVAILABLE_PETS.find(p => p.id === petId);
        if (!pet) return;
        
        let hours = 1;
        if (pet.rarity === 'rare') hours = 3;
        if (pet.rarity === 'epic') hours = 6;
        if (pet.rarity === 'legendary') hours = 12;

        gameStore.startExpedition(petId, hours);
    }

    function speedUpExpedition(petId: string) {
        showRewardedAd(() => {
            gameStore.speedUpExpedition(petId, 2); // Reduce by 2 hours
            gameStore.updateQuestProgress('watch_ads', 1);
        }, () => {});
    }

    function claimExpedition(petId: string) {
        const pet = AVAILABLE_PETS.find(p => p.id === petId);
        gameStore.claimExpedition(petId);
        
        let chestType: 'wooden' | 'magical' | 'astral' = 'wooden';
        if (pet?.rarity === 'rare') chestType = 'wooden';
        if (pet?.rarity === 'epic') chestType = 'magical';
        if (pet?.rarity === 'legendary') chestType = 'astral';
        
        openChest(chestType);
        
        gameStore.update(s => ({ ...s, stardust: s.stardust + 10 }));
    }
</script>

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key-events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" class:embedded={isEmbedded} on:click={onClose}>
    <!-- svelte-ignore a11y_click_events_have_key-events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal" class:embedded-modal={isEmbedded} on:click|stopPropagation>
        <div class="modal-header">
            <div class="header-icon">🐾</div>
            <div class="header-text">
                <h2>Обитель Фамильяров</h2>
                <p class="header-sub">Призывайте питомцев и отправляйте их в экспедиции</p>
            </div>
            <button class="close-btn" on:click={onClose}>✕</button>
        </div>
        
        <div class="balance-row">
            <div class="balance-chip crystal">
                <span>💎 {$crystals} кристаллов</span>
            </div>
        </div>
        
        <div class="tabs">
            <button class:active={activeTab === 'pets'} on:click={() => activeTab = 'pets'}>Мои Питомцы</button>
            <button class:active={activeTab === 'gacha'} on:click={() => activeTab = 'gacha'}>Призыв (Гача)</button>
        </div>

        <div class="tab-content">
            {#if activeTab === 'pets'}
                <div class="pets-list">
                    {#if unlockedPets.length === 0}
                        <div class="empty-state">У вас пока нет фамильяров. Загляните во вкладку "Призыв"!</div>
                    {:else}
                        {#each unlockedPets as pet (pet.id)}
                            {@const exp = activeExps.find(e => e.petId === pet.id)}
                            {@const timeRem = exp ? getExpeditionTimeRemaining(exp) : 0}
                            {@const isExpActive = !!exp}
                            {@const isExpDone = isExpActive && timeRem <= 0}
                            
                            <div class="pet-card {pet.rarity}">
                                <div class="pet-icon">{@html pet.icon}</div>
                                <div class="pet-info">
                                    <h3>{pet.name}</h3>
                                    <p>{pet.description}</p>
                                    
                                    {#if isExpDone}
                                        <button class="action-btn claim-btn" on:click={() => claimExpedition(pet.id)}>Забрать награду!</button>
                                    {:else if isExpActive}
                                        <div class="timer">В экспедиции: {formatTime(timeRem)}</div>
                                        <button class="action-btn speed-btn" on:click={() => speedUpExpedition(pet.id)}>
                                            -2ч за <span class="video-icon">▶️</span>
                                        </button>
                                    {:else}
                                        <button class="action-btn start-btn" on:click={() => startExpedition(pet.id)}>Отправить за добычей</button>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
            {:else if activeTab === 'gacha'}
                <div class="gacha-container">
                    {#if !gachaAnimating}
                        <div class="gacha-info">
                            <p>Призовите нового магического питомца!<br>Он будет ходить в экспедиции и добывать ингредиенты.</p>
                            <p class="cost">Стоимость: <span class="crystal-icon">💎</span> {GACHA_COST}</p>
                            <button class="gacha-btn" on:click={rollGacha} disabled={lockedPets.length === 0}>
                                {lockedPets.length === 0 ? 'Все собраны!' : 'Призвать Фамильяра'}
                            </button>
                        </div>
                        <div class="gacha-egg">
                            <svg viewBox="0 0 100 100" width="120" height="120">
                                <ellipse cx="50" cy="50" rx="35" ry="45" fill="url(#eggGrad)" stroke="#a29bfe" stroke-width="2"/>
                                <defs>
                                    <linearGradient id="eggGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="#6c5ce7"/>
                                        <stop offset="100%" stop-color="#fd79a8"/>
                                    </linearGradient>
                                </defs>
                                <circle cx="40" cy="30" r="5" fill="white" opacity="0.4"/>
                                <circle cx="60" cy="60" r="8" fill="white" opacity="0.2"/>
                            </svg>
                        </div>
                    {:else}
                        {#if !rolledPet}
                            <div class="gacha-egg animating" bind:this={eggElement}>
                                <svg viewBox="0 0 100 100" width="120" height="120">
                                    <ellipse cx="50" cy="50" rx="35" ry="45" fill="url(#eggGradActive)" stroke="#fff" stroke-width="3"/>
                                    <defs>
                                        <linearGradient id="eggGradActive" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stop-color="#fd79a8"/>
                                            <stop offset="100%" stop-color="#f1c40f"/>
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        {:else}
                            <div class="gacha-result {rolledPet.rarity}" bind:this={resultElement}>
                                <h3>Новый Фамильяр!</h3>
                                <div class="result-icon">{@html rolledPet.icon}</div>
                                <h2 class="pet-name">{rolledPet.name}</h2>
                                <p class="rarity-label {rolledPet.rarity}">{rolledPet.rarity.toUpperCase()}</p>
                                <button class="action-btn claim-btn" on:click={closeGachaResult}>Замечательно!</button>
                            </div>
                        {/if}
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</div>
{/if}

<style>
    .overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
        backdrop-filter: blur(4px);
    }
    
    .modal {
        background: linear-gradient(135deg, #1e1e2f, #2d3436);
        padding: 30px;
        border-radius: 20px;
        border: 2px solid #6c5ce7;
        box-shadow: 0 10px 40px rgba(108, 92, 231, 0.4);
        width: 90%;
        max-width: 600px;
        color: white;
        position: relative;
        animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        display: flex;
        flex-direction: column;
        max-height: 85vh;
    }

    @keyframes slideIn {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    .close-btn {
        position: absolute;
        right: 16px;
        top: 16px;
        background: rgba(255,255,255,0.07);
        border: 1px solid rgba(255,255,255,0.12);
        color: white;
        border-radius: 50%;
        width: 30px; height: 30px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: background 0.2s;
    }
    .close-btn:hover { background: rgba(255,255,255,0.15); }

    .tabs {
        display: flex;
        margin-bottom: 20px;
        border-bottom: 2px solid rgba(255,255,255,0.1);
    }

    .tabs button {
        flex: 1;
        background: transparent;
        border: none;
        color: #b2bec3;
        padding: 15px;
        font-size: 1.2rem;
        font-weight: bold;
        cursor: pointer;
        transition: color 0.2s, background 0.2s;
    }
    
    .tabs button.active {
        color: #a29bfe;
        border-bottom: 3px solid #a29bfe;
        background: rgba(162, 155, 254, 0.1);
    }

    .tab-content {
        flex: 1;
        overflow-y: auto;
        padding-right: 10px;
    }

    /* Pets List */
    .pets-list {
        display: flex;
        flex-direction: column;
        color: white;
        gap: 15px;
    }

    .embedded {
        position: relative;
        background: transparent;
        backdrop-filter: none;
        z-index: 1;
        padding: 0;
        inset: auto;
    }

    .embedded-modal {
        box-shadow: none;
        border: none;
        border-radius: 0;
        width: 100%;
        max-width: none;
        max-height: none;
        height: 100%;
        background: transparent;
    }

    .empty-state {
        text-align: center;
        padding: 40px;
        color: #b2bec3;
        font-size: 1.2rem;
    }

    .pet-card {
        background: rgba(0,0,0,0.3);
        border-radius: 15px;
        padding: 15px;
        display: flex;
        gap: 20px;
        align-items: center;
        border-left: 5px solid gray;
    }

    .pet-card.common { border-color: #b2bec3; }
    .pet-card.rare { border-color: #74b9ff; }
    .pet-card.epic { border-color: #a29bfe; }
    .pet-card.legendary { border-color: #f1c40f; }

    .pet-icon {
        width: 60px;
        height: 60px;
        background: rgba(255,255,255,0.05);
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-shrink: 0;
    }

    .pet-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .pet-info h3 { margin: 0; font-size: 1.3rem; }
    .pet-info p { margin: 0; font-size: 0.9rem; color: #b2bec3; }

    .action-btn {
        margin-top: 10px;
        padding: 8px 15px;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.1s, filter 0.1s;
    }
    .action-btn:hover { filter: brightness(1.1); transform: scale(1.02); }
    .action-btn:active { transform: scale(0.95); }

    .start-btn { background: #0984e3; color: white; }
    .speed-btn { background: #e17055; color: white; display: flex; align-items: center; gap: 5px; width: fit-content; }
    .claim-btn { background: #00b894; color: white; font-size: 1.1rem; padding: 10px; }
    
    .timer {
        color: #f1c40f;
        font-weight: bold;
        margin-top: 5px;
    }

    /* Gacha */
    .gacha-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 350px;
        text-align: center;
    }

    .gacha-info p {
        font-size: 1.2rem;
        line-height: 1.5;
    }
    
    .gacha-info .cost {
        font-size: 1.5rem;
        color: #74b9ff;
        font-weight: bold;
        margin: 20px 0;
    }

    .gacha-btn {
        background: linear-gradient(135deg, #a29bfe, #6c5ce7);
        border: none;
        border-radius: 20px;
        padding: 15px 40px;
        font-size: 1.5rem;
        color: white;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 5px 15px rgba(108, 92, 231, 0.5);
        transition: transform 0.2s;
    }
    .gacha-btn:hover:not(:disabled) {
        transform: scale(1.05);
    }
    .gacha-btn:disabled {
        background: gray;
        cursor: not-allowed;
        box-shadow: none;
    }

    .gacha-egg {
        margin-top: 30px;
        filter: drop-shadow(0 10px 10px rgba(0,0,0,0.5));
    }
    
    .gacha-egg.animating {
        margin-top: 0;
    }

    .gacha-result {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(0,0,0,0.3);
        padding: 30px;
        border-radius: 20px;
        border: 2px solid;
    }
    
    .gacha-result.common { border-color: #b2bec3; box-shadow: 0 0 20px rgba(178, 190, 195, 0.4); }
    .gacha-result.rare { border-color: #74b9ff; box-shadow: 0 0 20px rgba(116, 185, 255, 0.4); }
    .gacha-result.epic { border-color: #a29bfe; box-shadow: 0 0 20px rgba(162, 155, 254, 0.4); }
    .gacha-result.legendary { border-color: #f1c40f; box-shadow: 0 0 20px rgba(241, 196, 15, 0.4); }

    .result-icon {
        width: 120px;
        height: 120px;
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 20px 0;
        background: rgba(255,255,255,0.05);
        border-radius: 50%;
    }
    .result-icon :global(svg) {
        width: 80px;
        height: 80px;
    }
    
    .pet-name { margin: 0; color: white; font-size: 2rem; }
    
    .rarity-label {
        font-weight: bold;
        letter-spacing: 2px;
        margin-bottom: 20px;
    }
    .rarity-label.common { color: #b2bec3; }
    .rarity-label.rare { color: #74b9ff; }
    .rarity-label.epic { color: #a29bfe; }
    .rarity-label.legendary { color: #f1c40f; }

</style>
