<script lang="ts">
    import { tick } from 'svelte';
    import { gameStore, formatNumber } from '../store';
    import gsap from 'gsap';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void;

    let overlayEl: HTMLElement;
    let modalEl: HTMLElement;
    
    // Arrays to hold DOM elements for animations
    let progressBars: Record<string, HTMLElement> = {};
    let claimButtons: Record<string, HTMLElement> = {};

    $: if (isOpen) {
        tick().then(() => {
            if (overlayEl && modalEl && !isEmbedded) {
                gsap.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.3 });
                gsap.fromTo(modalEl, { y: 50, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.2)' });
            }
            // Animate progress bars on open
            $gameStore.quests.forEach(q => {
                const bar = progressBars[q.id];
                if (bar) {
                    const width = (q.current / q.target) * 100;
                    gsap.fromTo(bar, { width: 0 }, { width: `${width}%`, duration: 0.5, ease: 'power2.out' });
                }
            });
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

    function claim(id: string) {
        const btn = claimButtons[id];
        if (btn) {
            gsap.to(btn, {
                scale: 1.5,
                opacity: 0,
                duration: 0.3,
                ease: 'power1.out',
                onComplete: () => {
                    gameStore.claimQuest(id);
                }
            });
        } else {
            gameStore.claimQuest(id);
        }
    }

    const typeLabels = {
        'clicks': 'Сделать кликов',
        'buy_upgrades': 'Купить улучшений',
        'watch_ads': 'Посмотреть рекламу'
    };
</script>

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" class:embedded={isEmbedded} bind:this={overlayEl} on:click={close}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal" class:embedded-modal={isEmbedded} bind:this={modalEl} on:click|stopPropagation>
        <div class="modal-header">
            <div class="header-icon">📜</div>
            <div class="header-text">
                <h2>Ежедневные задания</h2>
                <p class="header-sub">Выполняйте задания для получения Звездной Пыли</p>
            </div>
            <button class="close-btn" on:click={close}>✕</button>
        </div>
        <div class="balance-row">
            <div class="balance-chip stardust">
                <span>✨ {formatNumber($gameStore.stardust)} Звездной Пыли</span>
            </div>
        </div>
        
        <div class="quests-list">
            {#each $gameStore.quests as quest (quest.id)}
                <div class="quest-card">
                    <div class="quest-info">
                        <span class="quest-title">{typeLabels[quest.type]}: {quest.target}</span>
                        <div class="reward">
                            <span>✨ {formatNumber(quest.reward)}</span>
                        </div>
                    </div>
                    
                    {#if quest.isClaimed}
                        <div class="claimed-state">
                            <span>✅ Выполнено</span>
                        </div>
                    {:else if quest.isCompleted}
                        <button 
                            class="claim-btn" 
                            bind:this={claimButtons[quest.id]}
                            on:click={() => claim(quest.id)}
                        >
                            Забрать
                        </button>
                    {:else}
                        <div class="progress-container">
                            <div class="progress-bar" bind:this={progressBars[quest.id]}></div>
                            <span class="progress-text">{quest.current} / {quest.target}</span>
                        </div>
                    {/if}
                </div>
            {/each}
            {#if $gameStore.quests.length === 0}
                <div class="empty-state">Нет активных заданий</div>
            {/if}
        </div>
    </div>
</div>
{/if}

<style>
.overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex; justify-content: center; align-items: center;
    z-index: 1000;
}
.modal {
    background: linear-gradient(135deg, #1e272e, #2d3436);
    padding: 30px; border-radius: 15px; border: 2px solid #0984e3;
    width: 90%; max-width: 450px; color: white; position: relative;
    box-shadow: 0 10px 30px rgba(9, 132, 227, 0.4);
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
.quests-list {
    display: flex; flex-direction: column; gap: 15px;
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

.quest-card {
    background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
}
.quest-info {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;
}
.quest-title { font-size: 1.1rem; font-weight: bold; }
.reward {
    background: rgba(241, 196, 15, 0.2); color: #f1c40f; font-weight: bold;
    padding: 5px 10px; border-radius: 15px;
}
.progress-container {
    background: rgba(0,0,0,0.5); border-radius: 10px; height: 25px;
    position: relative; overflow: hidden;
}
.progress-bar {
    background: linear-gradient(90deg, #0984e3, #74b9ff); height: 100%; width: 0%;
}
.progress-text {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    display: flex; justify-content: center; align-items: center;
    font-size: 0.85rem; font-weight: bold; text-shadow: 0 1px 2px black;
}
.claim-btn {
    width: 100%; background: #00b894; color: white; border: none;
    padding: 10px; border-radius: 10px; font-weight: bold; font-size: 1.1rem;
    cursor: pointer; transition: background 0.2s;
}
.claim-btn:hover { background: #55efc4; }
.claimed-state {
    text-align: center; color: #00b894; font-weight: bold; font-size: 1.1rem; padding: 5px;
}
.empty-state { text-align: center; color: #aaa; }
</style>
