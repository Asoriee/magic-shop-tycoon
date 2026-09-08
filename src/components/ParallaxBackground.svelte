<script lang="ts">
    import { onMount } from 'svelte';
    import gsap from 'gsap';

    // Generate star and bubble positions ONCE at module init — not on every render
    const stars = Array.from({ length: 200 }, () => ({
        cx: Math.random() * 2000 - 500,
        cy: Math.random() * 2000 - 500,
        r: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2
    }));

    const bubbles = Array.from({ length: 20 }, () => ({
        cx: Math.random() * 1000,
        r: Math.random() * 15 + 5,
        delay: Math.random() * 10,
        duration: Math.random() * 10 + 10
    }));

    let starsLayer: SVGGElement;
    let runesLayer: SVGGElement;
    let bubblesLayer: SVGGElement;

    onMount(() => {
        // Layer 1: Stars slow rotation
        gsap.to(starsLayer, {
            rotation: 360,
            duration: 200,
            repeat: -1,
            ease: 'linear',
            transformOrigin: 'center center'
        });

        // Layer 2: Runes/Fog opacity pulsation
        gsap.to(runesLayer, {
            opacity: 0.3,
            duration: 4,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });

        // Layer 3: Bubbles — use CSS animation via GSAP stagger for efficiency
        const bubbleEls = bubblesLayer.querySelectorAll('circle');
        bubbleEls.forEach((bubble, i) => {
            const dur = bubbles[i].duration;
            const delay = bubbles[i].delay;
            gsap.fromTo(bubble, 
                { y: 1100, opacity: 0 },
                {
                    y: -100,
                    opacity: 0.6,
                    duration: dur,
                    repeat: -1,
                    delay: delay,
                    ease: 'none'
                }
            );
        });
    });
</script>

<div class="parallax-bg">
    <svg width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
            <filter id="fog" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="30" />
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

        <!-- Layer 3: Bubbles — pre-generated, reduced to 20 for performance -->
        <g bind:this={bubblesLayer}>
            {#each bubbles as bubble}
                <circle 
                    cx={bubble.cx}
                    cy="0" 
                    r={bubble.r}
                    fill="none" 
                    stroke="rgba(255, 255, 255, 0.4)" 
                    stroke-width="2"
                    style="will-change: transform, opacity"
                />
            {/each}
        </g>
    </svg>
</div>

<style>
    .parallax-bg {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: -1;
        pointer-events: none;
        overflow: hidden;
        background: radial-gradient(circle at center, #1e1e38 0%, #0a0a14 100%);
    }
</style>
