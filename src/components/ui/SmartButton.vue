<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    :aria-label="ariaLabel || text"
    :aria-describedby="ariaDescribedBy"
    :type="type"
    @click="handleClick"
    v-bind="$attrs"
  >
    <!-- 載入狀態 -->
    <LoadingSpinner
      v-if="loading"
      :size="iconSize"
      :color="spinnerColor"
      class="mr-2"
    />

    <!-- 左側圖標 -->
    <component
      v-else-if="icon && iconPosition === 'left'"
      :is="icon"
      :class="iconClasses"
    />

    <!-- 文字內容 -->
    <span v-if="$slots.default || text" :class="textClasses">
      <slot>{{ text }}</slot>
    </span>

    <!-- 右側圖標 -->
    <component
      v-if="icon && iconPosition === 'right' && !loading"
      :is="icon"
      :class="iconClasses"
    />

    <!-- 徽章 -->
    <span v-if="badge && !loading" :class="badgeClasses">
      {{ badge }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useResponsive } from '@/composables/useResponsive'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

// Props 定義
interface Props {
  // 基本屬性
  text?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean

  // 變體和尺寸
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'warning' | 'ghost' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'

  // 圖標相關
  icon?: Component
  iconPosition?: 'left' | 'right'
  iconOnly?: boolean

  // 徽章
  badge?: string | number

  // 佈局相關
  fullWidth?: boolean
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'

  // 可訪問性
  ariaLabel?: string
  ariaDescribedBy?: string

  // 響應式
  responsiveSize?: {
    mobile?: Props['size']
    tablet?: Props['size']
    desktop?: Props['size']
  }
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  iconPosition: 'left',
  iconOnly: false,
  fullWidth: false,
  rounded: 'md',
  disabled: false,
  loading: false
})

// Emits 定義
const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// 響應式狀態
const { isMobile, isTablet, isDesktop } = useResponsive()

// 計算當前尺寸
const currentSize = computed(() => {
  if (props.responsiveSize) {
    if (isMobile.value && props.responsiveSize.mobile) {
      return props.responsiveSize.mobile
    }
    if (isTablet.value && props.responsiveSize.tablet) {
      return props.responsiveSize.tablet
    }
    if (isDesktop.value && props.responsiveSize.desktop) {
      return props.responsiveSize.desktop
    }
  }
  return props.size
})

// 計算圖標尺寸
const iconSize = computed(() => {
  const sizeMap = {
    xs: 'sm',
    sm: 'sm',
    md: 'md',
    lg: 'md',
    xl: 'lg'
  } as const
  return sizeMap[currentSize.value]
})

// 計算載入動畫顏色
const spinnerColor = computed(() => {
  switch (props.variant) {
    case 'primary':
    case 'danger':
    case 'success':
    case 'warning':
      return 'white'
    case 'secondary':
    case 'tertiary':
    case 'outline':
    case 'ghost':
    default:
      return 'blue'
  }
})

// 計算按鈕樣式類別
const buttonClasses = computed(() => {
  const classes = [
    // 基礎樣式
    'smart-button',
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'transition-all',
    'duration-200',
    'ease-in-out',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'active:scale-95',

    // 觸控優化
    'touch-manipulation',
    'select-none'
  ]

  // 尺寸樣式
  const sizeClasses = {
    xs: [
      'px-2.5', 'py-1.5', 'text-xs',
      'min-h-[32px]', // 觸控友好最小高度
      props.iconOnly ? 'w-8 h-8' : ''
    ],
    sm: [
      'px-3', 'py-2', 'text-sm',
      'min-h-[36px]',
      props.iconOnly ? 'w-9 h-9' : ''
    ],
    md: [
      'px-4', 'py-2.5', 'text-sm',
      'min-h-[40px]',
      props.iconOnly ? 'w-10 h-10' : ''
    ],
    lg: [
      'px-6', 'py-3', 'text-base',
      'min-h-[44px]', // 符合觸控標準
      props.iconOnly ? 'w-12 h-12' : ''
    ],
    xl: [
      'px-8', 'py-4', 'text-lg',
      'min-h-[48px]',
      props.iconOnly ? 'w-14 h-14' : ''
    ]
  }
  classes.push(...sizeClasses[currentSize.value])

  // 變體樣式
  const variantClasses = {
    primary: [
      'bg-[var(--color-primary-500)]',
      'text-white',
      'border-transparent',
      'hover:bg-[var(--color-primary-600)]',
      'focus:ring-[var(--color-primary-500)]',
      'disabled:bg-[var(--color-neutral-300)]',
      'disabled:text-[var(--color-neutral-500)]'
    ],
    secondary: [
      'bg-[var(--color-neutral-100)]',
      'text-[var(--color-text-primary)]',
      'border-[var(--color-border-primary)]',
      'hover:bg-[var(--color-neutral-200)]',
      'focus:ring-[var(--color-neutral-500)]',
      'disabled:bg-[var(--color-neutral-50)]',
      'disabled:text-[var(--color-neutral-400)]'
    ],
    tertiary: [
      'bg-transparent',
      'text-[var(--color-text-secondary)]',
      'border-transparent',
      'hover:bg-[var(--color-neutral-100)]',
      'focus:ring-[var(--color-neutral-500)]',
      'disabled:text-[var(--color-neutral-400)]'
    ],
    danger: [
      'bg-[var(--color-error-500)]',
      'text-white',
      'border-transparent',
      'hover:bg-[var(--color-error-600)]',
      'focus:ring-[var(--color-error-500)]',
      'disabled:bg-[var(--color-neutral-300)]',
      'disabled:text-[var(--color-neutral-500)]'
    ],
    success: [
      'bg-[var(--color-success-500)]',
      'text-white',
      'border-transparent',
      'hover:bg-[var(--color-success-600)]',
      'focus:ring-[var(--color-success-500)]',
      'disabled:bg-[var(--color-neutral-300)]',
      'disabled:text-[var(--color-neutral-500)]'
    ],
    warning: [
      'bg-[var(--color-warning-500)]',
      'text-white',
      'border-transparent',
      'hover:bg-[var(--color-warning-600)]',
      'focus:ring-[var(--color-warning-500)]',
      'disabled:bg-[var(--color-neutral-300)]',
      'disabled:text-[var(--color-neutral-500)]'
    ],
    outline: [
      'bg-transparent',
      'text-[var(--color-primary-600)]',
      'border-2',
      'border-[var(--color-primary-500)]',
      'hover:bg-[var(--color-primary-50)]',
      'focus:ring-[var(--color-primary-500)]',
      'disabled:border-[var(--color-neutral-300)]',
      'disabled:text-[var(--color-neutral-400)]'
    ],
    ghost: [
      'bg-transparent',
      'text-[var(--color-text-primary)]',
      'border-transparent',
      'hover:bg-[var(--color-neutral-100)]',
      'hover:text-[var(--color-text-primary)]',
      'focus:ring-[var(--color-neutral-500)]',
      'disabled:text-[var(--color-neutral-400)]'
    ]
  }
  classes.push(...variantClasses[props.variant])

  // 圓角樣式
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  }
  classes.push(roundedClasses[props.rounded])

  // 全寬樣式
  if (props.fullWidth) {
    classes.push('w-full')
  }

  // 禁用狀態
  if (props.disabled || props.loading) {
    classes.push('cursor-not-allowed', 'opacity-60')
  } else {
    classes.push('cursor-pointer')
  }

  return classes.filter(Boolean).join(' ')
})

// 圖標樣式類別
const iconClasses = computed(() => {
  const classes = []

  // 圖標尺寸
  const iconSizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  }
  classes.push(iconSizeClasses[currentSize.value])

  // 圖標間距
  if (!props.iconOnly && props.text) {
    if (props.iconPosition === 'left') {
      classes.push('mr-2')
    } else {
      classes.push('ml-2')
    }
  }

  return classes.join(' ')
})

// 文字樣式類別
const textClasses = computed(() => {
  const classes = ['truncate']

  // 如果是圖標按鈕，隱藏文字但保留給屏幕閱讀器
  if (props.iconOnly) {
    classes.push('sr-only')
  }

  return classes.join(' ')
})

// 徽章樣式類別
const badgeClasses = computed(() => {
  const classes = [
    'inline-flex',
    'items-center',
    'justify-center',
    'px-2',
    'py-1',
    'ml-2',
    'text-xs',
    'font-medium',
    'rounded-full',
    'bg-[var(--color-error-500)]',
    'text-white',
    'min-w-[1.25rem]',
    'h-5'
  ]

  return classes.join(' ')
})

// 事件處理
const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
.smart-button {
  /* 確保按鈕在各種主題下都有適當的對比度 */
  --tw-ring-offset-color: var(--color-bg-primary);
}

/* 觸控設備優化 */
@media (hover: none) and (pointer: coarse) {
  .smart-button {
    /* 確保觸控目標足夠大 */
    min-height: 44px;
    min-width: 44px;
  }

  .smart-button:not(.w-full) {
    /* 觸控設備上增加水平內邊距 */
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/* 高對比度模式支援 */
@media (prefers-contrast: high) {
  .smart-button {
    border-width: 2px;
  }

  .smart-button:focus {
    outline: 3px solid;
    outline-offset: 2px;
  }
}

/* 減少動畫偏好支援 */
@media (prefers-reduced-motion: reduce) {
  .smart-button {
    transition: none;
  }

  .smart-button:active {
    transform: none;
  }
}

/* 深色模式優化 */
@media (prefers-color-scheme: dark) {
  .smart-button {
    /* 深色模式下的額外樣式調整 */
  }
}
</style>
