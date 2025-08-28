<template>
  <form
    :class="formClasses"
    @submit="handleSubmit"
    :novalidate="novalidate"
    :aria-labelledby="titleId"
    :aria-describedby="descriptionId"
  >
    <!-- 表單標題區域 -->
    <FormHeader
      v-if="title || description || $slots.header"
      :title="title"
      :description="description"
      :title-id="titleId"
      :description-id="descriptionId"
      :progress="showProgress ? progress : undefined"
    >
      <template #header>
        <slot name="header" />
      </template>
    </FormHeader>

    <!-- 錯誤摘要 -->
    <ErrorSummary
      v-if="hasErrors"
      :errors="formErrors"
      :show-field-links="showErrorLinks"
      @error-click="focusField"
    />

    <!-- 表單內容區域 -->
    <div :class="contentClasses">
      <slot
        :form-state="formState"
        :validate="validate"
        :set-field-value="setFieldValue"
        :get-field-value="getFieldValue"
        :get-field-error="getFieldError"
        :is-field-touched="isFieldTouched"
        :touch-field="touchField"
        :reset-field="resetField"
      />
    </div>

    <!-- 表單操作區域 -->
    <FormActions
      v-if="showActions"
      :loading="loading"
      :is-valid="isValid"
      :submit-text="submitText"
      :cancel-text="cancelText"
      :show-cancel="showCancel"
      :show-reset="showReset"
      :reset-text="resetText"
      :mobile-layout="mobileActionsLayout"
      @submit="handleSubmit"
      @cancel="handleCancel"
      @reset="handleReset"
    >
      <template #primary>
        <slot name="primary-action" />
      </template>
      <template #secondary>
        <slot name="secondary-actions" />
      </template>
    </FormActions>

    <!-- 自動保存指示器 -->
    <AutoSaveIndicator
      v-if="autoSave.enabled"
      :status="autoSaveStatus"
      :last-saved="lastSavedAt"
    />
  </form>
</template>

<script setup lang="ts">
import { computed, provide, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useResponsive } from '@/composables/useResponsive'
import { useTheme } from '@/composables/useTheme'
import FormHeader from './form/FormHeader.vue'
import ErrorSummary from './form/ErrorSummary.vue'
import FormActions from './form/FormActions.vue'
import AutoSaveIndicator from './form/AutoSaveIndicator.vue'
import type { SmartFormProps, SmartFormEmits, FormState, FormField, ValidationRule } from './types'

// Props 定義
const props = withDefaults(defineProps<SmartFormProps>(), {
  // 基本屬性
  loading: false,
  novalidate: false,

  // 驗證相關
  validateOnChange: true,
  validateOnBlur: true,
  showErrorSummary: true,
  showErrorLinks: true,

  // 按鈕相關
  showActions: true,
  showCancel: true,
  showReset: false,
  submitText: '提交',
  cancelText: '取消',
  resetText: '重置',

  // 佈局相關
  layout: 'vertical',
  spacing: 'normal',
  maxWidth: '4xl',

  // 響應式相關
  mobileLayout: 'stack',
  mobileActionsLayout: 'stack',
  tabletCols: 2,
  desktopCols: 3,

  // 進度相關
  showProgress: false,
  totalSteps: 1,
  currentStep: 1,

  // 自動保存
  autoSave: () => ({
    enabled: false,
    interval: 30000,
    onlyOnChange: true
  }),

  // 初始值
  initialValues: () => ({}),

  // 驗證規則
  validationRules: () => ({})
})

// Emits 定義
const emit = defineEmits<SmartFormEmits>()

// 響應式狀態
const { isMobile, isTablet, isDesktop } = useResponsive()
const { isDarkTheme } = useTheme()

// 表單狀態
const formState = ref<FormState>({
  values: { ...props.initialValues },
  errors: {},
  touched: {},
  isValid: true,
  isSubmitting: false,
  isDirty: false
})

// 自動保存狀態
const autoSaveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const lastSavedAt = ref<Date | null>(null)
const autoSaveTimer = ref<NodeJS.Timeout | null>(null)

// 生成唯一ID
const formId = `smart-form-${Math.random().toString(36).substr(2, 9)}`
const titleId = `${formId}-title`
const descriptionId = `${formId}-description`

// 計算屬性
const loading = computed(() => props.loading || formState.value.isSubmitting)
const isValid = computed(() => formState.value.isValid && Object.keys(formState.value.errors).length === 0)
const hasErrors = computed(() => Object.keys(formState.value.errors).length > 0 && props.showErrorSummary)
const formErrors = computed(() => Object.entries(formState.value.errors).map(([field, error]) => ({ field, error })))
const progress = computed(() => Math.round((props.currentStep / props.totalSteps) * 100))

// 樣式計算
const formClasses = computed(() => {
  const classes = [
    'smart-form',
    'w-full',
    'space-y-6'
  ]

  // 最大寬度
  if (props.maxWidth) {
    classes.push(`max-w-${props.maxWidth}`, 'mx-auto')
  }

  // 主題類別
  if (isDarkTheme.value) {
    classes.push('dark')
  }

  // 載入狀態
  if (loading.value) {
    classes.push('form-loading')
  }

  return classes.join(' ')
})

const contentClasses = computed(() => {
  const classes = ['form-content']

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

  // 網格佈局
  if (props.layout === 'grid' && !isMobile.value) {
    const cols = isTablet.value ? props.tabletCols : props.desktopCols
    classes.push('grid', `grid-cols-${cols}`, 'gap-6')
  }

  return classes.join(' ')
})

// 表單方法
const validate = async (fieldName?: string): Promise<boolean> => {
  if (fieldName) {
    return await validateField(fieldName)
  } else {
    return await validateForm()
  }
}

const validateField = async (fieldName: string): Promise<boolean> => {
  const value = formState.value.values[fieldName]
  const rules = props.validationRules[fieldName]

  if (!rules) {
    // 清除錯誤
    delete formState.value.errors[fieldName]
    return true
  }

  try {
    for (const rule of rules) {
      const result = await executeValidationRule(rule, value, formState.value.values)
      if (result !== true) {
        formState.value.errors[fieldName] = result
        updateFormValidity()
        return false
      }
    }

    // 驗證通過，清除錯誤
    delete formState.value.errors[fieldName]
    updateFormValidity()
    return true
  } catch (error) {
    formState.value.errors[fieldName] = '驗證過程中發生錯誤'
    updateFormValidity()
    return false
  }
}

const validateForm = async (): Promise<boolean> => {
  const fieldNames = Object.keys(props.validationRules)
  const results = await Promise.all(fieldNames.map(validateField))
  return results.every(result => result)
}

const executeValidationRule = async (
  rule: ValidationRule,
  value: any,
  allValues: Record<string, any>
): Promise<string | true> => {
  if (typeof rule === 'function') {
    return await rule(value, allValues)
  }

  if (rule.required && (value === undefined || value === null || value === '')) {
    return rule.message || '此欄位為必填'
  }

  if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
    return rule.message || `最少需要 ${rule.minLength} 個字符`
  }

  if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
    return rule.message || `最多只能 ${rule.maxLength} 個字符`
  }

  if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
    return rule.message || '格式不正確'
  }

  if (rule.min && typeof value === 'number' && value < rule.min) {
    return rule.message || `最小值為 ${rule.min}`
  }

  if (rule.max && typeof value === 'number' && value > rule.max) {
    return rule.message || `最大值為 ${rule.max}`
  }

  if (rule.custom) {
    return await rule.custom(value, allValues)
  }

  return true
}

const updateFormValidity = () => {
  formState.value.isValid = Object.keys(formState.value.errors).length === 0
}

// 欄位操作方法
const setFieldValue = (fieldName: string, value: any) => {
  formState.value.values[fieldName] = value
  formState.value.isDirty = true

  if (props.validateOnChange) {
    nextTick(() => validateField(fieldName))
  }

  emit('field-change', fieldName, value)

  // 觸發自動保存
  if (props.autoSave.enabled && props.autoSave.onlyOnChange) {
    scheduleAutoSave()
  }
}

const getFieldValue = (fieldName: string) => {
  return formState.value.values[fieldName]
}

const getFieldError = (fieldName: string) => {
  return formState.value.errors[fieldName]
}

const isFieldTouched = (fieldName: string) => {
  return formState.value.touched[fieldName] || false
}

const touchField = (fieldName: string) => {
  formState.value.touched[fieldName] = true

  if (props.validateOnBlur) {
    validateField(fieldName)
  }
}

const resetField = (fieldName: string) => {
  formState.value.values[fieldName] = props.initialValues[fieldName]
  delete formState.value.errors[fieldName]
  delete formState.value.touched[fieldName]
  updateFormValidity()
}

const focusField = (fieldName: string) => {
  const element = document.querySelector(`[name="${fieldName}"]`) as HTMLElement
  if (element) {
    element.focus()
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// 表單操作
const handleSubmit = async (event: Event) => {
  event.preventDefault()

  if (loading.value) return

  formState.value.isSubmitting = true

  try {
    // 標記所有欄位為已觸碰
    Object.keys(props.validationRules).forEach(fieldName => {
      formState.value.touched[fieldName] = true
    })

    // 驗證表單
    const isFormValid = await validateForm()

    if (isFormValid) {
      emit('submit', { ...formState.value.values })
    } else {
      emit('validation-error', formState.value.errors)
    }
  } catch (error) {
    emit('error', error)
  } finally {
    formState.value.isSubmitting = false
  }
}

const handleCancel = () => {
  emit('cancel')
}

const handleReset = () => {
  formState.value.values = { ...props.initialValues }
  formState.value.errors = {}
  formState.value.touched = {}
  formState.value.isDirty = false
  updateFormValidity()
  emit('reset')
}

// 自動保存功能
const scheduleAutoSave = () => {
  if (!props.autoSave.enabled) return

  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
  }

  autoSaveTimer.value = setTimeout(() => {
    performAutoSave()
  }, props.autoSave.interval)
}

const performAutoSave = async () => {
  if (!formState.value.isDirty) return

  autoSaveStatus.value = 'saving'

  try {
    await emit('auto-save', { ...formState.value.values })
    autoSaveStatus.value = 'saved'
    lastSavedAt.value = new Date()

    // 3秒後重置狀態
    setTimeout(() => {
      if (autoSaveStatus.value === 'saved') {
        autoSaveStatus.value = 'idle'
      }
    }, 3000)
  } catch (error) {
    autoSaveStatus.value = 'error'
    console.error('Auto-save failed:', error)
  }
}

// 提供表單上下文給子組件
const formContext = {
  formId,
  layout: computed(() => props.layout),
  spacing: computed(() => props.spacing),
  isMobile,
  isTablet,
  isDesktop,
  loading: computed(() => loading.value),
  gridCols: computed(() => {
    if (isMobile.value) return 1
    if (isTablet.value) return props.tabletCols
    return props.desktopCols
  }),
  // 表單狀態和方法
  formState: computed(() => formState.value),
  setFieldValue,
  getFieldValue,
  getFieldError,
  isFieldTouched,
  touchField,
  validate: validateField
}

provide('smartFormContext', formContext)

// 生命週期
onMounted(() => {
  // 初始驗證
  if (props.validateOnMount) {
    nextTick(() => validateForm())
  }

  // 設置自動保存
  if (props.autoSave.enabled && !props.autoSave.onlyOnChange) {
    autoSaveTimer.value = setInterval(performAutoSave, props.autoSave.interval)
  }
})

onUnmounted(() => {
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
    clearInterval(autoSaveTimer.value)
  }
})

// 監聽初始值變化
watch(() => props.initialValues, (newValues) => {
  if (!formState.value.isDirty) {
    formState.value.values = { ...newValues }
  }
}, { deep: true })

// 監聽驗證規則變化
watch(() => props.validationRules, () => {
  if (formState.value.isDirty) {
    nextTick(() => validateForm())
  }
}, { deep: true })
</script>

<style scoped>
.smart-form {
  @apply relative;
}

.form-loading {
  @apply pointer-events-none opacity-75;
}

.form-content {
  @apply w-full;
}

/* 響應式調整 */
@media (max-width: 640px) {
  .form-content.grid {
    @apply grid-cols-1;
  }
}

/* 觸控優化 */
@media (hover: none) and (pointer: coarse) {
  .smart-form {
    /* 確保表單元素在觸控設備上有足夠的間距 */
    --form-touch-spacing: 1rem;
  }
}

/* 高對比度模式支援 */
@media (prefers-contrast: high) {
  .smart-form {
    --form-border-width: 2px;
  }
}

/* 減少動畫偏好支援 */
@media (prefers-reduced-motion: reduce) {
  .smart-form * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
