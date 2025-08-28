<template>
  <div class="loading-spinner" :class="containerClasses">
    <div :class="spinnerClasses" :style="spinnerStyle">
      <div class="spinner-inner"></div>
    </div>
    <p v-if="text" class="spinner-text" :class="textClasses">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white' | 'gray'
  text?: string
  variant?: 'spin' | 'pulse' | 'bounce'
  speed?: 'slow' | 'normal' | 'fast'
}

const props = withDefaults(defineProps<LoadingSpinnerProps>(), {
  size: 'md',
  color: 'primary',
  variant: 'spin',
  speed: 'normal'
})

// 計算屬性
const containerClasses = computed(() => [
  'loading-spinner',
  'flex flex-col items-center justify-center gap-2',
  `size-${props.size}`,
  `color-${props.color}`,
  `variant-${props.variant}`,
  `speed-${props.speed}`
])

const spinnerClasses = computed(() => {
  const baseClasses = [
    'spinner',
    'rounded-full',
    'border-2',
    'border-solid'
  ]

  // 尺寸樣式
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  // 顏色樣式
  const colorClasses = {
    primary: 'border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400',
    secondary: 'border-gray-200 dark:border-gray-700 border-t-gray-600 dark:border-t-gray-400',
    white: 'border-white/30 border-t-white',
    gray: 'border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300'
  }

  // 動畫變體
  const variantClasses = {
    spin: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce'
  }

  return [
    ...baseClasses,
    sizeClasses[props.size],
    colorClasses[props.color],
    variantClasses[props.variant]
  ]
})

const spinnerStyle = computed(() => {
  const speedMap = {
    slow: '2s',
    normal: '1s',
    fast: '0.5s'
  }

  if (props.variant === 'spin') {
    return {
      animationDuration: speedMap[props.speed]
    }
  }

  return {}
})

const textClasses = computed(() => [
  'spinner-text',
  'text-center',
  'font-medium',
  // 尺寸對應的文字大小
  {
    'text-xs': props.size === 'xs',
    'text-sm': props.size === 'sm',
    'text-base': props.size === 'md',
    'text-lg': props.size === 'lg',
    'text-xl': props.size === 'xl'
  },
  // 顏色對應的文字顏色
  {
    'text-blue-600 dark:text-blue-400': props.color === 'primary',
    'text-gray-600 dark:text-gray-400': props.color === 'secondary' || props.color === 'gray',
    'text-white': props.color === 'white'
  }
])
</script>

<style scoped>
.loading-spinner {
  user-select: none;
}

/* 自定義旋轉動畫 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  animation: spin 1s linear infinite;
}

/* 脈衝動畫變體 */
.variant-pulse .spinner {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  border: 2px solid currentColor;
  opacity: 0.75;
}

/* 彈跳動畫變體 */
.variant-bounce .spinner {
  animation: bounce 1s infinite;
  border-radius: 50%;
  border: none;
  background-color: currentColor;
}

/* 速度變體 */
.speed-slow .spinner {
  animation-duration: 2s;
}

.speed-normal .spinner {
  animation-duration: 1s;
}

.speed-fast .spinner {
  animation-duration: 0.5s;
}

/* 高對比度模式 */
@media (prefers-contrast: high) {
  .color-primary .spinner {
    @apply border-black dark:border-white border-t-blue-600 dark:border-t-blue-400;
  }

  .color-secondary .spinner,
  .color-gray .spinner {
    @apply border-black dark:border-white border-t-gray-800 dark:border-t-gray-200;
  }
}

/* 減少動畫模式 */
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
  }

  .variant-pulse .spinner {
    opacity: 0.5;
  }

  .variant-bounce .spinner {
    animation: none;
  }
}

/* 無障礙支援 */
.loading-spinner {
  role: status;
  aria-live: polite;
}

.spinner-text {
  aria-hidden: true;
}
</style>
