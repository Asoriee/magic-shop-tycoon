<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import gsap from 'gsap';
    import { gameStore, currentIdleIncome, AVAILABLE_PETS } from '../store';
    import { playCauldronBubble } from '../audio';
    import ResourceIcon from './ResourceIcon.svelte';
    import { currentLang, getPetName, t } from '../i18n';
    import { getPetAuraDetails } from '../petBonuses';

    let petNode: SVGGElement;
    let bodyGroup: SVGGElement;

    let effects: { id: number, type: 'coin' | 'heart', x: number, y: number }[] = [];
    let effectIdCounter = 0;
    
    let idleLoop: any;

    $: activePet = AVAILABLE_PETS.find(p => p.id === $gameStore.activeCompanionId) 
        || AVAILABLE_PETS.find(p => p.id === ($gameStore.unlockedPets?.[0] || 'pet_rat')) 
        || AVAILABLE_PETS[0];

    $: petLevel = ($gameStore.petLevels && $gameStore.petLevels[activePet.id]) || 1;
    $: activeAura = getPetAuraDetails(activePet.id, petLevel, $currentLang);

    onMount(() => {
        // 1. Hovering animation (entire pet)
        if (petNode) {
            gsap.to(petNode, {
                y: -12,
                duration: 2.2,
                yoyo: true,
                repeat: -1,
                ease: "sine.inOut"
            });
        }

        // 2. Breathing animation (body scales slightly)
        if (bodyGroup) {
            gsap.to(bodyGroup, {
                scaleY: 1.06,
                scaleX: 0.97,
                duration: 1.6,
                yoyo: true,
                repeat: -1,
                transformOrigin: "center bottom",
                ease: "sine.inOut"
            });
        }

        // Passive Income Tick listener (checks every 1.5 seconds)
        idleLoop = setInterval(() => {
            if ($currentIdleIncome > 0) {
                dropCoin();
            }
        }, 1500);
    });

    onDestroy(() => {
        if (idleLoop) clearInterval(idleLoop);
        const targets = [petNode, bodyGroup].filter(Boolean);
        if (targets.length) gsap.killTweensOf(targets);
    });

    function dropCoin() {
        if (!petNode) return;
        // Cute jump
        gsap.to(petNode, {
            y: -18,
            duration: 0.15,
            yoyo: true,
            repeat: 1,
            ease: "power1.out"
        });

        // Drop coin effect
        addEffect('coin');
    }

    function handlePetClick() {
        if (!petNode) return;
        playCauldronBubble();
        // Easter egg flip
        gsap.to(petNode, {
            rotation: "+=360",
            duration: 0.55,
            ease: "back.out(1.5)",
            transformOrigin: "center center"
        });

        addEffect('heart');
    }

    function addEffect(type: 'coin' | 'heart') {
        if (effects.length >= 6) return; // prevent memory leak from spam
        const id = effectIdCounter++;
        effects = [...effects, { id, type, x: 70, y: 70 }];
    }

    function animateEffect(node: HTMLElement, { type, id }: { type: 'coin' | 'heart', id: number }) {
        if (!node) return;
        if (type === 'coin') {
            const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 769;
            gsap.to(node, {
                y: isDesktop ? 150 : 120,
                x: isDesktop ? 150 : 120,
                opacity: 0,
                duration: 0.85,
                ease: "power2.in",
                onComplete: () => {
                    effects = effects.filter(e => e.id !== id);
                }
            });
        } else {
            gsap.to(node, {
                y: -80,
                opacity: 0,
                scale: 1.5,
                duration: 1,
                ease: "power1.out",
                onComplete: () => {
                    effects = effects.filter(e => e.id !== id);
                }
            });
        }

        return {
            destroy() {
                if (node) gsap.killTweensOf(node);
            }
        };
    }
</script>

<div class="pet-container">
    <div class="effects-container">
        {#each effects as effect (effect.id)}
            <div 
                class="effect-item {effect.type}" 
                use:animateEffect={{ type: effect.type, id: effect.id }}
                style="left: {effect.x}px; top: {effect.y}px;"
            >
                {#if effect.type === 'coin'}
                    <ResourceIcon type="gold" size={16} />
                {:else}
                    <svg width="24" height="24" viewBox="0 0 24 24">
                        <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.28 2,8.5C2,5.42 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.09C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.42 22,8.5C22,12.28 18.6,15.36 13.45,20.04L12,21.35Z" fill="#e74c3c"/>
                    </svg>
                {/if}
            </div>
        {/each}
    </div>

    <!-- The Companion SVG -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div 
        class="pet-clickable" 
        on:click={handlePetClick} 
        role="button" 
        tabindex="0"
        title={activePet ? `${getPetName(activePet.id, $currentLang)}: ${activeAura.badge}` : ''}
    >
        <svg width="140" height="140" viewBox="0 0 140 140">
            <g bind:this={petNode} class="pet-group">
                <!-- Aura glow -->
                <circle cx="70" cy="70" r="38" fill={activeAura.isLegendary ? "rgba(241, 196, 15, 0.45)" : "rgba(155, 89, 182, 0.35)"} filter="blur(10px)"/>
                
                <g bind:this={bodyGroup} class="companion-body">
                    <!-- Dynamic rendering of the active pet SVG icon scaled to 100x100 centered -->
                    <g transform="translate(20, 20) scale(2.5)">
                        {@html activePet.icon}
                    </g>
                </g>
            </g>
        </svg>

        <!-- Companion Floating Aura Pill with Tooltip -->
        <div class="companion-aura-pill" class:legendary={activeAura.isLegendary}>
            <span class="pill-sparkle">✦</span>
            <span class="pill-badge">{activeAura.badge}</span>
            
            <div class="pill-tooltip">
                <div class="tooltip-title">{activeAura.title} ({$t('common.levelShort')} {petLevel})</div>
                <div class="tooltip-desc">{activeAura.description}</div>
            </div>
        </div>
    </div>
</div>

<style>
    .pet-container {
        position: absolute;
        top: 50%;
        left: 50%;
        /* Positioned up and to the left of the Cauldron */
        transform: translate(-220px, -170px);
        width: 140px;
        height: 140px;
        z-index: 50; 
        pointer-events: none; /* Let clicks pass through empty areas */
        transition: transform 0.25s ease;
    }

    .pet-clickable {
        position: relative;
        pointer-events: auto; /* Enable clicks on the pet itself */
        cursor: pointer;
        width: 100%;
        height: 100%;
        outline: none;
        -webkit-tap-highlight-color: transparent;
        transition: filter 0.2s;
    }

    .pet-clickable:hover {
        filter: brightness(1.2);
    }

    .pet-group {
        will-change: transform;
    }

    .effects-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 100; /* Ensure coins and hearts are above the pet */
    }

    .effect-item {
        position: absolute;
        pointer-events: none;
        will-change: transform, opacity;
        transform: translate(-50%, -50%); /* Center effect on its coords */
    }
    
    @media (min-width: 1200px) and (min-height: 750px) {
        .pet-container {
            transform: translate(-245px, -190px);
        }
    }

    @media (max-width: 768px) {
        .pet-container {
            transform: translate(-160px, -140px);
        }
    }

    @media (max-width: 600px) {
        .pet-container {
            transform: translate(-100px, -150px);
            scale: 0.85;
        }
    }

    /* Companion Floating Aura Pill */
    .companion-aura-pill {
        position: absolute;
        bottom: 8px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(18, 10, 36, 0.88);
        border: 1px solid rgba(162, 155, 254, 0.35);
        backdrop-filter: blur(6px);
        padding: 2px 9px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.5);
        transition: transform 0.2s, background 0.2s, border-color 0.2s;
        cursor: pointer;
        user-select: none;
    }
    .companion-aura-pill.legendary {
        background: linear-gradient(135deg, rgba(35, 18, 55, 0.95), rgba(58, 28, 90, 0.9));
        border-color: rgba(241, 196, 15, 0.6);
        box-shadow: 0 0 12px rgba(241, 196, 15, 0.28);
    }
    .companion-aura-pill:hover {
        transform: translateX(-50%) scale(1.05);
    }
    .pill-sparkle {
        font-size: 0.65rem;
        color: #f1c40f;
    }
    .pill-badge {
        font-size: 0.68rem;
        font-weight: 800;
        color: #ffffff;
        letter-spacing: 0.3px;
    }
    .companion-aura-pill.legendary .pill-badge {
        color: #ffeaa7;
    }

    /* Tooltip on hover/focus */
    .pill-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(-6px);
        background: rgba(15, 8, 30, 0.95);
        border: 1px solid rgba(241, 196, 15, 0.4);
        box-shadow: 0 4px 18px rgba(0,0,0,0.8);
        border-radius: 8px;
        padding: 6px 10px;
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s, transform 0.2s;
        z-index: 120;
        width: max-content;
        max-width: 200px;
        text-align: center;
    }
    .pet-clickable:hover .pill-tooltip,
    .companion-aura-pill:hover .pill-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(-10px);
    }
    .tooltip-title {
        font-size: 0.75rem;
        font-weight: 800;
        color: #ffd700;
        margin-bottom: 2px;
    }
    .tooltip-desc {
        font-size: 0.68rem;
        color: #dfe6e9;
        line-height: 1.25;
    }
</style>
