<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import gsap from 'gsap';
    import { currentIdleIncome } from '../store';

    let petNode: SVGGElement;
    let bodyGroup: SVGGElement;
    let wingsGroup: SVGGElement;
    let eyesGroup: SVGGElement;

    let effects: { id: number, type: 'coin' | 'heart', x: number, y: number }[] = [];
    let effectIdCounter = 0;
    
    let idleLoop: number;

    onMount(() => {
        // 1. Hovering animation (entire pet)
        gsap.to(petNode, {
            y: -15,
            duration: 2,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
        });

        // 2. Breathing animation (body scales slightly)
        gsap.to(bodyGroup, {
            scaleY: 1.05,
            duration: 1.5,
            yoyo: true,
            repeat: -1,
            transformOrigin: "center bottom",
            ease: "sine.inOut"
        });

        // 3. Blinking animation (random interval)
        const blink = () => {
            gsap.to(eyesGroup, {
                scaleY: 0.1,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                transformOrigin: "center center",
                onComplete: () => {
                    gsap.delayedCall(Math.random() * 4 + 3, blink); // next blink in 3-7s
                }
            });
        };
        gsap.delayedCall(2, blink);

        // Passive Income Tick listener (checks every second)
        idleLoop = setInterval(() => {
            if ($currentIdleIncome > 0) {
                flapWingsAndDropCoin();
            }
        }, 1000);
    });

    onDestroy(() => {
        if (idleLoop) clearInterval(idleLoop);
        gsap.killTweensOf([petNode, bodyGroup, wingsGroup, eyesGroup]);
    });

    function flapWingsAndDropCoin() {
        // Quick wing flap to visualize income
        gsap.to(wingsGroup, {
            rotation: 15,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            transformOrigin: "center center"
        });

        // Drop coin effect
        addEffect('coin');
    }

    function handlePetClick() {
        // Easter egg flip
        gsap.to(petNode, {
            rotation: "+=360",
            duration: 0.5,
            ease: "back.out(1.5)",
            transformOrigin: "center center"
        });

        addEffect('heart');
    }

    function addEffect(type: 'coin' | 'heart') {
        if (effects.length >= 5) return; // prevent memory leak from spam
        const id = effectIdCounter++;
        // Start effect from the center of the pet container
        effects = [...effects, { id, type, x: 70, y: 70 }];
    }

    function animateEffect(node: HTMLElement, { type, id }: { type: 'coin' | 'heart', id: number }) {
        if (type === 'coin') {
            // Coin drops down and right into the cauldron
            gsap.to(node, {
                y: 120, // Move down towards cauldron
                x: 120, // Move right towards cauldron
                opacity: 0,
                duration: 0.8,
                ease: "power2.in",
                onComplete: () => {
                    effects = effects.filter(e => e.id !== id);
                }
            });
        } else {
            // Heart floats up and fades
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
                gsap.killTweensOf(node);
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
                    <svg width="16" height="16" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="8" fill="#f1c40f" stroke="#d35400" stroke-width="2"/>
                        <circle cx="10" cy="10" r="5" fill="none" stroke="#f39c12" stroke-width="1"/>
                    </svg>
                {:else}
                    <svg width="24" height="24" viewBox="0 0 24 24">
                        <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.28 2,8.5C2,5.42 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.09C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.42 22,8.5C22,12.28 18.6,15.36 13.45,20.04L12,21.35Z" fill="#e74c3c"/>
                    </svg>
                {/if}
            </div>
        {/each}
    </div>

    <!-- The Pet SVG (Magic Bat) -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="pet-clickable" on:click={handlePetClick} role="button" tabindex="0">
        <svg width="140" height="140" viewBox="0 0 140 140">
            <g bind:this={petNode} class="pet-group">
                <!-- Shadow/Glow behind the bat -->
                <circle cx="70" cy="70" r="35" fill="rgba(155, 89, 182, 0.4)" filter="blur(12px)"/>
                
                <!-- Wings Group -->
                <g bind:this={wingsGroup}>
                    <!-- Left Wing -->
                    <path d="M 60 70 Q 25 35 5 55 Q 20 75 30 85 Q 45 80 60 75 Z" fill="#2c3e50" stroke="#34495e" stroke-width="2"/>
                    <!-- Right Wing -->
                    <path d="M 80 70 Q 115 35 135 55 Q 120 75 110 85 Q 95 80 80 75 Z" fill="#2c3e50" stroke="#34495e" stroke-width="2"/>
                </g>
                
                <!-- Body Group -->
                <g bind:this={bodyGroup}>
                    <!-- Body -->
                    <ellipse cx="70" cy="75" rx="18" ry="22" fill="#34495e"/>
                    <ellipse cx="70" cy="80" rx="12" ry="14" fill="#2c3e50"/>
                    <!-- Ears -->
                    <path d="M 57 60 L 50 35 L 67 50 Z" fill="#2c3e50"/>
                    <path d="M 83 60 L 90 35 L 73 50 Z" fill="#2c3e50"/>
                    <path d="M 54 45 L 61 52" stroke="#e74c3c" stroke-width="1.5" opacity="0.5"/>
                    <path d="M 86 45 L 79 52" stroke="#e74c3c" stroke-width="1.5" opacity="0.5"/>
                    <!-- Cute fangs -->
                    <path d="M 66 85 L 68 90 L 70 85 Z" fill="#fff"/>
                    <path d="M 74 85 L 72 90 L 70 85 Z" fill="#fff"/>
                </g>
                
                <!-- Eyes Group -->
                <g bind:this={eyesGroup}>
                    <ellipse cx="61" cy="68" rx="5" ry="6" fill="#f1c40f"/>
                    <ellipse cx="79" cy="68" rx="5" ry="6" fill="#f1c40f"/>
                    <!-- Pupils -->
                    <circle cx="61" cy="68" r="2.5" fill="#2c3e50"/>
                    <circle cx="79" cy="68" r="2.5" fill="#2c3e50"/>
                    <!-- Eye shine -->
                    <circle cx="59" cy="66" r="1" fill="#fff"/>
                    <circle cx="77" cy="66" r="1" fill="#fff"/>
                </g>
            </g>
        </svg>
    </div>
</div>

<style>
    .pet-container {
        position: absolute;
        top: 50%;
        left: 50%;
        /* Positioned up and to the left of the Cauldron */
        transform: translate(-170px, -140px);
        width: 140px;
        height: 140px;
        z-index: 50; 
        pointer-events: none; /* Let clicks pass through empty areas */
    }

    .pet-clickable {
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
    
    @media (max-width: 600px) {
        .pet-container {
            /* Adjust positioning for smaller screens so it doesn't get cut off */
            transform: translate(-100px, -160px);
            /* Maybe scale it down slightly */
            scale: 0.8;
        }
    }
</style>
