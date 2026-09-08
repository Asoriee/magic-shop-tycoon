<script lang="ts">
    import { tick } from 'svelte';
    import gsap from 'gsap';
    import {
        ingredientsCount, crystals, failedBrewAttempts, unlockedRecipes,
        AVAILABLE_INGREDIENTS, AVAILABLE_POTIONS, RECIPES, HINT_COSTS,
        brewPotion as doBrewPotion, buyRecipeHint,
        type Rarity,
    } from '../store';
    import { saveGame } from '../yandex-sdk';

    export let isOpen = false;
    export let isEmbedded = false;
    export let onClose: () => void;

    let overlayEl: HTMLElement;
    let modalEl:   HTMLElement;
    let cauldronEl: HTMLElement;
    let flashEl:    HTMLElement;

    let slots: [string | null, string | null, string | null] = [null, null, null];

    type ToastType = 'success' | 'warning' | 'burn';
    let toast: { text: string; type: ToastType } | null = null;
    let toastTimer = 0;
    function showToast(text: string, type: ToastType, ms = 3200) {
        clearTimeout(toastTimer);
        toast = { text, type };
        toastTimer = window.setTimeout(() => (toast = null), ms);
    }

    $: if (isOpen) {
        tick().then(() => {
            if (!overlayEl || !modalEl || isEmbedded) return;
            gsap.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.3 });
            gsap.fromTo(modalEl,
                { y: 60, opacity: 0, scale: 0.88 },
                { y: 0,  opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.2)' }
            );
        });
    }

    function close() {
        if (overlayEl && modalEl && !isEmbedded) {
            gsap.to(overlayEl, { opacity: 0, duration: 0.25 });
            gsap.to(modalEl, { y: 40, opacity: 0, scale: 0.9, duration: 0.3, ease: 'power2.in', onComplete: onClose });
        } else { onClose(); }
    }

    $: usedCounts = slots.reduce((acc, s) => {
        if (s) acc[s] = (acc[s] ?? 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    $: ownedIngredients = AVAILABLE_INGREDIENTS
        .map(ing => ({
            ...ing,
            total:     $ingredientsCount[ing.id] ?? 0,
            available: ($ingredientsCount[ing.id] ?? 0) - (usedCounts[ing.id] ?? 0),
        }))
        .filter(ing => ing.total > 0);

    $: canBrew  = slots.every(s => s !== null);
    $: slotsAll = slots.every(s => s !== null);

    function clearSlot(i: number) {
        slots[i] = null;
        slots = [...slots] as typeof slots;
    }
    function addToSlot(id: string) {
        const avail = ($ingredientsCount[id] ?? 0) - (usedCounts[id] ?? 0);
        if (avail <= 0 || slotsAll) return;
        const idx = slots.findIndex(s => s === null);
        if (idx === -1) return;
        slots[idx] = id;
        slots = [...slots] as typeof slots;
    }

    let isBrewing = false;
    async function handleBrew() {
        if (!canBrew || isBrewing) return;
        isBrewing = true;
        const result = doBrewPotion(slots as [string, string, string]);

        if (result === 'success') {
            slots = [null, null, null];
            gsap.timeline()
                .to(cauldronEl, { y: -22, scale: 1.14, duration: 0.18, ease: 'power2.out' })
                .to(cauldronEl, { y: 0,   scale: 1,    duration: 0.55, ease: 'elastic.out(1, 0.5)' });
            gsap.fromTo(flashEl, { opacity: 0.65, backgroundColor: 'rgba(241,196,15,0.55)' }, { opacity: 0, duration: 0.7 });
            showToast('✨ Зелье создано!', 'success');
            await saveGame();
        } else if (result === 'warning') {
            const left = 3 - $failedBrewAttempts;
            gsap.to(cauldronEl, { keyframes: [{ x:-7, duration:.07 },{ x:7, duration:.07 },{ x:-5, duration:.07 },{ x:5, duration:.07 },{ x:0, duration:.06 }] });
            gsap.fromTo(flashEl, { opacity: 0.35, backgroundColor: 'rgba(253,203,0,0.3)' }, { opacity: 0, duration: 0.5 });
            showToast(`⚠️ Неверный рецепт! Ингредиенты сгорят через ${left} ${left===1?'попытку':'попытки'}!`, 'warning');
        } else {
            slots = [null, null, null];
            gsap.to(cauldronEl, { keyframes: [{ x:-14, duration:.07 },{ x:14, duration:.07 },{ x:-12, duration:.07 },{ x:12, duration:.07 },{ x:-10, duration:.07 },{ x:10, duration:.07 },{ x:0, duration:.07 }] });
            gsap.fromTo(flashEl, { opacity: 0.7, backgroundColor: 'rgba(231,76,60,0.6)' }, { opacity: 0, duration: 0.8 });
            showToast('🔥 Ингредиенты сгорели! Котёл очищен.', 'burn', 4000);
            await saveGame();
        }
        isBrewing = false;
    }

    async function handleHint(recipeId: string) {
        if (buyRecipeHint(recipeId)) {
            showToast('💡 Подсказка куплена!', 'success', 2000);
            await saveGame();
        } else {
            showToast('❌ Недостаточно кристаллов!', 'warning');
        }
    }

    function getIng(id: string) { return AVAILABLE_INGREDIENTS.find(i => i.id === id); }
    function getPotion(id: string) { return AVAILABLE_POTIONS.find(p => p.id === id); }

    const RC: Record<Rarity, string> = { common:'#b2bec3', rare:'#74b9ff', epic:'#a29bfe', legendary:'#f1c40f' };
    const RL: Record<Rarity, string> = { common:'Обычный', rare:'Редкий', epic:'Эпический', legendary:'Легендарный' };
</script>

{#if isOpen}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="overlay" class:embedded={isEmbedded} bind:this={overlayEl} on:click={close}>
<div class="screen-flash" bind:this={flashEl}></div>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="modal" class:embedded-modal={isEmbedded} bind:this={modalEl} on:click|stopPropagation>
    <div class="modal-header">
        <div class="header-icon">
            <svg viewBox="0 0 36 36" width="26" height="26">
                <rect x="2" y="24" width="32" height="10" rx="3" fill="#5D3A1A"/>
                <rect x="2" y="22" width="32" height="4" rx="2" fill="#7B4F2E"/>
                <ellipse cx="18" cy="18" rx="12" ry="14" fill="#2d1b4e"/>
                <ellipse cx="18" cy="18" rx="10" ry="12" fill="#3d2466"/>
                <path d="M10 14 Q18 10 26 14" stroke="#a29bfe" stroke-width="1.5" fill="none"/>
                <circle cx="10" cy="10" r="2.5" fill="#f1c40f" opacity="0.9"/>
                <circle cx="26" cy="10" r="2.5" fill="#f1c40f" opacity="0.9"/>
                <circle cx="18" cy="7" r="2" fill="#fd79a8" opacity="0.9"/>
            </svg>
        </div>
        <div class="header-text">
            <h2>Алхимический Стол</h2>
            <p class="header-sub">Комбинируйте ингредиенты</p>
        </div>
        <button class="close-btn" on:click={close}>✕</button>
    </div>

    <div class="balance-row">
        <div class="balance-chip crystal">
            <span>💎 {$crystals} кристаллов</span>
        </div>
    </div>

    <div class="content-grid">
        <!-- LEFT: CAULDRON + BREW -->
        <div class="brew-panel">
            {#if $failedBrewAttempts > 0}
            <div class="danger-bar">
                <span>🔥</span>
                <span>До сгорания: {3 - $failedBrewAttempts} {3 - $failedBrewAttempts === 1 ? 'попытка' : 'попытки'}</span>
                <div class="pips">
                    {#each [1,2,3] as p}<div class="pip" class:active={p <= $failedBrewAttempts}></div>{/each}
                </div>
            </div>
            {/if}

            <div class="cauldron-wrap" bind:this={cauldronEl}>
                <svg viewBox="0 0 120 100" width="148" height="123">
                    <defs>
                        <radialGradient id="liqG" cx="40%" cy="40%" r="60%">
                            <stop offset="0%" stop-color="#a29bfe"/><stop offset="100%" stop-color="#6c5ce7"/>
                        </radialGradient>
                        <filter id="cGl"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    </defs>
                    <ellipse cx="60" cy="96" rx="36" ry="5" fill="black" opacity="0.3"/>
                    <rect x="26" y="78" width="7" height="14" rx="3" fill="#2d3436"/>
                    <rect x="56" y="80" width="7" height="12" rx="3" fill="#2d3436"/>
                    <rect x="86" y="78" width="7" height="14" rx="3" fill="#2d3436"/>
                    <path d="M18 52 Q18 82 60 82 Q102 82 102 52Z" fill="#2d3436"/>
                    <path d="M22 52 Q22 76 60 76 Q98 76 98 52" fill="#636e72" opacity="0.25"/>
                    <ellipse cx="60" cy="52" rx="42" ry="12" fill="#636e72"/>
                    <ellipse cx="60" cy="50" rx="40" ry="10" fill="#2d3436"/>
                    <ellipse cx="60" cy="50" rx="34" ry="8" fill="url(#liqG)" filter="url(#cGl)" opacity="0.9"/>
                    <ellipse cx="55" cy="48" rx="16" ry="4" fill="white" opacity="0.1"/>
                    <circle class="bubble"    cx="46" cy="50" r="3"   fill="#a29bfe" opacity="0.8"/>
                    <circle class="bubble b2" cx="68" cy="48" r="2"   fill="#fd79a8" opacity="0.6"/>
                    <circle class="bubble b3" cx="58" cy="52" r="2.5" fill="#74b9ff" opacity="0.55"/>
                    <path d="M18 52 Q4 52 4 42 Q4 30 18 34" fill="none" stroke="#636e72" stroke-width="5" stroke-linecap="round"/>
                    <path d="M102 52 Q116 52 116 42 Q116 30 102 34" fill="none" stroke="#636e72" stroke-width="5" stroke-linecap="round"/>
                    {#if $failedBrewAttempts > 0}
                        <ellipse class="steam"    cx="44" cy="30" rx="8"  ry="6" fill={$failedBrewAttempts >= 2 ? '#e17055' : '#f1c40f'} opacity="0.45"/>
                        <ellipse class="steam s2" cx="60" cy="22" rx="10" ry="7" fill={$failedBrewAttempts >= 2 ? '#e17055' : '#f1c40f'} opacity="0.35"/>
                        <ellipse class="steam s3" cx="76" cy="28" rx="7"  ry="5" fill={$failedBrewAttempts >= 2 ? '#e17055' : '#f1c40f'} opacity="0.3"/>
                    {/if}
                </svg>
            </div>

            <div class="slots-row">
                {#each slots as slotId, i}
                    {@const ing = slotId ? getIng(slotId) : null}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div class="slot" class:filled={!!slotId}
                        style={ing ? `--sg:${RC[ing.rarity]}` : ''}
                        on:click={() => slotId && clearSlot(i)}
                        title={ing ? `${ing.name} — нажмите убрать` : `Слот ${i+1}`}
                    >
                        {#if ing}
                            <div class="slot-icon">{@html ing.icon}</div>
                            <div class="slot-x">✕</div>
                        {:else}
                            <span class="slot-num">{i+1}</span>
                        {/if}
                    </div>
                {/each}
            </div>

            <button class="brew-btn" class:danger={$failedBrewAttempts >= 2}
                disabled={!canBrew || isBrewing} on:click={handleBrew}>
                {#if isBrewing}⏳ Варится…
                {:else if $failedBrewAttempts >= 2}🔥 Сварить (последний шанс!)
                {:else}🧪 Сварить{/if}
            </button>

            <div class="picker-wrap">
                <p class="picker-label">Ваш инвентарь:</p>
                {#if ownedIngredients.length === 0}
                    <p class="no-ings">Откройте сундуки для получения ингредиентов</p>
                {:else}
                    <div class="picker-grid">
                        {#each ownedIngredients as ing}
                            {@const avail = ing.available}
                            {@const used  = usedCounts[ing.id] ?? 0}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <div class="picker-item"
                                class:depleted={avail <= 0} class:all-full={slotsAll && avail > 0}
                                style="--bc:{RC[ing.rarity]}"
                                on:click={() => addToSlot(ing.id)} title={ing.name}>
                                <div class="picker-icon">{@html ing.icon}</div>
                                <div class="picker-cnt">{ing.total}</div>
                                {#if used > 0}<div class="picker-used">-{used}</div>{/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <!-- RIGHT: RECIPE BOOK -->
        <div class="recipe-book">
            <div class="book-title">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#f1c40f" opacity="0.8">
                    <path d="M6,2H18C19.1,2 20,2.9 20,4V20C20,21.1 19.1,22 18,22H6C4.9,22 4,21.1 4,20V4C4,2.9 4.9,2 6,2ZM8,6V8H16V6H8ZM8,10V12H16V10H8ZM8,14V16H12V14H8Z"/>
                </svg>
                Книга Рецептов
            </div>

            {#each RECIPES as recipe}
                {@const hints  = $unlockedRecipes[recipe.id] ?? 0}
                {@const potion = getPotion(recipe.resultPotionId)}
                {#if potion}
                <div class="recipe-entry" style="--acc:{RC[recipe.rarity]}">
                    <div class="recipe-head">
                        <div class="r-pot-icon">{@html potion.icon}</div>
                        <div class="r-pot-info">
                            <div class="r-pot-name">{potion.name}</div>
                            <div class="r-rarity" style="color:{RC[recipe.rarity]}">{RL[recipe.rarity]}</div>
                        </div>
                        {#if hints === 3}<div class="r-ok">✓</div>{/if}
                    </div>

                    <div class="recipe-row">
                        {#each recipe.ingredients as ingId, idx}
                            {#if idx > 0}<span class="rp">+</span>{/if}
                            {#if hints > idx}
                                {@const ing = getIng(ingId)}
                                {#if ing}
                                <div class="r-ing revealed"
                                    style="border-color:{RC[ing.rarity]};box-shadow:0 0 8px {RC[ing.rarity]}44"
                                    title={ing.name}>
                                    <div class="r-ing-icon">{@html ing.icon}</div>
                                </div>
                                {/if}
                            {:else}
                                <div class="r-ing hidden">???</div>
                            {/if}
                        {/each}
                        <span class="rp">=</span>
                        <div class="r-result" title={potion.name}>{@html potion.icon}</div>
                    </div>

                    {#if hints < 3}
                        <button class="hint-btn" disabled={$crystals < HINT_COSTS[hints]}
                            on:click={() => handleHint(recipe.id)}>
                            <svg viewBox="0 0 14 14" width="11" height="11" style="flex-shrink:0">
                                <polygon points="7,1 9,5 13,5.5 10,8.5 11,12.5 7,10.5 3,12.5 4,8.5 1,5.5 5,5" fill="currentColor"/>
                            </svg>
                            {HINT_COSTS[hints]} — Раскрыть ингр. {hints+1}/3
                        </button>
                    {:else}
                        <div class="r-desc">{potion.description}</div>
                    {/if}
                </div>
                {/if}
            {/each}
        </div>
    </div>

    {#if toast}
        <div class="toast toast-{toast.type}">{toast.text}</div>
    {/if}
</div>
</div>
{/if}

<style>
.overlay { position:fixed;inset:0;background:rgba(0,0,0,0.88);display:flex;justify-content:center;align-items:center;z-index:220;backdrop-filter:blur(12px); }
.screen-flash { position:fixed;inset:0;pointer-events:none;opacity:0;z-index:225; }
.modal {
    background:linear-gradient(155deg,#0e0620,#1a0b32,#0e0620);
    border:1.5px solid rgba(162,155,254,0.25);border-radius:24px;
    box-shadow:0 0 60px rgba(108,92,231,0.3),0 24px 60px rgba(0,0,0,0.75),inset 0 1px 0 rgba(255,255,255,0.07);
    width:96%;max-width:820px;max-height:92vh;overflow-y:auto;color:white;
    position:relative;
}
.modal::-webkit-scrollbar{width:4px}.modal::-webkit-scrollbar-thumb{background:rgba(162,155,254,0.25);border-radius:10px}
.close-btn{position:absolute;right:16px;top:16px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);color:white;border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:0.85rem;transition:background 0.2s}
.close-btn:hover{background:rgba(255,255,255,0.15)}
.content-grid{display:grid;grid-template-columns:1fr 1fr;min-height:0}
@media(max-width:600px){.content-grid{grid-template-columns:1fr}}
.brew-panel{display:flex;flex-direction:column;align-items:center;gap:14px;padding:16px 14px 20px;border-right:1px solid rgba(255,255,255,0.06)}
.danger-bar{width:100%;display:flex;align-items:center;gap:8px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.35);border-radius:10px;padding:7px 12px;font-size:0.72rem;color:#ff7675}
.danger-bar span:first-child{font-size:1rem}.danger-bar span:nth-child(2){flex:1}
.pips{display:flex;gap:4px}
.pip{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.18);transition:background 0.3s}
.pip.active{background:#e17055;box-shadow:0 0 6px #e17055}
.cauldron-wrap{will-change:transform;filter:drop-shadow(0 6px 20px rgba(108,92,231,0.5))}
@keyframes bubbleFloat{0%,100%{transform:translateY(0) scale(1);opacity:.7}50%{transform:translateY(-5px) scale(1.1);opacity:1}}
@keyframes steamRise{0%{transform:translateY(0) scale(1);opacity:.45}100%{transform:translateY(-14px) scale(1.5);opacity:0}}
:global(.bubble){animation:bubbleFloat 1.8s ease-in-out infinite}
:global(.bubble.b2){animation-delay:.6s;animation-duration:2.1s}
:global(.bubble.b3){animation-delay:1.1s;animation-duration:1.6s}
:global(.steam){animation:steamRise 1.5s ease-out infinite}
:global(.steam.s2){animation-delay:.4s;animation-duration:1.9s}
:global(.steam.s3){animation-delay:.8s;animation-duration:1.7s}
.slots-row{display:flex;gap:10px;align-items:center}
.slot{width:62px;height:62px;border-radius:16px;border:2px dashed rgba(255,255,255,0.18);background:rgba(255,255,255,0.03);display:flex;align-items:center;justify-content:center;position:relative;transition:border-color .25s,box-shadow .25s,transform .15s;cursor:default}
.slot.filled{border:2px solid var(--sg,#a29bfe);box-shadow:0 0 14px var(--sg,rgba(162,155,254,0.5));cursor:pointer;background:rgba(162,155,254,0.06)}
.slot.filled:hover{transform:scale(1.06)}
.slot-num{font-size:1.1rem;color:rgba(255,255,255,0.2);font-weight:bold}
.slot-icon{width:44px;height:44px;display:flex;align-items:center;justify-content:center}
.slot-x{position:absolute;top:2px;right:4px;font-size:.52rem;color:rgba(255,255,255,0.25);opacity:0;transition:opacity .2s}
.slot.filled:hover .slot-x{opacity:1}
.brew-btn{padding:11px 28px;background:linear-gradient(135deg,#6c5ce7,#a29bfe);border:none;border-radius:14px;color:white;font-size:.98rem;font-weight:bold;cursor:pointer;box-shadow:0 6px 22px rgba(108,92,231,0.55);transition:transform .15s,box-shadow .2s,background .3s;width:100%;max-width:260px}
.brew-btn:hover:not(:disabled){transform:scale(1.03);box-shadow:0 8px 28px rgba(108,92,231,0.75)}
.brew-btn.danger{background:linear-gradient(135deg,#e17055,#d63031);box-shadow:0 6px 22px rgba(231,76,60,0.55);animation:dangerPulse 1s ease-in-out infinite}
@keyframes dangerPulse{0%,100%{box-shadow:0 6px 22px rgba(231,76,60,0.55)}50%{box-shadow:0 8px 30px rgba(231,76,60,0.85)}}
.brew-btn:active:not(:disabled){transform:scale(0.97)}
.brew-btn:disabled{opacity:.35;cursor:not-allowed;background:rgba(255,255,255,0.08);box-shadow:none}
.picker-wrap{width:100%}
.picker-label{margin:0 0 7px;font-size:.7rem;color:rgba(255,255,255,0.32);text-transform:uppercase;letter-spacing:.7px}
.no-ings{font-size:.75rem;color:rgba(255,255,255,0.3);text-align:center;padding:16px}
.picker-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(50px,1fr));gap:7px}
.picker-item{position:relative;background:rgba(255,255,255,0.04);border:1.5px solid var(--bc,rgba(255,255,255,0.1));border-radius:12px;padding:5px 4px 4px;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;transition:box-shadow .2s,transform .15s,opacity .2s}
.picker-item:hover:not(.depleted):not(.all-full){box-shadow:0 0 12px var(--bc,transparent);transform:scale(1.08)}
.picker-item.depleted{opacity:.25;cursor:not-allowed}
.picker-item.all-full{opacity:.4;cursor:not-allowed}
.picker-icon{width:32px;height:32px;display:flex;align-items:center;justify-content:center}
.picker-cnt{font-size:.6rem;font-weight:bold;color:rgba(255,255,255,0.55)}
.picker-used{position:absolute;top:1px;right:2px;background:rgba(231,76,60,0.85);color:white;font-size:.5rem;font-weight:bold;border-radius:5px;padding:0 3px;line-height:1.4}
.recipe-book{display:flex;flex-direction:column;gap:12px;padding:16px 14px 20px;overflow-y:auto;max-height:78vh}
.recipe-book::-webkit-scrollbar{width:3px}.recipe-book::-webkit-scrollbar-thumb{background:rgba(162,155,254,0.3);border-radius:10px}
.book-title{display:flex;align-items:center;gap:7px;font-size:.82rem;font-weight:bold;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px}
.recipe-entry{background:rgba(255,255,255,0.03);border:1.5px solid rgba(255,255,255,0.07);border-radius:16px;padding:13px;display:flex;flex-direction:column;gap:9px;transition:border-color .3s,box-shadow .3s}
.recipe-entry:hover{border-color:var(--acc,rgba(162,155,254,0.3));box-shadow:0 0 14px rgba(162,155,254,0.08)}
.recipe-head{display:flex;align-items:center;gap:10px}
.r-pot-icon{width:38px;height:46px;flex-shrink:0;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 7px rgba(255,255,255,0.25))}
.r-pot-info{flex:1}
.r-pot-name{font-size:.88rem;font-weight:bold;color:white}
.r-rarity{font-size:.62rem;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
.r-ok{background:rgba(0,184,148,0.18);border:1px solid #00b894;color:#00b894;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:bold}
.recipe-row{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.rp{font-size:.95rem;color:rgba(255,255,255,0.28);font-weight:bold}
.r-ing{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center}
.r-ing.revealed{background:rgba(255,255,255,0.04);border:1.5px solid;transition:transform .15s}
.r-ing.revealed:hover{transform:scale(1.1)}
.r-ing.hidden{background:rgba(255,255,255,0.03);border:1.5px dashed rgba(255,255,255,0.14);font-size:.6rem;color:rgba(255,255,255,0.22);font-weight:bold}
.r-ing-icon{width:26px;height:26px;display:flex;align-items:center;justify-content:center}
.r-result{width:34px;height:42px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 6px rgba(162,155,254,0.4))}
.hint-btn{padding:7px 11px;background:rgba(116,185,255,0.08);border:1px solid rgba(116,185,255,0.3);border-radius:10px;color:#74b9ff;font-size:.76rem;font-weight:bold;cursor:pointer;transition:background .2s,box-shadow .2s;display:flex;align-items:center;gap:5px;align-self:flex-start}
.hint-btn:hover:not(:disabled){background:rgba(116,185,255,0.18);box-shadow:0 0 12px rgba(116,185,255,0.3)}
.hint-btn:disabled{opacity:.28;cursor:not-allowed}
.r-desc{font-size:.7rem;color:rgba(255,255,255,0.38);font-style:italic;padding:4px 8px;background:rgba(0,184,148,0.06);border-left:2px solid #00b894;border-radius:0 6px 6px 0}
.toast{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);padding:11px 22px;border-radius:14px;font-size:.88rem;font-weight:bold;z-index:10;pointer-events:none;animation:toastIn .3s ease;max-width:88%;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,0.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.toast-success{background:linear-gradient(135deg,rgba(0,184,148,0.92),rgba(0,206,201,0.88));color:white}
.toast-warning{background:linear-gradient(135deg,rgba(253,203,0,0.92),rgba(225,112,85,0.88));color:#2d0a00}
.toast-burn{background:linear-gradient(135deg,rgba(231,76,60,0.95),rgba(192,57,43,0.92));color:white}
</style>

