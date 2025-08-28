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
          <span v-if="required" class="ml-1 text-[var(--color-error-500)]" aria-label="必填">*</span>
        </label>
      </slot>
    </div>

    <!-- 輸入區域 -->
    <div :class="inputContainerClasses">
      <!-- 輸入框包裝器 -->
      <div :class="inputWrapperClasses">
        <!-- 前綴圖標 -->
        <div v-if="prefixIcon" :class="prefixIconClasses">
          <component :is="prefixIcon" class="size-5" />
        </div>

        <!-- 輸入元素 -->
        <slot
          :field-id="fieldId"
          :value="fieldValue"
          :error="fieldError"
          :touched="fieldTouched"
          :disabled="disabled"
          :readonly="readonly"
          :input-classes="inputClasses"
          :on-input="handleInput"
          :on-blur="handleBlur"
          :on-focus="handleFocus"
        >
          <!-- 默認輸入框 -->
          <input
            :id="fieldId"
            :name="name"
            :type="type"
            :value="fieldValue"
            :placeholder="placeholder"
            :disabled="disabled || loading"
            :readonly="readonly"
            :required="required"
            :class="inputClasses"
            :aria-describedby="ariaDescribedBy"
            :aria-invalid="hasError"
            @input="handleInput"
            @blur="handleBlur"
            @focus="handleFocus"
          />
        </slot>

        <!-- 後綴圖標 -->
        <div v-if="suffixIcon || hasError || loading" :class="suffixIconClasses">
          <!-- 載入指示器 -->
          <LoadingSpinner v-if="loading" size="sm" />
          <!-- 錯誤圖標 -->
          <ExclamationCircleIcon
            v-else-if="hasError"
            class="size-5 text-[var(--color-error-500)]"
            :aria-hidden="true"
          />
          <!-- 自定義後綴圖標 -->
          <component
            v-else-if="suffixIcon"
            :is="suffixIcon"
            class="size-5 text-[var(--color-text-tertiary)]"
          />
        </div>
      </div>

      <!-- 說明文字 -->
      <p
        v-if="help"
        :id="`${fieldId}-help`"
        :class="helpClasses"
      >
        {{ help }}
      </p>

      <!-- 錯誤訊息 -->
      <p
        v-if="hasError"
        :id="`${fieldId}-error`"
        :class="errorClasses"
        role="alert"
        aria-live="polite"
      >
        {{ fieldError }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, type Component } from 'vue'
import { useResponsive } from '@/composables/useResponsive'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import LoadingSpinner from './LoadingSpinner.vue'

interface Props {
  // 基本屬性
  name: string
  label?: string
  help?: string
  placeholder?: string
  type?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  loading?: boolean

  // 圖標
  prefixIcon?: Component
  suffixIcon?: Component

  // 佈局相關
  layout?: 'vertical' | 'horizontal' | 'inline'
  labelWidth?: string
  span?: number

  // 樣式相關
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'outlined'

  // 驗證相關
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
  readonly: false,
  loading: false,
  layout: 'vertical',
  labelWidth: '8rem',
  span: 1,
  size: 'md',
  variant: 'default',
  validateOnChange: true,
  validateOnBlur: true
})

// 響應式狀態
const { isMobile, isTablet, isDesktop } = useResponsive()

// 注入表單上下文
const formContext = inject('smartFormContext', null)

// 生成唯一ID
const fieldId = `${formContext?.formId || 'field'}-${props.name}`

// 計算ARIA描述
const ariaDescribedBy = computed(() => {
  const ids = []
  if (props.help) ids.push(`${fieldId}-help`)
  if (hasError.value) ids.push(`${fieldId}-error`)
  return ids.length > 0 ? ids.join(' ') : undefined
})

// 表單狀態
const fieldValue = computed(() => formContext?.getFieldValue(props.name) || '')
const fieldError = computed(() => formContext?.getFieldError(props.name) || '')
const fieldTouched = computed(() => formContext?.isFieldTouched(props.name) || false)
const hasError = computed(() => Boolean(fieldError.value && fieldTouched.value))
const loading = computed(() => props.loading || formContext?.loading.value || false)

// 計算實際佈局
const actualLayout = computed(() => {
  if (formContext?.isMobile.value) {
    return 'vertical'
  }
  return props.layout || formContext?.layout.value || 'vertical'
})

// 樣式計算
const fieldClasses = computed(() => {
  const classes = ['smart-form-field']

  // 網格跨度
  if (props.span > 1 && !formContext?.isMobile.value) {
    const maxCols = formContext?.gridCols.value || 1
    classes.push(`col-span-${Math.min(props.span, maxCols)}`)
  }

  // 佈局樣式
  if (actualLayout.value === 'horizontal') {
    classes.push('flex', 'items-start', 'space-x-4')
  } else if (actualLayout.value === 'inline') {
    classes.push('flex', 'items-center', 'space-x-3')
  } else {
    classes.push('space-y-2')
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
  const classes = [
    'form-label',
    'block',
    'font-medium',
    'text-[var(--color-text-primary)]',
    'select-none'
  ]

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
  const classes = ['input-container', 'flex-1']

  return classes.join(' ')
})

const inputWrapperClasses = computed(() => {
  const classes = [
    'input-wrapper',
    'relative',
    'flex',
    'items-center'
  ]

  return classes.join(' ')
})

const inputClasses = computed(() => {
  const classes = [
    'form-input',
    'block',
    'w-full',
    'border',
    'rounded-md',
    'transition-colors',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-1',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed'
  ]

  // 尺寸樣式
  switch (props.size) {
    case 'sm':
      classes.push('px-3', 'py-1.5', 'text-sm')
      break
    case 'lg':
      classes.push('px-4', 'py-3', 'text-base')
      break
    default:
      classes.push('px-3', 'py-2', 'text-sm')
  }

  // 變體樣式
  switch (props.variant) {
    case 'filled':
      classes.push(
        'bg-[var(--color-neutral-100)]',
        'border-transparent',
        'focus:bg-[var(--color-background-primary)]',
        'focus:border-[var(--color-primary-500)]'
      )
      break
    case 'outlined':
      classes.push(
        'bg-transparent',
        'border-2',
        'border-[var(--color-border-primary)]',
        'focus:border-[var(--color-primary-500)]'
      )
      break
    default:
      classes.push(
        'bg-[var(--color-background-primary)]',
        'border-[var(--color-border-primary)]',
        'focus:border-[var(--color-primary-500)]'
      )
  }

  // 狀態樣式
  if (hasError.value) {
    classes.push(
      'border-[var(--color-error-500)]',
      'focus:border-[var(--color-error-500)]',
      'focus:ring-[var(--color-error-500)]'
    )
  } else {
    classes.push('focus:ring-[var(--color-primary-500)]')
  }

  // 圖標間距
  if (props.prefixIcon) {
    classes.push('pl-10')
  }
  if (props.suffixIcon || hasError.value || loading.value) {
    classes.push('pr-10')
  }

  return classes.join(' ')
})

const prefixIconClasses = computed(() => {
  return [
    'absolute',
    'left-3',
    'top-1/2',
    'transform',
    '-translate-y-1/2',
    'text-[var(--color-text-tertiary)]',
    'pointer-events-none'
  ].join(' ')
})

const suffixIconClasses = computed(() => {
  return [
    'absolute',
    'right-3',
    'top-1/2',
    'transform',
    '-translate-y-1/2',
    'pointer-events-none'
  ].join(' ')
})

const helpClasses = computed(() => {
  const classes = [
    'form-help',
    'text-[var(--color-text-tertiary)]',
    'leading-tight'
  ]

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
  const classes = [
    'form-error',
    'text-[var(--color-error-600)]',
    'leading-tight',
    'font-medium'
  ]

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

// 事件處理
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value

  formContext?.setFieldValue(props.name, value)

  if (props.validateOnChange) {
    formContext?.validate(props.name)
  }
}

const handleBlur = () => {
  formContext?.touchField(props.name)

  if (props.validateOnBlur) {
    formContext?.validate(props.name)
  }
}

const handleFocus = () => {
  // 可以在這裡添加焦點處理邏輯
}
</script>

<style scoped>
.smart-form-field {
  @apply w-full;
}

.form-input {
  /* 確保輸入框在各種主題下都有適當的對比度 */
  --tw-ring-offset-color: var(--color-background-primary);
}

/* 響應式調整 */
@media (max-width: 640px) {
  .smart-form-field.flex {
    @apply flex-col space-x-0 space-y-2;
  }

  .label-container {
    @apply w-full;
  }
}

/* 觸控設備優化 */
@media (hover: none) and (pointer: coarse) {
  .form-input {
    /* 確保觸控目標足夠大 */
    min-height: 44px;
  }
}

/* 高對比度模式支援 */
@media (prefers-contrast: high) {
  .form-input {
    border-width: 2px;
  }

  .form-input:focus {
    outline: 3px solid;
    outline-offset: 2px;
  }
}

/* 減少動畫偏好支援 */
@media (prefers-reduced-motion: reduce) {
  .form-input {
    transition: none;
  }
}
</style>
