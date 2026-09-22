<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import gsap from 'gsap';
    import { gameStore, currentIdleIncome, AVAILABLE_PETS } from '../store';
    import { playCauldronBubble } from '../audio';
    import ResourceIcon from './ResourceIcon.svelte';
    import { currentLang, getPetName } from '../i18n';
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
        // Passive Income Tick listener (checks every 2.2s when tab is active)
        idleLoop = setInterval(() => {
            if ($currentIdleIncome > 0 && typeof document !== 'undefined' && !document.hidden) {
                dropCoin();
            }
        }, 2200);
    });

    onDestroy(() => {
        if (idleLoop) clearInterval(idleLoop);
        if (petNode) gsap.killTweensOf(petNode);
    });

    function dropCoin() {
        if (!petNode) return;
        // Cute jump — overwrite:'auto' prevents conflict with the infinite hover tween
        gsap.to(petNode, {
            y: -18,
            overwrite: 'auto',
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
            <defs>
                <!-- Hardware Shaded Pet Aura (Zero filter overhead, pure GPU fragment shader) -->
                <radialGradient id="petAuraGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color={activeAura.isLegendary ? "#f1c40f" : "#a29bfe"} stop-opacity="0.52"/>
                    <stop offset="60%" stop-color={activeAura.isLegendary ? "#f39c12" : "#8e44ad"} stop-opacity="0.2"/>
                    <stop offset="100%" stop-color={activeAura.isLegendary ? "#e67e22" : "#2c3e50"} stop-opacity="0"/>
                </radialGradient>
            </defs>

            <g bind:this={petNode} class="pet-group pet-hover-anim">
                <!-- Aura glow using shader gradient -->
                <circle cx="70" cy="70" r="42" fill="url(#petAuraGlow)"/>
                
                <g class="companion-body pet-breathe-anim">
                    <!-- Dynamic rendering of the active pet SVG icon scaled to 100x100 centered -->
                    <g transform="translate(20, 20) scale(2.5)">
                        {@html activePet.icon}
                    </g>
                </g>
            </g>
        </svg>
    </div>
</div>

<style>
    /* CSS Hardware Composited Hover & Breathe (Zero JS main-thread load) */
    .pet-hover-anim {
        animation: petHoverKeyframe 2.4s ease-in-out infinite alternate;
        will-change: transform;
    }

    @keyframes petHoverKeyframe {
        0%   { transform: translate3d(0, 0, 0); }
        100% { transform: translate3d(0, -11px, 0); }
    }

    .pet-breathe-anim {
        animation: petBreatheKeyframe 1.8s ease-in-out infinite alternate;
        transform-origin: 70px 105px;
        will-change: transform;
    }

    @keyframes petBreatheKeyframe {
        0%   { transform: scale3d(1, 1, 1); }
        100% { transform: scale3d(0.97, 1.05, 1); }
    }
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
            transform: translate(-170px, -210px);
        }
    }

    @media (max-width: 600px) {
        .pet-container {
            transform: translate(-150px, -235px);
            scale: 0.85;
        }
    }

    @media (max-width: 380px) {
        .pet-container {
            transform: translate(-120px, -225px);
            scale: 0.75;
        }
    }
</style>
