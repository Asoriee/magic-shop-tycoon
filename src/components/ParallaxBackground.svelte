<script lang="ts">
    // Detect mobile once at init — reduces node count on small screens
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    // Generate star and bubble positions ONCE at module init
    // Mobile: 60 stars / 12 bubbles — Desktop: 150 stars / 24 bubbles
    const stars = Array.from({ length: isMobile ? 60 : 150 }, () => ({
        cx: Math.random() * 2000 - 500,
        cy: Math.random() * 2000 - 500,
        r: Math.random() * 1.8 + 0.5,
        opacity: Math.random() * 0.75 + 0.25
    }));

    const bubbleColors = ['#a29bfe', '#74b9ff', '#fd79a8', '#55efc4', '#ffeaa7'];

    // Negative animation delays ensure bubbles are already distributed vertically across screen on first paint!
    const bubbles = Array.from({ length: isMobile ? 12 : 24 }, (_, i) => ({
        id: i,
        cx: Math.random() * 960 + 20,
        r: Math.random() * 10 + 7, // 7px to 17px radius
        color: bubbleColors[i % bubbleColors.length],
        duration: (Math.random() * 6 + 9).toFixed(2), // 9s to 15s
        delay: (-(Math.random() * 15)).toFixed(2), // negative delay for instant screen dispersion
        swayDuration: (Math.random() * 2 + 2.8).toFixed(2), // 2.8s to 4.8s
        swayDelay: (-(Math.random() * 4)).toFixed(2)
    }));
</script>

<div class="parallax-bg">
    <svg width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
            <!-- Hardware Shaded Fog Gradients (Zero Gaussian Blur overhead, 100% GPU fragment shader) -->
            <radialGradient id="fogGradViolet" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#a29bfe" stop-opacity="0.45"/>
                <stop offset="50%" stop-color="#a29bfe" stop-opacity="0.2"/>
                <stop offset="100%" stop-color="#a29bfe" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="fogGradBlue" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#74b9ff" stop-opacity="0.4"/>
                <stop offset="55%" stop-color="#74b9ff" stop-opacity="0.16"/>
                <stop offset="100%" stop-color="#74b9ff" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="fogGradPink" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#fd79a8" stop-opacity="0.38"/>
                <stop offset="55%" stop-color="#fd79a8" stop-opacity="0.14"/>
                <stop offset="100%" stop-color="#fd79a8" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="fogGradTeal" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#00cec9" stop-opacity="0.32"/>
                <stop offset="55%" stop-color="#00cec9" stop-opacity="0.12"/>
                <stop offset="100%" stop-color="#00cec9" stop-opacity="0"/>
            </radialGradient>
        </defs>

        <!-- Layer 1: Stars (Slow CSS rotation on desktop, static on mobile to eliminate paint) -->
        <g class={isMobile ? 'stars-layer-mobile' : 'stars-layer-desktop'}>
            {#each stars as star}
                <circle cx={star.cx} cy={star.cy} r={star.r} fill="#ffffff" opacity={star.opacity} />
            {/each}
        </g>

        <!-- Layer 2: Mystical Fog & Runes (Compositor-only CSS breathing, zero blur filter) -->
        <g class="runes-layer">
            <circle cx="200" cy="300" r="180" fill="url(#fogGradViolet)" />
            <circle cx="800" cy="700" r="230" fill="url(#fogGradBlue)" />
            <circle cx="600" cy="200" r="150" fill="url(#fogGradPink)" />
            <circle cx="300" cy="800" r="210" fill="url(#fogGradTeal)" />
            
            <!-- Magic Runes/Shapes -->
            <path d="M 300 400 L 350 350 L 400 450 Z" fill="none" stroke="#ffeaa7" stroke-width="6" opacity="0.45"/>
            <path d="M 700 300 Q 750 200 800 300 T 900 300" fill="none" stroke="#55efc4" stroke-width="9" opacity="0.38"/>
            <path d="M 150 700 L 250 700 L 200 800 Z" fill="none" stroke="#fab1a0" stroke-width="5" opacity="0.5"/>
        </g>

        <!-- Layer 3: Bubbles (Pure CSS GPU Composited animations — zero JS ticker load) -->
        <g class="bubbles-layer">
            {#each bubbles as bubble (bubble.id)}
                <g 
                    class="bubble-rise"
                    style="transform-origin: {bubble.cx}px 0px; animation-duration: {bubble.duration}s; animation-delay: {bubble.delay}s;"
                >
                    <g 
                        class="bubble-sway"
                        style="animation-duration: {bubble.swayDuration}s; animation-delay: {bubble.swayDelay}s;"
                    >
                        <!-- Translucent body with vibrant stroke -->
                        <circle 
                            cx={bubble.cx}
                            cy="0" 
                            r={bubble.r}
                            fill={bubble.color}
                            fill-opacity="0.24"
                            stroke={bubble.color} 
                            stroke-width="2"
                            stroke-opacity="0.85"
                        />
                        <!-- Highlight reflection -->
                        <circle 
                            cx={bubble.cx - bubble.r * 0.35}
                            cy={-bubble.r * 0.35}
                            r={bubble.r * 0.28}
                            fill="#ffffff"
                            opacity="0.75"
                        />
                    </g>
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

    /* Desktop stars gentle rotation */
    .stars-layer-desktop {
        animation: spinStars 280s linear infinite;
        transform-origin: 500px 500px;
        will-change: transform;
    }

    @keyframes spinStars {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    /* Fog breathing via compositor-only opacity */
    .runes-layer {
        animation: fogBreathe 5s ease-in-out infinite alternate;
        will-change: opacity;
    }

    @keyframes fogBreathe {
        0%   { opacity: 0.4; }
        100% { opacity: 0.8; }
    }

    /* GPU Composited Bubble Keyframes */
    .bubble-rise {
        animation-name: bubbleRiseKeyframe;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
        will-change: transform, opacity;
    }

    @keyframes bubbleRiseKeyframe {
        0% {
            transform: translate3d(0, 1050px, 0);
            opacity: 0;
        }
        8% {
            opacity: 0.85;
        }
        90% {
            opacity: 0.85;
        }
        100% {
            transform: translate3d(0, -80px, 0);
            opacity: 0;
        }
    }

    .bubble-sway {
        animation-name: bubbleSwayKeyframe;
        animation-timing-function: ease-in-out;
        animation-iteration-count: infinite;
        animation-direction: alternate;
        will-change: transform;
    }

    @keyframes bubbleSwayKeyframe {
        0%   { transform: translate3d(-18px, 0, 0); }
        100% { transform: translate3d(18px, 0, 0); }
    }
</style>
