<script lang="ts">
    import { onMount } from 'svelte';
    import gsap from 'gsap';
    import { gameStore, currentClickPower, crystals, formatNumber } from '../store';
    
    let cauldronGroup: SVGGElement;

    // Use a localized array for tracking click effects
    let clickEffects: { id: number, x: number, y: number, value: number, offsetX: number, isCrystal: boolean }[] = [];
    let effectIdCounter = 0;

    function handleCauldronClick(event: PointerEvent) {
        const clientX = event.clientX;
        const clientY = event.clientY;

        // Add gold
        const clickValue = $currentClickPower;
        gameStore.addGold(clickValue);
        gameStore.updateQuestProgress('clicks', 1);

        // Secret upgrade: Magnet (crystal drop chance)
        const magnetLevel = $gameStore.secretUpgrades.find(u => u.id === 'magnet')?.level || 0;
        const crystalChance = magnetLevel * 0.02; // 2% per level
        let isCrystal = false;
        
        if (magnetLevel > 0 && Math.random() < crystalChance) {
            crystals.update(c => c + 1);
            isCrystal = true;
        }
        
        // Bounce animation - juicy click micro-scaling
        gsap.to(cauldronGroup, { 
            scale: 0.92, 
            yoyo: true, 
            repeat: 1, 
            duration: 0.05, 
            ease: "power1.inOut",
            transformOrigin: "50% 100%"
        });

        // Add floating text
        const id = effectIdCounter++;
        const offsetX = (Math.random() - 0.5) * 40;
        
        clickEffects = [...clickEffects, {
            id,
            x: clientX,
            y: clientY,
            value: clickValue,
            offsetX,
            isCrystal
        }];
    }

    // A Svelte action to animate and remove the effect
    function animateClick(node: HTMLElement, id: number) {
        gsap.to(node, {
            y: -100,
            x: `+=${(Math.random() - 0.5) * 50}`, // slight random x drift
            opacity: 0,
            duration: 1.2,
            ease: "power2.out",
            onComplete: () => {
                // Remove from array (garbage collection)
                clickEffects = clickEffects.filter(effect => effect.id !== id);
            }
        });
        
        return {
            destroy() {
                // clean up if node is destroyed early
                gsap.killTweensOf(node);
            }
        };
    }
</script>

<div 
    class="cauldron-container" 
    on:pointerdown|preventDefault={handleCauldronClick} 
    role="button" 
    tabindex="0" 
    on:keydown={(e) => e.key === 'Enter' && handleCauldronClick(new PointerEvent('pointerdown'))}
>
    <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <!-- Shadow -->
        <ellipse cx="100" cy="180" rx="70" ry="15" fill="rgba(0,0,0,0.3)" />
        
        <g bind:this={cauldronGroup} style="will-change: transform">
            <!-- Cauldron body -->
            <path d="M 40 80 Q 20 170 100 170 Q 180 170 160 80 Z" fill="#2d3436" stroke="#1f2324" stroke-width="4"/>
            <!-- Cauldron rim -->
            <ellipse cx="100" cy="80" rx="65" ry="15" fill="#636e72" stroke="#2d3436" stroke-width="4"/>
            <!-- Inner liquid -->
            <ellipse cx="100" cy="80" rx="55" ry="10" fill="#a29bfe">
                <animate attributeName="fill" values="#a29bfe;#6c5ce7;#a29bfe" dur="3s" repeatCount="indefinite" />
            </ellipse>
            <!-- Bubbles -->
            <circle cx="80" cy="80" r="5" fill="#dfe6e9" opacity="0.6">
                <animate attributeName="cy" values="80; 60; 80" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6; 0; 0.6" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="120" cy="80" r="8" fill="#dfe6e9" opacity="0.6">
                <animate attributeName="cy" values="80; 50; 80" dur="2.5s" repeatCount="indefinite" begin="0.5s"/>
                <animate attributeName="opacity" values="0.6; 0; 0.6" dur="2.5s" repeatCount="indefinite" begin="0.5s"/>
            </circle>
            <circle cx="100" cy="80" r="4" fill="#dfe6e9" opacity="0.6">
                <animate attributeName="cy" values="80; 65; 80" dur="1.8s" repeatCount="indefinite" begin="1s"/>
                <animate attributeName="opacity" values="0.6; 0; 0.6" dur="1.8s" repeatCount="indefinite" begin="1s"/>
            </circle>
        </g>
    </svg>
</div>

<!-- Render floating text using Svelte {#each} loop -->
{#each clickEffects as effect (effect.id)}
    <div 
        class="floating-text"
        use:animateClick={effect.id}
        style="left: {effect.x - 10 + effect.offsetX}px; top: {effect.y - 20}px;"
    >
        {#if effect.isCrystal}
            <span style="font-size: 1.5rem; filter: drop-shadow(0 0 5px #0984e3);">💎+1</span>
        {:else}
            +{formatNumber(effect.value)}
        {/if}
    </div>
{/each}

<style>
    .cauldron-container {
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        width: 100%;
        height: 100%;
        user-select: none;
        -webkit-user-select: none;
        outline: none;
        -webkit-tap-highlight-color: transparent;
    }

    .floating-text {
        position: absolute;
        color: #fff;
        font-weight: bold;
        font-size: 1.8rem;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        text-shadow: 
            -1px -1px 0 #d4af37,
             1px -1px 0 #d4af37,
            -1px  1px 0 #d4af37,
             1px  1px 0 #d4af37,
             0px  2px 5px rgba(0,0,0,0.8);
        pointer-events: none;
        z-index: 1000;
        will-change: transform, opacity;
    }
</style>
