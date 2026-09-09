<script lang="ts">
    export let type: 'gold' | 'crystals' | 'stardust' | 'income' | 'vip' | 'time' | 'click' = 'gold';
    export let size: number = 16;
    let customClass: string = '';
    export { customClass as class };
</script>

{#if type === 'gold'}
    <!-- Чародейский Талер: 3-уровневая монета с гравированной магической звездой -->
    <svg 
        viewBox="0 0 24 24" 
        width={size} 
        height={size} 
        class="resource-icon gold-icon {customClass}" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <circle cx="12" cy="12" r="10" fill="#f1c40f" stroke="#b7791f" stroke-width="1.6"/>
        <circle cx="12" cy="12" r="7.5" fill="#f39c12"/>
        <!-- Гравировка магической звезды чародеев -->
        <polygon points="12,6.5 13.8,12 12,17.5 10.2,12" fill="#ffeaa7"/>
        <polygon points="6.5,12 12,10.2 17.5,12 12,13.8" fill="#ffeaa7"/>
        <circle cx="12" cy="12" r="1.6" fill="#ffffff"/>
    </svg>

{:else if type === 'crystals'}
    <!-- Кристалл Маны: гранёный астральный самоцвет с преломлением граней -->
    <svg 
        viewBox="0 0 24 24" 
        width={size} 
        height={size} 
        class="resource-icon crystal-icon {customClass}" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <!-- Базовая форма -->
        <polygon points="12,2 20,7 16,21 8,21 4,7" fill="#74b9ff" stroke="#0984e3" stroke-width="1.5"/>
        <!-- Теневая грань справа -->
        <polygon points="12,2 20,7 16,21 12,16" fill="#0984e3" opacity="0.35"/>
        <!-- Яркая грань преломления по центру -->
        <polygon points="12,2 16,7 12,16 8,7" fill="#dff9fb" opacity="0.95"/>
        <!-- Нижняя глубинная грань -->
        <polygon points="8,7 12,16 8,21 4,7" fill="#2980b9" opacity="0.4"/>
        <!-- Вертикальное световое ребро -->
        <line x1="12" y1="2" x2="12" y2="16" stroke="#ffffff" stroke-width="1.2" opacity="0.85" stroke-linecap="round"/>
    </svg>

{:else if type === 'stardust'}
    <!-- Звёздная Пыль: 8-лучевая астральная звезда с мерцающим ядром -->
    <svg 
        viewBox="0 0 24 24" 
        width={size} 
        height={size} 
        class="resource-icon stardust-icon {customClass}" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <path 
            d="M12 2 L14 8 L20 10 L15 14 L17 21 L12 17 L7 21 L9 14 L4 10 L10 8 Z" 
            fill="#e056fd" 
            stroke="#be2edd" 
            stroke-width="1.5"
            stroke-linejoin="round"
        />
        <!-- Внутреннее свечение -->
        <polygon points="12,6 13.5,10.5 18,12 13.5,13.5 12,18 10.5,13.5 6,12 10.5,10.5" fill="#f368e0" opacity="0.7"/>
        <circle cx="12" cy="12" r="1.8" fill="#ffffff"/>
    </svg>

{:else if type === 'income'}
    <!-- Поток Эфира: динамический изумрудный восходящий луч дохода -->
    <svg 
        viewBox="0 0 24 24" 
        width={size} 
        height={size} 
        class="resource-icon income-icon {customClass}" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <path 
            d="M3 16 L8.5 10.5 L13 15 L21 6" 
            stroke="#2ecc71" 
            stroke-width="2.6" 
            stroke-linecap="round" 
            stroke-linejoin="round"
        />
        <polyline 
            points="15,6 21,6 21,12" 
            stroke="#2ecc71" 
            stroke-width="2.6" 
            stroke-linecap="round" 
            stroke-linejoin="round"
        />
        <circle cx="21" cy="6" r="1.6" fill="#a8ffb2"/>
    </svg>

{:else if type === 'vip'}
    <!-- Корона Архимага: золотая чародейская корона с рубином -->
    <svg 
        viewBox="0 0 24 24" 
        width={size} 
        height={size} 
        class="resource-icon vip-icon {customClass}" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <path 
            d="M4 17 L20 17 L22 8 L17 12 L12 4 L7 12 L2 8 Z" 
            fill="#ffd700" 
            stroke="#d4ac0d" 
            stroke-width="1.5"
            stroke-linejoin="round"
        />
        <circle cx="12" cy="17" r="1.6" fill="#e74c3c"/>
        <circle cx="12" cy="6.5" r="1" fill="#ffffff"/>
    </svg>

{:else if type === 'time'}
    <!-- Хронометр Времени: мистический циферблат со стрелками -->
    <svg 
        viewBox="0 0 24 24" 
        width={size} 
        height={size} 
        class="resource-icon time-icon {customClass}" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <circle cx="12" cy="12" r="9" stroke="#74b9ff" stroke-width="1.8"/>
        <polyline points="12,7 12,12 15.5,14" stroke="#74b9ff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="12" r="1.3" fill="#74b9ff"/>
    </svg>

{:else if type === 'click'}
    <!-- Всплеск Маны: алый энергетический разряд силы клика -->
    <svg 
        viewBox="0 0 24 24" 
        width={size} 
        height={size} 
        class="resource-icon click-icon {customClass}" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <polygon 
            points="13,2 4,14 11,14 10,22 20,9 13,9" 
            fill="#ff7675" 
            stroke="#d63031" 
            stroke-width="1.5"
            stroke-linejoin="round"
        />
    </svg>
{/if}

<style>
    .resource-icon {
        display: inline-block;
        vertical-align: middle;
        flex-shrink: 0;
        pointer-events: none;
    }
</style>
