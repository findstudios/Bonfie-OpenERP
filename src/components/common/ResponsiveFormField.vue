<template>
  <div :class="fieldClasses">
    <!-- 標籤區域 -->
    <div v-if="label || $slots.label" :class="labelContainerClasses">
      <slot name="label">
        <label
          v-if="label"
          :for="fieldId"
          :class="labelClasses"
        >
          {{ label }}
          <span v-if="required" class="ml-1 text-red-500">*</span>
        </label>
      </slot>
    </div>

    <!-- 輸入區域 -->
    <div :class="inputContainerClasses">
      <slot />

      <!-- 說明文字 -->
      <p v-if="help" :class="helpClasses">
        {{ help }}
      </p>

      <!-- 錯誤訊息 -->
      <p v-if="error" :class="errorClasses">
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useResponsive } from '@/composables/useResponsive'

// Props 定義
interface Props {
  label?: string
  help?: string
  error?: string
  required?: boolean
  fieldId?: string

  // 佈局相關
  layout?: 'vertical' | 'horizontal' | 'inline'
  labelWidth?: string
  span?: number // 在網格中佔用的欄數

  // 樣式相關
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'compact' | 'spacious'
}

const props = withDefaults(defineProps<Props>(), {
  fieldId: () => `field-${Math.random().toString(36).substr(2, 9)}`,
  layout: 'vertical',
  labelWidth: '8rem',
  span: 1,
  size: 'md',
  variant: 'default'
})

// 響應式狀態
const { isMobile, isTablet, isDesktop } = useResponsive()

// 注入表單上下文
const formContext = inject('formContext', {
  layout: computed(() => 'vertical'),
  spacing: computed(() => 'normal'),
  isMobile,
  isTablet,
  isDesktop,
  loading: computed(() => false),
  gridCols: computed(() => 1)
})

// 計算實際佈局
const actualLayout = computed(() => {
  // 行動版強制使用垂直佈局
  if (formContext.isMobile.value) {
    return 'vertical'
  }

  // 使用 props 或表單上下文的佈局
  return props.layout || formContext.layout.value
})

// 計算樣式類別
const fieldClasses = computed(() => {
  const classes = ['responsive-form-field']

  // 網格跨度
  if (props.span > 1 && !formContext.isMobile.value) {
    classes.push(`col-span-${Math.min(props.span, formContext.gridCols.value)}`)
  }

  // 佈局樣式
  if (actualLayout.value === 'horizontal') {
    classes.push('flex', 'items-start')
  } else if (actualLayout.value === 'inline') {
    classes.push('flex', 'items-center', 'space-x-3')
  } else {
    classes.push('space-y-1')
  }

  // 變體樣式
  switch (props.variant) {
    case 'compact':
      classes.push('space-y-1')
      break
    case 'spacious':
      classes.push('space-y-3')
      break
    default:
      if (actualLayout.value === 'vertical') {
        classes.push('space-y-2')
      }
  }

  return classes.join(' ')
})

const labelContainerClasses = computed(() => {
  const classes = ['label-container']

  if (actualLayout.value === 'horizontal') {
    classes.push('flex-shrink-0')
    if (props.labelWidth) {
      classes.push(`w-[${props.labelWidth}]`)
    }
  }

  return classes.join(' ')
})

const labelClasses = computed(() => {
  const classes = ['form-label', 'block', 'font-medium', 'text-gray-700']

  // 尺寸樣式
  switch (props.size) {
    case 'sm':
      classes.push('text-xs')
      break
    case 'lg':
      classes.push('text-base')
      break
    default:
      classes.push('text-sm')
  }

  // 佈局特定樣式
  if (actualLayout.value === 'horizontal') {
    classes.push('pt-2')
  } else if (actualLayout.value === 'inline') {
    classes.push('mb-0')
  } else {
    classes.push('mb-1')
  }

  return classes.join(' ')
})

const inputContainerClasses = computed(() => {
  const classes = ['input-container']

  if (actualLayout.value === 'horizontal') {
    classes.push('flex-1', 'ml-4')
  }

  return classes.join(' ')
})

const helpClasses = computed(() => {
  const classes = ['form-help', 'text-gray-500']

  switch (props.size) {
    case 'sm':
      classes.push('text-xs', 'mt-1')
      break
    case 'lg':
      classes.push('text-sm', 'mt-2')
      break
    default:
      classes.push('text-xs', 'mt-1')
  }

  return classes.join(' ')
})

const errorClasses = computed(() => {
  const classes = ['form-error', 'text-red-600']

  switch (props.size) {
    case 'sm':
      classes.push('text-xs', 'mt-1')
      break
    case 'lg':
      classes.push('text-sm', 'mt-2')
      break
    default:
      classes.push('text-xs', 'mt-1')
  }

  return classes.join(' ')
})
</script>

<style scoped>
.responsive-form-field {
  @apply w-full;
}

.form-label {
  @apply select-none;
}

.form-help {
  @apply leading-tight;
}

.form-error {
  @apply leading-tight font-medium;
}

/* 響應式調整 */
@media (max-width: 640px) {
  .responsive-form-field.flex {
    @apply flex-col space-x-0 space-y-2;
  }

  .label-container {
    @apply w-full;
  }

  .input-container {
    @apply ml-0;
  }
}
</style>
