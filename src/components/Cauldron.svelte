<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import gsap from 'gsap';
    import { gameStore, currentClickPower, critChance, critMultiplier, heatBonusLevel, crystals, formatNumber } from '../store';
    import { playCauldronBubble, playOverheatSizzle } from '../audio';
    import ResourceIcon from './ResourceIcon.svelte';
    import { t } from '../i18n';
    import { ClickRateLimiter } from '../security';
    
    let cauldronGroup: SVGGElement;
    let cauldronContainer: HTMLDivElement;

    const clickLimiter = new ClickRateLimiter(16);

    let heat = 0; // 0 to 100
    let decayInterval: any;
    let prevOverheated = false;

    onMount(() => {
        decayInterval = setInterval(() => {
            if (heat > 0) {
                // Decay speed decreases with higher heat upgrade level
                const decayAmount = Math.max(0.6, 2.2 - ($heatBonusLevel * 0.25));
                heat = Math.max(0, heat - decayAmount * 2); // *2 to compensate 200ms interval
            }
        }, 200); // 200ms instead of 100ms — halves DOM updates (5/sec vs 10/sec)
    });

    onDestroy(() => {
        if (decayInterval) clearInterval(decayInterval);
    });

    $: comboMultiplier = 1 + (heat / 100) * (1.0 + ($heatBonusLevel * 0.25));
    $: isOverheated = heat >= 85;

    $: {
        if (isOverheated && !prevOverheated) {
            playOverheatSizzle();
        }
        prevOverheated = isOverheated;
    }

    // Use a localized array for tracking click effects (capped to 8 elements for performance)
    let clickEffects: { id: number, x: number, y: number, value: number, offsetX: number, isCrystal: boolean, isCrit: boolean, isCombo: boolean }[] = [];
    let effectIdCounter = 0;

    function handleCauldronClick(event: PointerEvent | KeyboardEvent) {
        // Anti-Cheat: Reject simulated / scripted events
        if (event && !event.isTrusted) return;

        // Anti-Cheat: Hardware / Autoclicker rate limiter (max 16 CPS)
        if (!clickLimiter.canClick(Date.now())) return;

        let clientX = 0;
        let clientY = 0;
        if ('clientX' in event && event.clientX > 0) {
            clientX = event.clientX;
            clientY = event.clientY;
        } else if (cauldronContainer) {
            const rect = cauldronContainer.getBoundingClientRect();
            clientX = rect.left + rect.width / 2;
            clientY = rect.top + rect.height / 2;
        }

        // Increase heat on click
        const heatGain = 10 + ($heatBonusLevel * 3);
        heat = Math.min(100, heat + heatGain);

        // Check for crit
        const isCrit = Math.random() < $critChance;
        const critMult = isCrit ? $critMultiplier : 1;
        const clickValue = Math.max(1, Math.floor($currentClickPower * critMult * comboMultiplier));

        gameStore.addGold(clickValue);
        gameStore.updateQuestProgress('clicks', 1);
        playCauldronBubble();

        const isCrystal = false;
        
        // Tactile Squash & Stretch Juice (Elastic spring recovery)
        if (cauldronGroup) {
            gsap.killTweensOf(cauldronGroup);
            const squashX = isCrit ? 1.16 : isOverheated ? 1.11 : 1.07;
            const squashY = isCrit ? 0.82 : isOverheated ? 0.86 : 0.91;
            gsap.fromTo(cauldronGroup, 
                { scaleX: squashX, scaleY: squashY }, 
                { 
                    scaleX: 1, 
                    scaleY: 1, 
                    duration: isCrit ? 0.38 : 0.28, 
                    ease: "elastic.out(1.2, 0.4)",
                    transformOrigin: "50% 100%"
                }
            );
        }

        // Add floating text with pooling (keep max 8 active animations)
        const id = effectIdCounter++;
        const offsetX = (Math.random() - 0.5) * 40;
        const trimmed = clickEffects.length >= 8 ? clickEffects.slice(-7) : clickEffects;
        
        clickEffects = [...trimmed, {
            id,
            x: clientX,
            y: clientY,
            value: clickValue,
            offsetX,
            isCrystal,
            isCrit,
            isCombo: heat > 30
        }];
    }

    // A Svelte action to animate and remove the effect with vibrant physics arc
    function animateClick(node: HTMLElement, id: number) {
        if (node) {
            const spreadX = (Math.random() - 0.5) * 70;
            const rotateAngle = (Math.random() - 0.5) * 18;
            const tl = gsap.timeline({
                onComplete: () => {
                    clickEffects = clickEffects.filter(effect => effect.id !== id);
                }
            });

            tl.fromTo(node,
                { scale: 0.6, opacity: 0, rotation: 0 },
                { scale: 1.18, opacity: 1, rotation: rotateAngle, duration: 0.14, ease: "back.out(2.2)" }
            )
            .to(node, {
                y: -85,
                x: spreadX,
                scale: 1,
                duration: 0.65,
                ease: "power1.out"
            }, "-=0.04")
            .to(node, {
                y: -120,
                opacity: 0,
                scale: 0.82,
                duration: 0.32,
                ease: "power2.in"
            });
        }
        
        return {
            destroy() {
                if (node) gsap.killTweensOf(node);
            }
        };
    }
</script>

<div class="cauldron-wrapper">
    <!-- SVG Heat Combo Gauge -->
    <div class="heat-gauge" class:visible={heat > 3}>
        <div class="heat-info">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                <path d="M12 2 C10 7 6 10 6 15 C6 18.5 8.7 21.5 12 21.5 C15.3 21.5 18 18.5 18 15 C18 11 15 8 12 2 Z" fill={heat > 75 ? "#ff7675" : "#f1c40f"}/>
                <path d="M12 8 C10.5 11 8.5 13 8.5 16 C8.5 18 10 19.5 12 19.5 C14 19.5 15.5 18 15.5 16 C15.5 13.5 13.5 12 12 8 Z" fill="#ffffff"/>
            </svg>
            <span class="heat-text" class:hot={heat >= 85}>
                {#if heat >= 85}
                    {$t('cauldron.overheat')} x{comboMultiplier.toFixed(1)}!
                {:else if heat >= 30}
                    {$t('cauldron.combo')} x{comboMultiplier.toFixed(1)}
                {:else}
                    {$t('cauldron.tapToStir')} x{comboMultiplier.toFixed(1)}
                {/if}
            </span>
        </div>
        <div class="heat-track">
            <div 
                class="heat-fill" 
                style="width: {heat}%; background: {heat > 85 ? 'linear-gradient(90deg, #f39c12, #ff7675, #d63031)' : heat > 40 ? 'linear-gradient(90deg, #f1c40f, #e67e22)' : 'linear-gradient(90deg, #3498db, #a29bfe)'}"
            ></div>
        </div>
    </div>

    <div 
        class="cauldron-container" 
        bind:this={cauldronContainer}
        on:pointerdown|preventDefault={handleCauldronClick} 
        role="button" 
        tabindex="0" 
        on:keydown={(e) => {
            if (e.isTrusted && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleCauldronClick(e);
            }
        }}
    >
        <svg class="cauldron-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <!-- Alchemical Pedestal / Transmutation Circle (Pure SVG) -->
            <g class="alchemical-pedestal" opacity="{0.45 + (heat / 160)}">
                <!-- Outer Ring with runic ticks -->
                <ellipse cx="100" cy="180" rx="90" ry="17" fill="none" 
                    stroke={heat > 85 ? "#ff7675" : heat > 35 ? "#f1c40f" : "#a29bfe"} 
                    stroke-width="1.6" stroke-dasharray="8 4" opacity="0.85"/>
                
                <!-- Inner Ring -->
                <ellipse cx="100" cy="180" rx="76" ry="14.5" fill="none" 
                    stroke={heat > 85 ? "#f39c12" : "#74b9ff"} 
                    stroke-width="1" opacity="0.6"/>

                <!-- Transmutation Geometry / Rune Axes -->
                <line x1="14" y1="180" x2="186" y2="180" 
                    stroke={heat > 85 ? "#ff7675" : "#f1c40f"} stroke-width="0.8" opacity="0.4"/>
                <line x1="100" y1="163" x2="100" y2="197" 
                    stroke={heat > 85 ? "#ff7675" : "#f1c40f"} stroke-width="0.8" opacity="0.4"/>
                
                <!-- Rune nodes on the rim -->
                <circle cx="24" cy="180" r="2.2" fill={heat > 85 ? "#ff7675" : "#f1c40f"} opacity="0.8"/>
                <circle cx="176" cy="180" r="2.2" fill={heat > 85 ? "#ff7675" : "#f1c40f"} opacity="0.8"/>
                <circle cx="100" cy="165.5" r="1.8" fill={heat > 85 ? "#ff7675" : "#f1c40f"} opacity="0.8"/>
                <circle cx="100" cy="194.5" r="1.8" fill={heat > 85 ? "#ff7675" : "#f1c40f"} opacity="0.8"/>
            </g>

            <!-- Shadow -->
            <ellipse cx="100" cy="180" rx="70" ry="15" fill="rgba(0,0,0,0.35)" />

            <!-- Fiery heat glow under cauldron when heated -->
            {#if heat > 5}
                <ellipse 
                    cx="100" 
                    cy="174" 
                    rx="{35 + (heat * 0.35)}" 
                    ry="{9 + (heat * 0.1)}" 
                    fill={heat > 85 ? "#ff7675" : "#f39c12"} 
                    opacity="{heat / 120}" 
                />
            {/if}
            
            <g bind:this={cauldronGroup} style="will-change: transform">
                <!-- Cauldron body -->
                <path d="M 40 80 Q 20 170 100 170 Q 180 170 160 80 Z" fill="#2d3436" stroke="#1f2324" stroke-width="4"/>
                
                <!-- Rune on cauldron body that glows brighter with heat -->
                <path 
                    d="M 94 110 L 100 98 L 106 110 L 100 122 Z M 100 98 L 100 122 M 92 110 L 108 110" 
                    stroke={heat > 50 ? "#f1c40f" : "#636e72"} 
                    stroke-width="1.8" 
                    fill="none"
                    opacity="{0.3 + (heat / 140)}"
                />

                <!-- Cauldron rim -->
                <ellipse cx="100" cy="80" rx="65" ry="15" fill="#636e72" stroke="#2d3436" stroke-width="4"/>
                
                <!-- Inner liquid (shifts to molten gold/red as heat increases) -->
                <ellipse 
                    cx="100" 
                    cy="80" 
                    rx="55" 
                    ry="10" 
                    class="potion-liquid"
                    class:overheat-liquid={heat > 80}
                    class:hot-liquid={heat > 40 && heat <= 80}
                    class:normal-liquid={heat <= 40}
                />

                <!-- Bubbles inside cauldron potion (100% GPU-composited CSS keyframes, zero SMIL layout overhead) -->
                <g class="cauldron-bubbles">
                    <g class="cauldron-bubble b1" style="transform-origin: 78px 80px;">
                        <circle cx="78" cy="80" r="6" fill={heat > 60 ? "#ffeaa7" : "#fd79a8"} stroke="#ffffff" stroke-width="1.5" opacity="0.88" />
                    </g>
                    <g class="cauldron-bubble b2" style="transform-origin: 118px 80px;">
                        <circle cx="118" cy="80" r="8" fill={heat > 60 ? "#ff7675" : "#74b9ff"} stroke="#ffffff" stroke-width="1.5" opacity="0.88" />
                    </g>
                    <g class="cauldron-bubble b3" style="transform-origin: 98px 80px;">
                        <circle cx="98" cy="80" r="5" fill="#ffeaa7" stroke="#ffffff" stroke-width="1.5" opacity="0.88" />
                    </g>
                    <g class="cauldron-bubble b4" style="transform-origin: 86px 80px;">
                        <circle cx="86" cy="80" r="7" fill={heat > 60 ? "#f39c12" : "#a29bfe"} stroke="#ffffff" stroke-width="1.5" opacity="0.88" />
                    </g>
                    <g class="cauldron-bubble b5" style="transform-origin: 110px 80px;">
                        <circle cx="110" cy="80" r="5" fill={heat > 60 ? "#fdcb6e" : "#55efc4"} stroke="#ffffff" stroke-width="1.5" opacity="0.88" />
                    </g>
                </g>
            </g>
        </svg>
    </div>
</div>

<!-- Render floating text using Svelte {#each} loop -->
{#each clickEffects as effect (effect.id)}
    <div 
        class="floating-text"
        use:animateClick={effect.id}
        style="left: {effect.x - 10 + effect.offsetX}px; top: {effect.y - 20}px;"
    >
        {#if effect.isCrystal}
            <span class="crystal-float">
                <ResourceIcon type="crystals" size={22} />
                +1
            </span>
        {:else if effect.isCrit}
            <span class="crit-text">{$t('common.bonus')}! +{formatNumber(effect.value)}</span>
        {:else if effect.isCombo}
            <span class="combo-text">+{formatNumber(effect.value)}</span>
        {:else}
            +{formatNumber(effect.value)}
        {/if}
    </div>
{/each}

<style>
    .cauldron-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
    }

    .heat-gauge {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s;
        margin-bottom: -10px;
        z-index: 10;
    }

    .heat-gauge.visible {
        opacity: 1;
    }

    .heat-info {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(0, 0, 0, 0.55);
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 3px 10px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    }

    .heat-text {
        font-size: 0.78rem;
        font-weight: 800;
        color: #ffeaa7;
        text-shadow: 0 1px 3px rgba(0,0,0,0.8);
        letter-spacing: 0.5px;
    }

    .heat-text.hot {
        color: #ff7675;
        text-shadow: 0 0 8px #d63031;
        animation: pulse 0.6s infinite alternate;
    }

    @keyframes pulse {
        from { transform: scale(1); }
        to { transform: scale(1.08); }
    }

    .heat-track {
        width: 110px;
        height: 6px;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.6);
    }

    .heat-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.1s ease-out;
    }

    .alchemical-pedestal {
        transition: opacity 0.3s ease;
        /* Animate opacity instead of filter:drop-shadow — opacity is compositor-only, filter causes repaint */
        animation: pulsePedestal 3.8s ease-in-out infinite alternate;
    }

    @keyframes pulsePedestal {
        0%   { opacity: 0.5; }
        100% { opacity: 1; }
    }

    .cauldron-container {
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        outline: none;
        -webkit-tap-highlight-color: transparent;
    }

    .cauldron-svg {
        width: clamp(280px, 38vmin, 380px);
        height: clamp(280px, 38vmin, 380px);
        display: block;
        transition: filter 0.3s ease;
    }

    @media (hover: hover) {
        .cauldron-container:hover .cauldron-svg {
            filter: drop-shadow(0 0 22px rgba(162, 155, 254, 0.45));
        }
    }

    @media (min-width: 769px) {
        .heat-track {
            width: 150px;
            height: 8px;
        }

        .heat-text {
            font-size: 0.88rem;
        }

        .floating-text {
            font-size: 2.1rem;
        }
    }

    @media (max-width: 768px) {
        .cauldron-svg {
            width: clamp(230px, 46vw, 270px);
            height: clamp(230px, 46vw, 270px);
        }
    }

    @media (max-width: 480px) {
        .cauldron-svg {
            width: 215px;
            height: 215px;
        }

        .heat-track {
            width: 105px;
            height: 6px;
        }

        .heat-text {
            font-size: 0.74rem;
        }
    }

    /* Liquid pulse when cold */
    .potion-liquid.normal-liquid {
        fill: #a29bfe;
        animation: potionPulse 3.5s ease-in-out infinite alternate;
    }
    .potion-liquid.hot-liquid {
        fill: #f39c12;
    }
    .potion-liquid.overheat-liquid {
        fill: #ff7675;
    }

    @keyframes potionPulse {
        0%   { fill: #a29bfe; }
        100% { fill: #6c5ce7; }
    }

    /* GPU-Composited Cauldron Bubble Keyframes (Zero CPU SMIL) */
    .cauldron-bubble {
        will-change: transform, opacity;
        animation-timing-function: ease-out;
        animation-iteration-count: infinite;
    }

    .cauldron-bubble.b1 {
        animation-name: cauldronBubbleRise1;
        animation-duration: 1.5s;
    }
    .cauldron-bubble.b2 {
        animation-name: cauldronBubbleRise2;
        animation-duration: 1.8s;
        animation-delay: 0.35s;
    }
    .cauldron-bubble.b3 {
        animation-name: cauldronBubbleRise3;
        animation-duration: 1.3s;
        animation-delay: 0.7s;
    }
    .cauldron-bubble.b4 {
        animation-name: cauldronBubbleRise4;
        animation-duration: 2.0s;
        animation-delay: 1.05s;
    }
    .cauldron-bubble.b5 {
        animation-name: cauldronBubbleRise5;
        animation-duration: 1.6s;
        animation-delay: 1.4s;
    }

    @keyframes cauldronBubbleRise1 {
        0%   { transform: translate3d(0, 4px, 0) scale(0.6); opacity: 0.75; }
        55%  { transform: translate3d(-2px, -26px, 0) scale(1.15); opacity: 0.95; }
        100% { transform: translate3d(-3px, -36px, 0) scale(0.2); opacity: 0; }
    }
    @keyframes cauldronBubbleRise2 {
        0%   { transform: translate3d(0, 4px, 0) scale(0.6); opacity: 0.75; }
        55%  { transform: translate3d(3px, -30px, 0) scale(1.2); opacity: 0.95; }
        100% { transform: translate3d(4px, -42px, 0) scale(0.2); opacity: 0; }
    }
    @keyframes cauldronBubbleRise3 {
        0%   { transform: translate3d(0, 2px, 0) scale(0.6); opacity: 0.75; }
        55%  { transform: translate3d(-1px, -24px, 0) scale(1.1); opacity: 0.95; }
        100% { transform: translate3d(-2px, -35px, 0) scale(0.2); opacity: 0; }
    }
    @keyframes cauldronBubbleRise4 {
        0%   { transform: translate3d(0, 4px, 0) scale(0.6); opacity: 0.75; }
        55%  { transform: translate3d(-3px, -34px, 0) scale(1.25); opacity: 0.95; }
        100% { transform: translate3d(-4px, -46px, 0) scale(0.2); opacity: 0; }
    }
    @keyframes cauldronBubbleRise5 {
        0%   { transform: translate3d(0, 4px, 0) scale(0.6); opacity: 0.75; }
        55%  { transform: translate3d(2px, -22px, 0) scale(1.1); opacity: 0.95; }
        100% { transform: translate3d(3px, -33px, 0) scale(0.2); opacity: 0; }
    }

    /* Floating Tap Numbers (Hardware text-stroke replaces 40 raster shadow passes) */
    .floating-text {
        position: absolute;
        color: #ffffff;
        font-weight: 900;
        font-size: 1.85rem;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        -webkit-text-stroke: 1.2px #d4af37;
        text-shadow: 0 2px 5px rgba(0, 0, 0, 0.85);
        pointer-events: none;
        z-index: 1000;
        will-change: transform, opacity;
        transform: translate3d(0, 0, 0);
    }

    .crystal-float {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 1.5rem;
        color: #81ecec;
        filter: drop-shadow(0 0 6px #0984e3);
    }

    .crit-text {
        color: #ffeaa7;
        font-size: 2.2rem;
        font-weight: 900;
        -webkit-text-stroke: 1.4px #d63031;
        text-shadow: 0 0 10px #ff7675, 0 2px 6px rgba(0, 0, 0, 0.9);
        animation: crit-pop 0.3s ease-out;
    }

    .combo-text {
        color: #ffeaa7;
        font-size: 1.95rem;
        -webkit-text-stroke: 1.2px #d35400;
        text-shadow: 0 0 8px #f39c12, 0 2px 5px rgba(0, 0, 0, 0.85);
    }

    @keyframes crit-pop {
        0%   { transform: scale(0.6); }
        50%  { transform: scale(1.25); }
        100% { transform: scale(1); }
    }
</style>
