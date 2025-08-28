/**
 * UI Components Type Definitions
 * UI組件類型定義
 */

import type { Component } from 'vue'

// SmartButton 相關類型
export interface SmartButtonProps {
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
    mobile?: SmartButtonProps['size']
    tablet?: SmartButtonProps['size']
    desktop?: SmartButtonProps['size']
  }
}

export interface SmartButtonEmits {
  click: [event: MouseEvent]
}

// 按鈕變體配置
export interface ButtonVariantConfig {
  background: string
  text: string
  border: string
  hover: {
    background: string
    text?: string
    border?: string
  }
  focus: {
    ring: string
  }
  disabled: {
    background: string
    text: string
    border?: string
  }
}

// 按鈕尺寸配置
export interface ButtonSizeConfig {
  padding: string
  fontSize: string
  minHeight: string
  iconSize: string
  iconOnlySize?: string
}

// AdaptiveDataTable 相關類型
export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: any) => string
}

export interface TableFilter {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'number'
  options?: Array<{ label: string; value: any }>
}

export interface TablePagination {
  currentPage: number
  pageSize: number
  total: number
  showSizeChanger?: boolean
  pageSizeOptions?: number[]
}

// AdaptiveDataTable Props 類型
export interface AdaptiveDataTableProps {
  // 數據相關
  data: any[]
  columns: TableColumn[]
  rowKey: string
  loading?: boolean

  // 搜尋相關
  searchable?: boolean
  searchPlaceholder?: string
  searchDebounce?: number

  // 篩選相關
  filterable?: boolean
  filters?: TableFilter[]

  // 排序相關
  sortable?: boolean
  defaultSortBy?: string
  defaultSortOrder?: 'asc' | 'desc'

  // 分頁相關
  paginated?: boolean
  pageSize?: number
  pageSizeOptions?: number[]
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  showTotal?: boolean

  // 選擇相關
  selectable?: boolean
  multiSelect?: boolean

  // 欄位控制
  columnSelectable?: boolean

  // 虛擬滾動
  virtualScrolling?: PerformanceConfig['virtualScrolling']
  rowHeight?: number
  cardHeight?: number

  // 移動版配置
  mobileCardTemplate?: any

  // 樣式相關
  stickyHeader?: boolean
  showToolbar?: boolean

  // 文字配置
  emptyText?: string
  loadingText?: string

  // 性能配置
  debounce?: {
    search?: number
    filter?: number
    sort?: number
  }
}

export interface AdaptiveDataTableEmits {
  'row-click': [row: any, index: number]
  'row-select': [selectedRows: any[]]
  'sort-change': [sortBy: string, sortOrder: 'asc' | 'desc']
  'filter-change': [filters: Record<string, any>]
  'search': [query: string]
  'page-change': [page: number, pageSize: number]
}

// SmartForm 相關類型
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio'
  required?: boolean
  placeholder?: string
  options?: Array<{ label: string; value: any }>
  validation?: ValidationRule[]
}

export interface FormState {
  values: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  isValid: boolean
  isSubmitting: boolean
  isDirty: boolean
}

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  message?: string
  custom?: (value: any, allValues: Record<string, any>) => Promise<string | true> | string | true
}

export interface SmartFormProps {
  // 表單基本屬性
  title?: string
  description?: string
  loading?: boolean
  novalidate?: boolean

  // 驗證相關
  validateOnChange?: boolean
  validateOnBlur?: boolean
  validateOnMount?: boolean
  showErrorSummary?: boolean
  showErrorLinks?: boolean

  // 按鈕相關
  showActions?: boolean
  showCancel?: boolean
  showReset?: boolean
  submitText?: string
  cancelText?: string
  resetText?: string

  // 佈局相關
  layout?: 'vertical' | 'horizontal' | 'grid'
  spacing?: 'compact' | 'normal' | 'relaxed'
  maxWidth?: string

  // 響應式相關
  mobileLayout?: 'stack' | 'grid'
  mobileActionsLayout?: 'stack' | 'horizontal'
  tabletCols?: number
  desktopCols?: number

  // 進度相關
  showProgress?: boolean
  totalSteps?: number
  currentStep?: number

  // 自動保存
  autoSave?: {
    enabled: boolean
    interval: number
    onlyOnChange?: boolean
  }

  // 初始值和驗證
  initialValues?: Record<string, any>
  validationRules?: Record<string, ValidationRule[]>
}

export interface SmartFormEmits {
  submit: [values: Record<string, any>]
  cancel: []
  reset: []
  'field-change': [fieldName: string, value: any]
  'validation-error': [errors: Record<string, string>]
  'auto-save': [values: Record<string, any>]
  error: [error: any]
}

// 響應式配置類型
export interface ResponsiveConfig<T> {
  mobile?: T
  tablet?: T
  desktop?: T
}

// 主題相關類型
export interface ThemeConfig {
  name: string
  colors: {
    primary: Record<string, string>
    neutral: Record<string, string>
    semantic: Record<string, Record<string, string>>
  }
  typography: {
    fontFamily: string[]
    fontSize: Record<string, string>
    fontWeight: Record<string, number>
  }
  spacing: Record<string, string>
  borderRadius: Record<string, string>
  shadows: Record<string, string>
}

// 動畫配置類型
export interface AnimationConfig {
  duration: number
  easing: string
  delay?: number
}

export interface MicroAnimationConfig {
  hover?: AnimationConfig & { transform?: string; opacity?: number }
  press?: AnimationConfig & { transform?: string; opacity?: number }
  focus?: AnimationConfig & { transform?: string; opacity?: number }
  loading?: AnimationConfig & {
    keyframes: Record<string, any>
    repeat?: number | 'infinite'
  }
}

// 可訪問性相關類型
export interface AccessibilityConfig {
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaExpanded?: boolean
  ariaHaspopup?: boolean
  role?: string
  tabIndex?: number
}

// 觸控優化類型
export interface TouchConfig {
  minTouchTarget: number // 最小觸控目標尺寸（像素）
  touchPadding: number   // 觸控內邊距
  gestureSupport?: {
    swipe?: boolean
    longPress?: boolean
    doubleTap?: boolean
  }
}

// 性能優化類型
export interface PerformanceConfig {
  virtualScrolling?: {
    enabled: boolean
    itemHeight: number
    bufferSize: number
    threshold: number
  }
  lazyLoading?: {
    enabled: boolean
    threshold: string
    placeholder?: string
  }
  debounce?: {
    search: number
    resize: number
    scroll: number
  }
}

// 錯誤處理類型
export interface ErrorConfig {
  showErrorBoundary: boolean
  retryAttempts: number
  retryDelay: number
  fallbackComponent?: Component
  onError?: (error: Error, errorInfo: any) => void
}

// 載入狀態類型
export interface LoadingConfig {
  showAfter: number      // 多少毫秒後顯示載入指示器
  timeout: number        // 載入超時時間
  skeleton?: {
    enabled: boolean
    variant: 'pulse' | 'wave' | 'shimmer'
  }
  spinner?: {
    size: 'sm' | 'md' | 'lg'
    color: string
  }
}

// 導出所有類型的聯合類型
export type UIComponentProps =
  | SmartButtonProps
  // 後續會添加其他組件的 Props 類型

export type UIComponentEmits =
  | SmartButtonEmits
  // 後續會添加其他組件的 Emits 類型
