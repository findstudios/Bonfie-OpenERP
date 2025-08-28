/**
 * UI Components Index
 * UI組件統一導出文件
 */

// 基礎組件
export { default as SmartButton } from './SmartButton.vue'
export { default as LoadingSpinner } from './LoadingSpinner.vue'

// 表單組件
export { default as SmartForm } from './SmartForm.vue'
export { default as SmartFormField } from './SmartFormField.vue'

// 表單子組件
export { default as FormHeader } from './form/FormHeader.vue'
export { default as ProgressIndicator } from './form/ProgressIndicator.vue'
export { default as ErrorSummary } from './form/ErrorSummary.vue'
export { default as FormActions } from './form/FormActions.vue'
export { default as AutoSaveIndicator } from './form/AutoSaveIndicator.vue'

// 數據展示組件
export { default as AdaptiveDataTable } from './AdaptiveDataTable.vue'
export { default as VirtualizedTable } from './VirtualizedTable.vue'
export { default as VirtualizedCardList } from './VirtualizedCardList.vue'
export { default as DefaultCardTemplate } from './DefaultCardTemplate.vue'

// 輸入組件
export { default as SearchInput } from './SearchInput.vue'
export { default as FilterDropdown } from './FilterDropdown.vue'
export { default as ColumnSelector } from './ColumnSelector.vue'

// 導航組件
export { default as SmartPagination } from './SmartPagination.vue'

// 過渡組件
export * from '../transitions'

// 類型導出
export type {
  SmartButtonProps,
  SmartButtonEmits,
  ButtonVariantConfig,
  ButtonSizeConfig,
  TableColumn,
  TableFilter,
  TablePagination,
  AdaptiveDataTableProps,
  AdaptiveDataTableEmits,
  FormField,
  FormState,
  ValidationRule,
  SmartFormProps,
  SmartFormEmits,
  ResponsiveConfig,
  ThemeConfig,
  AnimationConfig,
  MicroAnimationConfig,
  AccessibilityConfig,
  TouchConfig,
  PerformanceConfig,
  ErrorConfig,
  LoadingConfig,
  UIComponentProps,
  UIComponentEmits
} from './types'

// 常量導出
export const BUTTON_VARIANTS = [
  'primary',
  'secondary',
  'tertiary',
  'danger',
  'success',
  'warning',
  'ghost',
  'outline'
] as const

export const BUTTON_SIZES = [
  'xs',
  'sm',
  'md',
  'lg',
  'xl'
] as const

export const BUTTON_ROUNDED_OPTIONS = [
  'none',
  'sm',
  'md',
  'lg',
  'full'
] as const

export const FORM_LAYOUTS = [
  'vertical',
  'horizontal',
  'grid'
] as const

export const FORM_SPACINGS = [
  'compact',
  'normal',
  'relaxed'
] as const

export const FORM_FIELD_SIZES = [
  'sm',
  'md',
  'lg'
] as const

export const FORM_FIELD_VARIANTS = [
  'default',
  'filled',
  'outlined'
] as const

// 工具函數導出
export const buttonUtils = {
  /**
   * 獲取按鈕的最小觸控目標尺寸
   */
  getMinTouchTarget: (size: typeof BUTTON_SIZES[number]): number => {
    const sizeMap = {
      xs: 32,
      sm: 36,
      md: 40,
      lg: 44,
      xl: 48
    }
    return sizeMap[size]
  },

  /**
   * 檢查按鈕尺寸是否符合觸控標準
   */
  isTouchFriendly: (size: typeof BUTTON_SIZES[number]): boolean => {
    return buttonUtils.getMinTouchTarget(size) >= 44
  },

  /**
   * 獲取按鈕變體的語義化描述
   */
  getVariantDescription: (variant: typeof BUTTON_VARIANTS[number]): string => {
    const descriptions = {
      primary: '主要操作按鈕，用於最重要的操作',
      secondary: '次要操作按鈕，用於輔助操作',
      tertiary: '第三級操作按鈕，用於不太重要的操作',
      danger: '危險操作按鈕，用於刪除等危險操作',
      success: '成功操作按鈕，用於確認等正面操作',
      warning: '警告操作按鈕，用於需要注意的操作',
      ghost: '幽靈按鈕，用於不需要強調的操作',
      outline: '輪廓按鈕，用於需要邊框但不需要填充的操作'
    }
    return descriptions[variant]
  },

  /**
   * 生成按鈕的可訪問性屬性
   */
  generateA11yProps: (props: {
    text?: string
    ariaLabel?: string
    disabled?: boolean
    loading?: boolean
    type?: 'button' | 'submit' | 'reset'
  }) => {
    const a11yProps: Record<string, any> = {}

    // 設置 aria-label
    if (props.ariaLabel) {
      a11yProps['aria-label'] = props.ariaLabel
    } else if (props.text) {
      a11yProps['aria-label'] = props.text
    }

    // 設置 aria-disabled
    if (props.disabled) {
      a11yProps['aria-disabled'] = 'true'
    }

    // 設置 aria-busy
    if (props.loading) {
      a11yProps['aria-busy'] = 'true'
    }

    // 設置 type
    a11yProps.type = props.type || 'button'

    return a11yProps
  }
}

export const formUtils = {
  /**
   * 生成表單欄位的唯一ID
   */
  generateFieldId: (formId: string, fieldName: string): string => {
    return `${formId}-${fieldName}`
  },

  /**
   * 驗證電子郵件格式
   */
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  /**
   * 驗證密碼強度
   */
  validatePasswordStrength: (password: string): {
    isValid: boolean
    score: number
    feedback: string[]
  } => {
    const feedback: string[] = []
    let score = 0

    if (password.length >= 8) {
      score += 1
    } else {
      feedback.push('密碼至少需要8個字符')
    }

    if (/[a-z]/.test(password)) {
      score += 1
    } else {
      feedback.push('密碼需要包含小寫字母')
    }

    if (/[A-Z]/.test(password)) {
      score += 1
    } else {
      feedback.push('密碼需要包含大寫字母')
    }

    if (/\d/.test(password)) {
      score += 1
    } else {
      feedback.push('密碼需要包含數字')
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1
    } else {
      feedback.push('密碼需要包含特殊字符')
    }

    return {
      isValid: score >= 3,
      score,
      feedback
    }
  },

  /**
   * 格式化表單錯誤信息
   */
  formatFormErrors: (errors: Record<string, string>): Array<{ field: string; error: string }> => {
    return Object.entries(errors).map(([field, error]) => ({ field, error }))
  },

  /**
   * 檢查表單是否有變更
   */
  hasFormChanged: (currentValues: Record<string, any>, initialValues: Record<string, any>): boolean => {
    const currentKeys = Object.keys(currentValues)
    const initialKeys = Object.keys(initialValues)

    if (currentKeys.length !== initialKeys.length) {
      return true
    }

    return currentKeys.some(key => currentValues[key] !== initialValues[key])
  }
}

// 預設配置導出
export const DEFAULT_BUTTON_CONFIG = {
  variant: 'primary' as const,
  size: 'md' as const,
  type: 'button' as const,
  iconPosition: 'left' as const,
  rounded: 'md' as const,
  disabled: false,
  loading: false,
  iconOnly: false,
  fullWidth: false
}

export const DEFAULT_FORM_CONFIG = {
  layout: 'vertical' as const,
  spacing: 'normal' as const,
  maxWidth: '4xl' as const,
  validateOnChange: true,
  validateOnBlur: true,
  showErrorSummary: true,
  showActions: true,
  showCancel: true,
  submitText: '提交',
  cancelText: '取消'
}

export const DEFAULT_FORM_FIELD_CONFIG = {
  type: 'text' as const,
  size: 'md' as const,
  variant: 'default' as const,
  layout: 'vertical' as const,
  required: false,
  disabled: false,
  readonly: false,
  validateOnChange: true,
  validateOnBlur: true
}

// 主題相關常量
export const THEME_VARIANTS = [
  'light',
  'dark',
  'highContrast'
] as const

// 響應式斷點
export const RESPONSIVE_BREAKPOINTS = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)'
} as const

// 動畫配置
export const ANIMATION_PRESETS = {
  fast: { duration: 150, easing: 'ease-out' },
  normal: { duration: 200, easing: 'ease-in-out' },
  slow: { duration: 300, easing: 'ease-in' }
} as const

// 觸控配置
export const TOUCH_CONFIG = {
  minTouchTarget: 44, // 最小觸控目標尺寸（像素）
  touchPadding: 8,    // 觸控內邊距
  gestureThreshold: 10 // 手勢識別閾值
} as const

// 表單驗證規則預設
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d-+().\s]+$/,
  url: /^https?:\/\/.+/,
  zipCode: /^\d{3,6}$/,
  creditCard: /^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/
} as const
