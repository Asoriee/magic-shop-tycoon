<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import gsap from 'gsap';
    import { gameStore, currentIdleIncome, formatNumber } from '../store';
    import { showRewardedAd } from '../yandex-sdk';

    let fairyElement: HTMLElement;
    let fairyTween: gsap.core.Tween;
    let waveTween: gsap.core.Tween;
    let spawnTimer: number;

    let isVisible = false;
    let isModalOpen = false;
    let rewardAmount = 0;

    function scheduleSpawn() {
        // Время от 3 до 5 минут (в миллисекундах)
        const delay = Math.random() * 120000 + 180000;
        spawnTimer = setTimeout(() => {
            spawnFairy();
        }, delay);
    }

    function spawnFairy() {
        isVisible = true;
        isModalOpen = false;
        
        // Даем Svelte время отрендерить элемент перед анимацией
        setTimeout(() => {
            if (!fairyElement) return;

            const startY = Math.random() * (window.innerHeight * 0.6) + window.innerHeight * 0.2;
            const endX = window.innerWidth + 50;
            const duration = Math.random() * 2 + 5; // От 5 до 7 секунд

            // Начальная позиция слева за экраном
            gsap.set(fairyElement, { x: -50, y: startY, opacity: 1, scale: 1 });

            // Полет вправо
            fairyTween = gsap.to(fairyElement, {
                x: endX,
                duration: duration,
                ease: 'none',
                onComplete: () => {
                    isVisible = false;
                    scheduleSpawn(); // Если не поймали - спавним заново через время
                }
            });

            // Волнообразное движение по Y
            waveTween = gsap.to(fairyElement, {
                y: startY + (Math.random() > 0.5 ? 60 : -60),
                duration: duration / 4,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            });
        }, 50);
    }

    function handleFairyClick() {
        if (!isVisible) return;
        
        // Ставим анимацию на паузу
        if (fairyTween) fairyTween.pause();
        if (waveTween) waveTween.pause();

        isVisible = false; 
        
        // Расчет награды: доход за 10 минут (минимум 100)
        rewardAmount = Math.floor($currentIdleIncome * 600);
        if (rewardAmount === 0) rewardAmount = 100; // Минимальная награда на старте

        isModalOpen = true;
    }

    function watchAd() {
        showRewardedAd(
            () => {
                // Успешный просмотр (onReward)
                gameStore.addGold(rewardAmount);
                gameStore.updateQuestProgress('watch_ads', 1);
            },
            () => {
                // Закрытие рекламы (в любом случае)
                isModalOpen = false;
                scheduleSpawn();
            }
        );
    }

    function declineAd() {
        isModalOpen = false;
        scheduleSpawn();
    }

    onMount(() => {
        scheduleSpawn();
        
        // Глобальный хелпер для быстрого тестирования спавна в консоли
        (window as any).spawnFairy = () => {
            if (spawnTimer) clearTimeout(spawnTimer);
            spawnFairy();
        };
    });

    onDestroy(() => {
        if (spawnTimer) clearTimeout(spawnTimer);
        if (fairyTween) fairyTween.kill();
        if (waveTween) waveTween.kill();
        delete (window as any).spawnFairy;
    });
</script>

{#if isVisible}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fairy" bind:this={fairyElement} on:click={handleFairyClick}>
    <svg viewBox="0 0 100 100" width="80" height="80">
        <defs>
            <filter id="fairyGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        
        <!-- Свечение ауры -->
        <circle cx="50" cy="50" r="20" fill="#a29bfe" filter="url(#fairyGlow)" opacity="0.8">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="r" values="18;24;18" dur="1.5s" repeatCount="indefinite" />
        </circle>
        
        <!-- Яркое ядро -->
        <circle cx="50" cy="50" r="10" fill="#ffffff" filter="url(#fairyGlow)" />
        
        <!-- Лучи звезды -->
        <path d="M50 5 L55 45 L95 50 L55 55 L50 95 L45 55 L5 50 L45 45 Z" fill="#ffffff" opacity="0.9" filter="url(#fairyGlow)">
            <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="4s" repeatCount="indefinite" />
        </path>
    </svg>
</div>
{/if}

{#if isModalOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay" on:click={declineAd}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-content" on:click|stopPropagation>
        <div class="ad-icon">
            <svg viewBox="0 0 24 24" width="42" height="42" fill="none">
                <path d="M12 2 L14 8 L20 10 L14 12 L12 18 L10 12 L4 10 L10 8 Z" fill="#ffeaa7" stroke="#fdcb6e" stroke-width="1.5"/>
                <circle cx="18" cy="5" r="2" fill="#ffeaa7"/>
                <circle cx="6" cy="18" r="1.5" fill="#ffeaa7"/>
            </svg>
        </div>
        <h2>Волшебная Искра!</h2>
        <p>Поймана волшебная искра! Посмотри рекламу, чтобы получить 
            <span class="reward-gold">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" style="vertical-align: middle; display: inline-block;">
                    <circle cx="12" cy="12" r="9" fill="#f1c40f" stroke="#d4ac0d" stroke-width="2"/>
                    <circle cx="12" cy="12" r="5" fill="#f39c12"/>
                </svg>
                +{formatNumber(rewardAmount)}
            </span> золота.
        </p>
        <div class="actions">
            <button class="btn-cancel" on:click={declineAd}>Упустить</button>
            <button class="btn-confirm" on:click={watchAd}>Смотреть</button>
        </div>
    </div>
</div>
{/if}

<style>
    .fairy {
        position: fixed;
        top: 0;
        left: -100px;
        z-index: 100;
        cursor: pointer;
        filter: drop-shadow(0 0 10px rgba(162, 155, 254, 0.8));
    }

    .modal-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 110;
        backdrop-filter: blur(3px);
    }

    .modal-content {
        background: linear-gradient(135deg, #2c3e50, #1a252f);
        padding: 30px;
        border-radius: 20px;
        border: 2px solid #e67e22;
        box-shadow: 0 10px 40px rgba(230, 126, 34, 0.4);
        text-align: center;
        max-width: 400px;
        width: 90%;
        color: white;
    }

    .ad-icon {
        font-size: 4rem;
        margin-bottom: 10px;
        animation: float 2s ease-in-out infinite;
    }

    @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }

    h2 {
        color: #f39c12;
        margin-top: 0;
        font-size: 1.8rem;
    }

    p {
        font-size: 1.1rem;
        line-height: 1.5;
        margin-bottom: 25px;
    }

    .reward-gold {
        color: #f1c40f;
        font-weight: bold;
        font-size: 1.3rem;
        text-shadow: 0 0 5px rgba(241, 196, 15, 0.5);
    }

    .actions {
        display: flex;
        justify-content: space-around;
        gap: 15px;
    }

    button {
        flex: 1;
        padding: 15px;
        border: none;
        border-radius: 10px;
        font-size: 1.1rem;
        cursor: pointer;
        font-weight: bold;
        transition: transform 0.2s, filter 0.2s;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    button:hover {
        transform: scale(1.05);
        filter: brightness(1.2);
    }

    .btn-cancel {
        background: #7f8c8d;
        color: white;
    }

    .btn-confirm {
        background: linear-gradient(135deg, #2ecc71, #27ae60);
        color: white;
        box-shadow: 0 0 15px rgba(46, 204, 113, 0.5);
    }
</style>
