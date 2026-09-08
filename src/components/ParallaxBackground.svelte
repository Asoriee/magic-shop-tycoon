<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import gsap from 'gsap';

    // Generate star and bubble positions ONCE at module init
    const stars = Array.from({ length: 200 }, () => ({
        cx: Math.random() * 2000 - 500,
        cy: Math.random() * 2000 - 500,
        r: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2
    }));

    const bubbleColors = ['#a29bfe', '#74b9ff', '#fd79a8', '#55efc4', '#ffeaa7'];

    const bubbles = Array.from({ length: 32 }, () => ({
        cx: Math.random() * 1000,
        r: Math.random() * 12 + 8, // 8px to 20px radius for clear visibility
        color: bubbleColors[Math.floor(Math.random() * bubbleColors.length)],
        duration: Math.random() * 8 + 7 // 7 to 15 seconds
    }));

    let starsLayer: SVGGElement;
    let runesLayer: SVGGElement;
    let bubblesLayer: SVGGElement;

    onMount(() => {
        // Layer 1: Stars slow rotation
        if (starsLayer) {
            gsap.to(starsLayer, {
                rotation: 360,
                duration: 200,
                repeat: -1,
                ease: 'linear',
                transformOrigin: 'center center'
            });
        }

        // Layer 2: Runes/Fog opacity pulsation
        if (runesLayer) {
            gsap.to(runesLayer, {
                opacity: 0.4,
                duration: 4,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            });
        }

        // Layer 3: Bubbles — immediate distribution across viewport
        if (bubblesLayer) {
            const bubbleGroups = bubblesLayer.querySelectorAll('.bubble-group');
            bubbleGroups.forEach((group, i) => {
                if (!group) return;
                const dur = bubbles[i]?.duration || 10;
                
                // Vertical rise
                const tween = gsap.fromTo(group, 
                    { y: 1050, opacity: 0 },
                    {
                        y: -80,
                        opacity: 0.85,
                        duration: dur,
                        repeat: -1,
                        ease: 'none'
                    }
                );
                
                // Immediately distribute across the height so bubbles are visible right on load!
                tween.progress(Math.random());

                // Horizontal gentle sway
                gsap.to(group, {
                    x: `+=${(Math.random() - 0.5) * 50}`,
                    duration: 2.5 + Math.random() * 2,
                    yoyo: true,
                    repeat: -1,
                    ease: 'sine.inOut'
                });
            });
        }
    });

    onDestroy(() => {
        const targets = [starsLayer, runesLayer, bubblesLayer].filter(Boolean);
        if (targets.length) gsap.killTweensOf(targets);
        if (bubblesLayer) {
            const bubbleGroups = bubblesLayer.querySelectorAll('.bubble-group');
            if (bubbleGroups.length) gsap.killTweensOf(bubbleGroups);
        }
    });
</script>

<div class="parallax-bg">
    <svg width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
            <filter id="fog" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="30" />
            </filter>
            <filter id="bubbleGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>

        <!-- Layer 1: Stars — pre-generated coordinates -->
        <g bind:this={starsLayer} style="will-change: transform">
            {#each stars as star}
                <circle cx={star.cx} cy={star.cy} r={star.r} fill="#ffffff" opacity={star.opacity} />
            {/each}
        </g>

        <!-- Layer 2: Runes / Fog -->
        <g bind:this={runesLayer} filter="url(#fog)" opacity="0.6" style="will-change: opacity">
            <circle cx="200" cy="300" r="150" fill="#a29bfe" opacity="0.5" />
            <circle cx="800" cy="700" r="200" fill="#74b9ff" opacity="0.4" />
            <circle cx="600" cy="200" r="120" fill="#fd79a8" opacity="0.4" />
            <circle cx="300" cy="800" r="180" fill="#00cec9" opacity="0.3" />
            
            <!-- Magic Runes/Shapes -->
            <path d="M 300 400 L 350 350 L 400 450 Z" fill="none" stroke="#ffeaa7" stroke-width="8" opacity="0.5"/>
            <path d="M 700 300 Q 750 200 800 300 T 900 300" fill="none" stroke="#55efc4" stroke-width="12" opacity="0.4"/>
            <path d="M 150 700 L 250 700 L 200 800 Z" fill="none" stroke="#fab1a0" stroke-width="6" opacity="0.6"/>
        </g>

        <!-- Layer 3: Bubbles with glowing gradient and shine -->
        <g bind:this={bubblesLayer}>
            {#each bubbles as bubble}
                <g class="bubble-group" filter="url(#bubbleGlow)">
                    <!-- Bubble body with translucent fill and vibrant colored stroke -->
                    <circle 
                        cx={bubble.cx}
                        cy="0" 
                        r={bubble.r}
                        fill={bubble.color}
                        fill-opacity="0.22"
                        stroke={bubble.color} 
                        stroke-width="2.5"
                        stroke-opacity="0.85"
                    />
                    <!-- Bubble highlight reflection -->
                    <circle 
                        cx={bubble.cx - bubble.r * 0.35}
                        cy={-bubble.r * 0.35}
                        r={bubble.r * 0.28}
                        fill="#ffffff"
                        opacity="0.75"
                    />
                </g>
            {/each}
        </g>
    </svg>
</div>

<style>
    .parallax-bg {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
        pointer-events: none;
        overflow: hidden;
        background: radial-gradient(circle at center, #1e1e38 0%, #0a0a14 100%);
    }
</style>
