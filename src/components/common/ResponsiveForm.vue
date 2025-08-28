<template>
  <form
    :class="formClasses"
    @submit="handleSubmit"
    :novalidate="novalidate"
  >
    <!-- 表單標題區域 -->
    <div v-if="title || $slots.header" class="form-header">
      <slot name="header">
        <h2 v-if="title" :class="titleClasses">{{ title }}</h2>
        <p v-if="description" :class="descriptionClasses">{{ description }}</p>
      </slot>
    </div>

    <!-- 錯誤提示區域 -->
    <div v-if="error || errors.length > 0" :class="errorContainerClasses">
      <div class="flex">
        <div class="shrink-0">
          <ExclamationTriangleIcon class="size-5 text-[var(--color-error-400)]" />
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-[var(--color-error-800)]">發生錯誤</h3>
          <div class="mt-1 text-sm text-[var(--color-error-700)]">
            <p v-if="error">{{ error }}</p>
            <ul v-if="errors.length > 0" class="list-inside list-disc space-y-1">
              <li v-for="err in errors" :key="err">{{ err }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 表單內容區域 -->
    <div :class="contentClasses">
      <slot />
    </div>

    <!-- 表單操作按鈕 -->
    <div v-if="showActions" :class="actionsClasses">
      <slot name="actions">
        <button
          v-if="showCancel"
          type="button"
          :class="cancelButtonClasses"
          @click="handleCancel"
          :disabled="loading"
        >
          {{ cancelText }}
        </button>
        <button
          type="submit"
          :class="submitButtonClasses"
          :disabled="loading || !isValid"
        >
          <svg
            v-if="loading"
            class="-ml-1 mr-3 size-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loading ? loadingText : submitText }}
        </button>
      </slot>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, provide, inject } from 'vue'
import { useResponsive } from '@/composables/useResponsive'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

// Props 定義
interface Props {
  // 表單基本屬性
  title?: string
  description?: string
  error?: string
  errors?: string[]
  loading?: boolean
  novalidate?: boolean

  // 驗證相關
  isValid?: boolean

  // 按鈕相關
  showActions?: boolean
  showCancel?: boolean
  submitText?: string
  cancelText?: string
  loadingText?: string

  // 佈局相關
  layout?: 'vertical' | 'horizontal' | 'inline'
  spacing?: 'compact' | 'normal' | 'relaxed'
  maxWidth?: string

  // 響應式相關
  mobileLayout?: 'stack' | 'grid'
  tabletCols?: number
  desktopCols?: number
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => [],
  loading: false,
  novalidate: false,
  isValid: true,
  showActions: true,
  showCancel: true,
  submitText: '提交',
  cancelText: '取消',
  loadingText: '處理中...',
  layout: 'vertical',
  spacing: 'normal',
  maxWidth: '4xl',
  mobileLayout: 'stack',
  tabletCols: 2,
  desktopCols: 3
})

// Emits 定義
const emit = defineEmits<{
  submit: [event: Event]
  cancel: []
}>()

// 響應式狀態
const { isMobile, isTablet, isDesktop, formGridCols, formSpacing } = useResponsive()

// 計算樣式類別
const formClasses = computed(() => {
  const baseClasses = [
    'responsive-form',
    'space-y-6'
  ]

  // 最大寬度
  if (props.maxWidth) {
    baseClasses.push(`max-w-${props.maxWidth}`, 'mx-auto')
  }

  return baseClasses.join(' ')
})

const titleClasses = computed(() => {
  const classes = ['form-title', 'font-bold', 'leading-7']

  // 使用CSS變數而非固定顏色
  classes.push('text-[var(--color-text-primary)]')

  if (isMobile.value) {
    classes.push('text-xl', 'sm:text-2xl')
  } else if (isTablet.value) {
    classes.push('text-2xl')
  } else {
    classes.push('text-2xl', 'sm:text-3xl', 'sm:tracking-tight')
  }

  return classes.join(' ')
})

const descriptionClasses = computed(() => {
  return [
    'form-description',
    'mt-1',
    'text-sm',
    'text-[var(--color-text-tertiary)]'
  ].join(' ')
})

const errorContainerClasses = computed(() => {
  return [
    'form-errors',
    'bg-[var(--color-error-50)]',
    'border',
    'border-[var(--color-border-error)]',
    'rounded-md',
    'p-4'
  ].join(' ')
})

const contentClasses = computed(() => {
  const classes = ['form-content']

  // 根據佈局模式設置樣式
  if (props.layout === 'horizontal' && !isMobile.value) {
    classes.push('space-y-0')
  } else {
    // 間距設置
    switch (props.spacing) {
      case 'compact':
        classes.push('space-y-4')
        break
      case 'relaxed':
        classes.push('space-y-8')
        break
      default:
        classes.push('space-y-6')
    }
  }

  return classes.join(' ')
})

const actionsClasses = computed(() => {
  const classes = ['form-actions', 'flex']

  if (isMobile.value) {
    // 行動版按鈕垂直排列或水平排列
    if (props.mobileLayout === 'stack') {
      classes.push('flex-col', 'space-y-3')
    } else {
      classes.push('justify-end', 'space-x-3')
    }
  } else {
    classes.push('justify-end', 'space-x-3')
  }

  return classes.join(' ')
})

const cancelButtonClasses = computed(() => {
  const classes = ['btn', 'btn-secondary']

  if (isMobile.value && props.mobileLayout === 'stack') {
    classes.push('w-full', 'order-2')
  }

  return classes.join(' ')
})

const submitButtonClasses = computed(() => {
  const classes = ['btn', 'btn-primary']

  if (isMobile.value && props.mobileLayout === 'stack') {
    classes.push('w-full', 'order-1')
  }

  return classes.join(' ')
})

// 事件處理
const handleSubmit = (event: Event) => {
  event.preventDefault()
  if (!props.loading && props.isValid) {
    emit('submit', event)
  }
}

const handleCancel = () => {
  emit('cancel')
}

// 提供表單上下文給子組件
const formContext = {
  layout: computed(() => props.layout),
  spacing: computed(() => props.spacing),
  isMobile,
  isTablet,
  isDesktop,
  loading: computed(() => props.loading),
  gridCols: computed(() => {
    if (isMobile.value) return 1
    if (isTablet.value) return props.tabletCols
    return props.desktopCols
  })
}

provide('formContext', formContext)
</script>

<style scoped>
.responsive-form {
  @apply w-full;
}

.form-header {
  @apply mb-6;
}

.form-title {
  @apply truncate;
}

.form-content {
  @apply w-full;
}

.form-actions {
  @apply pt-6 border-t;
  border-color: var(--color-border-primary);
}

/* 載入動畫 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 響應式調整 */
@media (max-width: 640px) {
  .form-actions.flex-col .btn {
    @apply text-base py-3;
  }
}

/* 觸控優化 */
@media (hover: none) and (pointer: coarse) {
  .btn {
    @apply min-h-[44px] min-w-[44px];
  }
}
</style>
