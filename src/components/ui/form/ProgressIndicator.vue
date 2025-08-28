<template>
  <div class="progress-indicator">
    <!-- 進度條 -->
    <div :class="progressBarClasses">
      <div
        :class="progressFillClasses"
        :style="{ width: `${progress}%` }"
        role="progressbar"
        :aria-valuenow="progress"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`進度 ${progress}%`"
      />
    </div>

    <!-- 百分比顯示 -->
    <div v-if="showPercentage" :class="percentageClasses">
      {{ progress }}%
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  progress: number
  showPercentage?: boolean
  color?: 'primary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  showPercentage: true,
  color: 'primary',
  size: 'md'
})

const progressBarClasses = computed(() => {
  const classes = [
    'progress-bar',
    'relative',
    'overflow-hidden',
    'bg-[var(--color-neutral-200)]',
    'rounded-full'
  ]

  // 尺寸
  switch (props.size) {
    case 'sm':
      classes.push('h-1')
      break
    case 'lg':
      classes.push('h-3')
      break
    default:
      classes.push('h-2')
  }

  return classes.join(' ')
})

const progressFillClasses = computed(() => {
  const classes = [
    'progress-fill',
    'h-full',
    'transition-all',
    'duration-300',
    'ease-out',
    'rounded-full'
  ]

  // 顏色
  switch (props.color) {
    case 'success':
      classes.push('bg-[var(--color-success-500)]')
      break
    case 'warning':
      classes.push('bg-[var(--color-warning-500)]')
      break
    case 'error':
      classes.push('bg-[var(--color-error-500)]')
      break
    default:
      classes.push('bg-[var(--color-primary-500)]')
  }

  return classes.join(' ')
})

const percentageClasses = computed(() => {
  return [
    'progress-percentage',
    'text-xs',
    'font-medium',
    'text-[var(--color-text-secondary)]',
    'mt-1',
    'text-right'
  ].join(' ')
})
</script>

<style scoped>
.progress-indicator {
  @apply w-full;
}

/* 減少動畫偏好支援 */
@media (prefers-reduced-motion: reduce) {
  .progress-fill {
    transition: none;
  }
}
</style>
