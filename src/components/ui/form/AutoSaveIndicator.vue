<template>
  <div
    v-if="status !== 'idle'"
    :class="containerClasses"
    role="status"
    :aria-live="status === 'error' ? 'assertive' : 'polite'"
  >
    <div class="flex items-center space-x-2">
      <!-- 狀態圖標 -->
      <component
        :is="statusIcon"
        :class="iconClasses"
        :aria-hidden="true"
      />

      <!-- 狀態文字 -->
      <span :class="textClasses">
        {{ statusText }}
      </span>

      <!-- 最後保存時間 -->
      <span
        v-if="lastSaved && status === 'saved'"
        :class="timestampClasses"
      >
        {{ formatLastSaved }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

interface Props {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date | null
}

const props = defineProps<Props>()

const statusIcon = computed(() => {
  switch (props.status) {
    case 'saving':
      return ArrowPathIcon
    case 'saved':
      return CheckCircleIcon
    case 'error':
      return ExclamationCircleIcon
    default:
      return CloudArrowUpIcon
  }
})

const statusText = computed(() => {
  switch (props.status) {
    case 'saving':
      return '正在保存...'
    case 'saved':
      return '已自動保存'
    case 'error':
      return '保存失敗'
    default:
      return ''
  }
})

const containerClasses = computed(() => {
  const classes = [
    'auto-save-indicator',
    'fixed',
    'bottom-4',
    'right-4',
    'px-3',
    'py-2',
    'rounded-md',
    'shadow-lg',
    'border',
    'z-50',
    'transition-all',
    'duration-300'
  ]

  switch (props.status) {
    case 'saving':
      classes.push(
        'bg-[var(--color-info-50)]',
        'border-[var(--color-info-200)]',
        'text-[var(--color-info-800)]'
      )
      break
    case 'saved':
      classes.push(
        'bg-[var(--color-success-50)]',
        'border-[var(--color-success-200)]',
        'text-[var(--color-success-800)]'
      )
      break
    case 'error':
      classes.push(
        'bg-[var(--color-error-50)]',
        'border-[var(--color-error-200)]',
        'text-[var(--color-error-800)]'
      )
      break
  }

  return classes.join(' ')
})

const iconClasses = computed(() => {
  const classes = ['h-4', 'w-4']

  if (props.status === 'saving') {
    classes.push('animate-spin')
  }

  return classes.join(' ')
})

const textClasses = computed(() => {
  return [
    'text-sm',
    'font-medium'
  ].join(' ')
})

const timestampClasses = computed(() => {
  return [
    'text-xs',
    'opacity-75'
  ].join(' ')
})

const formatLastSaved = computed(() => {
  if (!props.lastSaved) return ''

  const now = new Date()
  const diff = now.getTime() - props.lastSaved.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)

  if (seconds < 60) {
    return '剛剛'
  } else if (minutes < 60) {
    return `${minutes} 分鐘前`
  } else {
    return props.lastSaved.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
})
</script>

<style scoped>
.auto-save-indicator {
  /* 確保指示器在所有主題下都清晰可見 */
  backdrop-filter: blur(8px);
}

/* 減少動畫偏好支援 */
@media (prefers-reduced-motion: reduce) {
  .auto-save-indicator {
    transition: none;
  }

  .animate-spin {
    animation: none;
  }
}

/* 移動端調整 */
@media (max-width: 640px) {
  .auto-save-indicator {
    @apply bottom-2 right-2 text-xs;
  }
}
</style>
